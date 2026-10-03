/**
 * Gordon Athletic Advisory — NASM OPT™ Phase Feature Matrix & Deterministic Rules Engine
 * 
 * Implements master-level NASM Optimum Performance Training (OPT™) sports science rules
 * governing which training features are offered, recommended, or set to default for each phase:
 * 
 * Phase 1: Stabilization Endurance (12–20 reps, 4/2/1 tempo, 50–70% 1RM, 0–90s rest)
 *   - Supersets: NOT OFFERED (single sets / circuit only, zero antagonist auto-pairing)
 *   - Intensity Protocols (Drop Sets / Rest-Pause): NOT OFFERED (breaks stabilization and form)
 *   - Velocity-Based Training (VBT): NOT OFFERED (tempo is strictly slow & controlled 4/2/1)
 *   - Cadence Metronome: OFFERED & DEFAULT TEMPO = 4/2/1
 *   - Warmup Ramp: Light mobility & activation (working load is light 50–70%)
 * 
 * Phase 2: Strength Endurance (8–12 reps, 70–80% 1RM, 0–60s rest)
 *   - Supersets: OFFERED (Strength lift @ 2/0/2 paired with Stabilization lift @ 4/2/1).
 *                DEFAULT = OFF so athletes start in clean sequential view and can 1-tap activate.
 *   - Intensity Protocols: OPTIONAL / restricted.
 *   - Cadence Metronome: OFFERED (2/0/2 strength, 4/2/1 stabilizer).
 *   - Warmup Ramp: OFFERED (3 stages).
 * 
 * Phase 3: Muscular Development / Hypertrophy (6–12 reps, 2/0/2 tempo, 75–85% 1RM, 0–60s / 60–90s rest)
 *   - Supersets: OFFERED as optional antagonist density technique; DEFAULT = OFF (straight sets standard).
 *   - Intensity Protocols (Drop Sets, Rest-Pause, Myo-Reps): OFFERED & RECOMMENDED (primary hypertrophy driver).
 *   - Cadence Metronome: OFFERED & DEFAULT TEMPO = 2/0/2.
 *   - Warmup Ramp: OFFERED (3–4 progressive stages).
 * 
 * Phase 4: Maximal Strength (1–5 reps, 1/1/1 or explosive tempo, 85–100% 1RM, 2–4 min rest)
 *   - Supersets: STRICTLY PROHIBITED / NOT OFFERED (demands 2–4 min complete recovery between heavy sets).
 *   - Intensity Protocols (Drop Sets): NOT OFFERED (metabolic fatigue impairs maximal CNS motor unit recruitment).
 *   - Velocity-Based Training (VBT): OFFERED & RECOMMENDED (monitors velocity loss threshold < 10–20%).
 *   - Warmup Ramp: OFFERED & CRUCIAL / HIGH PRIORITY (4–5 progressive stages to 85–100% loads).
 *   - Cadence Metronome: 1/1/1 or 2/0/1 (controlled eccentric, explosive concentric).
 * 
 * Phase 5: Power (1–5 reps @ 85–100% 1RM paired with 8–10 reps explosive @ 30–45% 1RM)
 *   - Supersets: OFFERED for Post-Activation Potentiation (PAP) contrast complexes; DEFAULT = OFF.
 *   - Intensity Protocols (Drop Sets): NOT OFFERED (fatigue blunts rate of force development).
 *   - Velocity-Based Training (VBT): OFFERED & PRIMARY METRIC (peak velocity m/s and power in watts).
 *   - Warmup Ramp: OFFERED & HIGH PRIORITY for the heavy strength primer.
 *   - Cadence Metronome: X/0/X (Explosive) for power, 2/0/1 for strength primer.
 */

