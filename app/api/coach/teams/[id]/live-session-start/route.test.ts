import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

import { POST } from './route'

describe('POST /api/coach/teams/[id]/live-session-start (Disabled Team Live Studio)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('returns 410 Gone for coaches because Team Live Studio is permanently disabled', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1', email: 'coach@forge-athletic.app' },
      client: { role: 'coach' },
    })

    const req = new NextRequest('http://localhost/api/coach/teams/team-1/live-session-start', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'team-1' }) })
    expect(res.status).toBe(410)
    expect(res.headers.get('cache-control')).toContain('no-store')

    const body = await res.json()
    expect(body.teamStudioDisabled).toBe(true)
    expect(body.error).toContain('Team Live Studio is disabled')
  })
})
