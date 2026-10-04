import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-08-26.dahlia',
    })
  : (null as unknown as Stripe)

export interface CoachingPackage {
  id: string
  name: string
  subtitle: string
  billingLabel: string
  price: number
  sessions: number
  pifPriceCents?: number
  pifSessions?: number
  pifSavings?: string
  pifBonusDescription?: string
  description: string
  deliverables: string[]
  serviceLevels: string[]
  commitment: string
  bestFor: string
  priceId: string
  popular?: boolean
}

export interface CoachingAddon {
  id: string
  name: string
  subtitle: string
  billingType: 'one_time' | 'recurring_monthly'
  priceCents: number
  badge: string
  icon: string
  description: string
  deliverables: string[]
  recommendedFor: string
  priceId?: string
  sessions?: number
}

// Canonical coaching offers for pricing pages and Stripe checkout.
export const PACKAGES: CoachingPackage[] = [
  {
    id: 'lab',
    name: 'Autonomous Digital Lab',
    subtitle: 'Tier 0 · Self-Guided Sports Science',
    billingLabel: 'per 30-day cycle',
    sessions: 0,
    price: 5900,
    pifPriceCents: 49900,
    pifSessions: 0,
    pifSavings: '$209',
    pifBonusDescription: 'Full 12-Month Annual Pass + Complimentary 3D Postural Screen',
    description: 'Autonomous sports science access to the 5-phase NASM OPT™ training engine, in-gym Cadence Pulse HUD, Tanaka stage cardio telemetry, and monthly 3D AI postural scans.',
    deliverables: [
      'Autonomous 5-phase NASM OPT™ periodized programming tailored to your equipment setup',
      'Integrated Cadence Pulse HUD with auditory tempo tones and hardware Taptic Engine haptics',
      'Tanaka Heart Rate Stage Cardio (Stages 1–3) & EPOC anaerobic conditioning engine',
      'Monthly 3D AI Postural Distortion & Visual Body Composition Scanners',
      'Offline in-gym workout logging with zero-connectivity queue and instant cloud sync',
      'Official photorealistic Movement Library with biomechanical cues (Zero coach messaging or live calls)',
    ],
    serviceLevels: [
      'Fully automated software telemetry & progressive overload tracking',
      'Instant dynamic workout recalibrations and exercise substitutions',
      'Autonomous self-service execution without calendar constraints',
    ],
    commitment: 'Monthly or Annual membership. Cancel anytime with 1 click.',
    bestFor: 'Self-driven lifters and athletes seeking elite sports science periodization and telemetry without 1:1 coach overhead.',
    priceId: '',
  },
  {
    id: 'alumni',
    name: 'Alumni Continuity Retainer',
    subtitle: 'Alumni · Post-Transformation Maintenance',
    billingLabel: 'per 30-day cycle',
    sessions: 0,
    price: 14900,
    pifPriceCents: 129500,
    pifSessions: 0,
    pifSavings: '$493',
    pifBonusDescription: 'Full 12-Month Maintenance Pass + Priority Recalibration Queue',
    description: 'Dedicated post-transformation continuity for athletes who have completed an adaptation cycle and demand ongoing app telemetry, monthly AI scans, and Sunday master recalibrations.',
    deliverables: [
      'Ongoing 5-phase OPT™ periodized programming & progressive overload maintenance',
      'Monthly Master Coach Telemetry Audit & Macrocycle Recalibration (First Sunday of each month)',
      'Integrated Cadence Pulse HUD, Barbell Plate Calculator, and Rest Timers',
      'Monthly 3D AI Body Composition & Postural Distortion Screenings',
      'Direct concierge coach messaging channel with 48h response SLA',
      'Maintenance periodization preventing post-transformation regression',
    ],
    serviceLevels: [
      'Monthly master coach Sunday audit turnaround within 48 business hours',
      'Coach message response SLA: within 48 business hours (Mon–Fri)',
      'Telemetry audits conducted on the 1st Sunday of every cycle',
    ],
    commitment: 'Monthly or Annual alumni retainer. Recommended for graduates of 12-week macrocycles.',
    bestFor: 'Transformational alumni who have graduated from live 1:1 coaching and want seamless accountability and progressive periodization without weekly calls.',
    priceId: '',
  },
  {
    id: 'starter',
    name: 'Performance Protocol',
    subtitle: 'Tier 1 · Autonomous Protocol',
    billingLabel: 'per 30-day cycle',
    sessions: 0,
    price: 34900,
    pifPriceCents: 94900,
    pifSessions: 0,
    pifSavings: '$98',
    pifBonusDescription: 'Complimentary Road-Warrior Travel Pass & 12-Week Adaptation Periodization',
    description: 'Individualized 5-phase OPT™ macrocycles, Apple Health & Health Connect biometric telemetry, 3D muscle recovery heatmaps, and weekly master coach direction.',
    deliverables: [
      'Individualized 5-phase OPT™ periodized programming tailored to your biomechanics and equipment setup',
      'Continuous background telemetry sync with Apple HealthKit and Android Health Connect (Whoop, Garmin, Oura)',
      'Tanaka Heart Rate Stage Cardio & EPOC conditioning protocols',
      'Daily CNS Readiness Scoring & 3D Muscle Recovery heatmaps',
      'Weekly automated telemetry audit & progressive overload recalibration by Coach Gordon',
      'Direct concierge coach messaging channel with 24 business hour turnaround (Mon–Fri)',
    ],
    serviceLevels: [
      'Coach message response SLA: within 24 business hours (Mon–Fri)',
      'Program recalibration turnaround: within 48 business hours of check-in',
      'Telemetry audits conducted every Sunday by master coach',
    ],
    commitment: 'Monthly concierge retainer. Recommended initial engagement: 12-week adaptation block.',
    bestFor: 'Self-driven executives and athletes who execute autonomously and demand clinical-grade periodization without scheduling constraints.',
    priceId: '', // set after creating in Stripe dashboard
  },
  {
    id: 'momentum',
    name: 'Hybrid Concierge',
    subtitle: 'Tier 2 · Flagship Membership',
    billingLabel: 'per 30-day cycle',
    sessions: 1,
    price: 64900,
    pifPriceCents: 169500,
    pifSessions: 3,
    pifSavings: '$252',
    pifBonusDescription: 'Complimentary 3D Kinetic Movement & Postural Diagnostic ($249 Value)',
    description: 'Our flagship tier: custom weekly periodization, monthly 1:1 WebRTC live video consultation studio with real-time telestrator, biomechanical form critiques, and metabolic nutrition.',
    deliverables: [
      'Everything in Performance Protocol',
      'One 60-minute live 1:1 WebRTC consultation studio session per month with real-time telestrator drawing & frame capture',
      'Monthly 3D AI Postural Mesh Scan (OHSA 5 Kinetic Checkpoints) & automated CEx corrective continuum',
      'Priority Biomechanical Video Form Critiques on heavy compound lifts with coach voiceover overlays',
      'Metabolic Nutrition Protocol with goal-adjusted macro cycling & peri-workout carb timing',
      'Dedicated Coach Voice Notes and priority check-in feedback via private CDN audio stream',
    ],
    serviceLevels: [
      'Coach message response SLA: priority within 12 business hours (Mon–Fri)',
      'Check-in review turnaround: within 24 business hours',
      'Live consultation booking: guaranteed concierge scheduling within 7 days',
    ],
    commitment: 'Monthly concierge retainer. Recommended engagement: 12-week transformation cycle.',
    bestFor: 'High-performing executives and athletes who want continuous biofeedback, live movement diagnostics, and regular 1:1 recalibration.',
    priceId: '',
    popular: true,
  },
  {
    id: 'transformation',
    name: 'Executive 1:1 Master',
    subtitle: 'Tier 3 · Private Master Retainer',
    billingLabel: 'per 30-day cycle',
    sessions: 4,
    price: 149500,
    pifPriceCents: 389500,
    pifSessions: 12,
    pifSavings: '$590',
    pifBonusDescription: 'Complimentary Supplement Stacking Audit & Travel Suite ($278 Value)',
    description: 'Bespoke white-glove sports science direction with weekly live 1:1 WebRTC studio sessions, Voice S.O.A.P. clinical notes, clinical supplement prescribing, and VIP same-day access.',
    deliverables: [
      'Everything in Hybrid Concierge',
      'Four 60-minute live 1:1 WebRTC video studio sessions per month (weekly live coaching cadence) with live telestrator & slow-mo replay',
      'Clinical Voice S.O.A.P. notes dictation & AI medical synthesis archived to client dossier',
      'Clinical Supplement Prescription & Biomarker Stacking Protocol with contraindication audits',
      'Executive Road-Warrior Travel Transformer (instant dynamic workout adapting for hotel gyms)',
      'Bi-weekly periodization re-architecting and planned deload management',
      'VIP Direct Line with urgent training blocker resolution (within 4 business hours)',
    ],
    serviceLevels: [
      'Coach message response SLA: same business day VIP priority queue',
      'Urgent training blocker response SLA: within 4 business hours (Mon–Fri)',
      'Plan adjustments: within 24 business hours after weekly live consult',
    ],
    commitment: 'Quarterly master retainer. Strictly capped at 8 active private clients for uncompromising focus.',
    bestFor: 'Founders, C-suite leaders, and elite athletes who demand master-level 1:1 direction and rapid, uncompromised body recomposition.',
    priceId: '',
  },
  {
    id: 'corporate',
    name: 'Corporate Executive Retainer',
    subtitle: 'B2B Leadership Wellness · Up to 10 Seats',
    billingLabel: 'per 30-day corporate billing cycle',
    sessions: 1,
    price: 350000,
    pifPriceCents: 3500000,
    pifSessions: 12,
    pifSavings: '$7,000',
    pifBonusDescription: 'Full 12-Month Corporate License + Complimentary On-Site Ergonomic Audit',
    description: 'Turnkey sports science human performance infrastructure for venture capital firms, law partnerships, and executive leadership teams.',
    deliverables: [
      'Multi-seat license for up to 10 executives on the GAA platform',
      'Autonomous 5-phase OPT™ workouts, Cadence HUD, and monthly 3D AI body/posture scans for all 10 members',
      'One 60-minute Monthly Live Executive Biomechanics & Ergonomics Telemetry Workshop with Coach Gordon',
      'Quarterly Executive Team Physical Health, HRV Resilience, and Postural Telemetry Audits',
      'Priority Concierge Road-Warrior Travel Recalibration for executive flight schedules',
      'Consolidated monthly corporate billing with single invoicing and dedicated account lead',
    ],
    serviceLevels: [
      'Corporate lead response SLA: same-business-day VIP priority channel',
      'Workshop scheduling: guaranteed executive team availability within 14 days',
      'Quarterly executive telemetry reports delivered within 5 business days',
    ],
    commitment: 'Monthly or Annual corporate agreement. Custom enterprise seat counts available upon request.',
    bestFor: 'Law partners, private equity / VC teams, and executive suites seeking sustained energy, cognitive focus, and reduced corporate burnout.',
    priceId: '',
  },
]

