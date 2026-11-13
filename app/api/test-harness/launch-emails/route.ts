import { NextRequest, NextResponse } from 'next/server'
import {
  ALL_LAUNCH_TEMPLATE_IDS,
  deliverAutomationPayload,
  evaluateAutomationSuppression,
  evaluateScheduleReadiness,
  LAUNCH_AUTOMATION_TEMPLATES,
  renderAutomationTemplate,
  type AutomationRecipientFlags,
  type AutomationTemplateId,
} from '@/lib/automations/launchSequence'

function ensureDevOnly() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return null
}

function parseBool(val: string | null, fallback: boolean): boolean {
  if (val === null) return fallback
  return val === 'true' || val === '1'
}

export async function GET(req: NextRequest) {
  const blocked = ensureDevOnly()
  if (blocked) return blocked

  const sp = req.nextUrl.searchParams
  const recipient: AutomationRecipientFlags = {
    email: sp.get('email') || 'scott.preview@forge-athletic.app',
    phone: sp.get('phone') || '+16175550199',
    firstName: sp.get('firstName') || 'Scott',
    guestFirstName: sp.get('guestFirstName') || 'Jordan',
    referrerFirstName: sp.get('referrerFirstName') || 'Scott',
    expirationDate: sp.get('expirationDate') || 'December 20, 2026',
    timezone: sp.get('timezone') || 'America/New_York',
    account_activated: parseBool(sp.get('account_activated'), false),
    screening_booked: parseBool(sp.get('screening_booked'), false),
    guest_pass_redeemed: parseBool(sp.get('guest_pass_redeemed'), true),
    sms_opt_in: parseBool(sp.get('sms_opt_in'), true),
    activated_at: sp.get('activated_at') || '2026-11-20T12:15:00.000Z',
    is_founding_member: true,
    is_waitlist_lead: true,
  }

  const simulatedNowRaw = sp.get('simulatedNowIso')
  const now =
    simulatedNowRaw && !Number.isNaN(new Date(simulatedNowRaw).getTime())
      ? new Date(simulatedNowRaw)
      : new Date('2026-11-20T11:05:00.000Z')

  const items = ALL_LAUNCH_TEMPLATE_IDS.map(templateId => {
    const meta = LAUNCH_AUTOMATION_TEMPLATES[templateId]
    const rendered = renderAutomationTemplate(templateId, recipient)
    const suppression = evaluateAutomationSuppression(templateId, recipient)
    const schedule = evaluateScheduleReadiness(templateId, recipient, now)

    return {
      id: meta.id,
      code: meta.code,
      step: meta.step,
      name: meta.name,
      channel: meta.channel,
      scheduleConfig: meta.schedule,
      suppression,
      schedule: {
        due: schedule.due,
        scheduledAtUtc: schedule.scheduledAtUtc ? schedule.scheduledAtUtc.toISOString() : null,
        targetLocalDate: schedule.targetLocalDate ?? null,
        reason: schedule.reason ?? null,
      },
      rendered,
    }
  })

  return NextResponse.json({
    providerStatus: {
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      fromEmail: process.env.MARKETING_FROM_EMAIL?.trim() || null,
      twilioConfigured: Boolean(
        process.env.TWILIO_ACCOUNT_SID?.trim() &&
          process.env.TWILIO_AUTH_TOKEN?.trim() &&
          process.env.TWILIO_FROM_NUMBER?.trim()
      ),
    },
    items,
  })
}

export async function POST(req: NextRequest) {
  const blocked = ensureDevOnly()
  if (blocked) return blocked

  const body = (await req.json().catch(() => ({}))) as {
    templateId?: AutomationTemplateId
    sendAllEmails?: boolean
    prefixTestTag?: boolean
    toEmail?: string
    toPhone?: string
    firstName?: string
    guestFirstName?: string
    referrerFirstName?: string
    expirationDate?: string
    timezone?: string
  }

  const recipient: AutomationRecipientFlags = {
    email: body.toEmail?.trim() || '',
    phone: body.toPhone?.trim() || '',
    firstName: body.firstName?.trim() || 'Scott',
    guestFirstName: body.guestFirstName?.trim() || 'Jordan',
    referrerFirstName: body.referrerFirstName?.trim() || 'Scott',
    expirationDate: body.expirationDate?.trim() || 'December 20, 2026',
    timezone: body.timezone?.trim() || 'America/New_York',
    account_activated: true,
    screening_booked: false,
    guest_pass_redeemed: true,
    sms_opt_in: true,
    activated_at: '2026-11-20T12:15:00.000Z',
    is_founding_member: true,
    is_waitlist_lead: true,
  }

  const targets: AutomationTemplateId[] = body.sendAllEmails
    ? ALL_LAUNCH_TEMPLATE_IDS.filter(id => LAUNCH_AUTOMATION_TEMPLATES[id].channel === 'email')
    : body.templateId && body.templateId in LAUNCH_AUTOMATION_TEMPLATES
      ? [body.templateId]
      : []

  if (targets.length === 0) {
    return NextResponse.json(
      { error: 'Provide a valid templateId or sendAllEmails: true' },
      { status: 400 }
    )
  }

  const results: Array<{
    templateId: AutomationTemplateId
    code: string
    delivered: boolean
    skipped?: boolean
    reason?: string
    providerMessageId?: string | null
    error?: string
  }> = []

  for (const templateId of targets) {
    const meta = LAUNCH_AUTOMATION_TEMPLATES[templateId]
    try {
      const payload = renderAutomationTemplate(templateId, recipient)
      if (payload.channel === 'email' && body.prefixTestTag !== false) {
        payload.subject = `[TEST ${meta.code}] ${payload.subject}`
      }
      const delivery = await deliverAutomationPayload(payload, {
        bypassSmsQuietHours: true,
        timeZone: recipient.timezone,
      })
      results.push({
        templateId,
        code: meta.code,
        ...delivery,
      })
    } catch (err) {
      results.push({
        templateId,
        code: meta.code,
        delivered: false,
        error: err instanceof Error ? err.message : 'Test send failed',
      })
    }
  }

  return NextResponse.json({
    success: results.every(r => r.delivered),
    results,
  })
}

