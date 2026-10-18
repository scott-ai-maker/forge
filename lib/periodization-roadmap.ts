/**
 * 12-Week Interactive Macrocycle Periodization Roadmap Engine
 * Generates structured NASM OPT macrocycle timelines, milestone checkpoints, and dynamic coach modulations.
 */

export type AdaptationVelocity = 'accelerated' | 'standard' | 'remedial' | 'setback'

export type SpecialPopulationTrack =
  | 'osteoporosis_osteopenia'
  | 'cardiovascular_hypertension'
  | 'pregnancy_prenatal'
  | 'asthma_respiratory'

export interface MacrocycleGenerationOptions {
  currentWeek?: number
  clientGoal?: string
  adaptationVelocity?: AdaptationVelocity
  coachNotes?: string
  specialPopulation?: SpecialPopulationTrack | null
  maxAllowedOptPhase?: number
  contraindicationTags?: string[]
}

export interface RoadmapWeek {
  weekNumber: number
  phase: string
  phaseNumber: number
  theme: string
  primaryAdaptation: string
  volumeIntensity: string
  tempo?: string
  restPeriod?: string
  targetIntensity1RmPercent?: number
  milestoneTitle: string
  isReassessmentWeek: boolean
  isDeloadWeek?: boolean
  status: 'completed' | 'current' | 'upcoming'
  coachWeeklyMemo?: string
}

export interface MacrocyclePhaseConfig {
  name: string
  phaseNumber: number
  weekRange: string
  focus: string
  color: string
}

export interface MacrocyclePlan {
  macrocycleId: string
  clientGoal: string
  totalWeeks: number
  currentWeek: number
  adaptationVelocity: AdaptationVelocity
  coachNotes?: string
  coachCalibratedAt?: string | null
  phases: MacrocyclePhaseConfig[]
  weeks: RoadmapWeek[]
  projectedStrengthGainPercent: number
  projectedMobilityGainPercent: number
  // Clinical Guardrails & Special Population Tracks
  specialPopulation?: SpecialPopulationTrack | null
  maxAllowedOptPhase?: number
  contraindicationTags?: string[]
}

const OPT_PHASE_COLORS: Record<number, string> = {
  1: '#4dabf7', // Stabilization Endurance (Cyan/Sky)
  2: '#C5A059', // Strength Endurance (Gold)
  3: '#a855f7', // Muscular Development / Hypertrophy (Purple)
  4: '#ff922b', // Maximal Strength (Orange)
  5: '#34d399', // Power / Peak (Emerald)
}

const OPT_PHASE_DESCRIPTIONS: Record<number, { name: string; focus: string }> = {
  1: {
    name: 'Phase 1: Stabilization Endurance',
    focus: 'Neuromuscular efficiency, kinetic chain joint realignment, core stability, and connective tissue integrity.',
  },
  2: {
    name: 'Phase 2: Strength Endurance',
    focus: 'Agonist / Antagonist superset pairings to enhance metabolic capacity and structural work capacity.',
  },
  3: {
    name: 'Phase 3: Muscular Development',
    focus: 'Hypertrophic volume overload (6–12 reps, 75–85% 1RM) maximizing muscular cross-sectional area.',
  },
  4: {
    name: 'Phase 4: Maximal Strength',
    focus: 'Heavy neural motor unit recruitment (85–90% 1RM) and intramuscular coordination.',
  },
  5: {
    name: 'Phase 5: Power & Peak Testing',
    focus: 'Kinetic chain movement screen delta, rate of force development, and 1RM testing.',
  },
}

/**
 * Dynamically re-computes phase groupings and week ranges (e.g. Weeks 1–4, Weeks 5–8) from the current week array.
 */
export function recalculatePhaseRanges(weeks: RoadmapWeek[]): MacrocyclePhaseConfig[] {
  const phaseMap = new Map<number, { name: string; phaseNumber: number; weekNumbers: number[]; focus: string; color: string }>()

  for (const w of weeks) {
    const pNum = w.phaseNumber
    if (!phaseMap.has(pNum)) {
      const meta = OPT_PHASE_DESCRIPTIONS[pNum] || {
        name: `Phase ${pNum}`,
        focus: 'Targeted neuromuscular adaptation.',
      }
      phaseMap.set(pNum, {
        name: meta.name,
        phaseNumber: pNum,
        weekNumbers: [w.weekNumber],
        focus: meta.focus,
        color: OPT_PHASE_COLORS[pNum] || '#C5A059',
      })
    } else {
      phaseMap.get(pNum)!.weekNumbers.push(w.weekNumber)
    }
  }

  return Array.from(phaseMap.values()).map(ph => {
    const minW = Math.min(...ph.weekNumbers)
    const maxW = Math.max(...ph.weekNumbers)
    const weekRange = minW === maxW ? `Week ${minW}` : `Weeks ${minW}–${maxW}`
    return {
      name: ph.name,
      phaseNumber: ph.phaseNumber,
      weekRange,
      focus: ph.focus,
      color: ph.color,
    }
  })
}

/**
 * Generates a baseline 12-week OPT macrocycle tailored to client goal and initial status.
 */
/**
 * Generates a baseline 12-week OPT macrocycle tailored to client goal, initial status,
 * and clinical special population contraindication constraints.
 */
