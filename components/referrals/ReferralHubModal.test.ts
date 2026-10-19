import fs from 'fs'
import path from 'path'
import { describe, it, expect } from 'vitest'
import { REFERRAL_MILESTONES, calculateMilestoneProgress, maskEmail } from '@/lib/referrals'

describe('components/referrals/ReferralHubModal', () => {
  it('correctly maps all 4 milestone tiers for display', () => {
    expect(REFERRAL_MILESTONES.length).toBe(4)
    expect(REFERRAL_MILESTONES[0].name).toBe('Recruit')
    expect(REFERRAL_MILESTONES[0].requiredConversions).toBe(1)
    expect(REFERRAL_MILESTONES[1].name).toBe('Lead Athlete')
    expect(REFERRAL_MILESTONES[1].requiredConversions).toBe(3)
    expect(REFERRAL_MILESTONES[2].name).toBe('Sovereign Elite')
    expect(REFERRAL_MILESTONES[2].requiredConversions).toBe(5)
    expect(REFERRAL_MILESTONES[3].name).toBe('Founding Ambassador')
    expect(REFERRAL_MILESTONES[3].requiredConversions).toBe(10)
  })

  it('masks referee emails safely for member activity lists', () => {
    expect(maskEmail('sarah.connor@gmail.com')).toBe('sa***@gmail.com')
    expect(maskEmail('ed@tech.co')).toBe('e*@tech.co')
  })

  it('calculates unlock progression for intermediate partner counts', () => {
    // 0 conversions
    const progress0 = calculateMilestoneProgress(0)
    expect(progress0.currentTier.level).toBe(0)
    expect(progress0.nextTier?.requiredConversions).toBe(1)
    expect(progress0.progressToNext).toBe(0)

    // 4 conversions (Between Level 2 [3] and Level 3 [5]) -> 50%
    const progress4 = calculateMilestoneProgress(4)
    expect(progress4.currentTier.level).toBe(2)
    expect(progress4.nextTier?.level).toBe(3)
    expect(progress4.progressToNext).toBe(50)
  })

  it('verifies ReferralHubModal has zIndex: 100050 and retry capability on error', () => {
    const modalPath = path.resolve(process.cwd(), 'components/referrals/ReferralHubModal.tsx')
    const source = fs.readFileSync(modalPath, 'utf-8')
    expect(source).toContain('zIndex: 100050')
    expect(source).toContain('loadReferralData')
    expect(source).toContain('fetchError')
    expect(source).toContain('Retry')
    expect(source).toContain('data.milestones?.currentTier?.name')
  })

  it('verifies SiteHeader renders referral button on dashboard and wires onOpenReferral to drawer', () => {
    const headerPath = path.resolve(process.cwd(), 'components/ui/SiteHeader.tsx')
    const source = fs.readFileSync(headerPath, 'utf-8')
    expect(source).toContain('isDashboard && !isCoach')
    expect(source).toContain('Refer &amp; Earn ($20)')
    expect(source).toContain('onOpenReferral={isDashboard && !isCoach ? () => setReferralOpen(true) : undefined}')
  })

  it('verifies MobileNavigationDrawer supports onOpenReferral action', () => {
    const drawerPath = path.resolve(process.cwd(), 'components/ui/MobileNavigationDrawer.tsx')
    const source = fs.readFileSync(drawerPath, 'utf-8')
    expect(source).toContain('onOpenReferral?: () => void')
    expect(source).toContain('!isCoach && onOpenReferral')
    expect(source).toContain('Refer &amp; Earn ($20)')
  })
})
