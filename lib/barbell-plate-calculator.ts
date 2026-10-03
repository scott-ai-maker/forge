export type BarbellType =
  | 'olympic_45'
  | 'technique_35'
  | 'trap_bar_55'
  | 'ez_curl_25'
  | 'safety_squat_65'

export interface BarbellOption {
  id: BarbellType
  name: string
  weightLbs: number
  description: string
}

export const BARBELL_OPTIONS: Record<BarbellType, BarbellOption> = {
  olympic_45: {
    id: 'olympic_45',
    name: 'Olympic Barbell (45 lbs / 20 kg)',
    weightLbs: 45,
    description: 'Standard 7ft IPF/IWF competition barbell',
  },
  technique_35: {
    id: 'technique_35',
    name: "Women's / Technique Bar (35 lbs / 15 kg)",
    weightLbs: 35,
    description: 'Narrower 25mm shaft technique & Olympic bar',
  },
  trap_bar_55: {
    id: 'trap_bar_55',
    name: 'Heavy Hex / Trap Bar (55 lbs)',
    weightLbs: 55,
    description: 'Neutral grip deadlift & shrug bar',
  },
  ez_curl_25: {
    id: 'ez_curl_25',
    name: 'EZ-Curl Bar (25 lbs)',
    weightLbs: 25,
    description: 'Cambered bar for bicep curls & skull crushers',
  },
  safety_squat_65: {
    id: 'safety_squat_65',
    name: 'Safety Squat Bar (65 lbs)',
    weightLbs: 65,
    description: 'Cambered padded yoke bar for spinal sparing',
  },
}

export interface PlateDenomination {
  weightLbs: number
  color: string
  textColor: string
  heightPct: number // Visual scale relative to 45lb plate (100%)
  thicknessPx: number
}

export const PLATE_DENOMINATIONS: Record<number, PlateDenomination> = {
  45: { weightLbs: 45, color: '#1D4ED8', textColor: '#FFFFFF', heightPct: 100, thicknessPx: 18 },
  35: { weightLbs: 35, color: '#EAB308', textColor: '#0A0E18', heightPct: 88, thicknessPx: 16 },
  25: { weightLbs: 25, color: '#15803D', textColor: '#FFFFFF', heightPct: 76, thicknessPx: 14 },
  10: { weightLbs: 10, color: '#F1F5F9', textColor: '#0F172A', heightPct: 62, thicknessPx: 10 },
  5: { weightLbs: 5, color: '#DC2626', textColor: '#FFFFFF', heightPct: 48, thicknessPx: 8 },
  2.5: { weightLbs: 2.5, color: '#64748B', textColor: '#FFFFFF', heightPct: 36, thicknessPx: 6 },
}

export interface PlateCount {
  denomination: PlateDenomination
  count: number
}

export interface BarbellCalculationResult {
  targetWeightLbs: number
  barbell: BarbellOption
  weightPerSide: number
  platesPerSide: PlateCount[]
  actualTotalWeightLbs: number
  remainderLbs: number
  isExact: boolean
  plateSummaryText: string
}

export function calculateBarbellPlates(
  targetWeightLbs: number,
  barType: BarbellType = 'olympic_45',
  availableDenominations: number[] = [45, 35, 25, 10, 5, 2.5]
): BarbellCalculationResult {
  const barbell = BARBELL_OPTIONS[barType] || BARBELL_OPTIONS.olympic_45
  const barWeight = barbell.weightLbs

  if (targetWeightLbs <= barWeight) {
    return {
      targetWeightLbs,
      barbell,
      weightPerSide: 0,
      platesPerSide: [],
      actualTotalWeightLbs: barWeight,
      remainderLbs: 0,
      isExact: targetWeightLbs === barWeight,
      plateSummaryText: 'Empty Bar (No plates required)',
    }
  }

  const sortedDenoms = [...availableDenominations].sort((a, b) => b - a)
  let targetPerSide = (targetWeightLbs - barWeight) / 2
  const platesPerSide: PlateCount[] = []

  for (const denomWeight of sortedDenoms) {
    const denomSpec = PLATE_DENOMINATIONS[denomWeight]
    if (!denomSpec) continue

    const count = Math.floor(targetPerSide / denomWeight)
    if (count > 0) {
      platesPerSide.push({
        denomination: denomSpec,
        count,
      })
      targetPerSide -= count * denomWeight
    }
  }

  const loadedPerSide = platesPerSide.reduce(
    (sum, p) => sum + p.denomination.weightLbs * p.count,
    0
  )
  const actualTotalWeightLbs = barWeight + loadedPerSide * 2
  const remainderLbs = Math.round((targetWeightLbs - actualTotalWeightLbs) * 10) / 10
  const isExact = remainderLbs === 0

  const summaryParts = platesPerSide.map(p => `${p.count} × ${p.denomination.weightLbs}lb`)
  const plateSummaryText = summaryParts.length > 0
    ? `Per side: ${summaryParts.join(' + ')}`
    : 'Empty Bar'

  return {
    targetWeightLbs,
    barbell,
    weightPerSide: loadedPerSide,
    platesPerSide,
    actualTotalWeightLbs,
    remainderLbs,
    isExact,
    plateSummaryText,
  }
}

