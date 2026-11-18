import type { NextRequest } from 'next/server'

export interface SlidingWindowRateLimitOptions {
  namespace: string
  subjectKey: string
  maxRequests: number
  windowMs: number
  nowMs?: number
}

export interface SlidingWindowRateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  limit: number
}

const buckets = new Map<string, number[]>()
const MAX_TRACKED_BUCKETS = 2000

export function resolveRequestSubjectKey(
  req: NextRequest,
  authenticatedUserId?: string | null
): string {
  if (authenticatedUserId && authenticatedUserId.trim()) {
    return `uid:${authenticatedUserId.trim()}`
  }
  const vercelIp = req.headers.get('x-vercel-forwarded-for')
  if (vercelIp) {
    const trustedIp = vercelIp.split(',')[0]?.trim()
    if (trustedIp) return `ip:${trustedIp}`
  }
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return `ip:${realIp}`
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded.split(',').map(part => part.trim()).filter(Boolean)
    const lastIp = parts[parts.length - 1]
    if (lastIp) return `ip:${lastIp}`
  }
  return 'ip:local'
}

export function checkSlidingWindowRateLimit(
  options: SlidingWindowRateLimitOptions
): SlidingWindowRateLimitResult {
  const now = options.nowMs ?? Date.now()
  const cutoff = now - options.windowMs
  const bucketKey = `${options.namespace}:${options.subjectKey}`

  const existing = buckets.get(bucketKey) || []
  const activeTimestamps = existing.filter(ts => ts > cutoff)

  if (activeTimestamps.length >= options.maxRequests) {
    buckets.set(bucketKey, activeTimestamps)
    const oldestInWindow = activeTimestamps[0] ?? now
    const msUntilSlotFrees = Math.max(1000, oldestInWindow + options.windowMs - now)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(msUntilSlotFrees / 1000),
      limit: options.maxRequests,
    }
  }

  activeTimestamps.push(now)
  if (!buckets.has(bucketKey) && buckets.size >= MAX_TRACKED_BUCKETS) {
    const oldestBucketKey = buckets.keys().next().value
    if (oldestBucketKey) buckets.delete(oldestBucketKey)
  }
  buckets.set(bucketKey, activeTimestamps)

  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - activeTimestamps.length),
    retryAfterSeconds: 0,
    limit: options.maxRequests,
  }
}

export function resetRateLimiterForTests(): void {
  buckets.clear()
}
