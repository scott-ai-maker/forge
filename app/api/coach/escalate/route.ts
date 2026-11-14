import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { isWithinSmsQuietHours, sendSms } from '@/lib/sms'
import { supabaseAdmin } from '@/lib/supabase'
import type { ForgeTierId } from '@/lib/tierEntitlements'
import { sanitizePiiString } from '@/src/lib/safety/clinicalGuardrails'

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

function formatEscalationResponseWindow(tierId: ForgeTierId): {
  slaBadge: string
  responseWindowCopy: string
} {
  if (tierId === 'coach_support') {
    return {
      slaBadge: '24h Priority SLA',
      responseWindowCopy:
        'Priority 24h SLA — Coach Gordon receives an instant SMS ping + priority thread alert.',
    }
  }
  if (tierId === 'plus') {
    return {
      slaBadge: 'Next Business Day',
      responseWindowCopy:
        'Plus Priority Email — Coach Gordon personally replies within 1 business day.',
    }
  }
  return {
    slaBadge: '24–48h Email Window',
    responseWindowCopy:
      'Core Lab Direct Email — Coach Gordon personally replies within 24–48 business hours.',
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
  const lines = [
    `• Tier: ${params.tierId === 'coach_support' ? 'Coach Support ($199)' : params.tierId === 'plus' ? 'Plus ($49)' : 'Core Lab ($19.99)'}`,
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

export async function POST(req: NextRequest) {
  let userId: string | null = null
  let memberName = 'Forge Member'
  let memberEmail: string | undefined = undefined
  let designatedCoachId: string | null = null

  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
    memberEmail = authz.user.email ?? undefined
    memberName =
      authz.client.full_name?.trim().split(/\s+/)[0] ||
      authz.user.user_metadata?.first_name ||
      'Forge Member'
    designatedCoachId = authz.client.designated_coach_id ?? null
  } catch (error) {
    const isDevPreview =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW === 'true'
    if (!isDevPreview) {
      const status = error instanceof AuthzError ? error.status : 401
      const message = error instanceof Error ? error.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status })
    }
  }

  const rawBody = await req.json().catch(() => null)
  const parsed = EscalateRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a brief question or note for Coach Gordon.' },
      { status: 400 }
    )
  }

  const { tierId, sourceContext, question, telemetrySummary } = parsed.data
  const effectiveChannel =
    tierId === 'coach_support' && parsed.data.channel !== 'email' ? 'sms_priority' : 'email'

  const windowMeta = formatEscalationResponseWindow(tierId)
  const telemetryBlock = buildTelemetryAttachmentBlock({
    tierId,
    sourceContext,
    ...telemetrySummary,
  })

  const coachEmail =
    process.env.COACH_ALERT_EMAIL ||
    process.env.MARKETING_INTERNAL_NOTIFY_EMAIL ||
    'coach@forge-athletic.app'
  const coachSmsPhone = process.env.COACH_GORDON_SMS_NUMBER || process.env.TWILIO_COACH_ALERT_TO || ''

  const subjectLine = `${
    telemetrySummary.safetyFlagActive ? '[SAFETY PRIORITY] ' : ''
  }[${windowMeta.slaBadge}] ${memberName} — Forge Athletic Coaching Question`

  const plainBody = `${question.trim()}\n\n--- Attached Forge Athletic Diagnostic Context ---\n${telemetryBlock}`

  const mailtoHref = `mailto:${encodeURIComponent(coachEmail)}?subject=${encodeURIComponent(
    subjectLine
  )}&body=${encodeURIComponent(plainBody)}`

  const smsCompactBody = `[Forge 24h Priority · ${memberName}] ${question.trim().slice(0, 220)} | Phase 0${
    telemetrySummary.optPhase || 1
  } · Comfort ${telemetrySummary.jointComfortScore ?? '—'}/100 · Readiness ${
    telemetrySummary.readinessIndex ?? '—'
  }/100`
  const smsHref = coachSmsPhone
    ? `sms:${encodeURIComponent(coachSmsPhone)}?&body=${encodeURIComponent(smsCompactBody)}`
    : `sms:?&body=${encodeURIComponent(smsCompactBody)}`

  let emailDispatched = false
  let smsDispatched = false
  let threadInserted = false
  let quietHoursHeld = false

  // 1. Coach Support ($199): Priority 24h In-App Thread + Direct Twilio SMS Bridge
  if (effectiveChannel === 'sms_priority') {
    if (userId && designatedCoachId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = supabaseAdmin()
        const threadBody = `[PRIORITY 24H SLA · ${sourceContext.replace(/_/g, ' ').toUpperCase()}]\n${question.trim()}\n\n${telemetryBlock}`
        const { error: msgErr } = await admin.from('coach_client_messages').insert({
          client_id: userId,
          coach_id: designatedCoachId,
          sender_id: userId,
          message_body: threadBody,
        })
        if (!msgErr) {
          threadInserted = true
        }
      } catch (err) {
        console.warn('[CoachEscalate] Thread insert skipped:', err)
      }
    }

    if (coachSmsPhone) {
      if (isWithinSmsQuietHours() && !telemetrySummary.safetyFlagActive) {
        quietHoursHeld = true
      } else {
        try {
          const smsRes = await sendSms(coachSmsPhone, sanitizePiiString(smsCompactBody))
          smsDispatched = smsRes.sent
        } catch (err) {
          console.warn('[CoachEscalate] Twilio SMS bridge warning:', err)
        }
      }
    }
  }

  // 2. Transactional Email Relay via Resend (Core Lab $19.99, Plus $49, and backup copy for Coach Support $199)
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const fromEmail =
        process.env.COACH_ALERT_FROM_EMAIL ||
        process.env.MARKETING_FROM_EMAIL ||
        'Forge Athletic Coaching <onboarding@resend.dev>'

      await resend.emails.send({
        from: fromEmail,
        to: [coachEmail],
        ...(memberEmail ? { replyTo: memberEmail } : {}),
        subject: subjectLine,
        text: plainBody,
      })
      emailDispatched = true
    } catch (err) {
      console.warn('[CoachEscalate] Resend email relay warning:', err)
    }
  }

  return NextResponse.json({
    ok: true,
    channelUsed: effectiveChannel,
    tierId,
    slaBadge: windowMeta.slaBadge,
    responseWindowCopy: windowMeta.responseWindowCopy,
    emailDispatched,
    smsDispatched,
    threadInserted,
    quietHoursHeld,
    mailtoHref,
    smsHref,
    messagesThreadHref: '/dashboard/messages',
    attachedTelemetryPreview: telemetryBlock,
  })
}
