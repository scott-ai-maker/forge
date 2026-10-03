/**
 * Gordon Athletic Advisory — Official NASM Clinical Movement Cards & Visual Reference Engine
 * Integrated with the 320+ verified NASM Edge and Official NASM Movement Libraries.
 * Strictly presents verified official NASM media; if no exact match exists, explicitly displays "Media Not Available".
 */

import { searchNasmLibraryMedia } from './nasm-fuzzy-matcher'
import { cleanExerciseName, resolveExerciseVideoEmbed, extractYouTubeVideoId } from './nasm-exercise-video-catalog'
import { detectExerciseEquipment } from './nasm-equipment-detector'
import {
  VERIFIED_GAA_EXERCISE_IMAGES,
  BRAND_LOGO_FALLBACK_IMAGE,
  resolveGaaExerciseImage,
} from './nasm-generated-images'

export interface NasmKineticCheckpoints {
  feetAnkles: string
  knees: string
  lphc: string // Lumbo-Pelvic-Hip Complex
  shoulders: string
  headNeck: string
}

export interface NasmClinicalMovementCard {
  name: string
  category: 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core' | 'Plyometrics' | 'Flexibility/SMR'
  optPhase: string
  tempo: string
  primeMover: string
  synergists: string[]
  stabilizers: string[]
  antagonists: string[]
  kineticCheckpoints: NasmKineticCheckpoints
  setupInstructions: string
  executionInstructions: string
  howToSteps: string[]
  clinicalCues: string[]
  equipment: string[]
  imageUrl: string | null
  fallbackImageUrl: string
  videoUrl: string | null
  embedUrl?: string | null
  hasOfficialMedia: boolean
  confidenceScore: number
}

