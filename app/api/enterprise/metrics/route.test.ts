import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const { getRequestAuthzMock, fetchBiMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  fetchBiMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/enterprise-chatbots/metrics', async () => {
  const actual = await vi.importActual<typeof import('@/lib/enterprise-chatbots/metrics')>(
    '@/lib/enterprise-chatbots/metrics'
  )
  return {
    ...actual,
    fetchEnterpriseBiDashboard: fetchBiMock,
  }
})

import { GET } from './route'

const SAMPLE_BI = {
  telemetry: {
    generatedAt: '2026-11-22T14:00:00.000Z',
    dataSource: 'live_supabase' as const,
    launchMode: 'prelaunch_waitlist' as const,
    daysUntilGoLive: 43,
    goLiveDateFormatted: 'Monday, January 4, 2027',
    activeAssignedClients: 8,
    unassignedClients: 2,
    onboardingCompletedCount: 7,
    onboardingCompletionRatePct: 88,
    sessionsThisWeek: 6,
    attendanceRate30dPct: 94,
    lowCreditClientsCount: 1,
    inactive14dClientsCount: 1,
    unreadClientMessagesCount: 2,
    waitlistLeadsCount: 120,
    coachingApplicationsCount: 28,
    coachSupportCap: 15,
    coachSupportUtilizationPct: 53,
  },
  healthScore100: 89,
  activeRetention14dPct: 88,
  waitlistToApplicationPct: 23,
  waitlistLast7d: 18,
  waitlistLast30d: 64,
  estimatedMonthlyRunRateUsd: 1192,
  estimatedAnnualRunRateUsd: 14304,
  year1ArrTargetUsd: 585000,
  year2ArrTargetUsd: 1850000,
  year3ArrTargetUsd: 4750000,
  year1ProgressPct: 2,
  targetEbitdaMarginPct: 77.8,
  dailySeries14d: [],
  revenueRoadmap: [],
}

describe('/api/enterprise/metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ENTERPRISE_METRICS_SCRAPE_TOKEN
    fetchBiMock.mockResolvedValue(SAMPLE_BI)
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/enterprise/metrics')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('rejects standard non-leadership client accounts with 403', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'athlete-1', email: 'athlete@example.com' },
      client: { id: 'athlete-1', role: 'client', status: 'active' },
    })
    const req = new NextRequest('http://localhost:3000/api/enterprise/metrics')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns zero-PII JSON BI metrics for Lisa Gordon', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'lisa-1', email: 'Lisa.gordon1@outlook.com' },
      client: { id: 'lisa-1', role: 'client', status: 'active' },
    })
    const req = new NextRequest('http://localhost:3000/api/enterprise/metrics')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.metrics.healthScore100).toBe(89)
    expect(body.metrics.telemetry.waitlistLeadsCount).toBe(120)
  })

  it('exports valid Prometheus / OpenMetrics text format for Grafana Cloud via scrape token', async () => {
    process.env.ENTERPRISE_METRICS_SCRAPE_TOKEN = 'super-secret-grafana-scrape-token-2026'
    const req = new NextRequest('http://localhost:3000/api/enterprise/metrics?format=prometheus', {
      headers: {
        Authorization: 'Bearer super-secret-grafana-scrape-token-2026',
      },
    })
    const res = await GET(req)
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(text).toContain('forge_active_clients 8')
    expect(text).toContain('forge_waitlist_leads_total 120')
    expect(text).toContain('forge_executive_health_score 89')
  })
})
