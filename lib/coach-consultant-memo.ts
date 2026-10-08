/**
 * 1-Click AI Consultant Memo & Prescription Dispatcher Engine
 * Synthesizes client weekly telemetry into an authoritative executive coaching memorandum.
 */

export interface WeeklyTelemetryInput {
  clientName: string
  optPhase: number
  totalSetsLogged: number
  targetSetsPlanned: number
  avgReadiness: number // 0 - 100
  cexStreakDays: number
  topPrBreakthrough?: string | null
  activeKineticCompensation?: string | null
  coachCustomNotes?: string
}

export interface GeneratedConsultantMemo {
  id: string
  clientName: string
  optPhase: number
  headline: string
  adherenceRate: number
  recoveryTone: 'Optimal (Green Light)' | 'Moderate (Volume Managed)' | 'Fatigue Alert (Recovery Shift)'
  performanceReview: string
  biomechanicalPrescription: string
  recommendedProgression: string
  fullMemoMarkdown: string
  generatedAt: string
}

export function generateConsultantMemo(input: WeeklyTelemetryInput): GeneratedConsultantMemo {
  const {
    clientName,
    optPhase,
    totalSetsLogged,
    targetSetsPlanned,
    avgReadiness,
    cexStreakDays,
    topPrBreakthrough,
    activeKineticCompensation,
    coachCustomNotes,
  } = input

  const adherenceRate = targetSetsPlanned > 0 ? Math.min(100, Math.round((totalSetsLogged / targetSetsPlanned) * 100)) : 100

  let recoveryTone: GeneratedConsultantMemo['recoveryTone'] = 'Optimal (Green Light)'
  if (avgReadiness < 55) recoveryTone = 'Fatigue Alert (Recovery Shift)'
  else if (avgReadiness < 75) recoveryTone = 'Moderate (Volume Managed)'

  const headline = `Executive Weekly Briefing: Phase ${optPhase} Telemetry & Prescription`

  // 1. Performance Review Section
  let performanceReview = `${clientName} logged ${totalSetsLogged} sets this week (${adherenceRate}% adherence). `
  if (topPrBreakthrough) {
    performanceReview += `Major strength milestone recorded: **${topPrBreakthrough}**. Neuromuscular rate of force development is progressing cleanly.`
  } else if (adherenceRate >= 90) {
    performanceReview += `Work capacity and intra-session density remained exceptionally strong across all working blocks.`
  } else {
    performanceReview += `Slight volume drop observed. Ensure travel protocol or 1-click hotel substitutions are leveraged during busy travel windows.`
  }

  // 2. Biomechanical & Recovery Prescription
  let biomechanicalPrescription = `Average weekly CNS readiness tracked at **${avgReadiness}%** (${recoveryTone}). `
  if (cexStreakDays >= 5) {
    biomechanicalPrescription += `Outstanding ${cexStreakDays}-day corrective homework streak. Kinetic joint alignment and tissue compliance are noticeably improving.`
  } else if (activeKineticCompensation) {
    biomechanicalPrescription += `Active focus area: **${activeKineticCompensation}**. Continue executing the 4-Phase CEx sequence (Inhibit $\\rightarrow$ Lengthen $\\rightarrow$ Activate) prior to heavy compound loading.`
  } else {
    biomechanicalPrescription += `Joint stability and movement balance remain well within optimal functional tolerances.`
  }

  // 3. Recommended Progression (NASM 2-for-2 Rule)
  let recommendedProgression = ''
  if (adherenceRate >= 90 && avgReadiness >= 75) {
    recommendedProgression = `**NASM 2-for-2 Progression Trigger**: Authorizing a +5% load increase on primary compound lifts for the upcoming training block. Maintain strict 4/2/1 tempo control.`
  } else if (avgReadiness < 55) {
    recommendedProgression = `**Recovery Modulation**: Recommend capping working set RPE at 8.0 and adding 10 minutes of Zone 1 aerobic recovery / foam rolling.`
  } else {
    recommendedProgression = `**Consolidation Protocol**: Maintain current load parameters while dialing in eccentric tempo control and unilateral stability.`
  }

  // Full Formatted Markdown Memo
  const fullMemoMarkdown = `### ${headline}
*Director of Human Performance: Scott Gordon*

**1. Performance & Volume Synthesis**
${performanceReview}

**2. Biomechanical & Recovery Health**
${biomechanicalPrescription}

**3. Master Direction for Next Microcycle**
${recommendedProgression}

${coachCustomNotes ? `\n**Coach Special Note:**\n_${coachCustomNotes}_\n` : ''}
---
*Forge Athletic · NASM OPT™ Sports Science Protocol*`

  return {
    id: `memo-${Date.now()}`,
    clientName,
    optPhase,
    headline,
    adherenceRate,
    recoveryTone,
    performanceReview,
    biomechanicalPrescription,
    recommendedProgression,
    fullMemoMarkdown,
    generatedAt: new Date().toISOString(),
  }
}