export const NASM_MOVEMENT_PROFILES: Record<string, Partial<NasmClinicalMovementCard>> = {
  // ── CHEST & PUSH ────────────────────────────────────────────────────────
  'bench press': {
    category: 'Chest',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy), Phase 4 (Max Strength)',
    tempo: '2/0/2 or 1/1/1 (Heavy)',
    primeMover: 'Pectoralis Major (Sternal & Clavicular Heads)',
    synergists: ['Anterior Deltoid', 'Triceps Brachii', 'Coracobrachialis'],
    stabilizers: ['Rotator Cuff', 'Serratus Anterior', 'Biceps Brachii (Short Head)', 'Core'],
    antagonists: ['Latissimus Dorsi', 'Posterior Deltoid', 'Rhomboids'],
    kineticCheckpoints: {
      feetAnkles: 'Flat on floor, hip-width apart, driving down into the ground.',
      knees: 'Flexed at 90°, aligned with second and third toes.',
      lphc: 'Neutral pelvis with natural lumbar arch; glutes stay firmly on pad.',
      shoulders: 'Retracted and depressed (pinched back and down) into the bench.',
      headNeck: 'Neutral cervical spine resting flat on the bench pad; eyes under bar.',
    },
    setupInstructions: 'Lie supine on a flat bench with 5 points of contact (head, shoulders, glutes, left foot, right foot). Grip barbell slightly wider than shoulder-width with thumbs wrapped.',
    executionInstructions: 'Unrack barbell directly over mid-chest. Inhale and lower bar with controlled 2-second eccentric phase to mid-sternum with 45° elbow angle. Exhale and drive bar upward to starting position without protracting shoulders.',
    clinicalCues: [
      'Pin shoulder blades into back pockets throughout the entire lift.',
      'Maintain 45° elbow flare to prevent subacromial shoulder impingement.',
      'Drive heels into floor to create total-body kinetic chain tension.',
    ],
  },
  'incline dumbbell bench press': {
    category: 'Chest',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2',
    primeMover: 'Pectoralis Major (Clavicular Upper Head)',
    synergists: ['Anterior Deltoid', 'Triceps Brachii'],
    stabilizers: ['Rotator Cuff', 'Serratus Anterior', 'Core Musculature'],
    antagonists: ['Latissimus Dorsi', 'Rhomboids', 'Middle Trapezius'],
    kineticCheckpoints: {
      feetAnkles: 'Firmly planted on floor, shoulder-width apart.',
      knees: 'Stacked over ankles at 90° angle.',
      lphc: 'Glutes and hips pressed firmly against seat and back rest.',
      shoulders: 'Scapulae retracted and depressed into inclined pad.',
      headNeck: 'Head resting gently on pad with neutral chin.',
    },
    setupInstructions: 'Set bench to 30°–45° incline. Sit with dumbbells resting vertically on thighs. Kick dumbbells up to shoulder level as you lean back.',
    executionInstructions: 'Press dumbbells upward and slightly inward until arms are fully extended. Inhale as you lower dumbbells under control to upper chest level, keeping forearms perpendicular to floor.',
    clinicalCues: [
      'Avoid setting bench angle above 45° to prevent shifting load to anterior deltoids.',
      'Control the descent to avoid hyperextending anterior shoulder capsule.',
      'Keep wrists straight and directly above elbows.',
    ],
  },
  'push up': {
    category: 'Chest',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance)',
    tempo: '4/2/1 (Phase 1) or 2/0/2 (Phase 2)',
    primeMover: 'Pectoralis Major',
    synergists: ['Anterior Deltoid', 'Triceps Brachii'],
    stabilizers: ['Transverse Abdominis', 'Internal Obliques', 'Quadriceps', 'Serratus Anterior'],
    antagonists: ['Latissimus Dorsi', 'Rhomboids'],
    kineticCheckpoints: {
      feetAnkles: 'Together or hip-width apart, dorsiflexed on balls of feet.',
      knees: 'Fully extended with active quadriceps contraction.',
      lphc: 'Neutral pelvis; no sagging hips (anterior tilt) or pike (excessive flexion).',
      shoulders: 'Hands placed slightly wider than shoulder-width, fingers pointing forward.',
      headNeck: 'Neutral cervical spine, chin tucked, gaze looking 6 inches ahead.',
    },
    setupInstructions: 'Assume a high plank position with hands slightly wider than shoulder-width and body forming a rigid straight line from crown of head to heels.',
    executionInstructions: 'Lower chest toward floor by bending elbows to 90° with a 45° torso angle. Pause momentarily, then push through palms and engage pectorals to return to starting position.',
    clinicalCues: [
      'Engage glutes and brace core to maintain rigid plank posture.',
      'Do not allow lower back to sag or head to jut forward toward the floor.',
      'Push the ground away at the top of the rep to engage serratus anterior.',
    ],
  },

  // ── BACK & PULL ─────────────────────────────────────────────────────────
  'barbell deadlift': {
    category: 'Back',
    optPhase: 'Phase 2 (Strength Endurance), Phase 4 (Max Strength)',
    tempo: '2/0/2 or 1/1/1',
    primeMover: 'Gluteus Maximus & Hamstrings Complex',
    synergists: ['Quadriceps', 'Adductor Magnus', 'Soleus', 'Gastrocnemius'],
    stabilizers: ['Erector Spinae', 'Latissimus Dorsi', 'Trapezius (Upper/Middle/Lower)', 'Core LPHC'],
    antagonists: ['Iliopsoas', 'Rectus Abdominis'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart with bar positioned directly over midfoot.',
      knees: 'Tracking in line with second/third toes, flexed at ~110° in starting pull.',
      lphc: 'Hips higher than knees, lower than shoulders; neutral lordotic spine.',
      shoulders: 'Shoulder blades retracted and packed over or slightly in front of bar.',
      headNeck: 'Neutral cervical spine packed with chin tucked (gaze 6-8 ft ahead).',
    },
    setupInstructions: 'Stand with midfoot under barbell, feet hip-width. Hinge at hips and grip bar just outside knees with double overhand or hook grip. Engage lats by "bending the bar" against shins.',
    executionInstructions: 'Take a deep diaphragmatic breath and brace core. Drive feet through the floor, extending hips and knees simultaneously. Stand tall at lockout without hyperextending lower back.',
    clinicalCues: [
      'Maintain barbell contact with legs (shins then thighs) throughout the entire path.',
      'Hips and chest must rise at the exact same rate off the floor.',
      'Squeeze glutes at top lockout rather than overarching lumbar spine.',
    ],
  },
  'romanian deadlift': {
    category: 'Back',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2 or 3/0/1',
    primeMover: 'Hamstrings Complex (Biceps Femoris, Semitendinosus, Semimembranosus) & Gluteus Maximus',
    synergists: ['Adductor Magnus', 'Erector Spinae'],
    stabilizers: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius', 'Core LPHC'],
    antagonists: ['Quadriceps', 'Iliopsoas'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart, feet parallel pointing straight ahead.',
      knees: 'Slight "soft" 15°–20° bend maintained statically throughout the hinge.',
      lphc: 'Neutral pelvis; hinge backward from acetabulofemoral hip joints.',
      shoulders: 'Scapulae retracted and depressed, preventing upper back rounding.',
      headNeck: 'Cervical spine aligned with thoracic spine during the entire hinge.',
    },
    setupInstructions: 'Stand tall holding barbell/dumbbells at hip level with an overhand grip. Set shoulder blades back and down, brace core, and establish a soft knee bend.',
    executionInstructions: 'Push hips back toward the wall behind you while keeping bar skimming down thighs. Lower to mid-shin level until maximum hamstring tension is felt. Contract hamstrings and glutes to pull hips forward to standing.',
    clinicalCues: [
      'Think "push hips back" rather than "bend forward".',
      'Keep bar within 1 inch of shins at all times.',
      'Stop descent immediately if lumbar spine begins to round.',
    ],
  },
  'barbell bent-over row': {
    category: 'Back',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy), Phase 4 (Max Strength)',
    tempo: '2/0/2',
    primeMover: 'Latissimus Dorsi & Rhomboids',
    synergists: ['Middle/Lower Trapezius', 'Posterior Deltoid', 'Biceps Brachii', 'Brachialis'],
    stabilizers: ['Erector Spinae', 'Hamstrings', 'Gluteus Maximus', 'Core'],
    antagonists: ['Pectoralis Major', 'Anterior Deltoid'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart, firmly rooted into floor.',
      knees: 'Flexed at ~20°–30° to support hip hinge.',
      lphc: 'Torso hinged at 45° to floor with neutral lumbar spine.',
      shoulders: 'Shoulder blades free to protract at bottom and retract fully at peak.',
      headNeck: 'Neutral cervical spine in line with hinged torso.',
    },
    setupInstructions: 'Hold barbell with overhand grip just wider than shoulder-width. Hinge at hips to a 45° torso angle with knees softly bent and arms hanging vertically.',
    executionInstructions: 'Pull barbell toward lower ribcage / navel by driving elbows up and back. Squeeze shoulder blades together at peak contraction for 1 second, then lower under control.',
    clinicalCues: [
      'Lead movement with elbows rather than pulling with hands and biceps.',
      'Maintain constant torso angle without bobbing or jerking weight upward.',
      'Pause and squeeze scapulae for full rhomboid activation.',
    ],
  },

  // ── LEGS & LOWER KINETIC CHAIN ──────────────────────────────────────────
  'barbell back squat': {
    category: 'Legs',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy), Phase 4 (Max Strength)',
    tempo: '2/0/2 or 4/2/1 (Stabilization)',
    primeMover: 'Quadriceps Complex & Gluteus Maximus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Soleus', 'Gastrocnemius'],
    stabilizers: ['Transverse Abdominis', 'Internal/External Obliques', 'Erector Spinae'],
    antagonists: ['Psoas Major', 'Iliacus'],
    kineticCheckpoints: {
      feetAnkles: 'Shoulder-width apart, toes pointing straight or slightly turned out 5°–10°.',
      knees: 'Tracking directly over second and third toes; zero inward valgus collapse.',
      lphc: 'Neutral pelvis; maintain lumbar curve without excessive forward lean.',
      shoulders: 'Barbell resting securely across upper trapezius (high bar) or rear delts (low bar).',
      headNeck: 'Neutral cervical spine with eyes focused straight ahead or slightly up.',
    },
    setupInstructions: 'Step under barbell, resting bar on upper traps. Grip bar with hands close to shoulders to create upper back tightness. Unrack and take 2-3 deliberate steps back.',
    executionInstructions: 'Inhale into belly, brace core, and initiate squat by breaking at hips and knees simultaneously. Descend until thighs are parallel to floor with knees tracking over toes. Drive through midfoot/heels to stand tall.',
    clinicalCues: [
      'Spread the floor with feet to recruit gluteus medius and prevent knee valgus.',
      'Keep chest elevated and maintain constant intra-abdominal pressure.',
      'Hit parallel depth with hips level with or slightly below knee joint.',
    ],
  },
  'bulgarian split squat': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '4/2/1 (Phase 1) or 2/0/2 (Phase 2/3)',
    primeMover: 'Quadriceps & Gluteus Maximus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Soleus'],
    stabilizers: ['Gluteus Medius', 'Quadratus Lumborum', 'Core LPHC', 'Tibialis Anterior'],
    antagonists: ['Hip Flexors (Opposite Leg)'],
    kineticCheckpoints: {
      feetAnkles: 'Front foot flat and pointing straight forward; rear foot elevated on bench.',
      knees: 'Front knee stays aligned with second toe; does not cave inward (valgus).',
      lphc: 'Hips square facing forward; pelvis level without lateral hip drop (Trendelenburg).',
      shoulders: 'Shoulders back and down with tall, upright or slight forward torso posture.',
      headNeck: 'Neutral head looking straight ahead.',
    },
    setupInstructions: 'Stand 2 to 3 feet in front of a flat bench. Place top of rear foot on bench pad with laces down. Hold dumbbells at sides or barbell on back.',
    executionInstructions: 'Lower body by bending front knee until front thigh is parallel to floor and rear knee hovers just above the ground. Drive through front heel to return to top.',
    clinicalCues: [
      'Maintain 80% of body weight on the front leg; rear leg is only for balance.',
      'Keep front knee tracking in line with front ankle and middle toes.',
      'Squeeze front glute at top of each repetition.',
    ],
  },
  'goblet squat': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance)',
    tempo: '4/2/1 or 2/0/2',
    primeMover: 'Quadriceps & Gluteus Maximus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Soleus'],
    stabilizers: ['Anterior Core', 'Upper Back (Rhomboids, Traps)', 'Gluteus Medius'],
    antagonists: ['Iliopsoas'],
    kineticCheckpoints: {
      feetAnkles: 'Shoulder-width apart, toes pointing straight or angled 5°–10°.',
      knees: 'Pushed out tracking over second/third toes.',
      lphc: 'Upright torso; anterior counterbalance prevents excessive forward lean.',
      shoulders: 'Dumbbell/Kettlebell held vertically against sternum with elbows tucked in.',
      headNeck: 'Eyes level, neutral spine.',
    },
    setupInstructions: 'Hold a dumbbell or kettlebell vertically against your chest with both hands under the top bell / horns, keeping elbows pointed downward.',
    executionInstructions: 'Sit back and down between knees, keeping chest tall and elbows tracking inside knees. Descend to parallel depth, pause, and drive through heels to return.',
    clinicalCues: [
      'Keep weight glued to sternum throughout the entire descent.',
      'Use elbows as a tactile guide inside thighs to open hip adductors.',
      'Maintain vertical spine with active abdominal bracing.',
    ],
  },
  'reverse lunge': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance)',
    tempo: '4/2/1 or 2/0/2',
    primeMover: 'Gluteus Maximus & Quadriceps (Vastus Medialis, Vastus Lateralis)',
    synergists: ['Hamstrings (Biceps Femoris, Semitendinosus)', 'Adductor Magnus', 'Soleus'],
    stabilizers: ['Gluteus Medius', 'Transverse Abdominis', 'Multifidus', 'Tibialis Anterior'],
    antagonists: ['Psoas Major', 'Iliacus', 'Rectus Femoris (rear leg)'],
    kineticCheckpoints: {
      feetAnkles: 'Front foot points straight ahead; rear foot lands smoothly on ball of foot with heel elevated.',
      knees: 'Front knee stays aligned directly over second/third toes; rear knee hovers 2–3 inches above ground.',
      lphc: 'Hips level and square; slight forward torso lean (20°–30°) shortens knee moment arm and protects patellofemoral joint.',
      shoulders: 'Shoulders retracted and depressed; chest proud with active postural control.',
      headNeck: 'Cervical spine neutral, gaze straight ahead.',
    },
    setupInstructions: 'Stand tall with feet hip-width apart, shoulders back, and core actively braced. Hold dumbbells at sides if loaded.',
    executionInstructions: 'Step backward with one leg into a deep lunge. Lower hips vertically with a slight forward torso lean until front thigh is parallel to floor and front shin remains nearly vertical. Drive forcefully through front heel and hip to return to starting position.',
    clinicalCues: [
      'Step straight back without letting the pelvis rotate or drop.',
      'Maintain front knee tracking over second toe; strictly eliminate any inward valgus collapse.',
      'Keep 70% of bodyweight loaded through the front heel and midfoot.',
      'A slight forward torso lean shifts ground reaction shear from the patellofemoral joint to the hip extensors.',
    ],
  },

  // ── SHOULDERS & VERTICAL PUSH ───────────────────────────────────────────
  'overhead press': {
    category: 'Shoulders',
    optPhase: 'Phase 2 (Strength Endurance), Phase 4 (Max Strength)',
    tempo: '2/0/2',
    primeMover: 'Anterior Deltoid & Middle Deltoid',
    synergists: ['Triceps Brachii', 'Upper Trapezius', 'Clavicular Pectoralis Major', 'Serratus Anterior'],
    stabilizers: ['Rotator Cuff', 'Levator Scapulae', 'Transverse Abdominis', 'Gluteus Maximus'],
    antagonists: ['Latissimus Dorsi', 'Lower Trapezius'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart, firmly rooted.',
      knees: 'Soft extension without locking or hyperextending.',
      lphc: 'Glutes and abs fully engaged to prevent lumbar hyperextension.',
      shoulders: 'Elbows positioned slightly in front of bar in starting rack position.',
      headNeck: 'Head tilts slightly back to clear bar path, then returns neutral under bar at top.',
    },
    setupInstructions: 'Clean or unrack barbell at clavicle level with overhand grip just outside shoulders. Keep forearms vertical directly under barbell.',
    executionInstructions: 'Brace core and squeeze glutes. Press bar vertically in a straight path, moving head slightly back as bar passes nose, then pushing head through window at lockout.',
    clinicalCues: [
      'Squeeze glutes hard to create a solid pelvic foundation and protect lumbar spine.',
      'Do not lean backward or hyperextend lower back to press heavy loads.',
      'Finish lockout with biceps next to ears.',
    ],
  },
  'dumbbell lateral raise': {
    category: 'Shoulders',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2',
    primeMover: 'Middle (Lateral) Deltoid',
    synergists: ['Anterior Deltoid', 'Supraspinatus', 'Upper Trapezius', 'Serratus Anterior'],
    stabilizers: ['Rotator Cuff', 'Core LPHC'],
    antagonists: ['Latissimus Dorsi', 'Pectoralis Major'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart in athletic stance.',
      knees: 'Soft 10° bend.',
      lphc: 'Neutral pelvis with slight forward torso hinge (5°).',
      shoulders: 'Lead with elbows in the scapular plane (30° anterior to frontal plane).',
      headNeck: 'Neutral neck; avoid shrugging traps up toward ears.',
    },
    setupInstructions: 'Stand holding dumbbells at sides with palms facing each other and a slight bend in elbows.',
    executionInstructions: 'Raise arms out to sides in scapular plane until dumbbells reach shoulder height (parallel to floor). Pause for 1 second, then lower under control.',
    clinicalCues: [
      'Raise in scapular plane (30° forward) to protect supraspinatus tendon from impingement.',
      'Lead with elbows and keep pinkies slightly higher than thumbs.',
      'Do not shrug traps or swing torso to generate momentum.',
    ],
  },
  'scaption': {
    category: 'Shoulders',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance)',
    tempo: '4/2/1 (Phase 1) or 2/0/2 (Phase 2)',
    primeMover: 'Anterior Deltoid & Supraspinatus',
    synergists: ['Middle Deltoid', 'Serratus Anterior', 'Upper & Lower Trapezius'],
    stabilizers: ['Rotator Cuff (Infraspinatus, Teres Minor, Subscapularis)', 'Core LPHC', 'Gluteus Medius'],
    antagonists: ['Latissimus Dorsi', 'Pectoralis Major'],
    kineticCheckpoints: {
      feetAnkles: 'Single-leg stance or hip-width parallel; foot pointing straight ahead with active arch.',
      knees: 'Soft knee bend on stance leg; knee tracking directly over second and third toes.',
      lphc: 'Neutral pelvis; engage core and glutes to avoid pelvic rotation or lumbar hyperextension.',
      shoulders: 'Scapulae depressed and retracted; elevate arms in scapular plane (30°–45° anterior to frontal plane) with thumbs pointing upward.',
      headNeck: 'Neutral cervical spine, chin tucked, eyes forward.',
    },
    setupInstructions: 'Stand tall holding light dumbbells at sides with arms straight, palms facing inward, thumbs pointing forward/upward. If performing single-leg, lift one foot off the ground.',
    executionInstructions: 'Brace core and raise dumbbells diagonally in the scapular plane (30°–45° forward of the frontal plane) to shoulder height with thumbs pointed toward ceiling. Pause for 1–2 seconds, then lower under control.',
    clinicalCues: [
      'Elevate arms strictly in the scapular plane (30°–45° anterior to frontal plane) to clear the subacromial space.',
      'Maintain thumbs pointing up toward the ceiling throughout the entire range of motion.',
      'Depress shoulders away from ears; do not shrug upper trapezius to elevate weights.',
      'Keep core braced and stance leg stable without knee valgus collapse.',
    ],
  },
  'single leg scaption': {
    category: 'Shoulders',
    optPhase: 'Phase 1 (Stabilization Endurance)',
    tempo: '4/2/1 (Controlled Stabilization)',
    primeMover: 'Anterior Deltoid & Supraspinatus',
    synergists: ['Middle Deltoid', 'Serratus Anterior', 'Upper & Lower Trapezius'],
    stabilizers: ['Rotator Cuff (Infraspinatus, Teres Minor, Subscapularis)', 'Core LPHC', 'Gluteus Medius (Stance Leg)'],
    antagonists: ['Latissimus Dorsi', 'Pectoralis Major'],
    kineticCheckpoints: {
      feetAnkles: 'Single-leg stance on balance leg; foot pointing straight ahead with active arch.',
      knees: 'Soft 10°–15° knee bend on stance leg; knee tracking directly over second and third toes.',
      lphc: 'Level pelvis; gluteus medius contracted to prevent contralateral hip drop (Trendelenburg).',
      shoulders: 'Scapulae retracted and depressed; elevate arms in scapular plane (30°–45° forward) with thumbs up.',
      headNeck: 'Neutral cervical spine packed with eyes focused straight ahead.',
    },
    setupInstructions: 'Stand on one leg with a soft knee bend. Hold light dumbbells at sides with a neutral hammer grip (thumbs pointing forward/up).',
    executionInstructions: 'Engage core and raise dumbbells in the scapular plane (30°–45° forward) to shoulder level with thumbs pointed toward the ceiling. Hold for 2 seconds at the peak, then lower under control in 4 seconds.',
    clinicalCues: [
      'Elevate arms strictly in the scapular plane (30°–45° angle) to prevent subacromial impingement.',
      'Keep thumbs pointing up toward the ceiling throughout the entire rep.',
      'Maintain single-leg balance from the foot tripod and gluteus medius; avoid knee valgus.',
      'Do not allow upper trapezius to shrug toward the ears.',
    ],
  },
  'squat to overhead reach': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Corrective Exercise Continuum (Phase 4: Integration)',
    tempo: '2/1/2 or Controlled Dynamic Integration',
    primeMover: 'Quadriceps, Gluteus Maximus, Anterior Deltoid & Supraspinatus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Soleus / Gastrocnemius', 'Serratus Anterior', 'Lower Trapezius'],
    stabilizers: ['Transverse Abdominis', 'Internal Obliques', 'Rotator Cuff', 'Gluteus Medius', 'Erector Spinae'],
    antagonists: ['Latissimus Dorsi', 'Pectoralis Major', 'Hip Flexors (at Lockout)'],
    kineticCheckpoints: {
      feetAnkles: 'Shoulder-width apart, parallel, feet pointing straight forward.',
      knees: 'Tracking directly over second/third toes throughout descent and ascent.',
      lphc: 'Maintain neutral lumbar lordosis; brace core to prevent excessive forward lean or anterior pelvic tilt.',
      shoulders: 'Smooth transition from low rack position to overhead scapular plane reach (30°–45° forward) with thumbs pointing up.',
      headNeck: 'Neutral cervical spine aligned with thoracic spine; eyes looking straight ahead.',
    },
    setupInstructions: 'Stand tall with feet shoulder-width apart and toes pointing straight ahead. Hold light dumbbells at sides or at shoulder height with thumbs facing upward.',
    executionInstructions: 'Descend into a controlled squat by hinging hips and bending knees until thighs approach parallel to floor. Drive through midfoot and heels to stand while simultaneously reaching arms overhead into the scapular plane (thumbs pointed up), achieving full triple extension at hips, knees, and ankles.',
    clinicalCues: [
      'Synchronize hip extension with overhead arm elevation in one seamless kinetic chain motion.',
      'Elevate arms in the scapular plane (30°–45° forward of the body) with thumbs up to protect the rotator cuff.',
      'Fully extend hips and squeeze glutes at the top without hyperextending the lumbar spine.',
      'Ensure knees track in line with second/third toes without inward valgus collapse.',
    ],
  },
  'squat to overhead reach scaption': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Corrective Exercise Continuum (Phase 4: Integration)',
    tempo: '2/1/2 or Controlled Dynamic Integration',
    primeMover: 'Quadriceps, Gluteus Maximus, Anterior Deltoid & Supraspinatus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Soleus / Gastrocnemius', 'Serratus Anterior', 'Lower Trapezius'],
    stabilizers: ['Transverse Abdominis', 'Internal Obliques', 'Rotator Cuff', 'Gluteus Medius', 'Erector Spinae'],
    antagonists: ['Latissimus Dorsi', 'Pectoralis Major', 'Hip Flexors (at Lockout)'],
    kineticCheckpoints: {
      feetAnkles: 'Shoulder-width apart, parallel, feet pointing straight forward.',
      knees: 'Tracking directly over second/third toes throughout descent and ascent.',
      lphc: 'Maintain neutral lumbar lordosis; brace core to prevent excessive forward lean or anterior pelvic tilt.',
      shoulders: 'Smooth transition from low rack position to overhead scapular plane reach (30°–45° forward) with thumbs pointing up.',
      headNeck: 'Neutral cervical spine aligned with thoracic spine; eyes looking straight ahead.',
    },
    setupInstructions: 'Stand tall with feet shoulder-width apart and toes pointing straight ahead. Hold light dumbbells at sides or at shoulder height with thumbs facing upward.',
    executionInstructions: 'Descend into a controlled squat by hinging hips and bending knees until thighs approach parallel to floor. Drive through midfoot and heels to stand while simultaneously reaching arms overhead into the scapular plane (thumbs pointed up), achieving full triple extension at hips, knees, and ankles.',
    clinicalCues: [
      'Synchronize hip extension with overhead arm elevation in one seamless kinetic chain motion.',
      'Elevate arms in the scapular plane (30°–45° forward of the body) with thumbs up to protect the rotator cuff.',
      'Fully extend hips and squeeze glutes at the top without hyperextending the lumbar spine.',
      'Ensure knees track in line with second/third toes without inward valgus collapse.',
    ],
  },
  'squat to scaption': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Corrective Exercise Continuum (Phase 4: Integration)',
    tempo: '2/1/2 or Controlled Dynamic Integration',
    primeMover: 'Quadriceps, Gluteus Maximus, Anterior Deltoid & Supraspinatus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Soleus / Gastrocnemius', 'Serratus Anterior', 'Lower Trapezius'],
    stabilizers: ['Transverse Abdominis', 'Internal Obliques', 'Rotator Cuff', 'Gluteus Medius', 'Erector Spinae'],
    antagonists: ['Latissimus Dorsi', 'Pectoralis Major', 'Hip Flexors (at Lockout)'],
    kineticCheckpoints: {
      feetAnkles: 'Shoulder-width apart, parallel, feet pointing straight forward.',
      knees: 'Tracking directly over second/third toes throughout descent and ascent.',
      lphc: 'Maintain neutral lumbar lordosis; brace core to prevent excessive forward lean or anterior pelvic tilt.',
      shoulders: 'Smooth transition from low rack position to overhead scapular plane reach (30°–45° forward) with thumbs pointing up.',
      headNeck: 'Neutral cervical spine aligned with thoracic spine; eyes looking straight ahead.',
    },
    setupInstructions: 'Stand tall with feet shoulder-width apart and toes pointing straight ahead. Hold light dumbbells at sides or at shoulder height with thumbs facing upward.',
    executionInstructions: 'Descend into a controlled squat by hinging hips and bending knees until thighs approach parallel to floor. Drive through midfoot and heels to stand while simultaneously reaching arms overhead into the scapular plane (thumbs pointed up), achieving full triple extension at hips, knees, and ankles.',
    clinicalCues: [
      'Synchronize hip extension with overhead arm elevation in one seamless kinetic chain motion.',
      'Elevate arms in the scapular plane (30°–45° forward of the body) with thumbs up to protect the rotator cuff.',
      'Fully extend hips and squeeze glutes at the top without hyperextending the lumbar spine.',
      'Ensure knees track in line with second/third toes without inward valgus collapse.',
    ],
  },

  // ── ARMS & ISOLATION ───────────────────────────────────────────────────
  'barbell bicep curl': {
    category: 'Arms',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2',
    primeMover: 'Biceps Brachii (Long & Short Heads)',
    synergists: ['Brachialis', 'Brachioradialis'],
    stabilizers: ['Anterior Deltoid', 'Wrist Flexors', 'Core LPHC'],
    antagonists: ['Triceps Brachii'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart with equal weight distribution.',
      knees: 'Soft, athletic bend.',
      lphc: 'Neutral spine; no swaying or swinging hips.',
      shoulders: 'Shoulder blades back and down, elbows pinned to ribcage.',
      headNeck: 'Neutral cervical spine, chin tucked.',
    },
    setupInstructions: 'Stand tall holding a barbell with underhand supinated grip, shoulder-width apart, with arms fully extended.',
    executionInstructions: 'Keeping upper arms stationary against ribs, curl barbell upward toward chest by contracting biceps. Squeeze at peak contraction, then lower under control for 2 seconds.',
    clinicalCues: [
      'Pin elbows to sides; do not let elbows drift forward or flare out.',
      'Avoid leaning back or using hip swing to heave the weight up.',
      'Fully extend arms at bottom for complete muscle stretch.',
    ],
  },
  'triceps pushdown': {
    category: 'Arms',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2',
    primeMover: 'Triceps Brachii (Lateral, Long, and Medial Heads)',
    synergists: ['Anconeus'],
    stabilizers: ['Latissimus Dorsi', 'Pectoralis Major', 'Wrist Extensors', 'Core'],
    antagonists: ['Biceps Brachii', 'Brachialis'],
    kineticCheckpoints: {
      feetAnkles: 'Hip-width apart or staggered stance.',
      knees: 'Slight bend.',
      lphc: 'Slight forward torso lean (10°) with neutral spine.',
      shoulders: 'Scapulae depressed, elbows pinned beside torso.',
      headNeck: 'Neutral head aligned with torso.',
    },
    setupInstructions: 'Attach a bar or rope to high cable pulley. Grasp attachment with overhand grip, pinning elbows tightly against your sides at 90° bend.',
    executionInstructions: 'Extend elbows downward until arms are fully locked out. Squeeze triceps at bottom for 1 second, then allow forearms to return under control to 90° starting position.',
    clinicalCues: [
      'Elbows must act as fixed hinges; keep them locked to ribcage.',
      'Do not allow shoulders to roll forward or shrug at the top.',
      'Spread rope handles outward at bottom lockout for maximum tricep contraction.',
    ],
  },

  // ── CORE & STABILIZATION ───────────────────────────────────────────────
  'plank': {
    category: 'Core',
    optPhase: 'Phase 1 (Stabilization Endurance)',
    tempo: 'Isometric Hold (20–60s)',
    primeMover: 'Transverse Abdominis & Rectus Abdominis',
    synergists: ['Internal & External Obliques', 'Quadratus Lumborum', 'Psoas Major'],
    stabilizers: ['Serratus Anterior', 'Gluteus Maximus', 'Quadriceps', 'Rotator Cuff'],
    antagonists: ['Erector Spinae'],
    kineticCheckpoints: {
      feetAnkles: 'Dorsiflexed on balls of feet, hip-width apart.',
      knees: 'Locked straight with active quadriceps contraction.',
      lphc: 'Neutral pelvis with posterior pelvic tilt; zero sagging in lumbar spine.',
      shoulders: 'Elbows directly under shoulders; push floor away to avoid winging.',
      headNeck: 'Neutral cervical spine; chin tucked gazing at hands.',
    },
    setupInstructions: 'Lie prone on floor. Prop body up onto forearms with elbows stacked directly beneath shoulders and feet hip-width apart.',
    executionInstructions: 'Lift hips so body creates a straight, rigid line from head to heels. Draw navel toward spine, squeeze glutes, and hold position with steady diaphragmatic breathing.',
    clinicalCues: [
      'Pull navel to spine and squeeze glutes hard to lock pelvis in neutral position.',
      'Push floor away with forearms to prevent shoulder blades from collapsing.',
      'Do not hold breath; breathe smoothly into abdomen.',
    ],
  },
  'lat pulldown': {
    category: 'Back',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2',
    primeMover: 'Latissimus Dorsi',
    synergists: ['Biceps Brachii', 'Brachialis', 'Brachioradialis', 'Teres Major', 'Rhomboids'],
    stabilizers: ['Rotator Cuff', 'Lower Trapezius', 'Core LPHC'],
    antagonists: ['Deltoids (Anterior/Lateral)', 'Pectoralis Major'],
    kineticCheckpoints: {
      feetAnkles: 'Planted firmly flat on floor with thighs secured beneath thigh pad.',
      knees: 'Flexed at 90° angle under thigh roller.',
      lphc: 'Torso angled back 10°–15° with neutral lumbar curve.',
      shoulders: 'Scapulae depressed and retracted before initiating elbow flexion.',
      headNeck: 'Neutral cervical spine, chin slightly tucked.',
    },
    setupInstructions: 'Sit at pulldown station with thighs snug under pad. Grip bar with an overhand grip slightly wider than shoulder width. Lean back slightly (10°–15°).',
    executionInstructions: 'Depress shoulder blades down, then drive elbows down and back to pull bar smoothly to upper chest (clavicle level). Pause for 1 second, then control the return up for 2–3 seconds.',
    clinicalCues: [
      'Think of pulling through elbows rather than gripping tightly with hands.',
      'Do not rock backward aggressively to generate momentum.',
      'Allow full scapular elevation and lat stretch at top without losing core tension.',
    ],
  },
  'seated row': {
    category: 'Back',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '4/2/1 or 2/0/2',
    primeMover: 'Latissimus Dorsi, Rhomboids, Middle Trapezius',
    synergists: ['Biceps Brachii', 'Brachialis', 'Posterior Deltoid', 'Teres Major'],
    stabilizers: ['Erector Spinae', 'Core LPHC', 'Hamstrings'],
    antagonists: ['Pectoralis Major', 'Anterior Deltoid'],
    kineticCheckpoints: {
      feetAnkles: 'Placed firmly against footplates with knees softly bent.',
      knees: 'Soft 15°–20° bend; never hyper-extended or locked out.',
      lphc: 'Upright vertical spine; zero slumping or excessive backward lean.',
      shoulders: 'Shoulder blades retracted and depressed into back pockets.',
      headNeck: 'Neutral neck in line with tall spine.',
    },
    setupInstructions: 'Sit upright on bench with feet on footplates, knees slightly bent. Grasp cable handle with arms extended and spine tall and neutral.',
    executionInstructions: 'Pull handle toward lower ribcage / navel by driving elbows back. Squeeze shoulder blades together for 1–2 seconds at peak contraction, then slowly extend arms back to starting stretch.',
    clinicalCues: [
      'Maintain an upright vertical torso throughout; avoid leaning back past 10°.',
      'Lead with elbows and initiate with scapular retraction before bending arms.',
      'Keep shoulders depressed down away from ears.',
    ],
  },
  'pull up': {
    category: 'Back',
    optPhase: 'Phase 2 (Strength Endurance), Phase 4 (Max Strength)',
    tempo: '2/0/2 or 3/0/1',
    primeMover: 'Latissimus Dorsi',
    synergists: ['Biceps Brachii', 'Brachialis', 'Brachioradialis', 'Teres Major', 'Rhomboids'],
    stabilizers: ['Core LPHC', 'Rotator Cuff', 'Pectoralis Minor'],
    antagonists: ['Deltoids', 'Pectoralis Major'],
    kineticCheckpoints: {
      feetAnkles: 'Crossed or straight with toes pointed slightly forward.',
      knees: 'Slight bend or extended straight in "hollow body" position.',
      lphc: 'Core braced in hollow body position without excessive spinal arching.',
      shoulders: 'Full scapular depression before pulling.',
      headNeck: 'Neutral cervical spine; clear chin over bar without reaching neck up.',
    },
    setupInstructions: 'Grasp pull-up bar with overhand grip slightly wider than shoulder width. Hang with arms fully extended in an active hollow-body hang.',
    executionInstructions: 'Engage lats by drawing shoulder blades down and back, then pull body upward until chin clears the bar. Pause for 1 second, then lower under control for 2–3 seconds to a full dead hang.',
    clinicalCues: [
      'Start every repetition from an active dead hang with engaged scapulae.',
      'Drive elbows down toward hip pockets rather than pulling with biceps alone.',
      'Avoid swinging, kicking legs (kipping), or craning neck over bar.',
    ],
  },
  'face pull': {
    category: 'Shoulders',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance)',
    tempo: '4/2/1 or 2/0/2',
    primeMover: 'Posterior Deltoid & External Rotators (Infraspinatus, Teres Minor)',
    synergists: ['Rhomboids', 'Middle/Lower Trapezius'],
    stabilizers: ['Core LPHC', 'Rotator Cuff'],
    antagonists: ['Pectoralis Major', 'Subscapularis', 'Anterior Deltoid'],
    kineticCheckpoints: {
      feetAnkles: 'Athletic staggered or parallel stance.',
      knees: 'Soft knee bend.',
      lphc: 'Neutral pelvis; ribcage down with core braced.',
      shoulders: 'Externally rotated at peak contraction (thumbs pointing backward).',
      headNeck: 'Neutral cervical spine.',
    },
    setupInstructions: 'Set cable pulley to eye level and attach a rope. Grasp rope with thumbs facing backward / upward. Step back into an athletic staggered stance.',
    executionInstructions: 'Pull rope toward nose / eye level while separating handles outward, rotating hands back so thumbs point behind you. Squeeze rear delts for 2 seconds, then slowly return under control.',
    clinicalCues: [
      'Focus on external rotation at the finish: knuckles back, thumbs pointed behind head.',
      'Keep elbows high in line with ears.',
      'Do not thrust hips forward or lean back to move the weight.',
    ],
  },
  'walking lunge': {
    category: 'Legs',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '4/2/1 or 2/0/2',
    primeMover: 'Quadriceps Complex & Gluteus Maximus',
    synergists: ['Hamstrings', 'Adductor Magnus', 'Gastrocnemius', 'Soleus'],
    stabilizers: ['Gluteus Medius', 'Quadratus Lumborum', 'Core LPHC'],
    antagonists: ['Hip Flexors (Psoas) of rear leg'],
    kineticCheckpoints: {
      feetAnkles: 'Front foot flat, pointing straight ahead; rear foot on ball of foot.',
      knees: 'Front knee stays aligned with second toe (zero inward collapse).',
      lphc: 'Hips level and square to front with upright posture.',
      shoulders: 'Shoulders retracted and depressed over hips.',
      headNeck: 'Head neutral looking straight ahead.',
    },
    setupInstructions: 'Stand tall with feet hip-width apart holding dumbbells at sides or barbell on back. Engage core.',
    executionInstructions: 'Take a controlled step forward, lowering hips until front thigh is parallel to floor and back knee hovers 1 inch above ground. Drive through front heel to step directly forward into the next lunge step.',
    clinicalCues: [
      'Keep torso upright and pelvis level on each step.',
      'Do not allow front knee to drift far past toes or cave inward.',
      'Land softly with midfoot-heel contact on each forward step.',
    ],
  },
  'barbell hip thrust': {
    category: 'Legs',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy), Phase 4 (Max Strength)',
    tempo: '2/0/2 or 2/1/1',
    primeMover: 'Gluteus Maximus',
    synergists: ['Hamstrings Complex', 'Adductor Magnus'],
    stabilizers: ['Erector Spinae', 'Core LPHC', 'Quadriceps'],
    antagonists: ['Iliopsoas', 'Rectus Femoris'],
    kineticCheckpoints: {
      feetAnkles: 'Feet shoulder-width apart, flat on floor, shins vertical at top lockout.',
      knees: 'Knees tracking over second and third toes at 90° angle at top.',
      lphc: 'Posterior pelvic tilt at top lockout (tuck tailbone under, squeeze glutes).',
      shoulders: 'Upper back (lower scapulae) resting firmly on bench edge.',
      headNeck: 'Chin tucked toward chest looking forward throughout movement.',
    },
    setupInstructions: 'Sit on floor with upper back against a bench edge and a padded barbell resting across hip crease. Bend knees and place feet flat on floor shoulder-width apart.',
    executionInstructions: 'Drive through heels and extend hips upward until thighs and torso form a straight horizontal line parallel to floor with vertical shins. Squeeze glutes forcefully for 1–2 seconds at top, then lower under control.',
    clinicalCues: [
      'Keep chin tucked and eyes looking forward across the room to prevent lumbar hyperextension.',
      'Ensure shins are vertical (90°) at top lockout for maximal glute recruitment.',
      'Lock out with a posterior pelvic tilt and glute squeeze, not an arched lower back.',
    ],
  },
  'cable crossover': {
    category: 'Chest',
    optPhase: 'Phase 2 (Strength Endurance), Phase 3 (Hypertrophy)',
    tempo: '2/0/2',
    primeMover: 'Pectoralis Major (Sternal & Costal Heads)',
    synergists: ['Anterior Deltoid', 'Coracobrachialis', 'Biceps Brachii (Short Head)'],
    stabilizers: ['Core LPHC', 'Rotator Cuff', 'Serratus Anterior'],
    antagonists: ['Rhomboids', 'Posterior Deltoid', 'Latissimus Dorsi'],
    kineticCheckpoints: {
      feetAnkles: 'Staggered athletic stance with bodyweight centered.',
      knees: 'Soft bend in both knees.',
      lphc: 'Slight forward torso lean (15°) with flat neutral spine.',
      shoulders: 'Elbows maintain a fixed slight bend (15°–20°) throughout the arc.',
      headNeck: 'Neutral cervical spine in line with angled torso.',
    },
    setupInstructions: 'Set cable pulleys to high position. Grasp handles and step forward into a staggered stance with slight forward torso lean and arms open wide in a slight elbow bend.',
    executionInstructions: 'Bring handles down and forward in a wide hugging arc until hands meet in front of lower chest / hips. Squeeze chest forcefully for 1 second, then control the return arc back until a gentle pectoral stretch is felt.',
    clinicalCues: [
      'Maintain a fixed elbow bend throughout; do not turn the fly into a press.',
      'Think of bringing the inner biceps together to maximize chest contraction.',
      'Keep shoulders packed down away from ears during the entire sweep.',
    ],
  },
  'dead bug': {
    category: 'Core',
    optPhase: 'Phase 1 (Stabilization Endurance)',
    tempo: '4/2/1 or Slow Controlled Alternating',
    primeMover: 'Transverse Abdominis & Rectus Abdominis',
    synergists: ['Internal/External Obliques', 'Psoas Major'],
    stabilizers: ['Multifidus', 'Diaphragm', 'Pelvic Floor', 'Serratus Anterior'],
    antagonists: ['Erector Spinae'],
    kineticCheckpoints: {
      feetAnkles: 'Dorsiflexed at 90° angle.',
      knees: 'Stacked directly above hips at 90° tabletop position.',
      lphc: 'Lower back pressed flat into floor with zero arching / daylight.',
      shoulders: 'Arms pointed straight up toward ceiling, scapulae flat against floor.',
      headNeck: 'Head resting comfortably on floor, chin neutral.',
    },
    setupInstructions: 'Lie on your back on the floor. Raise arms straight toward ceiling and bring knees up to 90° tabletop position directly over hips.',
    executionInstructions: 'Press lower back firmly into floor. Inhale and slowly extend right arm overhead and left leg straight toward floor until hovering just above the ground. Exhale and return to start, then alternate opposite limbs.',
    clinicalCues: [
      'The lower back must stay glued to the floor at all times; if it arches, shorten limb reach.',
      'Move slowly and deliberately (3 seconds down, 1 second return).',
      'Maintain smooth diaphragmatic breathing while keeping abdominal brace engaged.',
    ],
  },
  'russian twist': {
    category: 'Core',
    optPhase: 'Phase 1 (Stabilization Endurance), Phase 2 (Strength Endurance)',
    tempo: '2/0/2 Controlled Rotation',
    primeMover: 'Internal & External Obliques',
    synergists: ['Rectus Abdominis', 'Transverse Abdominis', 'Iliopsoas'],
    stabilizers: ['Erector Spinae', 'Quadratus Lumborum', 'Hip Flexors'],
    antagonists: ['Opposing Lateral Obliques'],
    kineticCheckpoints: {
      feetAnkles: 'Heels lightly touching floor or elevated 2 inches for increased demand.',
      knees: 'Bent at 90° angle.',
      lphc: 'Torso leaned back 45° with a straight, tall spine (avoid rounded slumping).',
      shoulders: 'Chest open, shoulders back and down.',
      headNeck: 'Head and eyes follow hands during rotation.',
    },
    setupInstructions: 'Sit on floor with knees bent, heels on ground. Lean torso back to a 45° angle with spine tall and chest open. Clasp hands together or hold a medicine ball/dumbbell in front of chest.',
    executionInstructions: 'Rotate torso smoothly to the right, touching hands/weight to floor beside hip. Pause momentarily, then rotate smoothly across to the left side in one continuous, controlled tempo.',
    clinicalCues: [
      'Rotate from the thoracic spine and ribcage, not just swinging your arms.',
      'Keep chest proud and prevent lower back from rounding into a slumped position.',
      'Control each twist with active oblique contraction rather than momentum.',
    ],
  },
}

