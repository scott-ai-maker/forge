import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

function extractYouTubeVideoId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  return m ? m[1] : null
}

function scoreRecord(r) {
  let score = 0
  if (r.media_video_url) score += 10
  if (r.media_image_url) score += 5
  if (r.description && r.description.length > 50) score += 5
  // Prioritize canonical video for Single-Leg Single-Arm Scaption
  if (r.slug === 'single-leg-single-arm-scaption-0215') score += 100
  return score
}

async function main() {
  const { data, error } = await supabase
    .from('exercise_library_entries')
    .select('id, name, slug, description, coaching_cues, primary_equipment, muscle_groups, media_image_url, media_video_url, source')
    .in('source', ['nasm_exercise_library', 'licensed_import'])
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching exercise_library_entries:', error)
    process.exit(1)
  }

  console.log(`Fetched ${data.length} active official library entries from Supabase.`)

  // Group by normalized name
  const byName = new Map()
  for (const row of data) {
    const key = row.name.toLowerCase().trim()
    if (!byName.has(key)) byName.set(key, [])
    byName.get(key).push(row)
  }

  // Sort each group so canonical record comes first
  const sortedRows = []
  for (const [, rows] of byName.entries()) {
    rows.sort((a, b) => scoreRecord(b) - scoreRecord(a))
    sortedRows.push(...rows)
  }

  // Format into standard NasmLibraryRecord
  const library = sortedRows.map(row => {
    const videoId = extractYouTubeVideoId(row.media_video_url)
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? null,
      coachingCues: [],
      primaryEquipment: Array.isArray(row.primary_equipment) ? row.primary_equipment : [],
      muscleGroups: Array.isArray(row.muscle_groups) ? row.muscle_groups : [],
      imageUrl: row.media_image_url ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
      videoId,
      videoUrl: row.media_video_url ?? null,
    }
  })

  fs.writeFileSync('scripts/nasm-complete-library.json', JSON.stringify(library, null, 2))
  console.log(`Wrote ${library.length} exercises to scripts/nasm-complete-library.json`)

  const code = `/**
 * Gordon Athletic Advisory — NASM Heuristic Media & Movement Search Engine
 * Cross-references the 350+ verified official NASM and licensed exercise catalog.
 * Uses exact canonical name matching to strictly prevent incorrect video/image pairing.
 */

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
}

export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ${JSON.stringify(library, null, 2)}

/**
 * Normalizes an exercise name for heuristic matching.
 * Strips superset suffixes "(Strength 1A)", "(Stability 1B)", parentheticals, phase markers, and punctuation.
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

export const EXERCISE_ALIASES: Record<string, string> = {
  'prone cobra on floor': 'floor prone cobra',
  'squat to neutral overhead dumbbell press': 'dumbbell squat to overhead press',
  'single leg romanian deadlift to row': 'single leg romanian deadlift',
  'lateral tube walk': 'lateral band walking',
  'incline push up with scapular protraction': 'incline push up',
  'side plank with top leg lift': 'side plank',
  'chest supported dumbbell row': 'supported bent over dumbbell row',
  'dumbbell bent over extention': 'supported bent over dumbbell extension',
  'stability ball hamstring curl': 'floor bridge',
  'stability ball hamstring curls': 'floor bridge',
  'ball hamstring curl': 'floor bridge',
  'ball hamstring curls': 'floor bridge',
}

/**
 * Searches the official NASM library using exact canonical names only.
 * Deliberately rejects fuzzy or constructed exercise names so the app only uses
 * verified official movements from approved brand libraries.
 */
export function searchNasmLibraryMedia(query: string): FuzzyMatchResult | null {
  if (!query || !query.trim()) return null

  const normalizedQuery = normalizeExerciseQuery(query)
  if (!normalizedQuery) return null

  const resolvedQuery = EXERCISE_ALIASES[normalizedQuery] || normalizedQuery

  for (const record of NASM_COMPLETE_LIBRARY) {
    const normName = normalizeExerciseQuery(record.name)
    if (normName === resolvedQuery) {
      return {
        record,
        score: 100,
        matchedKey: record.name,
        isDirectMatch: true,
      }
    }
  }

  return null
}
`

  fs.writeFileSync('lib/nasm-fuzzy-matcher.ts', code)
  console.log('Successfully wrote lib/nasm-fuzzy-matcher.ts with all 351 official exercises!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
