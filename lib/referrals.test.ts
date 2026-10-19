import { describe, it, expect, vi } from 'vitest'
import {
  normalizeReferralCode,
  generateReferralCode,
  generateDeterministicReferralCode,
  maskEmail,
  calculateMilestoneProgress,
  getOrCreateClientReferralCode,
  getClientReferralDashboard,
  validateReferralCode,
  attributeReferralSignup,
  processReferralConversion,
  REFERRAL_MILESTONES,
} from '@/lib/referrals'

vi.mock('@/lib/notifications', () => ({
  notifyUser: vi.fn().mockResolvedValue({ channels: [] }),
}))

describe('lib/referrals', () => {
  describe('normalizeReferralCode', () => {
    it('normalizes spaces and converts to uppercase alphanumeric', () => {
      expect(normalizeReferralCode('  scott-20  ')).toBe('SCOTT-20')
      expect(normalizeReferralCode('alex!@#$')).toBe('ALEX')
      expect(normalizeReferralCode('')).toBe('')
      expect(normalizeReferralCode(null)).toBe('')
    })
  })

  describe('generateReferralCode', () => {
    it('generates a clean prefix-suffix code', () => {
      const code1 = generateReferralCode('Scott Gordon')
      expect(code1.startsWith('SCOTT-')).toBe(true)
      expect(code1.length).toBeGreaterThan(6)

      const codeDefault = generateReferralCode(null)
      expect(codeDefault.startsWith('FORGE-')).toBe(true)
    })
  })

  describe('generateDeterministicReferralCode', () => {
    it('generates stable, reproducible code for the same user id', () => {
      const userId = '72dfb51e-1638-4f43-951e-a488e5576fd1'
      const code1 = generateDeterministicReferralCode(userId, 'Scott Gordon')
      const code2 = generateDeterministicReferralCode(userId, 'Scott Gordon')
      expect(code1).toBe(code2)
      expect(code1).toBe('SCOTT-72DF')
    })

    it('handles null clientName gracefully', () => {
      const userId = 'a1b2c3d4-0000-0000-0000-000000000000'
      const code = generateDeterministicReferralCode(userId, null)
      expect(code).toBe('FORGE-A1B2')
    })
  })

  describe('maskEmail', () => {
    it('masks email addresses for user privacy', () => {
      expect(maskEmail('john.doe@example.com')).toBe('jo***@example.com')
      expect(maskEmail('a@b.com')).toBe('a*@b.com')
      expect(maskEmail(null)).toBe('Athlete')
    })
  })

  describe('calculateMilestoneProgress', () => {
    it('calculates baseline progress when 0 conversions', () => {
      const result = calculateMilestoneProgress(0)
      expect(result.currentTier.level).toBe(0)
      expect(result.nextTier?.level).toBe(1)
      expect(result.progressToNext).toBe(0)
    })

    it('calculates Level 1 milestone when 1 conversion', () => {
      const result = calculateMilestoneProgress(1)
      expect(result.currentTier.level).toBe(1)
      expect(result.currentTier.name).toBe('Recruit')
      expect(result.nextTier?.level).toBe(2)
      // Level 1 requires 1, Level 2 requires 3. (1-1)/(3-1) = 0%
      expect(result.progressToNext).toBe(0)
    })

    it('calculates mid-tier progress when 2 conversions', () => {
      const result = calculateMilestoneProgress(2)
      expect(result.currentTier.level).toBe(1)
      expect(result.nextTier?.level).toBe(2)
      // (2-1)/(3-1) = 50%
      expect(result.progressToNext).toBe(50)
    })

    it('calculates Level 4 completion when 10+ conversions', () => {
      const result = calculateMilestoneProgress(10)
      expect(result.currentTier.level).toBe(4)
      expect(result.currentTier.name).toBe('Founding Ambassador')
      expect(result.nextTier).toBeNull()
      expect(result.progressToNext).toBe(100)
    })

    it('exposes exactly 4 tiered referral milestones', () => {
      expect(REFERRAL_MILESTONES.length).toBe(4)
      expect(REFERRAL_MILESTONES.map(m => m.name)).toEqual([
        'Recruit',
        'Lead Athlete',
        'Sovereign Elite',
        'Founding Ambassador',
      ])
    })
  })

  describe('validateReferralCode', () => {
    it('returns error when code is not found', async () => {
      const mockAdmin = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any

      const result = await validateReferralCode(mockAdmin, 'INVALID')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid or expired referral code')
    })

    it('returns referrer details when valid code found', async () => {
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'referral_codes') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'code-123',
                      client_id: 'client-referrer-1',
                      code: 'SCOTT-7B3K',
                      custom_slug: null,
                    },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: 'Scott Gordon', email: 'scott@forgeathletic.com' },
                    error: null,
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const result = await validateReferralCode(mockAdmin, 'SCOTT-7B3K')
      expect(result.valid).toBe(true)
      expect(result.code).toBe('SCOTT-7B3K')
      expect(result.referrerId).toBe('client-referrer-1')
      expect(result.referrerName).toBe('Scott Gordon')
      expect(result.refereeTrialDays).toBe(30)
      expect(result.refereeDiscountCents).toBe(2000)
    })
  })

  describe('attributeReferralSignup', () => {
    it('blocks self-referral', async () => {
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'referral_codes') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'code-123',
                      client_id: 'same-user-id',
                      code: 'SCOTT-7B3K',
                    },
                  }),
                }),
              }),
            }
          }
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Scott' } }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const result = await attributeReferralSignup(mockAdmin, {
        code: 'SCOTT-7B3K',
        refereeId: 'same-user-id',
        refereeEmail: 'scott@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Self-referral is not permitted')
    })
  })

  describe('processReferralConversion', () => {
    it('processes conversion, awards $20 credit, and unlocks milestone bonus', async () => {
      const insertedRewards: any[] = []
      const insertedEntitlements: any[] = []

      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'referral_attributions') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'attr-1',
                      referrer_id: 'referrer-user-1',
                      referral_code_id: 'code-row-1',
                      status: 'signed_up',
                      referee_email: 'friend@example.com',
                    },
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          if (table === 'referral_codes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'code-row-1',
                      conversions_count: 2, // will become 3 (Milestone Level 2: Form Lab review!)
                      total_rewards_earned_cents: 4000,
                    },
                  }),
                }),
              }),
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          if (table === 'referral_rewards') {
            return {
              insert: vi.fn().mockImplementation((item: any) => {
                insertedRewards.push(item)
                return Promise.resolve({ error: null })
              }),
            }
          }
          if (table === 'client_addon_entitlements') {
            return {
              insert: vi.fn().mockImplementation((item: any) => {
                insertedEntitlements.push(item)
                return Promise.resolve({ error: null })
              }),
            }
          }
          return {}
        }),
      } as any

      const result = await processReferralConversion(mockAdmin, {
        refereeId: 'friend-user-id',
        stripeSubscriptionId: 'sub_123',
        stripePaymentId: 'in_123',
        amountPaidCents: 1999,
      })

      expect(result.converted).toBe(true)
      expect(result.referrerId).toBe('referrer-user-1')
      expect(result.rewardGranted).toBe(true)

      // Should have inserted $20 credit reward
      expect(insertedRewards.some(r => r.amount_cents === 2000 && r.reward_type === 'subscription_credit')).toBe(true)

      // Conversion #3 triggers Milestone 2: Form Lab Video Review!
      expect(insertedRewards.some(r => r.reward_type === 'form_lab_review')).toBe(true)
      expect(insertedEntitlements.some(e => e.feature === 'video-review' && e.uses_total === 1)).toBe(true)
    })
  })

  describe('schema resilience (missing referral_codes table fallback)', () => {
    it('returns synthetic deterministic record when table is not found (PGRST205)', async () => {
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'referral_codes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST205', message: "Could not find the table 'public.referral_codes' in the schema cache" },
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const result = await getOrCreateClientReferralCode(mockAdmin, '72dfb51e-1638-4f43-951e-a488e5576fd1', 'Scott Gordon')
      expect(result.code).toBe('SCOTT-72DF')
      expect(result.clicks).toBe(0)
      expect(result.signupsCount).toBe(0)
      expect(result.conversionsCount).toBe(0)
    })

    it('returns fully-formed ReferralDashboardData even when ledger tables are missing', async () => {
      const mockAdmin = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: 'Scott Gordon', email: 'scott@forgeathletic.com' },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'referral_codes') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST205', message: "Could not find table" },
                  }),
                }),
              }),
            }
          }
          if (table === 'referral_attributions' || table === 'referral_rewards') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } }),
                    eq: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST205' } }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const dashboard = await getClientReferralDashboard(mockAdmin, '72dfb51e-1638-4f43-951e-a488e5576fd1')
      expect(dashboard.code).toBe('SCOTT-72DF')
      expect(dashboard.shareUrl).toBe('https://forgeathletic.com/r/SCOTT-72DF')
      expect(dashboard.milestones.currentTier.name).toBe('Athlete')
      expect(dashboard.milestones.nextTier?.name).toBe('Recruit')
      expect(dashboard.history).toEqual([])
      expect(dashboard.rewards).toEqual([])
    })
  })
})