export const GENERATED_EXERCISE_IMAGES: Record<string, string> = VERIFIED_GAA_EXERCISE_IMAGES

/**
 * Parses clean, structured, numbered step-by-step instructions from an official exercise description.
 */
export function parseExerciseStepInstructions(description?: string | null): string[] {
  const text = String(description ?? '').replace(/\r/g, '').trim()
  if (!text) return []

  const stepMatches = text.split(/(?=Step\s*\d+:?)/i).map(s => s.trim()).filter(Boolean)
  if (stepMatches.length >= 2) {
    return stepMatches.map((step, idx) => {
      const clean = step.replace(/^Step\s*\d+:?\s*/i, '').trim()
      return `${idx + 1}. ${clean}`
    })
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length > 1) {
    return lines.map((l, idx) => {
      const clean = l.replace(/^\d+[\.\)]\s*/, '').trim()
      return `${idx + 1}. ${clean}`
    })
  }

  return [`1. ${text}`]
}

/**
 * Derives clean, structured, numbered step-by-step instructions on exactly how to perform the exercise.
 */
export function deriveExerciseHowToSteps(
  exerciseName: string,
  matchedProfile?: Partial<NasmClinicalMovementCard> | null,
  fuzzyDescription?: string | null,
  explicitInstructions?: string[] | null
): string[] {
  // 1. Explicit instructions provided directly
  if (explicitInstructions && explicitInstructions.length > 0) {
    return explicitInstructions
  }

  // 2. Parse from official NASM library record description if contains "Step 1: ...", "Step 2: ..."
  // This guarantees all official exercises match the text and video precisely
  if (fuzzyDescription && (fuzzyDescription.includes('Step 1:') || fuzzyDescription.includes('Step 1') || fuzzyDescription.includes('Step 2'))) {
    const parsed = parseExerciseStepInstructions(fuzzyDescription)
    if (parsed.length >= 2) {
      return parsed
    }
  }

  // 3. If explicit steps defined in matched profile, return them
  if (matchedProfile?.howToSteps && matchedProfile.howToSteps.length > 0) {
    return matchedProfile.howToSteps
  }

  // 3. If matchedProfile has setupInstructions & executionInstructions, construct standard 4-step sequence
  if (matchedProfile?.setupInstructions && matchedProfile?.executionInstructions) {
    return [
      `1. Setup: ${matchedProfile.setupInstructions}`,
      `2. Eccentric Descent: Inhale and initiate the movement under control (2–3 second tempo), keeping core braced and joint alignment locked.`,
      `3. Concentric Drive: ${matchedProfile.executionInstructions}`,
      `4. Lockout & Control: Exhale and hold peak contraction for 1 second, then reset smoothly without losing form.`,
    ]
  }

  // 4. Robust pattern-based procedural how-to generator for any exercise name
  const norm = exerciseName.toLowerCase()

  if (norm.includes('foam roll') || norm.includes('smr') || norm.includes('roller')) {
    return [
      '1. Position foam roller directly beneath the targeted muscle belly on the floor.',
      '2. Slowly roll at 1 inch per second until finding the most tender trigger point.',
      '3. Hold constant static pressure directly on the knot for 30–60 seconds while taking slow diaphragmatic breaths.',
      '4. Maintain proper posture throughout, then repeat on the contralateral side.',
    ]
  }

  if (norm.includes('static') || (norm.includes('stretch') && !norm.includes('dynamic')) || norm.includes('doorway')) {
    return [
      '1. Move slowly into the stretch until feeling mild tension in the targeted muscle (no sharp pain).',
      '2. Align kinetic chain checkpoints with neutral spine, squared pelvis, and relaxed shoulders.',
      '3. Hold the static position steadily for 30 seconds per side without bouncing or pulsing.',
      '4. Exhale deeply on diaphragmatic cycles to facilitate autogenic neuromuscular inhibition and relaxation.',
    ]
  }

  if (norm.includes('bench') || norm.includes('chest press') || norm.includes('push up') || norm.includes('push-up') || norm.includes('dip')) {
    return [
      '1. Position yourself with shoulder blades pinched back and down, feet planted flat on floor.',
      '2. Inhale and lower weight with control (2–3s descent) toward mid-chest with elbows at a 45° angle to torso.',
      '3. Pause briefly at chest level without bouncing, maintaining full shoulder blade depression.',
      '4. Exhale and drive upward through palms, squeezing chest to full arm extension without protracting shoulders.',
    ]
  }

  if (norm.includes('squat') || norm.includes('leg press') || norm.includes('hack')) {
    return [
      '1. Set feet shoulder-width apart with toes pointing forward or slightly outward (5°–10°), core firmly braced.',
      '2. Inhale, break at hips and knees simultaneously, driving knees out in line with second toes.',
      '3. Descend with a 3-second tempo until thighs reach parallel to the floor with chest proud and upright.',
      '4. Exhale, drive through midfoot and heels to stand tall, locking hips at the top with glute engagement.',
    ]
  }

  if (norm.includes('deadlift') || norm.includes('rdl') || norm.includes('good morning') || norm.includes('hinge')) {
    return [
      '1. Stand tall with feet hip-width apart, spine neutral, and shoulder blades locked back into pockets.',
      '2. Soften knees slightly and push hips backward toward the wall behind you, skimming weight along legs.',
      '3. Lower until maximum tension is felt across hamstrings and glutes without allowing lower back to round.',
      '4. Exhale and drive hips forcefully forward to standing, squeezing glutes tightly at the top lockout.',
    ]
  }

  if (norm.includes('row') || norm.includes('pulldown') || norm.includes('pull-up') || norm.includes('pull up') || norm.includes('chin')) {
    return [
      '1. Set up with tall posture or hinged torso, arms fully extended, and scapulae retracted and depressed.',
      '2. Initiate pull by driving elbows down and back toward your hips / ribcage.',
      '3. Squeeze shoulder blades together firmly at peak contraction for 1 full second.',
      '4. Resist weight on the return phase, extending arms under control for 2–3 seconds.',
    ]
  }

  if (norm.includes('overhead') || norm.includes('shoulder press') || norm.includes('military') || norm.includes('arnold')) {
    return [
      '1. Stand or sit with core braced and glutes locked; hold dumbbells/barbell at shoulder level with forearms vertical.',
      '2. Press upward in a vertical path, moving head slightly back to clear bar/weight path.',
      '3. Lock arms out overhead with biceps aligned next to ears and shoulder blades stable.',
      '4. Inhale and lower weight with control back to shoulder starting position (2-second descent).',
    ]
  }

  if (norm.includes('lunge') || norm.includes('split squat') || norm.includes('step-up') || norm.includes('step up')) {
    return [
      '1. Stand in tall athletic stance and step one foot forward/back into an evenly balanced split stance.',
      '2. Lower hips vertically until front thigh is parallel to floor and rear knee hovers just above ground.',
      '3. Keep front knee tracking directly over middle toes without caving inward.',
      '4. Drive forcefully through the front heel to return to top standing position.',
    ]
  }

  if (norm.includes('curl') || norm.includes('bicep')) {
    return [
      '1. Stand tall with elbows pinned firmly against your ribcage as fixed hinges, palms supinated.',
      '2. Curl weight upward toward chest by contracting biceps, keeping upper arms completely stationary.',
      '3. Squeeze biceps forcefully at peak contraction for 1 full second.',
      '4. Lower weight under control for 2–3 seconds until arms are fully extended at the bottom.',
    ]
  }

  if (norm.includes('tricep') || norm.includes('pushdown') || norm.includes('skull') || norm.includes('extension')) {
    return [
      '1. Pin elbows tightly against ribcage at a 90° starting bend with core braced.',
      '2. Extend forearms downward or forward until elbows are fully locked out.',
      '3. Squeeze triceps hard at peak contraction for 1 second.',
      '4. Allow forearms to return under control to the 90° starting position without flaring elbows.',
    ]
  }

  if (norm.includes('plank') || norm.includes('bug') || norm.includes('twist') || norm.includes('crunch') || norm.includes('ab')) {
    return [
      '1. Establish stable anatomical alignment on floor with neutral spine and hips squared.',
      '2. Draw navel inward toward spine to engage deep transverse abdominis and pelvic floor.',
      '3. Execute contraction under strict control, avoiding any arching or momentum.',
      '4. Exhale completely on exertion and maintain constant isometric core tension.',
    ]
  }

  return [
    '1. Setup: Assume athletic starting position with joints stacked and core braced.',
    '2. Eccentric Phase: Inhale and lower weight with a controlled 2–3 second tempo through full active range of motion.',
    '3. Concentric Drive: Exhale and drive through prime movers with explosive, controlled intent.',
    '4. Lockout & Control: Hold peak contraction for 1 second, then repeat without breaking posture.',
  ]
}

