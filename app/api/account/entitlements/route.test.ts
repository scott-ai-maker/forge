import fs from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from './route'
import {
  inferForgeTierFromPackageNameClient,
  tierIdToForgePackageId,
} from '@/lib/tierEntitlements'

describe('GET /api/account/entitlements & QA Tier Preview Hardening (#20)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('resolves DB-verified Plus/Coach Support tier and disables allowQaPreview for production client accounts', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'client-paid-1' },
      client: { role: 'client' },
    })

    supabaseAdminMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'client_addon_entitlements') {
          return {
            select: () => ({
              eq: () => ({
                gt: () => ({
                  order: async () => ({
                    data: [
                      {
                        id: 'ent-1',
                        addon_id: 'forge-pro-athlete',
                        feature: 'video-review',
                        uses_total: 4,
                        uses_remaining: 3,
                        expires_at: '2099-01-01T00:00:00.000Z',
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'client_packages') {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      package_name: 'Plus',
                      sessions_remaining: 0,
                      expires_at: null,
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      },
    }))

    const req = new NextRequest('https://forge-athletic.app/api/account/entitlements')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tierId).toBe('plus')
    expect(body.role).toBe('client')
    expect(body.allowQaPreview).toBe(false)
    expect(body.features['video-review']).toMatchObject({
      active: true,
      usesRemaining: 3,
    })
  })

  it('enables allowQaPreview and coach_support tier for authenticated coach accounts in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1' },
      client: { role: 'coach' },
    })

    const req = new NextRequest('https://forge-athletic.app/api/account/entitlements')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.tierId).toBe('coach_support')
    expect(body.role).toBe('coach')
    expect(body.allowQaPreview).toBe(true)
  })

  it('maps package names and Stripe package IDs accurately and strips mock localStorage upgrades from production UI', () => {
    expect(inferForgeTierFromPackageNameClient('Core', 0)).toBe('core_lab')
    expect(inferForgeTierFromPackageNameClient('Plus', 0)).toBe('plus')
    expect(inferForgeTierFromPackageNameClient('Coach Support', 0)).toBe('coach_support')
    expect(inferForgeTierFromPackageNameClient('Core', 2)).toBe('coach_support')

    expect(tierIdToForgePackageId('core_lab')).toBe('forge-core')
    expect(tierIdToForgePackageId('plus')).toBe('forge-pro-athlete')
    expect(tierIdToForgePackageId('coach_support')).toBe('forge-transformation-direct')

    const repoRoot = process.cwd()
    const switcherSrc = fs.readFileSync(
      path.join(repoRoot, 'components/settings/TierPreviewSwitcher.tsx'),
      'utf8'
    )
    const upgradeModalSrc = fs.readFileSync(
      path.join(repoRoot, 'components/packages/TierUpgradeModal.tsx'),
      'utf8'
    )
    const authFormSrc = fs.readFileSync(
      path.join(repoRoot, 'components/auth/AuthForm.tsx'),
      'utf8'
    )

    expect(switcherSrc).toContain('if (!allowQaPreview)')
    expect(upgradeModalSrc).toContain("fetch('/api/stripe/checkout'")
    expect(upgradeModalSrc).toContain('autoRenewalConsent: true')
    expect(upgradeModalSrc).not.toContain('setStoredTierId(')
    expect(authFormSrc).not.toContain('setStoredTierId(')
  })
})