/**
 * Detects if an exercise uses Olympic weights (barbells, trap bars, cambered bars, Olympic plates).
 * Returns false for dumbbells, kettlebells, cables, bodyweight, bands, etc.
 */
export function isOlympicWeightExercise(
  exerciseName: string,
  providedEquipment?: string[] | null
): boolean {
  if (!exerciseName) return false

  const nameLower = exerciseName.toLowerCase().trim()

  // 1. Check explicit equipment list if provided
  if (providedEquipment && Array.isArray(providedEquipment) && providedEquipment.length > 0) {
    const hasBarbellEq = providedEquipment.some(eq => {
      const eqLow = eq.toLowerCase()
      return (
        eqLow.includes('barbell') ||
        eqLow.includes('olympic') ||
        eqLow.includes('trap bar') ||
        eqLow.includes('hex bar') ||
        eqLow.includes('weight plates') ||
        eqLow === 'plates'
      )
    })
    const isStrictlyDbOrOther = providedEquipment.every(eq => {
      const eqLow = eq.toLowerCase()
      return (
        eqLow.includes('dumbbell') ||
        eqLow.includes('kettlebell') ||
        eqLow.includes('cable') ||
        eqLow.includes('band') ||
        eqLow.includes('bodyweight')
      )
    })
    if (hasBarbellEq && !isStrictlyDbOrOther) return true
  }

  // 2. Explicit non-barbell keywords that should immediately disqualify unless "barbell" is in name
  const isExplicitDbOrBodyweight =
    /\b(dumbbell|dumbbells|\bdb\b|kettlebell|kettlebells|\bkb\b|cable|pulley|band|tubing|bodyweight|push-up|pull-up|chin-up|trx|suspension|swiss ball|stability ball|medicine ball|\bmb\b)\b/i.test(
      nameLower
    )
  const isExplicitBarbell =
    /\b(barbell|\bbb\b|trap bar|hex bar|olympic bar|safety squat bar|ez[- ]curl bar|landmine|smith machine)\b/i.test(
      nameLower
    )

  if (isExplicitBarbell) return true
  if (isExplicitDbOrBodyweight) return false

  // 3. Classic compound lifts that default to Olympic Barbells unless specified otherwise
  const classicOlympicLifts =
    /\b(bench press|incline bench|decline bench|floor press|overhead press|military press|strict press|push press|power jerk|split jerk|back squat|front squat|box squat|zercher squat|deadlift|sumo deadlift|romanian deadlift|\brdl\b|stiff[- ]leg deadlift|clean and jerk|clean & jerk|snatch|power clean|hang clean|hang snatch|power snatch|barbell row|pendlay row|t[- ]bar row|bent[- ]over row|hip thrust|good morning|rack pull|deficit deadlift|leg press|hack squat)\b/i

  return classicOlympicLifts.test(nameLower)
}

export interface WarmUpRampStage {
  stageNumber: number
  percentage: number
  weightLbs: number
  reps: number
  platesSummary: string
  platesPerSide: PlateCount[]
  description: string
  restSeconds: number
}

/**
 * Generates evidence-based progressive kinetic warm-up ramp sets
 * based on target working load for Barbells, Dumbbells, and Compound Lifts.
 */
