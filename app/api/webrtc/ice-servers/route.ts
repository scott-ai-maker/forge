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
  let turnRelayConfigured = false

  // Option A: Cloudflare Calls TURN API (global Anycast TURN, 1 TB/mo free tier, ephemeral credentials)
  const cfTurnTokenId = process.env.CLOUDFLARE_TURN_TOKEN_ID?.trim()
  const cfTurnApiToken = process.env.CLOUDFLARE_TURN_API_TOKEN?.trim()
  if (cfTurnTokenId && cfTurnApiToken) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 1500)
      try {
        const cfRes = await fetch(
          `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(cfTurnTokenId)}/credentials/generate-ice-servers`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfTurnApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ttl: 7200 }),
            signal: controller.signal,
          }
        )
        if (cfRes.ok) {
          const cfJson = (await cfRes.json()) as { iceServers?: RTCIceServer[] | RTCIceServer }
          const rawCfServers = Array.isArray(cfJson?.iceServers)
            ? cfJson.iceServers
            : cfJson?.iceServers
              ? [cfJson.iceServers]
              : []
          const cfServers: RTCIceServer[] = []
          for (const server of rawCfServers) {
            const urls = Array.isArray(server.urls) ? server.urls : [server.urls]
            const safeUrls = sanitizeTurnUrls(urls.join(','))
            if (safeUrls.length > 0) {
              cfServers.push({ ...server, urls: safeUrls })
            }
          }
          if (cfServers.length > 0) {
            iceServers.unshift(...cfServers)
            turnRelayConfigured = cfServers.some(s => {
              const urls = Array.isArray(s.urls) ? s.urls : [s.urls]
              return urls.some(u => /^turns?:/i.test(u))
            })
          }
        }
      } finally {
        clearTimeout(timer)
      }
    } catch {
      // Non-fatal: fall through to configured TURN_SERVER_URLS or vetted STUN
    }
  }

  // Option B: Self-hosted coturn / Twilio / Metered ephemeral HMAC or authenticated TURN credentials
  const rawTurnUrls = process.env.TURN_SERVER_URLS || ''
  const turnUrls = sanitizeTurnUrls(rawTurnUrls)
  const turnSharedSecret = process.env.TURN_SHARED_SECRET?.trim()
  const turnStaticUser = process.env.TURN_USERNAME?.trim()
  const turnStaticCredential = process.env.TURN_CREDENTIAL?.trim()

  if (!turnRelayConfigured && turnUrls.length > 0) {
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
      turnRelayConfigured = true
    } else if (turnStaticUser && turnStaticCredential) {
      iceServers.unshift({
        urls: turnUrls,
        username: turnStaticUser,
        credential: turnStaticCredential,
      })
      turnRelayConfigured = true
    }
  }

  return NextResponse.json(
    {
      iceServers,
      turnRelayConfigured,
      ttlSeconds: 7200,
    },
    { headers: NO_STORE_HEADERS }
  )
}
