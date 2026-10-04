import type { ForgeAddonFeature } from '@/lib/forge-addons'

export type ForgeMembershipCadence = 'monthly' | 'annual'

export interface ForgeMembership {
  id: string
  name: string
  monthlyPriceCents: number
  annualPriceCents?: number
  trialDays?: number
  // Self-serve tools unlocked while the membership is paid; uses are per billing cycle (omitted = unlimited)
  includedFeatures?: readonly { feature: ForgeAddonFeature; uses?: number }[]
  features: readonly string[]
}

export const FORGE_MEMBERSHIPS: readonly ForgeMembership[] = [
  {
    id: 'forge-core',
    name: 'Core',
    monthlyPriceCents: 1999,
    annualPriceCents: 14900,
    trialDays: 7,
    features: [
      'Personalized NASM OPT™ training plan',
      'Workout, strength, and personal-record tracking',
      'Movement screening and practical guidance',
    ],
  },
  {
    id: 'forge-pro-athlete',
    name: 'Plus',
    monthlyPriceCents: 4900,
    includedFeatures: [
      { feature: 'nutrition' },
      { feature: 'travel' },
      { feature: 'video-review', uses: 2 },
    ],
    features: [
      'Audio-guided training sessions',
      'Movement and recovery insights',
      'Weekly progress summaries',
      'Nutrition planning and travel workout tools',
      '2 video form reviews per month',
    ],
  },
  {
    id: 'forge-transformation-direct',
    name: 'Coach Support',
    monthlyPriceCents: 19900,
    includedFeatures: [
      { feature: 'nutrition' },
      { feature: 'travel' },
      { feature: 'video-review', uses: 8 },
    ],
    features: [
      'Everything in Plus',
      'Quarterly video reviews with Coach Scott Gordon',
      'Direct messaging with your coach',
      '8 video form reviews per month',
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
