/**
 * AI Biomechanical Video Form Analysis Engine
 * Evaluates key compound lifts, scores kinetic checkpoints, and generates NASM corrective cues.
 */

export type LiftType =
  | 'barbell_back_squat'
  | 'barbell_deadlift'
  | 'barbell_bench_press'
  | 'overhead_press'
  | 'single_leg_squat'
  | 'barbell_row'
  | 'romanian_deadlift'

export interface KineticCheckpoint {
  name: string
  status: 'optimal' | 'moderate_deviation' | 'severe_fault'
  observation: string
  prescribedCue: string
  impairedMuscles?: {
    overactive: string[]
    underactive: string[]
  }
}

export interface VideoCritiqueAnalysis {
  id: string
  liftType: LiftType
  liftName: string
  loadLbs?: number
  repsObserved: number
  overallFormScore: number // 0 - 100
  rating: 'Mastery' | 'Proficient' | 'Needs Recalibration' | 'High Risk'
  checkpoints: KineticCheckpoint[]
  primaryFault: string | null
  masterCoachSummary: string
  prescribedCorrectiveContinuum: {
    inhibit: string[]
    lengthen: string[]
    activate: string[]
    integrate: string[]
  }
  analyzedAt: string
}

export const LIFT_METADATA: Record<LiftType, { name: string; primaryPrimeMover: string; focusJoints: string[] }> = {
  barbell_back_squat: {
    name: 'Barbell Back Squat',
    primaryPrimeMover: 'Quadriceps & Gluteus Maximus',
    focusJoints: ['Ankle (Dorsiflexion)', 'Knee (Flexion/Valgus)', 'LPHC (Lumbar/Pelvic)', 'Thoracic Extension'],
  },
  barbell_deadlift: {
    name: 'Barbell Conventional Deadlift',
    primaryPrimeMover: 'Gluteus Maximus, Hamstrings & Latissimus Dorsi',
    focusJoints: ['LPHC (Neutral Spine)', 'Hip Hinge Angle', 'Scapular Retraction', 'Tibia Angle'],
  },
  barbell_bench_press: {
    name: 'Barbell Bench Press',
    primaryPrimeMover: 'Pectoralis Major & Anterior Deltoid',
    focusJoints: ['Scapular Depression/Retraction', 'Elbow Flare Angle (45°-75°)', 'Wrist Extension', 'Foot Drive'],
  },
  overhead_press: {
    name: 'Barbell Overhead Press (OHP)',
    primaryPrimeMover: 'Anterior/Medial Deltoid & Triceps Brachii',
    focusJoints: ['Core/Lumbar Hyperextension', 'Shoulder Complex Full Flexion', 'Bar Path Clearance', 'Glute Lock'],
  },
  single_leg_squat: {
    name: 'Single-Leg Squat (SLS)',
    primaryPrimeMover: 'Quadriceps, Gluteus Medius & Maximus',
    focusJoints: ['Frontal Plane Knee Stability', 'Pelvic Drop/Trendelenburg', 'Ankle Pronation/Eversion'],
  },
  barbell_row: {
    name: 'Bent-Over Barbell Row',
    primaryPrimeMover: 'Latissimus Dorsi, Rhomboids & Middle Trapezius',
    focusJoints: ['Torso Inclination (45°)', 'Cervical Spine Neutral', 'Elbow Drive Line'],
  },
  romanian_deadlift: {
    name: 'Romanian Deadlift (RDL)',
    primaryPrimeMover: 'Hamstrings & Gluteus Maximus',
    focusJoints: ['Pure Posterior Hip Hinge', 'Minimal Knee Flexion (20°)', 'Lumbar Neutral Control'],
  },
}

export interface VideoFormInput {
  liftType: LiftType
  loadLbs?: number
  repsCount?: number
  observedDeviations?: string[] // e.g. ['knee_valgus', 'excessive_forward_lean', 'butt_wink', 'lumbar_rounding']
  clientNotes?: string
}