export interface NasmPhaseFeatureRules {
  phase: number
  phaseName: string
  // Supersets
  isSupersetOffered: boolean
  isSupersetDefaultOn: boolean
  supersetBadgeLabel: string
  supersetTooltip: string
  canToggleSupersets: boolean
  // Intensity Protocols (Drop Sets, Myo-Reps, Rest-Pause)
  isIntensityProtocolOffered: boolean
  isIntensityProtocolRecommended: boolean
  intensityProtocolBadge: string
  intensityProtocolRationale: string
  // Velocity-Based Training (VBT)
  isVbtOffered: boolean
  isVbtPrimaryMetric: boolean
  vbtBadge: string
  vbtRationale: string
  // Warm-Up Ramp Progression
  isWarmupRampHighPriority: boolean
  recommendedWarmupStages: number
  warmupRampBadge: string
  warmupRampRationale: string
  // Default Tempo & Rest
  defaultTempo: string
  defaultRestText: string
  minRestSeconds: number
  maxRestSeconds: number
}

export const NASM_OPT_FEATURE_RULES: Record<number, NasmPhaseFeatureRules> = {
  1: {
    phase: 1,
    phaseName: 'Stabilization Endurance',
    isSupersetOffered: false,
    isSupersetDefaultOn: false,
    supersetBadgeLabel: 'Single Sets Only',
    supersetTooltip: 'NASM OPT Phase 1 prescribes single sets with 4/2/1 tempo for stabilization endurance. Supersets are not utilized.',
    canToggleSupersets: false,
    isIntensityProtocolOffered: false,
    isIntensityProtocolRecommended: false,
    intensityProtocolBadge: 'Phase 1: Stabilization Mode',
    intensityProtocolRationale: 'Drop sets and failure protocols are restricted in Phase 1 to prevent stabilizer breakdown and maintain kinetic chain alignment.',
    isVbtOffered: false,
    isVbtPrimaryMetric: false,
    vbtBadge: 'VBT: N/A in Phase 1',
    vbtRationale: 'Phase 1 requires slow, controlled eccentric/isometric cadence (4/2/1), not high-velocity movement.',
    isWarmupRampHighPriority: false,
    recommendedWarmupStages: 2,
    warmupRampBadge: 'Mobility & Activation',
    warmupRampRationale: 'Working loads are light (50–70% 1RM); focus on joint mobility and stabilization priming.',
    defaultTempo: '4/2/1',
    defaultRestText: '0–90s',
    minRestSeconds: 0,
    maxRestSeconds: 90,
  },
  2: {
    phase: 2,
    phaseName: 'Strength Endurance',
    isSupersetOffered: true,
    isSupersetDefaultOn: false, // Lean default: Athlete starts in clean sequential view, 1-tap option to enable
    supersetBadgeLabel: 'P2 Contrast Available',
    supersetTooltip: 'NASM OPT Phase 2: Stable strength exercise immediately paired with stabilization challenge (0s transition rest).',
    canToggleSupersets: true,
    isIntensityProtocolOffered: true,
    isIntensityProtocolRecommended: false,
    intensityProtocolBadge: 'Phase 2: Optional Density',
    intensityProtocolRationale: 'Use sparingly on final working sets to sustain work capacity without compromising stabilization form.',
    isVbtOffered: true,
    isVbtPrimaryMetric: false,
    vbtBadge: 'Velocity Telemetry',
    vbtRationale: 'Monitor concentric speed during the prime mover strength lift.',
    isWarmupRampHighPriority: false,
    recommendedWarmupStages: 3,
    warmupRampBadge: 'Progressive Warm-Up',
    warmupRampRationale: '3 progressive stages (40%, 60%, 75%) to reach working endurance load.',
    defaultTempo: '2/0/2',
    defaultRestText: '0–60s',
    minRestSeconds: 0,
    maxRestSeconds: 60,
  },
  3: {
    phase: 3,
    phaseName: 'Muscular Development (Hypertrophy)',
    isSupersetOffered: true,
    isSupersetDefaultOn: false, // Standard hypertrophy uses straight sets; supersets are optional density technique
    supersetBadgeLabel: 'Antagonist Density Optional',
    supersetTooltip: 'NASM OPT Phase 3: Straight sets standard. Optional agonist/antagonist supersets available for training density.',
    canToggleSupersets: true,
    isIntensityProtocolOffered: true,
    isIntensityProtocolRecommended: true,
    intensityProtocolBadge: 'Hypertrophy Multiplier (Recommended)',
    intensityProtocolRationale: 'Recommended for Phase 3: Drop sets, rest-pause, and myo-reps maximize metabolic stress and motor unit recruitment.',
    isVbtOffered: true,
    isVbtPrimaryMetric: false,
    vbtBadge: 'Velocity Loss Monitor',
    vbtRationale: 'Track concentric velocity degradation across sets to ensure optimal hypertrophy stimulus without excessive CNS fatigue.',
    isWarmupRampHighPriority: true,
    recommendedWarmupStages: 3,
    warmupRampBadge: 'Hypertrophy Ramp',
    warmupRampRationale: 'Prepare working muscle groups for 75–85% 1RM working sets.',
    defaultTempo: '2/0/2',
    defaultRestText: '60–90s',
    minRestSeconds: 45,
    maxRestSeconds: 90,
  },
  4: {
    phase: 4,
    phaseName: 'Maximal Strength',
    isSupersetOffered: false,
    isSupersetDefaultOn: false,
    supersetBadgeLabel: 'Disabled in Phase 4',
    supersetTooltip: 'NASM OPT Phase 4 prohibits supersets. Maximal strength requires 2–4 min complete recovery between heavy sets (85–100% 1RM) for full ATP-CP and CNS resynthesis.',
    canToggleSupersets: false,
    isIntensityProtocolOffered: false,
    isIntensityProtocolRecommended: false,
    intensityProtocolBadge: 'Phase 4: Maximal Strength Mode',
    intensityProtocolRationale: 'Drop sets are prohibited in Phase 4. Heavy 1–5 rep sets require maximal neuromuscular force; drop sets cause metabolic exhaustion without strength adaptation.',
    isVbtOffered: true,
    isVbtPrimaryMetric: false,
    vbtBadge: 'Velocity Loss Guardrail (Crucial)',
    vbtRationale: 'Crucial for maximal strength: Terminate set when velocity drops > 10–20% to avoid neuromuscular burnout.',
    isWarmupRampHighPriority: true,
    recommendedWarmupStages: 5,
    warmupRampBadge: 'Heavy CNS Potentiation Ramp (Crucial)',
    warmupRampRationale: 'Essential for 85–100% 1RM: Ramp through bar, 40%, 60%, 75%, 85%, 90% to potentate the central nervous system and prevent injury.',
    defaultTempo: '1/1/1',
    defaultRestText: '2–4 min',
    minRestSeconds: 120,
    maxRestSeconds: 240,
  },
  5: {
    phase: 5,
    phaseName: 'Power & Post-Activation Potentiation',
    isSupersetOffered: true,
    isSupersetDefaultOn: false, // Default to clean sequential view with 1-tap PAP complex mode available
    supersetBadgeLabel: 'PAP Power Complex Available',
    supersetTooltip: 'NASM OPT Phase 5: Post-Activation Potentiation (heavy strength primer 1–5 reps immediately paired with explosive plyo 8–10 reps).',
    canToggleSupersets: true,
    isIntensityProtocolOffered: false,
    isIntensityProtocolRecommended: false,
    intensityProtocolBadge: 'Phase 5: Power Mode',
    intensityProtocolRationale: 'Drop sets are prohibited in Phase 5. Explosive power requires non-fatigued, high-velocity motor unit firing (RFD).',
    isVbtOffered: true,
    isVbtPrimaryMetric: true,
    vbtBadge: 'Peak Velocity & Wattage (Core Metric)',
    vbtRationale: 'Primary metric of Phase 5: Measure peak concentric velocity (m/s) and explosive power output (watts).',
    isWarmupRampHighPriority: true,
    recommendedWarmupStages: 4,
    warmupRampBadge: 'Heavy Primer Ramp',
    warmupRampRationale: 'Prepares the nervous system for the heavy strength primer lift before explosive contrast.',
    defaultTempo: 'X/0/X',
    defaultRestText: '1–2 min between pairs, 3 min between sets',
    minRestSeconds: 60,
    maxRestSeconds: 180,
  },
}

