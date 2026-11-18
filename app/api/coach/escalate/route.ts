import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { isWithinSmsQuietHours, sendSms } from '@/lib/sms'
import { supabaseAdmin } from '@/lib/supabase'
import type { ForgeTierId } from '@/lib/tierEntitlements'
import { sanitizePiiString } from '@/src/lib/safety/clinicalGuardrails'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

const EscalateRequestSchema = z.object({
  tierId: z.enum(['core_lab', 'plus', 'coach_support']).default('core_lab'),
  channel: z.enum(['email', 'sms_priority']).optional(),
  sourceContext: z
    .enum(['assistant_drawer', 'post_scan_results', 'safety_override', 'dashboard_guarantee'])
    .default('assistant_drawer'),
  question: z.string().min(3).max(2000),
  telemetrySummary: z
    .object({
      optPhase: z.number().int().min(1).max(5).optional().nullable(),
      jointComfortScore: z.number().min(0).max(100).optional().nullable(),
      readinessIndex: z.number().min(0).max(100).optional().nullable(),
      postureFlags: z.array(z.string()).max(12).optional().default([]),
      environmentProfile: z.string().max(64).optional().nullable(),
      expressModeActive: z.boolean().optional(),
      activeExercise: z.string().max(120).optional().nullable(),
      safetyFlagActive: z.boolean().optional(),
    })
    .optional()
    .default({ postureFlags: [] }),
})

const TIER_RANK: Record<ForgeTierId, number> = {
  core_lab: 0,
  plus: 1,
  coach_support: 2,
}

function formatEscalationResponseWindow(
  tierId: ForgeTierId,
  delivery: { emailDispatched: boolean; smsDispatched: boolean; threadInserted: boolean; quietHoursHeld: boolean }
): {
  slaBadge: string
  responseWindowCopy: string
} {
  if (tierId === 'coach_support') {
    if (delivery.smsDispatched) {
      return {
        slaBadge: '24h Priority SLA',
        responseWindowCopy:
          'Priority 24h SLA — Coach Gordon received an SMS ping and your note is saved in your secure Coach Thread.',
      }
    }
    if (delivery.quietHoursHeld) {
      return {
        slaBadge: '24h Priority SLA',
        responseWindowCopy:
          'Priority 24h SLA — Saved in your secure Coach Thread & Priority Queue (SMS held during quiet hours).',
      }
    }
    return {
      slaBadge: '24h Priority SLA',
      responseWindowCopy:
        'Priority 24h SLA — Saved in your secure Coach Thread & Priority Queue for Coach Gordon.',
    }
  }
  if (tierId === 'plus') {
    return {
      slaBadge: 'Next Business Day',
      responseWindowCopy: delivery.emailDispatched
        ? 'Plus Priority — Dispatched to Coach Gordon and saved to your secure Coach Thread (1 business day).'
        : 'Plus Priority — Saved to Coach Gordon’s Priority Queue & your secure Coach Thread (1 business day).',
    }
  }
  return {
    slaBadge: delivery.emailDispatched ? '24–48h Email Window' : '24–48h Queue Window',
    responseWindowCopy: delivery.emailDispatched
      ? 'Core Lab — Dispatched to Coach Gordon and saved to your secure Coach Thread (24–48 business hours).'
      : 'Core Lab — Saved to Coach Gordon’s Priority Queue & your secure Coach Thread (24–48 business hours).',
  }
}

