/**
 * NASM Assessment & Corrective Exercise Continuum (CEx) Engine
 * 
 * Based on NASM Optimum Performance Training (OPT™) and Corrective Exercise Specialist (CES) standards:
 * - 5 Kinetic Chain Checkpoints (Foot & Ankle, Knee, LPHC, Shoulders & Thoracic Spine, Head & Cervical Spine)
 * - Static Postural Assessment & Distortion Syndromes:
 *   - Pronation Distortion Syndrome
 *   - Lower Crossed Syndrome
 *   - Upper Crossed Syndrome
 * - Dynamic Movement Assessments:
 *   - Overhead Squat Assessment (OHSA - Anterior & Lateral Views)
 *   - Single-Leg Squat Assessment (SLS)
 *   - Pushing & Pulling Assessments
 * - NASM 4-Phase Corrective Exercise Continuum:
 *   1. Inhibit (Self-Myofascial Release / SMR)
 *   2. Lengthen (Static / Neuromuscular Stretching)
 *   3. Activate (Isolated Muscle Strengthening)
 *   4. Integrate (Dynamic Integrated Movement)
 * - Cardiorespiratory & Performance Assessment Calculators (YMCA 3-Min Step Test, HR Zones, VT1/VT2)
 * - NASM 2-for-2 Progression Rule & Estimated 1RM Calculations
 */

import { speakCoachVoiceCue } from './coach-voice-synthesizer'

export type KineticChainCheckpoint =
  | 'feet_ankles'
  | 'knees'
  | 'lphc'
  | 'shoulders'
  | 'head_neck'

export interface StaticPosturalFinding {
  checkpoint: KineticChainCheckpoint
  observation: string
  distortionSyndrome?: 'pronation_distortion' | 'lower_crossed' | 'upper_crossed' | 'none'
  notes?: string
}

export type OhsaCompensation =
  // Foot & Ankle
  | 'feet_turn_out'
  | 'feet_flatten'
  | 'heels_rise'
  // Knee
  | 'knees_move_inward' // Knee valgus
  | 'knees_move_outward' // Knee varus
  // LPHC
  | 'excessive_forward_lean'
  | 'low_back_arches' // Anterior pelvic tilt
  | 'low_back_rounds' // Posterior pelvic tilt
  | 'asymmetrical_weight_shift'
  // Upper Body / Shoulders / Head
  | 'arms_fall_forward'
  | 'shoulders_elevate'
  | 'forward_head'

export interface OhsaObservation {
  compensation: OhsaCompensation
  view: 'anterior' | 'lateral' | 'posterior'
  checkpoint: KineticChainCheckpoint
  severity: 'mild' | 'moderate' | 'severe'
  notes?: string
}

export interface SingleLegSquatObservation {
  leg: 'left' | 'right'
  kneeValgus: boolean
  pelvicDrop: boolean
  pelvicRotation: boolean
  torsoLean: boolean
  notes?: string
}

export interface PushPullObservation {
  assessmentType: 'pushing' | 'pulling'
  lowBackArches: boolean
  shouldersElevate: boolean
  headMigratesForward: boolean
  scapularWinging: boolean
  notes?: string
}

export interface CardioVitalsAssessment {
  restingHeartRateBpm?: number | null
  bloodPressureSystolic?: number | null
  bloodPressureDiastolic?: number | null
  stepTestRecoveryHrBpm?: number | null
  rockportWalkTimeMins?: number | null
  rockportPostHrBpm?: number | null
  estimatedVo2Max?: number | null
  cardioFitnessRating?: 'poor' | 'fair' | 'average' | 'good' | 'very_good' | 'excellent' | null
}

export interface NasmAssessmentRecord {
  id: string
  client_id: string
  coach_id: string
  assessment_date: string
  title?: string | null
  static_posture: StaticPosturalFinding[]
  ohsa_findings: OhsaObservation[]
  single_leg_squat?: SingleLegSquatObservation[]
  push_pull?: PushPullObservation[]
  cardio_vitals?: CardioVitalsAssessment
  overactive_muscles: string[]
  underactive_muscles: string[]
  prescribed_correctives: CorrectiveExercisePlan
  coach_summary_notes?: string | null
  created_at: string
  updated_at?: string
}

export interface CorrectiveExerciseItem {
  id?: string
  name: string
  phaseType: 'inhibit' | 'lengthen' | 'activate' | 'integrate'
  targetMuscle: string
  protocol: string
  tempo?: string
  sets?: string
  repsOrDuration: string
  coachingCues: string[]
}

export interface CorrectiveExercisePlan {
  inhibit: CorrectiveExerciseItem[]
  lengthen: CorrectiveExerciseItem[]
  activate: CorrectiveExerciseItem[]
  integrate: CorrectiveExerciseItem[]
  summary: string
}

// ── NASM OHSA MUSCLE MAPPING KNOWLEDGE BASE ──────────────────────
export interface MuscleImbalanceDefinition {
  compensation: OhsaCompensation
  label: string
  checkpoint: KineticChainCheckpoint
  view: 'anterior' | 'lateral' | 'posterior'
  overactiveMuscles: string[]
  underactiveMuscles: string[]
  inhibitExercises: Array<{ name: string; target: string; protocol: string; cues: string[] }>
  lengthenExercises: Array<{ name: string; target: string; protocol: string; cues: string[] }>
  activateExercises: Array<{ name: string; target: string; protocol: string; tempo: string; sets: string; reps: string; cues: string[] }>
  integrateExercises: Array<{ name: string; target: string; protocol: string; tempo: string; sets: string; reps: string; cues: string[] }>
}

