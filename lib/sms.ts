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

const PACIFIC_AREA_CODES = new Set([
  '206', '209', '213', '253', '279', '310', '323', '341', '360', '408', '415', '424', '425',
  '442', '458', '503', '509', '510', '530', '541', '559', '562', '564', '619', '626', '628',
  '650', '657', '661', '669', '702', '707', '714', '725', '747', '760', '775', '805', '818',
  '820', '831', '840', '858', '909', '916', '925', '949', '951', '971',
])

const MOUNTAIN_AREA_CODES = new Set([
  '208', '303', '307', '385', '406', '435', '480', '505', '520', '575', '602', '623', '719',
  '720', '801', '928', '970', '986',
])

const CENTRAL_AREA_CODES = new Set([
  '205', '210', '214', '217', '218', '224', '225', '228', '251', '254', '256', '262', '281',
  '309', '312', '314', '316', '318', '319', '320', '325', '331', '334', '337', '346', '361',
  '402', '405', '409', '414', '417', '430', '432', '469', '479', '501', '504', '507', '512',
  '515', '531', '534', '539', '563', '573', '580', '601', '605', '608', '612', '615', '618',
  '620', '630', '636', '641', '651', '660', '662', '682', '708', '712', '713', '715', '731',
  '737', '763', '769', '773', '779', '785', '806', '815', '816', '817', '830', '832', '847',
  '870', '901', '903', '913', '915', '918', '920', '936', '940', '945', '952', '956', '972',
  '979', '985',
])

export function inferUsTimeZoneFromPhone(phone?: string | null): string | null {
  const e164 = toE164(phone)
  if (!e164 || !e164.startsWith('+1') || e164.length !== 12) return null
  const areaCode = e164.slice(2, 5)
  if (areaCode === '808') return 'Pacific/Honolulu'
  if (areaCode === '907') return 'America/Anchorage'
  if (PACIFIC_AREA_CODES.has(areaCode)) return 'America/Los_Angeles'
  if (MOUNTAIN_AREA_CODES.has(areaCode)) return 'America/Denver'
  if (CENTRAL_AREA_CODES.has(areaCode)) return 'America/Chicago'
  return null
}

function getLocalHour(now: Date, timeZone: string): number {
  return (
    Number(
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone,
      }).format(now)
    ) % 24
  )
}

function isValidTimeZone(tz?: string | null): tz is string {
  if (!tz || !tz.trim()) return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz.trim() }).format(new Date())
    return true
  } catch {
    return false
  }
}

/**
 * Enforces TCPA (47 CFR § 64.1200(c)(1)) and stricter state mini-TCPA quiet hours
 * (FL § 501.059, OK, WA: 8:00 AM – 8:00 PM in the recipient's local timezone).
 * When neither an explicit valid `timeZone` nor a known non-Eastern US area code is
 * available, enforces the nationwide safe window (12:00 PM – 8:00 PM America/New_York,
 * corresponding to 9:00 AM – 5:00 PM Pacific / 8:00 AM – 4:00 PM Alaska).
 */
export function isWithinSmsQuietHours(
  now = new Date(),
  timeZone?: string | null,
  phone?: string | null
): boolean {
  if (isValidTimeZone(timeZone)) {
    const hour = getLocalHour(now, timeZone.trim())
    return hour < 8 || hour >= 20
  }

  const inferredTz = inferUsTimeZoneFromPhone(phone)
  if (inferredTz) {
    const hour = getLocalHour(now, inferredTz)
    return hour < 8 || hour >= 20
  }

  // Unknown recipient timezone: enforce nationwide safe window (12:00 PM - 8:00 PM ET)
  const easternHour = getLocalHour(now, 'America/New_York')
  return easternHour < 12 || easternHour >= 20
}

const EXACT_STOP_WORDS = new Set([
  'STOP',
  'STOPALL',
  'STOP ALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
  'REVOKE',
  'OPTOUT',
  'OPT OUT',
  'REMOVE',
])

const NATURAL_OPT_OUT_PATTERN =
  /\b(stop\s+(texting|messaging|sending|all|it|these)|please\s+stop|opt\s*-?\s*out|unsubscribe|take\s+me\s+off|remove\s+me|do\s+not\s+text|don'?t\s+text|no\s+more\s+texts?)\b/i

const START_WORDS = new Set(['START', 'YES', 'UNSTOP'])

export type InboundSmsIntent = 'opt_out' | 'opt_in' | 'pass' | 'help' | 'unknown'

/**
 * Classifies inbound SMS replies in accordance with the FCC 2024 TCPA Revocation Order
 * (CG Docket No. 02-278 — honoring revocation in "any reasonable manner").
 */
export function parseInboundSmsIntent(rawBody: string | null | undefined): InboundSmsIntent {
  const cleaned = String(rawBody ?? '')
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return 'unknown'

  const upper = cleaned.toUpperCase()
  if (EXACT_STOP_WORDS.has(upper) || NATURAL_OPT_OUT_PATTERN.test(cleaned)) {
    return 'opt_out'
  }
  if (START_WORDS.has(upper)) {
    return 'opt_in'
  }
  if (upper === 'PASS') {
    return 'pass'
  }
  if (upper === 'HELP' || upper === 'INFO') {
    return 'help'
  }
  return 'unknown'
}
