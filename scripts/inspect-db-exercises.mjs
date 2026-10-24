import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function main() {
  console.log('Connecting to Supabase at:', supabaseUrl)

  // 1. Check total count
  const { count, error: countErr } = await supabase
    .from('exercise_library_entries')
    .select('*', { count: 'exact', head: true })

  if (countErr) {
    console.error('Error fetching count:', countErr)
    return
  }
  console.log(`Total rows in exercise_library_entries: ${count}`)

  // 2. Fetch all entries
  const { data: dbRows, error: fetchErr } = await supabase
    .from('exercise_library_entries')
    .select('id, name, slug, description, coaching_cues, primary_equipment, muscle_groups, media_image_url, media_video_url, source, source_id, is_active')
    .limit(2000)

  if (fetchErr) {
    console.error('Error fetching rows:', fetchErr)
    return
  }

  console.log(`Fetched ${dbRows.length} rows from database`)

  // Breakdown by source
  const sourceCounts = {}
  for (const row of dbRows) {
    sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1
  }
  console.log('Breakdown by source:', sourceCounts)

  // 3. Load local JSON catalog
  const localCatalog = JSON.parse(fs.readFileSync('scripts/nasm-complete-library.json', 'utf8'))
  console.log(`Local catalog contains ${localCatalog.length} exercises`)

  const dbById = new Map(dbRows.map(r => [r.id, r]))
  const dbByName = new Map(dbRows.map(r => [r.name.toLowerCase().trim(), r]))

  let matchedById = 0
  let matchedByName = 0
  let missingFromDb = []
  let differences = []

  for (const local of localCatalog) {
    const dbRow = dbById.get(local.id)
    if (dbRow) {
      matchedById++
      // Compare fields
      const diff = []
      if ((dbRow.description || '').trim() !== (local.description || '').trim()) {
        diff.push({ field: 'description', db: (dbRow.description || '').slice(0, 40) + '...', local: (local.description || '').slice(0, 40) + '...' })
      }
      
      const dbMuscles = (dbRow.muscle_groups || []).slice().sort().join(',')
      const localMuscles = (local.muscleGroups || []).slice().sort().join(',')
      if (dbMuscles !== localMuscles) {
        diff.push({ field: 'muscle_groups', db: dbRow.muscle_groups, local: local.muscleGroups })
      }

      const dbEquipment = (dbRow.primary_equipment || []).slice().sort().join(',')
      const localEquipment = (local.primaryEquipment || []).slice().sort().join(',')
      if (dbEquipment !== localEquipment) {
        diff.push({ field: 'primary_equipment', db: dbRow.primary_equipment, local: local.primaryEquipment })
      }

      if (diff.length > 0) {
        differences.push({ id: local.id, name: local.name, diff })
      }
    } else {
      missingFromDb.push(local)
      if (dbByName.has(local.name.toLowerCase().trim())) {
        matchedByName++
      }
    }
  }

  console.log(`\n--- Comparison Summary ---`)
  console.log(`Local catalog size: ${localCatalog.length}`)
  console.log(`Matched by ID in DB: ${matchedById} / ${localCatalog.length}`)
  console.log(`Missing from DB by ID: ${missingFromDb.length}`)
  if (missingFromDb.length > 0) {
    console.log(`  (Of which matched by Name: ${matchedByName})`)
    for (const m of missingFromDb.slice(0, 10)) {
      console.log(`  Missing ID: ${m.id} | Name: "${m.name}"`)
    }
  }

  console.log(`Entries with differences: ${differences.length}`)
  for (const d of differences) {
    console.log(`\nExercise: ${d.name} (${d.id})`)
    for (const f of d.diff) {
      console.log(`  - Field: ${f.field}`)
      console.log(`    DB:   `, f.db)
      console.log(`    Local:`, f.local)
    }
  }
}

main().catch(console.error)
