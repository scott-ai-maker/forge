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
    name: 'Digital Training',
    subtitle: 'Self-guided training',
    billingLabel: 'per 30-day cycle',
    sessions: 0,
    price: 5900,
    pifPriceCents: 49900,
    pifSessions: 0,
    pifSavings: '$209',
    pifBonusDescription: '12-month membership + movement and posture check',
    description: 'Follow a personalized five-phase NASM OPT™ plan, track workouts, use audio-guided pacing tools, and review monthly 3D movement scans.',
    deliverables: [
      'Personalized five-phase NASM OPT™ workouts matched to your equipment',
      'Audio pacing and vibration cues while you train',
      'Heart-rate-guided cardio workouts',
      'Monthly 3D posture and movement scans',
      'Log workouts offline and sync when you are back online',
      'Exercise library with movement tips (no coach messages or live calls)',
    ],
    serviceLevels: [
      'Automatic workout and progress tracking',
      'Workout updates and exercise alternatives',
      'Train on your own schedule',
    ],
    commitment: 'Monthly or Annual membership. Cancel anytime with 1 click.',
    bestFor: 'People who want a science-based training plan and progress tools they can use on their own.',
    priceId: '',
  },
  {
    id: 'alumni',
    name: 'Ongoing Training',
    subtitle: 'Continue building on your progress',
    billingLabel: 'per 30-day cycle',
    sessions: 0,
    price: 14900,
    pifPriceCents: 129500,
    pifSessions: 0,
    pifSavings: '$493',
    pifBonusDescription: '12-month plan + priority plan updates',
    description: 'Keep your training plan and progress tracking going, with monthly movement scans and regular coach reviews.',
    deliverables: [
      'Ongoing five-phase NASM OPT™ training plan',
      'Monthly coach review and plan update',
      'Audio pacing tools, plate calculator, and rest timers',
      'Monthly 3D body composition and posture scans',
      'Message your coach, with replies within two business days',
      'A plan to help you maintain and build on your progress',
    ],
    serviceLevels: [
      'Monthly coach review within two business days',
      'Coach replies within two business days (Monday–Friday)',
      'Monthly progress review',
    ],
    commitment: 'Monthly or annual membership. Cancel anytime.',
    bestFor: 'People who want to continue their training after a coached program, without weekly sessions.',
    priceId: '',
  },
  {
    id: 'starter',
    name: 'Personalized Training',
    subtitle: 'Self-guided plan with coach support',
    billingLabel: 'per 30-day cycle',
    sessions: 0,
    price: 34900,
    pifPriceCents: 94900,
    pifSessions: 0,
    pifSavings: '$98',
    pifBonusDescription: 'Travel workout planner + 12-week training plan',
    description: 'Get an individualized five-phase NASM OPT™ plan, connect supported health apps, review recovery trends, and receive weekly coach guidance.',
    deliverables: [
      'A personalized five-phase NASM OPT™ plan matched to your goals and equipment',
      'Connect supported health apps and wearable devices',
      'Heart-rate-guided cardio and interval workouts',
      'Daily readiness score and 3D muscle recovery view',
      'Weekly progress review and plan updates from Coach Gordon',
      'Message your coach, with replies within one business day (Monday–Friday)',
    ],
    serviceLevels: [
      'Coach replies within one business day (Monday–Friday)',
      'Plan updates within two business days of your check-in',
      'Weekly progress review',
    ],
    commitment: 'Monthly membership. A 12-week plan is recommended, but you can cancel anytime.',
    bestFor: 'People who want a personalized plan, regular progress reviews, and coaching support between sessions.',
    priceId: '', // set after creating in Stripe dashboard
  },
  {
    id: 'momentum',
    name: 'Hybrid Coaching',
    subtitle: 'Training plan plus live coaching',
    billingLabel: 'per 30-day cycle',
    sessions: 1,
    price: 64900,
    pifPriceCents: 169500,
    pifSessions: 3,
    pifSavings: '$252',
    pifBonusDescription: 'Movement and posture assessment included',
    description: 'Combine a personalized weekly training plan with a monthly video session, exercise form reviews, and nutrition support.',
    deliverables: [
      'Everything in Personalized Training',
      'One 60-minute video session each month, with on-screen movement feedback',
      'Monthly 3D posture scan and movement plan',
      'Video form reviews with coach voice feedback',
      'Nutrition planning matched to your goals and training',
      'Coach voice notes and regular check-in feedback',
    ],
    serviceLevels: [
      'Coach replies within 12 business hours (Monday–Friday)',
      'Check-ins reviewed within one business day',
      'Book a video session within seven days',
    ],
    commitment: 'Monthly membership. Cancel or change your plan before your next billing date.',
    bestFor: 'People who want regular live coaching alongside their training plan.',
    priceId: '',
    popular: true,
  },
  {
    id: 'transformation',
    name: 'One-to-one Coaching',
    subtitle: 'Weekly live coaching',
    billingLabel: 'per 30-day cycle',
    sessions: 4,
    price: 149500,
    pifPriceCents: 389500,
    pifSessions: 12,
    pifSavings: '$590',
    pifBonusDescription: 'Supplement review and travel workout planner included',
    description: 'Work with a coach in weekly video sessions, get exercise and nutrition guidance, and receive follow-up notes and support.',
    deliverables: [
      'Everything in Hybrid Coaching',
      'Four 60-minute video coaching sessions each month, with movement feedback',
      'Session notes and follow-up plan',
      'Evidence-based supplement review, including safety checks',
      'Travel workout planner for hotel gyms and limited equipment',
      'Plan updates every two weeks, including recovery weeks when needed',
      'Direct coach messaging, with replies within four business hours',
    ],
    serviceLevels: [
      'Coach replies within four business hours (Monday–Friday)',
      'Time-sensitive training questions answered within four business hours',
      'Plan updates within one business day after your weekly session',
    ],
    commitment: 'Quarterly membership. Limited to eight active members so your coach can provide focused support.',
    bestFor: 'People who want frequent one-to-one coaching and a plan tailored to their goals.',
    priceId: '',
  },
  {
    id: 'corporate',
    name: 'Team Wellness',
    subtitle: 'Workplace wellness · Up to 10 people',
    billingLabel: 'per 30-day corporate billing cycle',
    sessions: 1,
    price: 350000,
    pifPriceCents: 3500000,
    pifSessions: 12,
    pifSavings: '$7,000',
    pifBonusDescription: '12-month team membership + on-site workspace assessment',
    description: 'A practical training and wellness program for teams, with app access, group coaching, and progress reviews.',
    deliverables: [
      'App access for up to 10 team members',
      'Personalized five-phase NASM OPT™ workouts, audio pacing, and monthly 3D movement scans',
      'One 60-minute live movement and workspace session each month with Coach Gordon',
      'Quarterly team training and progress review',
      'Travel workout plans for different schedules and equipment',
      'One monthly invoice and a dedicated team contact',
    ],
    serviceLevels: [
      'Team contact replies within one business day',
      'Book a group session within 14 days',
      'Quarterly progress summary within five business days',
    ],
    commitment: 'Monthly or annual team agreement. Contact us to discuss other team sizes.',
    bestFor: 'Workplaces looking for practical, inclusive ways to support movement, fitness, and wellbeing.',
    priceId: '',
  },
]

