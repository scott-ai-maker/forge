/**
 * 12-Week Interactive Macrocycle Periodization Roadmap Engine
 * Generates structured NASM OPT macrocycle timelines, milestone checkpoints, and dynamic coach modulations.
 */

export type AdaptationVelocity = 'accelerated' | 'standard' | 'remedial' | 'setback'

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
export function generate12WeekMacrocycle(
  currentWeek: number = 1,
  clientGoal: string = 'Body Recomposition & Maximal Power',
  adaptationVelocity: AdaptationVelocity = 'standard',
  coachNotes?: string
): MacrocyclePlan {
  const clampedWeek = Math.max(1, Math.min(12, currentWeek))

  const baseWeekConfigs: Omit<RoadmapWeek, 'status'>[] = [
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
    clientGoal,
    totalWeeks: weeks.length,
    currentWeek: clampedWeek,
    adaptationVelocity,
    coachNotes: coachNotes || 'Baseline NASM OPT periodization calibrated for optimal structural integrity and power.',
    coachCalibratedAt: null,
    phases,
    weeks,
    projectedStrengthGainPercent: 18,
    projectedMobilityGainPercent: 45,
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
 */
export function acceleratePhaseTransition(
  macrocycle: MacrocyclePlan,
  fromWeekNumber: number,
  targetPhaseNumber: number,
  coachMemo?: string
): MacrocyclePlan {
  const targetPhaseMeta = OPT_PHASE_DESCRIPTIONS[targetPhaseNumber] || OPT_PHASE_DESCRIPTIONS[2]

  const updatedWeeks = macrocycle.weeks.map(w => {
    if (w.weekNumber >= fromWeekNumber) {
      // Re-architect starting from this week into the advanced phase
      return {
        ...w,
        phase: targetPhaseMeta.name,
        phaseNumber: targetPhaseNumber,
        theme: `Accelerated ${targetPhaseMeta.name} Progression`,
        primaryAdaptation: targetPhaseMeta.focus,
        volumeIntensity: targetPhaseNumber === 2 ? '3-4 supersets × 8-12 reps @ 75% 1RM' : targetPhaseNumber === 4 ? '4-5 sets × 4-6 reps @ 85% 1RM' : '3-4 sets × 10-12 reps @ 75% 1RM',
        tempo: targetPhaseNumber === 2 ? '2/0/2 / 4/2/1' : targetPhaseNumber === 4 ? '2/0/1' : '3/1/1',
        restPeriod: targetPhaseNumber === 2 ? '0s intraset / 60s rest' : targetPhaseNumber === 4 ? '2-3 min' : '60s',
        targetIntensity1RmPercent: targetPhaseNumber === 2 ? 75 : targetPhaseNumber === 4 ? 85 : 70,
        coachWeeklyMemo: coachMemo || `Accelerated transition into ${targetPhaseMeta.name} following early benchmark mastery.`,
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
  const updatedWeeks = macrocycle.weeks.map(w => {
    if (w.weekNumber === weekNumber) {
      const merged = { ...w, ...updates }
      // If phase number changed, update phase name automatically
      if (updates.phaseNumber && !updates.phase) {
        merged.phase = OPT_PHASE_DESCRIPTIONS[updates.phaseNumber]?.name || `Phase ${updates.phaseNumber}`
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



