export type CoachBackgroundCategory =
  | 'Assessment & Triage'
  | 'Stabilization & Balance'
  | 'Hypertrophy & Physique'
  | 'Maximal Strength'
  | 'Athletic Power & SAQ'
  | 'Metabolic Conditioning'
  | 'Recovery & Longevity'
  | 'Executive Suite'
  | 'Blur'
  // Backward compatibility aliases
  | 'Facility'
  | 'Diagnostic Lab'

export interface CoachBackgroundPreset {
  id: string
  name: string
  tagline: string
  trainingModality: string
  recommendedFor: string
  category: CoachBackgroundCategory
  thumbnailStyle: React.CSSProperties
  backgroundStyle: React.CSSProperties
  imageUrl?: string
  isBlur?: boolean
  badge: string
  logoPosition?: 'wall-plaque-right' | 'center-plaque' | 'top-right' | 'center-top'
}

const BRAND_LOGO = '/images/brand/logo-concept-1-kinetic-f.jpg'

export const COACH_BACKGROUND_PRESETS: CoachBackgroundPreset[] = [
  // ── 1. Biomechanical Assessment & Movement Screen (Diagnostic & Corrective) ──
  {
    id: 'diagnostic-lab',
    name: 'Biomechanical Movement Screen & Posture Triage',
    tagline: 'Recessed force plates, 3D kinetic wireframe screen & illuminated Forge Athletic kinetic anvil mark',
    trainingModality: 'Movement Screen & Posture Triage',
    recommendedFor: 'Overhead squat assessment, kinetic chain compensations, joint mobility triage',
    category: 'Assessment & Triage',
    imageUrl: '/images/backgrounds/coach-assessment-movement-screen.jpg',
    badge: 'Phase 1 · Corrective Triage',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-assessment-movement-screen.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-assessment-movement-screen.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 2. Stabilization Endurance & Functional Balance (Phase 1) ──
  {
    id: 'functional-stabilization',
    name: 'Stabilization Endurance & Kinetic Balance',
    tagline: 'Matte black kettlebells, balance pads, dual functional cable column & lush courtyard garden',
    trainingModality: 'Stabilization Endurance & Core Integration',
    recommendedFor: 'NASM Phase 1 core stabilization, joint proprioception, balance training',
    category: 'Stabilization & Balance',
    imageUrl: '/images/backgrounds/coach-functional-stabilization.jpg',
    badge: 'Phase 1 · Stabilization Endurance',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-functional-stabilization.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-functional-stabilization.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 3. Hypertrophy & Muscular Architecture (Phase 3) ──
  {
    id: 'hypertrophy-muscular-architecture',
    name: 'Hypertrophy & Muscular Architecture',
    tagline: 'Ergonomic matte black & titanium incline bench, tiered dumbbell rack, smoked mirrors & acoustic walnut slats',
    trainingModality: 'Hypertrophy & Muscular Development',
    recommendedFor: 'High-volume hypertrophy, targeted muscle sculpting, 2/0/2 tempo resistance',
    category: 'Hypertrophy & Physique',
    imageUrl: '/images/backgrounds/coach-hypertrophy-muscular-architecture.jpg',
    badge: 'Phase 3 · Muscular Architecture',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-hypertrophy-muscular-architecture.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-hypertrophy-muscular-architecture.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 4. Maximal Strength & Olympic Weightlifting (Phase 4) ──
  {
    id: 'olympic-facility',
    name: 'Maximal Strength & Olympic Platform',
    tagline: 'Competition oak-center lifting platform, calibrated bumper plates, competition barbell & heavy power rack',
    trainingModality: 'Maximal Strength & Heavy Barbell',
    recommendedFor: '1RM bench/squat/deadlift benchmarks, heavy compound loading, Olympic weightlifting',
    category: 'Maximal Strength',
    imageUrl: '/images/backgrounds/coach-maximal-strength-olympic.jpg',
    badge: 'Phase 4 · Maximal Strength',
    logoPosition: 'wall-plaque-right',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-maximal-strength-olympic.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'calc(100% - 24px) 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-maximal-strength-olympic.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 5. Explosive Athletic Power & Turf Arena (Phase 5) ──
  {
    id: 'athletic-power-turf',
    name: 'Explosive Power & Athletic Turf Arena',
    tagline: 'Charcoal indoor sprint lane with white yardage marks, 30" plyo boxes, heavy slam balls & overhead linear LEDs',
    trainingModality: 'Explosive Power & SAQ',
    recommendedFor: 'Rotational power, medicine ball slams, plyometrics, change-of-direction agility',
    category: 'Athletic Power & SAQ',
    imageUrl: '/images/backgrounds/coach-athletic-power-turf.jpg',
    badge: 'Phase 5 · Power & SAQ',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-athletic-power-turf.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-athletic-power-turf.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 6. Metabolic Conditioning & Bioenergetic Lab ──
  {
    id: 'metabolic-conditioning-engine',
    name: 'Metabolic Conditioning & Bioenergetic Lab',
    tagline: 'Curved manual slat treadmills, Concept2 rowing ergs, SkiErgs & live bioenergetic telemetry display',
    trainingModality: 'Metabolic Conditioning & Lactate Threshold',
    recommendedFor: 'Zone 2-5 intervals, VO2 max optimization, metabolic finishers',
    category: 'Metabolic Conditioning',
    imageUrl: '/images/backgrounds/coach-metabolic-conditioning-engine.jpg',
    badge: 'Cardio · Lactate Threshold',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-metabolic-conditioning-engine.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-metabolic-conditioning-engine.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 7. Mobility, Joint Longevity & Recovery Sanctuary ──
  {
    id: 'mobility-recovery-sanctuary',
    name: 'Mobility, Joint Longevity & Recovery Sanctuary',
    tagline: 'Black leather mobility mats, precision percussion tools, foam rollers, cedar acoustic paneling & infrared sauna',
    trainingModality: 'Mobility, Down-Regulation & Joint Regeneration',
    recommendedFor: 'Post-workout flush, myofascial release, joint decompression, breathwork',
    category: 'Recovery & Longevity',
    imageUrl: '/images/backgrounds/coach-mobility-recovery-sanctuary.jpg',
    badge: 'Recovery · Joint Longevity',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-mobility-recovery-sanctuary.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'center 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-mobility-recovery-sanctuary.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 8. Executive 1:1 Master Sanctum (Penthouse Suite) ──
  {
    id: 'executive-suite',
    name: 'Executive 1:1 Master Sanctum',
    tagline: 'Nero Marquina marble, matte black cable apparatus, twilight metropolitan skyline vista & cognac leather lounge',
    trainingModality: 'Executive Concierge Coaching & Full Periodization',
    recommendedFor: 'High-touch executive consultations, VIP concierge periodization',
    category: 'Executive Suite',
    imageUrl: '/images/backgrounds/coach-executive-master-sanctum.jpg',
    badge: 'Executive · VIP Master',
    logoPosition: 'center-plaque',
    thumbnailStyle: {
      backgroundImage: `url('${BRAND_LOGO}'), url(/images/backgrounds/coach-executive-master-sanctum.jpg)`,
      backgroundSize: '42px 42px, cover',
      backgroundRepeat: 'no-repeat, no-repeat',
      backgroundPosition: 'calc(100% - 24px) 38%, center',
    },
    backgroundStyle: {
      backgroundImage: `url(/images/backgrounds/coach-executive-master-sanctum.jpg)`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center, center',
    },
  },

  // ── 9. DSLR Portrait Bokeh Blur ──
  {
    id: 'studio-blur',
    name: 'DSLR Portrait Bokeh Blur',
    tagline: 'Authentic 85mm f/1.4 optical depth-of-field background blur with edge anti-aliasing',
    trainingModality: 'Universal Optical Blur',
    recommendedFor: 'Low-bandwidth or minimal background setting',
    category: 'Blur',
    isBlur: true,
    badge: 'Optical Bokeh Blur',
    thumbnailStyle: {
      background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
      filter: 'blur(1px)',
    },
    backgroundStyle: {
      background: 'rgba(15, 23, 42, 0.8)',
    },
  },
]

/**
 * Helper to find background preset by ID with support for legacy ID aliases.
 */
export function getCoachBackgroundById(id: string | null | undefined): CoachBackgroundPreset | null {
  if (!id) return null
  const direct = COACH_BACKGROUND_PRESETS.find((p) => p.id === id)
  if (direct) return direct

  // Legacy mappings
  if (id === 'assessment-movement-screen') return COACH_BACKGROUND_PRESETS.find((p) => p.id === 'diagnostic-lab') ?? null
  if (id === 'forge-athletic-sanctuary') return COACH_BACKGROUND_PRESETS.find((p) => p.id === 'functional-stabilization') ?? null
  if (id === 'hybrid-concierge') return COACH_BACKGROUND_PRESETS.find((p) => p.id === 'hypertrophy-muscular-architecture') ?? null
  if (id === 'corporate-lounge') return COACH_BACKGROUND_PRESETS.find((p) => p.id === 'athletic-power-turf') ?? null
  if (id === 'maximal-strength-olympic') return COACH_BACKGROUND_PRESETS.find((p) => p.id === 'olympic-facility') ?? null
  if (id === 'executive-master-sanctum') return COACH_BACKGROUND_PRESETS.find((p) => p.id === 'executive-suite') ?? null

  return null
}
