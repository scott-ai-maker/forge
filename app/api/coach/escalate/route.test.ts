import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'

const {
  getRequestAuthzMock,
  sendSmsMock,
  isWithinSmsQuietHoursMock,
  resendSendMock,
  insertMsgMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  sendSmsMock: vi.fn(),
  isWithinSmsQuietHoursMock: vi.fn(),
  resendSendMock: vi.fn(),
  insertMsgMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

vi.mock('@/lib/sms', () => ({
  sendSms: sendSmsMock,
  isWithinSmsQuietHours: isWithinSmsQuietHoursMock,
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSendMock }
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      insert: insertMsgMock,
    }),
  }),
}))

import { POST } from './route'

describe('/api/coach/escalate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    resetRateLimiterForTests()

    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-uuid-1', email: 'member@forge-athletic.app', user_metadata: {} },
      client: {
        role: 'client',
        status: 'active',
        full_name: 'Jordan Vance',
        designated_coach_id: 'coach-uuid-1',
      },
    })
    isWithinSmsQuietHoursMock.mockReturnValue(false)
    sendSmsMock.mockResolvedValue({ sent: true })
    resendSendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null })
    insertMsgMock.mockResolvedValue({ error: null })
  })

  it('rejects unauthenticated requests in production even when NEXT_PUBLIC_ALLOW_ANON_PREVIEW is true', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_ALLOW_ANON_PREVIEW', 'true')
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost:3000/api/coach/escalate', {
      method: 'POST',
      body: JSON.stringify({
        tierId: 'core_lab',
        question: 'Need a hotel room swap for squats',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when question is shorter than 3 characters', async () => {
    const req = new NextRequest('http://localhost:3000/api/coach/escalate', {
      method: 'POST',
      body: JSON.stringify({
        tierId: 'core_lab',
        question: 'hi',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('routes Core Lab ($19.99) escalations to 24-48h Direct Email and scrubs PII', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')

    const req = new NextRequest('http://localhost:3000/api/coach/escalate', {
      method: 'POST',
      body: JSON.stringify({
        tierId: 'core_lab',
        sourceContext: 'assistant_drawer',
        question: 'Can I swap goblet squats? Reach me at jordan.personal@gmail.com or 555-867-5309',
        telemetrySummary: {
          optPhase: 2,
          jointComfortScore: 76,
          readinessIndex: 84,
          postureFlags: ['forward head'],
          environmentProfile: 'hotel_room',
          expressModeActive: true,
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.channelUsed).toBe('email')
    expect(data.slaBadge).toBe('24–48h Email Window')
    expect(data.emailDispatched).toBe(true)
    expect(sendSmsMock).not.toHaveBeenCalled()

    const emailPayload = resendSendMock.mock.calls[0][0]
    expect(emailPayload.text).not.toContain('jordan.personal@gmail.com')
    expect(emailPayload.text).not.toContain('555-867-5309')
    expect(emailPayload.text).toContain('Phase 02 (20m Express ON)')
  })

  it('routes Coach Support ($199) to 24h Priority SLA SMS + in-app thread and overrides quiet hours for active safety flags', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'srv_test_key')
    vi.stubEnv('COACH_GORDON_SMS_NUMBER', '+15550001111')
    isWithinSmsQuietHoursMock.mockReturnValue(true)

    const req = new NextRequest('http://localhost:3000/api/coach/escalate', {
      method: 'POST',
      body: JSON.stringify({
        tierId: 'coach_support',
        sourceContext: 'safety_override',
        question: 'Anterior knee pinch during split squats on set 2.',
        telemetrySummary: {
          optPhase: 2,
          jointComfortScore: 45,
          readinessIndex: 70,
          activeExercise: 'Rear-Foot-Elevated Split Squat',
          safetyFlagActive: true,
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.channelUsed).toBe('sms_priority')
    expect(data.slaBadge).toBe('24h Priority SLA')
    expect(data.threadInserted).toBe(true)
    expect(data.smsDispatched).toBe(true)
    expect(data.quietHoursHeld).toBe(false)
    expect(insertMsgMock).toHaveBeenCalledTimes(1)
    expect(sendSmsMock).toHaveBeenCalledTimes(1)
  })

  it('enforces sliding-window rate limit on standard escalations while exempting safetyFlagActive escalations', async () => {
    for (let i = 0; i < 10; i++) {
      const okRes = await POST(
        new NextRequest('http://localhost:3000/api/coach/escalate', {
          method: 'POST',
          body: JSON.stringify({
            tierId: 'plus',
            question: `Routine travel check-in #${i + 1}`,
          }),
        })
      )
      expect(okRes.status).toBe(200)
    }

    const throttledRes = await POST(
      new NextRequest('http://localhost:3000/api/coach/escalate', {
        method: 'POST',
        body: JSON.stringify({
          tierId: 'plus',
          question: 'Routine travel check-in #11',
        }),
      })
    )
    expect(throttledRes.status).toBe(429)

    // Safety flag escalation MUST bypass rate limiting
    const urgentRes = await POST(
      new NextRequest('http://localhost:3000/api/coach/escalate', {
        method: 'POST',
        body: JSON.stringify({
          tierId: 'plus',
          sourceContext: 'safety_override',
          question: 'Sharp shoulder pinch during overhead press',
          telemetrySummary: { safetyFlagActive: true },
        }),
      })
    )
    expect(urgentRes.status).toBe(200)
  })
})