export function generate12WeekMacrocycle(
  currentWeekOrOptions: number | MacrocycleGenerationOptions = 1,
  clientGoal: string = 'Body Recomposition & Maximal Power',
  adaptationVelocity: AdaptationVelocity = 'standard',
  coachNotes?: string,
  specialPopulationOrOptions?: SpecialPopulationTrack | null | MacrocycleGenerationOptions,
  maxAllowedOptPhase?: number,
  contraindicationTags?: string[]
): MacrocyclePlan {
  // Resolve options from either object or positional arguments
  let currentWeekVal = 1
  let clientGoalVal = 'Body Recomposition & Maximal Power'
  let adaptationVelocityVal: AdaptationVelocity = 'standard'
  let coachNotesVal: string | undefined
  let specialPopulationVal: SpecialPopulationTrack | null | undefined
  let maxAllowedOptPhaseVal: number | undefined
  let contraindicationTagsVal: string[] | undefined

  if (typeof currentWeekOrOptions === 'object' && currentWeekOrOptions !== null) {
    currentWeekVal = currentWeekOrOptions.currentWeek ?? 1
    clientGoalVal = currentWeekOrOptions.clientGoal ?? clientGoalVal
    adaptationVelocityVal = currentWeekOrOptions.adaptationVelocity ?? adaptationVelocityVal
    coachNotesVal = currentWeekOrOptions.coachNotes
    specialPopulationVal = currentWeekOrOptions.specialPopulation
    maxAllowedOptPhaseVal = currentWeekOrOptions.maxAllowedOptPhase
    contraindicationTagsVal = currentWeekOrOptions.contraindicationTags
  } else {
    currentWeekVal = typeof currentWeekOrOptions === 'number' ? currentWeekOrOptions : 1
    clientGoalVal = clientGoal
    adaptationVelocityVal = adaptationVelocity
    coachNotesVal = coachNotes
    if (typeof specialPopulationOrOptions === 'object' && specialPopulationOrOptions !== null) {
      specialPopulationVal = specialPopulationOrOptions.specialPopulation
      maxAllowedOptPhaseVal = specialPopulationOrOptions.maxAllowedOptPhase
      contraindicationTagsVal = specialPopulationOrOptions.contraindicationTags
    } else {
      specialPopulationVal = specialPopulationOrOptions
      maxAllowedOptPhaseVal = maxAllowedOptPhase
      contraindicationTagsVal = contraindicationTags
    }
  }

  // Infer special population from contraindication tags if not explicitly set
  if (!specialPopulationVal && contraindicationTagsVal && contraindicationTagsVal.length > 0) {
    if (contraindicationTagsVal.some(t => t.includes('pregnancy') || t.includes('prenatal'))) {
      specialPopulationVal = 'pregnancy_prenatal'
    } else if (contraindicationTagsVal.some(t => t.includes('osteoporosis') || t.includes('osteopenia'))) {
      specialPopulationVal = 'osteoporosis_osteopenia'
    } else if (contraindicationTagsVal.some(t => t.includes('hypertension') || t.includes('cardiovascular') || t.includes('heart'))) {
      specialPopulationVal = 'cardiovascular_hypertension'
    } else if (contraindicationTagsVal.some(t => t.includes('asthma') || t.includes('respiratory'))) {
      specialPopulationVal = 'asthma_respiratory'
    }
  }

  // Determine effective max allowed phase
  let effectiveMaxPhase = 5
  if (
    specialPopulationVal === 'pregnancy_prenatal' ||
    specialPopulationVal === 'osteoporosis_osteopenia' ||
    specialPopulationVal === 'cardiovascular_hypertension'
  ) {
    effectiveMaxPhase = 2
  }
  if (typeof maxAllowedOptPhaseVal === 'number' && maxAllowedOptPhaseVal > 0) {
    effectiveMaxPhase = Math.min(effectiveMaxPhase, maxAllowedOptPhaseVal)
  }

  const clampedWeek = Math.max(1, Math.min(12, currentWeekVal))

  let baseWeekConfigs: Omit<RoadmapWeek, 'status'>[] = []
  let defaultNotes = 'Baseline NASM OPT periodization calibrated for optimal structural integrity and power.'

  if (specialPopulationVal === 'pregnancy_prenatal') {
    defaultNotes = 'Prenatal NASM OPT periodization: strict pelvic floor support, low-impact supersets, and submaximal graduation (zero 1RM testing or high-impact strain).'
    baseWeekConfigs = [
      // Phase 1 (Weeks 1-4)
      {
        weekNumber: 1,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Baseline Posture & Core Cylinder Mechanics',
        primaryAdaptation: 'Diaphragmatic breathing, pelvic floor activation, and joint realignment (zero supine/prone).',
        volumeIntensity: '2-3 sets × 12-15 reps @ 50-60% 1RM (RPE 5-6)',
        tempo: '4/2/1 (Controlled Tempo)',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Prenatal Baseline Movement Screen',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Establish pelvic alignment and diaphragmatic breathing. Avoid breath-holding (Valsalva) and supine positions.',
      },
      {
        weekNumber: 2,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Pelvic Stability & Kinetic Support',
        primaryAdaptation: 'Single-leg balance and supported quadruped stabilization with stable footing.',
        volumeIntensity: '3 sets × 12-15 reps @ 55-60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Pelvic Alignment Mastery',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maintain stable footing with wide base of support; eliminate exercises with fall risk.',
      },
      {
        weekNumber: 3,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Postural Endurance & Upper Back Retraction',
        primaryAdaptation: 'Scapular retraction, glute medius activation, and pelvic floor coordination.',
        volumeIntensity: '3 sets × 12-15 reps @ 60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Postural Endurance Streak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Counteract forward gravitational center-of-mass shift with standing face pulls and side-lying clamshells.',
      },
      {
        weekNumber: 4,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Prenatal Active Deload & Joint Recovery',
        primaryAdaptation: 'Connective tissue recovery, gentle mobilization, and diaphragmatic relaxation.',
        volumeIntensity: '2 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1 (Restorative)',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Prenatal Phase 1 Certified',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Scheduled deload microcycle to dissipate joint fatigue and maintain maternal comfort.',
      },

      // Phase 2 (Weeks 5-8)
      {
        weekNumber: 5,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Low-Impact Strength-Stability Contrast',
        primaryAdaptation: 'Incline/standing compound strength paired with pelvic stabilizer (RPE 6-7).',
        volumeIntensity: '3 supersets × 10-12 reps @ 60-65% 1RM',
        tempo: '2/0/2 Strength ➔ 4/2/1 Stabilizer',
        restPeriod: '0s intraset / 60-90s post-superset',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'First Prenatal Superset Completed',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Incline dumbbell bench press paired with quadruped glute kickbacks; strictly maintain 30°+ incline angle.',
      },
      {
        weekNumber: 6,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Maternal Work Capacity & Breathing Sync',
        primaryAdaptation: 'Continuous rhythmic exhalation through concentric phase; zero Valsalva.',
        volumeIntensity: '3 supersets × 10-12 reps @ 65% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Mid-Cycle Maternal Biometric Check-In',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maintain RPE 6-7 (comfortable talk-test pacing) and allow adequate recovery between sets.',
      },
      {
        weekNumber: 7,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Lower-Body Stability & Hip Strength',
        primaryAdaptation: 'Supported goblet squats, split stance balance, and posterior chain endurance.',
        volumeIntensity: '3-4 supersets × 10 reps @ 65-70% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 68,
        milestoneTitle: 'Lower-Body Stability Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Wide-stance goblet squats accommodate changing center of gravity while protecting the pelvic girdle.',
      },
      {
        weekNumber: 8,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Mid-Cycle Pelvic Alignment & Postural Screen',
        primaryAdaptation: 'Submaximal postural screen to verify zero pelvic or lower back compensation.',
        volumeIntensity: '2 sets × 8-10 reps (Technical Screen)',
        tempo: '3/1/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Mid-Cycle Movement & Comfort Audit',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Mid-cycle movement check: assess lumbar posture, pelvic comfort, and diaphragmatic rhythm.',
      },

      // Phase 2 Extended (Weeks 9-11) - Zero Phase 4/5!
      {
        weekNumber: 9,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Maternal Stamina & Functional Work Capacity',
        primaryAdaptation: 'Controlled multi-joint strength endurance with full recovery intervals.',
        volumeIntensity: '3 sets × 10-12 reps @ 65% 1RM (RPE 6-7)',
        tempo: '2/0/2 (Controlled)',
        restPeriod: '90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Functional Stamina Checkpoint',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maintain submaximal effort; focus on upright posture and steady diaphragmatic breathing.',
      },
      {
        weekNumber: 10,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Pelvic Floor & Core Cylinder Integration',
        primaryAdaptation: 'Standing anti-rotation and functional loaded carries (light dumbbells).',
        volumeIntensity: '3 sets × 10-12 reps @ 65-70% 1RM',
        tempo: '2/0/2',
        restPeriod: '90s',
        targetIntensity1RmPercent: 68,
        milestoneTitle: 'Prenatal Work Capacity Certification',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Smooth, deliberate repetitions with total focus on pelvic and spinal stability.',
      },
      {
        weekNumber: 11,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Prenatal Taper & Active Recovery',
        primaryAdaptation: 'Volume taper to minimize maternal fatigue while preserving neuromuscular tone.',
        volumeIntensity: '2 sets × 8-10 reps @ 50-60% 1RM',
        tempo: '4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Pre-Graduation Recovery Optimization',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Gentle movement, restorative stretching, and energy preservation before the graduation screen.',
      },

      // Week 12 Peak Screen (Zero 1RM Testing!)
      {
        weekNumber: 12,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: '12-Week Prenatal Transformation Graduation',
        primaryAdaptation: 'Low-impact submaximal functional movement screen, joint stability audit, and postpartum readiness.',
        volumeIntensity: 'Low-Impact Functional Movement Screen (Zero 1RM Strain)',
        tempo: 'Controlled Submaximal Diagnostic',
        restPeriod: '2 min',
        targetIntensity1RmPercent: 60,
        milestoneTitle: '12-Week Prenatal Health Graduation & Master Report',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Graduation celebration! Complete your submaximal movement screen with zero 1RM strain.',
      },
    ]
  } else if (specialPopulationVal === 'osteoporosis_osteopenia') {
    defaultNotes = 'Bone Mineral Density NASM OPT periodization: strict neutral spine enforcement, axial weight-bearing closed-chain loading, and zero spinal flexion shear.'
    baseWeekConfigs = [
      // Phase 1 (Weeks 1-4)
      {
        weekNumber: 1,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Neutral Spine Calibration & Balance Foundation',
        primaryAdaptation: 'Strict neutral spine enforcement, anti-rotation core cylinder, zero spinal flexion.',
        volumeIntensity: '3 sets × 12-15 reps @ 50-60% 1RM',
        tempo: '4/2/1 (Strict Neutral Spine)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Neutral Spine Postural Screen Complete',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Strict neutral spine protocol active: crunches and spinal flexion are blacklisted. Prioritize McGill Big 3.',
      },
      {
        weekNumber: 2,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Fall Prevention & Proprioceptive Balance',
        primaryAdaptation: 'Multi-planar balance and dynamic single-leg stabilization to eliminate fall risk.',
        volumeIntensity: '3 sets × 12-15 reps @ 55-60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Fall Prevention Balance Mastery',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on single-leg stance balance near a wall or sturdy support for optimal stability.',
      },
      {
        weekNumber: 3,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Postural Extensor Muscular Endurance',
        primaryAdaptation: 'Thoracic extension, scapular retraction, and posterior hip hinge mechanics.',
        volumeIntensity: '3-4 sets × 15 reps @ 60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Spinal Alignment Habit Streak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Strengthen thoracic extensors with prone cobras and bird-dogs to resist forward kyphotic curvature.',
      },
      {
        weekNumber: 4,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Bone Health Restorative Deload',
        primaryAdaptation: 'Joint recovery, connective tissue repair, and thoracic mobility flushes.',
        volumeIntensity: '2-3 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Phase 1 Bone Density Shield Certified',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Active recovery microcycle to dissipate joint fatigue before progressing to axial loaded resistance.',
      },

      // Phase 2 (Weeks 5-8)
      {
        weekNumber: 5,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Axial Closed-Chain Bone Loading',
        primaryAdaptation: 'Compressive weight-bearing closed-chain loading to stimulate osteoblast remodeling (capped <=75% 1RM).',
        volumeIntensity: '3 supersets × 10-12 reps @ 65-70% 1RM',
        tempo: '2/0/2 Strength ➔ 4/2/1 Stabilizer',
        restPeriod: '0s intraset / 60-90s post-superset',
        targetIntensity1RmPercent: 70,
        milestoneTitle: 'First Osteogenic Superset Completed',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Execute neutral-spine trap bar deadlifts paired with standing Pallof presses. Zero rounding of back.',
      },
      {
        weekNumber: 6,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Multi-Planar Structural Integrity',
        primaryAdaptation: 'Goblet squats, standing overhead presses in scapular plane, and loaded farmer carries.',
        volumeIntensity: '3-4 supersets × 10 reps @ 70% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 70,
        milestoneTitle: 'Mid-Cycle Bone Health Biometric Check',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on tall upright posture and firm abdominal bracing during all loaded closed-chain sets.',
      },
      {
        weekNumber: 7,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Peak Osteogenic Resistance Overload',
        primaryAdaptation: 'Safe axial bone loading at clinical ceiling (75% 1RM cap).',
        volumeIntensity: '4 supersets × 8-10 reps @ 72-75% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 75,
        milestoneTitle: 'Osteogenic Ceiling Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Peak bone-mineral density stimulus at 75% 1RM ceiling. Strict neutral spine on all compound hinges.',
      },
      {
        weekNumber: 8,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Mid-Cycle Dynamic Balance & Postural Screen',
        primaryAdaptation: 'Submaximal OHSA and multi-planar dynamic balance audit.',
        volumeIntensity: '2 sets × 8 reps (Technical Screen)',
        tempo: '3/1/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Dynamic Balance & Postural Re-Assessment',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Mid-cycle movement audit: record your balance screen and submit for kinetic chain delta review.',
      },

      // Phase 2 Extended (Weeks 9-11) - Zero Phase 4/5!
      {
        weekNumber: 9,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Osteogenic Progressive Resistance & Carries',
        primaryAdaptation: 'Trap bar deadlifts, neutral-grip carries, and hip abductor structural endurance.',
        volumeIntensity: '3-4 sets × 8-10 reps @ 70-75% 1RM',
        tempo: '2/0/2',
        restPeriod: '90s',
        targetIntensity1RmPercent: 72,
        milestoneTitle: 'Loaded Carry Endurance Unlock',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Loaded farmer carries reinforce upright spinal posture and stimulate hip mineral density.',
      },
      {
        weekNumber: 10,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Anti-Rotational Stiffness & Hip Density',
        primaryAdaptation: 'Standing Pallof press variations and single-leg Romanian deadlift with support.',
        volumeIntensity: '3-4 sets × 8-10 reps @ 72-75% 1RM',
        tempo: '2/0/2',
        restPeriod: '90s',
        targetIntensity1RmPercent: 75,
        milestoneTitle: 'Anti-Rotational Stiffness Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Resist rotational torque on the thoracic spine while generating strong glute drive.',
      },
      {
        weekNumber: 11,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Bone Health Taper & CNS Recovery',
        primaryAdaptation: 'Volume reduction to dissipate connective tissue fatigue before graduation.',
        volumeIntensity: '2-3 sets × 8 reps @ 50% 1RM',
        tempo: '4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Pre-Graduation Recovery Optimization',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Restorative taper microcycle: 40% volume reduction to ensure fresh joints and optimal balance.',
      },

      // Week 12 Graduation (Zero 1RM Testing!)
      {
        weekNumber: 12,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: '12-Week Bone Mineral Density Graduation',
        primaryAdaptation: 'Submaximal multi-planar balance screen, posture check, and functional work capacity certification.',
        volumeIntensity: 'Submaximal Functional Diagnostics (Zero 1RM Testing)',
        tempo: 'Controlled Diagnostic',
        restPeriod: '2 min',
        targetIntensity1RmPercent: 65,
        milestoneTitle: '12-Week Bone Density Graduation & Master Report',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Graduation week! Celebrate structural transformations and dynamic balance milestones with zero 1RM strain.',
      },
    ]
  } else if (specialPopulationVal === 'cardiovascular_hypertension') {
    defaultNotes = 'Cardiovascular Guard NASM OPT periodization: Peripheral Heart Action (PHA) circuits, continuous rhythmic breathing, and submaximal pacing (zero Valsalva or 1RM testing).'
    baseWeekConfigs = [
      // Phase 1 (Weeks 1-4)
      {
        weekNumber: 1,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Continuous Breathing & Kinetic Calibration',
        primaryAdaptation: 'Continuous rhythmic diaphragmatic exhalation (zero Valsalva) and joint stabilization.',
        volumeIntensity: '3 sets × 12-15 reps @ 50-60% 1RM (RPE 5-6)',
        tempo: '4/2/1 (Rhythmic Breathing)',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Cardiovascular Baseline Screen Complete',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Continuous rhythmic breathing is mandatory: exhale smoothly on every concentric contraction; never hold your breath.',
      },
      {
        weekNumber: 2,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Proprioceptive Balance with Talk-Test Pacing',
        primaryAdaptation: 'Unstable yet controllable balance exercises monitored by RPE and the Talk Test.',
        volumeIntensity: '3 sets × 12-15 reps @ 55-60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Talk-Test Cadence Mastered',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maintain comfortable conversation pace throughout all sets; allow blood pressure to normalize before next exercise.',
      },
      {
        weekNumber: 3,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Endothelial Vasodilation & Muscular Endurance',
        primaryAdaptation: 'Sustained moderate tension promoting nitric oxide release and vascular elasticity.',
        volumeIntensity: '3-4 sets × 15 reps @ 60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Vascular Conditioning Habit Streak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Transition smoothly from floor to standing to prevent orthostatic pressure drops and dizziness.',
      },
      {
        weekNumber: 4,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Arterial Recovery & Restorative Deload',
        primaryAdaptation: 'Dissipation of systemic fatigue, gentle SMR, and cardiovascular normalization.',
        volumeIntensity: '2-3 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Phase 1 Cardiac Guard Certified',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Restorative deload microcycle to keep blood pressure regulated and allow full tissue recovery.',
      },

      // Phase 2 (Weeks 5-8)
      {
        weekNumber: 5,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Peripheral Heart Action (PHA) Introduction',
        primaryAdaptation: 'Alternating upper and lower body superset pairings to optimize venous return and hemodynamics.',
        volumeIntensity: '3 PHA supersets × 10-12 reps @ 60-65% 1RM',
        tempo: '2/0/2 Upper ➔ 4/2/1 Lower',
        restPeriod: '30s intraset / 60-90s post-superset',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'First PHA Circuit Completed',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'PHA circuits alternate upper and lower movements to circulate blood continuously without localized pressure spikes.',
      },
      {
        weekNumber: 6,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Cardiovascular Work Capacity Surge',
        primaryAdaptation: 'Systemic aerobic and muscular endurance synergy (RPE 6-7).',
        volumeIntensity: '3-4 PHA supersets × 10-12 reps @ 65% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60-90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Mid-Cycle Cardiovascular Check-In',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maintain steady rhythmic breathing and check in with your RPE scale after each circuit.',
      },
      {
        weekNumber: 7,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Controlled Strength Endurance Density',
        primaryAdaptation: 'Controlled compound resistance at clinical safety ceiling (capped <=75% 1RM, zero inverted straining).',
        volumeIntensity: '4 PHA supersets × 10 reps @ 68-70% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 70,
        milestoneTitle: 'PHA Circuit Endurance Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Zero inverted positions or head-down leg presses. Upright posture protects intracranial pressure.',
      },
      {
        weekNumber: 8,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Mid-Cycle Submaximal Cardiovascular Recovery Screen',
        primaryAdaptation: 'Submaximal YMCA step test recovery and OHSA kinetic chain delta review.',
        volumeIntensity: '2 sets × 8 reps (Technical Screen)',
        tempo: '3/1/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Cardiovascular Recovery Screen Complete',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Mid-cycle cardiovascular and movement audit: quantify 1-minute HR recovery and kinetic chain symmetry.',
      },

      // Phase 2 Extended (Weeks 9-11) - Zero Phase 4/5!
      {
        weekNumber: 9,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Aerobic-Strength Circuit Conditioning',
        primaryAdaptation: 'Full-body PHA circuits paired with steady-state Tanaka Stage 1 aerobic flushes.',
        volumeIntensity: '3-4 sets × 10-12 reps @ 65-70% 1RM (RPE 6.5-7.5)',
        tempo: '2/0/2',
        restPeriod: '90s',
        targetIntensity1RmPercent: 68,
        milestoneTitle: 'Aerobic-Strength Integration Unlock',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Keep full 90-second rest intervals between rounds to allow heart rate and blood pressure to settle.',
      },
      {
        weekNumber: 10,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Hemodynamic Efficiency & Muscular Stamina',
        primaryAdaptation: 'Multi-joint closed-chain compound movements with deliberate rhythmic tempo.',
        volumeIntensity: '3-4 sets × 10 reps @ 70% 1RM',
        tempo: '2/0/2',
        restPeriod: '90s',
        targetIntensity1RmPercent: 70,
        milestoneTitle: 'Hemodynamic Efficiency Certification',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on fluid movement execution and exhale completely on the lift.',
      },
      {
        weekNumber: 11,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Cardiovascular Active Taper & Recovery',
        primaryAdaptation: 'Volume reduction to dissipate systemic fatigue and ensure optimal autonomic balance.',
        volumeIntensity: '2 sets × 8-10 reps @ 50% 1RM',
        tempo: '4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Pre-Graduation Recovery Optimization',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Active recovery microcycle: 40% volume reduction to maximize heart rate variability and nervous system recovery.',
      },

      // Week 12 Graduation (Zero 1RM Testing!)
      {
        weekNumber: 12,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: '12-Week Cardiovascular Transformation Graduation',
        primaryAdaptation: 'Submaximal aerobic threshold test, blood pressure recovery delta, and OHSA movement diagnostics.',
        volumeIntensity: 'Submaximal Diagnostic Protocol (Zero 1RM Testing)',
        tempo: 'Controlled Submaximal Diagnostic',
        restPeriod: '2 min',
        targetIntensity1RmPercent: 60,
        milestoneTitle: '12-Week Cardiovascular Graduation & Master Report',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Graduation week! Complete submaximal testing protocol with zero 1RM strain; celebrate cardiovascular conditioning gains.',
      },
    ]
  } else if (effectiveMaxPhase === 1) {
    defaultNotes = 'Phase 1 Stabilization Extended periodization: progressive neuromuscular joint alignment and balance stabilization.'
    baseWeekConfigs = [
      {
        weekNumber: 1,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Baseline Kinetic Chain Calibration',
        primaryAdaptation: 'Joint stability, postural correction, 4/2/1 tempo control.',
        volumeIntensity: '3 sets × 12-15 reps @ 50-60% 1RM',
        tempo: '4/2/1 (Slow Eccentric)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Baseline Postural Screen Complete',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Establish baseline movement patterns and enforce 4/2/1 tempo under full neuromuscular control.',
      },
      {
        weekNumber: 2,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Proprioceptive Progression',
        primaryAdaptation: 'Unstable yet controllable movement environments (BOSU / Single-leg).',
        volumeIntensity: '3 sets × 12-15 reps @ 55-60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Core Cylinder Activation Mastered',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on drawing-in maneuver and single-leg balance stability on multi-planar movements.',
      },
      {
        weekNumber: 3,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Muscular Endurance Overload',
        primaryAdaptation: 'Lactate buffering and isometric pause endurance.',
        volumeIntensity: '3-4 sets × 15 reps @ 60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: '14-Day Mobility Habit Streak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Increase volume density slightly while maintaining strict spinal alignment and breathing mechanics.',
      },
      {
        weekNumber: 4,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Stabilization Deload & Consolidation',
        primaryAdaptation: 'Neurological consolidation and joint recovery.',
        volumeIntensity: '2-3 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1 (Active SMR)',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Phase 1 Baseline Adaptation Certified',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Scheduled deload microcycle to dissipate joint fatigue before advancing stabilization complexity.',
      },
      {
        weekNumber: 5,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Multi-Planar Proprioceptive Challenge',
        primaryAdaptation: 'Transverse and frontal plane balance integration with slow tempo control.',
        volumeIntensity: '3 sets × 12-15 reps @ 60% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Multi-Planar Proprioception Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Challenge stabilization in the transverse plane while maintaining level hips and shoulders.',
      },
      {
        weekNumber: 6,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Unilateral Neuromuscular Efficiency',
        primaryAdaptation: 'Single-leg squat touchdowns and single-arm cable presses.',
        volumeIntensity: '3-4 sets × 12 reps @ 60-65% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 62,
        milestoneTitle: 'Unilateral Symmetry Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Address side-to-side asymmetries with dedicated unilateral single-leg loading.',
      },
      {
        weekNumber: 7,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Integrated Core Stiffness & Postural Endurance',
        primaryAdaptation: 'Continuous kinetic chain stability under anti-extension and anti-rotation demands.',
        volumeIntensity: '3-4 sets × 15 reps @ 65% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Core Cylinder Endurance Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Lock in 360-degree abdominal bracing and slow 4-second eccentric phases on all exercises.',
      },
      {
        weekNumber: 8,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Mid-Cycle Kinetic Chain Re-Assessment',
        primaryAdaptation: 'OHSA re-screen to verify kinetic compensation resolution.',
        volumeIntensity: '2 sets × 8 reps (Technical Screen)',
        tempo: '3/1/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Mid-Point Movement Re-Assessment Screen',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Mid-cycle movement audit: record your overhead squat and submit for kinetic chain delta review.',
      },
      {
        weekNumber: 9,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Advanced Unstable Base Stabilization',
        primaryAdaptation: 'High neuromuscular demand with controlled external loads.',
        volumeIntensity: '3-4 sets × 12-15 reps @ 65% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Advanced Dynamic Balance Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Execute lifts on unstable surface (foam pad or single-leg) with zero compensatory movement.',
      },
      {
        weekNumber: 10,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Total-Body Kinetic Integration',
        primaryAdaptation: 'Multi-joint kinetic chain synchronization with pristine postural endurance.',
        volumeIntensity: '3-4 sets × 12 reps @ 65% 1RM',
        tempo: '4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Kinetic Chain Synchronization Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on seamless kinetic sequencing from ankle through knee, hip, and cervical spine.',
      },
      {
        weekNumber: 11,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Pre-Screen Restorative Taper',
        primaryAdaptation: 'Volume taper to dissipate systemic fatigue before graduation diagnostics.',
        volumeIntensity: '2 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Pre-Graduation Recovery Optimization',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Active recovery microcycle: reduce training volume to prepare for graduation movement diagnostics.',
      },
      {
        weekNumber: 12,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: '12-Week Stabilization Graduation & Kinetic Mastery',
        primaryAdaptation: 'Submaximal OHSA movement screen delta, balance mastery, and joint alignment certification.',
        volumeIntensity: 'Diagnostic Protocol (Submaximal Kinetic Diagnostics - Zero 1RM Strain)',
        tempo: 'Standardized Diagnostic',
        restPeriod: '2 min',
        targetIntensity1RmPercent: 55,
        milestoneTitle: '12-Week Stabilization Graduation & Master Report',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Graduation week! Record final kinetic screens and celebrate your joint alignment and stability transformation.',
      },
    ]
  } else if (effectiveMaxPhase === 3) {
    defaultNotes = 'Phase 1-3 Hypertrophy periodization: progressive volume overload with submaximal work capacity testing.'
    baseWeekConfigs = [
      // Phase 1 (Weeks 1-4)
      {
        weekNumber: 1,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Baseline Kinetic Chain Calibration',
        primaryAdaptation: 'Joint stability, postural correction, 4/2/1 tempo control.',
        volumeIntensity: '3 sets × 12-15 reps @ 50-60% 1RM',
        tempo: '4/2/1 (Slow Eccentric)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Baseline Postural Screen Complete',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Establish baseline movement patterns and enforce 4/2/1 tempo under full neuromuscular control.',
      },
      {
        weekNumber: 2,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Proprioceptive Progression',
        primaryAdaptation: 'Unstable yet controllable movement environments (BOSU / Single-leg).',
        volumeIntensity: '3 sets × 12-15 reps @ 55-65% 1RM',
        tempo: '4/2/1 (Isometric Hold)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Core Cylinder Activation Mastered',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on drawing-in maneuver and single-leg balance stability on multi-planar movements.',
      },
      {
        weekNumber: 3,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Muscular Endurance Overload',
        primaryAdaptation: 'Lactate buffering and isometric pause endurance.',
        volumeIntensity: '3-4 sets × 15 reps @ 60-65% 1RM',
        tempo: '4/2/1 (Continuous Tension)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: '14-Day Mobility Habit Streak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Increase volume density slightly while maintaining strict spinal alignment and breathing mechanics.',
      },
      {
        weekNumber: 4,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Stabilization Deload & Transition',
        primaryAdaptation: 'Neurological consolidation and joint recovery.',
        volumeIntensity: '2-3 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1 (Active SMR)',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Phase 1 Adaptation Certified',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Scheduled deload microcycle to dissipate joint fatigue before launching superset strength work.',
      },

      // Phase 2 (Weeks 5-8)
      {
        weekNumber: 5,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Superset Introduction (Prime + Stabilizer)',
        primaryAdaptation: 'Heavy agonist followed immediately by stability exercise (0s rest).',
        volumeIntensity: '3-4 supersets × 8-12 reps @ 70-80% 1RM',
        tempo: '2/0/2 Agonist ➔ 4/2/1 Stabilizer',
        restPeriod: '0s intraset / 60s post-superset',
        targetIntensity1RmPercent: 75,
        milestoneTitle: 'First Superset Pairing Completed',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Transition directly from compound strength lift into biomechanical stabilizer with zero rest.',
      },
      {
        weekNumber: 6,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Metabolic Work Capacity Surge',
        primaryAdaptation: 'Volume density increase and systemic conditioning.',
        volumeIntensity: '4 supersets × 10 reps @ 75-80% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 78,
        milestoneTitle: 'Mid-Cycle Biometric Check-In',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Push metabolic density while maintaining strict agonist-antagonist joint symmetry.',
      },
      {
        weekNumber: 7,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Peak Superset Intensity',
        primaryAdaptation: 'NASM 2-for-2 overload trigger on compound supersets.',
        volumeIntensity: '4 supersets × 8-10 reps @ 80% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 80,
        milestoneTitle: '2-for-2 Progression Overload Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Trigger NASM 2-for-2 rule: if you complete 2 extra reps on the final set, increase load by 5%.',
      },
      {
        weekNumber: 8,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Mid-Cycle Movement Re-Assessment',
        primaryAdaptation: 'OHSA re-screen to verify kinetic compensation resolution.',
        volumeIntensity: '2 sets × 8 reps (Technical Screen)',
        tempo: '3/1/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Mid-Point Movement Re-Assessment Screen',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Mid-cycle movement audit: record your overhead squat and submit for kinetic chain delta review.',
      },

      // Phase 3 (Weeks 9-11)
      {
        weekNumber: 9,
        phase: 'Phase 3: Muscular Development',
        phaseNumber: 3,
        theme: 'Hypertrophic Volume Overload',
        primaryAdaptation: 'Maximizing mechanical tension and volume density (6-12 reps, 75-80% 1RM).',
        volumeIntensity: '3-4 sets × 8-12 reps @ 75-80% 1RM',
        tempo: '2/0/2',
        restPeriod: '60s',
        targetIntensity1RmPercent: 78,
        milestoneTitle: 'Hypertrophic Volume Peak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on full range of motion mechanical tension and controlled 2-second eccentrics.',
      },
      {
        weekNumber: 10,
        phase: 'Phase 3: Muscular Development',
        phaseNumber: 3,
        theme: 'Metabolic Stress & Work Capacity',
        primaryAdaptation: 'Intramuscular cross-sectional area and sarcoplasmic stimulation.',
        volumeIntensity: '4 sets × 10-12 reps @ 75-80% 1RM',
        tempo: '2/0/2',
        restPeriod: '60s',
        targetIntensity1RmPercent: 80,
        milestoneTitle: 'Muscular Work Capacity Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maintain steady pacing and high density while keeping spinal bracing rigid.',
      },
      {
        weekNumber: 11,
        phase: 'Phase 3: Muscular Development',
        phaseNumber: 3,
        theme: 'Hypertrophy Taper & Recovery',
        primaryAdaptation: 'Volume dissipation to allow muscular supercompensation.',
        volumeIntensity: '2-3 sets × 8 reps @ 65% 1RM',
        tempo: '2/0/2',
        restPeriod: '90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Pre-Assessment Recovery Optimization',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Taper microcycle: dissipate muscular fatigue before final work capacity assessment.',
      },

      // Week 12 Graduation (Submaximal Assessment - Zero 1RM strain)
      {
        weekNumber: 12,
        phase: 'Phase 3: Muscular Development',
        phaseNumber: 3,
        theme: '12-Week Hypertrophy & Work Capacity Assessment',
        primaryAdaptation: 'Submaximal 10-rep benchmark testing and OHSA movement diagnostics.',
        volumeIntensity: 'Submaximal 10-Rep Testing Protocol (Zero 1RM Strain)',
        tempo: 'Controlled Standardized Diagnostic',
        restPeriod: '2 min',
        targetIntensity1RmPercent: 75,
        milestoneTitle: '12-Week Hypertrophy Transformation Graduation',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Graduation testing week! Record submaximal 10-rep benchmarks and celebrate muscular adaptations.',
      },
    ]
  } else {
    // Standard Healthy Athlete Track (Phases 1, 2, 4, 5)
    baseWeekConfigs = [
      // Phase 1 (Weeks 1-4)
      {
        weekNumber: 1,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Baseline Kinetic Chain Calibration',
        primaryAdaptation: 'Joint stability, postural correction, 4/2/1 tempo control.',
        volumeIntensity: '3 sets × 12-15 reps @ 50-60% 1RM',
        tempo: '4/2/1 (Slow Eccentric)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 55,
        milestoneTitle: 'Baseline Postural Screen Complete',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Establish baseline movement patterns and enforce 4/2/1 tempo under full neuromuscular control.',
      },
      {
        weekNumber: 2,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Proprioceptive Progression',
        primaryAdaptation: 'Unstable yet controllable movement environments (BOSU / Single-leg).',
        volumeIntensity: '3 sets × 12-15 reps @ 55-65% 1RM',
        tempo: '4/2/1 (Isometric Hold)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 60,
        milestoneTitle: 'Core Cylinder Activation Mastered',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Focus on drawing-in maneuver and single-leg balance stability on multi-planar movements.',
      },
      {
        weekNumber: 3,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Muscular Endurance Overload',
        primaryAdaptation: 'Lactate buffering and isometric pause endurance.',
        volumeIntensity: '3-4 sets × 15 reps @ 60-65% 1RM',
        tempo: '4/2/1 (Continuous Tension)',
        restPeriod: '60s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: '14-Day Mobility Habit Streak',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Increase volume density slightly while maintaining strict spinal alignment and breathing mechanics.',
      },
      {
        weekNumber: 4,
        phase: 'Phase 1: Stabilization',
        phaseNumber: 1,
        theme: 'Stabilization Deload & Transition',
        primaryAdaptation: 'Neurological consolidation and joint recovery.',
        volumeIntensity: '2-3 sets × 10 reps @ 50% 1RM',
        tempo: '4/2/1 (Active SMR)',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Phase 1 Adaptation Certified',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Scheduled deload microcycle to dissipate joint fatigue before launching superset strength work.',
      },

      // Phase 2 (Weeks 5-8)
      {
        weekNumber: 5,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Superset Introduction (Prime + Stabilizer)',
        primaryAdaptation: 'Heavy agonist followed immediately by stability exercise (0s rest).',
        volumeIntensity: '3-4 supersets × 8-12 reps @ 70-80% 1RM',
        tempo: '2/0/2 Agonist ➔ 4/2/1 Stabilizer',
        restPeriod: '0s intraset / 60s post-superset',
        targetIntensity1RmPercent: 75,
        milestoneTitle: 'First Superset Pairing Completed',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Transition directly from compound strength lift into biomechanical stabilizer with zero rest.',
      },
      {
        weekNumber: 6,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Metabolic Work Capacity Surge',
        primaryAdaptation: 'Volume density increase and systemic conditioning.',
        volumeIntensity: '4 supersets × 10 reps @ 75-80% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 78,
        milestoneTitle: 'Mid-Cycle Biometric Check-In',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Push metabolic density while maintaining strict agonist-antagonist joint symmetry.',
      },
      {
        weekNumber: 7,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Peak Superset Intensity',
        primaryAdaptation: 'NASM 2-for-2 overload trigger on compound supersets.',
        volumeIntensity: '4 supersets × 8-10 reps @ 80% 1RM',
        tempo: '2/0/2 / 4/2/1',
        restPeriod: '60s',
        targetIntensity1RmPercent: 80,
        milestoneTitle: '2-for-2 Progression Overload Milestone',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Trigger NASM 2-for-2 rule: if you complete 2 extra reps on the final set, increase load by 5%.',
      },
      {
        weekNumber: 8,
        phase: 'Phase 2: Strength Endurance',
        phaseNumber: 2,
        theme: 'Mid-Cycle Movement Re-Assessment',
        primaryAdaptation: 'OHSA re-screen to verify kinetic compensation resolution.',
        volumeIntensity: '2 sets × 8 reps (Technical Screen)',
        tempo: '3/1/1',
        restPeriod: '90s',
        targetIntensity1RmPercent: 65,
        milestoneTitle: 'Mid-Point Movement Re-Assessment Screen',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Mid-cycle movement audit: record your overhead squat and submit for kinetic chain delta review.',
      },

      // Phase 4 (Weeks 9-11)
      {
        weekNumber: 9,
        phase: 'Phase 4: Maximal Strength',
        phaseNumber: 4,
        theme: 'High-Threshold Motor Unit Recruitment',
        primaryAdaptation: 'Intramuscular coordination and heavy neural drive (2/0/1 tempo).',
        volumeIntensity: '4-5 sets × 4-6 reps @ 85% 1RM',
        tempo: '2/0/1 (Explosive Concentric)',
        restPeriod: '2-3 min',
        targetIntensity1RmPercent: 85,
        milestoneTitle: 'Heavy Compound Lift Unlock',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Maximum motor unit recruitment: take full 2-3 minute rest periods to ensure complete ATP-PC recovery.',
      },
      {
        weekNumber: 10,
        phase: 'Phase 4: Maximal Strength',
        phaseNumber: 4,
        theme: 'Peak Load Overload',
        primaryAdaptation: 'Maximal force production under controlled compound mechanics.',
        volumeIntensity: '4-5 sets × 3-5 reps @ 87.5-90% 1RM',
        tempo: '2/0/1',
        restPeriod: '3 min',
        targetIntensity1RmPercent: 88,
        milestoneTitle: 'Estimated 1RM Personal Record Breakthrough',
        isReassessmentWeek: false,
        coachWeeklyMemo: 'Peak neural drive microcycle. Execute barbell compound lifts with textbook bracing mechanics.',
      },
      {
        weekNumber: 11,
        phase: 'Phase 4: Maximal Strength',
        phaseNumber: 4,
        theme: 'Taper & Neural Recovery',
        primaryAdaptation: 'Volume reduction to dissipate fatigue before peak testing.',
        volumeIntensity: '3 sets × 3 reps @ 75% 1RM',
        tempo: '2/0/2',
        restPeriod: '2 min',
        targetIntensity1RmPercent: 75,
        milestoneTitle: 'Pre-Test Recovery Optimization',
        isReassessmentWeek: false,
        isDeloadWeek: true,
        coachWeeklyMemo: 'Active taper: reduce training volume by 40% while maintaining crisp speed to allow CNS supercompensation.',
      },

      // Week 12 Peak Testing
      {
        weekNumber: 12,
        phase: 'Peak Performance & Re-Assessment',
        phaseNumber: 5,
        theme: '12-Week Transformation Testing & Graduation',
        primaryAdaptation: 'Final OHSA re-screen, YMCA Step Test recovery, and 1RM testing.',
        volumeIntensity: 'Testing Protocol (1RM + Full Movement Diagnostics)',
        tempo: 'Standardized Diagnostic',
        restPeriod: '3 min',
        targetIntensity1RmPercent: 95,
        milestoneTitle: '12-Week Transformation Graduation & Master Report',
        isReassessmentWeek: true,
        coachWeeklyMemo: 'Graduation testing week! Record peak kinetic screens and celebrate your macrocycle transformation.',
      },
    ]
  }

  const weeks: RoadmapWeek[] = baseWeekConfigs.map(w => {
    let status: RoadmapWeek['status'] = 'upcoming'
    if (w.weekNumber < clampedWeek) status = 'completed'
    else if (w.weekNumber === clampedWeek) status = 'current'
    return {
      ...w,
      status,
    }
  })

  const phases = recalculatePhaseRanges(weeks)

  return {
    macrocycleId: `macrocycle-12wk-${Date.now()}`,
    clientGoal: clientGoalVal,
    totalWeeks: weeks.length,
    currentWeek: clampedWeek,
    adaptationVelocity: adaptationVelocityVal,
    coachNotes: coachNotesVal || defaultNotes,
    coachCalibratedAt: null,
    phases,
    weeks,
    projectedStrengthGainPercent: specialPopulationVal ? 12 : 18,
    projectedMobilityGainPercent: specialPopulationVal ? 50 : 45,
    specialPopulation: specialPopulationVal || null,
    maxAllowedOptPhase: effectiveMaxPhase,
    contraindicationTags: contraindicationTagsVal || (specialPopulationVal ? [specialPopulationVal] : []),
  }
}

