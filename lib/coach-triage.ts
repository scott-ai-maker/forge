/**
 * Master Consultant Executive Triage Engine
 * Evaluates client telemetry, ACWR workload ratios, compliance, recovery, and medical flags to build an executive action queue for coaches.
 */

export type PeriodizationAutoTriageAction =
  | 'insert_deload'
  | 'setback_protocol'
  | 'accelerate_phase'
  | 'extend_phase'
  | null

export interface ClientTriageSummary {
  clientId: string
  clientName: string
  email: string
  priority: 'red' | 'amber' | 'green'
  priorityRank: number // 1 for Red, 2 for Amber, 3 for Green
  primaryReason: string
  readinessScore?: number | null // 0 - 100 or null if no data
  adherencePercent: number // 0 - 100
  daysSinceLastCheckin: number
  hasPendingVideoCritique: boolean
  hasMedicalRedFlag: boolean
  hasReportedPain: boolean
  currentOptPhase: number
  recommendedAction: string
  acwrRatio?: number | null
  acwrZone?: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data'
  acuteWorkloadUnits?: number
  chronicWorkloadUnits?: number
  primaryFatiguedMuscles?: string[]
  suggestedPeriodizationAction?: PeriodizationAutoTriageAction
  suggestedActionLabel?: string
}

export interface ClientRawTelemetry {
  clientId: string
  clientName: string
  email: string
  daysSinceLastCheckin: number
  readinessScore?: number | null
  completionRate14d?: number
  hasPendingVideoCritique?: boolean
  hasMedicalRedFlag?: boolean
  reportedPainInLogs?: boolean
  currentOptPhase?: number
  acwrRatio?: number | null
  acuteWorkloadUnits?: number
  chronicWorkloadUnits?: number
  primaryFatiguedMuscles?: string[]
  hasAchievedOverload?: boolean
}

/**
 * Calculates rolling Acute (7-day) vs Chronic (28-day weekly average) Workload from workout logs.
 */
export function calculateAcwrFromWorkoutLogs(
  workoutLogs: Array<{ session_date?: string | null; created_at?: string | null; exertion_rpe?: number | null; total_volume?: number | null; duration_minutes?: number | null; completed?: boolean | null }> = [],
  workoutSetLogs: Array<{ session_date?: string | null; created_at?: string | null; reps?: number | string | null; weight_lbs?: number | string | null; weight_kg?: number | string | null; rpe?: number | string | null }> = [],
  referenceDate: number = Date.now()
): {
  acwrRatio: number | null
  acuteWorkloadUnits: number
  chronicWorkloadUnits: number
  acwrZone: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data'
  hasData: boolean
  isCalibrating?: boolean
} {
  const ONE_DAY_MS = 1000 * 60 * 60 * 24
  let acuteVolume = 0
  let chronicVolume = 0
  let oldestAgeDays = 0

  // Tally set logs
  for (const set of workoutSetLogs) {
    const rawDate = set.session_date || set.created_at
    if (!rawDate) continue
    const dateMs = new Date(rawDate).getTime()
    if (isNaN(dateMs)) continue

    const ageDays = (referenceDate - dateMs) / ONE_DAY_MS
    if (ageDays < 0 || ageDays > 28) continue

    if (ageDays > oldestAgeDays) {
      oldestAgeDays = ageDays
    }

    const reps = Number(set.reps) || 10
    const weight = Number(set.weight_lbs || set.weight_kg) || 50
    const rpe = Number(set.rpe) || 8
    const setLoadUnits = Math.round((reps * (weight > 0 ? Math.log10(weight + 10) * 10 : 10) * (rpe / 10)))

    if (ageDays <= 7) {
      acuteVolume += setLoadUnits
    }
    chronicVolume += setLoadUnits
  }

  // Tally workout logs if set logs empty
  if (acuteVolume === 0 && chronicVolume === 0 && workoutLogs.length > 0) {
    for (const log of workoutLogs) {
      const rawDate = log.session_date || log.created_at
      if (!rawDate) continue
      const dateMs = new Date(rawDate).getTime()
      if (isNaN(dateMs)) continue

      const ageDays = (referenceDate - dateMs) / ONE_DAY_MS
      if (ageDays < 0 || ageDays > 28) continue

      if (ageDays > oldestAgeDays) {
        oldestAgeDays = ageDays
      }

      const baseLoad = (log.total_volume || log.duration_minutes || 45) * 10
      if (ageDays <= 7) {
        acuteVolume += baseLoad
      }
      chronicVolume += baseLoad
    }
  }

  // If no workout or set volume exists in the 28-day window, report No Data
  if (acuteVolume === 0 && chronicVolume === 0) {
    return {
      acwrRatio: null,
      acuteWorkloadUnits: 0,
      chronicWorkloadUnits: 0,
      acwrZone: 'No Data',
      hasData: false,
      isCalibrating: false,
    }
  }

  // Sports Science Cold-Start Baseline Protection (Gabbett / NASM CPT-7):
  // When an athlete is in their calibration phase (e.g. week 1, or all volume is in the acute window),
  // dividing chronicVolume by 4 falsely assumes 3 preceding weeks of zero training, which mathematically
  // forces ACWR to 4.00 (V / (V/4)). Instead, scale the chronic baseline window by the active weeks (1 to 4)
  // of history established so far.
  const baselineWeeks = oldestAgeDays <= 7 || chronicVolume === acuteVolume
    ? 1
    : oldestAgeDays <= 14
    ? 2
    : oldestAgeDays <= 21
    ? 3
    : 4

  const isCalibrating = baselineWeeks < 4
  const chronicWeeklyAvg = Math.max(1, Math.round(chronicVolume / baselineWeeks))
  const ratio = Math.round((acuteVolume / chronicWeeklyAvg) * 100) / 100

  let acwrZone: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data' = 'Sweet Spot'
  if (ratio < 0.8) acwrZone = 'Under-training'
  else if (ratio <= 1.30) acwrZone = 'Sweet Spot'
  else if (ratio <= 1.49) acwrZone = 'Overreaching'
  else acwrZone = 'Danger Zone'

  return {
    acwrRatio: ratio,
    acuteWorkloadUnits: acuteVolume,
    chronicWorkloadUnits: chronicWeeklyAvg,
    acwrZone,
    hasData: true,
    isCalibrating,
  }
}

