import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toE164 } from '@/lib/phone'
import { parseInboundSmsIntent } from '@/lib/sms'

function twiml(message?: string) {
  const escaped = message
    ? message
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    : ''
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response>${escaped ? `<Message>${escaped}</Message>` : ''}</Response>`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } })
}

function verifyCandidateUrlSignature(
  candidateUrl: string,
  sortedParamSuffix: string,
  token: string,
  signature: string
): boolean {
  const expected = createHmac('sha1', token)
    .update(candidateUrl + sortedParamSuffix)
    .digest('base64')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function isValidSignature(req: NextRequest, params: URLSearchParams) {
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  if (!token) return process.env.NODE_ENV !== 'production'
  const signature = req.headers.get('x-twilio-signature')
  if (!signature) return false

  const sorted = [...params.keys()].sort()
  const paramSuffix = sorted.map(k => k + (params.get(k) ?? '')).join('')

  const candidates = new Set<string>([req.nextUrl.origin + req.nextUrl.pathname])
  const fwdProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const fwdHost = (req.headers.get('x-forwarded-host') || req.headers.get('host'))
    ?.split(',')[0]
    ?.trim()
  if (fwdProto && fwdHost) {
    candidates.add(`${fwdProto}://${fwdHost}${req.nextUrl.pathname}`)
  }

  for (const candidateUrl of candidates) {
    if (verifyCandidateUrlSignature(candidateUrl, paramSuffix, token, signature)) {
      return true
    }
  }
  return false
}

// Inbound SMS webhook: honors STOP/revocation across accounts, waitlist & suppressions immediately.
export async function POST(req: NextRequest) {
  const params = new URLSearchParams(await req.text())
  if (!isValidSignature(req, params)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const intent = parseInboundSmsIntent(params.get('Body'))
  const phone = toE164(params.get('From'))
  if (!phone) return twiml()

  const admin = supabaseAdmin()
  const nowIso = new Date().toISOString()

  if (intent === 'opt_out') {
    await Promise.allSettled([
      admin.from('sms_suppressions').upsert(
        { phone, reason: 'inbound_stop', suppressed_at: nowIso },
        { onConflict: 'phone' }
      ),
      admin
        .from('notification_preferences')
        .update({ sms_enabled: false, updated_at: nowIso })
        .eq('sms_phone', phone),
      (async () => {
        const { data: lead } = await admin
          .from('waitlist')
          .select('email')
          .eq('phone', phone)
          .maybeSingle()
        await admin.from('waitlist').update({ sms_opt_in: false }).eq('phone', phone)
        if (lead?.email) {
          await admin
            .from('marketing_email_queue')
            .update({ status: 'cancelled', last_error: 'Suppressed: inbound_sms_stop' })
            .eq('email', String(lead.email).trim().toLowerCase())
            .eq('template_key', 'rescue_02b_sms')
            .eq('status', 'pending')
        }
      })(),
    ])

    return twiml(
      'Forge Athletic: You are opted out and will receive no further text messages. Reply START to re-subscribe.'
    )
  }

  if (intent === 'opt_in') {
    await Promise.allSettled([
      admin.from('sms_suppressions').delete().eq('phone', phone),
      admin
        .from('notification_preferences')
        .update({ sms_enabled: true, sms_consent_at: nowIso, updated_at: nowIso })
        .eq('sms_phone', phone),
      admin
        .from('waitlist')
        .update({ sms_opt_in: true, sms_consent_at: nowIso })
        .eq('phone', phone),
    ])
    return twiml('Forge Athletic: Text alerts are back on. Reply STOP to opt out. Msg&data rates may apply.')
  }

  if (intent === 'pass') {
    try {
      const { releaseWaitlistPassOnReply } = await import('@/lib/automations/launchSequence')
      await releaseWaitlistPassOnReply(admin, { phone })
    } catch {
      // Non-blocking standby release
    }
    return twiml(
      'Forge Athletic: Got it — your Founding Member spot has been released to standby. Reply START anytime if your schedule opens up.'
    )
  }

  if (intent === 'help') {
    return twiml(
      'Forge Athletic (scott@forge-athletic.app): Account & coaching alerts. Manage in Settings. Reply STOP to opt out. Msg&data rates may apply.'
    )
  }

  return twiml()
}