/**
 * Inserts an Active Restorative Deload Microcycle at a specified week number.
 * Shifts all downstream weeks forward by 1 week seamlessly.
 */
export function insertDeloadWeek(
  macrocycle: MacrocyclePlan,
  atWeekNumber: number,
  customMemo?: string
): MacrocyclePlan {
  const targetIndex = Math.max(0, Math.min(macrocycle.weeks.length, atWeekNumber - 1))
  const currentWeekObj = macrocycle.weeks[targetIndex] || macrocycle.weeks[0]

  const newDeloadWeek: RoadmapWeek = {
    weekNumber: atWeekNumber,
    phase: `${currentWeekObj.phase} (Restorative Deload)`,
    phaseNumber: currentWeekObj.phaseNumber,
    theme: 'Active Restorative Deload & Joint Regeneration',
    primaryAdaptation: 'Dissipation of systemic fatigue, connective tissue repair, and active SMR mobilization.',
    volumeIntensity: '2 sets × 10 reps @ 50% 1RM (Low CNS Load)',
    tempo: '4/2/1 (Restorative)',
    restPeriod: '90s',
    targetIntensity1RmPercent: 50,
    milestoneTitle: 'Active Recovery & Tissue Re-calibration',
    isReassessmentWeek: false,
    isDeloadWeek: true,
    status: atWeekNumber === macrocycle.currentWeek ? 'current' : atWeekNumber < macrocycle.currentWeek ? 'completed' : 'upcoming',
    coachWeeklyMemo: customMemo || 'Coach Gordon inserted an active recovery microcycle to clear acute fatigue and protect joints.',
  }

  const updatedWeeks: RoadmapWeek[] = []
  for (let i = 0; i < macrocycle.weeks.length; i++) {
    if (i === targetIndex) {
      updatedWeeks.push(newDeloadWeek)
    }
    const w = macrocycle.weeks[i]
    const newWeekNum = i >= targetIndex ? w.weekNumber + 1 : w.weekNumber
    let status: RoadmapWeek['status'] = 'upcoming'
    if (newWeekNum < macrocycle.currentWeek) status = 'completed'
    else if (newWeekNum === macrocycle.currentWeek) status = 'current'

    updatedWeeks.push({
      ...w,
      weekNumber: newWeekNum,
      status,
    })
  }

  return {
    ...macrocycle,
    totalWeeks: updatedWeeks.length,
    adaptationVelocity: 'setback',
    coachCalibratedAt: new Date().toISOString(),
    phases: recalculatePhaseRanges(updatedWeeks),
    weeks: updatedWeeks,
  }
}

