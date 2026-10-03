/**
 * Gordon Athletic Advisory — Advanced Hypertrophy & Intensity Protocols Engine
 * 
 * Implements evidence-based advanced training methodologies:
 * - Drop Sets: Stripping load 15-30% across multiple stages to maximize motor unit recruitment past volitional failure.
 * - Rest-Pause / Myo-Reps: Activation set followed by brief 15-20s intra-set rests and high-effective-rep mini-sets.
 * - Cluster Sets: Inter-repetition rest intervals (15-25s) allowing high load maintenance with reduced metabolic fatigue.
 * - Mechanical Drop Sets: Transitioning from disadvantageous to advantageous biomechanical leverages at equal load.
 */

export type IntensityProtocolType = 'drop_set' | 'rest_pause' | 'cluster_set' | 'mechanical_drop'

export interface DropStage {
  stageNumber: number
  weightLbs: number
  reps: number
  percentDropFromInitial: number
  volumeLbs: number
}

export interface IntensityProtocolData {
  type: IntensityProtocolType
  exerciseName: string
  initialWeightLbs: number
  initialReps: number
  stages: DropStage[]
  totalVolumeLbs: number
  totalReps: number
  notes?: string
}

export interface RestPauseData {
  activationWeightLbs: number
  activationReps: number
  intraRestSeconds: number
  miniSets: number[] // reps in each mini-set
  totalEffectiveReps: number
  totalVolumeLbs: number
}

/**
 * Rounds a weight value to the nearest gym equipment increment.
 * (5 lb for standard barbells/dumbbells, 2.5 lb for micro-loading).
 */
export function roundToNearestIncrement(weight: number, increment: number = 5): number {
  return Math.max(increment, Math.round(weight / increment) * increment)
}

/**
 * Automatically computes evidence-based drop stages for an initial load.
 * Default: 20% weight reduction per stage, rounded to the nearest 5 lbs (or 2.5 kg).
 */
export function calculateDropStages(
  initialWeightLbs: number,
  initialReps: number,
  numDrops: number = 2,
  dropPercentage: number = 20,
  increment: number = 5
): DropStage[] {
  const stages: DropStage[] = [
    {
      stageNumber: 1,
      weightLbs: initialWeightLbs,
      reps: initialReps,
      percentDropFromInitial: 0,
      volumeLbs: Math.round(initialWeightLbs * initialReps),
    },
  ]

  let currentWeight = initialWeightLbs

  for (let i = 1; i <= numDrops; i++) {
    const rawDropWeight = currentWeight * (1 - dropPercentage / 100)
    const roundedDropWeight = roundToNearestIncrement(rawDropWeight, increment)
    // Estimate reps: typically 1-2 reps lower than initial, minimum 4
    const estimatedReps = Math.max(4, Math.round(initialReps * 0.8))
    const percentDrop = Math.round(((initialWeightLbs - roundedDropWeight) / initialWeightLbs) * 100)

    stages.push({
      stageNumber: i + 1,
      weightLbs: roundedDropWeight,
      reps: estimatedReps,
      percentDropFromInitial: percentDrop,
      volumeLbs: Math.round(roundedDropWeight * estimatedReps),
    })

    currentWeight = roundedDropWeight
  }

  return stages
}

/**
 * Computes Myo-Reps / Rest-Pause volume and total effective repetitions.
 * In exercise science, every rep in post-activation mini-sets is considered an "effective rep"
 * because motor unit recruitment is already near 100% from the activation set.
 */
export function calculateMyoRepsProtocol(
  activationWeightLbs: number,
  activationReps: number,
  miniSets: number[] = [4, 3, 3],
  intraRestSeconds: number = 15
): RestPauseData {
  const totalMiniSetReps = miniSets.reduce((sum, r) => sum + r, 0)
  const totalReps = activationReps + totalMiniSetReps
  const totalVolumeLbs = Math.round(activationWeightLbs * totalReps)

  return {
    activationWeightLbs,
    activationReps,
    intraRestSeconds,
    miniSets,
    totalEffectiveReps: totalMiniSetReps + Math.min(5, activationReps),
    totalVolumeLbs,
  }
}

/**
 * Serializes an intensity protocol into a structured, human-readable tag for workout set notes.
 */
export function formatIntensityProtocolNotes(
  protocol: IntensityProtocolData,
  units: 'imperial' | 'metric' = 'imperial'
): string {
  const unitLabel = units === 'imperial' ? 'lb' : 'kg'
  const unitFactor = units === 'imperial' ? 1 : 0.45359237

  if (protocol.type === 'drop_set') {
    const stageSummary = protocol.stages
      .map(s => {
        const w = Math.round(s.weightLbs * unitFactor)
        return `${w}${unitLabel}×${s.reps}`
      })
      .join(' ➔ ')
    const displayVol = Math.round(protocol.totalVolumeLbs * unitFactor)
    return `[DropSet: ${stageSummary} | ${protocol.stages.length} Stages | Vol: ${displayVol.toLocaleString()} ${unitLabel}]`
  }

  if (protocol.type === 'rest_pause') {
    const actW = Math.round(protocol.initialWeightLbs * unitFactor)
    const miniSummary = protocol.stages.slice(1).map(s => s.reps).join('+')
    const displayVol = Math.round(protocol.totalVolumeLbs * unitFactor)
    return `[RestPause: ${actW}${unitLabel}×${protocol.initialReps} + ${miniSummary} | Vol: ${displayVol.toLocaleString()} ${unitLabel}]`
  }

  if (protocol.type === 'cluster_set') {
    const w = Math.round(protocol.initialWeightLbs * unitFactor)
    const clusters = protocol.stages.map(s => s.reps).join('+')
    return `[Cluster: ${w}${unitLabel} × (${clusters}) | Intra-rest: 20s]`
  }

  return `[IntensityProtocol: ${protocol.type}]`
}

/**
 * Parses intensity protocol metadata from workout set log notes.
 */
export function parseIntensityProtocolNotes(notes?: string | null): {
  isIntensityProtocol: boolean
  type?: IntensityProtocolType
  tagContent?: string
  rawNotesWithoutTag: string
} {
  const text = String(notes || '').trim()
  const match = text.match(/\[(DropSet|RestPause|Cluster|IntensityProtocol):([^\]]+)\]/i)

  if (!match) {
    return {
      isIntensityProtocol: false,
      rawNotesWithoutTag: text,
    }
  }

  const tagKey = match[1].toLowerCase()
  const type: IntensityProtocolType =
    tagKey === 'dropset'
      ? 'drop_set'
      : tagKey === 'restpause'
        ? 'rest_pause'
        : tagKey === 'cluster'
          ? 'cluster_set'
          : 'mechanical_drop'

  const rawNotesWithoutTag = text.replace(match[0], '').trim()

  return {
    isIntensityProtocol: true,
    type,
    tagContent: match[2].trim(),
    rawNotesWithoutTag,
  }
}
