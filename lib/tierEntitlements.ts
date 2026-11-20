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
    shortLabel: 'Core Lab · $49.00/mo',
    foundingMonthlyCents: 4900,
    foundingPriceFormatted: '$49.00',
    postLaunchMonthlyCents: 4900,
    postLaunchPriceFormatted: '$49.00',
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
    formLabCreditLabel: '1 complimentary onboarding Form Lab clip (first paid cycle)',
    nutritionPeriodization: false,
    directCoachChat: false,
    bespokeMeshCertification: false,
    priority24hSla: false,
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    shortLabel: 'Plus · $99.00/mo',
    foundingMonthlyCents: 9900,
    foundingPriceFormatted: '$99.00',
    postLaunchMonthlyCents: 9900,
    postLaunchPriceFormatted: '$99.00',
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
    monthlyFormLabCredits: 4,
    formLabCreditLabel: '4 Coach Gordon Form Lab reviews/mo',
    nutritionPeriodization: true,
    directCoachChat: false,
    bespokeMeshCertification: false,
    priority24hSla: false,
  },
  coach_support: {
    id: 'coach_support',
    name: 'Coach Support',
    shortLabel: 'Coach Support · $299.00/mo',
    foundingMonthlyCents: 29900,
    foundingPriceFormatted: '$299.00',
    postLaunchMonthlyCents: 29900,
    postLaunchPriceFormatted: '$299.00',
    rosterCap: 15,
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
        'Your scan flagged elevated joint strain. Upgrade to Plus for 4 monthly Coach Gordon Form Lab video reviews, Dual-Screen Readiness trend alerts, and unlimited Desk Ergonomics profiles.',
      bannerCopy:
        'Want Coach Gordon to verify your form on this? Upgrade to Plus for 4 monthly Form Lab reviews, Dual-Screen Readiness trend alerts, and unlimited workstation profiles.',
      ctaLabel: 'Unlock Plus · $99/mo',
      highlights: [
        '4 monthly Coach Gordon Form Lab video critiques with joint-angle markup',
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
      ctaLabel: 'Upgrade to Plus · $99/mo',
      highlights: [
        'Unlimited saved Desk Ergonomics workstation profiles (Home, Office, Travel)',
        '4 monthly Coach Gordon Form Lab video reviews',
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
      ctaLabel: 'Unlock Multi-Day Travel Pass · $99/mo',
      highlights: [
        'Multi-Day Travel Pass auto-adapts equipment across entire work trips',
        'Zero lost progression across Phases 01–05 when away from your home gym',
        'Includes 4 monthly Coach Gordon Form Lab reviews & Nutrition Periodization',
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
        headline: 'Unlock 4 Monthly Coach Gordon Form Lab Reviews',
        description:
          'You have used your complimentary Core Lab onboarding clip. Upgrade to Plus for 4 monthly Coach Gordon telestrator video reviews plus full Nutrition Periodization.',
        bannerCopy: '0 Form Lab credits remaining this month. Upgrade to Plus for 4 monthly Coach Gordon reviews.',
        ctaLabel: 'Upgrade to Plus · $99/mo',
        highlights: [
          '4 Coach Gordon Form Lab video critiques every month',
          'Unlimited Desk Ergonomics profiles & Multi-Day Travel Pass',
          'Full Nutrition Periodization macro targets',
        ],
      }
    }

    return {
      trigger,
      recommendedTier: 'coach_support',
      eyebrow: 'Priority Coaching Roster',
      headline: 'Step up to 8 Priority Form Lab Reviews + Direct 1-on-1 Coach Chat',
      description:
        'You have used all 4 monthly Plus Form Lab credits. Coach Support unlocks 8 monthly video reviews with 24-hour priority turnaround and direct 1-on-1 messaging with Coach Gordon.',
      bannerCopy:
        '0 Form Lab credits left this month. Upgrade to Coach Support for 8 priority reviews/mo + 1-on-1 Coach Chat.',
      ctaLabel: 'Claim Coach Support Spot · $299/mo',
      highlights: [
        '8 monthly Form Lab reviews with 24-hour priority turnaround',
        'Direct 1-on-1 Chat with Coach Gordon (24h SLA)',
        'Bespoke OPT™ training plan & 33-point posture mesh certification',
      ],
    }
  }

  // phase_02_load_milestone
  return {
    trigger,
    recommendedTier: 'coach_support',
    eyebrow: `Coach Support · Priority 1-on-1 Roster`,
    headline: 'Phase 02 Strength Endurance Unlocked — Certify Your Load Progression',
    description:
      'Moving into heavier Phase 02 superset loads is where individualized cueing pays off most. Step up to Coach Support for bespoke plan adjustments and 24-hour 1-on-1 access to Coach Gordon.',
    bannerCopy: `Phase 02 Load Milestone unlocked · Coach Support open for 1-on-1 plan certification.`,
    ctaLabel: `Upgrade to Coach Support · $299/mo`,
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

export function tierIdToForgePackageId(tier: ForgeTierId): string {
  if (tier === 'coach_support') return 'forge-transformation-direct'
  if (tier === 'plus') return 'forge-pro-athlete'
  return 'forge-core'
}

export function inferForgeTierFromPackageNameClient(
  packageName?: string | null,
  _sessionsRemaining?: number | null
): ForgeTierId {
  const normalized = String(packageName ?? '').trim().toLowerCase()
  if (
    normalized.includes('bonus') ||
    normalized.includes('screening') ||
    normalized.includes('add-on') ||
    normalized.includes('addon') ||
    normalized.includes('movement screen') ||
    normalized.includes('coach scheduled session')
  ) {
    return 'core_lab'
  }
  if (
    normalized.includes('coach support') ||
    normalized.includes('transformation direct') ||
    normalized.includes('concierge')
  ) {
    return 'coach_support'
  }
  if (
    normalized.includes('plus') ||
    normalized.includes('pro athlete') ||
    normalized.includes('hybrid')
  ) {
    return 'plus'
  }
  return 'core_lab'
}

interface ServerEntitlementCache {
  tierId: ForgeTierId
  allowQaPreview: boolean
  serverVideoReviewCredits: number | null
  fetchedAtMs: number
}

let cachedServerEntitlements: ServerEntitlementCache | null = null
let inflightEntitlementsPromise: Promise<ServerEntitlementCache | null> | null = null

export function isQaTierPreviewAllowed(): boolean {
  if (cachedServerEntitlements !== null) {
    return cachedServerEntitlements.allowQaPreview
  }
  return process.env.NODE_ENV !== 'production'
}

export function getStoredTierId(): ForgeTierId {
  if (!isQaTierPreviewAllowed()) {
    return cachedServerEntitlements?.tierId ?? 'core_lab'
  }
  if (typeof window === 'undefined') return cachedServerEntitlements?.tierId ?? 'core_lab'
  try {
    const raw = window.localStorage.getItem(TIER_STORAGE_KEY)
    if (raw === 'core_lab' || raw === 'plus' || raw === 'coach_support') {
      return raw
    }
  } catch {
    // ignore
  }
  return cachedServerEntitlements?.tierId ?? 'core_lab'
}

export function setStoredTierId(tier: ForgeTierId): void {
  if (typeof window === 'undefined') return
  if (!isQaTierPreviewAllowed()) return
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
  if (!isQaTierPreviewAllowed()) return
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

async function fetchAuthoritativeEntitlementsOnce(): Promise<ServerEntitlementCache | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null
  if (cachedServerEntitlements && Date.now() - cachedServerEntitlements.fetchedAtMs < 30_000) {
    return cachedServerEntitlements
  }
  if (inflightEntitlementsPromise) {
    return inflightEntitlementsPromise
  }

  inflightEntitlementsPromise = fetch('/api/account/entitlements', {
    method: 'GET',
    cache: 'no-store',
  })
    .then(async res => {
      if (!res.ok) return null
      const data = await res.json().catch(() => null)
      if (!data) return null
      const rawTier = data.tierId
      const resolvedTier: ForgeTierId =
        rawTier === 'coach_support' || rawTier === 'plus' || rawTier === 'core_lab'
          ? rawTier
          : 'core_lab'
      const allowQaPreview = Boolean(data.allowQaPreview)
      const uses = data.features?.['video-review']?.usesRemaining
      const serverVideoReviewCredits =
        typeof uses === 'number' && Number.isFinite(uses) ? Math.max(0, uses) : null

      if (!allowQaPreview) {
        try {
          window.localStorage.removeItem(TIER_STORAGE_KEY)
        } catch {
          // ignore
        }
      }

      cachedServerEntitlements = {
        tierId: resolvedTier,
        allowQaPreview,
        serverVideoReviewCredits,
        fetchedAtMs: Date.now(),
      }
      window.dispatchEvent(new CustomEvent(TIER_EVENT))
      return cachedServerEntitlements
    })
    .catch(() => null)
    .finally(() => {
      inflightEntitlementsPromise = null
    })

  return inflightEntitlementsPromise
}

export function useTierAccess(initialServerTier?: ForgeTierId) {
  const [tierId, setTierId] = useState<ForgeTierId>(initialServerTier ?? 'core_lab')
  const [allowQaPreview, setAllowQaPreview] = useState<boolean>(
    process.env.NODE_ENV !== 'production'
  )
  const [remainingFormLabCredits, setRemainingFormLabCredits] = useState<number>(
    FORGE_TIER_ENTITLEMENTS[initialServerTier ?? 'core_lab'].monthlyFormLabCredits
  )
  const [, setTick] = useState(0)

  useEffect(() => {
    const sync = () => {
      const qaAllowed = isQaTierPreviewAllowed()
      setAllowQaPreview(qaAllowed)
      const effectiveTier: ForgeTierId = qaAllowed
        ? getStoredTierId()
        : (cachedServerEntitlements?.tierId ?? initialServerTier ?? 'core_lab')
      setTierId(effectiveTier)

      if (!qaAllowed && cachedServerEntitlements?.serverVideoReviewCredits !== null && cachedServerEntitlements?.serverVideoReviewCredits !== undefined) {
        setRemainingFormLabCredits(cachedServerEntitlements.serverVideoReviewCredits)
      } else {
        setRemainingFormLabCredits(getRemainingFormLabCredits(effectiveTier))
      }
      setTick(t => t + 1)
    }

    sync()
    void fetchAuthoritativeEntitlementsOnce()

    window.addEventListener(TIER_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(TIER_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [initialServerTier])

  const setTier = useCallback((nextTier: ForgeTierId) => {
    if (!isQaTierPreviewAllowed()) return
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
    allowQaPreview,
    entitlements: FORGE_TIER_ENTITLEMENTS[tierId],
    remainingFormLabCredits,
    setTier,
    spendFormLabCredit,
    shouldShowTrigger,
    dismissTrigger: dismissUpgradeTrigger,
    canSaveWorkstation: (savedCount: number) => canSaveAnotherWorkstation(tierId, savedCount),
  }
}

