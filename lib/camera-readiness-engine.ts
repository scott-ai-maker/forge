import type { InjectedReadinessDrill } from '@/lib/posture-profile-state'

export type ReadinessScreenMode = 'overhead_squat' | 'scapular_wall_slides' | 'dual_screen'

export type ReadinessPresetId =
  | 'optimal_mobility'
  | 'tight_hips_ankles'
  | 'stiff_upper_back'

export interface ReadinessAngleCheck {
  id: string
  label: string
  measuredDeg: number
  baselineDeg: number
  status: 'optimal' | 'restricted'
}

export interface ReadinessEvaluationResult {
  screenMode: ReadinessScreenMode
  presetUsed?: ReadinessPresetId
  readinessScore: number // 0 - 100
  restrictionFlags: string[]
  checks: ReadinessAngleCheck[]
  injectedDrills: InjectedReadinessDrill[]
  totalInjectedDurationSec: number
  coachSummary: string
}

export const READINESS_PRESET_LABELS: Record<ReadinessPresetId, string> = {
  optimal_mobility: 'Optimal Mobility',
  tight_hips_ankles: 'Tight Hips & Ankles',
  stiff_upper_back: 'Stiff Upper Back / Shoulders',
}

export interface ReadinessScreenMediaSpec {
  mode: ReadinessScreenMode
  title: string
  subtitle: string
  imageUrl: string
  videoUrl: string
}

export const READINESS_SCREEN_MEDIA: Record<ReadinessScreenMode, ReadinessScreenMediaSpec> = {
  overhead_squat: {
    mode: 'overhead_squat',
    title: '3 Bodyweight Overhead Squats',
    subtitle: 'Ankle dorsiflexion · Hip depth · Knee valgus · Torso lean',
    imageUrl: '/images/exercises/readiness-overhead-squat.jpg',
    videoUrl: '/videos/exercises/readiness-overhead-squat.mp4',
  },
  scapular_wall_slides: {
    mode: 'scapular_wall_slides',
    title: '3 Scapular Wall Slides',
    subtitle: 'Thoracic extension · Shoulder flexion · Cervical drift',
    imageUrl: '/images/exercises/readiness-scapular-wall-slides.jpg',
    videoUrl: '/videos/exercises/readiness-scapular-wall-slides.mp4',
  },
  dual_screen: {
    mode: 'dual_screen',
    title: 'Dual-Screen Full Check',
    subtitle: 'Lower + Upper kinetic chain + trend alerts',
    imageUrl: '/images/exercises/readiness-dual-screen-check.jpg',
    videoUrl: '/videos/exercises/readiness-dual-screen-check.mp4',
  },
}

