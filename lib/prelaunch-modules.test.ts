import { describe, expect, it } from 'vitest'
import {
  evaluateDeskErgonomicsFromLandmarks,
  SAMPLE_DESK_LANDMARKS,
} from '@/lib/desk-ergonomics-engine'
import {
  applyExpressCapToInjectedDrills,
  evaluateCameraReadiness,
} from '@/lib/camera-readiness-engine'
import {
  buildPartnerPassInviteUrl,
  buildPartnerPassShareChannels,
  formatPartnerPassTileStatus,
  getPartnerPassStepIndex,
  inferInviterDisplayNameFromCode,
} from '@/lib/partner-pass'
import {
  canSaveAnotherWorkstation,
  FORGE_TIER_ENTITLEMENTS,
  getUpgradeTriggerCopy,
  UPGRADE_DISMISSAL_COOLDOWN_MS,
} from '@/lib/tierEntitlements'
import { hasConsecutiveTravelSwaps } from '@/lib/posture-profile-state'
import { isSfxMuted } from '@/lib/sfx-audio'
import { buildOrderedDeskResetDrills } from '@/components/fitness/DeskResetModal'
import {
  CLIENT_OUTCOMES_GRID,
  COACH_GORDON_TRUST_PROFILE,
  FOUNDING_PRICING_CARDS,
} from '@/lib/landingSocialProof'

