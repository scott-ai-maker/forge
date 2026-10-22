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
}

export const FORGE_ADDON_CATEGORIES: readonly { id: ForgeAddonCategory; title: string; blurb: string }[] = [
  {
    id: 'advanced-feature',
    title: 'Performance Upgrades & Diagnostics',
    blurb: 'Targeted tools, asynchronous video reviews, and diagnostic movement screens you can add to any membership. One-time purchases, no new subscription.',
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
  // Parked 1:1 private session packs (parked while focusing on self-serve + async + occasional testing)
  {
    id: 'addon-private-session-single',
    category: 'private-session',
    name: 'Private Session',
    tagline: 'One live 1:1 session (evenings & Saturday mornings).',
    priceCents: 18000,
    sessions: 1,
    isParked: true,
    includes: [
      '60-minute live video session with Coach Gordon',
      'Dedicated off-hours booking (evenings & Saturday mornings, 48h advance notice)',
      'Technique, programming, or goal-setting focus—your choice',
    ],
  },
  {
    id: 'addon-private-session-4',
    category: 'private-session',
    name: '4-Session Private Pack',
    tagline: 'Four 1:1 coaching sessions across your training cycle.',
    priceCents: 66000,
    sessions: 4,
    listPriceCents: 72000,
    isParked: true,
    includes: [
      'Four 60-minute live sessions with Coach Gordon',
      'Dedicated off-hours booking (evenings & Saturdays, 48h advance notice)',
      'Plan adjusted after each session',
    ],
  },
  {
    id: 'addon-private-session-8',
    category: 'private-session',
    name: '8-Session Private Pack',
    tagline: 'Sustained 1:1 coaching for a full training block.',
    priceCents: 124000,
    sessions: 8,
    listPriceCents: 144000,
    isParked: true,
    includes: [
      'Eight 60-minute live sessions with Coach Gordon',
      'Dedicated off-hours booking (evenings & Saturdays, 48h advance notice)',
      'Plan adjusted after each session',
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
