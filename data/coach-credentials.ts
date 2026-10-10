import type { GaaIconName } from '@/components/ui/GaaIcon'

export type CredentialCategory =
  | 'clinical'
  | 'performance'
  | 'metabolic'
  | 'specialized'
  | 'safety'

export type CredentialStatus =
  | 'active'
  | 'completed'
  | 'in_progress'
  | 'pinnacle'

export interface CoachCredential {
  id: string
  code: string
  title: string
  issuer: string
  issuerShort: string
  category: CredentialCategory
  categoryLabel: string
  status: CredentialStatus
  statusLabel: string
  isNccaAccredited?: boolean
  certificateNumber?: string
  issueDate?: string
  expirationDate?: string
  completionDate?: string
  verificationUrl?: string
  badgeImage?: string
  certificatePdf?: string
  certificatePreviewImage?: string
  badgeTone: string
  icon: GaaIconName
  summary: string
  curriculum: string[]
  gaaEngineIntegration?: string
  featured?: boolean
}

export const COACH_CREDENTIALS: CoachCredential[] = [
  // ── 1. NCCA ACCREDITED ACTIVE PRIMARY CREDENTIAL ─────────────────────────────
  {
    id: 'nasm-cpt',
    code: 'NASM-CPT®',
    title: 'Certified Personal Trainer',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'active',
    statusLabel: 'Verified Active · NCCA Accredited',
    isNccaAccredited: true,
    certificateNumber: '1261890687',
    issueDate: 'October 7, 2026',
    expirationDate: 'October 7, 2028',
    verificationUrl: 'https://www.credential.net/07f48168-fa30-4a54-bd43-ae0f8a66677b',
    badgeImage: '/images/badges/nasm-cpt-badge.png',
    certificatePdf: '/documents/credentials/nasm-cpt-certificate.pdf',
    certificatePreviewImage: '/images/credentials/nasm-cpt-certificate.png',
    badgeTone: '#C5A059',
    icon: 'award',
    featured: true,
    summary:
      'NASM Certified Personal Trainers (NCCA accredited) master the scientific principles, foundational concepts, and practical techniques to train and motivate clients in exercise activities. They assess fitness levels, personal goals, and movement patterns to build customized, periodized training programs with progressive feedback.',
    curriculum: [
      '5-Phase OPT™ Periodization Architecture (Stabilization to Peak Power)',
      'Kinetic Chain Dynamic Posture & Overhead Squat Assessment (OHSA)',
      'Neuromuscular Stabilization & Proprioception Calibration',
      'Acute Training Variable Modulation (Tempo, Sets, Reps, Rest Intervals)',
      'Cardiorespiratory Conditioning & Metabolic Heart Rate Zones',
      'Individualized Program Design & Biomechanical Adaptation Guardrails',
    ],
    gaaEngineIntegration:
      'Powers the core Forge periodization generator, tempo constraints (4-2-1-1 to explosive), and automated progressive overload logic in `lib/nasm-opt-exercise-selection.ts`.',
  },

  // ── 2. LIFESPAN & EMERGENCY CARDIAC SAFETY ─────────────────────────────────
  {
    id: 'asti-cpr-aed',
    code: 'CPR / AED',
    title: 'Adult, Child & Infant CPR/AED',
    issuer: 'American Safety Training Institute (ASTI)',
    issuerShort: 'ASTI',
    category: 'safety',
    categoryLabel: 'Emergency Care & Safety',
    status: 'active',
    statusLabel: 'Certified Active',
    certificateNumber: '1261890193',
    issueDate: 'October 7, 2026',
    expirationDate: 'October 7, 2028',
    verificationUrl: 'https://www.AmericanSTI.org',
    certificatePdf: '/documents/credentials/asti-cpr-aed-certificate.pdf',
    certificatePreviewImage: '/images/credentials/asti-cpr-aed-certificate.png',
    badgeTone: '#EF4444',
    icon: 'heart-rate',
    featured: true,
    summary:
      'Cognitive and practical skills evaluation following national emergency cardiovascular care guidelines for comprehensive Adult, Child, and Infant CPR and automated external defibrillator (AED) operation for community and workplace safety.',
    curriculum: [
      'Adult, Child, and Infant Cardiopulmonary Resuscitation (CPR)',
      'Automated External Defibrillator (AED) Deployment & Pad Placement',
      'Foreign-Body Airway Obstruction & Choking Relief Protocols',
      'Sudden Cardiac Arrest Recognition & Immediate Emergency Response',
      'Chain of Survival & Emergency Medical Dispatch Coordination',
    ],
    gaaEngineIntegration:
      'Establishes the clinical safety and cardiovascular risk threshold enforcement across high-intensity training protocols, heart-rate zones, and PAR-Q+ assessments.',
  },

  // ── 3. NASM ACADEMIC ORIENTATION ───────────────────────────────────────────
  {
    id: 'nasm-orientation',
    code: 'NASM Orientation',
    title: 'NASM Learner Orientation Course',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'completed',
    statusLabel: 'Course Completed',
    completionDate: 'April 12, 2026',
    certificatePdf: '/documents/credentials/nasm-orientation-record.pdf',
    certificatePreviewImage: '/images/credentials/nasm-orientation-record.png',
    badgeTone: '#60A5FA',
    icon: 'clipboard',
    featured: false,
    summary:
      'Official Record of Completion for the NASM Learner Orientation curriculum, confirming mastery of NASM academic standards, digital learning architecture, and professional scope of practice.',
    curriculum: [
      'NASM Digital Portal Navigation & Educational Governance',
      'OPT™ Framework Foundational Architecture',
      'Professional Code of Ethics & Scope of Practice Standards',
      'Continuing Education Unit (CEU) Maintenance Roadmap',
    ],
    gaaEngineIntegration:
      'Anchors platform documentation to official NASM terminology and professional code of ethics compliance.',
  },

  // ── 4. MASTER TRAINER PATHWAY: SPECIALIZATIONS IN PROGRESS ─────────────────
  {
    id: 'ces',
    code: 'NASM-CES®',
    title: 'Corrective Exercise Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#38BDF8',
    icon: 'movement-screen',
    featured: true,
    summary:
      'Systematic movement diagnostics and kinetic restoration through the clinical 4-Step Corrective Exercise Continuum (Inhibit, Lengthen, Activate, Integrate).',
    curriculum: [
      'Overhead Squat Assessment (OHSA) 5 Checkpoints',
      'Phase 1: Inhibit (Self-Myofascial Release / SMR)',
      'Phase 2: Lengthen (Static & Neuromuscular Stretch)',
      'Phase 3: Activate (Isolated Strengthening & Isometrics)',
      'Phase 4: Integrate (Dynamic Multi-Planar Integration)',
    ],
    gaaEngineIntegration:
      'Drives the AI Posture & OHSA Diagnostics Suite, kinetic chain compensation alerts (LPHC, knee valgus, asymmetrical weight shift), and auto-prescribed 4-phase CEx warmups.',
  },
  {
    id: 'pes',
    code: 'NASM-PES®',
    title: 'Performance Enhancement Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#F59E0B',
    icon: 'lightning',
    featured: true,
    summary:
      'Elite athletic development, Rate of Force Development (RFD), speed-agility-quickness (SAQ) mechanics, and contrast periodization.',
    curriculum: [
      'Rate of Force Development (RFD) & Explosive Power',
      'Speed, Agility, and Quickness (SAQ) Mechanics',
      'Olympic Lifting Derivatives & Ground Reaction Forces',
      'Triphasic & Contrast Training Periodization',
    ],
    gaaEngineIntegration:
      'Powers the Athletic Performance Studio (`components/fitness/AthleticPerformanceStudio.tsx`) and field power diagnostics (Pro Agility 5-10-5, reactive jump profiling).',
  },
  {
    id: 'cnc',
    code: 'NASM-CNC™',
    title: 'Certified Nutrition Coach',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#34D399',
    icon: 'apple',
    featured: false,
    summary:
      'Clinical macronutrient periodization, bioenergetic math (TDEE, BMR, NEAT, TEF), and behavioral dietary adherence frameworks.',
    curriculum: [
      'Macronutrient Periodization & Caloric Allocation',
      'Metabolic Expenditure Math (BMR, NEAT, TEF, EAT)',
      'Hydration Physiology & Micronutrient Sufficiency',
      'Behavioral Eating Habits & Practical Adherence Strategies',
    ],
    gaaEngineIntegration:
      'Supports Forge nutrition estimates, metabolic rate calculations, and weekly caloric adherence calibrations.',
  },
  {
    id: 'csnc',
    code: 'NASM-CSNC',
    title: 'Certified Sports Nutrition Coach',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#10B981',
    icon: 'utensils',
    featured: false,
    summary:
      'Advanced athletic nutrient timing, glycogen supercompensation, intra-workout kinetics, and competition fueling protocols.',
    curriculum: [
      'Glycogen Supercompensation & Depletion Cycling',
      'Intra-Session Fueling & Exogenous Carbohydrate Kinetics',
      'Electrolyte Osmolality & Thermoregulation',
      'Ergogenic Aids & Evidence-Based Supplement Protocols',
    ],
    gaaEngineIntegration:
      'Regulates peri-workout nutrient timing recommendations for high-output athletic conditioning.',
  },
  {
    id: 'pbc',
    code: 'NASM-PBC',
    title: 'Physique & Bodybuilding Coach',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#EC4899',
    icon: 'dumbbell',
    featured: false,
    summary:
      'Hypertrophy biomechanics, stimulus-to-fatigue ratios (SFR), volume landmarks (MEV/MAV/MRV), and structural muscular symmetry.',
    curriculum: [
      'Volume Landmarks (MEV, MAV, MRV Periodization)',
      'Stimulus-to-Fatigue Ratio (SFR) Optimization',
      'Resistance Curve Vectoring & Peak Tension Matching',
      'Intra-Set Stretch Loading & Muscle Architecture',
    ],
    gaaEngineIntegration:
      'Guides Phase 3 Muscular Development programming with optimal joint angles, peak tension curves, and hypertrophy loading.',
  },
  {
    id: 'wls',
    code: 'NASM-WLS',
    title: 'Weight Loss Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'metabolic',
    categoryLabel: 'Metabolic & Nutrition',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#06B6D4',
    icon: 'scale',
    featured: false,
    summary:
      'Adaptive thermogenesis defense, reverse dieting protocols, endocrine mitigation (leptin/ghrelin), and lean tissue defense.',
    curriculum: [
      'Adaptive Thermogenesis & Metabolic Rate Preservation',
      'NEAT (Non-Exercise Activity) Defense Mechanisms',
      'Reverse Dieting & Caloric Step-Up Protocols',
      'Hormonal Optimization During Caloric Deficits',
    ],
    gaaEngineIntegration:
      'Powers fat loss periodization microcycles without metabolic crash or muscle catabolism.',
  },
  {
    id: 'bcs',
    code: 'NASM-BCS',
    title: 'Behavior Change Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#A855F7',
    icon: 'brain',
    featured: false,
    summary:
      'Neuroscience of adherence, Transtheoretical Stages of Change, motivational interviewing, and habit architecture.',
    curriculum: [
      'Transtheoretical Model (Stages of Change Dynamics)',
      'Motivational Interviewing & Supportive Coaching',
      'Habit Stacking & Implementation Intentions',
      'Decision-Making, Habit Building, and Consistency',
    ],
    gaaEngineIntegration:
      'Calibrates Coach Gordon’s cognitive tone, weekly check-in responsiveness, and client barrier friction resolution.',
  },
  {
    id: 'vcs',
    code: 'NASM-VCS',
    title: 'Virtual Coaching Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#3B82F6',
    icon: 'video-studio',
    featured: false,
    summary:
      'Remote coaching workflows, asynchronous biomechanical video review, digital studio ergonomics, and telehealth delivery.',
    curriculum: [
      'Asynchronous Video Movement Analysis & Feedback',
      'Remote Biomechanical Cues & Voice Telemetry',
      'WebRTC Studio Lighting, Framing & Optical Truth',
      'Digital Telehealth Client Onboarding Protocols',
    ],
    gaaEngineIntegration:
      'Standardizes the 1:1 Live WebRTC Consultation Studio and asynchronous video movement review pipelines.',
  },
  {
    id: 'sfs',
    code: 'NASM-SFS',
    title: 'Senior Fitness Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#F97316',
    icon: 'shield-check',
    featured: false,
    summary:
      'Longevity biomechanics, fall prevention, osteopenia/sarcopenia mitigation, and joint-friendly loading adaptations.',
    curriculum: [
      'Joint Longevity & Cartilage Protection Protocols',
      'Proprioceptive Balance Progressions & Fall Defense',
      'Osteopenia & Sarcopenia Neuromuscular Defense',
      'Contraindicated Movement Swapping Matrix',
    ],
    gaaEngineIntegration:
      'Supports mobility and healthy-aging tools, with exercise options adapted to a person’s needs.',
  },
  {
    id: 'gfs',
    code: 'NASM-GFS',
    title: 'Golf Fitness Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'specialized',
    categoryLabel: 'Lifespan & Specialized',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#84CC16',
    icon: 'target',
    featured: false,
    summary:
      'Rotational kinetics, thoracic spine mobility, X-Factor stretch mechanics, and kinetic ground power transfer for golfers.',
    curriculum: [
      'Transverse Plane Rotational Power Delivery',
      'Thoracic Spine Mobility & Pelvic Dissociation',
      'X-Factor Stretch Biomechanics & Coil Mechanics',
      'Ground Reaction Force Vectoring for Swings',
    ],
    gaaEngineIntegration:
      'Supplies rotational kinetic chain screening and transverse power conditioning for rotational athletes.',
  },
  {
    id: 'mmacs',
    code: 'NASM-MMACS',
    title: 'MMA Conditioning Specialist',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'performance',
    categoryLabel: 'Athletic Performance',
    status: 'in_progress',
    statusLabel: 'Candidate Track',
    badgeTone: '#EF4444',
    icon: 'crosshair',
    featured: false,
    summary:
      'Multi-planar combat conditioning, 3-system energy conditioning, rotational anti-flexion, and neck/grip endurance.',
    curriculum: [
      'Tri-System Bioenergetics (ATP-PC, Glycolytic, Aerobic)',
      'Cervical Spine Stabilization & Whiplash Defense',
      'Anti-Rotational & Anti-Lateral Core Bracing',
      'Sustained Isometric Grip & Kinetic Clamping',
    ],
    gaaEngineIntegration:
      'Powers functional combat conditioning modules and multi-planar athletic resilience.',
  },
  {
    id: 'master',
    code: '🏆 NASM Master Trainer',
    title: 'Master Performance Director (Pinnacle Status)',
    issuer: 'National Academy of Sports Medicine (NASM)',
    issuerShort: 'NASM',
    category: 'clinical',
    categoryLabel: 'Clinical & Biomechanics',
    status: 'pinnacle',
    statusLabel: 'Master Credential Pathway',
    badgeTone: '#EAB308',
    icon: 'crown',
    featured: true,
    summary:
      'The pinnacle practitioner credential awarded upon mastering the comprehensive NASM continuum across assessment, correction, performance, and nutrition.',
    curriculum: [
      'Full-Spectrum Kinetic Chain Synthesis',
      'Master Clinical Diagnostic Screening',
      'Macro-to-Micro Periodization Architecture',
      'Integrated Human Performance Ecosystem Leadership',
    ],
    gaaEngineIntegration:
      'Informs coaching recommendations, movement screening, and training plans across Forge Athletic.',
  },
]

