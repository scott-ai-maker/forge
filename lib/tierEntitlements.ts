'use client'

import { useCallback, useEffect, useState } from 'react'

export type ForgeTierId = 'core_lab' | 'plus' | 'coach_support'

export type UpgradeTriggerId =
  | 'post_scan_flag'
  | 'second_workstation_audit'
  | 'consecutive_travel_swaps'
  | 'form_lab_credit_depletion'
  | 'phase_02_load_milestone'

export interface ForgeTierEntitlement {
  id: ForgeTierId
  name: string
  shortLabel: string
  foundingMonthlyCents: number
  foundingPriceFormatted: string
  postLaunchMonthlyCents: number
  postLaunchPriceFormatted: string
  rosterCap: number | null
  remainingSpots: number | null
  optEngineAccess: boolean
  expressModeAccess: boolean
  deskResetAccess: boolean
  jointComfortScoreAccess: boolean
  unlimitedQuickPostureChecks: boolean
  maxWorkstationProfiles: number | null // null = unlimited
  dualScreenReadiness: boolean
  readinessTrendAlerts: boolean
  multiDayTravelPass: boolean
  monthlyFormLabCredits: number
  formLabCreditLabel: string
  nutritionPeriodization: boolean
  directCoachChat: boolean
  bespokeMeshCertification: boolean
  priority24hSla: boolean
}

export const FORGE_TIER_ENTITLEMENTS: Record<ForgeTierId, ForgeTierEntitlement> = {
  core_lab: {
    id: 'core_lab',
    name: 'Core Lab',
    shortLabel: 'Core Lab · $19.99/mo',
    foundingMonthlyCents: 1999,
    foundingPriceFormatted: '$19.99',
    postLaunchMonthlyCents: 2999,
    postLaunchPriceFormatted: '$29.99',
    rosterCap: null,
    remainingSpots: null,
    optEngineAccess: true,
    expressModeAccess: true,
    deskResetAccess: true,
    jointComfortScoreAccess: true,
    unlimitedQuickPostureChecks: true,
    maxWorkstationProfiles: 1,
    dualScreenReadiness: false,
    readinessTrendAlerts: false,
    multiDayTravelPass: false,
    monthlyFormLabCredits: 1,
    formLabCreditLabel: '1 complimentary onboarding Form Lab clip',
    nutritionPeriodization: false,
    directCoachChat: false,
    bespokeMeshCertification: false,
    priority24hSla: false,
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    shortLabel: 'Plus · $49.00/mo',
    foundingMonthlyCents: 4900,
    foundingPriceFormatted: '$49.00',
    postLaunchMonthlyCents: 6900,
    postLaunchPriceFormatted: '$69.00',
    rosterCap: null,
    remainingSpots: null,
    optEngineAccess: true,
    expressModeAccess: true,
    deskResetAccess: true,
    jointComfortScoreAccess: true,
    unlimitedQuickPostureChecks: true,
    maxWorkstationProfiles: null,
    dualScreenReadiness: true,
    readinessTrendAlerts: true,
    multiDayTravelPass: true,
    monthlyFormLabCredits: 2,
    formLabCreditLabel: '2 Coach Gordon Form Lab reviews/mo',
    nutritionPeriodization: true,
    directCoachChat: false,
    bespokeMeshCertification: false,
    priority24hSla: false,
  },
  coach_support: {
    id: 'coach_support',
    name: 'Coach Support',
    shortLabel: 'Coach Support · $199.00/mo',
    foundingMonthlyCents: 19900,
    foundingPriceFormatted: '$199.00',
    postLaunchMonthlyCents: 26900,
    postLaunchPriceFormatted: '$269.00',
    rosterCap: 25,
    remainingSpots: 6,
    optEngineAccess: true,
    expressModeAccess: true,
    deskResetAccess: true,
    jointComfortScoreAccess: true,
    unlimitedQuickPostureChecks: true,
    maxWorkstationProfiles: null,
    dualScreenReadiness: true,
    readinessTrendAlerts: true,
    multiDayTravelPass: true,
    monthlyFormLabCredits: 8,
    formLabCreditLabel: '8 Form Lab reviews/mo (24h priority)',
    nutritionPeriodization: true,
    directCoachChat: true,
    bespokeMeshCertification: true,
    priority24hSla: true,
  },
}