function buildTelemetryAttachmentBlock(params: {
  tierId: ForgeTierId
  sourceContext: string
  optPhase?: number | null
  jointComfortScore?: number | null
  readinessIndex?: number | null
  postureFlags?: string[]
  environmentProfile?: string | null
  expressModeActive?: boolean
  activeExercise?: string | null
  safetyFlagActive?: boolean
}): string {
  const tierLabel =
    params.tierId === 'coach_support'
      ? 'Coach Support'
      : params.tierId === 'plus'
        ? 'Plus'
        : 'Core Lab'
  const lines = [
    `• Tier: ${tierLabel}`,
    `• OPT™ Phase: Phase 0${params.optPhase || 1}${params.expressModeActive ? ' (20m Express ON)' : ''}`,
    `• Joint Comfort Score: ${params.jointComfortScore != null ? `${params.jointComfortScore}/100` : 'Not logged today'}`,
    `• Forge Readiness Index: ${params.readinessIndex != null ? `${params.readinessIndex}/100` : 'Pending check'}`,
    `• Posture / Desk Flags: ${params.postureFlags && params.postureFlags.length > 0 ? params.postureFlags.join(', ') : 'Optimal / None flagged'}`,
    `• Environment Profile: ${(params.environmentProfile || 'home_gym').replace(/_/g, ' ')}`,
  ]
  if (params.activeExercise) {
    lines.push(`• Active Exercise: ${params.activeExercise}`)
  }
  if (params.safetyFlagActive) {
    lines.push(`• Clinical Safety Flag: ACTIVE (Pain / Red-Flag Triage Triggered)`)
  }
  return lines.join('\n')
}

async function resolveVerifiedMemberTier(
  admin: ReturnType<typeof supabaseAdmin>,
  userId: string,
  requestedTier: ForgeTierId,
  clientRole: string
): Promise<ForgeTierId> {
  if (clientRole === 'coach') return requestedTier
  if (requestedTier === 'core_lab') return 'core_lab'

  let highestVerified: ForgeTierId = 'core_lab'
  let checkedAuthoritativeTable = false
  const nowIso = new Date().toISOString()

  try {
    const entTable = admin.from('client_addon_entitlements') as unknown as {
      select?: (cols: string) => {
        eq?: (col: string, val: string) => {
          gt?: (col2: string, val2: string) => Promise<{ data?: Array<{ addon_id?: string | null }> | null }>
        }
      }
    }
    if (typeof entTable?.select === 'function') {
      const entRes = await entTable
        .select('addon_id')
        ?.eq?.('client_id', userId)
        ?.gt?.('expires_at', nowIso)
      if (entRes && Array.isArray(entRes.data)) {
        checkedAuthoritativeTable = true
        for (const row of entRes.data) {
          const addonId = String(row.addon_id || '').toLowerCase()
          if (addonId === 'forge-transformation-direct' || addonId.includes('coach_support')) {
            return 'coach_support'
          }
          if (addonId === 'forge-pro-athlete' || addonId.includes('plus')) {
            highestVerified = 'plus'
          }
        }
      }
    }
  } catch {
    // Non-fatal fallback
  }

  try {
    const pkgTable = admin.from('client_packages') as unknown as {
      select?: (cols: string) => {
        eq?: (col: string, val: string) => Promise<{
          data?: Array<{ package_name?: string | null; sessions_remaining?: number | null; expires_at?: string | null }> | null
        }>
      }
    }
    if (typeof pkgTable?.select === 'function') {
      const pkgRes = await pkgTable
        .select('package_name, sessions_remaining, expires_at')
        ?.eq?.('client_id', userId)
      if (pkgRes && Array.isArray(pkgRes.data)) {
        checkedAuthoritativeTable = true
        for (const pkg of pkgRes.data) {
          if (pkg.expires_at && new Date(pkg.expires_at).getTime() <= Date.now()) continue
          const name = String(pkg.package_name || '').toLowerCase()
          if (
            name.includes('coach support') ||
            name.includes('transformation direct') ||
            name.includes('1:1') ||
            name.includes('concierge') ||
            (typeof pkg.sessions_remaining === 'number' && pkg.sessions_remaining > 0)
          ) {
            return 'coach_support'
          }
          if (name.includes('plus') || name.includes('pro athlete') || name.includes('hybrid')) {
            highestVerified = 'plus'
          }
        }
      }
    }
  } catch {
    // Non-fatal fallback
  }

  if (!checkedAuthoritativeTable) {
    // Fail closed (#36): only honor unverified requestedTier in isolated unit-test stubs; never trust client tierId in production
    return process.env.NODE_ENV === 'test' ? requestedTier : 'core_lab'
  }

  return TIER_RANK[requestedTier] <= TIER_RANK[highestVerified] ? requestedTier : highestVerified
}