/**
 * Resolves full feature rules for a given NASM OPT phase (defaults to Phase 2).
 */
export function getNasmOptPhaseFeatureRules(nasmOptPhase?: number | null): NasmPhaseFeatureRules {
  const phaseNum = Math.max(1, Math.min(5, Math.round(Number(nasmOptPhase || 2))))
  return NASM_OPT_FEATURE_RULES[phaseNum] ?? NASM_OPT_FEATURE_RULES[2]
}

/**
 * Checks whether supersets are scientifically offered in the current phase.
 */
export function isSupersetOfferedForPhase(nasmOptPhase?: number | null): boolean {
  return getNasmOptPhaseFeatureRules(nasmOptPhase).isSupersetOffered
}

/**
 * Checks whether supersets should be active by default.
 * PER USER DIRECTIVE: Always returns false. Gym-floor workouts start in clean sequential view.
 */
export function isSupersetDefaultOnForPhase(_nasmOptPhase?: number | null): boolean {
  return false
}

/**
 * Checks whether advanced intensity protocols (drop sets, rest-pause, myo-reps) are offered.
 */
export function isIntensityProtocolOfferedForPhase(nasmOptPhase?: number | null): boolean {
  return getNasmOptPhaseFeatureRules(nasmOptPhase).isIntensityProtocolOffered
}

