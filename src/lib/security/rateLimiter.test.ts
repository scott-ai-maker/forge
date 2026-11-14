import { beforeEach, describe, expect, it } from 'vitest'
import {
  checkSlidingWindowRateLimit,
  resetRateLimiterForTests,
} from './rateLimiter'

describe('checkSlidingWindowRateLimit', () => {
  beforeEach(() => {
    resetRateLimiterForTests()
  })

  it('allows requests up to maxRequests within windowMs and blocks excess with Retry-After', () => {
    const t0 = 1_700_000_000_000
    for (let i = 0; i < 3; i++) {
      const res = checkSlidingWindowRateLimit({
        namespace: 'voice_tts',
        subjectKey: 'uid:member-1',
        maxRequests: 3,
        windowMs: 60_000,
        nowMs: t0 + i * 1000,
      })
      expect(res.allowed).toBe(true)
      expect(res.remaining).toBe(2 - i)
    }

    const blocked = checkSlidingWindowRateLimit({
      namespace: 'voice_tts',
      subjectKey: 'uid:member-1',
      maxRequests: 3,
      windowMs: 60_000,
      nowMs: t0 + 5_000,
    })
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBe(55)

    // Once window advances past oldest timestamp, capacity re-opens
    const reopened = checkSlidingWindowRateLimit({
      namespace: 'voice_tts',
      subjectKey: 'uid:member-1',
      maxRequests: 3,
      windowMs: 60_000,
      nowMs: t0 + 60_500,
    })
    expect(reopened.allowed).toBe(true)
  })

  it('isolates quotas across namespaces and users', () => {
    checkSlidingWindowRateLimit({
      namespace: 'voice_tts',
      subjectKey: 'uid:a',
      maxRequests: 1,
      windowMs: 60_000,
    })
    const otherUser = checkSlidingWindowRateLimit({
      namespace: 'voice_tts',
      subjectKey: 'uid:b',
      maxRequests: 1,
      windowMs: 60_000,
    })
    const otherNamespace = checkSlidingWindowRateLimit({
      namespace: 'coach_ai',
      subjectKey: 'uid:a',
      maxRequests: 1,
      windowMs: 60_000,
    })
    expect(otherUser.allowed).toBe(true)
    expect(otherNamespace.allowed).toBe(true)
  })
})