/**
 * Accelerates the client to the next OPT™ phase ahead of schedule (High Responders / Accelerated Mastery).
 * Strictly enforces macrocycle.maxAllowedOptPhase to protect special populations and clinical restrictions.
 */
export function acceleratePhaseTransition(
  macrocycle: MacrocyclePlan,
  fromWeekNumber: number,
  targetPhaseNumber: number,
  coachMemo?: string
): MacrocyclePlan {
  const maxAllowed = macrocycle.maxAllowedOptPhase ?? 5
  const clampedPhaseNumber = Math.min(targetPhaseNumber, maxAllowed)
  const isCapped = clampedPhaseNumber < targetPhaseNumber
  const targetPhaseMeta = OPT_PHASE_DESCRIPTIONS[clampedPhaseNumber] || OPT_PHASE_DESCRIPTIONS[2]

  const effectiveMemo = isCapped
    ? (coachMemo
        ? `${coachMemo} [Safety Guard: Accelerated progression safely capped at Phase ${clampedPhaseNumber} due to ${macrocycle.specialPopulation || 'clinical restrictions'}]`
        : `Accelerated progression safely capped at Phase ${clampedPhaseNumber} due to ${macrocycle.specialPopulation || 'clinical restrictions'}.`)
    : (coachMemo || `Accelerated transition into ${targetPhaseMeta.name} following early benchmark mastery.`)

  const updatedWeeks = macrocycle.weeks.map(w => {
    if (w.weekNumber >= fromWeekNumber) {
      // Re-architect starting from this week into the advanced phase
      return {
        ...w,
        phase: targetPhaseMeta.name,
        phaseNumber: clampedPhaseNumber,
        theme: `Accelerated ${targetPhaseMeta.name} Progression`,
        primaryAdaptation: targetPhaseMeta.focus,
        volumeIntensity:
          clampedPhaseNumber === 1
            ? '3 sets × 12-15 reps @ 50-60% 1RM'
            : clampedPhaseNumber === 2
            ? '3-4 supersets × 8-12 reps @ 75% 1RM'
            : clampedPhaseNumber === 4
            ? '4-5 sets × 4-6 reps @ 85% 1RM'
            : '3-4 sets × 10-12 reps @ 75% 1RM',
        tempo: clampedPhaseNumber === 1 ? '4/2/1' : clampedPhaseNumber === 2 ? '2/0/2 / 4/2/1' : clampedPhaseNumber === 4 ? '2/0/1' : '3/1/1',
        restPeriod: clampedPhaseNumber === 1 ? '60s' : clampedPhaseNumber === 2 ? '0s intraset / 60s rest' : clampedPhaseNumber === 4 ? '2-3 min' : '60s',
        targetIntensity1RmPercent: clampedPhaseNumber === 1 ? 55 : clampedPhaseNumber === 2 ? 75 : clampedPhaseNumber === 4 ? 85 : 70,
        coachWeeklyMemo: effectiveMemo,
      }
    }
    return w
  })

  return {
    ...macrocycle,
    adaptationVelocity: 'accelerated',
    coachCalibratedAt: new Date().toISOString(),
    phases: recalculatePhaseRanges(updatedWeeks),
    weeks: updatedWeeks,
  }
}