export function evaluateClientTriage(raw: ClientRawTelemetry): ClientTriageSummary {
  const {
    clientId,
    clientName,
    email,
    daysSinceLastCheckin,
    readinessScore = null,
    completionRate14d = 85,
    hasPendingVideoCritique = false,
    hasMedicalRedFlag = false,
    reportedPainInLogs = false,
    currentOptPhase = 1,
    acwrRatio = null,
    acuteWorkloadUnits,
    chronicWorkloadUnits,
    primaryFatiguedMuscles = [],
    hasAchievedOverload = false,
  } = raw

  const hasAcwr = typeof acwrRatio === 'number' && Number.isFinite(acwrRatio)
  const hasReadiness = typeof readinessScore === 'number' && Number.isFinite(readinessScore)

  // Priority Decision Logic
  let priority: ClientTriageSummary['priority'] = 'green'
  let primaryReason = 'Executing autonomously with optimal compliance & recovery.'
  let recommendedAction = 'No immediate intervention required. On track.'
  let suggestedPeriodizationAction: PeriodizationAutoTriageAction = null
  let suggestedActionLabel: string | undefined = undefined

  // 1. DANGER / RED FLAGS
  if (hasMedicalRedFlag) {
    priority = 'red'
    primaryReason = 'High-risk medical symptom reported; physician clearance required.'
    recommendedAction = 'Review liability shield & adjust phase authorization.'
  } else if (hasAcwr && acwrRatio! >= 1.50) {
    priority = 'red'
    primaryReason = `ACWR Danger Spike (${acwrRatio!.toFixed(2)}): Acute workload increased >50% over baseline. High soft-tissue injury risk.`
    recommendedAction = 'Insert 1-Click Restorative Deload Week into macrocycle roadmap.'
    suggestedPeriodizationAction = 'insert_deload'
    suggestedActionLabel = '1-Click Restorative Deload'
  } else if (reportedPainInLogs) {
    priority = 'red'
    primaryReason = 'Joint pain / discomfort reported in recent workout set notes.'
    recommendedAction = 'Apply 1-click Setback / Decompression protocol and verify substitutions.'
    suggestedPeriodizationAction = 'setback_protocol'
    suggestedActionLabel = '1-Click Setback Protocol'
  } else if (daysSinceLastCheckin > 7) {
    priority = 'red'
    primaryReason = `Overdue weekly check-in (${daysSinceLastCheckin} days inactive).`
    recommendedAction = 'Dispatch 1-click executive accountability check-in ping.'
  } else if (hasReadiness && readinessScore! < 50) {
    priority = 'red'
    primaryReason = `High systemic fatigue (Readiness: ${readinessScore}%). Autonomic exhaustion risk.`
    recommendedAction = 'Authorize 1-click shift to Active Recovery & Restorative microcycle.'
    suggestedPeriodizationAction = 'setback_protocol'
    suggestedActionLabel = '1-Click Recovery Protocol'
  }
  // 2. AMBER / OVERREACHING / ATTENTION
  else if (hasPendingVideoCritique) {
    priority = 'amber'
    primaryReason = 'Video lift critique submitted and awaiting coach verification.'
    recommendedAction = 'Review AI joint telemetry and publish coach cues.'
  } else if (hasAcwr && acwrRatio! >= 1.35) {
    priority = 'amber'
    primaryReason = `Workload overreaching (ACWR: ${acwrRatio!.toFixed(2)}). Fatigue accumulating.`
    recommendedAction = 'Monitor volume closely and prescribe restorative SMR protocol.'
  } else if (completionRate14d < 70) {
    priority = 'amber'
    primaryReason = `Workout compliance dipped to ${completionRate14d}% over past 14 days.`
    recommendedAction = 'Send 1-click travel or schedule adaptation memo.'
  } else if (hasReadiness && readinessScore! < 70) {
    priority = 'amber'
    primaryReason = `Moderate accumulated fatigue (Readiness: ${readinessScore}%).`
    recommendedAction = 'Monitor volume; recommend extra post-workout mobility.'
  }
  // 3. GREEN / ACCELERATED MASTERY
  else if (completionRate14d >= 95 && hasReadiness && readinessScore! >= 80 && hasAchievedOverload) {
    priority = 'green'
    primaryReason = 'High Responder: Mastered current phase volume and achieved 2-for-2 progressive overload early.'
    recommendedAction = 'Fast-track to next advanced OPT™ phase.'
    suggestedPeriodizationAction = 'accelerate_phase'
    suggestedActionLabel = '1-Click Fast-Track Phase'
  }

  const priorityRank = priority === 'red' ? 1 : priority === 'amber' ? 2 : 3

  let acwrZone: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data' = 'No Data'
  if (hasAcwr) {
    if (acwrRatio! < 0.8) acwrZone = 'Under-training'
    else if (acwrRatio! <= 1.30) acwrZone = 'Sweet Spot'
    else if (acwrRatio! <= 1.49) acwrZone = 'Overreaching'
    else acwrZone = 'Danger Zone'
  }

  return {
    clientId,
    clientName,
    email,
    priority,
    priorityRank,
    primaryReason,
    readinessScore,
    adherencePercent: completionRate14d,
    daysSinceLastCheckin,
    hasPendingVideoCritique,
    hasMedicalRedFlag,
    hasReportedPain: reportedPainInLogs,
    currentOptPhase,
    recommendedAction,
    acwrRatio,
    acwrZone,
    acuteWorkloadUnits,
    chronicWorkloadUnits,
    primaryFatiguedMuscles,
    suggestedPeriodizationAction,
    suggestedActionLabel,
  }
}

export function sortTriageQueue(clients: ClientTriageSummary[]): ClientTriageSummary[] {
  return [...clients].sort((a, b) => {
    // 1. Sort by Priority Rank (Red first, then Amber, then Green)
    if (a.priorityRank !== b.priorityRank) {
      return a.priorityRank - b.priorityRank
    }
    // 2. Sort by ACWR Danger (Highest ACWR first)
    if ((b.acwrRatio ?? 0) !== (a.acwrRatio ?? 0)) {
      return (b.acwrRatio ?? 0) - (a.acwrRatio ?? 0)
    }
    // 3. Sort by Readiness (Lowest recovery first, null telemetry sorted after)
    const aReadiness = typeof a.readinessScore === 'number' && Number.isFinite(a.readinessScore) ? a.readinessScore : 999
    const bReadiness = typeof b.readinessScore === 'number' && Number.isFinite(b.readinessScore) ? b.readinessScore : 999
    if (aReadiness !== bReadiness) {
      return aReadiness - bReadiness
    }
    // 4. Sort by Days Inactive
    return b.daysSinceLastCheckin - a.daysSinceLastCheckin
  })
}


