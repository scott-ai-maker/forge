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
    id: 'client-supplements',
    title: 'Daily Ergogenic Stack & Chrono-Dosing',
    subtitle: 'Step 3 of 6 · Sports Science Supplementation',
    badge: 'Chrono-Nutrition',
    icon: 'supplements',
    image: '/images/pillar-safety-crest.jpg',
    description:
      'Follow your personalized evidence-based supplement protocol across 4 optimized daily windows with instant 1-tap adherence logging and clinical science dossiers.',
    features: [
      '4 Chrono-Dosing Windows: Morning Ignition, Pre-Workout Drive, Post-Workout Recovery, and Night Sleep Architecture.',
      'Tap any supplement checkbox to log your daily dose and maintain your compliance streak.',
      'View ISSN clinical citations, NSF Certified for Sport badges, and biological mechanisms of action.',
    ],
    proTip: 'Take chelated Magnesium Bisglycinate 30-45 minutes before sleep to support deep slow-wave restorative sleep.',
    deepLink: '/dashboard/fitness?workspace=checkin',
    actionLabel: 'View Supplement Timeline',
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
    id: 'client-dossier',
    title: 'Executive Sunday Intelligence Dossier',
    subtitle: 'Step 5 of 6 · Weekly Accountability Briefing',
    badge: 'Advisory Intelligence',
    icon: 'overview',
    description:
      'Every Sunday, review your executive performance memo summarizing weekly tonnage moved, Zone 2 cardiovascular volume, recovery index, and upcoming macrocycle priorities.',
    features: [
      'Complete your quick weekly check-in with bodyweight, resting HR, and physique progression photos.',
      'Receive personalized video memos and strategic workout adjustments from Coach Scott Gordon.',
      'One-tap copyable executive summary for your personal fitness journal.',
    ],
    proTip: 'Submit your check-in photos by Sunday afternoon to receive your calibrated program updates before Monday morning.',
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
      'Pillar 3 (Safety): Medical Liability Shield, Prescription Toolboxes, Ergogenic Supplements.',
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
    id: 'coach-supplements',
    title: 'Sports Nutrition & Pharmacological Shield',
    subtitle: 'Step 6 of 7 · Evidence-Based Dosing',
    badge: 'Clinical Ergogenics',
    icon: 'supplements',
    image: '/images/pillar-safety-crest.jpg',
    description:
      'Prescribe tailored ergogenic supplement protocols with automatic pharmacological interaction screening against anticoagulants, antihypertensives, and thyroid medications.',
    features: [
      'Automated contraindication shield: Excludes Vitamin K2 on blood thinners, caps stimulants on blood pressure meds.',
      'Enforces mandatory 4-hour chronological separation for Levothyroxine and multivalent minerals.',
      '1-Click deployment publishes the schedule to the athlete’s Fitness Hub and Concierge Chat.',
    ],
    proTip: 'Add custom coach brand directives (e.g. Thorne or Momentous) to ensure third-party NSF verification.',
    deepLink: '/coach',
    actionLabel: 'Open Prescriber',
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