export function generateWarmUpRampSets(
  workingWeightLbs: number,
  barbellType: BarbellType = 'olympic_45',
  isDumbbell: boolean = false
): WarmUpRampStage[] {
  const barWeight = BARBELL_OPTIONS[barbellType]?.weightLbs ?? 45
  if (workingWeightLbs > 0 && workingWeightLbs <= (isDumbbell ? 20 : barWeight + 10)) {
    return []
  }

  const effectiveWeight = Math.max(isDumbbell ? 30 : 65, workingWeightLbs || (isDumbbell ? 50 : 135))
  const roundToNearest5 = (val: number) => Math.max(isDumbbell ? 10 : 45, Math.round(val / 5) * 5)
  const stages: WarmUpRampStage[] = []

  if (isDumbbell) {
    // ── Dumbbell Progressive Ramp ──
    const lightDbWeight = Math.max(10, roundToNearest5(effectiveWeight * 0.4))
    stages.push({
      stageNumber: 1,
      percentage: Math.round((lightDbWeight / effectiveWeight) * 100),
      weightLbs: lightDbWeight,
      reps: 10,
      platesSummary: `Pair of ${lightDbWeight} lb DBs`,
      platesPerSide: [],
      description: 'Light DB Kinetic Groove',
      restSeconds: 45,
    })

    const modDbWeight = roundToNearest5(effectiveWeight * 0.7)
    if (modDbWeight > lightDbWeight && modDbWeight < effectiveWeight) {
      stages.push({
        stageNumber: 2,
        percentage: Math.round((modDbWeight / effectiveWeight) * 100),
        weightLbs: modDbWeight,
        reps: 5,
        platesSummary: `Pair of ${modDbWeight} lb DBs`,
        platesPerSide: [],
        description: 'Moderate DB Neural Primer',
        restSeconds: 60,
      })
    }

    if (effectiveWeight >= 65) {
      const heavyDbWeight = roundToNearest5(effectiveWeight * 0.85)
      const lastWeight = stages[stages.length - 1].weightLbs
      if (heavyDbWeight > lastWeight && heavyDbWeight < effectiveWeight) {
        stages.push({
          stageNumber: stages.length + 1,
          percentage: Math.round((heavyDbWeight / effectiveWeight) * 100),
          weightLbs: heavyDbWeight,
          reps: 2,
          platesSummary: `Pair of ${heavyDbWeight} lb DBs`,
          platesPerSide: [],
          description: 'PAP Neuromuscular Primer',
          restSeconds: 75,
        })
      }
    }
  } else {
    // ── Barbell / Olympic Progressive Ramp ──
    const barWeight = BARBELL_OPTIONS[barbellType]?.weightLbs ?? 45
    const barCalc = calculateBarbellPlates(barWeight, barbellType)
    stages.push({
      stageNumber: 1,
      percentage: Math.round((barWeight / effectiveWeight) * 100),
      weightLbs: barWeight,
      reps: 10,
      platesSummary: barCalc.plateSummaryText,
      platesPerSide: barCalc.platesPerSide,
      description: 'Empty Bar / Joint Priming',
      restSeconds: 45,
    })

    const stage2Weight = roundToNearest5(effectiveWeight * 0.5)
    if (stage2Weight > barWeight && stage2Weight < effectiveWeight - 15) {
      const calc2 = calculateBarbellPlates(stage2Weight, barbellType)
      stages.push({
        stageNumber: 2,
        percentage: Math.round((stage2Weight / effectiveWeight) * 100),
        weightLbs: stage2Weight,
        reps: 5,
        platesSummary: calc2.plateSummaryText,
        platesPerSide: calc2.platesPerSide,
        description: 'Kinetic Groove & Speed',
        restSeconds: 60,
      })
    }

    const stage3Weight = roundToNearest5(effectiveWeight * (effectiveWeight >= 185 ? 0.70 : 0.75))
    const prevWeight = stages[stages.length - 1].weightLbs
    if (stage3Weight > prevWeight + 10 && stage3Weight < effectiveWeight - 10) {
      const calc3 = calculateBarbellPlates(stage3Weight, barbellType)
      stages.push({
        stageNumber: stages.length + 1,
        percentage: Math.round((stage3Weight / effectiveWeight) * 100),
        weightLbs: stage3Weight,
        reps: 3,
        platesSummary: calc3.plateSummaryText,
        platesPerSide: calc3.platesPerSide,
        description: 'Neural Load Adaptation',
        restSeconds: 75,
      })
    }

    if (effectiveWeight >= 205) {
      const stage4Weight = roundToNearest5(effectiveWeight * 0.85)
      const lastWeight = stages[stages.length - 1].weightLbs
      if (stage4Weight > lastWeight + 10 && stage4Weight < effectiveWeight - 5) {
        const calc4 = calculateBarbellPlates(stage4Weight, barbellType)
        stages.push({
          stageNumber: stages.length + 1,
          percentage: Math.round((stage4Weight / effectiveWeight) * 100),
          weightLbs: stage4Weight,
          reps: 1,
          platesSummary: calc4.plateSummaryText,
          platesPerSide: calc4.platesPerSide,
          description: 'Post-Activation Potentiation (PAP)',
          restSeconds: 90,
        })
      }
    }
  }

  return stages
}