export interface UpgradeTriggerCopy {
  trigger: UpgradeTriggerId
  recommendedTier: ForgeTierId
  eyebrow: string
  headline: string
  description: string
  bannerCopy: string
  ctaLabel: string
  highlights: string[]
}

export function getUpgradeTriggerCopy(
  trigger: UpgradeTriggerId,
  currentTier: ForgeTierId
): UpgradeTriggerCopy {
  if (trigger === 'post_scan_flag') {
    return {
      trigger,
      recommendedTier: 'plus',
      eyebrow: 'Form & Posture Verification',
      headline: 'Have Coach Gordon verify your alignment on video',
      description:
        'Your scan flagged elevated joint strain. Upgrade to Plus for 2 monthly Coach Gordon Form Lab video reviews, Dual-Screen Readiness trend alerts, and unlimited Desk Ergonomics profiles.',
      bannerCopy:
        'Want Coach Gordon to verify your form on this? Upgrade to Plus for 2 monthly Form Lab reviews, Dual-Screen Readiness trend alerts, and unlimited workstation profiles.',
      ctaLabel: 'Unlock Plus · $49/mo Founding Rate',
      highlights: [
        '2 monthly Coach Gordon Form Lab video critiques with joint-angle markup',
        'Full Dual-Screen Readiness (Overhead Squat + Scapular Wall Slide) & trend alerts',
        'Unlimited Desk Ergonomics workstation profiles + Nutrition Periodization',
      ],
    }
  }

  if (trigger === 'second_workstation_audit') {
    return {
      trigger,
      recommendedTier: 'plus',
      eyebrow: 'Multi-Workstation Profile Limit',
      headline: 'Save Home, Office & Standing Desk Profiles in Plus',
      description:
        'Core Lab includes 1 saved Desk Ergonomics workstation profile. Upgrade to Plus to save unlimited workstation setups and track posture improvements across every desk you use.',
      bannerCopy:
        'Core Lab includes 1 saved workstation profile. Upgrade to Plus for unlimited workstation profiles.',
      ctaLabel: 'Upgrade to Plus · $49/mo Founding Rate',
      highlights: [
        'Unlimited saved Desk Ergonomics workstation profiles (Home, Office, Travel)',
        '2 monthly Coach Gordon Form Lab video reviews',
        'Full Nutrition Periodization synced to your training days',
      ],
    }
  }

  if (trigger === 'consecutive_travel_swaps') {
    return {
      trigger,
      recommendedTier: 'plus',
      eyebrow: 'Multi-Day Travel Pass',
      headline: 'Keep your progression intact across multi-day trips',
      description:
        'Core Lab covers single-session environment swaps. Upgrade to Plus to schedule Multi-Day Travel Passes so Hotel Gym and Bodyweight sessions preserve your 5-Phase OPT™ progression automatically.',
      bannerCopy:
        'Traveling multiple days in a row? Activate Multi-Day Travel Pass in Plus to auto-adapt your week.',
      ctaLabel: 'Unlock Multi-Day Travel Pass · $49/mo',
      highlights: [
        'Multi-Day Travel Pass auto-adapts equipment across entire work trips',
        'Zero lost progression across Phases 01–05 when away from your home gym',
        'Includes 2 monthly Coach Gordon Form Lab reviews & Nutrition Periodization',
      ],
    }
  }

  if (trigger === 'form_lab_credit_depletion') {
    const targetTier: ForgeTierId = currentTier === 'core_lab' ? 'plus' : 'coach_support'
    if (targetTier === 'plus') {
      return {
        trigger,
        recommendedTier: 'plus',
        eyebrow: 'Form Lab Credits Used',
        headline: 'Unlock 2 Monthly Coach Gordon Form Lab Reviews',
        description:
          'You have used your complimentary Core Lab onboarding clip. Upgrade to Plus for 2 monthly Coach Gordon telestrator video reviews plus full Nutrition Periodization.',
        bannerCopy: '0 Form Lab credits remaining this month. Upgrade to Plus for 2 monthly Coach Gordon reviews.',
        ctaLabel: 'Upgrade to Plus · $49/mo Founding Rate',
        highlights: [
          '2 Coach Gordon Form Lab video critiques every month',
          'Unlimited Desk Ergonomics profiles & Multi-Day Travel Pass',
          'Full Nutrition Periodization macro targets',
        ],
      }
    }

    return {
      trigger,
      recommendedTier: 'coach_support',
      eyebrow: 'Priority Coaching Roster · Capped at 25',
      headline: 'Step up to 8 Priority Form Lab Reviews + Direct 1-on-1 Coach Chat',
      description:
        'You have used both monthly Plus Form Lab credits. Coach Support unlocks 8 monthly video reviews with 24-hour priority turnaround and direct 1-on-1 messaging with Coach Gordon.',
      bannerCopy:
        '0 Form Lab credits left this month. Upgrade to Coach Support for 8 priority reviews/mo + 1-on-1 Coach Chat.',
      ctaLabel: 'Claim Coach Support Spot · $199/mo',
      highlights: [
        '8 monthly Form Lab reviews with 24-hour priority turnaround',
        'Direct 1-on-1 Chat with Coach Gordon (24h SLA)',
        'Bespoke OPT™ training plan & 33-point posture mesh certification',
      ],
    }
  }

  // phase_02_load_milestone
  const spotsLeft = FORGE_TIER_ENTITLEMENTS.coach_support.remainingSpots ?? 6
  const cap = FORGE_TIER_ENTITLEMENTS.coach_support.rosterCap ?? 25
  return {
    trigger,
    recommendedTier: 'coach_support',
    eyebrow: `Coach Support · ${spotsLeft} of ${cap} Spots Remaining`,
    headline: 'Phase 02 Strength Endurance Unlocked — Certify Your Load Progression',
    description:
      'Moving into heavier Phase 02 superset loads is where individualized cueing pays off most. Reserve one of the 25 Coach Support roster spots for bespoke plan adjustments and 24-hour 1-on-1 access to Coach Gordon.',
    bannerCopy: `Phase 02 Load Milestone unlocked · ${spotsLeft} of ${cap} Coach Support spots open for 1-on-1 plan certification.`,
    ctaLabel: `Reserve Coach Support (${spotsLeft}/${cap} Left) · $199/mo`,
    highlights: [
      'Direct 1-on-1 Chat with Coach Gordon (24h SLA)',
      '8 monthly Form Lab video reviews (24h priority)',
      'Bespoke Phase 02–05 programming & posture mesh certification',
    ],
  }
}

