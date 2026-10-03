const OFFICIAL_SOURCES = ['nasm_exercise_library', 'licensed_import']
const PAGE_SIZE = 1000
const applyChanges = process.argv.includes('--apply')

const EXERCISE_ALIASES = {
  'single leg squat to box bench dumbbell counterbalance': 'single leg squat',
  'single leg squat to box bench': 'single leg squat',
  'single leg squat to chair step bodyweight balance': 'single leg squat',
  'multiplanar step up to balance dumbbells': 'step up to balance sagital',
  'multiplanar lunge to balance bodyweight': 'lunge to balance',
  'reverse lunge with torso lean step up to low box': 'reverse lunge to balance',
  'reverse lunge with torso lean': 'reverse lunge to balance',
  'foam roll smr calves and tfl': 'foam roll calves',
  'foam roll calves and tfl': 'foam roll calves',
  'static hip flexor and calves stretch': 'static kneeling hip flexor stretch',
  'floor bridge with band abduction': 'floor bridge',
  'single leg balance to reach': 'single leg balance reach multiplanar',
  'dumbbell goblet squat to bench': 'goblet squat',
  'standing cable band neutral row': 'standing tubing row',
  'standing cable band row': 'standing tubing row',
  'standing dumbbell overhead scaption': 'single leg scaption',
  'plank with alternating arm reach': 'plank with arm reach',
  'smr thoracic spine and latissimus dorsi': 'self myofascial release smr thoracic spine',
  'doorway pectoral stretch': 'static pectoral ball stretch',
  'quadruped bird dog': 'bird dog',
  'dumbbell romanian deadlift on balance pad': 'dumbbell romanian deadlift',
  'dumbbell step up to balance': 'step up to balance sagital',
  'face pulls with external rotation': 'face pull',
  'deadbug with core compression': 'dead bug',
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
}

function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cloneJson(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value))
}

function scoreRecord(record) {
  let score = 0
  if (record.media_video_url) score += 4
  if (record.media_image_url) score += 2
  if (Array.isArray(record.coaching_cues) && record.coaching_cues.length > 0) score += 1
  return score
}

function buildLookup(records) {
  const byId = new Map()
  const byKey = new Map()

  for (const record of records) {
    byId.set(record.id, record)
    for (const value of [record.name, record.slug]) {
      const key = normalizeKey(value)
      if (!key) continue
      const existing = byKey.get(key)
      if (!existing) {
        byKey.set(key, record)
      } else if (scoreRecord(record) > scoreRecord(existing)) {
        byKey.set(key, record)
      }
    }
  }

  return { byId, byKey }
}

function resolveOfficialExercise(exercise, lookup) {
  for (const value of [exercise?.name, exercise?.slug]) {
    const key = normalizeKey(value)
    if (!key) continue
    const aliased = EXERCISE_ALIASES[key]
    if (aliased && lookup.byKey.has(aliased)) return lookup.byKey.get(aliased)
  }

  const id = String(exercise?.libraryExerciseId ?? '').trim()
  if (id && lookup.byId.has(id)) return lookup.byId.get(id)

  for (const value of [exercise?.name, exercise?.slug]) {
    const key = normalizeKey(value)
    if (!key) continue
    if (lookup.byKey.has(key)) return lookup.byKey.get(key)
  }

  return null
}

export function parseStepInstructions(description) {
  const text = String(description ?? '').replace(/\r/g, '').trim()
  if (!text) return []

  const stepMatches = text.split(/(?=Step\s*\d+:?)/i).map(s => s.trim()).filter(Boolean)
  if (stepMatches.length >= 2) {
    return stepMatches.map((step, idx) => {
      const clean = step.replace(/^Step\s*\d+:?\s*/i, '').trim()
      return `${idx + 1}. ${clean}`
    })
  }

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length > 1) {
    return lines.map((l, idx) => {
      const clean = l.replace(/^\d+[\.\)]\s*/, '').trim()
      return `${idx + 1}. ${clean}`
    })
  }

  return [`1. ${text}`]
}

