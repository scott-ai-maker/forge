import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { toE164 } from '@/lib/phone'

const STOP_WORDS = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'])
const START_WORDS = new Set(['START', 'YES', 'UNSTOP'])

function twiml(message?: string) {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${message}</Message>` : ''}</Response>`
  return new NextResponse(body, { headers: { 'Content-Type': 'text/xml' } })
}

function isValidSignature(req: NextRequest, params: URLSearchParams) {
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  if (!token) return process.env.NODE_ENV !== 'production'
  const signature = req.headers.get('x-twilio-signature')
  if (!signature) return false

  const sorted = [...params.keys()].sort()
  const payload = req.nextUrl.origin + req.nextUrl.pathname + sorted.map((k) => k + params.get(k)).join('')
  const expected = createHmac('sha1', token).update(payload).digest('base64')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Inbound SMS webhook: honors STOP/START so opt-outs take effect immediately.
export async function POST(req: NextRequest) {
  const params = new URLSearchParams(await req.text())
  if (!isValidSignature(req, params)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const keyword = (params.get('Body') ?? '').trim().toUpperCase()
  const phone = toE164(params.get('From'))
  if (!phone) return twiml()

  const admin = supabaseAdmin()
  if (STOP_WORDS.has(keyword)) {
    await admin.from('notification_preferences').update({ sms_enabled: false, updated_at: new Date().toISOString() }).eq('sms_phone', phone)
    return twiml()
  }
  if (START_WORDS.has(keyword)) {
    await admin
      .from('notification_preferences')
      .update({ sms_enabled: true, sms_consent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('sms_phone', phone)
    return twiml('Forge Athletic: text alerts are back on. Reply STOP to opt out.')
  }
  if (keyword === 'HELP') {
    return twiml('Forge Athletic: alerts about your coaching account. Manage in Settings. Reply STOP to opt out. Msg&data rates may apply.')
  }
  return twiml()
}