export const UPGRADE_DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const TIER_STORAGE_KEY = 'forge_tier_preview_v1'
const COOLDOWN_STORAGE_KEY = 'forge_upgrade_cooldown_v1'
const FORM_LAB_USAGE_KEY = 'forge_form_lab_used_v1'
const TIER_EVENT = 'forge:tier-preview-change'

export function getStoredTierId(): ForgeTierId {
  if (typeof window === 'undefined') return 'core_lab'
  try {
    const raw = window.localStorage.getItem(TIER_STORAGE_KEY)
    if (raw === 'core_lab' || raw === 'plus' || raw === 'coach_support') {
      return raw
    }
  } catch {
    // ignore
  }
  return 'core_lab'
}

export function setStoredTierId(tier: ForgeTierId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TIER_STORAGE_KEY, tier)
    window.dispatchEvent(new CustomEvent<ForgeTierId>(TIER_EVENT, { detail: tier }))
  } catch {
    // ignore
  }
}

export function isTriggerInCooldown(trigger: UpgradeTriggerId, nowMs = Date.now()): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(COOLDOWN_STORAGE_KEY)
    if (!raw) return false
    const map = JSON.parse(raw) as Record<string, number>
    const dismissedAt = map[trigger]
    if (typeof dismissedAt !== 'number') return false
    return nowMs - dismissedAt < UPGRADE_DISMISSAL_COOLDOWN_MS
  } catch {
    return false
  }
}

