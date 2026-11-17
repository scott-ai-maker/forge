import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  computeDeletedSubjectHash,
  extractRequestIp,
  isValidLegalSignature,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function getAuthzErrorResponse(error: unknown) {
  const status = error instanceof AuthzError ? error.status : 500
  const message = error instanceof Error ? error.message : 'Unauthorized'
  return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
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

  // 1. Cancel active Stripe subscriptions so client is not billed after deletion
  try {
    const { data: clientRow } = await admin
      .from('clients')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle()

    if (clientRow?.email) {
      resolvedEmail = clientRow.email
    }

    let stripeCustomerId = clientRow?.stripe_customer_id ?? null

    if (process.env.STRIPE_SECRET_KEY) {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        if (!stripeCustomerId && clientRow?.email) {
          const customers = await stripe.customers.list({ email: clientRow.email, limit: 1 })
          if (customers.data.length > 0) {
            stripeCustomerId = customers.data[0].id
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
        }
      }
    }
  } catch (stripeErr) {
    console.warn('Error checking/cancelling Stripe subscriptions during account deletion:', stripeErr)
  }

  // 2. Preserve signed waivers & arbitration proofs in legal_consent_audit_log under
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

  // 3. Record lifecycle deactivation audit trail
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

  // 4. Anonymize PII in clients prior to deleting auth.users (ON DELETE SET NULL preserves legal_consent_audit_log)
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
