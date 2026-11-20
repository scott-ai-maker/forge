import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { enforceRateLimit } from '@/lib/rate-limit'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }
const ALLOWED_PLATFORMS = new Set(['ios', 'android', 'web'])
const IOS_APNS_TOKEN_RE = /^[a-fA-F0-9]{64,200}$/
const GENERIC_PUSH_TOKEN_RE = /^[A-Za-z0-9:_-]{20,512}$/

export async function POST(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rl = await enforceRateLimit({
    key: `account_push_token:${userId}`,
    limit: 20,
    windowSeconds: 3600,
    route: '/api/account/push-token',
    dimension: 'user',
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many push token registrations. Please try again later.' },
      { status: 429, headers: NO_STORE_HEADERS }
    )
  }

  const body = await req.json().catch(() => ({}))
  const deviceToken = String(body.deviceToken ?? '').trim()
  const platform = String(body.platform ?? 'ios').trim().toLowerCase()

  if (!ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json(
      { error: 'Invalid push platform. Expected ios, android, or web.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const isValidToken =
    platform === 'ios'
      ? IOS_APNS_TOKEN_RE.test(deviceToken)
      : GENERIC_PUSH_TOKEN_RE.test(deviceToken)

  if (!isValidToken) {
    return NextResponse.json(
      { error: 'Invalid deviceToken format.' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const admin = supabaseAdmin()
  const { data: existingToken } = await admin
    .from('push_tokens')
    .select('user_id')
    .eq('device_token', deviceToken)
    .maybeSingle()

  if (existingToken?.user_id && existingToken.user_id !== userId) {
    return NextResponse.json(
      { error: 'Push token belongs to another active session.' },
      { status: 409, headers: NO_STORE_HEADERS }
    )
  }

  const { error } = await admin
    .from('push_tokens')
    .upsert(
      { user_id: userId, device_token: deviceToken, platform, updated_at: new Date().toISOString() },
      { onConflict: 'device_token' }
    )

  if (error) {
    return NextResponse.json(
      { error: 'Failed to register push token.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS })
}
