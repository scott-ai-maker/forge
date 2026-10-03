/**
 * Specialized Client Toolbox Assignment Matrix Engine
 * Curates turnkey specialized toolboxes that coaches can assign to clients with 1 click.
 */

export type ToolboxId =
  | 'desk_worker_posture'
  | 'frequent_flyer_travel'
  | 'knee_bulletproofing'
  | 'lumbar_sparing_core'
  | 'metabolic_refeed'

export interface SpecializedToolbox {
  id: ToolboxId
  title: string
  subtitle: string
  icon: string
  targetCondition: string
  nasmOptFocus: string
  keyDrills: {
    name: string
    protocol: string
    coachingCue: string
  }[]
  executiveActionRule: string
}

export const SPECIALIZED_TOOLBOXES: Record<ToolboxId, SpecializedToolbox> = {
  desk_worker_posture: {
    id: 'desk_worker_posture',
    title: 'Desk Worker Postural Decompression',
    subtitle: 'Reverses forward head tilt, rounded shoulders, and anterior pelvic tilt from prolonged sitting.',
    icon: 'chair',
    targetCondition: 'Upper Crossed & Lower Crossed Postural Distortion Syndromes',
    nasmOptFocus: 'Inhibit Pectoralis Major & Psoas; Activate Deep Cervical Flexors, Lower Trapezius & Glutes.',
    keyDrills: [
      {
        name: 'Chin Tucks & Deep Cervical Flexor Retraction',
        protocol: '2 sets × 10 reps (5s isometric hold)',
        coachingCue: 'Retract chin straight back like making a double chin; lengthen rear crown of head.',
      },
      {
        name: 'Thoracic Extension over Foam Roller',
        protocol: '2 sets × 60 seconds',
        coachingCue: 'Support head with hands; gently extend upper back over roller without arching lower back.',
      },
      {
        name: 'Half-Kneeling Posterior Pelvic Tilt Hip Flexor Stretch',
        protocol: '2 sets × 30 seconds / side',
        coachingCue: 'Squeeze glute of back leg and tuck tailbone under before shifting 1 inch forward.',
      },
    ],
    executiveActionRule: 'Perform the 5-minute decompression sequence mid-day at desk and immediately prior to training.',
  },
  frequent_flyer_travel: {
    id: 'frequent_flyer_travel',
    title: 'Executive Frequent Flyer & Jetlag Protocol',
    subtitle: 'Mitigates spinal compression, high-altitude fluid retention, and circadian disruption.',
    icon: 'plane',
    targetCondition: 'Frequent business travel, hotel bed stiffness & jetlag fatigue',
    nasmOptFocus: 'Lymphatic drainage, hip capsule decompression & Zone 1 aerobic mobility.',
    keyDrills: [
      {
        name: 'In-Room Banded Bulgarian Split Squats (Bed Elevated)',
        protocol: '3 sets × 12 reps / leg (4/2/1 tempo)',
        coachingCue: 'Elevate rear foot on hotel bed; drop back knee straight down with tall upright posture.',
      },
      {
        name: 'Circadian Sunlight Exposure & 20-Min Fasted Walk',
        protocol: 'Upon waking in destination time zone',
        coachingCue: 'Get 10 minutes of direct outdoor natural sunlight to reset master retinal suprachiasmatic clock.',
      },
      {
        name: 'Electrolyte Mineral Hydration Loading',
        protocol: '500ml water + 500mg sodium / potassium before flight boarding',
        coachingCue: 'Counteract cabin dry atmosphere pressure to protect heart rate variability (HRV).',
      },
    ],
    executiveActionRule: 'Activate 1-Click Travel Mode on scheduled workout days while on the road.',
  },
  knee_bulletproofing: {
    id: 'knee_bulletproofing',
    title: 'Knee Joint Bulletproofing & VMO Activation',
    subtitle: 'Eliminates anterior patellofemoral knee shear and optimizes vastus medialis motor recruitment.',
    icon: 'leg',
    targetCondition: 'Patellofemoral tracking irritation, runner’s knee, or post-ACL reconstruction stiffness',
    nasmOptFocus: 'Inhibit TFL/Biceps Femoris; Activate VMO & Gluteus Medius via closed kinetic chain drills.',
    keyDrills: [
      {
        name: 'Spanish Squats with Heavy Loop Band',
        protocol: '3 sets × 12 reps (3-second isometric pause at 90°)',
        coachingCue: 'Wrap heavy band around knees anchored to post; sit back with vertical shins to isolate VMO.',
      },
      {
        name: 'Low-Box Peterson / Poliquin Step-Downs',
        protocol: '3 sets × 15 reps / leg (Controlled 3s descent)',
        coachingCue: 'Elevate heel on 4-inch block; track knee over 2nd toe while tapping opposite heel to floor.',
      },
      {
        name: 'Side-Lying Clamshells with Resistance Band',
        protocol: '2 sets × 20 reps / side',
        coachingCue: 'Keep hips stacked; externally rotate top knee without rolling pelvis backward.',
      },
    ],
    executiveActionRule: 'Substitute open-chain leg extensions with Spanish Squats on all lower-body workout days.',
  },
  lumbar_sparing_core: {
    id: 'lumbar_sparing_core',
    title: 'Lumbar Sparing & 360° Core Cylinder Protocol',
    subtitle: 'Builds true spinal stability and eliminates low back spasms using Dr. Stuart McGill biomechanics.',
    icon: 'shield-check',
    targetCondition: 'Lumbar disc herniation, spinal stenosis, or recurring low-back tightness',
    nasmOptFocus: 'Anti-extension and anti-rotational core stiffness without spinal flexion shear forces.',
    keyDrills: [
      {
        name: 'McGill Modified Curl-Up (One knee bent, hands under lumbar arch)',
        protocol: '3 sets × 6/4/2 descending pyramid holds (8s hold)',
        coachingCue: 'Brace abdominal wall like preparing for a punch; lift head/shoulders only 1 inch off floor.',
      },
      {
        name: 'McGill Side Bridge / Side Plank',
        protocol: '3 sets × 8s holds / side',
        coachingCue: 'Maintain straight line from ear to ankles; contract glutes and quadratus lumborum.',
      },
      {
        name: 'Quadruped Bird-Dog with Dynamic Hand Sweeps',
        protocol: '3 sets × 8 reps / side (4s hold)',
        coachingCue: 'Extend opposite arm and leg while keeping a cup of water balanced on lower back.',
      },
    ],
    executiveActionRule: 'Complete the McGill Big 3 prior to any standing or axial loading movements.',
  },
  metabolic_refeed: {
    id: 'metabolic_refeed',
    title: 'Metabolic Glycogen Overload Refeed Protocol',
    subtitle: 'Strategic carbohydrate reload to upregulate leptin, restore muscle glycogen, and spike power output.',
    icon: 'lightning',
    targetCondition: 'Mid-macrocycle metabolic plateau or heavy Phase 4 maximal strength training days',
    nasmOptFocus: 'Glycolytic replenishment, mTOR stimulation & thyroid hormone upregulation.',
    keyDrills: [
      {
        name: 'Pre-Workout Glycogen Priming Bolus',
        protocol: '40g fast-digesting carbohydrates (Cream of rice / Honey / Banana) 45 min before lift',
        coachingCue: 'Maximize intra-muscular ATP-CP resynthesis during high-load working sets.',
      },
      {
        name: 'Post-Workout Anabolic Window Feeding',
        protocol: '50g high-glycemic carbs + 35g Whey Protein Isolate within 60 mins',
        coachingCue: 'Spike insulin to shuttle amino acids into recovering muscle tissue.',
      },
    ],
    executiveActionRule: 'Execute on heavy compound leg and back training days only; return to baseline macros next day.',
  },
}

export function getToolboxById(id: ToolboxId): SpecializedToolbox {
  return SPECIALIZED_TOOLBOXES[id] ?? SPECIALIZED_TOOLBOXES.desk_worker_posture
}

export function getAllToolboxes(): SpecializedToolbox[] {
  return Object.values(SPECIALIZED_TOOLBOXES)
}

