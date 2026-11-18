import { createHmac } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { checkSlidingWindowRateLimit, resolveRequestSubjectKey } from '@/src/lib/security/rateLimiter'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
]

function sanitizeTurnUrls(rawUrls: string): string[] {
  return rawUrls
    .split(',')
    .map(u => u.trim())
    .filter(u => {
      if (!u) return false
      const lower = u.toLowerCase()
      // Block community open relays and plaintext port-80 TURN transport (#30)
      if (lower.includes('openrelay.metered.ca')) return false
      if (/^turn:[^?]*:80(\b|$|\?)/i.test(lower)) return false
      return lower.startsWith('turns:') || lower.startsWith('turn:') || lower.startsWith('stun:')
    })
}

/**
 * Issues short-lived, authenticated WebRTC ICE/TURN server credentials to signed-in
 * coaches and athletes without exposing static TURN secrets in client JS bundles
 * or relying on unvetted community relays (#30).
 */
export async function GET(req: NextRequest) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rateCheck = checkSlidingWindowRateLimit({
    namespace: 'webrtc_ice_servers',
    subjectKey: resolveRequestSubjectKey(req, userId),
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  })
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many ICE configuration requests. Please retry shortly.' },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(rateCheck.retryAfterSeconds),
        },
      }
    )
  }

  const iceServers: RTCIceServer[] = [...DEFAULT_STUN_SERVERS]
  const rawTurnUrls = process.env.TURN_SERVER_URLS || ''
  const turnUrls = sanitizeTurnUrls(rawTurnUrls)
  const turnSharedSecret = process.env.TURN_SHARED_SECRET?.trim()
  const turnStaticUser = process.env.TURN_USERNAME?.trim()
  const turnStaticCredential = process.env.TURN_CREDENTIAL?.trim()

  if (turnUrls.length > 0) {
    if (turnSharedSecret) {
      // RFC 8489 / coturn REST API ephemeral HMAC-SHA1 credential (valid for 2 hours)
      const ttlSeconds = 2 * 60 * 60
      const expiryUnix = Math.floor(Date.now() / 1000) + ttlSeconds
      const ephemeralUsername = `${expiryUnix}:${userId}`
      const ephemeralCredential = createHmac('sha1', turnSharedSecret)
        .update(ephemeralUsername)
        .digest('base64')

      iceServers.unshift({
        urls: turnUrls,
        username: ephemeralUsername,
        credential: ephemeralCredential,
      })
    } else if (turnStaticUser && turnStaticCredential) {
      iceServers.unshift({
        urls: turnUrls,
        username: turnStaticUser,
        credential: turnStaticCredential,
      })
    }
  }

  return NextResponse.json(
    {
      iceServers,
      ttlSeconds: 7200,
    },
    { headers: NO_STORE_HEADERS }
  )
}
