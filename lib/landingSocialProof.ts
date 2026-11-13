export interface ClientOutcomeProfile {
  id: string
  nameAndAge: string
  monogram: string
  personaBadge: string
  keyMetricBadge: string
  headline: string
  story: string
  featureUsed: string
  imageSrc: string
  imageAlt: string
}

export interface LandingPricingTierCard {
  id: 'core_lab' | 'plus' | 'coach_support' | 'live_studio'
  name: string
  eyebrow: string
  badge: string
  foundingPrice: string
  postLaunchPrice: string
  billingUnit: string
  summary: string
  highlights: readonly string[]
  imageSrc: string
  imageAlt: string
  ctaLabel: string
  ctaHref: string
  featured?: boolean
}

export const COACH_GORDON_TRUST_PROFILE = {
  name: 'Coach Gordon',
  monogram: 'CG',
  portraitSrc: '/images/hero-personal-coaching-45wk-goal.jpg',
  verificationBadge: 'NASM-CPT® Since 2008',
  secondaryCredentials: '18+ Years Coaching · B.S. Information Technology · ASTI CPR/AED',
  philosophySentences: [
    'Every program starts with your joints, posture, and daily energy—never ego lifting or punishing soreness.',
    'When your neck, shoulders, and hips move cleanly first, strength builds faster and stays pain-free for decades.',
    'Whether you have 20 minutes between meetings or a hotel dumbbell rack on the road, consistency beats perfection every week.',
  ] as const,
} as const

export const CLIENT_OUTCOMES_GRID: ReadonlyArray<ClientOutcomeProfile> = [
  {
    id: 'marcus-desk-worker',
    nameAndAge: 'Marcus T., 38',
    monogram: 'MT',
    personaBadge: 'Desk Worker',
    keyMetricBadge: '-4.5° Forward Head Tilt',
    headline: 'Ended afternoon neck stiffness in 6 weeks without leaving his home office',
    story:
      'Used the seated Desk Ergonomics Audit to raise his monitor 3 inches and ran 5-Minute Desk Resets between engineering standups before 3x/week home dumbbell sessions.',
    featureUsed: 'Desk Ergonomics Audit + 5-Min Desk Reset',
    imageSrc: '/images/pillar-move-confidence.jpg',
    imageAlt: 'Client performing posture and upper-back mobility screening in a clean training space',
  },
  {
    id: 'elena-busy-parent',
    nameAndAge: 'Elena R., 41',
    monogram: 'ER',
    personaBadge: 'Busy Parent',
    keyMetricBadge: '20m Express Home Strength',
    headline: 'Hit 14 straight weeks of pain-free strength before school drop-off',
    story:
      'Switched on 20m Express Mode on packed mornings so high-priority compound supersets and 90-second mobility warm-ups stayed strictly under 20 minutes.',
    featureUsed: '20m Express Mode + 5-Phase OPT™ Engine',
    imageSrc: '/images/pillar-plan-personalized.jpg',
    imageAlt: 'Focused 20-minute home dumbbell training session tailored for a busy morning schedule',
  },
  {
    id: 'david-frequent-traveler',
    nameAndAge: 'David K., 45',
    monogram: 'DK',
    personaBadge: 'Frequent Traveler',
    keyMetricBadge: 'Hotel Travel Consistency',
    headline: 'Zero missed microcycles across 9 cross-country work trips',
    story:
      'Swapped seamlessly between his garage barbell setup and Hotel Travel dumbbell/cable equivalents while keeping knees and lower back completely ache-free.',
    featureUsed: 'Hotel Travel Pass + Joint Comfort Score',
    imageSrc: '/images/remote-virtual-coaching.jpg',
    imageAlt: 'Remote strength workout adapted seamlessly for hotel dumbbell and cable equipment',
  },
]