export const NASM_OHSA_MAPPINGS: Record<OhsaCompensation, MuscleImbalanceDefinition> = {
  feet_turn_out: {
    compensation: 'feet_turn_out',
    label: 'Feet Turn Out',
    checkpoint: 'feet_ankles',
    view: 'anterior',
    overactiveMuscles: ['Soleus', 'Lateral Gastrocnemius', 'Biceps Femoris (Short Head)', 'Tensor Fasciae Latae (TFL)'],
    underactiveMuscles: ['Medial Gastrocnemius', 'Medial Hamstrings', 'Gracilis', 'Sartorius', 'Popliteus'],
    inhibitExercises: [
      { name: 'SMR Calves & Lateral Gastrocnemius', target: 'Lateral Gastrocnemius / Soleus', protocol: 'Hold tender spot 30-60s', cues: ['Roll slowly along outer calf until tender spot found, hold pressure.'] },
      { name: 'SMR Biceps Femoris / Outer Hamstring', target: 'Biceps Femoris', protocol: 'Hold tender spot 30-60s', cues: ['Focus on the posterolateral aspect of the thigh.'] },
    ],
    lengthenExercises: [
      { name: 'Static Calf Stretch (Gastrocnemius / Soleus)', target: 'Gastrocnemius / Soleus', protocol: 'Static hold 30s per side', cues: ['Keep back heel flat and toes pointing strictly straight ahead.'] },
      { name: 'Static Standing Hamstring Stretch (Neutral Rotation)', target: 'Biceps Femoris', protocol: 'Static hold 30s per side', cues: ['Keep foot straight and square hips to prevent external rotation.'] },
    ],
    activateExercises: [
      { name: 'Single-Leg Balance with Toe Internal Rotation', target: 'Medial Gastrocnemius / Popliteus', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '1-2', reps: '10-15', cues: ['Maintain arch, keep knee in line with 2nd toe.'] },
    ],
    integrateExercises: [
      { name: 'Single-Leg Squat to Scaption', target: 'Subtalar Joint & Kinetic Chain', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '1-2', reps: '10-12', cues: ['Control knee alignment and maintain feet straight forward.'] },
    ],
  },
  feet_flatten: {
    compensation: 'feet_flatten',
    label: 'Feet Flatten (Pronation)',
    checkpoint: 'feet_ankles',
    view: 'anterior',
    overactiveMuscles: ['Peroneal Complex', 'Lateral Gastrocnemius', 'Biceps Femoris (Short Head)', 'TFL'],
    underactiveMuscles: ['Anterior Tibialis', 'Posterior Tibialis', 'Gluteus Medius'],
    inhibitExercises: [
      { name: 'SMR Peroneals', target: 'Peroneal Complex', protocol: 'Hold tender spot 30-60s', cues: ['Roll along the lateral lower leg below knee joint.'] },
      { name: 'SMR Lateral Calf', target: 'Lateral Gastrocnemius', protocol: 'Hold tender spot 30-60s', cues: ['Apply gentle pressure on outer calf.'] },
    ],
    lengthenExercises: [
      { name: 'Static Peroneal Stretch', target: 'Peroneals', protocol: 'Static hold 30s per side', cues: ['Invert ankle gently to lengthen the outer lower leg.'] },
      { name: 'Static Wall Gastroc Stretch', target: 'Gastrocnemius', protocol: 'Static hold 30s per side', cues: ['Keep rear foot straight with arch lifted.'] },
    ],
    activateExercises: [
      { name: 'Isolated Anterior Tibialis Dorsiflexion', target: 'Anterior Tibialis', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '1-2', reps: '12-15', cues: ['Dorsiflex and slightly invert the foot against resistance.'] },
      { name: 'Short Foot / Arch Activation Drill', target: 'Posterior Tibialis & Foot Intrinsics', protocol: 'Isometric hold', tempo: 'Hold 5s', sets: '2', reps: '10', cues: ['Draw 1st MTP head toward heel without curling toes.'] },
    ],
    integrateExercises: [
      { name: 'Step-Up to Balance with Overhead Press', target: 'Integrated Ankle Stability', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '1-2', reps: '10-12', cues: ['Land with tripod foot contact and strong medial arch.'] },
    ],
  },
  heels_rise: {
    compensation: 'heels_rise',
    label: 'Heels Rise',
    checkpoint: 'feet_ankles',
    view: 'lateral',
    overactiveMuscles: ['Soleus', 'Gastrocnemius'],
    underactiveMuscles: ['Anterior Tibialis'],
    inhibitExercises: [
      { name: 'SMR Calves & Achilles', target: 'Soleus / Gastrocnemius', protocol: 'Hold tender spot 30-60s', cues: ['Deep foam rolling over the lower third of calf and Achilles area.'] },
    ],
    lengthenExercises: [
      { name: 'Static Straight-Leg & Bent-Knee Calf Stretch', target: 'Gastrocnemius & Soleus', protocol: 'Static hold 30s each', cues: ['Perform both with rear knee locked (gastroc) and soft (soleus).'] },
    ],
    activateExercises: [
      { name: 'Banded Dorsiflexion Raises', target: 'Anterior Tibialis', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '2', reps: '15', cues: ['Pull toes up toward shins with full controlled range.'] },
    ],
    integrateExercises: [
      { name: 'Squat to Calf Raise with Ankle Dorsiflexion Focus', target: 'Full kinetic chain', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10-12', cues: ['Keep heels pinned down until deep squat is achieved.'] },
    ],
  },
  knees_move_inward: {
    compensation: 'knees_move_inward',
    label: 'Knees Move Inward (Knee Valgus)',
    checkpoint: 'knees',
    view: 'anterior',
    overactiveMuscles: ['Adductor Complex', 'Tensor Fasciae Latae (TFL)', 'Vastus Lateralis', 'Biceps Femoris (Short Head)'],
    underactiveMuscles: ['Gluteus Medius', 'Gluteus Maximus', 'Vastus Medialis Oblique (VMO)'],
    inhibitExercises: [
      { name: 'SMR Adductors (Inner Thigh)', target: 'Adductor Complex', protocol: 'Hold tender spot 30-60s', cues: ['Prone position with roller parallel to body, roll inner thigh.'] },
      { name: 'SMR IT-Band / TFL', target: 'Tensor Fasciae Latae', protocol: 'Hold tender spot 30-60s', cues: ['Target the front pocket area just below hip bone.'] },
    ],
    lengthenExercises: [
      { name: 'Static Side-Lying Adductor Stretch', target: 'Adductor Complex', protocol: 'Static hold 30s per side', cues: ['Maintain neutral spine, sink into gentle inner thigh stretch.'] },
      { name: 'Static Standing TFL / ITB Stretch', target: 'TFL', protocol: 'Static hold 30s per side', cues: ['Cross affected leg behind and lean torso away with arm overhead.'] },
    ],
    activateExercises: [
      { name: 'Side-Lying Clamshells with Band', target: 'Gluteus Medius', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '1-2', reps: '12-15', cues: ['Keep pelvis stacked, open knee without rolling hips backward.'] },
      { name: 'Side-Lying Straight Leg Abduction (Toe Down)', target: 'Gluteus Medius (Anterior Fibers)', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '1-2', reps: '12-15', cues: ['Turn toe slightly downward and extend hip 5 degrees back.'] },
    ],
    integrateExercises: [
      { name: 'Lateral Mini-Band Monster Walk', target: 'Gluteus Medius & VMO Integration', protocol: 'Integrated Movement', tempo: 'Controlled', sets: '2', reps: '12-15 steps each way', cues: ['Keep knees pushed out in line with 2nd/3rd toes, maintain athletic posture.'] },
      { name: 'Single-Leg Squat to Balance', target: 'Frontal plane knee tracking', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '8-10 per side', cues: ['Track knee over 2nd toe; do not let knee collapse medially.'] },
    ],
  },
  knees_move_outward: {
    compensation: 'knees_move_outward',
    label: 'Knees Move Outward (Varus)',
    checkpoint: 'knees',
    view: 'anterior',
    overactiveMuscles: ['Piriformis', 'Gluteus Minimus', 'Gluteus Medius (Posterior Fibers)', 'Biceps Femoris'],
    underactiveMuscles: ['Adductor Complex', 'Medial Hamstrings', 'Gracilis'],
    inhibitExercises: [
      { name: 'SMR Piriformis / Glutes', target: 'Piriformis', protocol: 'Hold tender spot 30-60s', cues: ['Cross ankle over knee and roll on the lateral posterior hip.'] },
    ],
    lengthenExercises: [
      { name: 'Static Figure-4 / Pigeon Stretch', target: 'Piriformis / Hip Rotators', protocol: 'Static hold 30s per side', cues: ['Keep spine tall, feel stretch in outer glute.'] },
    ],
    activateExercises: [
      { name: 'Side-Lying Bottom-Leg Adductor Lifts', target: 'Adductor Longus / Magnus', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '2', reps: '12-15', cues: ['Top leg crosses over, lift bottom leg smoothly upward.'] },
    ],
    integrateExercises: [
      { name: 'Goblet Squat with Ball Squeeze Between Knees', target: 'Adductor & Squat Pattern Integration', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10-12', cues: ['Maintain gentle pressure on the ball throughout descent and ascent.'] },
    ],
  },
  excessive_forward_lean: {
    compensation: 'excessive_forward_lean',
    label: 'Excessive Forward Lean',
    checkpoint: 'lphc',
    view: 'lateral',
    overactiveMuscles: ['Soleus', 'Gastrocnemius', 'Hip Flexor Complex (Psoas, Rectus Femoris)', 'Abdominal Complex'],
    underactiveMuscles: ['Anterior Tibialis', 'Gluteus Maximus', 'Erector Spinae', 'Intrinsics of the Core'],
    inhibitExercises: [
      { name: 'SMR Calves (Soleus/Gastroc)', target: 'Gastrocnemius / Soleus', protocol: 'Hold tender spot 30-60s', cues: ['Ankle restriction is a major driver of forward trunk lean.'] },
      { name: 'SMR Quadriceps / Rectus Femoris', target: 'Hip Flexors / Quads', protocol: 'Hold tender spot 30-60s', cues: ['Roll from mid-thigh up to anterior superior iliac spine (ASIS).'] },
    ],
    lengthenExercises: [
      { name: 'Static Kneeling Hip Flexor Stretch (Posterior Pelvic Tilt)', target: 'Psoas / Rectus Femoris', protocol: 'Static hold 30s per side', cues: ['Tuck pelvis under (squeeze glute), then shift gently forward without arching lower back.'] },
      { name: 'Static Wall Calf Stretch', target: 'Gastrocnemius / Soleus', protocol: 'Static hold 30s per side', cues: ['Drive heel into floor, keep back knee straight.'] },
    ],
    activateExercises: [
      { name: 'Quadruped Bird Dog with Isometric Hold', target: 'Erector Spinae & Gluteus Maximus', protocol: 'Isolated Activation', tempo: '4/2/2', sets: '2', reps: '10 per side', cues: ['Brace core, extend opposite arm and leg without lumbar rotation.'] },
      { name: 'Floor Bridge with Glute Squeeze', target: 'Gluteus Maximus', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '2', reps: '12-15', cues: ['Drive through heels, squeeze glutes at peak without hyperextending lumbar spine.'] },
    ],
    integrateExercises: [
      { name: 'Ball Wall Squat with Overhead Reach', target: 'Upright Torso Integration', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10-12', cues: ['Keep torso tall against ball, reach arms overhead as you descend.'] },
    ],
  },
  low_back_arches: {
    compensation: 'low_back_arches',
    label: 'Low Back Arches (Anterior Pelvic Tilt)',
    checkpoint: 'lphc',
    view: 'lateral',
    overactiveMuscles: ['Hip Flexor Complex (Psoas, TFL, Rectus Femoris)', 'Erector Spinae', 'Latissimus Dorsi'],
    underactiveMuscles: ['Gluteus Maximus', 'Hamstring Complex', 'Intrinsic Core Stabilizers (Transverse Abdominis, Multifidus)'],
    inhibitExercises: [
      { name: 'SMR Hip Flexors (TFL / Rectus Femoris)', target: 'Psoas / TFL', protocol: 'Hold tender spot 30-60s', cues: ['Lie prone with foam roller or massage ball on anterior hip crease.'] },
      { name: 'SMR Latissimus Dorsi', target: 'Latissimus Dorsi', protocol: 'Hold tender spot 30-60s', cues: ['Side-lying with arm extended overhead, roll lateral rib cage and armpit area.'] },
    ],
    lengthenExercises: [
      { name: 'Static Kneeling Hip Flexor & Quad Stretch', target: 'Psoas / Rectus Femoris', protocol: 'Static hold 30s per side', cues: ['Posteriorly tilt pelvis before leaning forward to isolate hip flexor.'] },
      { name: 'Static Latissimus Dorsi Ball Stretch', target: 'Latissimus Dorsi', protocol: 'Static hold 30s per side', cues: ['Reach arm across stability ball with thumb pointed up; sink chest.'] },
    ],
    activateExercises: [
      { name: 'Dead Bug with Ribcage Down / Core Brace', target: 'Transverse Abdominis / Core Stabilizers', protocol: 'Isolated Activation', tempo: '3/2/1', sets: '2', reps: '10 per side', cues: ['Keep lower back flush with floor throughout opposite limb extensions.'] },
      { name: 'Single-Leg Glute Bridge', target: 'Gluteus Maximus', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '2', reps: '10-12 per side', cues: ['Ensure lumbar spine does not arch; isolate contraction to glute.'] },
    ],
    integrateExercises: [
      { name: 'Squat to Overhead Press with Neutral Pelvis', target: 'Total body kinetic integration', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10-12', cues: ['Brace core to lock pelvis in neutral throughout squat and press.'] },
    ],
  },
  low_back_rounds: {
    compensation: 'low_back_rounds',
    label: 'Low Back Rounds (Posterior Pelvic Tilt / Butt Wink)',
    checkpoint: 'lphc',
    view: 'lateral',
    overactiveMuscles: ['Hamstrings', 'Rectus Abdominis', 'External Obliques', 'Gluteus Maximus (hyperactive/shortened)'],
    underactiveMuscles: ['Erector Spinae', 'Hip Flexors', 'Latissimus Dorsi', 'Intrinsic Core Stabilizers'],
    inhibitExercises: [
      { name: 'SMR Hamstrings', target: 'Hamstrings Complex', protocol: 'Hold tender spot 30-60s', cues: ['Sit on roller and roll through muscle bellies of hamstrings.'] },
      { name: 'SMR Adductor Magnus', target: 'Adductor Magnus', protocol: 'Hold tender spot 30-60s', cues: ['Target posterior-medial thigh.'] },
    ],
    lengthenExercises: [
      { name: 'Static Hamstring Stretch with Neutral Lumbar Spine', target: 'Hamstrings', protocol: 'Static hold 30s per side', cues: ['Keep natural lumbar curve, hinge at hip without rounding back.'] },
    ],
    activateExercises: [
      { name: 'Quadruped Rocking with Lumbar Lordosis Maintenance', target: 'Erector Spinae & Deep Hip Flexors', protocol: 'Neuromuscular Activation', tempo: 'Slow', sets: '2', reps: '10', cues: ['Rock hips back toward heels while keeping flat lower back.'] },
      { name: 'Prone Cobra', target: 'Erector Spinae & Middle/Lower Traps', protocol: 'Isometric hold', tempo: 'Hold 5s', sets: '2', reps: '10', cues: ['Lift chest, external rotate thumbs up, maintain neutral cervical spine.'] },
    ],
    integrateExercises: [
      { name: 'Box Squat to Regulated Depth', target: 'Hip Hinge & Lumbar Control', protocol: 'Integrated Movement', tempo: '3/1/1', sets: '2', reps: '10', cues: ['Sit back to box without losing lumbar extension.'] },
    ],
  },
  asymmetrical_weight_shift: {
    compensation: 'asymmetrical_weight_shift',
    label: 'Asymmetrical Weight Shift',
    checkpoint: 'lphc',
    view: 'posterior',
    overactiveMuscles: ['Adductor (same side as shift)', 'TFL / Gluteus Medius (opposite side of shift)', 'Piriformis'],
    underactiveMuscles: ['Gluteus Medius (same side as shift)', 'Anterior Tibialis (opposite side)'],
    inhibitExercises: [
      { name: 'SMR Adductor Complex (Shift side)', target: 'Adductors', protocol: 'Hold tender spot 30-60s', cues: ['Release hypertonic inner thigh on the side shifted towards.'] },
      { name: 'SMR TFL / Gluteus Medius (Opposite side)', target: 'TFL / Glute Med', protocol: 'Hold tender spot 30-60s', cues: ['Release outer hip on opposite side.'] },
    ],
    lengthenExercises: [
      { name: 'Static Standing Adductor Stretch', target: 'Adductor Complex', protocol: 'Static hold 30s per side', cues: ['Lengthen shifted-side inner thigh.'] },
      { name: 'Static TFL / ITB Stretch', target: 'TFL', protocol: 'Static hold 30s per side', cues: ['Lengthen opposite-side lateral hip.'] },
    ],
    activateExercises: [
      { name: 'Side-Lying Clamshell (Shift side)', target: 'Gluteus Medius', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '2', reps: '12-15', cues: ['Reactivate weak gluteus medius on the shifted side.'] },
    ],
    integrateExercises: [
      { name: 'Single-Leg Balance to Reach with Weight Scale Symmetrical Feedback', target: 'Proprioception & Weight Distribution', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '8-10 per side', cues: ['Ensure equal bilateral ground force production.'] },
    ],
  },
  arms_fall_forward: {
    compensation: 'arms_fall_forward',
    label: 'Arms Fall Forward',
    checkpoint: 'shoulders',
    view: 'lateral',
    overactiveMuscles: ['Latissimus Dorsi', 'Teres Major', 'Pectoralis Major / Minor', 'Subscapularis'],
    underactiveMuscles: ['Mid / Lower Trapezius', 'Rhomboids', 'Posterior Deltoid', 'Rotator Cuff (Infraspinatus, Teres Minor)'],
    inhibitExercises: [
      { name: 'SMR Latissimus Dorsi / Teres Major', target: 'Latissimus Dorsi', protocol: 'Hold tender spot 30-60s', cues: ['Side-lying, roll armpit and lateral scapular border.'] },
      { name: 'SMR Pectoralis Major & Minor (Massage Ball)', target: 'Pectoralis Major/Minor', protocol: 'Hold tender spot 30-60s', cues: ['Place ball against wall and lean chest into anterior shoulder/chest crease.'] },
    ],
    lengthenExercises: [
      { name: 'Static Latissimus Dorsi Ball Stretch', target: 'Latissimus Dorsi', protocol: 'Static hold 30s per side', cues: ['Thumb up, sink armpit toward ground to lengthen lats.'] },
      { name: 'Static Doorway / Wall Pec Stretch', target: 'Pectoralis Complex', protocol: 'Static hold 30s per side', cues: ['90/90 arm position against doorway, step through gently.'] },
    ],
    activateExercises: [
      { name: 'Prone Cobra / Y-T-W Scapular Retraction', target: 'Mid/Lower Traps & Rhomboids', protocol: 'Isolated Activation', tempo: '3/2/2', sets: '2', reps: '12', cues: ['Squeeze shoulder blades down and back; thumbs pointed toward ceiling.'] },
      { name: 'Standing Banded Wall Angels', target: 'Lower Trapezius & Serratus Anterior', protocol: 'Isolated Activation', tempo: '4/2/1', sets: '2', reps: '10-12', cues: ['Keep wrists and elbows in contact with wall, slide overhead without shrugging.'] },
    ],
    integrateExercises: [
      { name: 'Squat to Cable / Band High Row with External Rotation', target: 'Posterior Chain & Overhead Mechanics', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10-12', cues: ['Row at top of squat while maintaining tall spine and retracted scapulae.'] },
    ],
  },
  shoulders_elevate: {
    compensation: 'shoulders_elevate',
    label: 'Shoulders Elevate (Upper Trapezius Dominance)',
    checkpoint: 'shoulders',
    view: 'anterior',
    overactiveMuscles: ['Upper Trapezius', 'Levator Scapulae', 'Sternocleidomastoid (SCM)'],
    underactiveMuscles: ['Lower Trapezius', 'Mid Trapezius', 'Serratus Anterior', 'Deep Cervical Flexors'],
    inhibitExercises: [
      { name: 'SMR Upper Trapezius & Levator Scapulae (Ball against Wall)', target: 'Upper Trapezius', protocol: 'Hold tender spot 30-60s', cues: ['Place massage ball on top of shoulder/neck junction against wall corner.'] },
    ],
    lengthenExercises: [
      { name: 'Static Levator Scapulae & Upper Trap Stretch', target: 'Levator Scapulae', protocol: 'Static hold 30s per side', cues: ['Look into opposite armpit, gentle overpressure with hand.'] },
    ],
    activateExercises: [
      { name: 'Prone Incline Lower Trap Scapular Depressions (Y-Raises)', target: 'Lower Trapezius', protocol: 'Isolated Activation', tempo: '3/2/2', sets: '2', reps: '10-12', cues: ['Focus on pulling scapula down toward opposite back pocket.'] },
    ],
    integrateExercises: [
      { name: 'Step-Up to Overhead Scapular Scaption', target: 'Scapulohumeral Rhythm', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10', cues: ['Keep shoulders depressed away from ears as arms raise.'] },
    ],
  },
  forward_head: {
    compensation: 'forward_head',
    label: 'Forward Head Posture',
    checkpoint: 'head_neck',
    view: 'lateral',
    overactiveMuscles: ['Upper Trapezius', 'Levator Scapulae', 'Sternocleidomastoid (SCM)', 'Suboccipitals'],
    underactiveMuscles: ['Deep Cervical Flexors (Longus Colli, Longus Capitis)', 'Lower Trapezius'],
    inhibitExercises: [
      { name: 'SMR Suboccipital Release (Massage Balls at base of skull)', target: 'Suboccipitals / SCM', protocol: 'Hold 30-60s with gentle breathing', cues: ['Rest back of skull on two peanut balls, relax neck.'] },
    ],
    lengthenExercises: [
      { name: 'Static SCM & Scalene Stretch', target: 'Sternocleidomastoid', protocol: 'Static hold 30s per side', cues: ['Rotate head 45 degrees away and look gently upward.'] },
    ],
    activateExercises: [
      { name: 'Chin Tucks (Cervical Retraction) against Wall', target: 'Deep Cervical Flexors', protocol: 'Isometric Activation', tempo: 'Hold 5s', sets: '2', reps: '10', cues: ['Draw chin straight back as if making a double chin; do not tilt head down.'] },
    ],
    integrateExercises: [
      { name: 'Standing Cable Face Pull with Chin Tuck', target: 'Cervicothoracic Integration', protocol: 'Integrated Movement', tempo: '2/1/2', sets: '2', reps: '10-12', cues: ['Hold chin tuck while pulling elbows wide and rotating shoulders back.'] },
    ],
  },
}

// ── AUTOMATED CORRECTIVE EXERCISE CONTINUUM (CEx) GENERATOR ─────
export function generateCorrectiveExercisePlan(findings: OhsaObservation[]): {
  overactiveMuscles: string[]
  underactiveMuscles: string[]
  plan: CorrectiveExercisePlan
} {
  const overactiveSet = new Set<string>()
  const underactiveSet = new Set<string>()

  const inhibitMap = new Map<string, CorrectiveExerciseItem>()
  const lengthenMap = new Map<string, CorrectiveExerciseItem>()
  const activateMap = new Map<string, CorrectiveExerciseItem>()
  const integrateMap = new Map<string, CorrectiveExerciseItem>()

  for (const finding of findings) {
    const mapping = NASM_OHSA_MAPPINGS[finding.compensation]
    if (!mapping) continue

    mapping.overactiveMuscles.forEach(m => overactiveSet.add(m))
    mapping.underactiveMuscles.forEach(m => underactiveSet.add(m))

    // Inhibit items
    for (const ex of mapping.inhibitExercises) {
      if (!inhibitMap.has(ex.name)) {
        inhibitMap.set(ex.name, {
          name: ex.name,
          phaseType: 'inhibit',
          targetMuscle: ex.target,
          protocol: ex.protocol,
          repsOrDuration: '30-60s hold per tender area',
          coachingCues: ex.cues,
        })
      }
    }

    // Lengthen items
    for (const ex of mapping.lengthenExercises) {
      if (!lengthenMap.has(ex.name)) {
        lengthenMap.set(ex.name, {
          name: ex.name,
          phaseType: 'lengthen',
          targetMuscle: ex.target,
          protocol: ex.protocol,
          repsOrDuration: '30s static hold (1-2 sets)',
          coachingCues: ex.cues,
        })
      }
    }

    // Activate items
    for (const ex of mapping.activateExercises) {
      if (!activateMap.has(ex.name)) {
        activateMap.set(ex.name, {
          name: ex.name,
          phaseType: 'activate',
          targetMuscle: ex.target,
          protocol: ex.protocol,
          tempo: ex.tempo,
          sets: ex.sets,
          repsOrDuration: `${ex.reps} reps`,
          coachingCues: ex.cues,
        })
      }
    }

    // Integrate items
    for (const ex of mapping.integrateExercises) {
      if (!integrateMap.has(ex.name)) {
        integrateMap.set(ex.name, {
          name: ex.name,
          phaseType: 'integrate',
          targetMuscle: ex.target,
          protocol: ex.protocol,
          tempo: ex.tempo,
          sets: ex.sets,
          repsOrDuration: `${ex.reps} reps`,
          coachingCues: ex.cues,
        })
      }
    }
  }

  const inhibit = Array.from(inhibitMap.values()).slice(0, 4)
  const lengthen = Array.from(lengthenMap.values()).slice(0, 4)
  const activate = Array.from(activateMap.values()).slice(0, 4)
  const integrate = Array.from(integrateMap.values()).slice(0, 3)

  const summary = findings.length === 0
    ? 'No significant kinetic chain compensations detected. Standard OPT warm-up recommended.'
    : `Detected ${findings.length} movement compensation${findings.length === 1 ? '' : 's'}. NASM 4-Phase CEx protocol generated: Inhibit hyperactive tissues, Lengthen shortened structures, Activate inhibited prime movers, and Integrate balanced multi-joint movement.`

  return {
    overactiveMuscles: Array.from(overactiveSet),
    underactiveMuscles: Array.from(underactiveSet),
    plan: {
      inhibit,
      lengthen,
      activate,
      integrate,
      summary,
    },
  }
}

// ── NASM 2-FOR-2 PROGRESSION RULE CALCULATOR ──────────────────────
export interface ProgressionRecommendation {
  eligibleForProgression: boolean
  recommendedWeightIncreaseKg: number
  recommendedWeightIncreaseLb: number
  recommendedPercentageIncrease: number
  bodyPartCategory: 'upper_body' | 'lower_body'
  reasoning: string
}

/**
 * Evaluates the official NASM 2-for-2 Progression Rule:
 * "If an athlete can perform two or more reps over their assigned repetition goal in the last set in two consecutive workouts for a given exercise, weight should be added to that exercise for the next training session."
 * Typical increase:
 * - Upper body: 2.5% to 5% (or 2.5 - 5 lbs / 1 - 2.5 kg)
 * - Lower body: 5% to 10% (or 5 - 10 lbs / 2.5 - 5 kg)
 */
export function evaluateNasm2For2Rule({
  currentWorkingWeightKg,
  targetReps,
  actualRepsLastSetSession1,
  actualRepsLastSetSession2,
  exerciseName,
}: {
  currentWorkingWeightKg: number
  targetReps: number
  actualRepsLastSetSession1: number
  actualRepsLastSetSession2: number
  exerciseName: string
}): ProgressionRecommendation {
  const isOverBy2Session1 = actualRepsLastSetSession1 >= targetReps + 2
  const isOverBy2Session2 = actualRepsLastSetSession2 >= targetReps + 2
  const isEligible = isOverBy2Session1 && isOverBy2Session2

  const lowerBodyRegex = /squat|deadlift|leg press|lunge|split squat|rdl|hip thrust|calf|quad|hamstring/i
  const isLowerBody = lowerBodyRegex.test(exerciseName)
  const bodyPartCategory = isLowerBody ? 'lower_body' : 'upper_body'

  if (!isEligible) {
    return {
      eligibleForProgression: false,
      recommendedWeightIncreaseKg: 0,
      recommendedWeightIncreaseLb: 0,
      recommendedPercentageIncrease: 0,
      bodyPartCategory,
      reasoning: isOverBy2Session1 || isOverBy2Session2
        ? `Target reps exceeded in 1 session (+2 reps), but NASM 2-for-2 rule requires 2 consecutive workouts before load increase.`
        : `Reps on track. Maintain current working load until 2+ extra reps achieved on final sets of 2 consecutive sessions.`,
    }
  }

  const pct = isLowerBody ? 7.5 : 3.5
  const increaseKg = Math.max(isLowerBody ? 2.5 : 1.25, Math.round((currentWorkingWeightKg * (pct / 100)) * 2) / 2)
  const increaseLb = Math.round(increaseKg * 2.20462 * 2) / 2

  return {
    eligibleForProgression: true,
    recommendedWeightIncreaseKg: increaseKg,
    recommendedWeightIncreaseLb: increaseLb,
    recommendedPercentageIncrease: pct,
    bodyPartCategory,
    reasoning: `NASM 2-for-2 criteria met! Client achieved +2 reps on final sets across 2 consecutive workouts. Recommended progressive overload: +${pct}% (+${increaseKg}kg / +${increaseLb}lb).`,
  }
}

// ── ESTIMATED 1-REP MAX (1RM) CALCULATORS ────────────────────────
export function calculateEstimated1Rm(weightKg: number, reps: number): {
  brzycki1RmKg: number
  epley1RmKg: number
  average1RmKg: number
  percentages: Record<number, number>
} {
  if (reps <= 1) {
    const percentages = calculatePercentageLoads(weightKg)
    return { brzycki1RmKg: weightKg, epley1RmKg: weightKg, average1RmKg: weightKg, percentages }
  }

  // Brzycki formula: Weight / (1.0278 - 0.0278 * Reps)
  const brzycki = weightKg / (1.0278 - 0.0278 * Math.min(reps, 15))
  // Epley formula: Weight * (1 + 0.0333 * Reps)
  const epley = weightKg * (1 + 0.0333 * reps)

  const avg = Math.round(((brzycki + epley) / 2) * 10) / 10
  const percentages = calculatePercentageLoads(avg)

  return {
    brzycki1RmKg: Math.round(brzycki * 10) / 10,
    epley1RmKg: Math.round(epley * 10) / 10,
    average1RmKg: avg,
    percentages,
  }
}

function calculatePercentageLoads(oneRmKg: number): Record<number, number> {
  const targetPcts = [95, 90, 85, 80, 75, 70, 65, 60, 50]
  const result: Record<number, number> = {}
  for (const pct of targetPcts) {
    result[pct] = Math.round((oneRmKg * (pct / 100)) * 2) / 2
  }
  return result
}

// ── CARDIORESPIRATORY & AEROBIC ZONE CALCULATORS ────────────────
export interface CardioTrainingZones {
  hrMaxBpm: number
  restingHrBpm: number
  hrReserveBpm: number
  zone1: { name: string; minBpm: number; maxBpm: number; description: string; nasmOptPhase: string }
  zone2: { name: string; minBpm: number; maxBpm: number; description: string; nasmOptPhase: string }
  zone3: { name: string; minBpm: number; maxBpm: number; description: string; nasmOptPhase: string }
}

export function calculateNasmCardioZones(age: number, restingHr: number = 70): CardioTrainingZones {
  // Tanaka formula: 208 - (0.7 * age)
  const hrMax = Math.round(208 - (0.7 * age))
  const hrr = hrMax - restingHr

  // Karvonen / HR Reserve & %HR Max hybrid for NASM 3-Zone Cardiorespiratory Training
  const z1Min = Math.round(hrMax * 0.65)
  const z1Max = Math.round(hrMax * 0.75)
  const z2Min = Math.round(hrMax * 0.76)
  const z2Max = Math.round(hrMax * 0.85)
  const z3Min = Math.round(hrMax * 0.86)
  const z3Max = Math.round(hrMax * 0.95)

  return {
    hrMaxBpm: hrMax,
    restingHrBpm: restingHr,
    hrReserveBpm: hrr,
    zone1: {
      name: 'Zone 1 (Aerobic Recovery / Base)',
      minBpm: z1Min,
      maxBpm: z1Max,
      description: 'Below VT1 (Talk Test: easy conversation). Builds aerobic base, recovery, and fat utilization.',
      nasmOptPhase: 'Phase 1: Stabilization Endurance',
    },
    zone2: {
      name: 'Zone 2 (Aerobic Endurance / Threshold)',
      minBpm: z2Min,
      maxBpm: z2Max,
      description: 'Between VT1 and VT2 (Talk Test: broken sentences). Increases lactate threshold and work capacity.',
      nasmOptPhase: 'Phase 2 & 3: Strength Endurance / Muscular Development',
    },
    zone3: {
      name: 'Zone 3 (High-Intensity Interval / Peak)',
      minBpm: z3Min,
      maxBpm: z3Max,
      description: 'Above VT2 (Talk Test: 1-2 words only). Develops maximal aerobic power and anaerobic capacity.',
      nasmOptPhase: 'Phase 4 & 5: Maximal Strength / Power',
    },
  }
}

/**
 * YMCA 3-Minute Step Test Rating:
 * 12-inch step bench, 96 bpm metronome (24 steps/min) for 3 minutes, count 1-min recovery pulse immediately after.
 */
export function rateYmcaStepTest(recoveryPulse1Min: number, age: number, sex: 'male' | 'female' | 'other'): CardioVitalsAssessment['cardioFitnessRating'] {
  const isFemale = sex === 'female'

  if (age < 35) {
    if (isFemale) {
      if (recoveryPulse1Min <= 88) return 'excellent'
      if (recoveryPulse1Min <= 98) return 'very_good'
      if (recoveryPulse1Min <= 108) return 'good'
      if (recoveryPulse1Min <= 118) return 'average'
      if (recoveryPulse1Min <= 128) return 'fair'
      return 'poor'
    } else {
      if (recoveryPulse1Min <= 84) return 'excellent'
      if (recoveryPulse1Min <= 92) return 'very_good'
      if (recoveryPulse1Min <= 100) return 'good'
      if (recoveryPulse1Min <= 110) return 'average'
      if (recoveryPulse1Min <= 120) return 'fair'
      return 'poor'
    }
  } else if (age < 50) {
    if (isFemale) {
      if (recoveryPulse1Min <= 92) return 'excellent'
      if (recoveryPulse1Min <= 102) return 'very_good'
      if (recoveryPulse1Min <= 112) return 'good'
      if (recoveryPulse1Min <= 122) return 'average'
      if (recoveryPulse1Min <= 132) return 'fair'
      return 'poor'
    } else {
      if (recoveryPulse1Min <= 88) return 'excellent'
      if (recoveryPulse1Min <= 96) return 'very_good'
      if (recoveryPulse1Min <= 106) return 'good'
      if (recoveryPulse1Min <= 116) return 'average'
      if (recoveryPulse1Min <= 126) return 'fair'
      return 'poor'
    }
  } else {
    if (isFemale) {
      if (recoveryPulse1Min <= 96) return 'excellent'
      if (recoveryPulse1Min <= 106) return 'very_good'
      if (recoveryPulse1Min <= 116) return 'good'
      if (recoveryPulse1Min <= 126) return 'average'
      return 'poor'
    } else {
      if (recoveryPulse1Min <= 92) return 'excellent'
      if (recoveryPulse1Min <= 100) return 'very_good'
      if (recoveryPulse1Min <= 110) return 'good'
      if (recoveryPulse1Min <= 120) return 'average'
      return 'poor'
    }
  }
}

// ── 8. RE-ASSESSMENT COMPARISON ENGINE ───────────────────────────
export interface AssessmentComparisonResult {
  baselineDate: string
  followUpDate: string
  baselineCompensationsCount: number
  followUpCompensationsCount: number
  resolvedCompensations: Array<{
    compensation: string
    title: string
    checkpoint: KineticChainCheckpoint
  }>
  newCompensations: Array<{
    compensation: string
    title: string
    checkpoint: KineticChainCheckpoint
  }>
  persistentCompensations: Array<{
    compensation: string
    title: string
    checkpoint: KineticChainCheckpoint
  }>
  overactiveDiff: {
    resolved: string[]
    new: string[]
    ongoing: string[]
  }
  cardioDelta: {
    restingHrDelta: number | null
    recoveryPulseDelta: number | null
    baselineRating?: string
    followUpRating?: string
  }
  overallMovementScoreDelta: number // percentage improvement e.g. +35%
  summary: string
}

export function compareNasmAssessments(
  baseline: NasmAssessmentRecord,
  followUp: NasmAssessmentRecord
): AssessmentComparisonResult {
  const baselineSet = new Set((baseline.ohsa_findings ?? []).map(f => f.compensation))
  const followUpSet = new Set((followUp.ohsa_findings ?? []).map(f => f.compensation))

  const resolvedCompensations: AssessmentComparisonResult['resolvedCompensations'] = []
  const newCompensations: AssessmentComparisonResult['newCompensations'] = []
  const persistentCompensations: AssessmentComparisonResult['persistentCompensations'] = []

  for (const comp of baselineSet) {
    const mapping = NASM_OHSA_MAPPINGS[comp as OhsaCompensation]
    if (!followUpSet.has(comp)) {
      resolvedCompensations.push({
        compensation: comp,
        title: mapping?.label ?? comp,
        checkpoint: mapping?.checkpoint ?? 'lphc',
      })
    } else {
      persistentCompensations.push({
        compensation: comp,
        title: mapping?.label ?? comp,
        checkpoint: mapping?.checkpoint ?? 'lphc',
      })
    }
  }

  for (const comp of followUpSet) {
    if (!baselineSet.has(comp)) {
      const mapping = NASM_OHSA_MAPPINGS[comp as OhsaCompensation]
      newCompensations.push({
        compensation: comp,
        title: mapping?.label ?? comp,
        checkpoint: mapping?.checkpoint ?? 'lphc',
      })
    }
  }

  // Overactive muscle diff
  const baseOver = new Set(baseline.overactive_muscles ?? [])
  const followOver = new Set(followUp.overactive_muscles ?? [])

  const resolvedOver = Array.from(baseOver).filter(m => !followOver.has(m))
  const newOver = Array.from(followOver).filter(m => !baseOver.has(m))
  const ongoingOver = Array.from(baseOver).filter(m => followOver.has(m))

  // Cardio Delta
  const baseRhr = baseline.cardio_vitals?.restingHeartRateBpm
  const followRhr = followUp.cardio_vitals?.restingHeartRateBpm
  const restingHrDelta = baseRhr && followRhr ? followRhr - baseRhr : null

  const baseYmca = baseline.cardio_vitals?.stepTestRecoveryHrBpm
  const followYmca = followUp.cardio_vitals?.stepTestRecoveryHrBpm
  const recoveryPulseDelta = baseYmca && followYmca ? followYmca - baseYmca : null

  const baseCount = baselineSet.size
  const followCount = followUpSet.size
  const overallMovementScoreDelta = baseCount > 0
    ? Math.round(((baseCount - followCount) / baseCount) * 100)
    : followCount === 0 ? 100 : -100

  let summary = ''
  if (resolvedCompensations.length > 0) {
    summary += `Successfully resolved ${resolvedCompensations.length} movement compensation${resolvedCompensations.length > 1 ? 's' : ''} (${resolvedCompensations.map(r => r.title).join(', ')}). `
  }
  if (newCompensations.length > 0) {
    summary += `Emerging compensation${newCompensations.length > 1 ? 's' : ''} identified: ${newCompensations.map(n => n.title).join(', ')}. `
  }
  if (recoveryPulseDelta !== null && recoveryPulseDelta < 0) {
    summary += `YMCA step test recovery improved by ${Math.abs(recoveryPulseDelta)} bpm.`
  }

  return {
    baselineDate: baseline.assessment_date,
    followUpDate: followUp.assessment_date,
    baselineCompensationsCount: baseCount,
    followUpCompensationsCount: followCount,
    resolvedCompensations,
    newCompensations,
    persistentCompensations,
    overactiveDiff: {
      resolved: resolvedOver,
      new: newOver,
      ongoing: ongoingOver,
    },
    cardioDelta: {
      restingHrDelta,
      recoveryPulseDelta,
      baselineRating: baseline.cardio_vitals?.cardioFitnessRating ?? undefined,
      followUpRating: followUp.cardio_vitals?.cardioFitnessRating ?? undefined,
    },
    overallMovementScoreDelta,
    summary: summary || 'Postural baseline steady with consistent kinetic chain tracking.',
  }
}

// ── 9. NASM OPT™ SUPERSET PAIRINGS DICTIONARY ─────────────────────
export interface NasmSupersetPair {
  id: string
  primeMover: string
  primeMoverTarget: string
  phase2StabilizerMatch: {
    name: string
    tempo: string
    sets: string
    reps: string
    cues: string[]
  }
  phase5PowerMatch: {
    name: string
    tempo: string
    sets: string
    reps: string
    cues: string[]
  }
}

export const NASM_SUPERSET_PAIRS: NasmSupersetPair[] = [
  {
    id: 'chest-bench-press',
    primeMover: 'Barbell Bench Press',
    primeMoverTarget: 'Pectoralis Major / Anterior Deltoid / Triceps',
    phase2StabilizerMatch: {
      name: 'Stability Ball Push-Up',
      tempo: '4/2/1',
      sets: '3',
      reps: '8-12',
      cues: ['Keep core locked and glutes tight; balance hands on dome of ball with elbows 45°.'],
    },
    phase5PowerMatch: {
      name: 'Medicine Ball Chest Pass',
      tempo: 'Explosive',
      sets: '3',
      reps: '8-10',
      cues: ['Explode from chest against a sturdy wall or partner with maximal acceleration.'],
    },
  },
  {
    id: 'quad-back-squat',
    primeMover: 'Barbell Back Squat',
    primeMoverTarget: 'Quadriceps / Gluteus Maximus / Hamstrings',
    phase2StabilizerMatch: {
      name: 'Single-Leg Squat to Box',
      tempo: '4/2/1',
      sets: '3',
      reps: '8-12 each',
      cues: ['Knee stays tracking over 2nd toe; maintain level pelvis without pelvic drop.'],
    },
    phase5PowerMatch: {
      name: 'Squat Jump / Tuck Jump',
      tempo: 'Explosive',
      sets: '3',
      reps: '8-10',
      cues: ['Land softly in athletic hinge (toe-ball-heel) holding landing position 2 seconds.'],
    },
  },
  {
    id: 'back-cable-row',
    primeMover: 'Seated Cable Row / Barbell Bent-Over Row',
    primeMoverTarget: 'Latissimus Dorsi / Rhomboids / Middle Trapezius',
    phase2StabilizerMatch: {
      name: 'Single-Leg Cable Row with Contralateral Stance',
      tempo: '4/2/1',
      sets: '3',
      reps: '8-12 each',
      cues: ['Balance on single leg, square hips and shoulders to anchor point before pulling.'],
    },
    phase5PowerMatch: {
      name: 'Medicine Ball Soccer Throw',
      tempo: 'Explosive',
      sets: '3',
      reps: '8-10',
      cues: ['Full triple extension overhead throwing ball explosively down into turf.'],
    },
  },
  {
    id: 'shoulder-overhead-press',
    primeMover: 'Standing Barbell Overhead Shoulder Press',
    primeMoverTarget: 'Deltoids / Upper Trapezius / Triceps',
    phase2StabilizerMatch: {
      name: 'Single-Leg Dumbbell Overhead Press',
      tempo: '4/2/1',
      sets: '3',
      reps: '8-12 each',
      cues: ['Stand on one foot, brace anterior core, press overhead without rib flair or low back arch.'],
    },
    phase5PowerMatch: {
      name: 'Dumbbell Push Press / Speed Thruster',
      tempo: 'Explosive',
      sets: '3',
      reps: '8-10',
      cues: ['Quick dip at hips/knees and drive straight through ceiling using leg power.'],
    },
  },
  {
    id: 'posterior-romanian-deadlift',
    primeMover: 'Romanian Deadlift (RDL)',
    primeMoverTarget: 'Hamstrings / Gluteus Maximus / Erector Spinae',
    phase2StabilizerMatch: {
      name: 'Single-Leg Romanian Deadlift (SL-RDL) with Dumbbell',
      tempo: '4/2/1',
      sets: '3',
      reps: '8-12 each',
      cues: ['Hinge from standing hip, keeping rear leg straight and pelvis parallel to floor.'],
    },
    phase5PowerMatch: {
      name: 'Explosive Power Step-Up / Kettlebell Swing',
      tempo: 'Explosive',
      sets: '3',
      reps: '8-10',
      cues: ['Drive through lead heel explosively into full hip extension.'],
    },
  },
  {
    id: 'back-lat-pulldown',
    primeMover: 'Lat Pulldown / Pull-Up',
    primeMoverTarget: 'Latissimus Dorsi / Teres Major / Biceps',
    phase2StabilizerMatch: {
      name: 'Stability Ball Pullover with Dumbbell',
      tempo: '4/2/1',
      sets: '3',
      reps: '8-12',
      cues: ['Bridge on ball with head supported; lower dumbbell overhead while keeping hips high.'],
    },
    phase5PowerMatch: {
      name: 'Medicine Ball Overhead Slam',
      tempo: 'Explosive',
      sets: '3',
      reps: '8-10',
      cues: ['Engage lats and core to slam medicine ball straight down between feet.'],
    },
  },
]

// ── 10. AI COACH GORDON VOICE SYNTHESIZER ────────────────────────
export function speakNasmCue(text: string, options?: { rate?: number; pitch?: number; forceWebSpeech?: boolean }) {
  speakCoachVoiceCue(text, options)
}

// ── 11. KINETIC CHAIN MOBILITY RADAR ENGINE ─────────────────────────
export interface KineticRadarScores {
  ankleMobility: number // 0 - 100
  lphcControl: number // 0 - 100
  thoracicExtension: number // 0 - 100
  coreStability: number // 0 - 100
  cardioRecovery: number // 0 - 100
  overallMobilityIndex: number // 0 - 100
  diagnostics: {
    axis: string
    score: number
    status: 'Optimal' | 'Functional' | 'Impaired'
    impairedMuscles: string[]
    recommendedDrill: string
  }[]
}

export function calculateKineticRadarScores(assessment?: Partial<NasmAssessmentRecord> | null): KineticRadarScores {
  let ankleScore = 95
  let lphcScore = 95
  let thoracicScore = 95
  let coreScore = 95
  let cardioScore = 85

  const ohsa = assessment?.ohsa_findings ?? []

  // 1. Ankle & Foot Mobility (Dorsiflexion)
  if (ohsa.some(f => f.compensation === 'feet_turn_out' || f.compensation === 'feet_flatten')) {
    ankleScore -= 30
  }
  if (ohsa.some(f => f.compensation === 'heels_rise')) {
    ankleScore -= 35
  }

  // 2. LPHC Control (Pelvic neutral & Knee alignment)
  if (ohsa.some(f => f.compensation === 'knees_move_inward')) {
    lphcScore -= 30
  }
  if (ohsa.some(f => f.compensation === 'low_back_arches' || f.compensation === 'low_back_rounds')) {
    lphcScore -= 25
  }

  // 3. Thoracic & Shoulder Complex Extension
  if (ohsa.some(f => f.compensation === 'arms_fall_forward')) {
    thoracicScore -= 40
  }
  if (ohsa.some(f => f.compensation === 'shoulders_elevate' || f.compensation === 'forward_head')) {
    thoracicScore -= 25
  }

  // 4. Core Neuromuscular Stabilization
  if (ohsa.some(f => f.compensation === 'excessive_forward_lean')) {
    coreScore -= 30
  }
  if (ohsa.some(f => f.compensation === 'asymmetrical_weight_shift')) {
    coreScore -= 35
  }

  // 5. Cardio / Recovery Pulse Rating
  const recoveryPulse = assessment?.cardio_vitals?.stepTestRecoveryHrBpm
  if (recoveryPulse) {
    if (recoveryPulse <= 85) cardioScore = 100
    else if (recoveryPulse <= 100) cardioScore = 90
    else if (recoveryPulse <= 115) cardioScore = 75
    else if (recoveryPulse <= 130) cardioScore = 60
    else cardioScore = 45
  }

  // Clamp 20 - 100
  ankleScore = Math.max(20, Math.min(100, ankleScore))
  lphcScore = Math.max(20, Math.min(100, lphcScore))
  thoracicScore = Math.max(20, Math.min(100, thoracicScore))
  coreScore = Math.max(20, Math.min(100, coreScore))
  cardioScore = Math.max(20, Math.min(100, cardioScore))

  const overallMobilityIndex = Math.round((ankleScore + lphcScore + thoracicScore + coreScore + cardioScore) / 5)

  const getStatus = (score: number): 'Optimal' | 'Functional' | 'Impaired' => {
    if (score >= 85) return 'Optimal'
    if (score >= 65) return 'Functional'
    return 'Impaired'
  }

  return {
    ankleMobility: ankleScore,
    lphcControl: lphcScore,
    thoracicExtension: thoracicScore,
    coreStability: coreScore,
    cardioRecovery: cardioScore,
    overallMobilityIndex,
    diagnostics: [
      {
        axis: 'Foot & Ankle Mobility',
        score: ankleScore,
        status: getStatus(ankleScore),
        impairedMuscles: ankleScore < 80 ? ['Gastrocnemius', 'Soleus', 'Peroneals'] : ['Normal Dorsiflexion'],
        recommendedDrill: ankleScore < 80 ? 'SMR Foam Roll Calves + Half-Kneeling Ankle Mobilization' : 'Maintain baseline calf flexibility',
      },
      {
        axis: 'LPHC & Pelvic Control',
        score: lphcScore,
        status: getStatus(lphcScore),
        impairedMuscles: lphcScore < 80 ? ['TFL', 'Adductors', 'Psoas'] : ['Optimal Pelvic Alignment'],
        recommendedDrill: lphcScore < 80 ? 'Banded Clamshells + Quadruped Hip Extensions' : 'Glute bridge activation',
      },
      {
        axis: 'Thoracic & Shoulder Extension',
        score: thoracicScore,
        status: getStatus(thoracicScore),
        impairedMuscles: thoracicScore < 80 ? ['Latissimus Dorsi', 'Pectoralis Major', 'Teres Major'] : ['Normal Scapular Rhythm'],
        recommendedDrill: thoracicScore < 80 ? 'Foam Roll T-Spine + Ball Combo I/Y/T Extensions' : 'Band pull-aparts',
      },
      {
        axis: 'Core Neuromuscular Stabilization',
        score: coreScore,
        status: getStatus(coreScore),
        impairedMuscles: coreScore < 80 ? ['Transverse Abdominis', 'Internal Obliques', 'Multifidus'] : ['Stable Lumbar Cylinder'],
        recommendedDrill: coreScore < 80 ? 'Deadbugs + Quadruped Bird-Dogs (4/2/1 tempo)' : 'Plank & hollow hold progression',
      },
      {
        axis: 'Cardiorespiratory Recovery',
        score: cardioScore,
        status: getStatus(cardioScore),
        impairedMuscles: ['Cardiovascular System'],
        recommendedDrill: cardioScore < 80 ? 'Stage II Aerobic Interval Training (Zone 1/2 Intervals)' : 'Sustained Zone 2 aerobic base',
      },
    ],
  }
}
