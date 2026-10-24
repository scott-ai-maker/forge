import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const isApply = process.argv.includes('--apply')
const isDryRun = !isApply || process.argv.includes('--dry-run')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

function formatExerciseDescription(description: string | null | undefined): string | null {
  const text = String(description ?? '').replace(/\r/g, '').trim()
  if (!text) return null

  const numberedSteps = text.match(/Step\s*\d+\s*:[\s\S]*?(?=(?:\s*Step\s*\d+\s*:)|$)/gi)
  if (numberedSteps && numberedSteps.length > 1) {
    return numberedSteps
      .map(step => step.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n')
  }

  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length > 1) {
    return lines.join('\n\n')
  }

  return text.replace(/\s+/g, ' ')
}

function parseCoachingCues(description: string | null | undefined): string[] {
  const text = formatExerciseDescription(description)
  if (!text) return []

  const rawLines = text
    .split(/\n+/)
    .map(line => normalizeText(line.replace(/^Step\s*\d+\s*:\s*/i, '')))
    .filter(Boolean)

  if (rawLines.length > 0) {
    return rawLines.slice(0, 4)
  }

  return text
    .split('.')
    .map(line => normalizeText(line))
    .filter(Boolean)
    .slice(0, 4)
}

interface LocalCatalogItem {
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

interface DbExerciseRow {
  id: string
  name: string
  slug: string
  description: string | null
  coaching_cues: string[] | null
  primary_equipment: string[] | null
  muscle_groups: string[] | null
  media_image_url: string | null
  media_video_url: string | null
  is_active: boolean
  source: string
}

async function main() {
  console.log(`=== Forge Athletic — Supabase Exercise Library Sync ===`)
  console.log(`Mode: ${isApply ? 'APPLY (Modifying Database)' : 'DRY RUN (Preview Only)'}`)
  console.log(`Database: ${supabaseUrl}\n`)

  const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
  const localCatalog: LocalCatalogItem[] = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))
  console.log(`Loaded ${localCatalog.length} exercises from ${libraryPath}`)

  const { data: dbRows, error: fetchError } = await supabase
    .from('exercise_library_entries')
    .select('id, name, slug, description, coaching_cues, primary_equipment, muscle_groups, media_image_url, media_video_url, is_active, source')
    .limit(2000)

  if (fetchError || !dbRows) {
    console.error('Failed to fetch exercises from Supabase:', fetchError)
    process.exit(1)
  }

  console.log(`Fetched ${dbRows.length} exercises from Supabase\n`)

  const dbById = new Map<string, DbExerciseRow>(dbRows.map(r => [r.id, r]))
  const updatesToApply: Array<{
    id: string
    name: string
    changes: Record<string, unknown>
    summary: string[]
  }> = []

  let matchedCount = 0

  const changedDescIds = new Set<string>()

  for (const local of localCatalog) {
    const db = dbById.get(local.id)
    if (!db) {
      console.warn(`[WARNING] Local exercise ID not found in DB: ${local.id} ("${local.name}")`)
      continue
    }

    matchedCount++
    const changes: Record<string, unknown> = {}
    const summary: string[] = []

    // 1. Check description
    const localDesc = (local.description || '').trim()
    const dbDesc = (db.description || '').trim()
    if (localDesc !== dbDesc) {
      changes.description = localDesc
      changedDescIds.add(local.id)
      summary.push(`Description updated (audited text)`)
    }

    // 2. Check muscle groups
    const localMuscles = (local.muscleGroups || []).slice().sort()
    const dbMuscles = (db.muscle_groups || []).slice().sort()
    if (localMuscles.join(',') !== dbMuscles.join(',')) {
      changes.muscle_groups = local.muscleGroups
      summary.push(`Muscle Groups: [${dbMuscles.join(', ')}] -> [${localMuscles.join(', ')}]`)
    }

    // 3. Check primary equipment
    const localEquip = (local.primaryEquipment || []).slice().sort()
    const dbEquip = (db.primary_equipment || []).slice().sort()
    if (localEquip.join(',') !== dbEquip.join(',')) {
      changes.primary_equipment = local.primaryEquipment
      summary.push(`Primary Equipment: [${dbEquip.join(', ')}] -> [${localEquip.join(', ')}]`)
    }

    // 4. Check coaching cues
    const currentDbCues = Array.isArray(db.coaching_cues) ? db.coaching_cues : []
    const generatedCues = parseCoachingCues(local.description)

    let shouldUpdateCues = false
    if (currentDbCues.length === 0 && generatedCues.length > 0) {
      shouldUpdateCues = true
      summary.push(`Coaching Cues: Populated ${generatedCues.length} steps`)
    } else if (changes.description) {
      shouldUpdateCues = true
      summary.push(`Coaching Cues: Re-aligned with corrected description`)
    }

    if (shouldUpdateCues) {
      changes.coaching_cues = generatedCues
    }

    if (Object.keys(changes).length > 0) {
      updatesToApply.push({
        id: local.id,
        name: local.name,
        changes,
        summary,
      })
    }
  }

  console.log(`Matched ${matchedCount} / ${localCatalog.length} exercises.`)
  console.log(`Exercises requiring database updates: ${updatesToApply.length}\n`)

  const auditedFixes = updatesToApply.filter(u => u.changes.description || u.changes.muscle_groups || u.changes.primary_equipment)
  console.log(`--- High-Priority Audited Biomechanical Fixes (${auditedFixes.length}) ---`)
  for (const update of auditedFixes) {
    console.log(`Exercise: "${update.name}" (${update.id})`)
    for (const line of update.summary) {
      console.log(`  - ${line}`)
    }
  }

  const cuesOnly = updatesToApply.filter(u => !u.changes.description && !u.changes.muscle_groups && !u.changes.primary_equipment)
  console.log(`\n--- Cue Backfill Updates: ${cuesOnly.length} exercises ---`)

  if (isDryRun) {
    console.log(`\n[DRY RUN COMPLETE] No changes written to database. Run with --apply to execute.`)
    return
  }

  // Execute database updates with concurrency of 8
  console.log(`\nApplying updates to Supabase with concurrency 8...`)
  let appliedCount = 0
  let failedCount = 0
  const CONCURRENCY = 8

  for (let i = 0; i < updatesToApply.length; i += CONCURRENCY) {
    const batch = updatesToApply.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async update => {
        const { error: updateError } = await supabase
          .from('exercise_library_entries')
          .update(update.changes)
          .eq('id', update.id)

        if (updateError) {
          console.error(`  [FAILED] "${update.name}": ${updateError.message}`)
          failedCount++
        } else {
          appliedCount++
        }
      })
    )
    process.stdout.write(`\rProgress: ${appliedCount + failedCount} / ${updatesToApply.length}`)
  }
  console.log(`\n\nSupabase Updates Complete: ${appliedCount} succeeded, ${failedCount} failed.`)

  if (failedCount === 0) {
    // 1. Sync coachingCues into scripts/nasm-complete-library.json
    console.log(`Updating scripts/nasm-complete-library.json with synchronized coaching cues...`)
    const updatedLocalCatalog = localCatalog.map(local => {
      const db = dbById.get(local.id)
      const currentDbCues = Array.isArray(db?.coaching_cues) ? db.coaching_cues : []
      const cues = (currentDbCues.length > 0 && !changedDescIds.has(local.id))
        ? currentDbCues
        : parseCoachingCues(local.description)
      return {
        ...local,
        coachingCues: cues,
      }
    })

    fs.writeFileSync(libraryPath, JSON.stringify(updatedLocalCatalog, null, 2), 'utf8')
    console.log(`Synchronized scripts/nasm-complete-library.json!`)

    // 2. Sync lib/nasm-fuzzy-matcher.ts
    console.log(`Updating lib/nasm-fuzzy-matcher.ts...`)
    const fuzzyMatcherPath = path.resolve(process.cwd(), 'lib/nasm-fuzzy-matcher.ts')
    const currentFuzzyMatcher = fs.readFileSync(fuzzyMatcherPath, 'utf8')

    // Find where EXERCISE_ALIASES starts
    const aliasesIndex = currentFuzzyMatcher.indexOf('export const EXERCISE_ALIASES:')
    if (aliasesIndex === -1) {
      console.error('Could not find EXERCISE_ALIASES in lib/nasm-fuzzy-matcher.ts')
      return
    }

    const restOfFile = currentFuzzyMatcher.slice(aliasesIndex)
    const newHeaderAndLibrary = `/**
 * Forge Athletic — NASM Heuristic Media & Movement Search Engine
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

export const NASM_COMPLETE_LIBRARY: NasmLibraryRecord[] = ${JSON.stringify(updatedLocalCatalog, null, 2)}

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

`

    fs.writeFileSync(fuzzyMatcherPath, newHeaderAndLibrary + restOfFile, 'utf8')
    console.log(`Synchronized lib/nasm-fuzzy-matcher.ts!`)
  }
}

main().catch(err => {
  console.error('Fatal error during sync:', err)
  process.exit(1)
})
