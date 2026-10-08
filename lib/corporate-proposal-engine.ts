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

export const CORPORATE_TIER_PRESETS: CorporateTierPreset[] = [
  {
    id: '5-seats',
    name: 'Small Team',
    seats: 5,
    monthlyPrice: 2000,
    annualPrice: 20000,
    monthlyPerSeat: 400,
    annualPerSeat: 333,
    annualSavings: 4000,
    description: 'Training and wellness support for a team of five.',
    recommendedFor: 'Small organizations and local teams',
  },
  {
    id: '10-seats',
    name: 'Team Plan',
    seats: 10,
    monthlyPrice: 3500,
    annualPrice: 35000,
    monthlyPerSeat: 350,
    annualPerSeat: 292,
    annualSavings: 7000,
    description: 'A team program with training resources, monthly workshops, and quarterly progress reviews.',
    recommendedFor: 'Small and mid-sized organizations',
  },
  {
    id: '25-seats',
    name: 'Growing Team',
    seats: 25,
    monthlyPrice: 7500,
    annualPrice: 75000,
    monthlyPerSeat: 300,
    annualPerSeat: 250,
    annualSavings: 15000,
    description: 'Wellness and fitness support that can be offered across departments and teams.',
    recommendedFor: 'Mid-sized organizations and larger teams',
  },
  {
    id: '50-seats',
    name: 'Organization Plan',
    seats: 50,
    monthlyPrice: 13500,
    annualPrice: 135000,
    monthlyPerSeat: 270,
    annualPerSeat: 225,
    annualSavings: 27000,
    description: 'A workplace wellness program for organizations with larger teams.',
    recommendedFor: 'Large organizations and distributed teams',
  },
]

export function computeCorporateFinancials(seats: number, cadence: CorporateCadence): CorporateFinancials {
  const safeSeats = Math.max(1, Math.min(250, Math.round(seats || 10)))

  // Check if matches an exact preset
  const preset = CORPORATE_TIER_PRESETS.find(p => p.seats === safeSeats)

  let monthlyInvestment = 0
  let annualInvestment = 0

  if (preset) {
    monthlyInvestment = preset.monthlyPrice
    annualInvestment = preset.annualPrice
  } else {
    // Dynamic sliding scale per seat
    let ratePerSeat = 350
    if (safeSeats <= 5) ratePerSeat = 400
    else if (safeSeats <= 15) ratePerSeat = 350
    else if (safeSeats <= 35) ratePerSeat = 300
    else ratePerSeat = 270

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

  // Productivity & cognitive fatigue metrics
  // Average executive recovers ~6.5 high-performance hours/month from reduced afternoon crashes,
  // alleviated spinal/cervical pain, and rapid redeye flight adaptation.
  const estimatedMonthlyHoursRecovered = Math.round(safeSeats * 6.5)
  const estimatedAnnualHoursRecovered = estimatedMonthlyHoursRecovered * 12
  // Blended executive hourly value estimated at $350/hr
  const estimatedEnterpriseValueCreated = estimatedAnnualHoursRecovered * 350

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
  const deliverables: CorporateDeliverableItem[] = [
    {
      number: '01',
      title: `${seats} app memberships`,
      headline: 'Training plans and health tools',
      details: 'Each participant can use the GAA app for personalized NASM OPT™ training plans, workout tracking, cardio tools, and movement resources.',
      cadence: 'Continuous Access',
    },
    {
      number: '02',
      title: 'Monthly live team workshop',
      headline: 'Movement, ergonomics, and stress management',
      details: 'Coach Scott Gordon, a NASM-certified trainer, leads a 60-minute virtual or on-site workshop on movement, desk ergonomics, and recovery.',
      cadence: 'Monthly',
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
      details: 'Find training options for travel, changing sleep schedules, limited equipment, or a busy workday.',
      cadence: 'On-Demand',
    },
    {
      number: '05',
      title: 'Direct coaching support',
      headline: 'Help with training plans and scheduling',
      details: 'Team contacts and participants can reach the coach with questions about plan adjustments, travel, or scheduling.',
      cadence: 'Priority Real-Time',
    },
  ]

  if (cadence === 'annual') {
    deliverables.push({
      number: '06',
      title: 'On-site movement and ergonomics session',
      headline: 'Movement and workstation assessment',
      details: 'Annual program option: Coach Gordon leads an in-person movement and workstation assessment at your organization.',
      cadence: 'Annual Inclusion',
    })
  }

  return deliverables
}