export function mapSnapshot(exercise, lookup, unresolved) {
  const official = resolveOfficialExercise(exercise, lookup)
  if (!official) {
    if (unresolved) unresolved.push(String(exercise?.name ?? '').trim() || '(unnamed exercise)')
    return exercise
  }

  const instructions = parseStepInstructions(official.description)

  return {
    ...exercise,
    libraryExerciseId: official.id,
    name: official.name,
    description: official.description ?? null,
    instructions: instructions.length > 0 ? instructions : undefined,
    coachingCues: [],
    primaryEquipment: Array.isArray(official.primary_equipment) ? official.primary_equipment : [],
    imageUrl: official.media_image_url ?? exercise.imageUrl ?? null,
    videoUrl: official.media_video_url ?? exercise.videoUrl ?? null,
    openExternallyOnly: Boolean(official.open_externally_only),
  }
}


function remapPlanJson(planJson, lookup) {
  if (!planJson || typeof planJson !== 'object') {
    return { planJson, changed: false, remappedCount: 0, unresolved: [] }
  }

  const nextPlanJson = cloneJson(planJson)
  const unresolved = []
  let remappedCount = 0
  let changed = false

  const remapWorkoutList = workouts => {
    if (!Array.isArray(workouts)) return workouts
    return workouts.map(workout => {
      if (!workout || typeof workout !== 'object' || !Array.isArray(workout.exercises)) return workout
      return {
        ...workout,
        exercises: workout.exercises.map(exercise => {
          const nextExercise = mapSnapshot(exercise, lookup, unresolved)
          if (JSON.stringify(nextExercise) !== JSON.stringify(exercise)) {
            changed = true
            remappedCount += 1
          }
          return nextExercise
        }),
      }
    })
  }

  for (const collectionName of ['workouts', 'sessions']) {
    if (Array.isArray(nextPlanJson[collectionName])) {
      nextPlanJson[collectionName] = remapWorkoutList(nextPlanJson[collectionName])
    }
  }

  if (nextPlanJson.macrocyclePlan && Array.isArray(nextPlanJson.macrocyclePlan.workouts)) {
    nextPlanJson.macrocyclePlan.workouts = remapWorkoutList(nextPlanJson.macrocyclePlan.workouts)
  }

  return { planJson: nextPlanJson, changed, remappedCount, unresolved }
}

