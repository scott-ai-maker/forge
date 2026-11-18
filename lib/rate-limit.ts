import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkSlidingWindowRateLimit } from '@/src/lib/security/rateLimiter'

type RpcRow = {
  allowed: boolean
  remaining: number
  reset_at: string
  current_count: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: string
  currentCount: number
}

export function getPositiveIntEnv(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return parsed
}

export function getClientIp(req: NextRequest) {
  // Prefer platform-trusted Vercel edge IP headers before spoofable x-forwarded-for hops
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    const trusted = vercelIp.split(',')[0]?.trim()
    if (trusted) return trusted
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map(part => part.trim()).filter(Boolean)
    // Use rightmost non-empty proxy-appended hop when untrusted chains are present
    const last = parts[parts.length - 1]
    if (last) return last
  }

  return 'unknown'
}

export async function enforceRateLimit(params: {
  key: string
  limit: number
  windowSeconds: number
  route: string
  dimension: string
}): Promise<RateLimitResult> {
  let data: unknown
  let error: { message?: string } | null = null

  try {
    const admin = supabaseAdmin()
    const res = await admin.rpc('check_rate_limit', {
      p_key: params.key,
      p_limit: params.limit,
      p_window_seconds: params.windowSeconds,
    })
    data = res.data
    error = res.error
  } catch (initErr) {
    error = { message: initErr instanceof Error ? initErr.message : 'Failed to connect to rate limit store' }
  }

  if (error || !Array.isArray(data) || data.length === 0) {
    console.error('[rate-limit] rpc failure — enforcing in-memory sliding-window fallback', {
      route: params.route,
      dimension: params.dimension,
      error: error?.message ?? 'Missing rate limit RPC response',
    })
    const fallback = checkSlidingWindowRateLimit({
      namespace: `rpc-fallback:${params.route}:${params.dimension}`,
      subjectKey: params.key,
      maxRequests: params.limit,
      windowMs: params.windowSeconds * 1000,
    })
    return {
      allowed: fallback.allowed,
      remaining: fallback.remaining,
      resetAt: new Date(Date.now() + fallback.retryAfterSeconds * 1000).toISOString(),
      currentCount: Math.max(0, params.limit - fallback.remaining),
    }
  }

  const row = data[0] as RpcRow
  if (!row.allowed) {
    console.warn('[rate-limit] blocked', {
      route: params.route,
      dimension: params.dimension,
      key: params.key,
      limit: params.limit,
      currentCount: row.current_count,
      resetAt: row.reset_at,
    })
  }

  return {
    allowed: Boolean(row.allowed),
    remaining: Number(row.remaining ?? 0),
    resetAt: row.reset_at,
    currentCount: Number(row.current_count ?? 0),
  }
}