/**
 * Extends the current OPT™ phase by adding 1 or more microcycles (e.g. for extra stabilization or persistent movement compensations).
 */
export function extendCurrentPhase(
  macrocycle: MacrocyclePlan,
  phaseNumber: number,
  additionalWeeks: number = 1,
  coachMemo?: string
): MacrocyclePlan {
  const phaseWeeks = macrocycle.weeks.filter(w => w.phaseNumber === phaseNumber)
  if (phaseWeeks.length === 0) return macrocycle

  const lastPhaseWeek = phaseWeeks[phaseWeeks.length - 1]
  const insertIndex = macrocycle.weeks.findIndex(w => w.weekNumber === lastPhaseWeek.weekNumber) + 1

  const newWeeksToAdd: RoadmapWeek[] = []
  for (let step = 1; step <= additionalWeeks; step++) {
    newWeeksToAdd.push({
      weekNumber: lastPhaseWeek.weekNumber + step,
      phase: lastPhaseWeek.phase,
      phaseNumber: lastPhaseWeek.phaseNumber,
      theme: `${lastPhaseWeek.theme} (Reinforcement Microcycle +${step})`,
      primaryAdaptation: 'Extended kinetic chain stabilization, motor learning consolidation, and joint longevity.',
      volumeIntensity: '3-4 sets × 12 reps @ 65% 1RM',
      tempo: '4/2/1 (Slow Eccentric)',
      restPeriod: '60s',
      targetIntensity1RmPercent: 65,
      milestoneTitle: `Kinetic Reinforcement Checkpoint ${step}`,
      isReassessmentWeek: false,
      status: 'upcoming',
      coachWeeklyMemo: coachMemo || `Coach Gordon extended ${lastPhaseWeek.phase} to solidify movement quality before advancing load.`,
    })
  }

  const updatedWeeks: RoadmapWeek[] = []
  let currentNum = 1
  for (let i = 0; i < macrocycle.weeks.length; i++) {
    if (i === insertIndex) {
      for (const extra of newWeeksToAdd) {
        let status: RoadmapWeek['status'] = 'upcoming'
        if (currentNum < macrocycle.currentWeek) status = 'completed'
        else if (currentNum === macrocycle.currentWeek) status = 'current'
        updatedWeeks.push({ ...extra, weekNumber: currentNum++, status })
      }
    }
    const w = macrocycle.weeks[i]
    let status: RoadmapWeek['status'] = 'upcoming'
    if (currentNum < macrocycle.currentWeek) status = 'completed'
    else if (currentNum === macrocycle.currentWeek) status = 'current'
    updatedWeeks.push({ ...w, weekNumber: currentNum++, status })
  }

  return {
    ...macrocycle,
    totalWeeks: updatedWeeks.length,
    adaptationVelocity: 'remedial',
    coachCalibratedAt: new Date().toISOString(),
    phases: recalculatePhaseRanges(updatedWeeks),
    weeks: updatedWeeks,
  }
}

