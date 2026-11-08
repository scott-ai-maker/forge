import { GaaIconName } from '@/components/ui/GaaIcon'

export type TutorialAudience = 'client' | 'coach'

export interface TutorialStep {
  id: string
  title: string
  subtitle: string
  badge: string
  icon: GaaIconName
  image?: string
  description: string
  features: string[]
  proTip?: string
  deepLink?: string
  actionLabel?: string
}

export const CLIENT_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'client-train',
    title: 'Kinetic Workout Hub & Set Logger',
    subtitle: 'Step 1 of 6 · Performance Training Workspace',
    badge: 'Core Training',
    icon: 'barbell',
    image: '/images/pillar-training-crest.jpg',
    description:
      'Execute your personalized NASM OPT™ workouts with precise kinetic logging. Record completed weights, reps, and RPE effort while tracking your 1RM personal records in real time.',
    features: [
      'Log sets with instantaneous 1RM calculation and overload recommendations.',
      'Access the built-in Barbell Plate Calculator for Olympic barbell load breakdowns.',
      'Track rest intervals with auto-starting gym rest timers.',
    ],
    proTip: 'Tap the Plate Calculator icon next to any barbell exercise to calculate exact bumper plate configurations.',
    deepLink: '/dashboard/fitness?workspace=train',
    actionLabel: 'Open Training Workspace',
  },
  {
    id: 'client-tempo',
    title: 'Visual Precision Tempo Bar & Cadence HUD',
    subtitle: 'Step 2 of 6 · Time-Under-Tension Telemetry',
    badge: 'Kinetic Tempo',
    icon: 'clock',
    description:
      'Master the 4 phases of muscle contraction (Eccentric, Isometric Bottom, Concentric, Isometric Top) using the live visual pulse bar and optional audio metronome.',
    features: [
      'Live visual progress wave showing current repetition seconds and total Time-Under-Tension (TUT).',
      'Choose between Silent Visual Pulse, Soft Tick Metronome, or Coach Voice guidance.',
      'Eliminates audio clutter during high-focus lifts.',
    ],
    proTip: 'A tempo of 4-2-1-1 maximizes eccentric motor unit recruitment and joint stabilization.',
    deepLink: '/dashboard/fitness?workspace=train',
    actionLabel: 'Explore Tempo HUD',
  },
  {
    id: 'client-nutrition',
    title: 'Metabolic Nutrition & Travel Adapter',
    subtitle: 'Step 3 of 6 · Fueling & Travel Continuity',
    badge: 'Nutrition & Travel',
    icon: 'apple',
    image: '/images/pillar-safety-crest.jpg',
    description:
      'Align your daily fueling with your active NASM OPT™ training phase and instantly adapt your workouts when traveling or training with limited equipment.',
    features: [
      'Choose between Precision Nutrition (PN1) visual hand-portion blueprints or exact OPT™ macronutrient targets.',
      '1-Tap Travel & Hotel-Gym Workout Generator recalibrates exercises to hotel dumbbells, bands, or bodyweight.',
      'Preserves your exact training stimulus and progressive overload while on the road.',
    ],
    proTip: 'Prioritize 30–40g of high-leucine protein within 60 minutes post-workout to support myofibrillar repair.',
    deepLink: '/dashboard/fitness?workspace=lab',
    actionLabel: 'Open Nutrition & Travel Lab',
  },
  {
    id: 'client-posture',
    title: 'Movement Screen & Corrective Continuums',
    subtitle: 'Step 4 of 6 · Biomechanical Alignment',
    badge: 'Biomechanics',
    icon: 'movement-screen',
    image: '/images/pillar-movement-crest.jpg',
    description:
      'View your Overhead Squat Assessment (OHSA) scores, joint angle deviations, and personalized 4-Phase Corrective Exercise Continuum (Inhibit, Lengthen, Activate, Integrate).',
    features: [
      'Interactive radar biometrics covering Foot/Ankle, Knee, Lumbo-Pelvic-Hip, Shoulder, and Head/Neck checkpoints.',
      'Targeted foam rolling (Inhibit) and dynamic mobility (Integrate) prescriptions.',
      'Prevents movement compensation and optimizes structural force transfer.',
    ],
    proTip: 'Perform your prescribed Inhibitory / Foam Rolling exercises immediately prior to heavy compound lifts.',
    deepLink: '/dashboard/fitness?workspace=assessment',
    actionLabel: 'View Movement Screen',
  },
  {
    id: 'client-progress',
    title: 'Strength Analytics & Weekly Check-Ins',
    subtitle: 'Step 5 of 6 · Measurable Progress & Coach Feedback',
    badge: 'Progress & Check-Ins',
    icon: 'overview',
    description:
      'Track your estimated 1RM strength progression, mechanical volume tonnage, and body composition trends while submitting quick weekly check-ins for coach review.',
    features: [
      'Complete your 60-second weekly check-in with sleep, soreness, energy, and progression photos.',
      'Upload training sets to the Form Lab for frame-by-frame biomechanical video review.',
      'Receive direct coaching adjustments and personalized feedback from Coach Gordon.',
    ],
    proTip: 'Submit your weekly check-in by Sunday afternoon to receive your calibrated program updates for the week ahead.',
    deepLink: '/dashboard/fitness?workspace=checkin',
    actionLabel: 'Open Check-In Hub',
  },
  {
    id: 'client-live',
    title: 'Live Consultation Studio & Wearables Sync',
    subtitle: 'Step 6 of 6 · VIP Interactive Coaching',
    badge: 'Concierge Studio',
    icon: 'camera',
    image: '/images/pillar-concierge-crest.jpg',
    description:
      'Connect 1-on-1 with Coach Gordon in the high-definition Live Video Studio featuring real-time telestrator form markups, slow-motion replay analysis, and Apple Health / Whoop sync.',
    features: [
      'High-performance WebRTC video with real-time biometric telemetry overlays.',
      'Receive visual drawing telestrator cues directly over your exercise form.',
      'Automatic multi-device wearable synchronization for heart rate zones and recovery HRV.',
    ],
    proTip: 'Ensure good lighting and position your camera so your full kinetic chain (head to feet) is visible during squats and deadlifts.',
    deepLink: '/dashboard/book',
    actionLabel: 'Book 1-on-1 Session',
  },
]