export function analyzeLiftForm(input: VideoFormInput): VideoCritiqueAnalysis {
  const { liftType, loadLbs, repsCount = 5, observedDeviations = [] } = input
  const meta = LIFT_METADATA[liftType] ?? LIFT_METADATA.barbell_back_squat

  const checkpoints: KineticCheckpoint[] = []
  let deductionPoints = 0

  const hasDeviation = (key: string) => observedDeviations.includes(key)

  if (liftType === 'barbell_back_squat' || liftType === 'single_leg_squat') {
    // 1. Knee Valgus Checkpoint
    if (hasDeviation('knee_valgus')) {
      deductionPoints += 18
      checkpoints.push({
        name: 'Knee Tracking & Frontal Alignment',
        status: 'severe_fault',
        observation: 'Knees collapse inward (valgus) during the concentric transition out of the hole.',
        prescribedCue: 'Cue: "Screw your feet into the floor and spread the floor apart through the entire ascent."',
        impairedMuscles: {
          overactive: ['Tensor Fasciae Latae (TFL)', 'Adductor Complex', 'Biceps Femoris (Short Head)'],
          underactive: ['Gluteus Medius', 'Gluteus Maximus', 'Vastus Medialis Oblique (VMO)'],
        },
      })
    } else {
      checkpoints.push({
        name: 'Knee Tracking & Frontal Alignment',
        status: 'optimal',
        observation: 'Knees track directly over 2nd and 3rd toes with stable patellar alignment throughout.',
        prescribedCue: 'Maintain consistent glute medius activation throughout descending eccentric phase.',
      })
    }

    // 2. Torso / LPHC Angle Checkpoint
    if (hasDeviation('excessive_forward_lean')) {
      deductionPoints += 14
      checkpoints.push({
        name: 'LPHC & Torso Parallelism',
        status: 'moderate_deviation',
        observation: 'Excessive forward torso pitch with trunk inclination exceeding tibial angle at bottom depth.',
        prescribedCue: 'Cue: "Drive chest tall through the bar and push knees forward while keeping heels glued."',
        impairedMuscles: {
          overactive: ['Gastrocnemius / Soleus', 'Hip Flexor Complex (Psoas)', 'Abdominal Complex'],
          underactive: ['Anterior Tibialis', 'Gluteus Maximus', 'Erector Spinae'],
        },
      })
    } else {
      checkpoints.push({
        name: 'LPHC & Torso Parallelism',
        status: 'optimal',
        observation: 'Torso angle remains parallel to tibia angle; neutral lumbopelvic control maintained.',
        prescribedCue: 'Excellent intra-abdominal pressure and thoracic brace maintained.',
      })
    }

    // 3. Depth & Hip Flexion
    if (hasDeviation('cut_high')) {
      deductionPoints += 12
      checkpoints.push({
        name: 'Depth & Range of Motion',
        status: 'moderate_deviation',
        observation: 'Squat depth stopped 2-3 inches above parallel (femur not parallel with floor).',
        prescribedCue: 'Cue: "Open hip capsule and sit between your heels to achieve full parallel depth."',
      })
    } else {
      checkpoints.push({
        name: 'Depth & Range of Motion',
        status: 'optimal',
        observation: 'Hip crease descends cleanly below top of the patella without lumbopelvic flexion.',
        prescribedCue: 'Solid, consistent parallel depth achieved on all repetitions.',
      })
    }
  } else if (liftType === 'barbell_deadlift' || liftType === 'romanian_deadlift') {
    // Deadlift Checkpoints
    if (hasDeviation('lumbar_rounding')) {
      deductionPoints += 25
      checkpoints.push({
        name: 'Spinal Neutrality & Shear Protection',
        status: 'severe_fault',
        observation: 'Lumbar flexion / rounding observed during initial floor break, shifting load to passive spinal ligaments.',
        prescribedCue: 'Cue: "Pull slack out of the barbell, pack lats into back pockets, and wedge hips into the bar."',
        impairedMuscles: {
          overactive: ['Hamstrings', 'Rectus Abdominis'],
          underactive: ['Erector Spinae', 'Latissimus Dorsi', 'Gluteus Maximus'],
        },
      })
    } else {
      checkpoints.push({
        name: 'Spinal Neutrality & Shear Protection',
        status: 'optimal',
        observation: 'Pristine neutral spine maintained from floor pull to lockout with active lat engagement.',
        prescribedCue: 'Flawless brace and bar proximity to shin line.',
      })
    }

    if (hasDeviation('hips_shooting_up')) {
      deductionPoints += 15
      checkpoints.push({
        name: 'Hip & Knee Extension Coordination',
        status: 'moderate_deviation',
        observation: 'Hips rise prematurely before barbell clears knees, turning the lift into a stiff-legged pull.',
        prescribedCue: 'Cue: "Push the earth away with your quads before initiating violent hip extension."',
      })
    } else {
      checkpoints.push({
        name: 'Hip & Knee Extension Coordination',
        status: 'optimal',
        observation: 'Synchronous knee and hip extension creates smooth vertical bar trajectory.',
        prescribedCue: 'Exceptional kinetic timing and force transfer.',
      })
    }
  } else {
    // Upper Body Lifts (Bench / OHP / Row)
    if (hasDeviation('flared_elbows') || hasDeviation('lumbar_hyperextension')) {
      deductionPoints += 18
      checkpoints.push({
        name: 'Glenohumeral & Core Stability',
        status: 'moderate_deviation',
        observation: 'Excessive elbow flare (>80°) or excessive lumbar arch under heavy pressing load.',
        prescribedCue: 'Cue: "Tuck elbows to 45° like an arrow, lock glutes and brace ribcage down."',
      })
    } else {
      checkpoints.push({
        name: 'Glenohumeral & Core Stability',
        status: 'optimal',
        observation: 'Optimal joint stacking, stable scapular platform, and zero energy leaks observed.',
        prescribedCue: 'Strong locked-in shoulder packing and bar trajectory.',
      })
    }
  }

  // Default optimal checkpoint if none flagged
  if (checkpoints.length === 0) {
    checkpoints.push({
      name: 'Kinetic Chain Alignment',
      status: 'optimal',
      observation: 'Movement executed with precise biomechanical efficiency and steady tempo control.',
      prescribedCue: 'Continue progressive overload while maintaining current technical standard.',
    })
  }

  const overallFormScore = Math.max(35, Math.min(100, 100 - deductionPoints))

  let rating: VideoCritiqueAnalysis['rating'] = 'Mastery'
  if (overallFormScore < 60) rating = 'High Risk'
  else if (overallFormScore < 75) rating = 'Needs Recalibration'
  else if (overallFormScore < 90) rating = 'Proficient'

  const primaryFault = checkpoints.find(c => c.status === 'severe_fault')?.observation ??
    checkpoints.find(c => c.status === 'moderate_deviation')?.observation ?? null

  const masterCoachSummary = rating === 'Mastery'
    ? `Exceptional technical execution on ${meta.name}. Joint stacking, bar path, and kinetic transfer are locked in.`
    : rating === 'Proficient'
    ? `Solid lift mechanics on ${meta.name}. Minor kinetic compensations noted. Implement the corrective cues below to optimize power transfer.`
    : `Attention required on ${meta.name}. Critical kinetic faults identified that compromise joint safety and leak force. Review the prescribed 4-phase corrective continuum before adding load.`

  // Prescribed Corrective Continuum
  const overactiveList = Array.from(new Set(checkpoints.flatMap(c => c.impairedMuscles?.overactive ?? [])))
  const underactiveList = Array.from(new Set(checkpoints.flatMap(c => c.impairedMuscles?.underactive ?? [])))

  const prescribedCorrectiveContinuum = {
    inhibit: overactiveList.length > 0
      ? overactiveList.map(m => `SMR / Foam Roll ${m} (Hold tender spots 30-60s)`)
      : ['SMR Foam Roll Thoracic Spine & Piriformis (30-60s)'],
    lengthen: overactiveList.length > 0
      ? overactiveList.map(m => `Static / Dynamic Stretch ${m} (30s hold, 2 sets)`)
      : ['Static Hip Flexor & Calves Stretch (30s hold)'],
    activate: underactiveList.length > 0
      ? underactiveList.map(m => `Isolated Activation for ${m} (2 sets x 12-15 reps, 4/2/1 tempo)`)
      : ['Banded Lateral Monster Walks (2 sets x 15 reps)'],
    integrate: [
      `Light-load ${meta.name} with 4/2/1 tempo emphasizing flawless kinetic alignment (3 sets x 8 reps)`,
    ],
  }

  return {
    id: `critique-${Date.now()}`,
    liftType,
    liftName: meta.name,
    loadLbs,
    repsObserved: repsCount,
    overallFormScore,
    rating,
    checkpoints,
    primaryFault,
    masterCoachSummary,
    prescribedCorrectiveContinuum,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Generates an instant, commanding coach audio prompt for gym earbuds based on video analysis.
 */
export function generateQuickBiomechanicalSpokenSummary(analysis: VideoCritiqueAnalysis): string {
  const { liftName, rating, overallFormScore, checkpoints, primaryFault } = analysis

  if (rating === 'Mastery') {
    return `Coach Gordon here on your ${liftName}. Outstanding execution! Your joint stacking, depth, and bar path are locked in at a ${overallFormScore} form score. Own your tempo and keep stacking wins!`
  }

  const primaryDeviation = checkpoints.find(c => c.status === 'severe_fault' || c.status === 'moderate_deviation')
  const cue = primaryDeviation?.prescribedCue || 'Focus on controlling your eccentric descent and maintaining your abdominal brace.'

  return `Coach Gordon here on your ${liftName}. Form score is ${overallFormScore} percent. ${primaryFault ? `I noticed ${primaryFault}.` : ''} Key cue for your next set: ${cue} Lock into your tempo!`
}