async function fetchAll(queryFactory) {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryFactory(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1. Fetch Official Exercises (all active official sources)
  const officialExercises = await fetchAll((from, to) =>
    admin
      .from('exercise_library_entries')
      .select('id, name, slug, description, coaching_cues, primary_equipment, media_image_url, media_video_url, open_externally_only')
      .in('source', OFFICIAL_SOURCES)
      .eq('is_active', true)
      .range(from, to)
  )
  console.log(`Loaded ${officialExercises.length} official exercise library entries.`)
  const lookup = buildLookup(officialExercises)

  // 2. Fetch Clients & Workout Plans
  const clients = await fetchAll((from, to) =>
    admin.from('clients').select('id, full_name').eq('role', 'client').range(from, to)
  )
  const clientIds = clients.map(client => client.id)
  const clientNames = new Map(clients.map(client => [client.id, client.full_name || client.id]))

  const plans = await fetchAll((from, to) =>
    admin
      .from('workout_plans')
      .select('id, user_id, name, plan_json')
      .in('user_id', clientIds)
      .range(from, to)
  )

  let changedPlans = 0
  let changedExercises = 0
  const unresolved = []

  for (const plan of plans) {
    const result = remapPlanJson(plan.plan_json, lookup)
    if (result.unresolved.length) {
      unresolved.push({
        client: clientNames.get(plan.user_id) || plan.user_id,
        planId: plan.id,
        planName: plan.name,
        exercises: [...new Set(result.unresolved)],
      })
    }
    if (!result.changed) continue

    changedPlans += 1
    changedExercises += result.remappedCount
    if (applyChanges) {
      const { error } = await admin.from('workout_plans').update({ plan_json: result.planJson }).eq('id', plan.id)
      if (error) throw new Error(`Failed to update workout plan ${plan.id}: ${error.message}`)
    }
  }

  console.log(`\n--- PRESENT & FUTURE ROUTINES (workout_plans) ---`)
  console.log(`${applyChanges ? 'Applied' : 'Would apply'} ${changedPlans} plan update(s) across ${plans.length} plan(s).`)
  console.log(`${applyChanges ? 'Remapped' : 'Would remap'} ${changedExercises} exercise snapshot(s).`)
  if (unresolved.length) {
    console.warn(`Skipped ${unresolved.length} plan(s) with unmatched exercises:`)
    for (const item of unresolved) {
      console.warn(`- ${item.client} (${item.planName || item.planId}): ${item.exercises.join(', ')}`)
    }
  }

  // 3. Remap Past Workout Logs (workout_set_logs)
  console.log(`\n--- PAST EXERCISES (workout_set_logs) ---`)
  const setLogs = await fetchAll((from, to) =>
    admin.from('workout_set_logs').select('id, exercise_name').range(from, to)
  )

  let remappedSetLogsCount = 0
  const unresolvedSetLogs = new Set()
  const setLogUpdates = new Map()

  for (const row of setLogs) {
    const official = resolveOfficialExercise({ name: row.exercise_name }, lookup)
    if (!official) {
      unresolvedSetLogs.add(row.exercise_name)
      continue
    }
    if (official.name !== row.exercise_name) {
      remappedSetLogsCount += 1
      if (!setLogUpdates.has(official.name)) setLogUpdates.set(official.name, [])
      setLogUpdates.get(official.name).push(row.id)
    }
  }

  console.log(`${applyChanges ? 'Remapped' : 'Would remap'} ${remappedSetLogsCount} workout_set_logs row(s).`)
  if (applyChanges) {
    for (const [officialName, ids] of setLogUpdates.entries()) {
      // Chunk updates in batches of 100
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100)
        const { error } = await admin.from('workout_set_logs').update({ exercise_name: officialName }).in('id', batch)
        if (error) throw new Error(`Failed to update workout_set_logs batch: ${error.message}`)
      }
    }
  }
  if (unresolvedSetLogs.size > 0) {
    console.warn(`Unmatched exercise names in workout_set_logs:`, [...unresolvedSetLogs])
  }

  // 4. Remap Personal Records (client_personal_records)
  console.log(`\n--- PERSONAL RECORDS (client_personal_records) ---`)
  const prRows = await fetchAll((from, to) =>
    admin.from('client_personal_records').select('*').range(from, to)
  )

  let remappedPrsCount = 0
  const unresolvedPrs = new Set()

  for (const pr of prRows) {
    const official = resolveOfficialExercise({ name: pr.exercise_name }, lookup)
    if (!official) {
      unresolvedPrs.add(pr.exercise_name)
      continue
    }
    if (official.name !== pr.exercise_name) {
      remappedPrsCount += 1
      if (applyChanges) {
        // Check if a target record already exists for this user and official name
        const { data: existingTarget } = await admin
          .from('client_personal_records')
          .select('*')
          .eq('user_id', pr.user_id)
          .eq('exercise_name', official.name)
          .maybeSingle()

        if (existingTarget && existingTarget.id !== pr.id) {
          // Merge PRs
          const maxWeight = Math.max(Number(pr.max_weight_kg || 0), Number(existingTarget.max_weight_kg || 0))
          const latestDate = (pr.latest_logged_date || '') > (existingTarget.latest_logged_date || '')
            ? pr.latest_logged_date
            : existingTarget.latest_logged_date
          const totalSets = (Number(pr.total_sets_logged) || 0) + (Number(existingTarget.total_sets_logged) || 0)

          await admin
            .from('client_personal_records')
            .update({
              max_weight_kg: maxWeight,
              latest_logged_date: latestDate,
              total_sets_logged: totalSets,
            })
            .eq('id', existingTarget.id)

          await admin.from('client_personal_records').delete().eq('id', pr.id)
        } else {
          await admin
            .from('client_personal_records')
            .update({ exercise_name: official.name })
            .eq('id', pr.id)
        }
      }
    }
  }

  console.log(`${applyChanges ? 'Remapped' : 'Would remap'} ${remappedPrsCount} client_personal_records row(s).`)
  if (unresolvedPrs.size > 0) {
    console.warn(`Unmatched exercise names in client_personal_records:`, [...unresolvedPrs])
  }

  if (!applyChanges) {
    console.log('\nDry run only. Re-run with --apply to persist these changes.')
  } else {
    console.log('\nAll past, present, and future exercises successfully persisted to Supabase!')
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}

export { buildLookup, normalizeKey, remapPlanJson, resolveOfficialExercise, EXERCISE_ALIASES }
