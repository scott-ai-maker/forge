/**
 * Forge Athletic - Institutional Corporate Proposal & Financial Engine
 * Multi-seat tier modeling, executive ROI projection, and cryptographic proposal authentication.
 */

export type CorporateCadence = 'monthly' | 'annual'

export interface CorporateTierPreset {
  id: string
  name: string
  seats: number
  monthlyPrice: number
  annualPrice: number
  monthlyPerSeat: number
  annualPerSeat: number
  annualSavings: number
  description: string
  recommendedFor: string
}

export interface CorporateFinancials {
  seats: number
  cadence: CorporateCadence
  monthlyInvestment: number
  annualInvestment: number
  activePrice: number
  billingIntervalText: string
  perSeatMonthlyEffective: number
  annualSavings: number
  discountPct: number
  estimatedMonthlyHoursRecovered: number
  estimatedAnnualHoursRecovered: number
  estimatedEnterpriseValueCreated: number
}

export interface CorporateProposalConfig {
  companyName: string
  sponsorName: string
  sponsorTitle: string
  sponsorEmail?: string
  seats: number
  cadence: CorporateCadence
  customNotes?: string
  targetStartDate?: string
}

export interface CorporateDeliverableItem {
  number: string
  title: string
  headline: string
  details: string
  cadence: string
}

/**
 * Maximum corporate cohort seats currently supported by a solo NASM-CPT coach
 * and Forge Athletic's Coach-Hub Star Topology WebRTC Live Studio.
 * Live rooms stay capped at ≤6 concurrent athletes (10-seat teams split into two 5-person pods).
 */
export const MAX_CONCURRENT_LIVE_STUDIO_ATHLETES = 6
export const MAX_SUPPORTED_CORPORATE_SEATS = 10

export const CORPORATE_TIER_PRESETS: CorporateTierPreset[] = [
  {
    id: '4-seats',
    name: 'Small Team Pod',
    seats: 4,
    monthlyPrice: 1600,
    annualPrice: 16000,
    monthlyPerSeat: 400,
    annualPerSeat: 333,
    annualSavings: 3200,
    description: 'Single live small-group pod of up to 4 athletes with personalized NASM OPT™ plans and live form coaching.',
    recommendedFor: 'Founder teams, boutique partners, and tight-knit leadership pods (1 live room)',
  },
  {
    id: '6-seats',
    name: 'Executive Small Group',
    seats: 6,
    monthlyPrice: 2200,
    annualPrice: 22000,
    monthlyPerSeat: 367,
    annualPerSeat: 306,
    annualSavings: 4400,
    description: 'Our NASM-CPT small-group sweet spot: up to 6 athletes training together live in one encrypted Team Live Studio session.',
    recommendedFor: 'Leadership teams of 5–6 seeking individualized live form coaching (1 live room)',
  },
  {
    id: '10-seats',
    name: 'Dual-Pod Team',
    seats: 10,
    monthlyPrice: 3500,
    annualPrice: 35000,
    monthlyPerSeat: 350,
    annualPerSeat: 292,
    annualSavings: 7000,
    description: 'Up to 10 app memberships coached live in two small-group pods of 5 (max 6 per live video room) to protect form quality.',
    recommendedFor: 'Teams of 7–10 coached across two dedicated 5-person Live Studio pods',
  },
]

export interface CorporateRoiAssumptions {
  assumedMonthlyHoursRecoveredPerSeat?: number
  assumedHourlyValueUsd?: number
}