export function dismissUpgradeTrigger(trigger: UpgradeTriggerId, nowMs = Date.now()): void {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(COOLDOWN_STORAGE_KEY)
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    map[trigger] = nowMs
    window.localStorage.setItem(COOLDOWN_STORAGE_KEY, JSON.stringify(map))
    window.dispatchEvent(new CustomEvent(TIER_EVENT))
  } catch {
    // ignore
  }
}

export function clearUpgradeCooldowns(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(COOLDOWN_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(TIER_EVENT))
  } catch {
    // ignore
  }
}

export function getFormLabUsedCredits(tier: ForgeTierId): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(FORM_LAB_USAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as Record<string, number>
    return Math.max(0, Number(parsed[tier] || 0))
  } catch {
    return 0
  }
}

export function getRemainingFormLabCredits(tier: ForgeTierId): number {
  const entitlement = FORGE_TIER_ENTITLEMENTS[tier]
  const used = getFormLabUsedCredits(tier)
  return Math.max(0, entitlement.monthlyFormLabCredits - used)
}

export function consumeFormLabCredit(tier: ForgeTierId): { allowed: boolean; remaining: number } {
  const currentRemaining = getRemainingFormLabCredits(tier)
  if (currentRemaining <= 0) {
    return { allowed: false, remaining: 0 }
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(FORM_LAB_USAGE_KEY)
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {}
      parsed[tier] = Math.max(0, Number(parsed[tier] || 0)) + 1
      window.localStorage.setItem(FORM_LAB_USAGE_KEY, JSON.stringify(parsed))
      window.dispatchEvent(new CustomEvent(TIER_EVENT))
    } catch {
      // ignore
    }
  }
  return { allowed: true, remaining: currentRemaining - 1 }
}

export function resetFormLabCreditsForQa(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(FORM_LAB_USAGE_KEY)
    window.dispatchEvent(new CustomEvent(TIER_EVENT))
  } catch {
    // ignore
  }
}

export function canSaveAnotherWorkstation(tier: ForgeTierId, savedCount: number): boolean {
  const max = FORGE_TIER_ENTITLEMENTS[tier].maxWorkstationProfiles
  if (max === null) return true
  return savedCount < max
}

export function useTierAccess() {
  const [tierId, setTierId] = useState<ForgeTierId>('core_lab')
  const [remainingFormLabCredits, setRemainingFormLabCredits] = useState<number>(1)
  const [, setTick] = useState(0)

  useEffect(() => {
    const sync = () => {
      const stored = getStoredTierId()
      setTierId(stored)
      setRemainingFormLabCredits(getRemainingFormLabCredits(stored))
      setTick(t => t + 1)
    }
    sync()
    window.addEventListener(TIER_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(TIER_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setTier = useCallback((nextTier: ForgeTierId) => {
    setStoredTierId(nextTier)
    setTierId(nextTier)
    setRemainingFormLabCredits(getRemainingFormLabCredits(nextTier))
  }, [])

  const spendFormLabCredit = useCallback(() => {
    const res = consumeFormLabCredit(tierId)
    setRemainingFormLabCredits(res.remaining)
    return res
  }, [tierId])

  const shouldShowTrigger = useCallback(
    (trigger: UpgradeTriggerId): boolean => {
      if (isTriggerInCooldown(trigger)) return false
      if (trigger === 'phase_02_load_milestone') {
        return tierId === 'plus'
      }
      if (trigger === 'form_lab_credit_depletion') {
        return tierId !== 'coach_support'
      }
      return tierId === 'core_lab'
    },
    [tierId]
  )

  return {
    tierId,
    entitlements: FORGE_TIER_ENTITLEMENTS[tierId],
    remainingFormLabCredits,
    setTier,
    spendFormLabCredit,
    shouldShowTrigger,
    dismissTrigger: dismissUpgradeTrigger,
    canSaveWorkstation: (savedCount: number) => canSaveAnotherWorkstation(tierId, savedCount),
  }
}

