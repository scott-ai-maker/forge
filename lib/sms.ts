import { toE164 } from '@/lib/phone'

export function hasSmsConfig() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      (process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() || process.env.TWILIO_FROM_NUMBER?.trim())
  )
}

// Sends one SMS through Twilio's REST API. No-ops (skipped) when Twilio is not configured.
export async function sendSms(to: string, body: string): Promise<{ sent: boolean; skipped?: boolean }> {
  if (!hasSmsConfig()) return { sent: false, skipped: true }
  const phone = toE164(to)
  if (!phone) return { sent: false, skipped: true }

  const sid = process.env.TWILIO_ACCOUNT_SID!.trim()
  const token = process.env.TWILIO_AUTH_TOKEN!.trim()
  const params = new URLSearchParams({ To: phone, Body: body })
  const service = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim()
  if (service) params.set('MessagingServiceSid', service)
  else params.set('From', process.env.TWILIO_FROM_NUMBER!.trim())

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  if (!res.ok) throw new Error(`Twilio send failed (${res.status})`)
  return { sent: true }
}

// Texts are held outside 8am-9pm in the client's timezone; Eastern is used since the practice is Massachusetts-based.
export function isWithinSmsQuietHours(now = new Date(), timeZone = 'America/New_York') {
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone }).format(now)) % 24
  return hour < 8 || hour >= 21
}
