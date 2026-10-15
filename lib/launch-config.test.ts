import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getGoLiveDate,
  isSiteUnmasked,
  calculateTimeRemaining,
  DEFAULT_GO_LIVE_DATE_ISO,
} from './launch-config'

describe('lib/launch-config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  it('defaults to Friday November 20, 2026 at 06:00:00 EST', () => {
    delete process.env.NEXT_PUBLIC_GO_LIVE_DATE
    const date = getGoLiveDate()
    expect(date.toISOString()).toBe(new Date(DEFAULT_GO_LIVE_DATE_ISO).toISOString())
  })

  it('respects NEXT_PUBLIC_GO_LIVE_DATE when provided', () => {
    process.env.NEXT_PUBLIC_GO_LIVE_DATE = '2026-12-01T00:00:00Z'
    const date = getGoLiveDate()
    expect(date.toISOString()).toBe('2026-12-01T00:00:00.000Z')
  })

  it('detects unmasked state when NEXT_PUBLIC_SITE_UNMASKED=true', () => {
    process.env.NEXT_PUBLIC_SITE_UNMASKED = 'true'
    expect(isSiteUnmasked()).toBe(true)
  })

  it('detects unmasked state when preview parameter is supplied', () => {
    delete process.env.NEXT_PUBLIC_SITE_UNMASKED
    expect(isSiteUnmasked('true')).toBe(true)
    expect(isSiteUnmasked('1')).toBe(true)
    expect(isSiteUnmasked('unmask')).toBe(true)
    expect(isSiteUnmasked(null)).toBe(false)
  })

  it('correctly computes time remaining and triggers isLive when surpassed', () => {
    const target = new Date('2026-11-20T06:00:00Z')
    const before = new Date('2026-11-19T05:30:15Z')

    const remaining = calculateTimeRemaining(target, before)
    expect(remaining.isLive).toBe(false)
    expect(remaining.days).toBe(1)
    expect(remaining.hours).toBe(0)
    expect(remaining.minutes).toBe(29)
    expect(remaining.seconds).toBe(45)

    const after = new Date('2026-11-20T06:00:01Z')
    const expired = calculateTimeRemaining(target, after)
    expect(expired.isLive).toBe(true)
    expect(expired.days).toBe(0)
    expect(expired.totalMs).toBe(0)
  })
})
