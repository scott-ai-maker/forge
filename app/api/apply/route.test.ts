import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const {
  insertMock,
  triggerLeadEmailAutomationMock,
  enforceRateLimitMock,
} = vi.hoisted(() => ({
  insertMock: vi.fn(),
  triggerLeadEmailAutomationMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: vi.fn().mockReturnValue({
      insert: insertMock,
    }),
  }),
}))

vi.mock('@/lib/marketing-email', () => ({
  triggerLeadEmailAutomation: triggerLeadEmailAutomationMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
  getClientIp: () => '127.0.0.1',
  getPositiveIntEnv: (_name: string, fallback: number) => fallback,
}))

const VALID_QUIZ_PAYLOAD = {
  email: 'athlete@example.com',
  firstName: 'Elena',
  goal: 'build_muscle',
  timeline: '1_to_3_months',
  trainingDays: '4',
  supportLevel: 'hybrid_monthly_calls',
  primaryObstacle: 'inconsistent_accountability',
  coachingHistory: 'no_first_time',
  budgetBand: '50_150',
  readiness: 'within_2_weeks',
  recommendedTier: 'hybrid',
}

describe('POST /api/apply', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    insertMock.mockResolvedValue({ error: null })
    triggerLeadEmailAutomationMock.mockResolvedValue(undefined)
    enforceRateLimitMock.mockResolvedValue({ allowed: true, resetAt: new Date().toISOString() })
  })

  it('returns 503 with no-store header if Supabase is not configured', async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const req = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify(VALID_QUIZ_PAYLOAD),
    })

    const res = await POST(req)
    expect(res.status).toBe(503)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  })

  it('returns 400 on malformed JSON payload instead of 500', async () => {
    const req = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: '{invalid-json',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    const json = await res.json()
    expect(json.error).toBe('Invalid JSON payload')
  })

  it('rejects missing required quiz fields and oversized first names', async () => {
    const missingFieldReq = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_QUIZ_PAYLOAD, timeline: '   ' }),
    })
    const missingRes = await POST(missingFieldReq)
    expect(missingRes.status).toBe(400)
    expect((await missingRes.json()).error).toContain('timeline')

    const longNameReq = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_QUIZ_PAYLOAD, firstName: 'A'.repeat(90) }),
    })
    const longNameRes = await POST(longNameReq)
    expect(longNameRes.status).toBe(400)
    expect((await longNameRes.json()).error).toContain('First name is too long')
  })

  it('silently discards honeypot bot submissions without inserting or emailing', async () => {
    const req = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify({
        ...VALID_QUIZ_PAYLOAD,
        honeypot: 'http://spam-bot.invalid',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(insertMock).not.toHaveBeenCalled()
    expect(triggerLeadEmailAutomationMock).not.toHaveBeenCalled()
  })

  it('returns 400 with typo suggestion on mistyped email domain', async () => {
    const req = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify({
        ...VALID_QUIZ_PAYLOAD,
        email: 'elena@gmial.com',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.suggestion).toBe('elena@gmail.com')
  })

  it('returns 429 with Retry-After when rate limit is exceeded', async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      resetAt: new Date(Date.now() + 45_000).toISOString(),
    })

    const req = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify(VALID_QUIZ_PAYLOAD),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('sanitizes text fields, inserts coaching application, and triggers apply email sequence', async () => {
    const req = new NextRequest('http://localhost/api/apply', {
      method: 'POST',
      body: JSON.stringify({
        ...VALID_QUIZ_PAYLOAD,
        firstName: '  Elena <img src=x>  ',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'athlete@example.com',
        first_name: 'Elena img src=x',
        goal: 'build_muscle',
        recommended_tier: 'hybrid',
        source: 'apply_quiz',
      })
    )

    expect(triggerLeadEmailAutomationMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: 'athlete@example.com',
        firstName: 'Elena img src=x',
        source: 'apply',
        recommendedTier: 'hybrid',
      })
    )
  })
})
