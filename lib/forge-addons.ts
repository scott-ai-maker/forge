export type ForgeAddonCategory = 'advanced-feature' | 'private-session'

// Feature keys that an add-on unlocks inside the app. Private sessions unlock bookable credits instead.
export type ForgeAddonFeature = 'video-review' | 'nutrition' | 'travel'

export interface ForgeAddon {
  id: string
  category: ForgeAddonCategory
  name: string
  tagline: string
  priceCents: number
  // Bookable live-session credits granted at purchase (0 for async deliverables)
  sessions: number
  // Price of the same number of sessions bought individually, used to show pack savings
  listPriceCents?: number
  popular?: boolean
  unlocks?: ForgeAddonFeature
  // How long the purchase stays usable; sessions credits follow client_packages instead
  accessDays?: number
  // Number of uses granted for metered unlocks (omitted = unlimited during the access window)
  uses?: number
  includes: readonly string[]
  isParked?: boolean
  seatCapLabel?: string
  availabilityLabel?: string
}

export const FORGE_ADDON_CATEGORIES: readonly { id: ForgeAddonCategory; title: string; blurb: string }[] = [
  {
    id: 'advanced-feature',
    title: 'Performance Upgrades & Diagnostics',
    blurb: 'Targeted tools, asynchronous video reviews, and diagnostic movement screens you can add to any membership. One-time purchases, no new subscription.',
  },
  {
    id: 'private-session',
    title: 'Live 1-on-1 Studio Sessions',
    blurb: 'Real-time 1-on-1 coaching with Coach Gordon in the high-definition Forge Live Video Studio. Strictly limited seat capacity; availability dedicated exclusively to nights and weekends.',
  },
]

export const FORGE_ADDONS: readonly ForgeAddon[] = [
  {
    id: 'addon-movement-screen',
    category: 'advanced-feature',
    name: 'Biomechanical Movement Screen & Diagnostic',
    tagline: 'Comprehensive kinetic chain assessment to identify compensations with an actionable corrective plan.',
    priceCents: 15900,
    sessions: 1,
    popular: true,
    includes: [
      'Comprehensive 5-angle movement screen (scheduled diagnostic slot or guided video capture)',
      'Detailed posture and kinetic chain compensation report',
      'Personalized corrective warm-up added to your training plan',
      'Direct diagnostic review notes from Coach Gordon',
    ],
  },
  {
    id: 'addon-video-review-pack',
    category: 'advanced-feature',
    name: 'Technique Video Review Pack',
    tagline: 'Upload your lifts and get frame-by-frame form feedback.',
    priceCents: 4900,
    sessions: 0,
    unlocks: 'video-review',
    accessDays: 90,
    uses: 4,
    includes: [
      'Four video form analyses in the Form Lab',
      'Fault detection with technique cues and corrective exercises',
      'Use them any time in 90 days',
    ],
  },
  {
    id: 'addon-nutrition-blueprint',
    category: 'advanced-feature',
    name: 'Nutrition Blueprint',
    tagline: 'A practical eating plan matched to your training.',
    priceCents: 3900,
    sessions: 0,
    unlocks: 'nutrition',
    accessDays: 60,
    includes: [
      'Calorie and macro targets for training and rest days',
      'Meal-timing guidance around your workouts',
      '60 days of access as your progress changes',
    ],
  },
  {
    id: 'addon-travel-pass',
    category: 'advanced-feature',
    name: 'Travel Training Pass',
    tagline: 'Keep your plan on track in hotel gyms and on the road.',
    priceCents: 1900,
    sessions: 0,
    unlocks: 'travel',
    accessDays: 30,
    includes: [
      '30 days of one-tap workout swaps for hotel and limited equipment',
      'Hotel-room and resistance-band routines',
      'Jet-lag recovery guidelines',
    ],
  },
  // Live 1:1 private session packs (strictly limited seat roster, dedicated to nights & weekends)
  {
    id: 'addon-private-session-single',
    category: 'private-session',
    name: 'Live 1-on-1 Private Session',
    tagline: 'One 60-minute live studio session with Coach Gordon (nights & weekends only).',
    priceCents: 18000,
    sessions: 1,
    isParked: false,
    seatCapLabel: 'Strictly limited seats',
    availabilityLabel: 'Nights & weekends only',
    includes: [
      '60-minute live video session with Coach Gordon in the high-definition Live Studio',
      'Dedicated off-hours booking: Evenings & weekends only (48h advance notice)',
      'Strictly limited seat roster to ensure master-level attention and programming depth',
      'Real-time form correction, telestrator markups, and instant NASM OPT™ program updates',
    ],
  },
  {
    id: 'addon-private-session-4',
    category: 'private-session',
    name: '4-Session Live 1-on-1 Pack',
    tagline: 'Four 60-minute live sessions across your training cycle (nights & weekends).',
    priceCents: 66000,
    sessions: 4,
    listPriceCents: 72000,
    isParked: false,
    seatCapLabel: 'Strictly limited seats',
    availabilityLabel: 'Nights & weekends only',
    includes: [
      'Four 60-minute live sessions with Coach Gordon in the Live Studio',
      'Dedicated off-hours booking: Scheduled exclusively for nights and weekends (48h notice)',
      'Strictly limited seat roster to protect coach responsiveness and personal focus',
      'Program calibration and kinetic compensation tracking after each session',
    ],
  },
  {
    id: 'addon-private-session-8',
    category: 'private-session',
    name: '8-Session Live 1-on-1 Block',
    tagline: 'Sustained 1-on-1 coaching for a full 8-week training block (nights & weekends).',
    priceCents: 124000,
    sessions: 8,
    listPriceCents: 144000,
    isParked: false,
    seatCapLabel: 'Strictly limited seats',
    availabilityLabel: 'Nights & weekends only',
    includes: [
      'Eight 60-minute live sessions with Coach Gordon in the Live Studio',
      'Dedicated off-hours booking: Scheduled exclusively for nights and weekends (48h notice)',
      'Strictly limited seat roster to maintain premier coaching stewardship',
      'Continuous periodized progression, deload management, and weekly biomechanical review',
    ],
  },
]

export function getForgeAddon(id: string): ForgeAddon | undefined {
  return FORGE_ADDONS.find(addon => addon.id === id)
}

export function getActiveForgeAddons(): ForgeAddon[] {
  return FORGE_ADDONS.filter(addon => !addon.isParked)
}

export function getForgeAddonsByCategory(category: ForgeAddonCategory, includeParked = false): ForgeAddon[] {
  return FORGE_ADDONS.filter(addon => addon.category === category && (includeParked || !addon.isParked))
}

export function getForgeAddonByFeature(feature: ForgeAddonFeature): ForgeAddon | undefined {
  return FORGE_ADDONS.find(addon => addon.unlocks === feature)
}

export function getForgeAddonPerSessionCents(addon: ForgeAddon): number | undefined {
  return addon.sessions > 1 ? Math.round(addon.priceCents / addon.sessions) : undefined
}
