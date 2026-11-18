export interface ClientOutcomeProfile {
  id: string
  nameAndAge: string
  roleTitle: string
  monogram: string
  personaBadge: string
  keyMetricBadge: string
  secondaryMetricBadge: string
  headline: string
  story: string
  featureUsed: string
  imageSrc: string
  imageAlt: string
}

export interface LandingPricingTierCard {
  id: 'core_lab' | 'plus' | 'coach_support'
  name: string
  eyebrow: string
  badge: string
  foundingPrice: string
  postLaunchPrice: string
  billingUnit: string
  summary: string
  leadIn?: string
  highlights: readonly string[]
  imageSrc: string
  imageAlt: string
  ctaLabel: string
  ctaHref: string
  featured?: boolean
}

export interface EverydayMomentScenario {
  step: string
  timeAndPlace: string
  badge: string
  narrative: string
}

export interface EcosystemFeatureItem {
  title: string
  description: string
}

export interface EcosystemPillar {
  roman: 'I' | 'II' | 'III'
  eyebrow: string
  title: string
  items: ReadonlyArray<EcosystemFeatureItem>
}

export interface LandingFaqItem {
  id: string
  question: string
  answer: string
}

export const COACH_GORDON_TRUST_PROFILE = {
  name: 'Coach Gordon',
  monogram: 'CG',
  portraitSrc: '/images/hero-personal-coaching-45wk-goal.jpg',
  verificationBadge: 'NASM-CPT® Certified (#1261890687)',
  secondaryCredentials:
    'NASM-CPT® (Oct 2026) · Prior ACE-CPT (2008–2021) · B.S. Information Technology · ASTI CPR/AED',
  philosophySentences: [
    'Every program begins with your joints, posture, and daily energy—never ego lifting or punishing soreness.',
    'When your neck, shoulders, and hips move cleanly first, real strength builds steadily and stays comfortable for decades.',
    'Whether you have 20 minutes in your living room before work or a half-stocked hotel gym on the road, calm consistency beats all-or-nothing bursts every week.',
  ] as const,
  scienceAccordionTitle: 'How the NASM OPT™ Science Works',
  scienceAccordionParagraphs: [
    '33-Point Smartphone Pose Diagnostics: Using only your phone or laptop camera locally in your browser, Forge Athletic measures craniovertebral head tilt, shoulder symmetry, pelvic balance, and squat depth so tightness is addressed before you pick up a weight.',
    'Goal-Matched NASM Optimum Performance Training (OPT™): Every plan starts with joint stabilization, balance, and controlled breathing (Phase 01) and builds durable everyday strength (Phase 02)—where most posture, fat-loss, and long-term fitness members do their best work. Specialty tracks like Muscular Development (Phase 03), Maximal Strength (Phase 04), and Power (Phase 05) are optional and included only when matched to your goals and health profile.',
  ] as const,
} as const

export const EVERYDAY_MOMENTS_SCENARIOS: ReadonlyArray<EverydayMomentScenario> = [
  {
    step: '01',
    timeAndPlace: '6:45 AM in Your Living Room',
    badge: 'Zero Guesswork',
    narrative:
      'Prop your phone against a water bottle. Run a 30-second Camera Readiness Check—three bodyweight squats—and Forge Athletic automatically adds two hip openers before Set 1. Coach Gordon’s real voice greets you by name, briefs your session around how your joints feel today, and counts a calm 3-1-1 lowering tempo while your house stays quiet.',
  },
  {
    step: '02',
    timeAndPlace: '1:15 PM Between Back-to-Back Meetings',
    badge: 'Instant Desk Relief',
    narrative:
      'Neck and upper back tightening up after four hours on Zoom? Run a 5-second Desk Ergonomics Audit to spot the exact monitor or chair angle causing strain, then launch a 5-Minute Desk Reset tailored to your posture flags—no workout clothes or floor mat required.',
  },
  {
    step: '03',
    timeAndPlace: 'Thursday Night at a Hotel Gym',
    badge: 'Zero Lost Momentum',
    narrative:
      'Half the equipment is missing and you have 22 minutes before dinner. Tap Hotel Travel and 20m Express—your workout rebuilds around the exact dumbbells on the rack while keeping your 5-Phase NASM progression intact, then resets back to your home setup automatically when you fly home.',
  },
]

