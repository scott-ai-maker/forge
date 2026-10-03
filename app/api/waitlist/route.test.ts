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

describe('POST /api/waitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    insertMock.mockResolvedValue({ error: null })
    triggerLeadEmailAutomationMock.mockResolvedValue(undefined)
    enforceRateLimitMock.mockResolvedValue({ allowed: true, resetAt: new Date().toISOString() })
  })

  it('rejects if Supabase is not configured', async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(503)

    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  })

  it('silently discards bot submissions with honeypot filled', async () => {
    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email: 'spammer@bot.org',
        honeypot: 'spam value',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(insertMock).not.toHaveBeenCalled()
    expect(triggerLeadEmailAutomationMock).not.toHaveBeenCalled()
  })

  it('rejects invalid email formats', async () => {
    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email: 'not-a-valid-email',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })

  it('accepts founding cohort intake submission and passes cohort metadata to email automation', async () => {
    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email: 'founder@gordonadvisory.com',
        firstName: 'Alexander Vance',
        trainingLevel: 'intermediate',
        primaryGoal: '[Founding Intake] Goal: structural_longevity | Phone: +1 617 555 0199 | Notes: None',
        source: 'founding_cohort_intake',
        assignedCohortNumber: 11,
        phone: '+1 617 555 0199',
        profileType: 'executive',
        honeypot: '',
        startTimeMs: Date.now() - 5000,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'founder@gordonadvisory.com',
        first_name: 'Alexander Vance',
        source: 'founding_cohort_intake',
      })
    )

    expect(triggerLeadEmailAutomationMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: 'founder@gordonadvisory.com',
        firstName: 'Alexander Vance',
        source: 'founding_cohort',
        cohortReservationNumber: 11,
        phone: '+1 617 555 0199',
        profileType: 'executive',
      })
    )
  })

  it('accepts standard waitlist submission with default waitlist source', async () => {
    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email: 'athlete@gmail.com',
        firstName: 'Jordan',
        honeypot: '',
        startTimeMs: Date.now() - 5000,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(triggerLeadEmailAutomationMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        email: 'athlete@gmail.com',
        firstName: 'Jordan',
        source: 'waitlist',
      })
    )
  })

  it('handles duplicate waitlist insert (error code 23505) without triggering duplicate email automation', async () => {
    insertMock.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        honeypot: '',
        startTimeMs: Date.now() - 5000,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(triggerLeadEmailAutomationMock).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limit is exceeded', async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      resetAt: new Date(Date.now() + 60000).toISOString(),
    })

    const req = new NextRequest('http://localhost/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        honeypot: '',
        startTimeMs: Date.now() - 5000,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})

