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

  // 4. Executive Summary Bullet Points
  const executiveSummary: string[] = []

  if (totalTonnageLbs > 0) {
    executiveSummary.push(
      `Accumulated ${totalTonnageLbs.toLocaleString()} lbs in total mechanical volume load across ${totalWorkingSets} prescribed working sets with an average exertion of ${avgSessionRpe}/10 RPE.`
    )
  } else {
    executiveSummary.push('Baseline calibration week completed; focused on kinetic chain neuromuscular activation.')
  }

  if (zone2CardioMins > 0) {
    executiveSummary.push(
      `Completed ${zone2CardioMins} minutes of targeted Zone 2 aerobic base conditioning, supporting mitochondrial biogenesis and accelerated lactate clearance.`
    )
  }

  if (prs.length > 0) {
    const prDetails = prs.map(p => `${p.exercise_name} (${p.weight_lbs} lbs × ${p.reps} reps)`).join(', ')
    executiveSummary.push(`Achieved ${prs.length} new 1RM performance milestone(s) this cycle: ${prDetails}.`)
  }

  if (recoveryIndexScore >= 80) {
    executiveSummary.push(
      `Autonomic recovery index is optimal (${recoveryIndexScore}/100). Parasympathetic tone and neuromuscular readiness indicate full adaptation capacity.`
    )
  } else {
    executiveSummary.push(
      `Autonomic recovery index is moderate (${recoveryIndexScore}/100). Prioritize sleep architecture and post-workout nutritional timing.`
    )
  }

  // 5. Next Week's Strategic Focus
  let nextWeekFocus = ''
  if (optPhase.toLowerCase().includes('stabilization')) {
    nextWeekFocus = 'Progressive neuromuscular challenge: Increase time-under-tension to 4-2-1 cadence and integrate single-leg proprioceptive balance.'
  } else if (optPhase.toLowerCase().includes('hypertrophy') || optPhase.toLowerCase().includes('muscular')) {
    nextWeekFocus = 'Progressive volume overload: +2.5% to +5% working load increase on multi-joint compound anchors with strict 2-0-2 cadence.'
  } else if (optPhase.toLowerCase().includes('power')) {
    nextWeekFocus = 'High-threshold motor unit recruitment: Maintain heavy strength complexes followed immediately by explosive plyometric supersets.'
  } else {
    nextWeekFocus = 'Linear progressive overload: Consolidate mechanical tonnage and maintain restorative Zone 2 aerobic recovery windows.'
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
  let acwrStatusMessage = 'Insufficient Workload Telemetry: No mechanical volume logged in current cycle to calculate ACWR.'

  if (rawAcwr !== null) {
    if (rawAcwr < 0.80) {
      acwrZone = 'Under-training'
      acwrStatusMessage = 'Below Chronic Baseline: Mild mechanical stimulus; supercompensation threshold not fully saturated.'
    } else if (rawAcwr <= 1.30) {
      acwrZone = 'Sweet Spot'
      acwrStatusMessage = 'Optimal Adaptation Corridor: High fitness accumulation coupled with minimized orthopedic injury risk.'
    } else if (rawAcwr <= 1.49) {
      acwrZone = 'Overreaching'
      acwrStatusMessage = 'Controlled Overreaching: Elevated acute fatigue accumulation. Monitor parasympathetic HRV tone closely.'
    } else {
      acwrZone = 'Danger Zone'
      acwrStatusMessage = 'Danger Spike (ACWR >= 1.50): Acute fatigue significantly outpaces chronic tolerance. Recommend restorative deload.'
    }
  }

  // 7. Kinetic Movement Pattern Distribution
  const kineticDistribution = computeKineticDistribution(setLogs)

  // 8. Clinical S.O.A.P. Documentation Synthesis
  const soapRecord: SoapRecord = {
    subjective: `Athlete executed microcycle in ${optPhase} with ${adherencePct}% protocol adherence across ${completedSessions} logged session(s). Average perceived session exertion was ${avgSessionRpe}/10 RPE with autonomic readiness scoring ${recoveryIndexScore}/100 (${recoveryIndexScore >= 80 ? 'Optimal Supercompensation' : recoveryIndexScore >= 65 ? 'Allostatic Equilibrium' : 'Restorative Deload Advised'}).`,
    objective: `Total mechanical volume: ${totalTonnageLbs.toLocaleString()} lbs across ${totalWorkingSets} prescribed working sets. Aerobic base conditioning: ${zone2CardioMins} mins Zone 2 (${totalCardioMins} mins total cardio). ACWR Ratio: ${rawAcwr !== null ? `${rawAcwr.toFixed(2)} (${acwrZone})` : 'No Data (insufficient volume logged)'}. Kinetic distribution: ${kineticDistribution.pushPct}% Push (${kineticDistribution.pushSets} sets), ${kineticDistribution.pullPct}% Pull (${kineticDistribution.pullSets} sets), ${kineticDistribution.squatPct}% Squat (${kineticDistribution.squatSets} sets), ${kineticDistribution.hingePct}% Hinge (${kineticDistribution.hingeSets} sets), ${kineticDistribution.carryCorePct}% Carry/Core (${kineticDistribution.carryCoreSets} sets). Personal records: ${prs.length > 0 ? prs.map(p => `${p.exercise_name} (${p.weight_lbs} lbs × ${p.reps} reps)`).join(', ') : 'None logged this cycle'}.`,
    assessment: rawAcwr !== null
      ? `Neuromuscular adaptations demonstrate ${rawAcwr >= 0.8 && rawAcwr <= 1.3 ? 'favorable stimulus-to-fatigue ratio within the safe adaptive window' : rawAcwr > 1.49 ? 'elevated systemic fatigue requiring proactive deload throttling' : 'controlled adaptive stimulus'}. Zone 2 volume supports mitochondrial biogenesis and lactate clearance without compromising power output.`
      : 'Insufficient training volume logged this microcycle to assess neuromuscular adaptations. Continue baseline aerobic conditioning and calibrate progressive overload on next logged cycle.',
    plan: `${nextWeekFocus} Maintain resting heart rate tracking (baseline ${restingHr} bpm) and execute ${targetSessionsPerWeek} scheduled training sessions.`,
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
