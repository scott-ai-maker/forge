import type { ForgeAddonFeature } from '@/lib/forge-addons'

export type ForgeMembershipCadence = 'monthly' | 'annual'

export interface ForgeMembership {
  id: string
  name: string
  monthlyPriceCents: number
  annualPriceCents?: number
  trialDays?: number
  seatCap?: number
  seatCapLabel?: string
  // Self-serve tools unlocked while the membership is paid; uses are per billing cycle (omitted = unlimited)
  includedFeatures?: readonly { feature: ForgeAddonFeature; uses?: number }[]
  features: readonly string[]
}

export const FORGE_MEMBERSHIPS: readonly ForgeMembership[] = [
  {
    id: 'forge-core',
    name: 'Core',
    monthlyPriceCents: 4900,
    annualPriceCents: 39900,
    trialDays: 7,
    features: [
      'Personalized NASM OPT™ training plan',
      'Workout, strength, and personal-record tracking',
      'Movement screening and practical guidance',
      'Instant exercise cues & 24/7 automated pacing',
    ],
  },
  {
    id: 'forge-pro-athlete',
    name: 'Plus',
    monthlyPriceCents: 9900,
    annualPriceCents: 89900,
    includedFeatures: [
      { feature: 'nutrition' },
      { feature: 'travel' },
      { feature: 'video-review', uses: 4 },
    ],
    features: [
      'Everything in Core',
      'Audio-guided training sessions',
      'Movement and recovery insights',
      'Weekly progress summaries',
      'Nutrition planning and travel workout tools',
      '4 video form reviews per month',
      'Monthly asynchronous coach audit',
    ],
  },
  {
    id: 'forge-transformation-direct',
    name: 'Coach Support',
    monthlyPriceCents: 29900,
    seatCap: 15,
    seatCapLabel: 'Strictly limited to 15 active athletes',
    includedFeatures: [
      { feature: 'nutrition' },
      { feature: 'travel' },
      { feature: 'video-review', uses: 8 },
    ],
    features: [
      'Everything in Plus',
      'Master Coach Safety Gate: Plans certified by Coach Gordon',
      'Quarterly video reviews with Coach Gordon',
      'Direct messaging with your coach',
      'Evening advisory review window (within 1 business day)',
      '8 video form reviews per month in Form Lab',
      'Strictly limited to 15 active athletes to protect coach focus',
    ],
  },
]

const LEGACY_MEMBERSHIP_NAMES: Readonly<Record<string, string>> = {
  'core membership': 'Core',
  'pro athlete': 'Plus',
  'transformation direct': 'Coach Support',
  'autonomous digital lab': 'Digital Training',
  'alumni continuity retainer': 'Ongoing Training',
  'performance protocol': 'Personalized Training',
  'hybrid concierge': 'Hybrid Coaching',
  'executive 1:1 master': 'One-to-one coaching',
  'corporate executive retainer': 'Team Wellness',
}

export function getMembershipDisplayName(name: string): string {
  return LEGACY_MEMBERSHIP_NAMES[name.trim().toLowerCase()] ?? name
}

export function getForgeMembership(id: string): ForgeMembership | undefined {
  return FORGE_MEMBERSHIPS.find(membership => membership.id === id)
}

export function getForgeMembershipPrice(
  membership: ForgeMembership,
  cadence: ForgeMembershipCadence
): { amountCents: number; interval: 'month' | 'year' } | undefined {
  if (cadence === 'annual') {
    return membership.annualPriceCents === undefined
      ? undefined
      : { amountCents: membership.annualPriceCents, interval: 'year' }
  }

  return { amountCents: membership.monthlyPriceCents, interval: 'month' }
}

export function getMembershipsIncluding(feature: ForgeAddonFeature): ForgeMembership[] {
  return FORGE_MEMBERSHIPS.filter(m => m.includedFeatures?.some(f => f.feature === feature))
}
