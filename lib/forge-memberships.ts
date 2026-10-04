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
    name: 'Core Membership',
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
    name: 'Pro Athlete',
    monthlyPriceCents: 4900,
    includedFeatures: [
      { feature: 'nutrition' },
      { feature: 'travel' },
      { feature: 'video-review', uses: 2 },
    ],
    features: [
      'Voice-guided training sessions',
      'Movement and recovery insights',
      'Weekly performance summaries',
      'Nutrition planning and travel workout tools included',
      '2 video form analyses per month',
    ],
  },
  {
    id: 'forge-transformation-direct',
    name: 'Transformation Direct',
    monthlyPriceCents: 19900,
    includedFeatures: [
      { feature: 'nutrition' },
      { feature: 'travel' },
      { feature: 'video-review', uses: 8 },
    ],
    features: [
      'Everything in Pro Athlete',
      'Quarterly video reviews by Coach Scott Gordon',
      'Direct access to your coach',
      '8 video form analyses per month',
    ],
  },
]

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