const DRILL_CATALOG: Record<string, InjectedReadinessDrill> = {
  ankle_rocks: {
    id: 'drill-ankle-rocks',
    name: 'Half-Kneeling Ankle Dorsiflexion Rocks',
    targetArea: 'Soleus & Talocrural Joint',
    durationSec: 45,
    cue: 'Drive knee smoothly over 2nd toe while keeping heel anchored flat.',
    priority: 1,
    imageUrl: '/images/exercises/readiness-ankle-dorsiflexion-rocks.jpg',
    videoUrl: '/videos/exercises/readiness-ankle-dorsiflexion-rocks.mp4',
  },
  couch_hip_opener: {
    id: 'drill-hip-opener',
    name: '90/90 Hip Capsule & Psoas Opener',
    targetArea: 'Hip Flexors & Deep Rotators',
    durationSec: 45,
    cue: 'Posteriorly tuck pelvis, exhale slowly, and open hips without arching low back.',
    priority: 2,
    imageUrl: '/images/exercises/readiness-90-90-hip-psoas-opener.jpg',
    videoUrl: '/videos/exercises/readiness-90-90-hip-psoas-opener.mp4',
  },
  glute_med_bridge: {
    id: 'drill-glute-bridge',
    name: 'Tempo Glute Bridge w/ Knee Out-Drive',
    targetArea: 'Glute Medius & Core Cylinder',
    durationSec: 60,
    cue: '2-second top glute squeeze to lock in knee alignment before Set 1.',
    priority: 3,
    imageUrl: '/images/exercises/readiness-tempo-glute-bridge-out-drive.jpg',
    videoUrl: '/videos/exercises/readiness-tempo-glute-bridge-out-drive.mp4',
  },
  thoracic_opener: {
    id: 'drill-thoracic-book',
    name: 'Side-Lying Open-Book Thoracic Rotations',
    targetArea: 'Mid-Back & Pectoralis Minor',
    durationSec: 45,
    cue: 'Keep top knee pinned down and rotate ribcage smoothly with each exhale.',
    priority: 1,
    imageUrl: '/images/exercises/readiness-open-book-thoracic-rotations.jpg',
    videoUrl: '/videos/exercises/readiness-open-book-thoracic-rotations.mp4',
  },
  prone_y_raise: {
    id: 'drill-prone-y',
    name: 'Wall Scapular Upward-Rotation Slides + Chin Nod',
    targetArea: 'Lower Traps, Serratus & Deep Neck Flexors',
    durationSec: 45,
    cue: 'Keep ribs down and back of neck long as forearms glide upward.',
    priority: 2,
    imageUrl: '/images/exercises/readiness-wall-scapular-slides-chin-nod.jpg',
    videoUrl: '/videos/exercises/readiness-wall-scapular-slides-chin-nod.mp4',
  },
  band_pull_apart: {
    id: 'drill-scap-retract',
    name: 'Controlled Scapular External Rotation Pulses',
    targetArea: 'Posterior Cuff & Rhomboids',
    durationSec: 60,
    cue: 'Draw shoulder blades down and back without shrugging upper traps.',
    priority: 3,
    imageUrl: '/images/exercises/readiness-scapular-external-rotation-pulses.jpg',
    videoUrl: '/videos/exercises/readiness-scapular-external-rotation-pulses.mp4',
  },
}

/**
 * Applies the 20m Express Mode cap:
 * - Standard mode: 2–3 drills (~150–180 seconds / 2–3 minutes).
 * - 20m Express active: strictly capped at 90 seconds total across 2 high-priority drills.
 */
export function applyExpressCapToInjectedDrills(
  drills: InjectedReadinessDrill[],
  expressModeActive: boolean
): InjectedReadinessDrill[] {
  if (drills.length === 0) return []
  const sorted = [...drills].sort((a, b) => a.priority - b.priority)

  if (!expressModeActive) {
    return sorted.slice(0, 3)
  }

  // Express cap: max 2 high-priority drills, total <= 90 seconds (45s + 45s)
  const topTwo = sorted.slice(0, 2)
  const perDrillCap = Math.floor(90 / topTwo.length)
  return topTwo.map(drill => ({
    ...drill,
    durationSec: Math.min(drill.durationSec, perDrillCap),
  }))
}

