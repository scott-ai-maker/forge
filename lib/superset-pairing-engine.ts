/**
 * NASM Smart Superset & Circuit Pairing Engine
 * 
 * Based on NASM OPT™ resistance training methodology:
 * - Phase 2 Strength Endurance: Compound strength exercise immediately paired with stabilization exercise
 * - Phase 5 Power: Heavy strength lift (85-90% 1RM) immediately paired with explosive plyometric movement
 * - Antagonist / Agonist Hypertrophy: Pairing opposing muscle groups (e.g. Chest/Back, Biceps/Triceps, Quads/Hamstrings)
 */

import { isSupersetOfferedForPhase } from './nasm-opt-feature-matrix'

export interface ExerciseItemInfo {
  name: string
  sets: string
  reps: string
  tempo?: string | null
  rest?: string | null
  notes?: string | null
  weight_lbs?: number
  block?: string | null
  description?: string | null
  primaryEquipment?: string[] | null
  imageUrl?: string | null
  videoUrl?: string | null
}

export type SupersetCategory =
  | 'phase2_endurance'
  | 'phase5_power'
  | 'antagonist'
  | 'agonist_compound'
  | 'explicit_label'

export interface SupersetPair {
  id: string
  pairLabel: string // e.g. "SUPERSET 1 (1A & 1B)"
  category: SupersetCategory
  categoryTitle: string
  transitionRestSeconds: number // Short interval between 1A and 1B (typically 0-15s)
  compoundRestSeconds: number   // Full restorative interval after 1B (typically 60-90s)
  exerciseA: ExerciseItemInfo
  exerciseB: ExerciseItemInfo
  rationale: string
  indexA?: number
  indexB?: number
}

export type GroupedExerciseEntry =
  | { isSuperset: true; pair: SupersetPair }
  | { isSuperset: false; exercise: ExerciseItemInfo; originalIndex: number }

const ANTAGONIST_PAIRS: Array<[RegExp, RegExp, string]> = [
  [/\b(bench|chest press|push-up|fly|incline press|dip)\b/i, /\b(row|pull-down|pull-up|chin-up|lat pull|face pull)\b/i, 'Chest / Back Antagonist Pair'],
  [/\b(bicep|curl|hammer curl)\b/i, /\b(tricep|pushdown|skull crusher|extension|dip)\b/i, 'Biceps / Triceps Antagonist Pair'],
  [/\b(squat|lunge|leg press|quad|leg extension)\b/i, /\b(deadlift|rdl|romanian|hamstring|leg curl|hip thrust)\b/i, 'Quads / Posterior Chain Antagonist Pair'],
  [/\b(overhead press|shoulder press|military press)\b/i, /\b(lat pulldown|pull-up|chin-up)\b/i, 'Vertical Push / Vertical Pull Antagonist Pair'],
]

const PLYOMETRIC_POWER_KEYWORDS = /\b(jump|plyo|hop|bound|slam|throw|explosive|tuck jump|box jump)\b/i

/**
 * Checks if two exercises form an antagonist muscle group pair
 */
export function isAntagonistPair(nameA: string, nameB: string): { isMatch: boolean; rationale?: string } {
  for (const [patternA, patternB, title] of ANTAGONIST_PAIRS) {
    if (
      (patternA.test(nameA) && patternB.test(nameB)) ||
      (patternB.test(nameA) && patternA.test(nameB))
    ) {
      return { isMatch: true, rationale: title }
    }
  }
  return { isMatch: false }
}

/**
 * Checks if an exercise has explicit superset indicators in its name or notes (e.g. 1A, 1B, "Superset with...")
 */
export function hasExplicitSupersetTag(ex: ExerciseItemInfo): { isTagged: boolean; groupNumber?: string; subLetter?: string } {
  const match = (ex.name + ' ' + (ex.notes || '')).match(/\b(\d+)([ABab])\b/)
  if (match) {
    return { isTagged: true, groupNumber: match[1], subLetter: match[2].toUpperCase() }
  }
  if (/superset/i.test(ex.notes || '') || /paired with/i.test(ex.notes || '')) {
    return { isTagged: true }
  }
  return { isTagged: false }
}

/**
 * Checks if an exercise is a Phase 2 stabilization challenge.
 */
export function isStabilizationExercise(ex: ExerciseItemInfo): boolean {
  const lower = (ex.name + ' ' + (ex.notes || '') + ' ' + (ex.description || '')).toLowerCase()
  return (
    lower.includes('ball') ||
    lower.includes('single-leg') ||
    lower.includes('single leg') ||
    lower.includes('bosu') ||
    lower.includes('balance') ||
    lower.includes('standing cable')
  )
}

/**
 * Automatically clusters workout exercises into Smart Superset pairs or single exercises
 * strictly adhering to NASM OPT™ phase directives.
 */