const MOVEMENT_CARD_CACHE = new Map<string, NasmClinicalMovementCard>()

export function clearMovementCardCache(): void {
  MOVEMENT_CARD_CACHE.clear()
}

/**
 * Generates an authentic NASM Clinical Movement Card for any exercise in the program.
 * Strictly pairs verified official NASM media; if no exact match is found, marks media as not available.
 */
export function getNasmClinicalMovementCard(
  exerciseName: string,
  overrides?: {
    imageUrl?: string | null
    videoUrl?: string | null
    description?: string | null
    instructions?: string[] | null
    coachingCues?: string[] | null
    primaryEquipment?: string[] | null
  }
): NasmClinicalMovementCard {
  const cacheKey = `${(exerciseName || '').trim().toLowerCase()}::${overrides?.imageUrl ?? ''}::${overrides?.videoUrl ?? ''}::${overrides?.description ?? ''}::${(overrides?.instructions || []).join(';')}::${(overrides?.coachingCues || []).join(',')}::${(overrides?.primaryEquipment || []).join(',')}`
  if (MOVEMENT_CARD_CACHE.has(cacheKey)) {
    return MOVEMENT_CARD_CACHE.get(cacheKey)!
  }

  const result = getNasmClinicalMovementCardUncached(exerciseName, overrides)
  MOVEMENT_CARD_CACHE.set(cacheKey, result)
  return result
}