export function evaluateCameraReadiness(params: {
  screenMode: ReadinessScreenMode
  preset: ReadinessPresetId
  expressModeActive: boolean
}): ReadinessEvaluationResult {
  const { screenMode, preset, expressModeActive } = params

  let checks: ReadinessAngleCheck[] = []
  let restrictionFlags: string[] = []
  let rawDrills: InjectedReadinessDrill[] = []
  let readinessScore = 93
  let coachSummary =
    'Clean joint excursion across all 3 reps. Cleared to proceed directly into working sets.'

  if (preset === 'optimal_mobility') {
    if (screenMode === 'overhead_squat') {
      checks = [
        { id: 'ankle_df', label: 'Ankle Dorsiflexion', measuredDeg: 34, baselineDeg: 33, status: 'optimal' },
        { id: 'hip_depth', label: 'Hip Crease Depth', measuredDeg: 94, baselineDeg: 95, status: 'optimal' },
        { id: 'knee_valgus', label: 'Knee Tracking (Valgus)', measuredDeg: 3, baselineDeg: 4, status: 'optimal' },
        { id: 'torso_lean', label: 'Torso-to-Tibia Lean', measuredDeg: 4, baselineDeg: 5, status: 'optimal' },
      ]
    } else if (screenMode === 'scapular_wall_slides') {
      checks = [
        { id: 't_spine', label: 'Thoracic Extension', measuredDeg: 176, baselineDeg: 175, status: 'optimal' },
        { id: 'shoulder_flex', label: 'Shoulder Flexion', measuredDeg: 174, baselineDeg: 172, status: 'optimal' },
        { id: 'cervical_drift', label: 'Cervical Drift', measuredDeg: 4, baselineDeg: 5, status: 'optimal' },
      ]
    } else {
      checks = [
        { id: 'ankle_df', label: 'Ankle Dorsiflexion', measuredDeg: 34, baselineDeg: 33, status: 'optimal' },
        { id: 'hip_depth', label: 'Hip Crease Depth', measuredDeg: 94, baselineDeg: 95, status: 'optimal' },
        { id: 'shoulder_flex', label: 'Shoulder Flexion', measuredDeg: 174, baselineDeg: 172, status: 'optimal' },
        { id: 'cervical_drift', label: 'Cervical Drift', measuredDeg: 4, baselineDeg: 5, status: 'optimal' },
      ]
    }
    readinessScore = 94
  } else if (preset === 'tight_hips_ankles') {
    checks = [
      { id: 'ankle_df', label: 'Ankle Dorsiflexion', measuredDeg: 21, baselineDeg: 32, status: 'restricted' },
      { id: 'hip_depth', label: 'Hip Crease Depth', measuredDeg: 108, baselineDeg: 95, status: 'restricted' },
      { id: 'knee_valgus', label: 'Knee Tracking (Valgus)', measuredDeg: 9, baselineDeg: 4, status: 'restricted' },
      { id: 'torso_lean', label: 'Torso-to-Tibia Lean', measuredDeg: 14, baselineDeg: 6, status: 'restricted' },
    ]
    restrictionFlags = ['ankle_dorsiflexion_limited', 'hip_flexor_tightness', 'mild_knee_valgus']
    rawDrills = [
      DRILL_CATALOG.ankle_rocks,
      DRILL_CATALOG.couch_hip_opener,
      DRILL_CATALOG.glute_med_bridge,
    ]
    readinessScore = 74
    coachSummary =
      'Ankle dorsiflexion (-11°) and hip depth showed morning stiffness. Targeted ankle & hip openers prepended before Set 1.'
  } else {
    checks = [
      { id: 't_spine', label: 'Thoracic Extension', measuredDeg: 158, baselineDeg: 174, status: 'restricted' },
      { id: 'shoulder_flex', label: 'Shoulder Flexion', measuredDeg: 154, baselineDeg: 172, status: 'restricted' },
      { id: 'cervical_drift', label: 'Cervical Drift', measuredDeg: 15, baselineDeg: 5, status: 'restricted' },
    ]
    restrictionFlags = ['thoracic_stiffness', 'shoulder_flexion_limited', 'cervical_drift']
    rawDrills = [
      DRILL_CATALOG.thoracic_opener,
      DRILL_CATALOG.prone_y_raise,
      DRILL_CATALOG.band_pull_apart,
    ]
    readinessScore = 76
    coachSummary =
      'Upper-back & overhead flexion stiffness detected from desk posture. Prepended thoracic & scapular primers before Set 1.'
  }

  const injectedDrills = applyExpressCapToInjectedDrills(rawDrills, expressModeActive)
  const totalInjectedDurationSec = injectedDrills.reduce((sum, d) => sum + d.durationSec, 0)

  return {
    screenMode,
    presetUsed: preset,
    readinessScore,
    restrictionFlags,
    checks,
    injectedDrills,
    totalInjectedDurationSec,
    coachSummary,
  }
}

