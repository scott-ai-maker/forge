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
  // One-time onboarding entitlements granted once on the first paid ($ > 0) invoice
  onboardingFeatures?: readonly { feature: ForgeAddonFeature; uses?: number }[]
  features: readonly string[]
}

export const FORGE_MEMBERSHIPS: readonly ForgeMembership[] = [
  {
    id: 'forge-core',
    name: 'Core',
    monthlyPriceCents: 4900,
    annualPriceCents: 39900,
    trialDays: 7,
    onboardingFeatures: [{ feature: 'video-review', uses: 1 }],
    features: [
      'Personalized NASM OPT™ training plan',
      'Workout, 1RM strength, and goal progress tracking',
      '20m Express Mode & single-session Environment Swaps (Home, Apartment, Bodyweight, Hotel)',
      'Coach Gordon AI + real recorded voice briefings, tempo pacing & mid-set joint-safe regressions',
      'Unlimited local in-browser 33-point posture checks & Before/After mesh tracking (zero cloud video upload)',
      '1 saved Desk Ergonomics Camera Audit profile + personalized 5-Minute Desk Reset',
      '30-Second Camera Readiness Check (1 screen + auto warm-up injection) & 10s Joint Comfort Check-In',
      '1 complimentary Form Lab onboarding video diagnostic (granted on first paid cycle; self-guided thereafter)',
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
      '4 Form Lab video reviews per month with Coach Gordon feedback',
      'Unlimited Desk Ergonomics Camera Audit profiles (Home, Office & Hotel workstations)',
      'Full Dual-Screen Camera Readiness (Overhead Squat + Scapular Wall Slides) & stiffness trend alerts',
      'Phase-synced Nutrition Blueprint & Multi-Day Travel Pass included',
      'Priority Email access to Coach Gordon (1 business day response)',
      'Voice-paced rest timers and tempo cadence guidance',
      'Strength and body composition analytics',
      'Monthly asynchronous coach progress audit',
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
      'Direct SMS Text Line & Priority In-App Chat with Coach Gordon (24h SLA)',
      'Direct messaging with your coach',
      '8 Form Lab video reviews per month with 24h priority turnaround',
      'Master Coach Safety Gate: Bespoke OPT™ program overrides & injury modifications certified by Coach Gordon',
      'Quarterly video reviews with Coach Gordon',
      'Quarterly 33-point biomechanical mesh sign-off & priority evening/weekend advisory review windows',
      'Strictly limited to 15 active athlete seats to protect coach focus',
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

const MEMBERSHIP_ID_ALIASES: Readonly<Record<string, string>> = {
  core_lab: 'forge-core',
  plus: 'forge-pro-athlete',
  coach_support: 'forge-transformation-direct',
}

export function getForgeMembership(id: string): ForgeMembership | undefined {
  const canonicalId = MEMBERSHIP_ID_ALIASES[id.trim().toLowerCase()] ?? id
  return FORGE_MEMBERSHIPS.find(membership => membership.id === canonicalId)
}

export function isAnnualBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_ANNUAL_PLANS === 'true'
}

export function getForgeMembershipPrice(
  membership: ForgeMembership,
  cadence: ForgeMembershipCadence
): { amountCents: number; interval: 'month' | 'year' } | undefined {
  if (cadence === 'annual') {
    if (!isAnnualBillingEnabled() || membership.annualPriceCents === undefined) {
      return undefined
    }
    return { amountCents: membership.annualPriceCents, interval: 'year' }
  }

  return { amountCents: membership.monthlyPriceCents, interval: 'month' }
}

export function getMembershipsIncluding(feature: ForgeAddonFeature): ForgeMembership[] {
  return FORGE_MEMBERSHIPS.filter(m => m.includedFeatures?.some(f => f.feature === feature))
}
