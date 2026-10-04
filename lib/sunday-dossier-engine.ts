export interface RawSetLog {
  session_date: string
  weight_lbs?: number | null
  reps?: number | null
  is_warmup?: boolean | null
  rpe?: number | null
  exercise_name?: string | null
  notes?: string | null
}

export interface RawCardioLog {
  session_date: string
  activity_type: string
  duration_mins: number
  avg_heart_rate?: number | null
}

export interface RawPersonalRecord {
  exercise_name: string
  weight_lbs: number
  reps: number
  achieved_at: string
}

export type KineticMovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'carry_core'

export interface KineticPatternDistribution {
  pushSets: number
  pullSets: number
  squatSets: number
  hingeSets: number
  carryCoreSets: number
  totalSets: number
  pushPct: number
  pullPct: number
  squatPct: number
  hingePct: number
  carryCorePct: number
}

export interface SoapRecord {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface DossierMetrics {
  totalTonnageLbs: number
  totalWorkingSets: number
  completedSessions: number
  targetSessions: number
  adherencePct: number
  totalCardioMins: number
  zone2CardioMins: number
  avgSessionRpe: number
  topPrsThisWeek: RawPersonalRecord[]
  recoveryIndexScore: number // 0-100 score
  executiveSummary: string[]
  nextWeekFocus: string
  // ── Track 4 Sports Science & Governance Additions ──
  acwrRatio: number | null
  acwrZone: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data'
  acwrStatusMessage: string
  kineticDistribution: KineticPatternDistribution
  soapRecord: SoapRecord
  authSignature: string
  authTimestamp: string
  auditorCredential: string
}

export function classifyExerciseKineticPattern(exerciseName = ''): KineticMovementPattern {
  const norm = exerciseName.toLowerCase()
  if (norm.includes('squat') || norm.includes('lunge') || norm.includes('step') || norm.includes('leg press') || norm.includes('hack')) {
    return 'squat'
  }
  if (norm.includes('deadlift') || norm.includes('rdl') || norm.includes('romanian') || norm.includes('thrust') || norm.includes('glute') || norm.includes('hamstring') || norm.includes('curl') && norm.includes('leg') || norm.includes('good morning') || norm.includes('swing') || norm.includes('back extension')) {
    return 'hinge'
  }
  if (norm.includes('bench') || norm.includes('press') || norm.includes('push') || norm.includes('dip') || norm.includes('tricep') || norm.includes('fly') || norm.includes('raise') || norm.includes('overhead')) {
    return 'push'
  }
  if (norm.includes('row') || norm.includes('pull') || norm.includes('chin') || norm.includes('lat') || norm.includes('bicep') || norm.includes('curl') || norm.includes('shrug') || norm.includes('rear delt')) {
    return 'pull'
  }
  return 'carry_core'
}

export function computeKineticDistribution(setLogs: RawSetLog[]): KineticPatternDistribution {
  let pushSets = 0
  let pullSets = 0
  let squatSets = 0
  let hingeSets = 0
  let carryCoreSets = 0

  for (const set of setLogs) {
    if (set.is_warmup) continue
    const pattern = classifyExerciseKineticPattern(set.exercise_name || '')
    if (pattern === 'push') pushSets++
    else if (pattern === 'pull') pullSets++
    else if (pattern === 'squat') squatSets++
    else if (pattern === 'hinge') hingeSets++
    else carryCoreSets++
  }

  const totalSets = pushSets + pullSets + squatSets + hingeSets + carryCoreSets
  const denom = Math.max(1, totalSets)

  return {
    pushSets,
    pullSets,
    squatSets,
    hingeSets,
    carryCoreSets,
    totalSets,
    pushPct: Math.round((pushSets / denom) * 100),
    pullPct: Math.round((pullSets / denom) * 100),
    squatPct: Math.round((squatSets / denom) * 100),
    hingePct: Math.round((hingeSets / denom) * 100),
    carryCorePct: Math.round((carryCoreSets / denom) * 100),
  }
}

export function generateCryptographicDossierSignature(
  athleteName: string,
  totalTonnageLbs: number,
  completedSessions: number
): string {
  // Deterministic pseudo-hash for sovereign audit verification
  let hash = 0x811c9dc5
  const raw = `${athleteName}|${totalTonnageLbs}|${completedSessions}|GAA-MASTER-NASM-2026`
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return `GAA-SIG-${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

export function generateSundayDossier(
  athleteName: string,
  optPhase: string,
  setLogs: RawSetLog[],
  cardioLogs: RawCardioLog[],
  prs: RawPersonalRecord[] = [],
  targetSessionsPerWeek = 4,
  restingHr = 54,
  hrvBaselineMs = 68,
  chronicWorkloadTonnage?: number
): DossierMetrics {
  // 1. Calculate Tonnage & Working Sets
  let totalTonnageLbs = 0
  let totalWorkingSets = 0
  let totalRpeSum = 0
  let rpeCount = 0

  const uniqueSessionDates = new Set<string>()

  for (const set of setLogs) {
    if (set.session_date) {
      uniqueSessionDates.add(set.session_date.split('T')[0])
    }

    if (!set.is_warmup) {
      totalWorkingSets += 1
      const w = Number(set.weight_lbs) || 0
      const r = Number(set.reps) || 0
      totalTonnageLbs += w * r

      if (set.rpe && set.rpe > 0) {
        totalRpeSum += set.rpe
        rpeCount += 1
      }
    }
  }

  // 2. Cardio & Zone 2
  let totalCardioMins = 0
  let zone2CardioMins = 0

  for (const cardio of cardioLogs) {
    const mins = Number(cardio.duration_mins) || 0
    totalCardioMins += mins

    // Assume 65-75% HRmax or steady state cardio contributes to Zone 2
    if (!cardio.avg_heart_rate || (cardio.avg_heart_rate >= 115 && cardio.avg_heart_rate <= 145)) {
      zone2CardioMins += mins
    } else {
      zone2CardioMins += Math.round(mins * 0.7)
    }

    if (cardio.session_date) {
      uniqueSessionDates.add(cardio.session_date.split('T')[0])
    }
  }

  const completedSessions = uniqueSessionDates.size
  const adherencePct = Math.min(100, Math.round((completedSessions / Math.max(1, targetSessionsPerWeek)) * 100))
  const avgSessionRpe = rpeCount > 0 ? Math.round((totalRpeSum / rpeCount) * 10) / 10 : 7.5

  // 3. Recovery Index (Biometric formula based on volume, RPE, and resting vitals)
  const volumePenalty = totalTonnageLbs > 60000 ? 12 : totalTonnageLbs > 35000 ? 6 : 0
  const rpeFactor = avgSessionRpe > 8.5 ? -10 : avgSessionRpe < 6.5 ? +5 : 0
  const restingHrBonus = restingHr < 60 ? +8 : restingHr > 75 ? -8 : 0
  const hrvBonus = hrvBaselineMs > 65 ? +10 : hrvBaselineMs < 45 ? -10 : 0

  const recoveryIndexScore = Math.max(
    40,
    Math.min(98, Math.round(82 - volumePenalty + rpeFactor + restingHrBonus + hrvBonus))
  )

  // 4. Weekly progress summary
  const executiveSummary: string[] = []

  if (totalTonnageLbs > 0) {
    executiveSummary.push(
      `You lifted a total of ${totalTonnageLbs.toLocaleString()} pounds across ${totalWorkingSets} working sets. Your average effort rating was ${avgSessionRpe} out of 10.`
    )
  } else {
    executiveSummary.push('There is not enough workout data for a full summary yet. Keep logging your sessions to see your progress here.')
  }

  if (zone2CardioMins > 0) {
    executiveSummary.push(
      `You logged ${zone2CardioMins} minutes of steady, moderate-intensity cardio.`
    )
  }

  if (prs.length > 0) {
    const prDetails = prs.map(p => `${p.exercise_name} (${p.weight_lbs} lbs × ${p.reps} reps)`).join(', ')
    executiveSummary.push(`You set ${prs.length} new personal record${prs.length === 1 ? '' : 's'}: ${prDetails}.`)
  }

  if (recoveryIndexScore >= 80) {
    executiveSummary.push(
      `Your recovery score is ${recoveryIndexScore} out of 100. Keep up the habits that help you feel ready to train.`
    )
  } else {
    executiveSummary.push(
      `Your recovery score is ${recoveryIndexScore} out of 100. Rest, sleep, and regular meals can support recovery.`
    )
  }

  // 5. Next week's training focus
  let nextWeekFocus = ''
  if (optPhase.toLowerCase().includes('stabilization')) {
    nextWeekFocus = 'Practice each movement with control. Try a steady pace and include single-leg balance work if it feels comfortable.'
  } else if (optPhase.toLowerCase().includes('hypertrophy') || optPhase.toLowerCase().includes('muscular')) {
    nextWeekFocus = 'If your recent workouts felt manageable, try a small increase (2.5–5%) on your main lifts while keeping good form.'
  } else if (optPhase.toLowerCase().includes('power')) {
    nextWeekFocus = 'Keep strength exercises controlled, then add a small number of fast jumps or throws while you feel fresh.'
  } else {
    nextWeekFocus = 'Build gradually from your recent training. Include some steady cardio and leave time for recovery.'
  }

  // 6. ACWR Calculation (Acute-to-Chronic Workload Ratio)
  const hasVolumeData = totalTonnageLbs > 0 || (typeof chronicWorkloadTonnage === 'number' && chronicWorkloadTonnage > 0)
  const baselineChronic = typeof chronicWorkloadTonnage === 'number' && chronicWorkloadTonnage > 0
    ? chronicWorkloadTonnage
    : (totalTonnageLbs > 0 && completedSessions > 0
        ? Math.round((totalTonnageLbs / completedSessions) * targetSessionsPerWeek)
        : 0)

  const rawAcwr = hasVolumeData && baselineChronic > 0
    ? Math.round((totalTonnageLbs / baselineChronic) * 100) / 100
    : null

  let acwrZone: 'Under-training' | 'Sweet Spot' | 'Overreaching' | 'Danger Zone' | 'No Data' = 'No Data'
  let acwrStatusMessage = 'Not enough recent workout data to compare your current training with your usual amount.'

  if (rawAcwr !== null) {
    if (rawAcwr < 0.80) {
      acwrZone = 'Under-training'
      acwrStatusMessage = 'Your recent training load is lower than usual.'
    } else if (rawAcwr <= 1.30) {
      acwrZone = 'Sweet Spot'
      acwrStatusMessage = 'Your recent training load is within your usual range.'
    } else if (rawAcwr <= 1.49) {
      acwrZone = 'Overreaching'
      acwrStatusMessage = 'Your recent training load is higher than usual. Pay attention to how you feel and make room for recovery.'
    } else {
      acwrZone = 'Danger Zone'
      acwrStatusMessage = 'Your recent training load is much higher than usual. Consider reducing intensity or taking more recovery time.'
    }
  }

  // 7. Kinetic Movement Pattern Distribution
  const kineticDistribution = computeKineticDistribution(setLogs)

  // 8. Coach notes
  const soapRecord: SoapRecord = {
    subjective: `You completed ${completedSessions} session(s) during ${optPhase}, or ${adherencePct}% of your planned sessions. Your average effort rating was ${avgSessionRpe} out of 10. Your recovery score was ${recoveryIndexScore} out of 100 (${recoveryIndexScore >= 80 ? 'ready to train' : recoveryIndexScore >= 65 ? 'steady recovery' : 'more recovery may help'}).`,
    objective: `You lifted ${totalTonnageLbs.toLocaleString()} pounds across ${totalWorkingSets} working sets. You logged ${zone2CardioMins} minutes of steady cardio (${totalCardioMins} total cardio minutes). Recent-to-usual workload ratio: ${rawAcwr !== null ? `${rawAcwr.toFixed(2)} (${acwrZone})` : 'not enough data yet'}. Movement patterns: ${kineticDistribution.pushPct}% push, ${kineticDistribution.pullPct}% pull, ${kineticDistribution.squatPct}% squat, ${kineticDistribution.hingePct}% hinge, and ${kineticDistribution.carryCorePct}% carry or core exercises. Personal records: ${prs.length > 0 ? prs.map(p => `${p.exercise_name} (${p.weight_lbs} lbs × ${p.reps} reps)`).join(', ') : 'None logged this week'}.`,
    assessment: rawAcwr !== null
      ? `Your recent training load is ${rawAcwr >= 0.8 && rawAcwr <= 1.3 ? 'within your usual range' : rawAcwr > 1.49 ? 'much higher than usual, so extra recovery may help' : 'changing'}. Steady cardio can build endurance without replacing strength training.`
      : 'There is not enough training data yet to compare workloads. Keep logging workouts and build up gradually.',
    plan: `${nextWeekFocus} If you track resting heart rate, compare it with your usual level. Aim for up to ${targetSessionsPerWeek} planned sessions, adjusted to fit your schedule.`,
  }

  // 9. Cryptographic Audit Signature
  const authSignature = generateCryptographicDossierSignature(athleteName, totalTonnageLbs, completedSessions)
  const authTimestamp = new Date().toISOString()
  const auditorCredential = 'Scott Gordon, NASM Master Trainer #149021 · CSCS'

  return {
    totalTonnageLbs,
    totalWorkingSets,
    completedSessions,
    targetSessions: targetSessionsPerWeek,
    adherencePct,
    totalCardioMins,
    zone2CardioMins,
    avgSessionRpe,
    topPrsThisWeek: prs,
    recoveryIndexScore,
    executiveSummary,
    nextWeekFocus,
    acwrRatio: rawAcwr,
    acwrZone,
    acwrStatusMessage,
    kineticDistribution,
    soapRecord,
    authSignature,
    authTimestamp,
    auditorCredential,
  }
}
