/**
 * Forge Athletic — Master Sports Injuries & Orthopedic Biomechanics Registry
 * 
 * Curated specifically for personal trainers, strength & conditioning coaches,
 * and NASM Corrective Exercise Specialists (CES).
 * 
 * Defines common sports injuries, contraindications, prescribed substitutions,
 * warmup/activation additions, coaching cues, and cardio modifications.
 * 
 * NOTE: For all exercises involving hammer curls, palms must ALWAYS face inward toward
 * each other (strict neutral grip) with strictly zero twisting or supination.
 */

export type SportsInjuryRegion =
  | 'knee'
  | 'elbow'
  | 'shoulder'
  | 'spine'
  | 'hip'
  | 'foot_ankle'
  | 'wrist'

export interface PrescribedInjurySubstitution {
  targetExerciseOrPattern: string
  replacement: string
  rationale: string
  coachingCue: string
}

export interface SportsInjuryDefinition {
  id: string
  name: string
  commonAliases: string[]
  region: SportsInjuryRegion
  shortDescription: string
  trainerProtocol: string
  blacklistedExercises: string[]
  prescribedSubstitutions: PrescribedInjurySubstitution[]
  coachingCues: string[]
  warmupAdditions: {
    inhibitSmr: string[]
    activateDynamic: string[]
  }
  cardioModifications?: {
    avoidModalities: string[]
    recommendedModalities: string[]
    rationale: string
  }
}

export type SportsInjuryKey =
  | 'runners_knee'
  | 'tennis_elbow'
  | 'golfers_elbow'
  | 'jumpers_knee'
  | 'it_band_syndrome'
  | 'shin_splints'
  | 'plantar_fasciitis'
  | 'rotator_cuff_impingement'
  | 'lumbar_strain_disc'
  | 'hamstring_strain'
  | 'achilles_tendinopathy'
  | 'ankle_sprain_instability'
  | 'hip_impingement_fai'
  | 'cervical_strain_neck'
  | 'wrist_strain_carpal'
  | 'groin_adductor_strain'

