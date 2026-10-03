export interface LiveSessionSet {
  exercise_name: string
  reps: number
  weight_kg?: number | null
  rpe?: number | null
  is_warmup?: boolean | null
}

export interface LiveSessionWrapUpData {
  athleteName: string
  optPhase: string
  sessionDate: string
  sets: LiveSessionSet[]
  coachNotes?: string
  recoveryDirective?: string
}

export interface ComputedWrapUpSummary {
  totalTonnageLbs: number
  totalSets: number
  workingSets: number
  uniqueExercisesCount: number
  heaviestLift: { exercise: string; weightLbs: number; reps: number } | null
  formattedBriefingMessage: string
}

export function computeLiveSessionSummary(data: LiveSessionWrapUpData): ComputedWrapUpSummary {
  let totalTonnageLbs = 0
  let totalSets = 0
  let workingSets = 0
  const uniqueExercises = new Set<string>()
  let heaviestLift: { exercise: string; weightLbs: number; reps: number } | null = null

  for (const s of data.sets) {
    totalSets += 1
    uniqueExercises.add(s.exercise_name)

    const wKg = Number(s.weight_kg) || 0
    const wLbs = Math.round(wKg * 2.20462)
    const r = Number(s.reps) || 0

    if (!s.is_warmup) {
      workingSets += 1
      totalTonnageLbs += wLbs * r

      if (!heaviestLift || wLbs > heaviestLift.weightLbs) {
        heaviestLift = { exercise: s.exercise_name, weightLbs: wLbs, reps: r }
      }
    }
  }

  const coachNotesText = data.coachNotes?.trim() || 'Exceptional kinetic execution. Controlled eccentric tempos maintained throughout all compound lifts.'
  const recoveryText = data.recoveryDirective?.trim() || 'Hydrate with 20–30oz electrolyte solution + 40g post-workout protein within 60 minutes. Maintain 8+ hours sleep window.'

  const formattedBriefingMessage = `**1:1 LIVE COACHING CONSULTATION RECAP**
**Athlete**: ${data.athleteName}
**Date**: ${data.sessionDate}
**Phase**: ${data.optPhase}

**Session Performance Metrics**:
• **Total Mechanical Tonnage**: ${totalTonnageLbs.toLocaleString()} lbs
• **Volume Load**: ${workingSets} working sets across ${uniqueExercises.size} movements
${heaviestLift ? `• **Peak Load Anchor**: ${heaviestLift.exercise} (${heaviestLift.weightLbs} lbs × ${heaviestLift.reps} reps)` : ''}

**Coach Scott Gordon Form & Tactical Cues**:
${coachNotesText}

**Next 48-Hour Recovery Directive**:
${recoveryText}

*1:1 Live Consultation completed and credited to your advisory record.*`

  return {
    totalTonnageLbs,
    totalSets,
    workingSets,
    uniqueExercisesCount: uniqueExercises.size,
    heaviestLift,
    formattedBriefingMessage,
  }
}