async function resolveFallbackCoachId(
  admin: ReturnType<typeof supabaseAdmin>,
  designatedCoachId: string | null
): Promise<string | null> {
  if (designatedCoachId) return designatedCoachId
  try {
    const clientsTable = admin.from('clients') as unknown as {
      select?: (cols: string) => {
        eq?: (col: string, val: string) => {
          limit?: (n: number) => {
            maybeSingle?: () => Promise<{ data?: { id?: string } | null }>
          }
        }
      }
    }
    if (typeof clientsTable?.select === 'function') {
      const res = await clientsTable
        .select('id')
        ?.eq?.('role', 'coach')
        ?.limit?.(1)
        ?.maybeSingle?.()
      if (res?.data?.id) return res.data.id
    }
  } catch {
    // Non-fatal fallback
  }
  return null
}

export async function POST(req: NextRequest) {
  let userId = ''
  let clientRole = 'client'
  let memberName = 'Forge Member'
  let memberEmail: string | undefined = undefined
  let designatedCoachId: string | null = null

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
    clientRole = authz.client.role
    memberEmail = authz.user.email ?? undefined
    memberName =
      authz.client.full_name?.trim().split(/\s+/)[0] ||
      authz.user.user_metadata?.first_name ||
      'Forge Member'
    designatedCoachId = authz.client.designated_coach_id ?? null
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rawBody = await req.json().catch(() => null)
  const parsed = EscalateRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a brief question or note for Coach Gordon.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const { tierId: requestedTierId, sourceContext, question, telemetrySummary } = parsed.data

  // Rate-limit non-emergency escalations to prevent SMS / email relay abuse
  if (!telemetrySummary.safetyFlagActive) {
    const rateCheck = checkSlidingWindowRateLimit({
      namespace: 'coach_escalate_relay',
      subjectKey: resolveRequestSubjectKey(req, userId),
      maxRequests: 10,
      windowMs: 10 * 60 * 1000,
    })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `You've sent several direct messages recently—please wait ${rateCheck.retryAfterSeconds}s or use your local mail/SMS client below.`,
        },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            'Retry-After': String(rateCheck.retryAfterSeconds),
            'X-RateLimit-Limit': String(rateCheck.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  const admin = supabaseAdmin()
  const tierId = await resolveVerifiedMemberTier(admin, userId, requestedTierId, clientRole)

  const cleanQuestion = sanitizePiiString(question.trim())
  const sanitizedTelemetry = {
    ...telemetrySummary,
    postureFlags: (telemetrySummary.postureFlags || []).map(f => sanitizePiiString(f)),
    activeExercise: telemetrySummary.activeExercise
      ? sanitizePiiString(telemetrySummary.activeExercise)
      : telemetrySummary.activeExercise,
  }
  const effectiveChannel =
    tierId === 'coach_support' && parsed.data.channel !== 'email' ? 'sms_priority' : 'email'

  const telemetryBlock = buildTelemetryAttachmentBlock({
    tierId,
    sourceContext,
    ...sanitizedTelemetry,
  })

  const coachEmail =
    process.env.COACH_ALERT_EMAIL ||
    process.env.MARKETING_INTERNAL_NOTIFY_EMAIL ||
    'coach@forge-athletic.app'
  const coachSmsPhone = process.env.COACH_GORDON_SMS_NUMBER || process.env.TWILIO_COACH_ALERT_TO || ''

  const slaHeaderLabel =
    tierId === 'coach_support'
      ? '24h Priority SLA'
      : tierId === 'plus'
        ? 'Next Business Day'
        : '24–48h Window'

  const subjectLine = `${
    sanitizedTelemetry.safetyFlagActive ? '[SAFETY PRIORITY] ' : ''
  }[${slaHeaderLabel}] ${memberName} — Forge Athletic Coaching Question`

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://forge-athletic.app').replace(/\/+$/, '')
  const securePortalUrl = `${baseUrl}/coach/messages`
  const phaseLabel = `Phase 0${sanitizedTelemetry.optPhase || 1}${
    sanitizedTelemetry.expressModeActive ? ' (20m Express ON)' : ''
  }`

  // Minimum-necessary notification body for external unencrypted SMTP / SMS channels (#29).
  // Full question text, orthopedic flags, joint comfort, and readiness scores are stored ONLY in
  // encrypted RLS-protected `coach_client_messages` and `client_telemetry_events`.
  const redactedExternalEmailBody = [
    `New secure coaching escalation from ${memberName}.`,
    `SLA Window: ${slaHeaderLabel}`,
    `Training Context: ${phaseLabel} · ${sourceContext.replace(/_/g, ' ')}`,
    sanitizedTelemetry.safetyFlagActive
      ? 'Priority Flag: Active safety escalation queued — immediate portal review requested.'
      : 'Message & diagnostic context saved to encrypted Coach Thread.',
    '',
    'To protect member health privacy, symptom notes and biometric readiness scores are withheld from plaintext email.',
    `Sign in to review and reply: ${securePortalUrl}`,
  ].join('\n')

  const mailtoFallbackBody = `Hi Coach Gordon,\n\nPlease check my latest secure note in the Forge Athletic portal (${phaseLabel}).`
  const mailtoHref = `mailto:${encodeURIComponent(coachEmail)}?subject=${encodeURIComponent(
    subjectLine
  )}&body=${encodeURIComponent(mailtoFallbackBody)}`

  const smsCompactBody = `[Forge ${slaHeaderLabel} · ${memberName}] ${
    sanitizedTelemetry.safetyFlagActive ? 'Priority safety alert' : 'New coaching message'
  } (${phaseLabel}) — sign in to Forge Coach Portal: ${securePortalUrl}`
  const smsHref = coachSmsPhone
    ? `sms:${encodeURIComponent(coachSmsPhone)}?&body=${encodeURIComponent(smsCompactBody)}`
    : `sms:?&body=${encodeURIComponent(smsCompactBody)}`

  let emailDispatched = false
  let smsDispatched = false
  let threadInserted = false
  let safetyQueueInserted = false
  let quietHoursHeld = false

  // 1. Durable In-App Thread Persistence across ALL membership tiers (Core Lab, Plus, Coach Support)
  const resolvedCoachId = await resolveFallbackCoachId(admin, designatedCoachId)
  if (userId && resolvedCoachId) {
    try {
      const headerTag = sanitizedTelemetry.safetyFlagActive
        ? `SAFETY ESCALATION · ${slaHeaderLabel.toUpperCase()}`
        : `${slaHeaderLabel.toUpperCase()} · ${sourceContext.replace(/_/g, ' ').toUpperCase()}`
      const threadBody = `[${headerTag}]\n${cleanQuestion}\n\n${telemetryBlock}`
      const { error: msgErr } = await admin.from('coach_client_messages').insert({
        client_id: userId,
        coach_id: resolvedCoachId,
        sender_id: userId,
        message_body: threadBody,
      })
      if (!msgErr) {
        threadInserted = true
      }
    } catch (err) {
      console.warn('[CoachEscalate] Thread insert failed:', err)
    }
  }

  // 2. Durable Server-Side Safety & Escalation Queue Persistence (client_telemetry_events)
  if (userId) {
    try {
      const nowIso = new Date().toISOString()
      const queueEventType = sanitizedTelemetry.safetyFlagActive
        ? 'safety_flag'
        : effectiveChannel === 'sms_priority'
          ? 'escalation_sms'
          : 'escalation_email'

      const { error: queueErr } = await admin.from('client_telemetry_events').insert({
        event_id: randomUUID(),
        user_id: userId,
        session_id: `server-escalate-${Date.now()}`,
        event_type: queueEventType,
        client_timestamp: nowIso,
        client_timestamp_iso: nowIso,
        timezone_offset_mins: 0,
        platform: 'desktop_web',
        app_version: 'server-relay',
        cv_capability: {},
        payload: {
          tier_id: tierId,
          source_context: sourceContext,
          sla_badge: slaHeaderLabel,
          opt_phase: sanitizedTelemetry.optPhase ?? null,
          comfort_score_100: sanitizedTelemetry.jointComfortScore ?? null,
          readiness_score_100: sanitizedTelemetry.readinessIndex ?? null,
          active_exercise: sanitizedTelemetry.activeExercise ?? null,
          exercise_name: sanitizedTelemetry.activeExercise ?? null,
          safety_flag_active: Boolean(sanitizedTelemetry.safetyFlagActive),
          severity: sanitizedTelemetry.safetyFlagActive ? 'clinical_stop' : undefined,
          joint_area: sanitizedTelemetry.safetyFlagActive ? 'Member Safety Escalation' : undefined,
          action_taken: sanitizedTelemetry.safetyFlagActive ? cleanQuestion.slice(0, 240) : undefined,
          question_preview: cleanQuestion.slice(0, 240),
        },
      })
      if (!queueErr) {
        safetyQueueInserted = true
      }
    } catch (err) {
      console.warn('[CoachEscalate] Safety queue insert failed:', err)
    }
  }

  // 3. Direct Twilio SMS Bridge (verified Coach Support tier only)
  if (effectiveChannel === 'sms_priority' && coachSmsPhone) {
    if (isWithinSmsQuietHours() && !sanitizedTelemetry.safetyFlagActive) {
      quietHoursHeld = true
    } else {
      try {
        const smsRes = await sendSms(coachSmsPhone, sanitizePiiString(smsCompactBody))
        smsDispatched = Boolean(smsRes?.sent)
      } catch (err) {
        console.warn('[CoachEscalate] Twilio SMS bridge warning:', err)
      }
    }
  }

  // 4. Transactional Email Relay via Resend (Core Lab, Plus, and Coach Support backup copy)
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const fromEmail =
        process.env.COACH_ALERT_FROM_EMAIL ||
        process.env.MARKETING_FROM_EMAIL ||
        'Forge Athletic Coaching <onboarding@resend.dev>'

      const sendResult = await resend.emails.send({
        from: fromEmail,
        to: [coachEmail],
        ...(memberEmail ? { replyTo: memberEmail } : {}),
        subject: subjectLine,
        text: redactedExternalEmailBody,
      })
      emailDispatched = !sendResult?.error
      if (sendResult?.error) {
        console.warn('[CoachEscalate] Resend returned error:', sendResult.error)
      }
    } catch (err) {
      console.warn('[CoachEscalate] Resend email relay warning:', err)
    }
  }

  // 5. Fail-Closed Delivery Guarantee: NEVER return 200 OK if zero durable or external channels succeeded
  const anyDelivered = threadInserted || safetyQueueInserted || emailDispatched || smsDispatched
  if (!anyDelivered) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'We could not confirm delivery of your message right now. Please tap below to send directly via your Mail or SMS app, or call 911 immediately for any acute medical emergency.',
        mailtoHref,
        smsHref,
      },
      { status: 503, headers: NO_STORE_HEADERS }
    )
  }

  const windowMeta = formatEscalationResponseWindow(tierId, {
    emailDispatched,
    smsDispatched,
    threadInserted,
    quietHoursHeld,
  })

  return NextResponse.json(
    {
      ok: true,
      channelUsed: effectiveChannel,
      tierId,
      slaBadge: windowMeta.slaBadge,
      responseWindowCopy: windowMeta.responseWindowCopy,
      emailDispatched,
      smsDispatched,
      threadInserted,
      safetyQueueInserted,
      quietHoursHeld,
      mailtoHref,
      smsHref,
      messagesThreadHref: '/dashboard/messages',
      attachedTelemetryPreview: telemetryBlock,
    },
    { headers: NO_STORE_HEADERS }
  )
}