/**
 * Applies immediate Setback / Joint Discomfort Modulation to a specific week.
 */
export function applySetbackCorrection(
  macrocycle: MacrocyclePlan,
  atWeekNumber: number,
  setbackReason: string = 'Joint discomfort or acute movement compensation',
  coachMemo?: string
): MacrocyclePlan {
  const updatedWeeks = macrocycle.weeks.map(w => {
    if (w.weekNumber === atWeekNumber) {
      return {
        ...w,
        theme: `Setback Mitigation: ${setbackReason}`,
        primaryAdaptation: 'Joint decompression, SMR inhibition of overactive synergists, and slow eccentric stabilization.',
        volumeIntensity: '2-3 sets × 12-15 reps @ 50% 1RM (Low Shearing Force)',
        tempo: '4/2/1 (Controlled Tempo)',
        restPeriod: '90s',
        targetIntensity1RmPercent: 50,
        milestoneTitle: 'Joint Decompression Screen',
        isDeloadWeek: true,
        coachWeeklyMemo: coachMemo || `Coach Gordon modulated acute variables to address ${setbackReason}. Focus on perfect kinetic alignment.`,
      }
    }
    return w
  })

  return {
    ...macrocycle,
    adaptationVelocity: 'setback',
    coachCalibratedAt: new Date().toISOString(),
    phases: recalculatePhaseRanges(updatedWeeks),
    weeks: updatedWeeks,
  }
}