// Bespoke Clinical Add-Ons & Performance Accelerators
export const COACHING_ADDONS: CoachingAddon[] = [
  {
    id: 'postural-diagnostic',
    name: '3D Kinetic Movement & Postural Diagnostic',
    subtitle: 'Clinical Biomechanical Screen',
    billingType: 'one_time',
    priceCents: 24900,
    badge: 'Clinical Assessment',
    icon: 'microscope',
    sessions: 1,
    description: 'Comprehensive 5-checkpoint kinetic chain assessment (OHSA) analyzing feet, knees, LPHC, shoulders, and cervical spine.',
    deliverables: [
      'Live 45-minute virtual Overhead Squat & Single-Leg dynamic screen',
      'Postural Distortion Syndrome mapping (Upper/Lower Crossed, Pronation Distortion)',
      'Custom corrective SMR and kinetic activation warmup embedded into your daily HUD',
      'Full clinical diagnostic report with anatomical overactive/underactive muscle breakdown',
    ],
    recommendedFor: 'Athletes experiencing nagging joint stiffness, muscular imbalances, or looking to maximize lifting mechanics safely.',
  },
  {
    id: 'metabolic-nutrition',
    name: 'Metabolic Nutrition & Nutrient Periodization Suite',
    subtitle: 'Clinical Metabolic Engine',
    billingType: 'recurring_monthly',
    priceCents: 14900,
    badge: 'Nutrition Engine',
    icon: 'lightning',
    sessions: 0,
    description: 'Dynamic metabolic modeling with training vs rest day macro cycling, peri-workout carb timing, and metabolic adaptation adjustments.',
    deliverables: [
      'Mifflin-St Jeor / Katch-McArdle metabolic rate calibration & body fat tracking',
      'High-carb training day vs high-fat rest day nutrient cycling schedules',
      'Pre-, intra-, and post-workout glycemic timing guidelines',
      'Weekly metabolic rate recalculation as body composition evolves',
    ],
    recommendedFor: 'Clients aiming for aggressive body recomposition, stubborn fat loss, or peak endurance performance.',
  },
  {
    id: 'video-critique-pass',
    name: 'Biomechanical Video Form Critique Pass',
    subtitle: 'Priority Movement Telemetry',
    billingType: 'recurring_monthly',
    priceCents: 19900,
    badge: 'Video Analysis',
    icon: 'video-studio',
    sessions: 0,
    description: 'Direct video upload access for your heavy compound lifts with frame-by-frame joint angle analysis and master coach voiceover feedback.',
    deliverables: [
      'Up to 8 video lift submissions per billing cycle (Squats, Deadlifts, Presses, Rows)',
      'Frame-by-frame bar path, lumbar alignment, and kinetic checkpoint review',
      'Coach voice/video critique returned within 24 business hours',
      'Immediate technical cues to eliminate power leaks and injury risks',
    ],
    recommendedFor: 'Lifters handling heavy loads who want continuous technical supervision on their compound execution.',
  },
  {
    id: 'supplement-audit',
    name: 'Clinical Supplement Stacking & Interaction Audit',
    subtitle: 'Evidence-Based Pharmacology',
    billingType: 'one_time',
    priceCents: 14900,
    badge: 'Pharmacology Protocol',
    icon: 'pill',
    sessions: 0,
    description: 'Evidence-based supplement protocol tailored to your biometric profile, training volume, and medical history.',
    deliverables: [
      'Comprehensive audit of current supplements for efficacy and purity',
      'Contraindication screening against medical conditions and medications',
      'Evidence-based ergogenic dosing protocol (Creatine, D3/K2, Omega-3, Magnesium)',
      'Specific third-party tested clinical brand recommendations (NSF for Sport / Informed Choice)',
    ],
    recommendedFor: 'Health-conscious executives seeking maximum biological recovery and clean cognitive/physical performance.',
  },
  {
    id: 'travel-warrior-pass',
    name: 'Executive Road-Warrior Travel Pass',
    subtitle: 'Dynamic Mobility Adapter',
    billingType: 'one_time',
    priceCents: 12900,
    badge: 'Travel Protocol',
    icon: 'plane',
    sessions: 0,
    description: '1-Click dynamic travel transformer that instantly adapts your periodized workouts to hotel gyms, minimal dumbbells, or travel bands.',
    deliverables: [
      'Instant in-app travel adapter converting any planned session to available hotel equipment',
      'Preserves current OPT™ phase periodization, volume, and metabolic intensity on the road',
      'Dedicated bodyweight & resistance-band hotel room contingency routines',
      'Circadian rhythm & travel recovery guidelines for international time-zone shifts',
    ],
    recommendedFor: 'Frequent travelers, executives, and consultants who never want travel to disrupt their physical progression.',
  },
]

