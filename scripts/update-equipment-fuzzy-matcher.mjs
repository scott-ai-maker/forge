import fs from 'fs'

const library = JSON.parse(fs.readFileSync('scripts/nasm-complete-library.json', 'utf8'))

const code = `/**
 * Gordon Athletic Advisory — NASM Fuzzy Heuristic Media & Movement Search Engine
 * Cross-references the 320+ verified NASM Edge & Official NASM Exercise Catalog.
 * Integrates equipment/modality vector detection (Dumbbell, Stability/Yoga Ball, Barbell, etc.).
 */

import { detectExerciseEquipment } from './nasm-equipment-detector'

export interface NasmLibraryRecord {
  id: string
  name: string
  slug: string
  description: string | null
  coachingCues: string[] | null
  primaryEquipment: string[] | null
  muscleGroups: string[] | null
  imageUrl: string | null
  videoId: string | null
  videoUrl: string | null
}

export interface FuzzyMatchResult {
  record: NasmLibraryRecord
  score: number
  matchedKey: string
  isDirectMatch: boolean
  detectedEquipment: string[]
}

export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ${JSON.stringify(library, null, 2)}

/**
 * Normalizes an exercise name for heuristic matching.
 */
export function normalizeExerciseQuery(name: string): string {
  return String(name ?? '')
    .replace(/^nasm\\s*edge\\s*[:\\-]\\s*/i, '')
    .replace(/^nasm\\s*[:\\-]\\s*/i, '')
    .replace(/\\s*\\|\\s*nasm(\\s*edge)?$/i, '')
    .replace(/\\s*-\\s*nasm(\\s*edge)?$/i, '')
    .replace(/\\([^)]*\\)/g, ' ')
    .replace(/\\[[^\\]]*\\]/g, ' ')
    .replace(/phase\\s*\\d+/gi, ' ')
    .replace(/strength\\s*\\d+[a-z]?/gi, ' ')
    .replace(/stability\\s*\\d+[a-z]?/gi, ' ')
    .replace(/power\\s*\\d+[a-z]?/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-zA-Z0-9\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .toLowerCase()
    .trim()
}

/**
 * Calculates Token Jaccard Similarity between two word arrays.
 */
function tokenJaccard(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection++
  }
  const union = new Set([...tokensA, ...tokensB]).size
  return union === 0 ? 0 : (intersection / union) * 100
}

/**
 * Heuristic Anchor Rules to guarantee primary compound lifts match exact standard movement patterns.
 */
const HEURISTIC_ANCHORS: Array<{
  requiredWords: string[]
  forbiddenWords?: string[]
  preferredSlugs: string[]
}> = [
  // Flat Barbell Bench Press
  {
    requiredWords: ['barbell', 'bench', 'press'],
    forbiddenWords: ['incline', 'decline', 'chains', 'bands', 'close'],
    preferredSlugs: ['barbell-bench-press-0254'],
  },
  // Flat Dumbbell Bench Press
  {
    requiredWords: ['dumbbell', 'bench', 'press'],
    forbiddenWords: ['incline', 'decline', 'single arm', 'alternating'],
    preferredSlugs: ['dumbbell-bench-press-0108'],
  },
  // Incline Dumbbell Bench Press
  {
    requiredWords: ['incline', 'dumbbell', 'press'],
    preferredSlugs: ['incline-dumbbell-bench-press-0260', 'two-arm-incline-dumbbell-chest-press-0070'],
  },
  // Stability Ball Dumbbell Press
  {
    requiredWords: ['ball', 'press'],
    preferredSlugs: ['activation-ball-prone-shoulder-press-0180', 'two-arm-dumbbell-chest-press-with-band-0231'],
  },
  // Barbell Back Squat
  {
    requiredWords: ['squat'],
    forbiddenWords: ['jump', 'goblet', 'front', 'split', 'bulgarian', 'box', 'overhead', 'thrust', 'tuck', 'single', 'ball'],
    preferredSlugs: ['barbell-back-squat-0199'],
  },
  // Goblet Squat
  {
    requiredWords: ['goblet', 'squat'],
    forbiddenWords: ['jump'],
    preferredSlugs: ['goblet-squat-0039', 'kettlebell-goblet-squat-0091'],
  },
  // Bulgarian Split Squat
  {
    requiredWords: ['bulgarian'],
    preferredSlugs: ['bulgarian-split-squat-0022'],
  },
  // Conventional Barbell Deadlift
  {
    requiredWords: ['deadlift'],
    forbiddenWords: ['romanian', 'rdl', 'single', 'kettlebell'],
    preferredSlugs: ['barbell-deadlift-0054'],
  },
  // Romanian Deadlift (RDL)
  {
    requiredWords: ['romanian', 'deadlift'],
    forbiddenWords: ['single'],
    preferredSlugs: ['dumbbell-romanian-deadlift', 'romanian-deadlift-0134'],
  },
  // Single Leg RDL
  {
    requiredWords: ['single', 'romanian', 'deadlift'],
    preferredSlugs: ['single-leg-romanian-deadlift-0045'],
  },
  // Barbell Bent-Over Row
  {
    requiredWords: ['barbell', 'row'],
    preferredSlugs: ['barbell-bent-over-row-pronated-0249', 'bent-over-barbel-row-supinated-0123'],
  },
  // Dumbbell Bent-Over Row
  {
    requiredWords: ['dumbbell', 'row'],
    forbiddenWords: ['renegade', 'single leg'],
    preferredSlugs: ['dumbbell-bent-over-row-0183', 'supported-bent-over-dumbbell-row-0115'],
  },
  // Overhead Shoulder Press
  {
    requiredWords: ['overhead', 'press'],
    forbiddenWords: ['scaption', 'squat', 'step'],
    preferredSlugs: ['barbell-overhead-press-0206', 'dumbbell-overhead-press-0111'],
  },
  // Dumbbell Lateral Raise
  {
    requiredWords: ['lateral', 'raise'],
    preferredSlugs: ['dumbbell-lateral-raise-0109', 'bent-elbow-dumbbell-lateral-raise-0127'],
  },
  // Biceps Curl
  {
    requiredWords: ['bicep', 'curl'],
    forbiddenWords: ['preacher', 'hammer', 'incline', 'combination'],
    preferredSlugs: ['barbell-bicep-curl-0133'],
  },
  // Hammer Curl
  {
    requiredWords: ['hammer', 'curl'],
    preferredSlugs: ['dumbbell-hammer-curl-0110'],
  },
  // Incline Curl
  {
    requiredWords: ['incline', 'curl'],
    preferredSlugs: ['incline-dumbbell-curl-0266'],
  },
  // Push-Up
  {
    requiredWords: ['push', 'up'],
    forbiddenWords: ['incline', 'decline', 'rotation', 'plus', 'band', 'plyometric'],
    preferredSlugs: ['push-up-0019'],
  },
  // Plank
  {
    requiredWords: ['plank'],
    forbiddenWords: ['side', 'walkup', 'reach', 'knees'],
    preferredSlugs: ['plank-0145', 'straight-arm-plank-0259'],
  },
  // Side Plank
  {
    requiredWords: ['side', 'plank'],
    preferredSlugs: ['side-plank-0258', 'short-lever-side-plank-0235'],
  },
  // SMR / Foam Roll Calves
  {
    requiredWords: ['calves'],
    preferredSlugs: ['foam-roll-calves-0029', 'static-seated-calf-stretch-0226'],
  },
]

/**
 * Searches the official NASM library using sports science fuzzy heuristics and equipment classification.
 */
export function searchNasmLibraryMedia(query: string): FuzzyMatchResult | null {
  if (!query || !query.trim()) return null

  const normalizedQuery = normalizeExerciseQuery(query)
  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  const queryEquipment = detectExerciseEquipment(query)

  if (queryTokens.length === 0) return null

  let bestMatch: NasmLibraryRecord | null = null
  let bestScore = 0
  let isDirect = false

  // 1. Check exact name match
  for (const record of NASM_COMPLETE_LIBRARY) {
    const normName = normalizeExerciseQuery(record.name)
    if (normName === normalizedQuery) {
      return {
        record,
        score: 100,
        matchedKey: record.name,
        isDirectMatch: true,
        detectedEquipment: detectExerciseEquipment(record.name, record.description, record.primaryEquipment),
      }
    }
  }

  // 2. Check Heuristic Anchors first
  for (const anchor of HEURISTIC_ANCHORS) {
    const hasAllRequired = anchor.requiredWords.every(w => normalizedQuery.includes(w))
    const hasForbidden = anchor.forbiddenWords?.some(w => normalizedQuery.includes(w))

    if (hasAllRequired && !hasForbidden) {
      for (const prefSlug of anchor.preferredSlugs) {
        const found = NASM_COMPLETE_LIBRARY.find(r => r.slug.includes(prefSlug) || prefSlug.includes(r.slug))
        if (found) {
          return {
            record: found,
            score: 95,
            matchedKey: found.name,
            isDirectMatch: true,
            detectedEquipment: detectExerciseEquipment(found.name, found.description, found.primaryEquipment),
          }
        }
      }
    }
  }

  // 3. Multi-token scoring with Equipment Modality weighting
  for (const record of NASM_COMPLETE_LIBRARY) {
    const normName = normalizeExerciseQuery(record.name)
    const recTokens = normName.split(' ').filter(Boolean)
    const recEquipment = detectExerciseEquipment(record.name, record.description, record.primaryEquipment)

    let score = tokenJaccard(queryTokens, recTokens)

    // Bonus for substring containment
    if (normName.includes(normalizedQuery) || normalizedQuery.includes(normName)) {
      score += 25
    }

    // Equipment Modality Alignment
    const hasBallQuery = queryEquipment.includes('Stability Ball')
    const hasBallRec = recEquipment.includes('Stability Ball') || normName.includes('ball')
    if (hasBallQuery && hasBallRec) score += 35
    if (hasBallQuery && !hasBallRec) score -= 35

    const hasDbQuery = queryEquipment.includes('Dumbbells')
    const hasDbRec = recEquipment.includes('Dumbbells') || normName.includes('dumbbell')
    if (hasDbQuery && hasDbRec) score += 25
    if (hasDbQuery && normName.includes('barbell')) score -= 25

    const hasBbQuery = queryEquipment.includes('Barbell')
    const hasBbRec = recEquipment.includes('Barbell') || normName.includes('barbell')
    if (hasBbQuery && hasBbRec) score += 25
    if (hasBbQuery && normName.includes('dumbbell')) score -= 25

    // Penalty for specialized modifier divergence
    const specializedModifiers = ['jump', 'box', 'chains', 'bands', 'rotation', 'single leg', 'kettlebell', 'assisted']
    for (const mod of specializedModifiers) {
      if (!normalizedQuery.includes(mod) && normName.includes(mod)) {
        score -= 30
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = record
      isDirect = score >= 80
    }
  }

  if (bestMatch && bestScore >= 60) {
    return {
      record: bestMatch,
      score: bestScore,
      matchedKey: bestMatch.name,
      isDirectMatch: isDirect,
      detectedEquipment: detectExerciseEquipment(bestMatch.name, bestMatch.description, bestMatch.primaryEquipment),
    }
  }

  return null
}
`

fs.writeFileSync('lib/nasm-fuzzy-matcher.ts', code)
console.log('Successfully updated lib/nasm-fuzzy-matcher.ts with equipment-aware matching!')