/**
 * Coach Granular Editor for any individual microcycle week.
 */
export function updateMicrocycleWeek(
  macrocycle: MacrocyclePlan,
  weekNumber: number,
  updates: Partial<RoadmapWeek>
): MacrocyclePlan {
  const maxAllowed = macrocycle.maxAllowedOptPhase ?? 5
  const safeUpdates = { ...updates }
  if (typeof safeUpdates.phaseNumber === 'number' && safeUpdates.phaseNumber > maxAllowed) {
    safeUpdates.phaseNumber = maxAllowed
    safeUpdates.phase = OPT_PHASE_DESCRIPTIONS[maxAllowed]?.name || `Phase ${maxAllowed}`
  }

  const updatedWeeks = macrocycle.weeks.map(w => {
    if (w.weekNumber === weekNumber) {
      const merged = { ...w, ...safeUpdates }
      // If phase number changed, update phase name automatically
      if (safeUpdates.phaseNumber && !safeUpdates.phase) {
        merged.phase = OPT_PHASE_DESCRIPTIONS[safeUpdates.phaseNumber]?.name || `Phase ${safeUpdates.phaseNumber}`
      }
      return merged
    }
    return w
  })

  return {
    ...macrocycle,
    coachCalibratedAt: new Date().toISOString(),
    phases: recalculatePhaseRanges(updatedWeeks),
    weeks: updatedWeeks,
  }
}

