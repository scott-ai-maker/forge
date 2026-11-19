import fs from 'node:fs'
import path from 'node:path'
import { NextRequest } from 'next/server'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { getClientIp, enforceRateLimit } from '@/lib/rate-limit'
import { protectCSRF } from '@/lib/csrf'
import { createUnsubscribeToken } from '@/lib/marketing-email'
import {
  assertAuthorizedCoachProvisioning,
  isAuthorizedW2OrFounderCoachEmail,
} from '@/lib/coach-w2-gatekeeper'
import { isFullCompDiscountSafelyScoped, type DiscountCodeRecord } from '@/lib/discount-codes'
import { trackMarketingEvent } from '@/lib/marketing-analytics'

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB unreachable' } }),
  }),
}))

describe('Tier 4 & Tier 5 Security, Privacy & App Store Hardening (#41-#56)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('ships Apple PrivacyInfo.xcprivacy manifests for both iOS and watchOS targets (#41)', () => {
    const iosManifest = fs.readFileSync(
      path.join(process.cwd(), 'ios/App/App/PrivacyInfo.xcprivacy'),
      'utf8'
    )
    const watchManifest = fs.readFileSync(
      path.join(process.cwd(), 'ios/App/ForgeWatch/PrivacyInfo.xcprivacy'),
      'utf8'
    )

    expect(iosManifest).toContain('NSPrivacyAccessedAPICategoryUserDefaults')
    expect(iosManifest).toContain('CA92.1')
    expect(iosManifest).toContain('NSPrivacyCollectedDataTypeHealth')
    expect(watchManifest).toContain('NSPrivacyCollectedDataTypeFitness')
  })

  it('prefers trusted Vercel edge IP headers over spoofable leftmost x-forwarded-for (#46)', () => {
    const req = new NextRequest('https://forge-athletic.app/api/test', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 198.51.100.77',
        'x-vercel-forwarded-for': '203.0.113.9',
      },
    })
    expect(getClientIp(req)).toBe('203.0.113.9')

    const proxyChainReq = new NextRequest('https://forge-athletic.app/api/test', {
      headers: {
        'x-forwarded-for': '1.2.3.4, 198.51.100.77',
      },
    })
    expect(getClientIp(proxyChainReq)).toBe('198.51.100.77')
  })

  it('enforces in-memory sliding-window fallback instead of failing open when Supabase RPC errors (#46)', async () => {
    const first = await enforceRateLimit({
      key: 'test-subject-fallback',
      limit: 2,
      windowSeconds: 60,
      route: '/api/test-fallback',
      dimension: 'ip',
    })
    const second = await enforceRateLimit({
      key: 'test-subject-fallback',
      limit: 2,
      windowSeconds: 60,
      route: '/api/test-fallback',
      dimension: 'ip',
    })
    const third = await enforceRateLimit({
      key: 'test-subject-fallback',
      limit: 2,
      windowSeconds: 60,
      route: '/api/test-fallback',
      dimension: 'ip',
    })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
  })

  it('rejects spoofed x-forwarded-host CSRF bypasses when origin mismatches server origin (#46)', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = new NextRequest('https://forge-athletic.app/api/account/settings', {
      method: 'POST',
      headers: {
        origin: 'https://evil.attacker.example',
        'x-forwarded-host': 'evil.attacker.example',
      },
    })

    const res = await protectCSRF(req)
    expect(res.valid).toBe(false)
  })

  it('throws in production when unsubscribe HMAC secrets are missing instead of using a static fallback (#48)', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UNSUBSCRIBE_HMAC_SECRET', '')
    vi.stubEnv('MARKETING_CRON_SECRET', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    expect(() => createUnsubscribeToken('athlete@example.com')).toThrow(/Missing UNSUBSCRIBE_HMAC_SECRET/)
  })

  it('enforces Massachusetts W-2 Associate Coach gatekeeping (#50)', () => {
    expect(isAuthorizedW2OrFounderCoachEmail('coach@forge-athletic.app')).toBe(true)
    expect(isAuthorizedW2OrFounderCoachEmail('scott@forge-athletic.app')).toBe(true)
    expect(isAuthorizedW2OrFounderCoachEmail('unverified-1099@example.com')).toBe(false)

    expect(() => assertAuthorizedCoachProvisioning('unverified-1099@example.com')).toThrow(
      /M\.G\.L\. c\. 149, § 148B/
    )

    vi.stubEnv('AUTHORIZED_W2_COACH_EMAILS', 'w2coach@forge-athletic.app')
    expect(isAuthorizedW2OrFounderCoachEmail('w2coach@forge-athletic.app')).toBe(true)
  })

  it('removes public internal QA catalog and credential JSON exposure (#51) and strips gtag (#52)', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public/exercise-audit.html'))).toBe(false)
    expect(fs.existsSync(path.join(process.cwd(), 'public/sms-optin-proof.png'))).toBe(false)
    expect(
      fs.existsSync(path.join(process.cwd(), 'public/documents/credentials/nasm-cpt-credential.json'))
    ).toBe(false)

    const analyticsSource = fs.readFileSync(
      path.join(process.cwd(), 'lib/marketing-analytics.ts'),
      'utf8'
    )
    expect(analyticsSource).not.toContain('window.gtag')
    expect(() => trackMarketingEvent('test_event', { ok: true })).not.toThrow()
  })

  it('blocks unrestricted 100%-off promo codes while permitting client-bound or capped comp codes (#33)', () => {
    const baseFullComp: DiscountCodeRecord = {
      id: 'dc-1',
      code: 'VIPDEMO',
      description: 'Legacy demo pass',
      discount_type: 'percent',
      discount_value: 100,
      is_active: true,
      max_redemptions: null,
      redemptions_count: 0,
      starts_at: '2026-01-01T00:00:00Z',
      expires_at: null,
      applies_to_package_ids: null,
      restricted_client_id: null,
    }

    expect(isFullCompDiscountSafelyScoped(baseFullComp, 29900)).toBe(false)
    expect(
      isFullCompDiscountSafelyScoped({ ...baseFullComp, restricted_client_id: 'client-uuid-1' }, 29900)
    ).toBe(true)
    expect(isFullCompDiscountSafelyScoped({ ...baseFullComp, max_redemptions: 1 }, 29900)).toBe(true)
    expect(isFullCompDiscountSafelyScoped({ ...baseFullComp, discount_value: 25 }, 29900)).toBe(true)
  })
})
