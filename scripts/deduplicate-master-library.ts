import fs from 'fs'
import path from 'path'
import { NASM_EDGE_OFFICIAL_CATALOG } from '../lib/nasm-exercise-video-catalog'
import { resolveGaaExerciseImage } from '../lib/nasm-generated-images'

interface NasmLibraryRecord {
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

const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
const fuzzyMatcherPath = path.resolve(process.cwd(), 'lib/nasm-fuzzy-matcher.ts')

const rawData: NasmLibraryRecord[] = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))

console.log(`Starting library deduplication...`)
console.log(`Initial entries in ${libraryPath}: ${rawData.length}`)

function scoreRecord(r: NasmLibraryRecord, officialVideoId?: string): number {
  let score = 0
  if (r.videoId) score += 10
  if (officialVideoId && r.videoId === officialVideoId) score += 50
  if (r.description && r.description.length > 50) {
    score += Math.min(25, Math.floor(r.description.length / 50))
  }
  if (r.primaryEquipment && r.primaryEquipment.length > 0) score += 5
  if (r.muscleGroups && r.muscleGroups.length > 0) score += 5
  if (r.imageUrl && !r.imageUrl.includes('placeholder')) score += 5
  return score
}

// Group records by normalized name
const byName = new Map<string, NasmLibraryRecord[]>()
for (const ex of rawData) {
  const norm = ex.name.toLowerCase().trim()
  const list = byName.get(norm) || []
  list.push(ex)
  byName.set(norm, list)
}

const canonicalRecords: NasmLibraryRecord[] = []

for (const [name, rows] of byName.entries()) {
  const officialVideo = NASM_EDGE_OFFICIAL_CATALOG[name]
  rows.sort((a, b) => scoreRecord(b, officialVideo) - scoreRecord(a, officialVideo))
  const best: NasmLibraryRecord = { ...rows[0] }

  if (officialVideo) {
    best.videoId = officialVideo
    best.videoUrl = `https://www.youtube.com/watch?v=${officialVideo}`
  }

  // Return to official default NASM Edge video thumbnail
  if (best.videoId) {
    best.imageUrl = `https://img.youtube.com/vi/${best.videoId}/hqdefault.jpg`
  }

  canonicalRecords.push(best)
}

// Sort alphabetically by exercise name
canonicalRecords.sort((a, b) => a.name.localeCompare(b.name))

console.log(`Deduplication completed: ${rawData.length} rows -> ${canonicalRecords.length} canonical exercises.`)

// 1. Write clean scripts/nasm-complete-library.json
fs.writeFileSync(libraryPath, JSON.stringify(canonicalRecords, null, 2))
console.log(`Successfully updated ${libraryPath}`)

// 2. Read existing lib/nasm-fuzzy-matcher.ts to preserve trailing helpers and aliases
const existingFuzzyMatcherCode = fs.readFileSync(fuzzyMatcherPath, 'utf8')
const marker = 'export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ['
const splitIdx = existingFuzzyMatcherCode.indexOf(marker)

if (splitIdx === -1) {
  throw new Error(`Could not locate NASM_COMPLETE_LIBRARY marker in ${fuzzyMatcherPath}`)
}

// Find the end of array
const endMarker = 'export function normalizeExerciseQuery(name: string): string {'
const endSplitIdx = existingFuzzyMatcherCode.indexOf(endMarker)

if (endSplitIdx === -1) {
  throw new Error(`Could not locate normalizeExerciseQuery marker in ${fuzzyMatcherPath}`)
}

const header = existingFuzzyMatcherCode.slice(0, splitIdx)
const trailer = existingFuzzyMatcherCode.slice(endSplitIdx)

const updatedCode = `${header}export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ${JSON.stringify(canonicalRecords, null, 2)}\n\n/**\n * Normalizes an exercise name for heuristic matching.\n * Strips superset suffixes "(Strength 1A)", "(Stability 1B)", parentheticals, phase markers, and punctuation.\n */\n${trailer}`

fs.writeFileSync(fuzzyMatcherPath, updatedCode)
console.log(`Successfully updated ${fuzzyMatcherPath}`)
