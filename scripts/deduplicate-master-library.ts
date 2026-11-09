import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
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

const SEMANTIC_CANONICAL_NAME_MAP: Record<string, string> = {
  'how to foam roll adductors': 'foam roll adductors',
  'dumbbell bent over extention': 'supported bent over dumbbell extension',
  'latissimus dorsi ball stretch': 'static latissimus dorsi ball stretch',
  'self myofascial release smr latissimus dorsi': 'foam roll latissimus dorsi',
  'core ball crunch': 'ball crunch',
  'two arm incline dumbbell chest press': 'incline dumbbell bench press',
}

function normalizeNameKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function resolveCanonicalKey(name: string): string {
  const norm = normalizeNameKey(name)
  return SEMANTIC_CANONICAL_NAME_MAP[norm] || norm
}

function scoreRecord(r: NasmLibraryRecord, canonicalKey: string, officialVideoId?: string): number {
  let score = 0
  const norm = normalizeNameKey(r.name)
  // Strongly prefer the record whose name already matches the canonical key
  if (norm === canonicalKey) score += 100
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

async function main() {
  const libraryPath = path.resolve(process.cwd(), 'scripts/nasm-complete-library.json')
  const fuzzyMatcherPath = path.resolve(process.cwd(), 'lib/nasm-fuzzy-matcher.ts')
  const applySupabase = process.argv.includes('--apply-supabase')

  const rawData: NasmLibraryRecord[] = JSON.parse(fs.readFileSync(libraryPath, 'utf8'))

  console.log(`Starting library deduplication...`)
  console.log(`Initial entries in ${libraryPath}: ${rawData.length}`)

  // Group records by canonical normalized name
  const byCanonical = new Map<string, NasmLibraryRecord[]>()
  for (const ex of rawData) {
    const canonKey = resolveCanonicalKey(ex.name)
    const list = byCanonical.get(canonKey) || []
    list.push(ex)
    byCanonical.set(canonKey, list)
  }

  const canonicalRecords: NasmLibraryRecord[] = []

  for (const [canonKey, rows] of byCanonical.entries()) {
    const officialVideo = NASM_EDGE_OFFICIAL_CATALOG[canonKey]
    rows.sort((a, b) => scoreRecord(b, canonKey, officialVideo) - scoreRecord(a, canonKey, officialVideo))
    const best: NasmLibraryRecord = { ...rows[0] }

    // Merge richer description / equipment / muscle groups from any merged duplicate
    for (const candidate of rows.slice(1)) {
      if (
        canonKey === 'static latissimus dorsi ball stretch' &&
        candidate.description &&
        candidate.description.toLowerCase().includes('stability ball')
      ) {
        best.description = candidate.description
        if (candidate.coachingCues && candidate.coachingCues.length > 0) {
          best.coachingCues = candidate.coachingCues
        }
        if (candidate.videoId) {
          best.videoId = candidate.videoId
          best.videoUrl = `https://www.youtube.com/watch?v=${candidate.videoId}`
        }
      } else if ((!best.description || best.description.length < 80) && candidate.description && candidate.description.length > (best.description?.length || 0)) {
        best.description = candidate.description
      }
      if ((!best.primaryEquipment || best.primaryEquipment.length === 0) && candidate.primaryEquipment && candidate.primaryEquipment.length > 0) {
        best.primaryEquipment = candidate.primaryEquipment
      }
      if ((!best.muscleGroups || best.muscleGroups.length === 0) && candidate.muscleGroups && candidate.muscleGroups.length > 0) {
        best.muscleGroups = candidate.muscleGroups
      }
    }

    if (officialVideo && canonKey !== 'static latissimus dorsi ball stretch') {
      best.videoId = officialVideo
      best.videoUrl = `https://www.youtube.com/watch?v=${officialVideo}`
    }

    const studioImg = resolveGaaExerciseImage(best.name, false)
    if (studioImg) {
      best.imageUrl = studioImg
    } else if (best.videoId) {
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

  if (!applySupabase) {
    console.log(`Pass --apply-supabase to synchronize and prune duplicate rows in Supabase exercise_library_entries.`)
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: dbRows, error: dbErr } = await supabase
    .from('exercise_library_entries')
    .select('*')
    .limit(2000)

  if (dbErr || !dbRows) {
    throw new Error(`Failed to fetch exercise_library_entries: ${dbErr?.message}`)
  }

  const canonicalById = new Map(canonicalRecords.map(r => [r.id, r]))
  const canonicalByKey = new Map(canonicalRecords.map(r => [resolveCanonicalKey(r.name), r]))

  // Build oldId -> canonicalRecord mapping for all duplicate DB rows
  const duplicateRowIds: string[] = []
  const idRemap = new Map<string, NasmLibraryRecord>()

  for (const row of dbRows) {
    if (canonicalById.has(row.id)) continue
    duplicateRowIds.push(row.id)
    const canon = canonicalByKey.get(resolveCanonicalKey(row.name))
    if (canon) {
      idRemap.set(row.id, canon)
    }
  }

  console.log(`Found ${dbRows.length} rows in Supabase exercise_library_entries (${duplicateRowIds.length} duplicate rows to prune).`)

  // Upsert any canonical records missing from DB (or update existing canonical records)
  const dbRowById = new Map(dbRows.map(r => [r.id, r]))
  let updatedMediaCount = 0
  for (const canon of canonicalRecords) {
    const existingRow = dbRowById.get(canon.id)
    if (!existingRow) {
      console.log(`Inserting missing canonical exercise into DB: "${canon.name}" (${canon.id})`)
      const { error: insErr } = await supabase.from('exercise_library_entries').insert({
        id: canon.id,
        name: canon.name,
        slug: canon.slug,
        source: 'nasm_exercise_library',
        source_id: canon.slug,
        description: canon.description,
        coaching_cues: canon.coachingCues || [],
        primary_equipment: canon.primaryEquipment || [],
        muscle_groups: canon.muscleGroups || [],
        media_image_url: canon.imageUrl,
        media_video_url: canon.videoUrl,
        open_externally_only: false,
        is_active: true,
      })
      if (insErr) console.error(`Failed to insert ${canon.name}:`, insErr.message)
    } else if (
      existingRow.media_image_url !== canon.imageUrl ||
      existingRow.media_video_url !== canon.videoUrl ||
      resolveCanonicalKey(canon.name) === 'static latissimus dorsi ball stretch'
    ) {
      await supabase
        .from('exercise_library_entries')
        .update({
          description: canon.description,
          coaching_cues: canon.coachingCues || [],
          media_image_url: canon.imageUrl,
          media_video_url: canon.videoUrl,
        })
        .eq('id', canon.id)
      updatedMediaCount++
    }
  }
  if (updatedMediaCount > 0) {
    console.log(`Updated media_image_url / media_video_url on ${updatedMediaCount} Supabase exercise_library_entries rows.`)
  }

  // Remap any references to duplicate IDs or semantic duplicate names in workout_plans & workout_program_templates
  const remapPlanObject = (obj: unknown): { changed: boolean; next: unknown } => {
    let changed = false
    const visit = (node: unknown): unknown => {
      if (!node || typeof node !== 'object') return node
      if (Array.isArray(node)) return node.map(visit)
      const rec = { ...(node as Record<string, unknown>) }
      const libId = typeof rec.libraryExerciseId === 'string' ? rec.libraryExerciseId : null
      const exName = typeof rec.name === 'string' ? rec.name : null
      if (libId && idRemap.has(libId)) {
        const target = idRemap.get(libId)!
        rec.libraryExerciseId = target.id
        if (exName && SEMANTIC_CANONICAL_NAME_MAP[normalizeNameKey(exName)]) {
          rec.name = target.name
        }
        changed = true
      } else if (exName && SEMANTIC_CANONICAL_NAME_MAP[normalizeNameKey(exName)]) {
        const target = canonicalByKey.get(resolveCanonicalKey(exName))
        if (target && (rec.sets !== undefined || rec.reps !== undefined || rec.libraryExerciseId !== undefined)) {
          rec.name = target.name
          rec.libraryExerciseId = target.id
          changed = true
        }
      }
      for (const [k, v] of Object.entries(rec)) {
        if (v && typeof v === 'object') {
          rec[k] = visit(v)
        }
      }
      return rec
    }
    const next = visit(obj)
    return { changed, next }
  }

  const { data: plans } = await supabase.from('workout_plans').select('id, plan_json')
  for (const plan of plans || []) {
    const { changed, next } = remapPlanObject(plan.plan_json)
    if (changed) {
      await supabase.from('workout_plans').update({ plan_json: next }).eq('id', plan.id)
      console.log(`Remapped duplicate exercise references in workout_plan ${plan.id}`)
    }
  }

  const { data: templates } = await supabase.from('workout_program_templates').select('id, template_json')
  for (const tpl of templates || []) {
    const { changed, next } = remapPlanObject(tpl.template_json)
    if (changed) {
      await supabase.from('workout_program_templates').update({ template_json: next }).eq('id', tpl.id)
      console.log(`Remapped duplicate exercise references in workout_program_template ${tpl.id}`)
    }
  }

  // Delete duplicate rows from exercise_library_entries
  if (duplicateRowIds.length > 0) {
    const { error: delErr } = await supabase
      .from('exercise_library_entries')
      .delete()
      .in('id', duplicateRowIds)
    if (delErr) {
      throw new Error(`Failed to delete duplicate rows: ${delErr.message}`)
    }
    console.log(`Deleted ${duplicateRowIds.length} duplicate rows from Supabase exercise_library_entries.`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
