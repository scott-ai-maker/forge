import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'

const { getRequestAuthzMock, isMasterCoachEmailMock, fetchTelemetryMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  isMasterCoachEmailMock: vi.fn(),
  fetchTelemetryMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    isMasterCoachEmail: isMasterCoachEmailMock,
  }
})

vi.mock('@/lib/enterprise-chatbots/telemetry', async () => {
  const actual = await vi.importActual<typeof import('@/lib/enterprise-chatbots/telemetry')>(
    '@/lib/enterprise-chatbots/telemetry'
  )
  return {
    ...actual,
    fetchEnterpriseTelemetrySnapshot: fetchTelemetryMock,
  }
})

import { GET, POST } from './route'

describe('/api/coach/enterprise-bots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimiterForTests()
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_GENAI_API_KEY
    fetchTelemetryMock.mockResolvedValue({
      generatedAt: '2026-11-22T12:00:00.000Z',
      dataSource: 'live_supabase',
      launchMode: 'prelaunch_waitlist',
      daysUntilGoLive: 43,
      goLiveDateFormatted: 'Monday, January 4, 2027',
      activeAssignedClients: 6,
      unassignedClients: 1,
      onboardingCompletedCount: 5,
      onboardingCompletionRatePct: 83,
      sessionsThisWeek: 4,
      attendanceRate30dPct: 95,
      lowCreditClientsCount: 1,
      inactive14dClientsCount: 1,
      unreadClientMessagesCount: 2,
      waitlistLeadsCount: 84,
      coachingApplicationsCount: 19,
      coachSupportCap: 15,
      coachSupportUtilizationPct: 40,
    })
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots', {
      method: 'GET',
    })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('grants Lisa Gordon (VP of Customer Success) HIPAA-isolated access to executive bots without requiring clinical coach role', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'lisa-1', email: 'Lisa.gordon1@outlook.com' },
      client: { id: 'lisa-1', role: 'client', status: 'active' },
    })
    isMasterCoachEmailMock.mockReturnValue(false)

    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'b2b-partnerships',
        message: 'Draft a 90-day corporate pilot QBR agenda.',
        deliverableMode: 'playbook',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.botId).toBe('b2b-partnerships')
  })

  it('rejects non-leadership client roles with 403', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'client-1', email: 'athlete@example.com' },
      client: { id: 'client-1', role: 'client', status: 'active' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'cfo-revenue',
        message: 'Show ARR targets',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns live aggregated telemetry and all 4 executive bots on GET for authenticated coach', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1', email: 'coach@forge-athletic.app' },
      client: { id: 'coach-1', role: 'coach', status: 'active' },
    })
    isMasterCoachEmailMock.mockReturnValue(true)

    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots', {
      method: 'GET',
    })
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.bots).toHaveLength(4)
    expect(body.telemetry.waitlistLeadsCount).toBe(84)
  })

  it('executes an executive chatbot brief on POST and returns structured deliverable', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1', email: 'coach@forge-athletic.app' },
      client: { id: 'coach-1', role: 'coach', status: 'active' },
    })
    isMasterCoachEmailMock.mockReturnValue(true)

    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'enterprise-ops',
        message: 'Generate our Massachusetts W-2 hiring compliance checklist.',
        deliverableMode: 'compliance_checklist',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.botId).toBe('enterprise-ops')
    expect(body.replyMarkdown).toContain('M.G.L. c. 149')
    expect(body.deliverableTitle).toContain('Ops & Legal')
  })

  it('validates botId and returns 400 on invalid payload', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1', email: 'coach@forge-athletic.app' },
      client: { id: 'coach-1', role: 'coach', status: 'active' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'invalid-bot',
        message: 'Hello',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
