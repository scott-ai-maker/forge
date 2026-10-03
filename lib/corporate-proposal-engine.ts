/**
 * Gordon Athletic Advisory (GAA) - Institutional Corporate Proposal & Financial Engine
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
    name: 'Boutique Syndicate',
    seats: 5,
    monthlyPrice: 2000,
    annualPrice: 20000,
    monthlyPerSeat: 400,
    annualPerSeat: 333,
    annualSavings: 4000,
    description: 'Dedicated human performance infrastructure for small partnership teams, hedge funds, and executive committees.',
    recommendedFor: 'Boutique investment firms, emerging fund managers, startup founders',
  },
  {
    id: '10-seats',
    name: 'Executive Core',
    seats: 10,
    monthlyPrice: 3500,
    annualPrice: 35000,
    monthlyPerSeat: 350,
    annualPerSeat: 292,
    annualSavings: 7000,
    description: 'Our benchmark multi-seat retainer providing turnkey sports science, monthly live masterclasses, and quarterly physical audits.',
    recommendedFor: 'Private equity partners, venture capital leadership, senior law firm partners',
  },
  {
    id: '25-seats',
    name: 'Partner Cohort',
    seats: 25,
    monthlyPrice: 7500,
    annualPrice: 75000,
    monthlyPerSeat: 300,
    annualPerSeat: 250,
    annualSavings: 15000,
    description: 'Comprehensive physical resilience protocol scaled across practice groups, partner tracks, and C-suite leadership.',
    recommendedFor: 'Mid-sized law firms, investment banks, corporate executive teams',
  },
  {
    id: '50-seats',
    name: 'Enterprise Division',
    seats: 50,
    monthlyPrice: 13500,
    annualPrice: 135000,
    monthlyPerSeat: 270,
    annualPerSeat: 225,
    annualSavings: 27000,
    description: 'Full-scale organizational vitality and spinal health framework for institutional leadership divisions.',
    recommendedFor: 'Fortune 500 business units, multinational advisory partnerships',
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
      title: `${seats} Executive Multi-Seat App Licenses`,
      headline: 'Autonomous 5-Phase Periodization & Biometrics',
      details: 'Each executive receives sovereign access to the GAA app, personalized NASM-OPT™ periodization schedules, Cadence Pulse Metronome, Tanaka Tanaka cardio telemetry, and monthly 3D AI postural scans.',
      cadence: 'Continuous Access',
    },
    {
      number: '02',
      title: 'Monthly Live Master Leadership Workshop',
      headline: 'Interactive Ergonomics & Stress Down-Regulation',
      details: 'Coach Scott Gordon, NASM Master Trainer, conducts an exclusive 60-minute virtual or on-site masterclass focusing on joint preservation, executive spinal health, and rapid autonomic recovery.',
      cadence: 'Monthly',
    },
    {
      number: '03',
      title: 'Quarterly Executive Physical & Team Telemetry Audits',
      headline: 'Boardroom-Grade Health & Readiness Briefings',
      details: 'Comprehensive, anonymized executive health analytics detailing team postural integrity, cardiovascular resilience biomarkers, and acute-to-chronic workload (ACWR) safety corridors.',
      cadence: 'Quarterly',
    },
    {
      number: '04',
      title: 'Road-Warrior Redeye & Concierge Travel Recalibration',
      headline: 'Global Time-Zone & Hotel Gym Adaptation',
      details: 'Instant tailored protocols for cross-country travel, irregular sleeping hours, hotel gym equipment limitations, and high-stress transactional deal sprints.',
      cadence: 'On-Demand',
    },
    {
      number: '05',
      title: 'Direct Private Sovereign Channel & Priority Dispatch',
      headline: 'Asynchronous Executive Advisory Access',
      details: 'Priority direct access for designated corporate administrators and principals for prompt protocol adjustments, travel consultations, and concierge scheduling.',
      cadence: 'Priority Real-Time',
    },
  ]

  if (cadence === 'annual') {
    deliverables.push({
      number: '06',
      title: 'Complimentary On-Site Postural & Ergonomic Clinic',
      headline: 'Private Executive Suite Ergonomic Screening',
      details: 'Annual agreement bonus: Coach Gordon conducts an in-person, 1:1 kinetic chain and workstation ergonomic assessment for leadership at your primary corporate headquarters.',
      cadence: 'Annual Inclusion',
    })
  }

  return deliverables
}