/**
 * Checks whether Velocity-Based Training (VBT / Bar Velocity) is offered in the current phase.
 */
export function isVbtOfferedForPhase(nasmOptPhase?: number | null): boolean {
  return getNasmOptPhaseFeatureRules(nasmOptPhase).isVbtOffered
}

/**
 * Resolves the deterministic default tempo for an exercise given the NASM OPT phase.
 */
export function getDefaultNasmOptTempo(
  nasmOptPhase?: number | null,
  exerciseName: string = ''
): { tempo: string; rationale: string } {
  const phaseNum = Math.max(1, Math.min(5, Math.round(Number(nasmOptPhase || 2))))
  const lower = exerciseName.toLowerCase()

  if (phaseNum === 1) {
    return {
      tempo: '4/2/1',
      rationale: 'Phase 1 Stabilization: 4s eccentric, 2s isometric hold, 1s concentric.',
    }
  }

  if (phaseNum === 2) {
    const isStabilization =
      lower.includes('ball') ||
      lower.includes('single-leg') ||
      lower.includes('single leg') ||
      lower.includes('bosu') ||
      lower.includes('standing') ||
      lower.includes('balance')

    if (isStabilization) {
      return {
        tempo: '4/2/1',
        rationale: 'Phase 2 Stabilization Partner: 4s eccentric, 2s isometric stabilization pause.',
      }
    }
    return {
      tempo: '2/0/2',
      rationale: 'Phase 2 Strength Lift: 2s eccentric, 0s pause, 2s concentric.',
    }
  }

  if (phaseNum === 3) {
    return {
      tempo: '2/0/2',
      rationale: 'Phase 3 Hypertrophy: 2s eccentric, 0s pause, 2s concentric for maximal mechanical tension.',
    }
  }

  if (phaseNum === 4) {
    return {
      tempo: '1/1/1',
      rationale: 'Phase 4 Maximal Strength: Controlled eccentric, explosive concentric drive.',
    }
  }

  if (phaseNum === 5) {
    const isPower =
      lower.includes('jump') ||
      lower.includes('plyo') ||
      lower.includes('hop') ||
      lower.includes('slam') ||
      lower.includes('throw') ||
      lower.includes('explosive') ||
      lower.includes('bound')

    if (isPower) {
      return {
        tempo: 'X/0/X',
        rationale: 'Phase 5 Power: Maximum explosive concentric velocity.',
      }
    }
    return {
      tempo: '2/0/1',
      rationale: 'Phase 5 Heavy Primer: Controlled eccentric with explosive concentric drive.',
    }
  }

  return {
    tempo: '2/0/2',
    rationale: 'Standard resistance training tempo.',
  }
}