export const FOUNDING_PRICING_CARDS: ReadonlyArray<LandingPricingTierCard> = [
  {
    id: 'core_lab',
    name: 'Core Lab',
    eyebrow: 'Foundation Lab',
    badge: 'Founding Lifetime Rate Lock',
    foundingPrice: '$19.99',
    postLaunchPrice: '$29.99',
    billingUnit: '/ mo',
    summary:
      'Full 5-Phase OPT™ Engine, 20m Express Mode, 5-Min Desk Reset, Joint Comfort Score, unlimited 2-Min Posture Checks, 1 workstation profile, and 1 onboarding Form Lab clip.',
    highlights: [
      'Full 5-Phase NASM OPT™ Engine & 20m Express',
      'Unlimited 2-Min Posture Mesh Deltas + 5-Min Desk Reset',
      '1 Workstation Ergonomics Profile + Joint Comfort Score',
      '1 Complimentary Onboarding Form Lab Video Review',
    ],
    imageSrc: '/images/pillar-progress-telemetry.jpg',
    imageAlt: 'Athlete tracking structured OPT progression and joint comfort metrics',
    ctaLabel: 'Lock In $19.99/mo Rate',
    ctaHref: '/auth/signup?plan=core_lab',
  },
  {
    id: 'plus',
    name: 'Plus',
    eyebrow: 'Guided Hybrid',
    badge: 'Most Popular · Rate Locked',
    foundingPrice: '$49',
    postLaunchPrice: '$69',
    billingUnit: '/ mo',
    summary:
      'Unlimited Desk Ergonomics profiles, Dual-Screen Readiness + trend alerts, Multi-Day Travel Pass, 2 Coach Gordon Form Lab video reviews/mo, and Nutrition Periodization.',
    highlights: [
      'Unlimited Home & Office Desk Ergonomics Profiles',
      'Dual-Screen 30s Readiness Check + Trend Alerts',
      'Multi-Day Hotel Travel Pass + Nutrition Periodization',
      '2 Coach Gordon Form Lab Video Reviews / Month',
    ],
    imageSrc: '/images/remote-virtual-coaching.jpg',
    imageAlt: 'Hybrid asynchronous video form coaching and travel-ready workout adaptation',
    ctaLabel: 'Lock In $49/mo Plus',
    ctaHref: '/auth/signup?plan=plus',
    featured: true,
  },
  {
    id: 'coach_support',
    name: 'Coach Support',
    eyebrow: '1-on-1 Coaching',
    badge: 'Capped at 25 Spots',
    foundingPrice: '$199',
    postLaunchPrice: '$269',
    billingUnit: '/ mo',
    summary:
      'Everything in Plus, 8 Form Lab reviews/mo (24h priority), Direct 1-on-1 Chat with Coach Gordon (24h SLA), and bespoke plan & posture mesh certification.',
    highlights: [
      'Direct 1-on-1 Chat with Coach Gordon (24h SLA)',
      '8 Priority Form Lab Video Reviews / Month',
      'Bespoke OPT™ Plan & Posture Mesh Certification',
      'Strictly Capped at 25 Active Athletes',
    ],
    imageSrc: '/images/coach-client-plan.jpg',
    imageAlt: 'Coach Gordon reviewing bespoke biomechanical program design 1-on-1',
    ctaLabel: 'Claim 1 of 25 Spots',
    ctaHref: '/auth/signup?plan=coach_support',
  },
  {
    id: 'live_studio',
    name: 'Live Studio',
    eyebrow: '1:1 Video Session',
    badge: 'HD Telestration',
    foundingPrice: '$180',
    postLaunchPrice: '$240',
    billingUnit: '/ session',
    summary:
      'Private 60-minute live 1-on-1 virtual coaching with Coach Gordon featuring multi-angle form checks, slow-motion replay, and real-time joint-angle telestration.',
    highlights: [
      'Private 60-Min HD WebRTC Session with Coach Gordon',
      'Real-Time Joint-Angle Telestration & Slow-Mo Replay',
      'Instantaneous Load & Corrective Exercise Calibration',
      'Dedicated Evening & Weekend Booking Windows',
    ],
    imageSrc: '/images/pillar-move-confidence.jpg',
    imageAlt: 'Live 1-on-1 HD video studio coaching with real-time joint angle telestration',
    ctaLabel: 'Reserve 1:1 Studio Session',
    ctaHref: '/packages#live-1-on-1',
  },
]
