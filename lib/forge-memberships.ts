export type ForgeMembershipCadence = 'monthly' | 'annual'

export interface ForgeMembership {
  id: string
  name: string
  monthlyPriceCents: number
  annualPriceCents?: number
  trialDays?: number
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
      'Automated NASM OPT™ periodization',
      '1RM strength telemetry',
      '3D AI posture audit',
    ],
  },
  {
    id: 'forge-pro-athlete',
    name: 'Pro Athlete',
    monthlyPriceCents: 4900,
    features: [
      'Voice AI training cadences',
      'Biomechanical mesh diagnostics',
      'Weekly automated performance dossiers',
    ],
  },
  {
    id: 'forge-transformation-direct',
    name: 'Transformation Direct',
    monthlyPriceCents: 19900,
    features: [
      'Quarterly asynchronous video critiques',
      'Direct review by Coach Scott Gordon',
      'Personalized movement and technique feedback',
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
