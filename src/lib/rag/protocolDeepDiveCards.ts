/**
 * Forge Athletic — Granular Sports-Science Coaching Protocol Cards
 *
 * Clean-room, original coaching passages authored by Forge Athletic covering
 * high-frequency member training adjustments, acute variable matrices, joint comfort
 * adaptations, desk posture resets, GLP-1 muscle preservation, and express workouts.
 */

export interface GranularProtocolCard {
  id: string
  title: string
  category: string
  goalCategory: string
  nasmOptPhases: number[]
  contentPassage: string
  keyConcepts: string[]
}

export const GRANULAR_COACHING_PROTOCOL_CARDS: GranularProtocolCard[] = [
  {
    id: 'proto_opt_acute_variables_matrix',
    title: 'OPT™ Phases 1–5 Tempo, Rest & Load Matrix',
    category: 'Periodization & Acute Variables',
    goalCategory: 'Sports Science Foundation',
    nasmOptPhases: [1, 2, 3, 4, 5],
    contentPassage:
      'Acute training variables across the 5-Phase OPT™ progression: Phase 01 Stabilization Endurance prescribes 12–20 reps at 50–70% 1RM with a 4-2-1-0 slow eccentric tempo and 0–90s rest to fortify connective tissue and core stability. Phase 02 Strength Endurance pairs a biomechanical prime mover (8–12 reps @ 2-0-2-0) immediately with a stabilization superset (8–12 reps @ 4-2-1-0) and 60s rest. Phase 03 Muscular Development targets hypertrophy with 6–12 reps at 75–85% 1RM, 2-0-2-0 controlled tempo, and 60–90s rest. Phase 04 Maximal Strength uses 1–5 reps at 85–100% 1RM with explosive concentric intent and 3–5 min ATP/CP recovery. Phase 05 Power pairs heavy strength (1–5 reps @ 85%+ 1RM) with high-velocity plyometrics or medicine ball throws (8–10 reps @ X-0-X-0) and 1–2 min between pairs.',
    keyConcepts: ['Tempo Prescription', 'Rest Intervals', 'Phase Progression', 'Acute Variables'],
  },
  {
    id: 'proto_hip_pinch_squat_depth',
    title: 'Squat Depth & Tight Hip Comfort Calibration',
    category: 'Corrective Exercise Protocol',
    goalCategory: 'Corrective Exercise & Injury Prevention',
    nasmOptPhases: [1, 2, 3],
    contentPassage:
      'When hips feel tight or pinchy during squats, stop 2 inches above the depth where the pelvis tucks under (posterior pelvic tilt / butt wink) or anterior hip pinching begins. Widen stance slightly (shoulder-width plus 10–15° toe-out), elevate heels 0.5–1 inch on small plates if ankle dorsiflexion is restricted, and switch to Counterbalance Goblet Squats or Box Squats at a 3-1-1-0 tempo while exhaling smoothly out of the bottom.',
    keyConcepts: ['Squat Depth', 'Hip Mobility', 'Heel-Elevated Goblet Squat', 'Box Squat'],
  },
  {
    id: 'proto_wrist_neutral_grip_pressing',
    title: 'Sore Wrist & Neutral-Grip Joint Protection',
    category: 'Corrective Exercise Protocol',
    goalCategory: 'Corrective Exercise & Injury Prevention',
    nasmOptPhases: [1, 2, 3, 4],
    contentPassage:
      'When a wrist feels sore or stiff under load, eliminate forced wrist extension (such as flat palms on floor push-ups, front-rack barbells, or straight-bar curls). Stack knuckles directly above the radius and ulna using neutral-grip (palms facing each other) dumbbells, push-up handles/hex-dumbbell grips on the floor, landmine presses, or cable straps/cuffs so force travels cleanly through the forearm without carpal compression.',
    keyConcepts: ['Neutral-Grip Pressing', 'Wrist Alignment', 'Dumbbell Push-Up Handles', 'Joint Comfort'],
  },
  {
    id: 'proto_shoulder_pinch_pressing_regression',
    title: 'Pinchy Shoulder & Scapular Plane Pressing',
    category: 'Corrective Exercise Protocol',
    goalCategory: 'Corrective Exercise & Injury Prevention',
    nasmOptPhases: [1, 2, 3],
    contentPassage:
      'If overhead or flat horizontal pressing feels pinchy in the front or top of the shoulder, immediately avoid flared 90° elbows and behind-the-neck angles. Regress to a 30°–45° scapular-plane elbow path using Half-Kneeling Landmine Presses, High-Incline Neutral-Grip Dumbbell Presses, or Scapular Wall Slides, keeping ribs stacked down over the pelvis to preserve subacromial clearance.',
    keyConcepts: ['Scapular Plane', 'Landmine Press', 'Neutral-Grip Incline Press', 'Scapular Wall Slide'],
  },
  {
    id: 'proto_low_back_hinge_protection',
    title: 'Lower-Back Protection & Supported Hinge Swaps',
    category: 'Corrective Exercise Protocol',
    goalCategory: 'Corrective Exercise & Injury Prevention',
    nasmOptPhases: [1, 2, 3],
    contentPassage:
      'When the lower back feels fatigued, tight, or rated uncomfortable before leg or pull sessions, swap axial spinal hinges and unsupported bent-over rows for Chest-Supported Dumbbell Rows, Supine Glute Bridges, Hip Thrusts, and Dead Bugs. Establish 360° intra-abdominal bracing before every rep and maintain neutral lumbopelvic alignment without lumbar hyperextension at lockout.',
    keyConcepts: ['Lumbar Unloading', 'Chest-Supported Row', 'Glute Bridge', '360 Core Bracing'],
  },
  {
    id: 'proto_desk_neck_upper_crossed_reset',
    title: '2-Minute Desk Posture & Forward-Head Reset',
    category: 'Corrective Exercise Protocol',
    goalCategory: 'Corrective Exercise & Injury Prevention',
    nasmOptPhases: [1, 2],
    contentPassage:
      'Prolonged computer and phone posture shortens the pectoralis minor, upper trapezius, and levator scapulae while inhibiting deep cervical flexors and lower/middle trapezius. Perform a 2-minute reset before pressing or between meetings: (1) 30s doorway pectoral lengthen, (2) 8 slow Seated Chin Tucks (2-second hold), (3) 8 Seated Thoracic Extensions over chair back, and (4) 10 Band Pull-Aparts or Wall Angels with ribs down.',
    keyConcepts: ['Desk Posture Reset', 'Chin Tucks', 'Thoracic Extension', 'Upper Crossed Relief'],
  },
  {
    id: 'proto_express_15_20_min_density',
    title: '15–20 Minute Express Workout Compression',
    category: 'Workout Template',
    goalCategory: 'General Fitness & Longevity',
    nasmOptPhases: [1, 2, 3],
    contentPassage:
      'When short on time (15 to 20 minutes), preserve training stimulus without rushing rep quality: run a 2-minute dynamic mobility primer, then pair 2 to 3 compound movements in non-competing antagonist supersets (e.g., Goblet Squat + Chest-Supported Row, or Neutral-Grip Incline Press + Romanian Deadlift) for 2–3 focused working sets at RPE 7.5–8 with 30–45s transition rest.',
    keyConcepts: ['15-Minute Express', '20m Express Mode', 'Antagonist Supersets', 'Time-Efficient Training'],
  },
  {
    id: 'proto_hotel_travel_band_substitutions',
    title: 'Hotel, Travel & Resistance-Band Workout Swaps',
    category: 'Workout Template',
    goalCategory: 'General Fitness & Longevity',
    nasmOptPhases: [1, 2, 3],
    contentPassage:
      'When training in a hotel room, small apartment, or crowded gym where stations are taken, match the biomechanical movement pattern rather than skipping the session: replace Barbell Squats with Rear-Foot-Elevated Bulgarian Split Squats or Tempo 4-2-1-0 Goblet Squats; replace Lat Pulldowns with Door-Anchored Band Kneeling Pulldowns or Dumbbell Pullovers; replace Cable Rows with Staggered-Stance Single-Arm Rows or Band Rows with a 2-second peak squeeze.',
    keyConcepts: ['Travel Substitutions', 'Equipment Taken Swaps', 'Bulgarian Split Squat', 'Resistance Bands'],
  },
  {
    id: 'proto_glp1_lean_mass_protein_pacing',
    title: 'GLP-1 & Fat-Loss Lean Muscle Preservation',
    category: 'Nutrition & Supplementation',
    goalCategory: 'Weight Loss & Fat Oxidation',
    nasmOptPhases: [1, 2, 3],
    contentPassage:
      'During caloric deficits or GLP-1 therapy (semaglutide, tirzepatide), defending skeletal muscle mass and bone mineral density requires two non-negotiable anchors: progressive resistance training 2–4 days/week across major multi-joint patterns, and protein pacing of 1.6–2.2 g/kg ideal body weight distributed across 3–4 feedings of 30–40g high-leucine protein alongside steady electrolyte hydration.',
    keyConcepts: ['Lean Mass Defense', 'Protein Pacing 30-40g', 'GLP-1 Support', 'Resistance Training'],
  },
  {
    id: 'proto_sleep_debt_autoregulation',
    title: 'Poor Sleep & Low Readiness Autoregulation',
    category: 'Recovery & Regeneration',
    goalCategory: 'General Fitness & Longevity',
    nasmOptPhases: [1, 2, 3, 4, 5],
    contentPassage:
      'On days with under 6 hours of sleep, elevated life stress, or a Forge Readiness Index below 65, protect central nervous system and joint recovery by auto-regulating working weights down 10–15%, capping effort at RPE 7 (leaving 3 clean reps in reserve), avoiding spinal max-effort grinding, and prioritizing crisp eccentric tempo control plus nasal recovery breathing between sets.',
    keyConcepts: ['Autoregulation', 'Sleep Debt Adjustment', 'RPE 7 Cap', 'Recovery Session'],
  },
]
