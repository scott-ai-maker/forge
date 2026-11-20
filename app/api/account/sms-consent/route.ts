import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import { protectCSRF } from '@/lib/csrf'
import { toE164 } from '@/lib/phone'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import { validateInboundEmail } from '@/lib/email-validation'
import { extractRequestIp, recordLegalConsentAudit } from '@/lib/legal-compliance'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const

function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz.trim() || tz.length > 64) return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz.trim() }).format(new Date())
    return true
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const csrf = await protectCSRF(req)
  if (!csrf.valid) return csrf.error

  const ip = getClientIp(req)
  const rl = await enforceRateLimit({
    key: `sms_consent:${ip}`,
    limit: 10,
    windowSeconds: 3600,
    route: '/api/account/sms-consent',
    dimension: 'ip',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many SMS consent requests. Please try again later.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400, headers: NO_STORE_HEADERS })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (body.smsConsent !== true) {
    return NextResponse.json(
      {
        error:
          'Affirmative TCPA written consent is required to enable SMS text alerts. Consent is optional and not a condition of purchase.',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const phoneE164 = toE164(typeof body.phone === 'string' ? body.phone : null)
  if (!phoneE164) {
    return NextResponse.json(
      { error: 'Please enter a valid 10-digit US or international mobile phone number.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const emailValidation = await validateInboundEmail({ email: body.email })
  if (!emailValidation.valid) {
    return NextResponse.json(
      { error: emailValidation.error || 'Please enter a valid account email address.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }
  const normalizedEmail = emailValidation.normalizedEmail
  const fullName =
    typeof body.name === 'string'
      ? body.name.replace(/[\u0000-\u001F\u007F<>]/g, '').trim().slice(0, 80)
      : ''
  const timezone = isValidTimeZone(body.timezone) ? body.timezone.trim() : null
  const nowIso = new Date().toISOString()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const admin = supabaseAdmin()

  if (user && user.email?.trim().toLowerCase() === normalizedEmail) {
    // Only clear a prior STOP suppression when an authenticated account holder owns this number or has no conflicting account claim
    const { data: existingClient } = await admin
      .from('clients')
      .select('phone')
      .eq('id', user.id)
      .maybeSingle()
    const { data: existingPref } = await admin
      .from('notification_preferences')
      .select('sms_phone')
      .eq('user_id', user.id)
      .maybeSingle()

    const ownedClientPhone = toE164(existingClient?.phone ?? null)
    const ownedPrefPhone = toE164(existingPref?.sms_phone ?? null)
    if (ownedClientPhone === phoneE164 || ownedPrefPhone === phoneE164) {
      await admin.from('sms_suppressions').delete().eq('phone', phoneE164)
    }

    await admin.from('notification_preferences').upsert(
      {
        user_id: user.id,
        sms_enabled: true,
        sms_phone: phoneE164,
        sms_consent_at: nowIso,
        ...(timezone ? { timezone } : {}),
        updated_at: nowIso,
      },
      { onConflict: 'user_id' }
    )

    const auditWrite = await recordLegalConsentAudit({
      adminClient: admin,
      userId: user.id,
      documentTypes: ['terms_of_service', 'privacy_policy'],
      typedSignature: fullName || user.email || 'Authenticated Member',
      ipAddress: extractRequestIp(req.headers),
      userAgent: req.headers.get('user-agent'),
      metadata: {
        flow: 'standalone_sms_consent_form',
        phoneE164,
        smsConsent: true,
        consentedAt: nowIso,
        timezone,
      },
    })
    if (auditWrite.error) {
      return NextResponse.json(
        { error: 'Unable to record TCPA SMS consent audit proof right now. Please retry.' },
        { status: 500, headers: NO_STORE_HEADERS }
      )
    }
  } else {
    // Unauthenticated waitlist / prospective visitor: NEVER delete prior carrier STOP suppressions
    // (must reply START/UNSTOP from the handset or sign in to a verified account owning that phone).
    const { data: suppressedRow } = await admin
      .from('sms_suppressions')
      .select('phone')
      .eq('phone', phoneE164)
      .maybeSingle()

    if (suppressedRow?.phone) {
      return NextResponse.json(
        {
          error:
            'This mobile number previously opted out via STOP. To re-enable SMS alerts, reply START from that mobile device or sign in to your verified account.',
          code: 'SMS_OPTED_OUT_HANDSET_START_REQUIRED',
        },
        { status: 409, headers: NO_STORE_HEADERS }
      )
    }

    await admin.from('waitlist').upsert(
      {
        email: normalizedEmail,
        ...(fullName ? { first_name: fullName } : {}),
        phone: phoneE164,
        sms_opt_in: true,
        sms_consent_at: nowIso,
        ...(timezone ? { timezone } : {}),
        source: 'sms_consent_form',
      },
      { onConflict: 'email', ignoreDuplicates: true }
    )
  }

  return NextResponse.json(
    {
      ok: true,
      consentedAt: nowIso,
      authenticated: Boolean(user),
    },
    { headers: NO_STORE_HEADERS }
  )
}