export interface MicrocycleProgress {
  currentWeek: number
  sessionInWeek: number
  sessionsPerWeek: number
  completedInCurrentWeek: number
  totalCompletedWorkouts: number
  progressInWeekPercent: number
  isMicrocycleComplete: boolean
  displayLabel: string
}

/**
 * Calculates the athlete's active microcycle training week and session index
 * strictly based on completed workout volume rather than solar calendar rollovers.
 */
export function calculateActiveMicrocycleProgress(
  completedWorkoutCount: number,
  sessionsPerWeek: number = 4,
  totalMacrocycleWeeks: number = 12,
  overrideCompletedInWeek?: number | null
): MicrocycleProgress {
  const safeCount = Math.max(0, Math.floor(completedWorkoutCount || 0))
  const safeSessionsPerWeek = Math.max(1, Math.floor(sessionsPerWeek || 4))
  const safeTotalWeeks = Math.max(1, Math.floor(totalMacrocycleWeeks || 12))

  const completedWeeks = Math.floor(safeCount / safeSessionsPerWeek)
  const currentWeek = Math.min(safeTotalWeeks, completedWeeks + 1)
  const completedInCurrentWeek =
    typeof overrideCompletedInWeek === 'number' && !isNaN(overrideCompletedInWeek)
      ? Math.max(0, Math.min(safeSessionsPerWeek, Math.floor(overrideCompletedInWeek)))
      : safeCount % safeSessionsPerWeek
  const sessionInWeek = Math.min(safeSessionsPerWeek, completedInCurrentWeek + 1)
  const progressInWeekPercent = Math.round((completedInCurrentWeek / safeSessionsPerWeek) * 100)
  const isMicrocycleComplete = safeCount > 0 && completedInCurrentWeek === 0

  const displayLabel = `Week ${currentWeek} · Session ${sessionInWeek} of ${safeSessionsPerWeek}`

  return {
    currentWeek,
    sessionInWeek,
    sessionsPerWeek: safeSessionsPerWeek,
    completedInCurrentWeek,
    totalCompletedWorkouts: safeCount,
    progressInWeekPercent,
    isMicrocycleComplete,
    displayLabel,
  }
}

/**
 * Synchronizes a MacrocyclePlan with the athlete's cumulative completed workout volume.
 * Updates currentWeek and week statuses ('completed', 'current', 'upcoming').
 */
export function syncMacrocycleWithCompletedWorkouts(
  macrocycle: MacrocyclePlan,
  completedWorkoutCount: number,
  sessionsPerWeek: number = 4
): MacrocyclePlan {
  if (completedWorkoutCount <= 0 && typeof macrocycle.currentWeek === 'number' && macrocycle.currentWeek > 0) {
    return macrocycle
  }

  const progress = calculateActiveMicrocycleProgress(
    completedWorkoutCount,
    sessionsPerWeek,
    macrocycle.totalWeeks || macrocycle.weeks.length || 12
  )

  // If coach explicitly calibrated a forward week, keep the coach advance unless client volume surpassed it
  const activeWeekNum = macrocycle.coachCalibratedAt && macrocycle.currentWeek > progress.currentWeek
    ? macrocycle.currentWeek
    : progress.currentWeek

  const updatedWeeks: RoadmapWeek[] = macrocycle.weeks.map(w => {
    let status: RoadmapWeek['status'] = 'upcoming'
    if (w.weekNumber < activeWeekNum) {
      status = 'completed'
    } else if (w.weekNumber === activeWeekNum) {
      status = 'current'
    }
    return {
      ...w,
      status,
    }
  })

  return {
    ...macrocycle,
    currentWeek: activeWeekNum,
    weeks: updatedWeeks,
    phases: recalculatePhaseRanges(updatedWeeks),
  }
}



