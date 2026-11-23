import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, dispatchTeamMock, enforceRateLimitMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  dispatchTeamMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/teams-server', () => ({
  dispatchTeamLiveSessionAlert: dispatchTeamMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

import { POST } from './route'

describe('POST /api/coach/teams/[id]/live-session-start (Re-Enabled Team Live Studio with Safety Gates)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enforceRateLimitMock.mockResolvedValue({ allowed: true })
  })

  it('rejects non-coach callers with 403 Forbidden', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'client-1', email: 'athlete@forge.app' },
      client: { role: 'client' },
    })

    const req = new NextRequest('http://localhost/api/coach/teams/team-1/live-session-start', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'team-1' }) })
    expect(res.status).toBe(403)
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('dispatches live squad alerts for assigned coaches and reports any Phase 0 medical hold skips', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1', email: 'coach@forge-athletic.app' },
      client: { role: 'coach' },
    })
    dispatchTeamMock.mockResolvedValueOnce({
      success: true,
      notifiedCount: 4,
      skippedMedicalHoldCount: 1,
      teamName: 'Executive Core Squad',
    })

    const req = new NextRequest('http://localhost/api/coach/teams/team-1/live-session-start', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'team-1' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('no-store')

    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.notifiedCount).toBe(4)
    expect(body.skippedMedicalHoldCount).toBe(1)
    expect(body.teamName).toBe('Executive Core Squad')
    expect(body.message).toContain('Phase 0 medical clearance hold')
  })
})