export interface StandaloneProduct {
  id: string
  name: string
  subtitle: string
  priceCents: number
  badge: string
  icon: string
  description: string
  deliverables: string[]
  valueProposition: string
  upsellCreditCents: number
}

// Front-End Self-Liquidating Offers (SLOs)
export const STANDALONE_PRODUCTS: StandaloneProduct[] = [
  {
    id: 'ai-postural-audit',
    name: 'Clinical 3D AI Kinetic Chain & Postural Distortion Audit',
    subtitle: 'Self-Guided Biomechanical Diagnostics',
    priceCents: 9700,
    badge: 'Diagnostic Screen',
    icon: 'microscope',
    description: 'Instant computer-vision analysis of all 5 kinetic chain checkpoints (feet, knees, LPHC, shoulders, cervical spine) detecting silent compensations and injury risk.',
    deliverables: [
      'Full 4-view AI landmark joint angle tracking (Anterior, Lateral, Posterior, Overhead Squat)',
      'Clinical Distortion Syndrome detection (Upper Crossed, Lower Crossed, Pronation Distortion)',
      'Custom 4-Phase Corrective Exercise Continuum (Inhibit, Lengthen, Activate, Integrate)',
      'Instant interactive diagnostic HUD + downloadable clinical PDF report',
      '100% credit ($97 voucher) applicable towards any 12-Week Transformation Block or Concierge Retainer',
    ],
    valueProposition: 'Identifies the root biomechanical cause of nagging aches, joint friction, and power leaks.',
    upsellCreditCents: 9700,
  },
]