export interface WeightPresetItem {
  weight: number
  label: string
  isMilestone?: boolean
}

export interface WeightPresetConfig {
  isBarbell: boolean
  presets: WeightPresetItem[]
  microIncrements: number[]
}

/**
 * Resolves rapid weight adjustment presets and micro-loading increments for any exercise.
 * Tailored dynamically based on modality (Olympic barbell vs dumbbell/cable) and units (imperial vs metric).
 */
export function getWeightPresetsForExercise(
  exerciseName: string,
  units: 'imperial' | 'metric' = 'imperial',
  currentWeight?: number
): WeightPresetConfig {
  const isBar = isOlympicWeightExercise(exerciseName) || (currentWeight !== undefined && (units === 'imperial' ? currentWeight >= 45 : currentWeight >= 20))

  if (isBar) {
    if (units === 'imperial') {
      return {
        isBarbell: true,
        presets: [
          { weight: 45, label: '45 (Bar)' },
          { weight: 95, label: '95 (25s)' },
          { weight: 135, label: '135 (1P)', isMilestone: true },
          { weight: 185, label: '185 (1P+25)' },
          { weight: 225, label: '225 (2P)', isMilestone: true },
          { weight: 275, label: '275 (2P+25)' },
          { weight: 315, label: '315 (3P)', isMilestone: true },
          { weight: 365, label: '365 (3P+25)' },
          { weight: 405, label: '405 (4P)', isMilestone: true },
        ],
        microIncrements: [-10, -5, -2.5, 2.5, 5, 10, 25],
      }
    } else {
      return {
        isBarbell: true,
        presets: [
          { weight: 20, label: '20 (Bar)' },
          { weight: 40, label: '40 (10s)' },
          { weight: 60, label: '60 (1P)', isMilestone: true },
          { weight: 80, label: '80 (1P+10)' },
          { weight: 100, label: '100 (2P)', isMilestone: true },
          { weight: 120, label: '120 (2P+10)' },
          { weight: 140, label: '140 (3P)', isMilestone: true },
          { weight: 160, label: '160 (3P+10)' },
          { weight: 180, label: '180 (4P)', isMilestone: true },
        ],
        microIncrements: [-5, -2.5, -1.25, 1.25, 2.5, 5, 10],
      }
    }
  }

  // Dumbbell / Cable / Free Weight
  if (units === 'imperial') {
    return {
      isBarbell: false,
      presets: [
        { weight: 10, label: '10 lb' },
        { weight: 15, label: '15 lb' },
        { weight: 20, label: '20 lb' },
        { weight: 25, label: '25 lb' },
        { weight: 30, label: '30 lb' },
        { weight: 35, label: '35 lb' },
        { weight: 40, label: '40 lb' },
        { weight: 45, label: '45 lb' },
        { weight: 50, label: '50 lb' },
        { weight: 60, label: '60 lb' },
        { weight: 70, label: '70 lb' },
      ],
      microIncrements: [-10, -5, -2.5, 2.5, 5, 10],
    }
  } else {
    return {
      isBarbell: false,
      presets: [
        { weight: 5, label: '5 kg' },
        { weight: 7.5, label: '7.5 kg' },
        { weight: 10, label: '10 kg' },
        { weight: 12.5, label: '12.5 kg' },
        { weight: 15, label: '15 kg' },
        { weight: 17.5, label: '17.5 kg' },
        { weight: 20, label: '20 kg' },
        { weight: 22.5, label: '22.5 kg' },
        { weight: 25, label: '25 kg' },
        { weight: 30, label: '30 kg' },
      ],
      microIncrements: [-5, -2.5, -1.25, 1.25, 2.5, 5],
    }
  }
}