// Optional training add-ons
export const COACHING_ADDONS: CoachingAddon[] = [
  {
    id: 'postural-diagnostic',
    name: '3D Movement and Posture Assessment',
    subtitle: 'Movement screen',
    billingType: 'one_time',
    priceCents: 24900,
    badge: 'Clinical Assessment',
    icon: 'microscope',
    sessions: 1,
    description: 'A coach-led movement assessment that reviews posture and movement patterns from five angles.',
    deliverables: [
      'A 45-minute video movement session with overhead squat and single-leg checks',
      'A clear summary of movement patterns to work on',
      'A personalized warm-up with mobility and activation exercises',
      'A movement report with practical next steps',
    ],
    recommendedFor: 'Anyone who wants to understand their movement and find practical ways to move with more comfort.',
  },
  {
    id: 'metabolic-nutrition',
    name: 'Nutrition Planning',
    subtitle: 'Food and training plan',
    billingType: 'recurring_monthly',
    priceCents: 14900,
    badge: 'Nutrition Engine',
    icon: 'lightning',
    sessions: 0,
    description: 'Practical nutrition guidance that can change to match your training days, rest days, and goals.',
    deliverables: [
      'A personalized estimate of daily energy needs',
      'Meal planning ideas for training and rest days',
      'Guidance on eating before and after exercise',
      'Regular plan updates as your needs change',
    ],
    recommendedFor: 'People looking for nutrition ideas that support their health, training, or performance goals.',
  },
  {
    id: 'video-critique-pass',
    name: 'Video Form Review',
    subtitle: 'Coach feedback on your exercise videos',
    billingType: 'recurring_monthly',
    priceCents: 19900,
    badge: 'Video Analysis',
    icon: 'video-studio',
    sessions: 0,
    description: 'Share exercise videos and get clear feedback from your coach on your form and movement.',
    deliverables: [
      'Up to eight exercise videos each month',
      'Detailed review of your movement and exercise technique',
      'Coach feedback within one business day',
      'Practical tips to help you exercise with good form',
    ],
    recommendedFor: 'Anyone who wants a coach to review their exercise form.',
  },
  {
    id: 'supplement-audit',
    name: 'Supplement Review',
    subtitle: 'Evidence and safety check',
    billingType: 'one_time',
    priceCents: 14900,
    badge: 'Supplement guidance',
    icon: 'pill',
    sessions: 0,
    description: 'A review of your supplements, medications, health information, and training goals to help identify safety concerns.',
    deliverables: [
      'Review of your current supplements and product quality',
      'Safety check against your health conditions and medications',
      'Evidence-based information about common supplements',
      'Suggestions for independently tested products',
    ],
    recommendedFor: 'People who use supplements and want to discuss their safety with a coach.',
  },
  {
    id: 'travel-warrior-pass',
    name: 'Travel Workout Planner',
    subtitle: 'Workouts for travel',
    billingType: 'one_time',
    priceCents: 12900,
    badge: 'Travel workouts',
    icon: 'plane',
    sessions: 0,
    description: 'Adjust your training plan for a hotel gym, a small set of dumbbells, or resistance bands.',
    deliverables: [
      'Adapt a planned workout to the equipment you have',
      'Keep following your training plan while you travel',
      'Bodyweight and resistance-band workouts for small spaces',
      'Tips for sleep and recovery when your schedule changes',
    ],
    recommendedFor: 'Anyone who travels and wants to keep moving with the equipment available.',
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
    name: 'Movement and Posture Assessment',
    subtitle: 'AI-assisted movement insights',
    priceCents: 9700,
    badge: 'Movement Review',
    icon: 'microscope',
    description: 'An AI-assisted movement review that highlights patterns you can discuss with your coach and use to guide your training.',
    deliverables: [
      'Guided movement checks from front, side, and back views',
      'AI-assisted feedback on selected movement patterns',
      'Suggested exercises to support your movement goals',
      'Interactive results and a downloadable summary',
      'A $97 credit toward an eligible 12-week training plan or coaching membership',
    ],
    valueProposition: 'Learn more about your movement patterns and possible next steps.',
    upsellCreditCents: 9700,
  },
]