// ── UTILITY SELECTORS ────────────────────────────────────────────────────────

export function getFeaturedCredentials(): CoachCredential[] {
  return COACH_CREDENTIALS.filter((cred) => cred.featured)
}

export function getActiveCredentials(): CoachCredential[] {
  return COACH_CREDENTIALS.filter((cred) => cred.status === 'active' || cred.status === 'completed')
}

export function getCredentialById(id: string): CoachCredential | undefined {
  return COACH_CREDENTIALS.find((cred) => cred.id === id)
}

export function getCredentialCategories(): { key: CredentialCategory | 'all' | 'verified'; label: string; count: number }[] {
  return [
    { key: 'all', label: 'All Accreditations', count: COACH_CREDENTIALS.length },
    { key: 'verified', label: 'Verified Active', count: COACH_CREDENTIALS.filter((c) => c.status === 'active').length },
    { key: 'clinical', label: 'Clinical & Biomechanics', count: COACH_CREDENTIALS.filter((c) => c.category === 'clinical').length },
    { key: 'performance', label: 'Athletic Performance', count: COACH_CREDENTIALS.filter((c) => c.category === 'performance').length },
    { key: 'metabolic', label: 'Metabolic & Nutrition', count: COACH_CREDENTIALS.filter((c) => c.category === 'metabolic').length },
    { key: 'specialized', label: 'Lifespan & Specialized', count: COACH_CREDENTIALS.filter((c) => c.category === 'specialized').length },
    { key: 'safety', label: 'Emergency Safety', count: COACH_CREDENTIALS.filter((c) => c.category === 'safety').length },
  ]
}

export function getCredentialStats() {
  const verifiedCount = COACH_CREDENTIALS.filter((c) => c.status === 'active').length
  const nccaAccredited = COACH_CREDENTIALS.filter((c) => c.isNccaAccredited).length
  const specializationsTotal = COACH_CREDENTIALS.filter((c) => c.issuerShort === 'NASM').length
  return {
    verifiedCount,
    nccaAccredited,
    specializationsTotal,
    primaryCredential: COACH_CREDENTIALS.find((c) => c.id === 'nasm-cpt'),
    safetyCredential: COACH_CREDENTIALS.find((c) => c.id === 'asti-cpr-aed'),
  }
}
