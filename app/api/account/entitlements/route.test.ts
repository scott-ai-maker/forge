import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  getLegacyRetainerClient,
  hasIndefiniteAllFeaturesAccess,
  isInternalTeamOrDemoAccountEmail,
  isLisaGordonEmail,
  isScottGordonEmail,
} from '@/lib/authz'

const { getRequestAuthzMock, loadClientEntitlementsMock, resolveClientMembershipStateMock } =
  vi.hoisted(() => ({
    getRequestAuthzMock: vi.fn(),
    loadClientEntitlementsMock: vi.fn(),
    resolveClientMembershipStateMock: vi.fn(),
  }))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/addon-entitlements', async () => {
  const actual = await vi.importActual<typeof import('@/lib/addon-entitlements')>(
    '@/lib/addon-entitlements'
  )
  return {
    ...actual,
    loadClientEntitlements: loadClientEntitlementsMock,
    resolveClientMembershipState: resolveClientMembershipStateMock,
  }
})

import { GET } from './route'

describe('/api/account/entitlements — Executive Indefinite All-Access & Legacy Client Classification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grants indefinite all-features access to Lisa Gordon across both accounts while keeping HIPAA client role isolation', async () => {
    for (const email of ['lisa.gordon1@outlook.com', 'da_mona_lisa@msn.com', 'lisa@forge-athletic.app']) {
      expect(isLisaGordonEmail(email)).toBe(true)
      expect(hasIndefiniteAllFeaturesAccess(email, 'client')).toBe(true)
      expect(isInternalTeamOrDemoAccountEmail(email)).toBe(true)

      getRequestAuthzMock.mockResolvedValueOnce({
        user: { id: 'lisa-id', email },
        client: { id: 'lisa-id', role: 'client', status: 'active', email },
      })

      const res = await GET(new NextRequest('http://localhost:3000/api/account/entitlements'))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.tierId).toBe('coach_support')
      expect(body.hasActiveMembership).toBe(true)
      expect(body.indefiniteAccess).toBe(true)
      expect(body.isExecutiveTeam).toBe(true)
      expect(body.role).toBe('client') // Preserves HIPAA clinical isolation
      expect(body.features['video-review']).toEqual({ active: true, expiresAt: null, usesRemaining: null })
      expect(body.features.nutrition).toEqual({ active: true, expiresAt: null, usesRemaining: null })
      expect(body.features.travel).toEqual({ active: true, expiresAt: null, usesRemaining: null })
    }
  })

  it('grants indefinite all-features access to Scott Gordon across coach and personal accounts', async () => {
    for (const [email, role] of [
      ['coach@forge-athletic.app', 'coach'],
      ['scott@forge-athletic.app', 'coach'],
      ['5c077.60rd0n@gmail.com', 'client'],
    ] as const) {
      expect(isScottGordonEmail(email)).toBe(true)
      expect(hasIndefiniteAllFeaturesAccess(email, role)).toBe(true)
      expect(isInternalTeamOrDemoAccountEmail(email)).toBe(true)

      getRequestAuthzMock.mockResolvedValueOnce({
        user: { id: 'scott-id', email },
        client: { id: 'scott-id', role, status: 'active', email },
      })

      const res = await GET(new NextRequest('http://localhost:3000/api/account/entitlements'))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.tierId).toBe('coach_support')
      expect(body.hasActiveMembership).toBe(true)
      expect(body.indefiniteAccess).toBe(true)
      expect(body.isExecutiveTeam).toBe(true)
    }
  })

  it('classifies Jen (rainvilj@hotmail.com) as a longtime paying client at $400/mo and NOT internal executive team', async () => {
    const legacy = getLegacyRetainerClient('rainvilj@hotmail.com')
    expect(legacy).not.toBeNull()
    expect(legacy?.monthlyRateUsd).toBe(400)
    expect(isInternalTeamOrDemoAccountEmail('rainvilj@hotmail.com')).toBe(false)
    expect(hasIndefiniteAllFeaturesAccess('rainvilj@hotmail.com', 'client')).toBe(false)

    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'jen-id', email: 'rainvilj@hotmail.com' },
      client: { id: 'jen-id', role: 'client', status: 'active', email: 'rainvilj@hotmail.com' },
    })
    loadClientEntitlementsMock.mockResolvedValueOnce([
      {
        id: 'e1',
        addon_id: 'forge-transformation-direct',
        feature: 'nutrition',
        uses_total: null,
        uses_remaining: null,
        expires_at: '2126-11-22T00:00:00.000Z',
      },
    ])
    resolveClientMembershipStateMock.mockResolvedValueOnce({
      tierId: 'coach_support',
      hasActiveMembership: true,
    })

    const res = await GET(new NextRequest('http://localhost:3000/api/account/entitlements'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.tierId).toBe('coach_support')
    expect(body.hasActiveMembership).toBe(true)
    expect(body.isExecutiveTeam).toBe(false)
  })
})