export function computeCorporateFinancials(
  seats: number,
  cadence: CorporateCadence,
  assumptions: CorporateRoiAssumptions = {}
): CorporateFinancials {
  const safeSeats = Math.max(1, Math.min(MAX_SUPPORTED_CORPORATE_SEATS, Math.round(seats || 6)))

  // Check if matches an exact preset
  const preset = CORPORATE_TIER_PRESETS.find(p => p.seats === safeSeats)

  let monthlyInvestment = 0
  let annualInvestment = 0

  if (preset) {
    monthlyInvestment = preset.monthlyPrice
    annualInvestment = preset.annualPrice
  } else {
    // Dynamic sliding scale per seat within supported 1–10 seat capacity
    let ratePerSeat = 350
    if (safeSeats <= 4) ratePerSeat = 400
    else if (safeSeats <= 6) ratePerSeat = 367
    else ratePerSeat = 350

    monthlyInvestment = safeSeats * ratePerSeat
    // Annual is 10 months of monthly rate (2 months complimentary)
    annualInvestment = monthlyInvestment * 10
  }

  const annualSavings = (monthlyInvestment * 12) - annualInvestment
  const discountPct = Math.round((annualSavings / (monthlyInvestment * 12)) * 100)

  const activePrice = cadence === 'annual' ? annualInvestment : monthlyInvestment
  const billingIntervalText = cadence === 'annual' ? '/ year (paid upfront)' : '/ 30-day billing cycle'
  const perSeatMonthlyEffective = Math.round(
    cadence === 'annual' ? (annualInvestment / 12) / safeSeats : monthlyInvestment / safeSeats
  )

  // Illustrative hypothetical customer-input scenario (not an empirically audited ROI guarantee):
  // Default model input: 6.5 hrs/mo per participant × $350/hr customer-adjustable blended rate.
  const monthlyHoursInput = Math.max(0, assumptions.assumedMonthlyHoursRecoveredPerSeat ?? 6.5)
  const hourlyValueInput = Math.max(0, assumptions.assumedHourlyValueUsd ?? 350)
  const estimatedMonthlyHoursRecovered = Math.round(safeSeats * monthlyHoursInput)
  const estimatedAnnualHoursRecovered = estimatedMonthlyHoursRecovered * 12
  const estimatedEnterpriseValueCreated = estimatedAnnualHoursRecovered * hourlyValueInput

  return {
    seats: safeSeats,
    cadence,
    monthlyInvestment,
    annualInvestment,
    activePrice,
    billingIntervalText,
    perSeatMonthlyEffective,
    annualSavings,
    discountPct,
    estimatedMonthlyHoursRecovered,
    estimatedAnnualHoursRecovered,
    estimatedEnterpriseValueCreated,
  }
}

export function generateCorporateDocRefId(companyName: string, seats: number): string {
  const clean = companyName.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'CORP'
  const year = new Date().getFullYear()
  return `GAA-PROP-${clean}-${seats}S-${year}`
}

export function generateCorporateProposalSignature(
  companyName: string,
  annualInvestment: number,
  seats: number
): string {
  let hash = 0x811c9dc5
  const raw = `${companyName}|${annualInvestment}|${seats}|GAA-MASTER-ENTERPRISE-2026`
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return `GAA-SIG-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

export function getProposalDeliverablesList(seats: number, cadence: CorporateCadence): CorporateDeliverableItem[] {
  const safeSeats = Math.max(1, Math.min(MAX_SUPPORTED_CORPORATE_SEATS, Math.round(seats || 6)))
  const usesDualPods = safeSeats > MAX_CONCURRENT_LIVE_STUDIO_ATHLETES
  const deliverables: CorporateDeliverableItem[] = [
    {
      number: '01',
      title: `${safeSeats} app memberships`,
      headline: 'Personalized NASM OPT™ plans & posture checks',
      details: 'Each participant gets the Forge Athletic app with individualized NASM OPT™ training plans, workout tracking, cardio tools, and local 33-point posture screening.',
      cadence: 'Continuous Access',
    },
    {
      number: '02',
      title: usesDualPods ? 'Monthly live small-group sessions (2 pods of up to 5)' : `Monthly live small-group coaching session (up to ${safeSeats} live)`,
      headline: 'Encrypted Live Studio form coaching, mobility & strength',
      details: usesDualPods
        ? 'Coach Gordon (NASM-CPT) leads monthly 60-minute live coaching sessions split into two dedicated small-group pods (max 5–6 athletes per live video room) to ensure hands-on form visibility.'
        : 'Coach Gordon (NASM-CPT) leads a 60-minute encrypted Live Studio small-group coaching session focused on movement quality, strength, mobility, and recovery.',
      cadence: 'Monthly (Evenings & Weekends)',
    },
    {
      number: '03',
      title: 'Quarterly team wellness review',
      headline: 'Progress and participation overview',
      details: 'Review combined, non-identifying trends in movement, activity, and program participation across the team.',
      cadence: 'Quarterly',
    },
    {
      number: '04',
      title: 'Training support while traveling',
      headline: 'Flexible options for different schedules and spaces',
      details: 'Adapt workouts cleanly for hotel gyms, limited equipment, travel days, and busy executive schedules.',
      cadence: 'On-Demand',
    },
    {
      number: '05',
      title: 'Direct coach messaging support',
      headline: 'Plan adjustments, exercise swaps & scheduling',
      details: 'Team contacts and participants can message Coach Gordon directly for program adjustments, travel swaps, or scheduling (1-business-day response).',
      cadence: '1-Business-Day SLA',
    },
  ]

  if (cadence === 'annual') {
    deliverables.push({
      number: '06',
      title: 'Annual virtual movement & ergonomics clinic',
      headline: 'Interactive workstation & posture screening workshop',
      details: 'Annual program inclusion: Coach Gordon leads a dedicated interactive Live Studio movement & desk ergonomics clinic for your cohort (optional Greater Boston on-site by arrangement).',
      cadence: 'Annual Inclusion',
    })
  }

  return deliverables
}