export const ECOSYSTEM_PILLARS: ReadonlyArray<EcosystemPillar> = [
  {
    roman: 'I',
    eyebrow: 'Pillar I · Computer Vision',
    title: 'Zero-Hardware 33-Point Camera Diagnostics',
    items: [
      {
        title: '2-Minute Quick Posture Check',
        description:
          'Hands-free front and side alignment scan with automatic Amber-to-Emerald framing lock—no wearables, tripods, or sensors needed.',
      },
      {
        title: 'Before & After 33-Point Mesh Comparison',
        description:
          'Side-by-side and overlay drag sliders tracking real degree changes in forward head tilt, shoulder symmetry, and pelvic balance over time.',
      },
      {
        title: 'Desk Ergonomics Camera Audit',
        description:
          'Measures seated ear-shoulder-elbow-hip angles from a 5-second live timer or photo upload, scoring your setup (0–100) with 3 immediate fixes.',
      },
      {
        title: '30-Second Camera Readiness Check',
        description:
          'Screens 3 Overhead Squats or Scapular Wall Slides before Set 1 to calculate your daily Forge Readiness Index and auto-inject targeted corrective warm-ups.',
      },
    ],
  },
  {
    roman: 'II',
    eyebrow: 'Pillar II · Adaptive Programming',
    title: 'Coach Gordon AI, Real Voice & Adaptive OPT™ Training',
    items: [
      {
        title: 'Coach Gordon’s Real Voice Guidance',
        description:
          'Personalized pre-workout voice briefings, post-scan diagnostic takeaways, and hands-free tempo and rest cues recorded in Coach Gordon’s actual voice.',
      },
      {
        title: '5-Phase NASM OPT™ Progression Engine',
        description:
          'Structured progression from joint stabilization through real-world strength—never random, joint-beating workouts.',
      },
      {
        title: '20m Express Mode & Environment Profiles',
        description:
          'Instant adaptation for Home Dumbbells, Apartment Gym, Bodyweight Only, or Hotel Travel, plus full phase credit in 20 minutes flat.',
      },
      {
        title: 'In-Set Joint Safety & Plain-English RPE',
        description:
          'Tap "Joint Feels Pinchy" mid-set for an immediate joint-safe exercise regression and automatic coach safety alert, and log effort in plain English (Easy to Max) to autoregulate loads safely.',
      },
      {
        title: '10-Second Joint Comfort Check-In & 5-Min Desk Reset',
        description:
          'Daily Neck, Back, and Hips tracking with trend sparklines paired with mobility routines prioritized by your posture flags.',
      },
    ],
  },
  {
    roman: 'III',
    eyebrow: 'Pillar III · Human Stewardship',
    title: 'Real Human Coaching, Travel & Companion Tools',
    items: [
      {
        title: 'Async Form Lab Video Reviews',
        description:
          'Built-in 45° camera guide that auto-trims dead setup time so Coach Gordon can return frame-by-frame slow-motion video telestration and voice coaching notes.',
      },
      {
        title: 'Direct Email & Text Access to Coach Gordon',
        description:
          'Never an outsourced support desk—reach Coach Gordon directly via Email (Core Lab & Plus) or Direct SMS Text Line (Coach Support) with your posture and readiness telemetry automatically attached.',
      },
      {
        title: 'Phase-Synced Nutrition Periodization (Plus & Coach Support)',
        description:
          'Calorie and macro targets that adapt automatically as you move from Stabilization to Strength phases.',
      },
      {
        title: 'Giftable Founding Partner Pass',
        description:
          'Founding Cohort members receive 1 free 30-day Founding Partner Pass to share with a friend or spouse—all running directly in any mobile or desktop browser.',
      },
    ],
  },
]

