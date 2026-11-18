import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthzError } from '@/lib/authz'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

import { GET } from './route'

describe('GET /api/webrtc/ice-servers (#30)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    resetRateLimiterForTests()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'athlete-uuid-42', email: 'athlete@forge-athletic.app' },
      client: { role: 'client', status: 'active' },
    })
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const res = await GET(new NextRequest('http://localhost:3000/api/webrtc/ice-servers'))
    expect(res.status).toBe(401)
  })

  it('mints short-lived HMAC-SHA1 TURN credentials and strips openrelay / port-80 plaintext TURN URLs', async () => {
    vi.stubEnv(
      'TURN_SERVER_URLS',
      'turns:turn.forge-athletic.app:443?transport=tcp,turn:openrelay.metered.ca:80,turn:turn.forge-athletic.app:80'
    )
    vi.stubEnv('TURN_SHARED_SECRET', 'super-secret-turn-hmac-key')

    const res = await GET(new NextRequest('http://localhost:3000/api/webrtc/ice-servers'))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(Array.isArray(body.iceServers)).toBe(true)
    const turnEntry = body.iceServers[0]
    expect(turnEntry.urls).toEqual(['turns:turn.forge-athletic.app:443?transport=tcp'])
    expect(turnEntry.username).toContain(':athlete-uuid-42')
    expect(typeof turnEntry.credential).toBe('string')
    expect(turnEntry.credential).not.toBe('super-secret-turn-hmac-key')
  })
})