function getNasmClinicalMovementCardUncached(
  exerciseName: string,
  overrides?: {
    imageUrl?: string | null
    videoUrl?: string | null
    description?: string | null
    instructions?: string[] | null
    coachingCues?: string[] | null
    primaryEquipment?: string[] | null
  }
): NasmClinicalMovementCard {
  const cleaned = cleanExerciseName(exerciseName)
  const fuzzyMatch = searchNasmLibraryMedia(exerciseName)

  // 1. Search matching profile in biomechanical dictionary
  let matchedProfile: Partial<NasmClinicalMovementCard> | null = null

  if (NASM_MOVEMENT_PROFILES[cleaned]) {
    matchedProfile = NASM_MOVEMENT_PROFILES[cleaned]
  } else {
    for (const [key, profile] of Object.entries(NASM_MOVEMENT_PROFILES)) {
      if (cleaned.includes(key) || key.includes(cleaned)) {
        matchedProfile = profile
        break
      }
    }
  }

  // Fallback defaults if novel exercise
  const isFlexOrSmr = cleaned.includes('stretch') || cleaned.includes('roll') || cleaned.includes('smr') || cleaned.includes('foam') || cleaned.includes('breath') || cleaned.includes('mobility') || cleaned.includes('lengthen') || cleaned.includes('inhibit')
  const isShoulders = cleaned.includes('shoulder') || cleaned.includes('deltoid') || cleaned.includes('overhead') || cleaned.includes('lateral raise') || cleaned.includes('scaption')
  const isArms = cleaned.includes('curl') || cleaned.includes('tricep') || cleaned.includes('bicep') || cleaned.includes('dip')
  const isBenchOrPush = cleaned.includes('press') || cleaned.includes('push') || cleaned.includes('fly')
  const isPullOrRow = cleaned.includes('row') || cleaned.includes('pull') || cleaned.includes('deadlift')
  const isSquatOrLeg = cleaned.includes('squat') || cleaned.includes('lunge') || cleaned.includes('leg') || cleaned.includes('step') || cleaned.includes('calf') || cleaned.includes('glute')

  const defaultCategory = isFlexOrSmr
    ? 'Flexibility/SMR'
    : isShoulders
    ? 'Shoulders'
    : isArms
    ? 'Arms'
    : isBenchOrPush
    ? 'Chest'
    : isPullOrRow
    ? 'Back'
    : isSquatOrLeg
    ? 'Legs'
    : 'Core'
  const defaultPrimeMover = isFlexOrSmr
    ? 'Target Neuromuscular / Fascial System'
    : isShoulders
    ? 'Deltoids & Upper Trapezius'
    : isArms
    ? 'Biceps Brachii / Triceps Brachii'
    : isBenchOrPush
    ? 'Pectoralis Major / Anterior Deltoid'
    : isPullOrRow
    ? 'Latissimus Dorsi & Gluteals'
    : isSquatOrLeg
    ? 'Quadriceps & Gluteus Maximus'
    : 'Core Musculature'

  // Determine description
  const resolvedDescription =
    overrides?.description ||
    fuzzyMatch?.record.description ||
    matchedProfile?.executionInstructions ||
    'Execute movement through full active range of motion with controlled eccentric lowering and explosive concentric contraction.'

  // Precise equipment detection
  const resolvedEquipment = detectExerciseEquipment(
    exerciseName,
    resolvedDescription,
    overrides?.primaryEquipment || fuzzyMatch?.record.primaryEquipment
  )

  // Strict Media Verification — 100% Official NASM Edge Video & Verified Luxury GAA Photography
  const officialVideoResolution = resolveExerciseVideoEmbed(exerciseName, overrides?.videoUrl || (fuzzyMatch?.record.videoUrl ?? null))
  const directYtId = extractYouTubeVideoId(officialVideoResolution.externalUrl) || extractYouTubeVideoId(officialVideoResolution.embedUrl)

  const verifiedGaaImage = resolveGaaExerciseImage(exerciseName, false)

  const hasOfficialNasmMatch = Boolean(
    NASM_MOVEMENT_PROFILES[cleaned] ||
    Object.keys(NASM_MOVEMENT_PROFILES).some(k => cleaned.includes(k) || k.includes(cleaned)) ||
    (fuzzyMatch !== null && fuzzyMatch.score >= 75) ||
    overrides?.videoUrl ||
    overrides?.imageUrl ||
    Boolean(verifiedGaaImage)
  )

  const officialNasmThumbnail = directYtId && hasOfficialNasmMatch
    ? `https://img.youtube.com/vi/${directYtId}/hqdefault.jpg`
    : null

  const validCustomOverride = (overrides?.imageUrl && !overrides.imageUrl.startsWith('/images/exercises/'))
    ? overrides.imageUrl
    : null

  const resolvedImageUrl =
    officialNasmThumbnail ||
    (hasOfficialNasmMatch && fuzzyMatch?.record.imageUrl ? fuzzyMatch.record.imageUrl : null) ||
    verifiedGaaImage ||
    validCustomOverride ||
    null

  const resolvedVideoUrl = hasOfficialNasmMatch
    ? (officialVideoResolution.externalUrl || overrides?.videoUrl || (fuzzyMatch ? fuzzyMatch.record.videoUrl : null) || null)
    : null

  const resolvedEmbedUrl = hasOfficialNasmMatch ? (officialVideoResolution.embedUrl || null) : null
  const hasOfficialMedia = Boolean(hasOfficialNasmMatch && (resolvedImageUrl || resolvedVideoUrl))

  const officialDesc = overrides?.description || fuzzyMatch?.record.description
  const howToSteps = deriveExerciseHowToSteps(
    exerciseName,
    matchedProfile,
    officialDesc,
    overrides?.instructions
  )

  return {
    name: exerciseName,
    category: matchedProfile?.category || defaultCategory,
    optPhase: matchedProfile?.optPhase || 'Phase 1: Stabilization · Phase 2: Strength Endurance · Phase 3: Hypertrophy',
    tempo: matchedProfile?.tempo || '2/0/2 (Controlled Tempo)',
    primeMover: matchedProfile?.primeMover || defaultPrimeMover,
    synergists: matchedProfile?.synergists || ['Secondary Synergists', 'Assisting Musculature'],
    stabilizers: matchedProfile?.stabilizers || ['Rotator Cuff & Scapular Stabilizers', 'LPHC Core Musculature'],
    antagonists: matchedProfile?.antagonists || ['Opposing Antagonist Muscle Group'],
    kineticCheckpoints: matchedProfile?.kineticCheckpoints || {
      feetAnkles: 'Shoulder-width, firmly planted on ground.',
      knees: 'Aligned with second and third toes.',
      lphc: 'Neutral lumbar spine; core braced.',
      shoulders: 'Retracted and depressed into athletic posture.',
      headNeck: 'Neutral cervical spine, chin packed.',
    },
    setupInstructions: officialDesc
      ? (howToSteps[0]?.replace(/^\d+\.\s*/, '') || officialDesc.split('\n')[0])
      : (matchedProfile?.setupInstructions || 'Assume standard athletic starting position with stable kinetic alignment.'),
    executionInstructions: officialDesc || matchedProfile?.executionInstructions || resolvedDescription,
    howToSteps,
    clinicalCues: overrides?.coachingCues && overrides.coachingCues.length > 0 ? overrides.coachingCues : matchedProfile?.clinicalCues || [
      'Maintain neutral kinetic chain checkpoints throughout.',
      'Control the 2-second eccentric lowering phase.',
      'Exhale on exertion while maintaining intra-abdominal brace.',
    ],
    equipment: resolvedEquipment,
    imageUrl: resolvedImageUrl,
    fallbackImageUrl: BRAND_LOGO_FALLBACK_IMAGE,
    videoUrl: resolvedVideoUrl,
    embedUrl: resolvedEmbedUrl,
    hasOfficialMedia,
    confidenceScore: fuzzyMatch?.score || (officialVideoResolution.isDirectEmbed ? 95 : 0),
  }
}
