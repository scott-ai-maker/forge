import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import {
  extractPhotoPathFromLegacyUrl,
  FITNESS_PHOTO_BUCKET,
  normalizePhotoPath,
} from '@/lib/fitness-photos'
import {
  computeDeletedSubjectHash,
  extractRequestIp,
  isValidLegalSignature,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'
import { toE164 } from '@/lib/phone'
import { supabaseAdmin } from '@/lib/supabase'
import { deleteVitalUser } from '@/lib/vital-health-bridge'
import { COACH_VOICE_NOTES_BUCKET, parseVoiceNoteBody } from '@/lib/voice-notes-storage'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function getAuthzErrorResponse(error: unknown) {
  const status = error instanceof AuthzError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unauthorized'
  return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
}

async function collectBucketFolderPaths(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  bucket: string,
  folderPrefix: string
): Promise<string[]> {
  try {
    const bucketApi = admin?.storage?.from?.(bucket)
    if (!bucketApi || typeof bucketApi.list !== 'function') return []
    const { data } = await bucketApi.list(folderPrefix, { limit: 1000 })
    if (!Array.isArray(data)) return []
    return data
      .map((entry: { name?: string | null }) =>
        typeof entry?.name === 'string' && entry.name.trim()
          ? `${folderPrefix}/${entry.name.trim()}`
          : ''
      )
      .filter(Boolean)
  } catch {
    return []
  }
}

async function removeStoragePathsSafely(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  bucket: string,
  rawPaths: Array<string | null | undefined>
): Promise<number> {
  const uniquePaths = Array.from(
    new Set(
      rawPaths
        .map(p => normalizePhotoPath(p))
        .filter(p => Boolean(p) && !p.startsWith('data:') && !p.startsWith('http'))
    )
  )
  if (uniquePaths.length === 0) return 0

  try {
    const bucketApi = admin?.storage?.from?.(bucket)
    if (!bucketApi || typeof bucketApi.remove !== 'function') return 0
    await bucketApi.remove(uniquePaths)
    return uniquePaths.length
  } catch (err) {
    console.warn(`[account/delete] Failed removing objects from ${bucket}:`, err)
    return 0
  }
}

export async function DELETE(req: NextRequest) {
  let userId = ''
  let authEmail: string | null = null

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
    authEmail = authz.user.email ?? authz.client.email ?? null
  } catch (error) {
    return getAuthzErrorResponse(error)
  }

  const admin = supabaseAdmin()
  let resolvedEmail = authEmail
  let resolvedPhone: string | null = null
  let avatarPath: string | null = null

  // 1. Cancel active Stripe subscriptions AND permanently delete Stripe Customer object
  try {
    const { data: clientRow } = await admin
      .from('clients')
      .select('email, phone, avatar_path, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (!resolvedEmail && clientRow?.email) {
      resolvedEmail = clientRow.email
    }
    if (typeof clientRow?.phone === 'string' && clientRow.phone.trim()) {
      resolvedPhone = clientRow.phone.trim()
    }
    if (typeof clientRow?.avatar_path === 'string' && clientRow.avatar_path.trim()) {
      avatarPath = clientRow.avatar_path.trim()
    }

    let stripeCustomerId = clientRow?.stripe_customer_id ?? null

    if (process.env.STRIPE_SECRET_KEY) {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        if (!stripeCustomerId && resolvedEmail && !resolvedEmail.endsWith('@placeholder.local')) {
          const customers = await stripe.customers.list({ email: resolvedEmail, limit: 5 })
          const matchedCustomer = customers.data.find(
            cust => !cust.metadata?.user_id || cust.metadata.user_id === userId
          )
          if (matchedCustomer) {
            stripeCustomerId = matchedCustomer.id
          }
        }

        if (stripeCustomerId) {
          const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'all',
          })

          for (const sub of subscriptions.data) {
            if (['active', 'trialing', 'past_due'].includes(sub.status)) {
              try {
                await stripe.subscriptions.cancel(sub.id)
              } catch (subCancelErr) {
                console.warn(`Failed cancelling subscription ${sub.id} during account deletion:`, subCancelErr)
              }
            }
          }

          if (typeof stripe.customers.del === 'function') {
            try {
              await stripe.customers.del(stripeCustomerId)
            } catch (custDelErr) {
              console.warn(`Failed deleting Stripe customer ${stripeCustomerId} during account deletion:`, custDelErr)
            }
          }
        }
      }
    }
  } catch (stripeErr) {
    console.warn('Error checking/deleting Stripe billing records during account deletion:', stripeErr)
  }

  // 2. Revoke & delete Vital wearable aggregator user / OAuth tokens (WA MHMDA subprocessor pass-through)
  try {
    await deleteVitalUser(userId)
  } catch (vitalErr) {
    console.warn('Could not delete Vital wearable user during account deletion:', vitalErr)
  }

  // 3. Purge private Storage media (`fitness-photos` & `coach-voice-notes`) BEFORE cascading DB deletes
  //    orphan the object keys (IL BIPA 740 ILCS 14/15(a) & WA MHMDA RCW 19.373.040(1)(c)&(2)).
  try {
    const fitnessPhotoCandidates: Array<string | null | undefined> = [
      avatarPath,
      extractPhotoPathFromLegacyUrl(avatarPath),
    ]

    try {
      const { data: fpRow } = await admin
        .from('fitness_profiles')
        .select('before_photo_path')
        .eq('user_id', userId)
        .maybeSingle()
      if (fpRow?.before_photo_path) {
        fitnessPhotoCandidates.push(
          fpRow.before_photo_path,
          extractPhotoPathFromLegacyUrl(fpRow.before_photo_path)
        )
      }
    } catch {
      // ignore if table unavailable in isolated test
    }

    try {
      const { data: progressRows } = await admin
        .from('progress_photos')
        .select('photo_url')
        .eq('user_id', userId)
      for (const row of (progressRows ?? []) as Array<{ photo_url?: string | null; photo_path?: string | null }>) {
        const candidate = row?.photo_url ?? row?.photo_path
        fitnessPhotoCandidates.push(candidate, extractPhotoPathFromLegacyUrl(candidate))
      }
    } catch {
      // ignore
    }

    try {
      const { data: bodyCompRows } = await admin
        .from('body_composition_analyses')
        .select('photo_data_url')
        .eq('user_id', userId)
      for (const row of bodyCompRows ?? []) {
        fitnessPhotoCandidates.push(
          row?.photo_data_url,
          extractPhotoPathFromLegacyUrl(row?.photo_data_url)
        )
      }
    } catch {
      // ignore
    }

    const listedFitnessPhotos = await collectBucketFolderPaths(admin, FITNESS_PHOTO_BUCKET, userId)
    fitnessPhotoCandidates.push(...listedFitnessPhotos)
    await removeStoragePathsSafely(admin, FITNESS_PHOTO_BUCKET, fitnessPhotoCandidates)

    const voiceNoteCandidates: Array<string | null | undefined> = []
    try {
      const msgTable = admin.from('coach_client_messages') as unknown as {
        select?: (cols: string) => {
          or?: (expr: string) => Promise<{
            data?: Array<{ message_body?: string | null; body?: string | null }> | null
          }>
        }
      }
      const msgRes = await msgTable
        ?.select?.('message_body')
        ?.or?.(`client_id.eq.${userId},sender_id.eq.${userId}`)
      for (const msg of msgRes?.data ?? []) {
        const parsed = parseVoiceNoteBody(msg?.message_body ?? msg?.body)
        if (parsed?.payload && !parsed.payload.startsWith('data:') && !parsed.payload.startsWith('http')) {
          voiceNoteCandidates.push(parsed.payload)
        }
      }
    } catch {
      // ignore
    }

    const listedVoiceNotes = await collectBucketFolderPaths(admin, COACH_VOICE_NOTES_BUCKET, userId)
    voiceNoteCandidates.push(...listedVoiceNotes)
    await removeStoragePathsSafely(admin, COACH_VOICE_NOTES_BUCKET, voiceNoteCandidates)
  } catch (storageErr) {
    console.warn('Error purging Storage buckets during account deletion:', storageErr)
  }

  // 4. Scrub non-FK email/phone-keyed rows (`coaching_applications`, `waitlist`, `marketing_email_queue`,
  //    `referral_attributions`) and record permanent marketing/SMS suppressions so deleted users are never contacted.
  try {
    try {
      const { data: notifPref } = await admin
        .from('notification_preferences')
        .select('sms_phone')
        .eq('user_id', userId)
        .maybeSingle()
      if (!resolvedPhone && typeof notifPref?.sms_phone === 'string' && notifPref.sms_phone.trim()) {
        resolvedPhone = notifPref.sms_phone.trim()
      }
    } catch {
      // ignore
    }

    const normalizedEmail =
      resolvedEmail && !resolvedEmail.endsWith('@placeholder.local')
        ? resolvedEmail.trim().toLowerCase()
        : null

    if (normalizedEmail) {
      try {
        await admin.from('coaching_applications').delete().eq('email', normalizedEmail)
      } catch {
        // ignore
      }
      try {
        await admin.from('waitlist').delete().eq('email', normalizedEmail)
      } catch {
        // ignore
      }
      try {
        await admin.from('marketing_email_queue').delete().eq('email', normalizedEmail)
      } catch {
        // ignore
      }
      try {
        await admin
          .from('referral_attributions')
          .update({
            referee_id: null,
            referee_email: null,
            ip_hash: null,
            user_agent: null,
          })
          .eq('referee_email', normalizedEmail)
      } catch {
        // ignore
      }
    }

    try {
      await admin
        .from('referral_attributions')
        .update({
          referee_id: null,
          referee_email: null,
          ip_hash: null,
          user_agent: null,
        })
        .eq('referee_id', userId)
    } catch {
      // ignore
    }

    const normalizedPhone = toE164(resolvedPhone)
    if (normalizedPhone) {
      try {
        await admin.from('waitlist').delete().eq('phone', normalizedPhone)
      } catch {
        // ignore
      }
      try {
        await admin.from('sms_suppressions').upsert(
          {
            phone: normalizedPhone,
            reason: 'account_deleted',
            suppressed_at: new Date().toISOString(),
          },
          { onConflict: 'phone' }
        )
      } catch {
        // ignore
      }
    }
  } catch (scrubErr) {
    console.warn('Error scrubbing non-FK lead/marketing records during account deletion:', scrubErr)
  }

  // 5. Preserve signed waivers & arbitration proofs in legal_consent_audit_log under
  // statutory litigation-defense retention (GDPR Art. 17(3)(e) / CCPA § 1798.105(d)(5) / M.G.L. c. 260 § 2A)
  // before client_intake_forms cascades and auth.users deletion sets user_id -> NULL.
  const deletedSubjectSha256 = computeDeletedSubjectHash(userId, resolvedEmail)

  try {
    const intakeTable = admin.from('client_intake_forms') as unknown as {
      select?: (cols: string) => {
        eq?: (col: string, val: string) => {
          maybeSingle?: () => Promise<{
            data?: {
              consent_liability_waiver?: boolean | null
              consent_informed_consent?: boolean | null
              consent_coaching_agreement?: boolean | null
              consent_signature_name?: string | null
              consent_signed_at?: string | null
              parq_any_yes?: boolean | null
            } | null
          }>
        }
      }
    }

    const intakeRes = await intakeTable
      ?.select?.(
        'consent_liability_waiver, consent_informed_consent, consent_coaching_agreement, consent_signature_name, consent_signed_at, parq_any_yes'
      )
      ?.eq?.('user_id', userId)
      ?.maybeSingle?.()

    const intake = intakeRes?.data
    if (intake?.consent_liability_waiver && isValidLegalSignature(intake.consent_signature_name)) {
      await recordLegalConsentAudit({
        adminClient: admin,
        userId,
        deletedSubjectSha256,
        documentTypes: ['athletic_liability_waiver', 'terms_of_service'],
        typedSignature: intake.consent_signature_name,
        ipAddress: extractRequestIp(req.headers),
        userAgent: req.headers.get('user-agent'),
        consentedAt: intake.consent_signed_at || new Date().toISOString(),
        metadata: {
          flow: 'account_deletion_defense_preservation',
          consentInformedConsent: Boolean(intake.consent_informed_consent),
          consentCoachingAgreement: Boolean(intake.consent_coaching_agreement),
          parqAnyYes: Boolean(intake.parq_any_yes),
        },
      })
    }
  } catch (intakeSnapErr) {
    console.warn('Could not snapshot intake waiver prior to deletion:', intakeSnapErr)
  }

  try {
    const auditTable = admin.from('legal_consent_audit_log') as unknown as {
      update?: (patch: Record<string, unknown>) => {
        eq?: (col: string, val: string) => Promise<{ error?: unknown }>
      }
    }
    await auditTable
      ?.update?.({ deleted_subject_sha256: deletedSubjectSha256 })
      ?.eq?.('user_id', userId)
  } catch (auditStampErr) {
    console.warn('Could not stamp deleted_subject_sha256 on consent ledger:', auditStampErr)
  }

  // 6. Record lifecycle deactivation audit trail
  try {
    const { transitionClientStatus } = await import('@/lib/client-lifecycle')
    await transitionClientStatus(admin, {
      clientId: userId,
      coachId: userId,
      actorRole: 'client',
      coachName: 'Client (Self Deletion)',
      newStatus: 'inactive',
      reasonCode: 'client_requested_cancellation',
      reasonNotes: 'Client permanently deleted their account.',
    })
  } catch (lifecycleErr) {
    console.warn('Could not record lifecycle transition during account deletion:', lifecycleErr)
  }

  // 7. Anonymize PII in clients prior to deleting auth.users (ON DELETE SET NULL preserves legal_consent_audit_log)
  const { error: profileError } = await admin
    .from('clients')
    .update({
      full_name: '[deleted]',
      email: `deleted_${userId}@placeholder.local`,
      phone: null,
      avatar_path: null,
      stripe_customer_id: null,
    })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500, headers: NO_STORE_HEADERS })
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId)

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json({ deleted: true }, { headers: NO_STORE_HEADERS })
}