export function detectAndGroupSupersets(
  exercises: ExerciseItemInfo[],
  nasmOptPhase: number = 2
): GroupedExerciseEntry[] {
  const grouped: GroupedExerciseEntry[] = []
  const usedIndices = new Set<number>()
  const phaseAllowed = isSupersetOfferedForPhase(nasmOptPhase)

  for (let i = 0; i < exercises.length; i++) {
    if (usedIndices.has(i)) continue

    const current = exercises[i]
    const next = i + 1 < exercises.length && !usedIndices.has(i + 1) ? exercises[i + 1] : null

    // 1. Check for explicit 1A / 1B matching (always supported if coach explicitly programmed it)
    const currentTag = hasExplicitSupersetTag(current)
    if (next) {
      const nextTag = hasExplicitSupersetTag(next)

      if (
        currentTag.isTagged &&
        nextTag.isTagged &&
        currentTag.groupNumber &&
        nextTag.groupNumber &&
        currentTag.groupNumber === nextTag.groupNumber &&
        currentTag.subLetter === 'A' &&
        nextTag.subLetter === 'B'
      ) {
        grouped.push({
          isSuperset: true,
          pair: {
            id: `ss-${currentTag.groupNumber}-${i}`,
            pairLabel: `SUPERSET ${currentTag.groupNumber} (${currentTag.groupNumber}A & ${currentTag.groupNumber}B)`,
            category: 'explicit_label',
            categoryTitle: 'Programmed Superset Pair',
            transitionRestSeconds: 15,
            compoundRestSeconds: 75,
            exerciseA: current,
            exerciseB: next,
            rationale: `Programmed superset pair: 1A immediately followed by 1B.`,
            indexA: i,
            indexB: i + 1,
          },
        })
        usedIndices.add(i)
        usedIndices.add(i + 1)
        continue
      }
    }

    // If supersets are not scientifically offered for this phase (e.g. Phase 1 Stabilization, Phase 4 Maximal Strength),
    // do not auto-group exercises into supersets.
    if (!phaseAllowed) {
      grouped.push({
        isSuperset: false,
        exercise: current,
        originalIndex: i,
      })
      usedIndices.add(i)
      continue
    }

    // 2. Check for Phase 5 Power (Heavy Strength + Explosive Plyo)
    if (nasmOptPhase === 5 && next) {
      const isPowerPair = PLYOMETRIC_POWER_KEYWORDS.test(next.name) || PLYOMETRIC_POWER_KEYWORDS.test(next.notes || '')
      if (isPowerPair) {
        grouped.push({
          isSuperset: true,
          pair: {
            id: `ss-phase5-${i}`,
            pairLabel: `SUPERSET ${grouped.length + 1} (5A Heavy + 5B Power)`,
            category: 'phase5_power',
            categoryTitle: 'Phase 5: Potentiation & Power Complex',
            transitionRestSeconds: 10,
            compoundRestSeconds: 90,
            exerciseA: current,
            exerciseB: next,
            rationale: `PAP Complex: Post-Activation Potentiation from heavy load priming followed by explosive plyometric expression.`,
            indexA: i,
            indexB: i + 1,
          },
        })
        usedIndices.add(i)
        usedIndices.add(i + 1)
        continue
      }
    }

    // 3. Check for Phase 2 Strength Endurance (Strength lift + Stabilization exercise)
    if (nasmOptPhase === 2 && next) {
      const isCurrentStabilizer = isStabilizationExercise(current)
      const isNextStabilizer = isStabilizationExercise(next)

      if (!isCurrentStabilizer && isNextStabilizer) {
        const pairNum = grouped.length + 1
        grouped.push({
          isSuperset: true,
          pair: {
            id: `ss-phase2-${i}`,
            pairLabel: `SUPERSET ${pairNum} (Strength + Stabilization)`,
            category: 'phase2_endurance',
            categoryTitle: 'Phase 2: Strength Endurance Contrast',
            transitionRestSeconds: 0,
            compoundRestSeconds: 60,
            exerciseA: current,
            exerciseB: next,
            rationale: 'NASM OPT Phase 2 Superset Contrast: Compound strength lift immediately paired with biomechanically similar stabilization challenge.',
            indexA: i,
            indexB: i + 1,
          },
        })
        usedIndices.add(i)
        usedIndices.add(i + 1)
        continue
      }
    }

    // 4. Check for Biomechanical Antagonist Pairs (Phases 2 & 3 only)
    if ((nasmOptPhase === 2 || nasmOptPhase === 3) && next) {
      const antagonistCheck = isAntagonistPair(current.name, next.name)
      if (antagonistCheck.isMatch) {
        const pairNum = grouped.length + 1
        grouped.push({
          isSuperset: true,
          pair: {
            id: `ss-antagonist-${i}`,
            pairLabel: `SUPERSET ${pairNum} (${pairNum}A & ${pairNum}B)`,
            category: 'antagonist',
            categoryTitle: `Antagonist Superset (${antagonistCheck.rationale})`,
            transitionRestSeconds: 15,
            compoundRestSeconds: 75,
            exerciseA: current,
            exerciseB: next,
            rationale: `Antagonist reciprocal inhibition: Working opposing muscle groups reduces fatigue while maximizing training density.`,
            indexA: i,
            indexB: i + 1,
          },
        })
        usedIndices.add(i)
        usedIndices.add(i + 1)
        continue
      }
    }

    // 5. Default: Standard Single Exercise
    grouped.push({
      isSuperset: false,
      exercise: current,
      originalIndex: i,
    })
    usedIndices.add(i)
  }

  return grouped
}