export const COACH_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'coach-hub',
    title: '4-Pillar Hub Navigator',
    subtitle: 'Step 1 of 7 · Centralized Advisory Cockpit',
    badge: 'Navigation Engine',
    icon: 'grid',
    image: '/images/gaa-brand-crest.jpg',
    description:
      'Navigate all 11 client advisory sub-tools seamlessly from a single unified cockpit. Fast keyboard shortcuts, smart fuzzy search, and live status badges across all 4 pillars.',
    features: [
      'Pillar 1 (Training): Client Overview, Program Workspace, OPT™ Periodization Architect.',
      'Pillar 2 (Movement): NASM Movement Screen, OHSA Biomechanics, Video Critique.',
      'Pillar 3 (Safety): Medical Liability Shield, PAR-Q Contraindications, Specialized Relief Toolboxes.',
      'Pillar 4 (Operations): Appointments Schedule, Weekly Check-Ins, Commerce & Audit Trail.',
    ],
    proTip: 'Use the quick search filter in the navigator header to jump directly to any sub-tool in 1 keystroke.',
    deepLink: '/coach',
    actionLabel: 'Open Coach Portal',
  },
  {
    id: 'coach-periodization',
    title: 'NASM OPT™ Periodization Architect',
    subtitle: 'Step 2 of 7 · Macrocycle & Deload Calibration',
    badge: 'Periodization',
    icon: 'periodization',
    image: '/images/pillar-training-crest.jpg',
    description:
      'Design and modulate full 12-week macrocycles with automatic phase transitions (Phases 1-5), acute-to-chronic workload ratio (ACWR) safety triage, and 1-click deload insertions.',
    features: [
      'Automated ACWR workload monitoring: Flags injury risk when ratio exceeds 1.50.',
      '1-Click Deload & Setback Correction: Instantly reduces load volume by 40% when overtraining or illness occurs.',
      'Dynamic velocity modulation (Accelerated, Standard, Re-Stabilization).',
    ],
    proTip: 'When an athlete returns from business travel, insert a 1-week Re-Stabilization Phase before advancing to Max Strength.',
    deepLink: '/coach',
    actionLabel: 'Review Periodization',
  },
  {
    id: 'coach-soap',
    title: 'AI Voice & Clinical S.O.A.P. Session Notes',
    subtitle: 'Step 3 of 7 · Medical-Grade Documentation',
    badge: 'AI Clinical S.O.A.P.',
    icon: 'message',
    description:
      'Dictate rapid post-session voice observations directly from the live studio or client profile. Gemini synthesizes raw spoken voice into structured medical-grade S.O.A.P. records in seconds.',
    features: [
      'Subjective, Objective, Assessment, and Plan breakdown compliant with NASM and clinical standards.',
      'Auto-generates both formal clinical notes for the coach and an executive action briefing for the athlete.',
      '1-Click auto-population into client session history.',
    ],
    proTip: 'Tap [ AI Voice S.O.A.P. Notes ] immediately after concluding a live session for instant hands-free documentation.',
    deepLink: '/coach',
    actionLabel: 'Try S.O.A.P. Dictation',
  },
  {
    id: 'coach-travel',
    title: 'Instant Travel & Hospitality Program Re-Calibrator',
    subtitle: 'Step 4 of 7 · 1-Click Equipment Adaptation',
    badge: 'Travel Recalibrator',
    icon: 'compass',
    description:
      'When an executive client travels, recalibrate their entire gym macrocycle in 1 click to match Hotel Dumbbells, Resistance Bands, or Bodyweight facilities—then restore with 1 click upon return.',
    features: [
      'Smart exercise substitution preserving exact OPT™ phase stimulus (e.g. Barbell Squat → Goblet Squat 4-2-1-1).',
      'Auto-dispatches a formatted travel protocol update to the client’s Concierge Chat thread.',
      'Zero program disruption while maintaining athlete adherence on the road.',
    ],
    proTip: 'Select "Hotel Dumbbell & Cable Suite" for comprehensive hotel fitness centers with up to 50 lb dumbbells.',
    deepLink: '/coach',
    actionLabel: 'View Travel Adapter',
  },
  {
    id: 'coach-mesh',
    title: 'AI Postural Distortion & OHSA Mesh Scanner',
    subtitle: 'Step 5 of 7 · Computer Vision Screening',
    badge: 'AI Vision Scanner',
    icon: 'movement-screen',
    image: '/images/pillar-movement-crest.jpg',
    description:
      'Upload or capture photos of your client’s Overhead Squat or static posture. Gemini Vision extracts 12 kinetic chain landmarks, calculates deviation angles, and generates a 4-phase CEx Continuum.',
    features: [
      'Interactive HTML5 Canvas wireframe skeleton overlay with joint angle deviation gauges.',
      'Detects Forward Head, Upper Crossed, Anterior Pelvic Tilt, Knee Valgus, and Feet Turn-Out.',
      '1-Click auto-populates all 5 NASM checkpoints into the permanent assessment record.',
    ],
    proTip: 'Ensure both anterior (front) and lateral (side) views are captured for 360-degree kinetic chain analysis.',
    deepLink: '/coach',
    actionLabel: 'Launch Posture Scanner',
  },
  {
    id: 'coach-toolboxes',
    title: 'Specialized Relief & Recovery Toolboxes',
    subtitle: 'Step 6 of 7 · Targeted Protocol Prescriptions',
    badge: 'Clinical Toolboxes',
    icon: 'toolbox',
    image: '/images/pillar-safety-crest.jpg',
    description:
      'Assign targeted corrective and lifestyle protocols—including Desk Worker Decompression, Low Back Relief, Executive Travel, and Sleep Architecture—with 1 click.',
    features: [
      'Curated evidence-based mobility, postural decompression, and recovery routines ready for instant assignment.',
      '1-Click deployment publishes the toolbox directly to the athlete’s Fitness Hub and dispatches a Concierge Chat briefing.',
      'Respects all active PAR-Q+ orthopedic and cardiovascular safety guardrails.',
    ],
    proTip: 'Assign the Desk Worker & Postural Decompression toolbox whenever Upper Crossed Syndrome is detected on an OHSA screen.',
    deepLink: '/coach',
    actionLabel: 'Open Toolboxes',
  },
  {
    id: 'coach-live',
    title: 'Unified Live Coaching Studio',
    subtitle: 'Step 7 of 7 · Real-Time Visual Telestrator',
    badge: 'Live Studio',
    icon: 'camera',
    image: '/images/pillar-concierge-crest.jpg',
    description:
      'Deliver high-touch live virtual sessions with real-time video telestrator drawing, 0.25x/0.5x slow-motion instant replay review, visual tempo pacing, and session wrap-up memos.',
    features: [
      'Telestrator Canvas: Draw movement lines, angle vectors, and joint circles directly over the live athlete video.',
      'Slow-Mo Replay: Capture 5-second exercise clips and scrub backwards/forwards to point out subtle form breakdowns.',
      'Live Smart Exercise Swap: Modify exercise movements mid-session if equipment is unavailable.',
    ],
    proTip: 'Use the gold telestrator pen to highlight joint alignment during the bottom isometric pause of squats.',
    deepLink: '/coach',
    actionLabel: 'Launch Live Studio',
  },
]