export const COMMON_SPORTS_INJURIES: Record<string, SportsInjuryDefinition> = {
  runners_knee: {
    id: 'runners_knee',
    name: "Runner's Knee (Patellofemoral Pain Syndrome / PFPS)",
    commonAliases: ['runners knee', 'patellofemoral', 'pfps', 'chondromalacia', 'anterior knee pain', 'knee pain running'],
    region: 'knee',
    shortDescription: 'Irritation of cartilage beneath the patella aggravated by repetitive knee flexion and anterior shear.',
    trainerProtocol: 'Maintain vertical shin angles; emphasize posterior chain (glutes/hamstrings) dominance; prioritize VMO activation; avoid deep anterior knee travel.',
    blacklistedExercises: [
      'Seated Leg Extension (Open Chain Shear)',
      'Seated Leg Extension',
      'Leg Extension',
      'Deep Box Jumps (High Impact Landings)',
      'Walking Lunges with Forward Knee Shear',
      'Forward Lunge',
      'Walking Lunge',
      'Jump Squat',
      'Tuck Jump',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Seated Leg Extension',
        replacement: 'Spanish Squats with Heavy Loop Band (Closed Kinetic Chain VMO)',
        rationale: 'Eliminates anterior patellar shear while maximizing isometric vastus medialis oblique (VMO) motor unit recruitment.',
        coachingCue: 'Keep shins vertical, sit back into the band tension, and hold isometric contraction at 45° knee flexion.',
      },
      {
        targetExerciseOrPattern: 'Walking Lunge',
        replacement: 'Reverse Lunge with Torso Lean / Step-Up to Low Box',
        rationale: 'Posterior stepping vector directs ground reaction force through the heel and hip, reducing patellofemoral joint stress by 35%.',
        coachingCue: 'Step back with control, keep front shin nearly vertical, and drive through the front heel.',
      },
      {
        targetExerciseOrPattern: 'Forward Lunge',
        replacement: 'Reverse Lunge with Torso Lean / Step-Up to Low Box',
        rationale: 'Posterior stepping vector reduces anterior shear on the patellar tendon.',
        coachingCue: 'Step backward softly, keeping front knee stacked directly over the ankle.',
      },
      {
        targetExerciseOrPattern: 'Deep Box Jumps',
        replacement: 'Low-Impact Banded Kettlebell Swings & Box Step-Ups',
        rationale: 'Preserves triple extension power output without joint landing shock.',
        coachingCue: 'Drive through heels with rapid hip extension, absorb softly on step-down.',
      },
      {
        targetExerciseOrPattern: 'Jump Squat',
        replacement: 'Banded Hip Thrust / Kettlebell Swing',
        rationale: 'Trains explosive triple extension without compressive patellar landing shock.',
        coachingCue: 'Snap hips forward forcefully and squeeze glutes at lockout.',
      },
    ],
    coachingCues: [
      'Keep shins vertical; push knees outward over the 2nd and 3rd toes.',
      'Sit back into hips as if sitting into a low chair; initiate movement from the pelvis.',
      'Drive exclusively through the heels and mid-foot; never push off the toes.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Tensor Fasciae Latae (TFL) & Vastus Lateralis (60s)', 'SMR Foam Roll Quadriceps (60s)'],
      activateDynamic: ['Spanish Squat Isometric Hold (30s hold with heavy band)', 'Side-Lying Clamshell with Mini-Band (15 reps/side)'],
    },
    cardioModifications: {
      avoidModalities: ['outdoor-running', 'treadmill', 'stairmaster'],
      recommendedModalities: ['stationary-bike', 'rowing-machine', 'swimming'],
      rationale: 'Replace high-impact running with closed-chain cycling (seat high to prevent deep flexion) or rowing.',
    },
  },

  tennis_elbow: {
    id: 'tennis_elbow',
    name: 'Tennis Elbow (Lateral Epicondylitis / Extensor Tendinopathy)',
    commonAliases: ['tennis elbow', 'lateral epicondylitis', 'elbow tendonitis', 'forearm extensor pain', 'outer elbow pain'],
    region: 'elbow',
    shortDescription: 'Microtrauma and inflammation at the common extensor tendon of the forearm, aggravated by wrist extension and heavy gripping.',
    trainerProtocol: 'Strict neutral hammer grip on all arm movements with zero wrist twisting or supination; avoid heavy direct wrist extension loading; decompress forearm extensors.',
    blacklistedExercises: [
      'Barbell Reverse Curl (Wrist Extensor Overload)',
      'Barbell Reverse Biceps Curl',
      'Reverse Barbell Curl',
      'Overhand Barbell Wrist Curl',
      'Heavy Dumbbell Pronated Row',
      'Barbell Wrist Extension',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Reverse Barbell Curl',
        replacement: 'Standing Dumbbell Hammer Curl (Strict Neutral Grip, Palms Inward, Heads Vertical)',
        rationale: 'Neutral grip aligns brachioradialis while eliminating tensile shear across the lateral epicondyle.',
        coachingCue: 'Maintain strict neutral hammer grip (palms facing inward toward each other with strictly zero twisting or supination). Dumbbells remain oriented vertically with thumbs up.',
      },
      {
        targetExerciseOrPattern: 'Barbell Reverse Curl',
        replacement: 'Standing Dumbbell Hammer Curl (Strict Neutral Grip, Palms Inward, Heads Vertical)',
        rationale: 'Protects the lateral epicondyle while loading elbow flexors safely.',
        coachingCue: 'Keep wrists locked in neutral position; thumbs pointed straight toward the ceiling.',
      },
      {
        targetExerciseOrPattern: 'Overhand Barbell Wrist Curl',
        replacement: 'Eccentric Wrist Extension with Light Band / Tyler Twist',
        rationale: 'Promotes collagen realignment in extensor carpi radialis brevis through controlled eccentric loading without shear.',
        coachingCue: 'Slow 4-second lowering phase; never bounce or snap wrist under tension.',
      },
      {
        targetExerciseOrPattern: 'Barbell Wrist Extension',
        replacement: 'Banded Wrist Isometric Hold & Neutral-Grip Farmer Carry',
        rationale: 'Provides isometric forearm stabilization demand without repetitive end-range extensor friction.',
        coachingCue: 'Lock wrist in pristine neutral; do not allow wrist to collapse backward.',
      },
    ],
    coachingCues: [
      'Strict neutral hammer grip: palms face each other, dumbbells oriented vertically, thumbs up.',
      'Avoid gripping dumbbells with a death-grip; use lifting straps on heavy pulling if needed.',
      'Zero wrist twisting or supination throughout the entire concentric and eccentric phases.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Lacrosse Ball Forearm Extensors & Brachioradialis (60s)', 'Forearm Flexor / Extensor Active Stretch (30s)'],
      activateDynamic: ['Wrist Neutral Stabilization Hold with Mini-Band (12 reps)', 'Light Dumbbell Neutral Hammer Hold (20s)'],
    },
  },

  golfers_elbow: {
    id: 'golfers_elbow',
    name: "Golfer's Elbow (Medial Epicondylitis / Flexor Tendinopathy)",
    commonAliases: ['golfers elbow', 'medial epicondylitis', 'inner elbow pain', 'forearm flexor pain'],
    region: 'elbow',
    shortDescription: 'Inflammation and tendinopathy of the wrist flexor tendons at the medial epicondyle of the humerus.',
    trainerProtocol: 'Use neutral or slightly open grip; avoid heavy loaded wrist flexion or excessive forearm pronation under load; use lifting straps on heavy deadlifts/pulls.',
    blacklistedExercises: [
      'Barbell Wrist Flexion Curl',
      'Heavy Supinated Chin-Up',
      'Barbell Preacher Curl (Extreme Supination Shear)',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Barbell Preacher Curl',
        replacement: 'Incline Neutral-Grip Dumbbell Hammer Curl',
        rationale: 'Shifts load off medial epicondyle into the brachialis and brachioradialis with zero supination stress.',
        coachingCue: 'Keep palms facing inward throughout the curl; thumbs up, heads vertical.',
      },
      {
        targetExerciseOrPattern: 'Supinated Chin-Up',
        replacement: 'Neutral-Grip Lat Pulldown or Neutral-Grip Pull-Up',
        rationale: 'Parallel handles align the forearm bones in a neutral position, eliminating medial epicondyle torque.',
        coachingCue: 'Grip parallel handles; pull elbows down toward hips with neutral wrists.',
      },
    ],
    coachingCues: [
      'Use parallel / neutral grip handles on all pulling and curling movements.',
      'Do not curl the wrists inward during rows or pulls.',
      'Allow lifting straps to take the gripping strain on heavy deadlifts and rows.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Lacrosse Ball Forearm Flexors (Inner Forearm) (60s)', 'Wrist Extensor & Pronator Teres Release (45s)'],
      activateDynamic: ['Reverse Tyler Twist with FlexBar or Light Dumbbell (10 reps)', 'Neutral-Grip Cable Scapular Pull (12 reps)'],
    },
  },

  jumpers_knee: {
    id: 'jumpers_knee',
    name: "Jumper's Knee (Patellar Tendinopathy)",
    commonAliases: ['jumpers knee', 'patellar tendonitis', 'patellar tendinopathy', 'inferior pole patellar pain'],
    region: 'knee',
    shortDescription: 'Degenerative micro-tearing and tendinopathy of the patellar tendon right below the kneecap from deceleration and repetitive jumping.',
    trainerProtocol: 'Eliminate ballistic jump decelerations; program heavy slow eccentric resistance (HSR) or isometric squats; preserve hip hinge dominance.',
    blacklistedExercises: [
      'Depth Jumps / Drop Jumps (High Deceleration Shear)',
      'Plyometric Box Jumps',
      'Sissy Squats (Extreme Anterior Lever)',
      'Fast Eccentric Squats',
      'Seated Leg Extension',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Depth Jumps',
        replacement: 'Isometric Spanish Squats (45s Hold @ 60° Knee Flexion)',
        rationale: 'Isometric loading produces profound pain relief (cortical inhibition) and tendon remodeling with zero impact shear.',
        coachingCue: 'Keep shins perpendicular to the floor; sit back into the looped band.',
      },
      {
        targetExerciseOrPattern: 'Plyometric Box Jumps',
        replacement: 'Trap Bar Deadlift (High Handles) & Romanian Deadlift',
        rationale: 'Builds explosive lower-body power while redirecting force vectors into the posterior hip complex.',
        coachingCue: 'Hinge back forcefully; drive floor away through heels.',
      },
      {
        targetExerciseOrPattern: 'Seated Leg Extension',
        replacement: 'Decline Slant Board Squat (Slow 4-0-4 Tempo)',
        rationale: 'Provides controlled mechanical loading for tendon remodeling without ballistic deceleration.',
        coachingCue: 'Lower with a slow 4-second count; keep knees tracking straight.',
      },
    ],
    coachingCues: [
      'Strict slow eccentric tempo (4-second lowering) to stimulate collagen synthesis.',
      'Never allow knees to cave inward or snap violently at lockout.',
      'Soft landings if performing any low-level hops; absorb through hips.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Rectus Femoris & Patellar Tendon Boundary (60s)', 'SMR Foam Roll Calves / Soleus (60s)'],
      activateDynamic: ['Isometric Wall Sit with Knee Adduction Ball Squeeze (45s)', 'Terminal Knee Extension (TKE) with Heavy Band (15 reps)'],
    },
    cardioModifications: {
      avoidModalities: ['outdoor-running', 'jump-rope', 'stairmaster'],
      recommendedModalities: ['stationary-bike', 'rowing-machine', 'swimming'],
      rationale: 'Avoid high-impact plyometric or running decelerations; prioritize smooth concentric cycling.',
    },
  },

  it_band_syndrome: {
    id: 'it_band_syndrome',
    name: 'IT Band Syndrome (Iliotibial Band Friction Syndrome)',
    commonAliases: ['it band', 'itbs', 'iliotibial band syndrome', 'lateral knee pain', 'it band friction'],
    region: 'knee',
    shortDescription: 'Friction of the distal IT band over the lateral femoral epicondyle, driven by weak gluteus medius and excessive internal femoral rotation.',
    trainerProtocol: 'Strengthen gluteus medius and external rotators; avoid repetitive high-stride running and wide stance squats with knee cave; foam roll TFL and glute max (DO NOT roll the IT band directly).',
    blacklistedExercises: [
      'Downhill Running / High-Incline Sprints',
      'Wide Stance Squats with Knee Valgus',
      'Crossover Walking Lunges',
      'Direct Foam Rolling Over Distal IT Band (Aggravates Bursa)',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Crossover Walking Lunges',
        replacement: 'Lateral Band Walk & Monster Walk',
        rationale: 'Directly fires gluteus medius and minimus in frontal plane without rotational friction across the knee.',
        coachingCue: 'Keep toes straight ahead and maintain tension on the band throughout every step.',
      },
      {
        targetExerciseOrPattern: 'Wide Stance Squats',
        replacement: 'Goblet Squat with Mini-Band Above Knees',
        rationale: 'Band cues active glute external rotation, keeping the knee aligned and preventing lateral band friction.',
        coachingCue: 'Push out gently against the band; keep knees tracking directly over outer shoelaces.',
      },
    ],
    coachingCues: [
      'Never foam roll the IT band directly; roll the tensor fasciae latae (TFL) at the hip and gluteus maximus instead.',
      'Keep knees pushed outward against band tension during squats and bridges.',
      'Shorten stride length and increase cadence on walking or cardio.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Tensor Fasciae Latae (TFL) at Hip (60s)', 'SMR Foam Roll Gluteus Maximus & Piriformis (60s)'],
      activateDynamic: ['Side-Lying Hip Abduction with Toe Pointed Slightly Down (15 reps/side)', 'Standing Banded Clamshell / Monster Walk (15 reps)'],
    },
    cardioModifications: {
      avoidModalities: ['outdoor-running', 'treadmill'],
      recommendedModalities: ['swimming', 'rowing-machine', 'elliptical'],
      rationale: 'Avoid repetitive downhill or high-stride running until hip abduction strength is restored.',
    },
  },

  shin_splints: {
    id: 'shin_splints',
    name: 'Shin Splints (Medial Tibial Stress Syndrome / MTSS)',
    commonAliases: ['shin splints', 'mtss', 'medial tibial stress', 'shin pain', 'tibia pain'],
    region: 'foot_ankle',
    shortDescription: 'Exercise-induced pain along the posteromedial tibial border caused by repetitive tibial bending stress and soleus/tibialis posterior traction.',
    trainerProtocol: 'Deload high-impact running immediately; strengthen tibialis anterior and deep calf (soleus); improve ankle dorsiflexion; program non-impact metabolic conditioning.',
    blacklistedExercises: [
      'High-Impact Sprint Intervals',
      'Repetitive Jump Rope',
      'Bounding Plyometrics on Hard Floors',
      'Outdoor Concrete Running',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'High-Impact Sprint Intervals',
        replacement: 'Assault / Air Bike Sprint Intervals or Concept2 Rower Intervals',
        rationale: 'Delivers equal or superior VO2 peak and EPOC stimulus with zero impact shock to the tibia.',
        coachingCue: 'Drive with full whole-body power through pedals and handles; zero ground impact shock.',
      },
      {
        targetExerciseOrPattern: 'Jump Rope',
        replacement: 'Standing Tibialis Anterior Wall Raises & Seated Soleus Calf Raises',
        rationale: 'Strengthens the shock-absorbing musculature of the lower leg to tolerate future impact.',
        coachingCue: 'Pull toes up toward the ceiling with a hard 1-second pause at the top.',
      },
    ],
    coachingCues: [
      'Prioritize soft surfaces or non-impact conditioning until tibial palpation is pain-free.',
      'Focus on full-foot ground contacts rather than aggressive forefoot slap.',
      'Strengthen both front (tibialis) and back (soleus) lower leg compartments.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Deep Calf & Soleus (Avoid Direct Tibial Bone) (60s)', 'Plantar Fascia Lacrosse Ball Roll (60s)'],
      activateDynamic: ['Standing Tibialis Raises Against Wall (20 reps)', 'Single-Leg Balance with Ankle Alphabet (30s/side)'],
    },
    cardioModifications: {
      avoidModalities: ['outdoor-running', 'jump-rope', 'treadmill'],
      recommendedModalities: ['assault-bike', 'rowing-machine', 'swimming', 'stationary-bike'],
      rationale: 'Completely eliminate running impact shock until acute inflammation resolves; use assault bike or rower.',
    },
  },

  plantar_fasciitis: {
    id: 'plantar_fasciitis',
    name: 'Plantar Fasciitis (Plantar Heel Pain)',
    commonAliases: ['plantar fasciitis', 'heel spur', 'plantar heel pain', 'arch pain', 'morning heel pain'],
    region: 'foot_ankle',
    shortDescription: 'Degenerative irritation and mechanical overload of the plantar fascia insertion at the calcaneus, characterized by sharp morning heel pain.',
    trainerProtocol: 'Avoid barefoot training and aggressive calf stretches under high load; strengthen intrinsic foot muscles; mobilize gastroc/soleus complex; use cushioned supportive footwear.',
    blacklistedExercises: [
      'Barefoot Kettlebell Work / Barefoot Squatting',
      'Deficit Calf Raises with Extreme End-Range Stretch',
      'Repetitive Box Jumps / Jump Rope',
      'Incline Hill Running',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Deficit Calf Raises',
        replacement: 'High-Load Flat-Ground Calf Raises with Big Toe Extension Towel (Rathleff Protocol)',
        rationale: 'Loads the plantar fascia windlass mechanism under controlled isometric/eccentric tension without micro-tearing.',
        coachingCue: 'Place rolled towel under big toe; rise up for 3s, hold 2s, lower for 3s on flat ground.',
      },
      {
        targetExerciseOrPattern: 'Jump Rope',
        replacement: 'Seated High-Resistance Rowing Machine Intervals',
        rationale: 'Maintains maximal anaerobic capacity while eliminating ground impact force across the arch.',
        coachingCue: 'Drive through the mid-foot against the footplate; keep heel anchored.',
      },
    ],
    coachingCues: [
      'Wear supportive, cushioned footwear during all training sessions; avoid going barefoot on hard surfaces.',
      'Do not perform ballistic jumping or sprinting on cold feet.',
      'Perform gentle plantar fascia mobilization before standing up after rest periods.',
    ],
    warmupAdditions: {
      inhibitSmr: ['Golf Ball / Lacrosse Ball Myofascial Release Under Plantar Arch (60s)', 'SMR Foam Roll Gastrocnemius & Soleus (60s)'],
      activateDynamic: ['Seated Towel Scrunches with Toes (15 reps)', 'Isometric Calf Raise on Flat Ground (30s hold)'],
    },
    cardioModifications: {
      avoidModalities: ['outdoor-running', 'treadmill', 'jump-rope', 'stairmaster'],
      recommendedModalities: ['rowing-machine', 'swimming', 'stationary-bike'],
      rationale: 'Transfer cardio conditioning to rowing or swimming to prevent repetitive arch strain.',
    },
  },

  rotator_cuff_impingement: {
    id: 'rotator_cuff_impingement',
    name: 'Rotator Cuff Strain / Subacromial Shoulder Impingement',
    commonAliases: ['rotator cuff', 'shoulder impingement', 'subacromial bursitis', 'supraspinatus', 'shoulder pain pressing'],
    region: 'shoulder',
    shortDescription: 'Compression and abrasion of the rotator cuff tendons (principally supraspinatus) beneath the coracoacromial arch during overhead arm elevation.',
    trainerProtocol: 'Train pressing exclusively within the scapular plane (30° anterior to frontal plane); avoid behind-the-neck movements and extreme internal rotation; activate lower traps and serratus anterior.',
    blacklistedExercises: [
      'Behind-the-Neck Barbell Press (Extreme External Rotation Shear)',
      'Behind-the-Neck Barbell Press',
      'Behind-the-Neck Pulldown',
      'Upright Barbell Rows (Internal Rotation + High Elevation)',
      'Upright Barbell Row',
      'Upright Row',
      'Deep Chest Dips (Anterior Glenohumeral Glide)',
      'Chest Dips',
      'Dumbbell Lateral Raise with Thumbs Pointed Down (Empty Can)',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Behind-the-Neck Barbell Press',
        replacement: 'Standing Neutral-Grip DB Overhead Press in Scapular Plane (30° Angle)',
        rationale: 'Opens the subacromial space, preventing supraspinatus tendon pinching and anterior capsule stretch.',
        coachingCue: 'Press slightly in front of your face with elbows angled at 45° in the scapular plane.',
      },
      {
        targetExerciseOrPattern: 'Upright Barbell Row',
        replacement: 'Half-Kneeling Landmine Press & Chest-Supported Incline Y-Raises',
        rationale: 'Fosters upward scapular rotation and lower trapezius activation without impingement.',
        coachingCue: 'Lead with thumbs up; squeeze lower shoulder blades down and back.',
      },
      {
        targetExerciseOrPattern: 'Chest Dips',
        replacement: 'Push-Up with Plus (Serratus Anterior Focus) / Floor Press',
        rationale: 'Floor limits shoulder hyperextension, preventing anterior humeral head glide and capsule irritation.',
        coachingCue: 'Lower until triceps lightly touch the floor, then press up with elbows at 45°.',
      },
      {
        targetExerciseOrPattern: 'Behind-the-Neck Pulldown',
        replacement: 'Front Lat Pulldown with Neutral Grip Handles',
        rationale: 'Allows humeral head to center cleanly in the glenoid fossa without extreme cervical flexion.',
        coachingCue: 'Pull bar or handles toward upper chest; keep ribs pinned down.',
      },
    ],
    coachingCues: [
      'Always press within the scapular plane (elbows angled 30–45° forward from your sides).',
      'Pack shoulders down and back into "back pockets" before initiating any pressing or rowing motion.',
      'Thumbs-up orientation on all lateral and diagonal raises (full can position).',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Lacrosse Ball Pectoralis Minor & Anterior Deltoid (60s)', 'SMR Foam Roll Latissimus Dorsi & Teres Major (60s)'],
      activateDynamic: ['Band Pull-Aparts with External Rotation (15 reps)', 'Prone Scapular Y-T-W Raises on Incline Bench (10 reps each)'],
    },
  },

  lumbar_strain_disc: {
    id: 'lumbar_strain_disc',
    name: 'Lower Back Pain / Lumbar Strain / Disc Condition',
    commonAliases: ['lower back pain', 'lumbar disc', 'sciatica', 'back spasm', 'herniated disc', 'l5 s1', 'lumbar strain'],
    region: 'spine',
    shortDescription: 'Mechanical lumbar spine irritation, disc bulge, or paraspinal muscle strain aggravated by loaded spinal flexion and axial compressive shear.',
    trainerProtocol: 'Strict neutral spine enforcement; eliminate end-range lumbar flexion under axial loads; build 360° core cylinder stiffness using McGill Big 3; hip hinge from pelvis without lumbar rounding.',
    blacklistedExercises: [
      'Loaded Spinal Flexion (Jefferson Curls)',
      'Jefferson Curls',
      'Behind-the-Neck Good Mornings',
      'Good Mornings',
      'Roman Chair Hyper-Extensions (Hyperextension Shear)',
      'Roman Chair Hyper-Extensions',
      'Seated Torso Rotation Machine with Load',
      'Standing Barbell Good Morning',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Jefferson Curls',
        replacement: 'McGill Big 3 (Modified Curl-Up, Side Bridge, Quadruped Bird-Dog)',
        rationale: 'Builds 360° neuromuscular core cylinder stiffness without spinal flexion shear.',
        coachingCue: 'Maintain pristine neutral lumbar spine throughout all planes of motion.',
      },
      {
        targetExerciseOrPattern: 'Good Mornings',
        replacement: 'Trap Bar High-Handle Deadlift & Banded Hip Hinge',
        rationale: 'Brings load closer to center of mass, reducing lumbar moment arm and shear forces by >40%.',
        coachingCue: 'Pack lats into back pockets; push hips straight back like touching a wall behind you.',
      },
      {
        targetExerciseOrPattern: 'Roman Chair Hyper-Extensions',
        replacement: 'Prone Quadruped Bird-Dog with 5-Second Hold',
        rationale: 'Activates erector spinae and multifidi with minimal compressive load across the lumbar motion segments.',
        coachingCue: 'Reach arm and opposite heel long without arching lower back; brace core.',
      },
    ],
    coachingCues: [
      'Strict neutral spine: spine remains motionless while motion occurs entirely at the hip joints.',
      'Brace core 360° as if preparing to take a punch before lifting any weight.',
      'Never round lower back when picking up or racking dumbbells from the floor.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Glutes & Piriformis (60s)', 'SMR Foam Roll Quadriceps & Hip Flexors (60s)'],
      activateDynamic: ['McGill Quadruped Bird-Dog (8 reps/side with 5s hold)', 'McGill Side Plank from Knees (30s hold/side)'],
    },
  },

  hamstring_strain: {
    id: 'hamstring_strain',
    name: 'Hamstring Strain / High Hamstring Tendinopathy',
    commonAliases: ['hamstring strain', 'pulled hamstring', 'hamstring tear', 'high hamstring tendinopathy', 'proximal hamstring'],
    region: 'hip',
    shortDescription: 'Tendon or muscle belly strain typically occurring at the biceps femoris during high-speed eccentric deceleration or over-lengthening.',
    trainerProtocol: 'Avoid heavy end-range lengthened eccentric stretching under load; program progressive isometric hamstring holds and closed-chain bridges; strengthen glutes.',
    blacklistedExercises: [
      'Heavy Stiff-Legged Barbell Deadlifts with Rounded Lumbar',
      'Maximal Sprinting from Cold Start',
      'Deficit Hamstring Stretches with Extreme Hip Flexion',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Heavy Stiff-Legged Barbell Deadlifts',
        replacement: 'Swiss Ball Hamstring Curls & Double-Leg Glute Bridges',
        rationale: 'Loads the hamstrings at shortened to mid-range joint angles without tensile over-stretch at the ischial tuberosity.',
        coachingCue: 'Lift hips into bridge first, then curl ball toward heels while keeping hips high.',
      },
      {
        targetExerciseOrPattern: 'Maximal Sprinting',
        replacement: 'Incline Treadmill Power Walking (10–12% Incline) & Sled Pushes',
        rationale: 'High metabolic conditioning without high-velocity terminal knee extension eccentric whip.',
        coachingCue: 'Drive through the ball of foot; lean into the sled or incline with steady posture.',
      },
    ],
    coachingCues: [
      'Maintain a soft bend in knees during all deadlift variations; never lock knees out rigidly.',
      'Stop hip hinge at the point of hamstring tension, never force end-range stretch.',
      'Squeeze glutes at the top of every hip extension to decompress the hamstring origin.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Hamstring Muscle Belly (Avoid Ischial Tuberosity) (60s)', 'SMR Foam Roll Quadriceps (60s)'],
      activateDynamic: ['Single-Leg Glute Bridge Hold (12 reps/side with 3s hold)', 'Banded Good Morning with Light Mini-Band (15 reps)'],
    },
  },

  achilles_tendinopathy: {
    id: 'achilles_tendinopathy',
    name: 'Achilles Tendinopathy (Midportion or Insertional)',
    commonAliases: ['achilles tendinopathy', 'achilles tendonitis', 'achilles pain', 'heel cord pain'],
    region: 'foot_ankle',
    shortDescription: 'Degeneration and pain in the Achilles tendon driven by rapid eccentric stretch-shortening cycles or excessive ankle dorsiflexion under load.',
    trainerProtocol: 'Avoid deep ankle dorsiflexion deficits; program slow eccentric-concentric flat-ground calf loading; transition from plyometrics to low-impact concentric power.',
    blacklistedExercises: [
      'Deficit Calf Drops (Extreme Ankle Dorsiflexion)',
      'Depth Jumps and Plyometric Bounding',
      'Aggressive Incline Sprinting',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Deficit Calf Drops',
        replacement: 'Flat-Ground Heavy Slow Resistance Calf Raises (3-2-3 Tempo)',
        rationale: 'Limits tensile impingement at the retrocalcaneal bursa while stimulating tendon remodeling.',
        coachingCue: 'Rise up on toes on flat ground for 3 seconds, hold 2 seconds, lower for 3 seconds.',
      },
      {
        targetExerciseOrPattern: 'Depth Jumps',
        replacement: 'Seated Calf Raise Machine & Hex Bar Deadlifts',
        rationale: 'Isolates soleus and lower leg strength with zero ballistic shock to the Achilles tendon.',
        coachingCue: 'Control the movement completely; no bouncing at the bottom of the rep.',
      },
    ],
    coachingCues: [
      'Perform all calf training on flat ground rather than hanging off a ledge.',
      'No bouncing or spring-loaded reversals; use deliberate 3-second tempos.',
      'Ensure running shoes have an appropriate heel-to-toe drop (avoid zero-drop shoes during acute flare-ups).',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Gastrocnemius & Soleus (60s)', 'Plantar Fascia Foot Roll (45s)'],
      activateDynamic: ['Isometric Straight-Leg Calf Raise Hold (30s hold)', 'Banded Ankle Dorsiflexion Resisted Pulls (15 reps)'],
    },
    cardioModifications: {
      avoidModalities: ['outdoor-running', 'jump-rope', 'stairmaster'],
      recommendedModalities: ['stationary-bike', 'swimming', 'rowing-machine'],
      rationale: 'Replace high-impact foot strike with smooth concentric pedal rotation; position pedal under mid-foot.',
    },
  },

  ankle_sprain_instability: {
    id: 'ankle_sprain_instability',
    name: 'Ankle Sprain / Chronic Lateral Ankle Instability',
    commonAliases: ['ankle sprain', 'twisted ankle', 'rolled ankle', 'lateral ankle pain', 'chronic ankle instability'],
    region: 'foot_ankle',
    shortDescription: 'Stretching or tearing of lateral ankle ligaments (ATFL/CFL) resulting in proprioceptive deficits and recurrent inversion instability.',
    trainerProtocol: 'Strengthen ankle evertors (peroneals); restore multi-planar proprioception and balance; avoid agility cuts on uneven surfaces without supportive footwear/taping.',
    blacklistedExercises: [
      'Rapid Lateral Cutting Agility Drills',
      'Single-Leg Plyometrics on Unstable Foam Pads',
      'Uncontrolled Multi-Directional Bounding',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Rapid Lateral Cutting',
        replacement: 'Single-Leg Balance on Firm Surface with Reach / Star Excursion',
        rationale: 'Retrains mechanoreceptors and proprioceptive firing without inversion torque risk.',
        coachingCue: 'Stand tall on single foot; balance barefoot while lightly tapping opposite toe in 4 compass directions.',
      },
      {
        targetExerciseOrPattern: 'Single-Leg Plyometrics',
        replacement: 'Controlled Box Step-Up with High Knee Hold',
        rationale: 'Builds unilateral stance stability and glute medius activation with stable ground interface.',
        coachingCue: 'Step onto box firmly with whole foot; lock knee and hip at top and hold balance for 2 seconds.',
      },
    ],
    coachingCues: [
      'Tripod foot contact: press big toe, pinky toe, and heel firmly into the ground.',
      'Maintain strong arches; do not allow ankles to roll inward or outward.',
      'Progress balance from firm ground before introducing any soft or dynamic surfaces.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Peroneal Muscle Group (Outer Lower Leg) (60s)', 'SMR Foam Roll Calf (60s)'],
      activateDynamic: ['Banded Ankle Eversion Resisted Push (15 reps/side)', 'Single-Leg Stance Eyes Open/Closed (30s/side)'],
    },
  },

  hip_impingement_fai: {
    id: 'hip_impingement_fai',
    name: 'Hip Impingement (FAI) / Acetabular Labral Irritation',
    commonAliases: ['hip impingement', 'fai', 'femoroacetabular impingement', 'hip labrum', 'pinching in hip squat'],
    region: 'hip',
    shortDescription: 'Abnormal contact between femoral head and acetabular rim during deep hip flexion and internal rotation, causing anterior groin pinching.',
    trainerProtocol: 'Limit squat depth to 90° or above-parallel; adopt a slightly wider, externally rotated stance; avoid deep aggressive hip flexor stretching into pain; prioritize posterior chain.',
    blacklistedExercises: [
      'Deep "Ass-to-Grass" Squats with Knee Pinch',
      'High Box Step-Ups (Hip Flexion > 90°)',
      'Extreme Internal Rotation Hip Stretches',
      'Aggressive Olympic Snatch Catch Positions',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Deep Squats',
        replacement: 'Box Squat to Parallel with Wider Stance (Knees Flared 30°)',
        rationale: 'Parallel box prevents anterior femoral head abutment against the acetabular rim.',
        coachingCue: 'Sit back to the box; keep knees pushed outward over toes to clear room in the hip socket.',
      },
      {
        targetExerciseOrPattern: 'High Box Step-Ups',
        replacement: 'Low Box Step-Up (8–12 Inch Box) & Barbell Hip Thrust',
        rationale: 'Keeps hip flexion under 90° while maximizing gluteus maximus recruitment.',
        coachingCue: 'Step onto low box, drive straight up without leaning forward.',
      },
    ],
    coachingCues: [
      'Never push through a sharp "pinch" in the front of your hip crease.',
      'Angle toes outward 20–30° to open up the hip joint capsule.',
      'Squat only to the depth where you can maintain a neutral pelvis without butt wink.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Lacrosse Ball Piriformis & Deep Rotators (60s)', 'SMR Foam Roll Adductors (Inner Thigh) (60s)'],
      activateDynamic: ['Quadruped Hip Circles (CARs) (6 controlled reps/side)', 'Banded Glute Bridge with External Rotation (15 reps)'],
    },
  },

  cervical_strain_neck: {
    id: 'cervical_strain_neck',
    name: 'Cervical Spine Strain / "Tech Neck" / Upper Trapezius Hypertonicity',
    commonAliases: ['tech neck', 'cervical strain', 'neck strain', 'upper trap pain', 'neck stiffness', 'forward head posture'],
    region: 'spine',
    shortDescription: 'Postural overload of the cervical extensors and upper trapezius accompanied by deep neck flexor weakness and forward head carriage.',
    trainerProtocol: 'Inhibit upper traps and levator scapulae; strengthen deep cervical flexors and lower trapezius; avoid heavy shrugs and overhead pressing that triggers neck craning.',
    blacklistedExercises: [
      'Heavy Barbell Shrugs with Head Jutting Forward',
      'Behind-the-Neck Barbell Press',
      'Crunches with Hands Pulling on Neck',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Heavy Barbell Shrugs',
        replacement: 'Chest-Supported Incline Dumbbell Row with Neutral Grip & Chin Tuck',
        rationale: 'Targets middle and lower trapezius and rhomboids while keeping the cervical spine unloaded and relaxed.',
        coachingCue: 'Retract shoulder blades down and back; keep chin tucked as if making a subtle double chin.',
      },
      {
        targetExerciseOrPattern: 'Crunches with Hands Behind Neck',
        replacement: 'Dead Bug & Pallof Press',
        rationale: 'Develops anterior core bracing without cervical spine flexion shear or arm-assisted neck pulling.',
        coachingCue: 'Keep back of head resting calmly on mat; press lower back flat into floor.',
      },
    ],
    coachingCues: [
      'Pack chin into a neutral double-chin posture during all lifting.',
      'Keep eyes focused straight ahead; do not look up at the ceiling during heavy squats or deadlifts.',
      'Keep shoulder blades depressed away from ears during presses and rows.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Lacrosse Ball Upper Trapezius & Levator Scapulae (60s)', 'Pectoralis Minor Doorway Stretch (30s)'],
      activateDynamic: ['Supine Chin Tucks with 5s Hold (10 reps)', 'Prone Cobra on Floor (Hold 20s, 3 sets)'],
    },
  },

  wrist_strain_carpal: {
    id: 'wrist_strain_carpal',
    name: 'Wrist Sprain / Carpal Tunnel / Extension Discomfort',
    commonAliases: ['wrist pain', 'wrist sprain', 'carpal tunnel', 'wrist tendonitis', 'wrist extension pain', 'tfcc'],
    region: 'wrist',
    shortDescription: 'Pain in the wrist joint or carpal tunnel provoked by loaded end-range wrist extension (e.g. flat push-ups, barbell bench).',
    trainerProtocol: 'Use neutral-grip handles or dumbbells for pressing; avoid loaded wrist hyperextension; use wrist wraps for heavy loading.',
    blacklistedExercises: [
      'Flat Palms-on-Floor Push-Ups (Hyperextension Shear)',
      'Straight Barbell Biceps Curls with Rigid Wrist',
      'Front Rack Barbell Squats with Hyperextended Wrists',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Flat Palms-on-Floor Push-Ups',
        replacement: 'Push-Ups on Hex Dumbbells or Push-Up Handles',
        rationale: 'Maintains perfectly straight neutral wrist alignment, eliminating carpal tunnel compression.',
        coachingCue: 'Grip handles firmly; keep wrists completely straight with zero backward bend.',
      },
      {
        targetExerciseOrPattern: 'Straight Barbell Biceps Curls',
        replacement: 'Standing Dumbbell Hammer Curl (Strict Neutral Grip, Palms Inward, Heads Vertical)',
        rationale: 'Eliminates wrist ulnar deviation and shear force across the triangular fibrocartilage complex (TFCC).',
        coachingCue: 'Strict neutral hammer grip: keep palms facing inward toward each other with strictly zero twisting or supination. Dumbbells remain oriented vertically with thumbs up.',
      },
    ],
    coachingCues: [
      'Always keep wrists stacked in neutral alignment over the forearm bones.',
      'Use hex dumbbells or handles for floor work instead of bending wrists flat.',
      'Squeeze handles firmly to activate forearm stabilizers.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Lacrosse Ball Forearm Flexors and Extensors (60s)', 'Gentle Prayer and Reverse Prayer Wrist Mobility (30s)'],
      activateDynamic: ['Fist Clenches with Open Finger Spread (15 reps)', 'Light Dumbbell Neutral Wrist Isometric Hold (20s)'],
    },
  },

  groin_adductor_strain: {
    id: 'groin_adductor_strain',
    name: 'Groin Strain / Adductor Tendinopathy',
    commonAliases: ['groin strain', 'pulled groin', 'adductor strain', 'inner thigh pain', 'adductor longus'],
    region: 'hip',
    shortDescription: 'Strain of the adductor longus or magnus resulting from sudden changes in direction or extreme wide-stance hip loading.',
    trainerProtocol: 'Avoid ultra-wide sumo stances and lateral lunges during acute phases; program sagittal plane squats; introduce Copenhagen adductor regressions.',
    blacklistedExercises: [
      'Sumo Barbell Deadlifts with Wide Stance',
      'Wide-Stance Sumo Squats',
      'Aggressive Lateral Lunges with Deep Stretch',
    ],
    prescribedSubstitutions: [
      {
        targetExerciseOrPattern: 'Sumo Barbell Deadlift',
        replacement: 'Conventional Stance Trap Bar Deadlift',
        rationale: 'Positions feet hip-width apart in the sagittal plane, taking shear tension off the adductor origins.',
        coachingCue: 'Keep feet hip-width apart, knees tracking straight ahead.',
      },
      {
        targetExerciseOrPattern: 'Lateral Lunges',
        replacement: 'Copenhagen Plank Regression (Knee-Supported) & Parallel Squats',
        rationale: 'Builds isometric adductor resilience under controlled leverage without dynamic eccentric tear risk.',
        coachingCue: 'Support top leg at the knee on bench; hold body in straight line for 15 seconds.',
      },
    ],
    coachingCues: [
      'Keep feet shoulder-width or narrower during squats and deadlifts.',
      'Avoid wide-split stances until groin tenderness is completely resolved.',
      'Squeeze glutes and abdominals to stabilize the pubic symphysis.',
    ],
    warmupAdditions: {
      inhibitSmr: ['SMR Foam Roll Adductor Complex (Inner Thigh) (60s)', 'SMR Foam Roll TFL and Glutes (60s)'],
      activateDynamic: ['Supine Glute Bridge with Ball Squeeze Between Knees (12 reps with 3s hold)', 'Controlled Lateral Monster Walks (12 reps/side)'],
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES FOR PARSING, SERIALIZING, AND ACCESSING SPORTS INJURIES
// ─────────────────────────────────────────────────────────────────────────────

export function getAllSportsInjuries(): SportsInjuryDefinition[] {
  return Object.values(COMMON_SPORTS_INJURIES)
}

export function getSportsInjuryById(id: string): SportsInjuryDefinition | undefined {
  return COMMON_SPORTS_INJURIES[id]
}

export function getSportsInjuriesByRegion(): Record<SportsInjuryRegion, SportsInjuryDefinition[]> {
  const grouped: Record<SportsInjuryRegion, SportsInjuryDefinition[]> = {
    knee: [],
    elbow: [],
    shoulder: [],
    spine: [],
    hip: [],
    foot_ankle: [],
    wrist: [],
  }

  for (const injury of Object.values(COMMON_SPORTS_INJURIES)) {
    grouped[injury.region].push(injury)
  }

  return grouped
}

/**
 * Parses injuries and custom notes from an injuries_limitations text field.
 * Handles both the structured format `[injuries: id1, id2] Notes...`
 * and natural language text (e.g. "client has bad runner's knee and tennis elbow").
 */
export function parseInjuriesFromText(rawText: string | null | undefined): {
  selectedInjuryIds: string[]
  customNotes: string
} {
  if (!rawText || !rawText.trim()) {
    return { selectedInjuryIds: [], customNotes: '' }
  }

  const text = rawText.trim()
  const selectedIds = new Set<string>()
  let remainingNotes = text

  // 1. Check for structured tag syntax: [injuries: id1, id2, ...]
  const tagMatch = remainingNotes.match(/\[(?:injuries|sports_injuries):\s*([^\]]+)\]/i)
  if (tagMatch) {
    const ids = tagMatch[1]
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    for (const id of ids) {
      if (COMMON_SPORTS_INJURIES[id]) {
        selectedIds.add(id)
      }
    }
    remainingNotes = remainingNotes.replace(tagMatch[0], '').trim()
  }

  // 2. Fuzzy match aliases in natural language
  const lowerText = text.toLowerCase()
  const normalizedLowerText = lowerText.replace(/['’]/g, '')
  for (const [id, def] of Object.entries(COMMON_SPORTS_INJURIES)) {
    if (selectedIds.has(id)) continue

    // Check id itself (replacing underscores with spaces or matches)
    const idSpaced = id.replace(/_/g, ' ')
    if (normalizedLowerText.includes(idSpaced) || normalizedLowerText.includes(id)) {
      selectedIds.add(id)
      continue
    }

    // Check common aliases
    for (const alias of def.commonAliases) {
      const normAlias = alias.toLowerCase().replace(/['’]/g, '')
      if (normalizedLowerText.includes(normAlias)) {
        selectedIds.add(id)
        break
      }
    }
  }

  // Clean up any "Injuries: ..." prefixes in legacy text
  remainingNotes = remainingNotes
    .replace(/^injuries:\s*/i, '')
    .replace(/^notes:\s*/i, '')
    .trim()

  return {
    selectedInjuryIds: Array.from(selectedIds),
    customNotes: remainingNotes,
  }
}

/**
 * Serializes selected injury IDs and custom notes into a clean, backward-compatible string.
 * Format: `[injuries: runners_knee, tennis_elbow] Notes: Customer notes here`
 */
export function serializeInjuriesWithNotes(injuryIds: string[], notes?: string | null): string {
  const uniqueIds = Array.from(new Set(injuryIds.filter(id => Boolean(COMMON_SPORTS_INJURIES[id]))))
  const cleanNotes = (notes || '').trim()

  if (uniqueIds.length === 0 && !cleanNotes) {
    return ''
  }

  if (uniqueIds.length === 0) {
    return cleanNotes
  }

  const injuryNames = uniqueIds
    .map(id => COMMON_SPORTS_INJURIES[id]?.name || id)
    .join(', ')

  const tagPart = `[injuries: ${uniqueIds.join(', ')}]`

  if (!cleanNotes) {
    return `${tagPart} (${injuryNames})`
  }

  return `${tagPart} (${injuryNames}) — Notes: ${cleanNotes}`
}

/**
 * Returns aggregated injury augmentations for a list of injury IDs.
 */
export function getInjuryAugmentations(injuryIds: string[]): {
  substitutions: PrescribedInjurySubstitution[]
  coachingCues: string[]
  warmupSmr: string[]
  warmupDynamic: string[]
  avoidCardioModalities: string[]
  recommendedCardioModalities: string[]
  trainerProtocols: string[]
} {
  const substitutions: PrescribedInjurySubstitution[] = []
  const coachingCues: string[] = []
  const warmupSmr: string[] = []
  const warmupDynamic: string[] = []
  const avoidCardioModalities: string[] = []
  const recommendedCardioModalities: string[] = []
  const trainerProtocols: string[] = []

  for (const id of injuryIds) {
    const def = COMMON_SPORTS_INJURIES[id]
    if (!def) continue

    substitutions.push(...def.prescribedSubstitutions)
    coachingCues.push(...def.coachingCues)
    warmupSmr.push(...def.warmupAdditions.inhibitSmr)
    warmupDynamic.push(...def.warmupAdditions.activateDynamic)
    trainerProtocols.push(`${def.name}: ${def.trainerProtocol}`)

    if (def.cardioModifications) {
      avoidCardioModalities.push(...def.cardioModifications.avoidModalities)
      recommendedCardioModalities.push(...def.cardioModifications.recommendedModalities)
    }
  }

  return {
    substitutions,
    coachingCues: Array.from(new Set(coachingCues)),
    warmupSmr: Array.from(new Set(warmupSmr)),
    warmupDynamic: Array.from(new Set(warmupDynamic)),
    avoidCardioModalities: Array.from(new Set(avoidCardioModalities)),
    recommendedCardioModalities: Array.from(new Set(recommendedCardioModalities)),
    trainerProtocols,
  }
}