describe('Forge Athletic Pre-Launch Modules (Phases 1–4)', () => {
  it('defaults SFX strictly to muted in SSR/uninitialized state', () => {
    expect(isSfxMuted()).toBe(true)
  })

  it('evaluates Desk Ergonomics 33-point sample landmarks with 4 joint angles and 3 adjustments', () => {
    const result = evaluateDeskErgonomicsFromLandmarks(SAMPLE_DESK_LANDMARKS.typical_strain)
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.angles).toHaveLength(4)
    expect(result.adjustments).toHaveLength(3)
    expect(result.ergonomicFlags.length).toBeGreaterThan(0)
  })

  it('pre-loads matching mobility drills first in 5-Min Desk Reset based on persisted ergonomic flags', () => {
    const ordered = buildOrderedDeskResetDrills(['hip_flexor_tightness'])
    expect(ordered[0].targetFlag).toBe('hip_flexor_tightness')
    expect(ordered).toHaveLength(4)
  })

  it('enforces the 90-second / 2-drill Express Mode cap on Camera Readiness injected warm-ups', () => {
    const standard = evaluateCameraReadiness({
      screenMode: 'overhead_squat',
      preset: 'tight_hips_ankles',
      expressModeActive: false,
    })
    expect(standard.injectedDrills.length).toBeGreaterThanOrEqual(2)
    expect(standard.totalInjectedDurationSec).toBeGreaterThan(90)

    const express = evaluateCameraReadiness({
      screenMode: 'overhead_squat',
      preset: 'tight_hips_ankles',
      expressModeActive: true,
    })
    expect(express.injectedDrills).toHaveLength(2)
    expect(express.totalInjectedDurationSec).toBeLessThanOrEqual(90)

    const capped = applyExpressCapToInjectedDrills(standard.injectedDrills, true)
    expect(capped).toHaveLength(2)
    expect(capped.reduce((sum, d) => sum + d.durationSec, 0)).toBeLessThanOrEqual(90)
  })

  it('formats Founding Partner Pass invite links, tile statuses, and 3-step stepper accurately', () => {
    expect(buildPartnerPassInviteUrl('marcus-2026')).toBe('https://forge-athletic.app/invite/MARCUS-2026')
    expect(formatPartnerPassTileStatus({ status: 'available', claimedByName: null })).toBe(
      '1 Guest Pass Available'
    )
    expect(formatPartnerPassTileStatus({ status: 'sent', claimedByName: null })).toBe(
      'Sent · Awaiting Claim'
    )
    expect(formatPartnerPassTileStatus({ status: 'claimed', claimedByName: 'Elena R.' })).toBe(
      'Claimed by Elena R.'
    )
    expect(getPartnerPassStepIndex('available')).toBe(0)
    expect(getPartnerPassStepIndex('sent')).toBe(1)
    expect(getPartnerPassStepIndex('claimed')).toBe(2)
    expect(inferInviterDisplayNameFromCode('MARCUS-2026')).toBe('Marcus')

    const channels = buildPartnerPassShareChannels('MARCUS-2026', 'Marcus T.')
    expect(channels.smsHref.startsWith('sms:?&body=')).toBe(true)
    expect(channels.mailtoHref.startsWith('mailto:?subject=')).toBe(true)
  })

  it('enforces Core Lab, Plus, and Coach Support entitlements and 5 contextual upgrade triggers', () => {
    expect(FORGE_TIER_ENTITLEMENTS.core_lab.foundingMonthlyCents).toBe(1999)
    expect(FORGE_TIER_ENTITLEMENTS.core_lab.maxWorkstationProfiles).toBe(1)
    expect(FORGE_TIER_ENTITLEMENTS.core_lab.monthlyFormLabCredits).toBe(1)
    expect(FORGE_TIER_ENTITLEMENTS.plus.foundingMonthlyCents).toBe(4900)
    expect(FORGE_TIER_ENTITLEMENTS.plus.maxWorkstationProfiles).toBeNull()
    expect(FORGE_TIER_ENTITLEMENTS.plus.monthlyFormLabCredits).toBe(2)
    expect(FORGE_TIER_ENTITLEMENTS.coach_support.foundingMonthlyCents).toBe(19900)
    expect(FORGE_TIER_ENTITLEMENTS.coach_support.rosterCap).toBe(25)
    expect(FORGE_TIER_ENTITLEMENTS.coach_support.monthlyFormLabCredits).toBe(8)

    expect(canSaveAnotherWorkstation('core_lab', 0)).toBe(true)
    expect(canSaveAnotherWorkstation('core_lab', 1)).toBe(false)
    expect(canSaveAnotherWorkstation('plus', 5)).toBe(true)

    expect(UPGRADE_DISMISSAL_COOLDOWN_MS).toBe(7 * 24 * 60 * 60 * 1000)

    expect(getUpgradeTriggerCopy('post_scan_flag', 'core_lab').recommendedTier).toBe('plus')
    expect(getUpgradeTriggerCopy('second_workstation_audit', 'core_lab').recommendedTier).toBe('plus')
    expect(getUpgradeTriggerCopy('consecutive_travel_swaps', 'core_lab').recommendedTier).toBe('plus')
    expect(getUpgradeTriggerCopy('form_lab_credit_depletion', 'core_lab').recommendedTier).toBe('plus')
    expect(getUpgradeTriggerCopy('form_lab_credit_depletion', 'plus').recommendedTier).toBe('coach_support')
    expect(getUpgradeTriggerCopy('phase_02_load_milestone', 'plus').recommendedTier).toBe('coach_support')
  })

  it('detects 2+ consecutive days of Hotel Travel / Bodyweight swaps', () => {
    expect(hasConsecutiveTravelSwaps([], '2026-11-13')).toBe(false)
    expect(hasConsecutiveTravelSwaps(['2026-11-10'], '2026-11-13')).toBe(false)
    expect(hasConsecutiveTravelSwaps(['2026-11-12'], '2026-11-13')).toBe(true)
  })

  it('validates landing social proof profiles and Founding Member Lifetime Rate Lock pricing', () => {
    expect(COACH_GORDON_TRUST_PROFILE.monogram).toBe('CG')
    expect(COACH_GORDON_TRUST_PROFILE.verificationBadge).toBe('NASM-CPT® Since 2008')
    expect(COACH_GORDON_TRUST_PROFILE.philosophySentences).toHaveLength(3)

    expect(CLIENT_OUTCOMES_GRID).toHaveLength(3)
    expect(CLIENT_OUTCOMES_GRID.map(c => c.nameAndAge)).toEqual([
      'Marcus T., 38',
      'Elena R., 41',
      'David K., 45',
    ])

    expect(FOUNDING_PRICING_CARDS.map(p => `${p.name}:${p.foundingPrice}`)).toEqual([
      'Core Lab:$19.99',
      'Plus:$49',
      'Coach Support:$199',
      'Live Studio:$180',
    ])
  })
})