export const CLIENT_OUTCOMES_GRID: ReadonlyArray<ClientOutcomeProfile> = [
  {
    id: 'desk-workstation-workflow',
    nameAndAge: 'Workflow 01',
    roleTitle: 'Remote & Hybrid Desk Schedules',
    monogram: '01',
    personaBadge: 'Illustrative Workflow · Desk Days',
    keyMetricBadge: '5-Second Seated Camera Audit',
    secondaryMetricBadge: '5-Min Mobility Reset',
    headline: 'Check workstation angles and reset upper-back tension between meetings',
    story:
      'Use the seated Desk Ergonomics Camera Audit to check monitor height and seated posture angles, run a targeted 5-Minute Desk Reset between calls, and pair with 3x/week home dumbbell training.',
    featureUsed: 'Desk Ergonomics Audit + 5-Min Desk Reset',
    imageSrc: '/images/pillar-move-confidence.jpg',
    imageAlt: 'Athlete performing posture and upper-back mobility screening in a clean training space',
  },
  {
    id: 'home-express-workflow',
    nameAndAge: 'Workflow 02',
    roleTitle: 'Busy 20-Minute Home Mornings',
    monogram: '02',
    personaBadge: 'Illustrative Workflow · Busy Mornings',
    keyMetricBadge: '20-Minute Express Sessions',
    secondaryMetricBadge: '45° Async Form Lab',
    headline: 'Fit structured OPT™ strength into 20-minute weekday windows',
    story:
      'Switch any scheduled workout into 20m Express Mode on tight mornings while preserving phase progression, and upload a 45° lift clip to Form Lab for asynchronous slow-motion technique cues.',
    featureUsed: '20m Express Mode + Async Form Lab',
    imageSrc: '/images/pillar-plan-personalized.jpg',
    imageAlt: 'Focused 20-minute home dumbbell training session tailored for a busy morning schedule',
  },
  {
    id: 'hotel-travel-workflow',
    nameAndAge: 'Workflow 03',
    roleTitle: 'Multi-City Hotel & Work Travel',
    monogram: '03',
    personaBadge: 'Illustrative Workflow · Work Travel',
    keyMetricBadge: 'Instant Hotel Gym Adaptation',
    secondaryMetricBadge: '30s Camera Readiness',
    headline: 'Adapt workouts to hotel dumbbells or bodyweight without losing your place',
    story:
      'Select Hotel Travel or Bodyweight Only when away from your primary setup—Forge Athletic substitutes movements to match available equipment and runs a 30-second Camera Readiness warm-up before Set 1.',
    featureUsed: 'Hotel Travel Engine + 5-Phase OPT™',
    imageSrc: '/images/remote-virtual-coaching.jpg',
    imageAlt: 'Remote strength workout adapted seamlessly for hotel dumbbell and cable equipment',
  },
]

export const FOUNDING_PRICING_CARDS: ReadonlyArray<LandingPricingTierCard> = [
  {
    id: 'core_lab',
    name: 'Core Lab',
    eyebrow: 'Autonomous AI Foundation & Daily Posture Care',
    badge: '7-DAY FREE TRIAL',
    foundingPrice: '$49.00',
    postLaunchPrice: '$49.00',
    billingUnit: '/mo',
    summary:
      'Autonomous AI Foundation & Daily Posture Care—structured 5-Phase OPT™ workouts, camera posture diagnostics, Coach Gordon’s real voice cues, and direct email access (month-to-month, cancel anytime).',
    highlights: [
      'Full 5-Phase NASM OPT™ Engine + 20m Express Mode',
      'Coach Gordon AI + Real Voice briefings, tempo pacing & mid-set regressions',
      'Unlimited 2-Min Quick Posture Checks & Before/After 33-point mesh tracking',
      '1 Saved Desk Ergonomics Audit profile + personalized 5-Min Desk Reset',
      '30-Second Camera Readiness Check (1 movement screen + auto warm-up injection)',
      'Single-session Environment & Travel workout swaps + 10s Joint Comfort tracking',
      '1 Complimentary Form Lab onboarding video diagnostic',
      'Direct Email access to Coach Gordon (48h response window)',
      '7-day free trial · $49/mo month-to-month billing',
    ],
    imageSrc: '/images/pillar-progress-telemetry.jpg',
    imageAlt: 'Athlete tracking structured OPT progression and joint comfort metrics',
    ctaLabel: 'Start Core Lab · $49/mo',
    ctaHref: '/auth/signup?plan=core_lab',
  },
  {
    id: 'plus',
    name: 'Plus',
    eyebrow: 'Guided Hybrid Coaching & Monthly Video Reviews',
    badge: 'MOST POPULAR',
    foundingPrice: '$99.00',
    postLaunchPrice: '$99.00',
    billingUnit: '/mo',
    summary:
      'Guided Hybrid Coaching & Monthly Video Reviews—monthly slow-motion Form Lab reviews from Coach Gordon, unlimited workstation audits, multi-day travel adaptation, and nutrition (month-to-month, cancel anytime).',
    leadIn: 'Everything in Core Lab, plus:',
    highlights: [
      'Form Lab Video Reviews with slow-motion telestration from Coach Gordon',
      'Unlimited Desk Ergonomics Audits (Home Office, Corporate Desk & Hotel Workstations)',
      'Full Dual-Screen Camera Readiness + multi-week joint stiffness trend alerts',
      'Multi-Day Travel Pass (rebuilds multi-day trip schedules around hotel gyms)',
      'Full Nutrition Periodization synced to your active OPT™ phase',
      'Priority Email access to Coach Gordon (24h business-day response)',
      '$99/mo month-to-month billing (no multi-month lock-in)',
    ],
    imageSrc: '/images/remote-virtual-coaching.jpg',
    imageAlt: 'Hybrid asynchronous video form coaching and travel-ready workout adaptation',
    ctaLabel: 'Start Plus · $99/mo',
    ctaHref: '/auth/signup?plan=plus',
    featured: true,
  },
  {
    id: 'coach_support',
    name: 'Coach Support',
    eyebrow: '1-on-1 Master Coaching & Direct Text Line',
    badge: 'LIMITED ACTIVE SEATS',
    foundingPrice: '$299.00',
    postLaunchPrice: '$299.00',
    billingUnit: '/mo',
    summary:
      '1-on-1 Master Coaching & Direct Text Line—direct SMS access to Coach Gordon, 8 priority Form Lab video reviews per month, custom injury overrides, and quarterly mesh sign-off.',
    leadIn: 'Everything in Plus, plus:',
    highlights: [
      'Direct SMS Text Line & Priority In-App Chat with Coach Gordon (24h SLA)',
      '8 Form Lab Video Reviews / month with priority 24h telestration turnaround',
      'Bespoke OPT™ Program Overrides & custom injury-history modifications by Coach Gordon',
      'Quarterly Certified Biomechanical Mesh Review signed off by Coach Gordon',
      'Strictly capped active coaching roster to protect 1-on-1 coach focus',
    ],
    imageSrc: '/images/coach-client-plan.jpg',
    imageAlt: 'Coach Gordon reviewing bespoke biomechanical program design 1-on-1',
    ctaLabel: 'Claim Coach Support · $299/mo',
    ctaHref: '/auth/signup?plan=coach_support',
  },
]

export const LANDING_FAQ_ITEMS: ReadonlyArray<LandingFaqItem> = [
  {
    id: 'trainer-without-zoom',
    question: 'How does Forge Athletic feel like having a real personal trainer without live Zoom scheduling?',
    answer:
      'Instead of rearranging your calendar around rigid video appointments, Forge Athletic surrounds every session with four layers of coaching: 33-point phone camera posture and readiness checks before Set 1, Coach Gordon’s real recorded voice guiding your warm-ups, tempos, and rest intervals, asynchronous Form Lab video reviews where Coach Gordon returns slow-motion telestration and voice notes on your actual lifts, and direct Email or SMS access whenever you want human eyes on your training.',
  },
  {
    id: 'joint-discomfort-safety',
    question: 'What happens if a joint feels uncomfortable or I have past aches?',
    answer:
      'Joint safety is built directly into every set. If a movement feels off mid-workout, tap "Joint Feels Pinchy" once—Forge Athletic immediately swaps in a clinically sound NASM regression that spares the irritated joint while sending an automatic safety alert to Coach Gordon’s review queue. Daily 10-second Joint Comfort check-ins for your neck, back, and hips also autoregulate your upcoming volume and warm-up mobility drills.',
  },
  {
    id: 'reach-coach-gordon',
    question: 'How do I reach the real Coach Gordon?',
    answer:
      'You never deal with an outsourced support desk or generic chatbot wall. Core Lab includes direct Email access to Coach Gordon (48-hour response window), Plus includes Priority Email access (24-hour business-day response), and Coach Support unlocks Coach Gordon’s Direct SMS Text Line and Priority In-App Chat (24-hour SLA). Whenever you reach out, your latest 33-point posture deltas, readiness scores, and workout logs are attached automatically so he has full context.',
  },
  {
    id: 'equipment-needed',
    question: 'Do I need a gym, weights, or special equipment?',
    answer:
      'No special hardware or gym membership is required. Every 33-point posture check, Desk Ergonomics Audit, and 30-second Camera Readiness Check runs locally in your phone or laptop browser with zero cloud video uploads, sensors, or tripods. You can switch between Bodyweight Only, Home Dumbbells, Apartment Gym, and Hotel Travel at any time while keeping your 5-Phase NASM OPT™ progression intact.',
  },
  {
    id: 'lifetime-rate-lock-upgrades',
    question: 'How do Forge Athletic membership tiers and billing options work as my goals evolve?',
    answer:
      'Forge Athletic bills strictly month-to-month with zero multi-month prepayment lock-in: $49.00/mo Core Lab (includes a 7-day free trial), $99.00/mo Plus, and $299.00/mo Coach Support (subject to active coaching seat availability). If you redeem a promotional Rate Lock code, your discounted rate stays locked for as long as continuous active enrollment on that selected tier is maintained. You can move between tiers or cancel recurring renewals in 1 click inside Account Settings at any time with $0 cancellation fees.',
  },
]
