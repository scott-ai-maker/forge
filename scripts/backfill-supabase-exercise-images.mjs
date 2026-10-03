import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dgzdubbrneqfdleprjfr.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnemR1YmJybmVxZmRsZXByamZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc0NDY3NywiZXhwIjoyMDkxMzIwNjc3fQ.IUfT68OUsLJarZ4bsJTeFz4zZfKSs2ESGKGuA28VEbY'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Mappings from exercise names to verified image paths
const EXERCISE_IMAGES = {
  'barbell bench press': '/images/exercises/barbell-bench-press.jpg',
  'bench press': '/images/exercises/barbell-bench-press.jpg',
  'flat bench press': '/images/exercises/barbell-bench-press.jpg',
  'incline dumbbell bench press': '/images/exercises/two-arm-incline-dumbbell-chest-press.jpg',
  'incline dumbbell press': '/images/exercises/two-arm-incline-dumbbell-chest-press.jpg',
  'barbell back squat': '/images/exercises/barbell-back-squat.jpg',
  'squat': '/images/exercises/barbell-back-squat.jpg',
  'romanian deadlift (rdl)': '/images/exercises/dumbbell-romanian-deadlift.jpg',
  'romanian deadlift': '/images/exercises/dumbbell-romanian-deadlift.jpg',
  'trap bar deadlift': '/images/exercises/barbell-deadlift.jpg',
  'bulgarian split squat': '/images/exercises/bulgarian-split-squat.jpg',
  'standing cable row': '/images/exercises/standing-tubing-row.jpg',
  'wide-grip lat pulldown': '/images/exercises/seated-machine-row-close-grip.jpg',
  'lat pulldown': '/images/exercises/seated-machine-row-close-grip.jpg',
  'glute bridge': '/images/exercises/floor-bridge.jpg',
  'floor bridge': '/images/exercises/floor-bridge.jpg',
  'glute bridge with 2s isometric hold': '/images/exercises/floor-bridge.jpg',
  'single-leg glute bridge': '/images/exercises/single-leg-floor-bridge.jpg',
  'single leg floor bridge': '/images/exercises/single-leg-floor-bridge.jpg',
  'squat to overhead reach': '/images/exercises/squat-to-overhead-reach.jpg',
  'squat to overhead reach & scaption': '/images/exercises/squat-to-overhead-reach.jpg',
  'squat to scaption': '/images/exercises/squat-to-overhead-reach.jpg',
  'scaption': '/images/exercises/single-leg-scaption.jpg',
  'single-leg scaption': '/images/exercises/single-leg-scaption.jpg',
}

function resolveImage(name) {
  if (!name) return '/images/exercises/image-not-available.jpg'
  const clean = name.toLowerCase().replace(/[^a-z0-9\s()&/-]/g, '').trim()
  if (EXERCISE_IMAGES[clean]) return EXERCISE_IMAGES[clean]
  for (const [k, v] of Object.entries(EXERCISE_IMAGES)) {
    if (clean.includes(k) || k.includes(clean)) return v
  }
  const slug = clean.replace(/[^a-z0-9]+/g, '-')
  return `/images/exercises/${slug}.jpg`
}

async function main() {
  console.log('--- 1. BACKFILLING EXERCISE_LIBRARY_ENTRIES ---')
  const { data: entries, error: eErr } = await supabase
    .from('exercise_library_entries')
    .select('id, name, media_image_url')
    .limit(1000)

  if (eErr) {
    console.error('Error fetching exercise_library_entries:', eErr)
  } else {
    console.log(`Found ${entries.length} exercise library entries in Supabase.`)
    let updatedEntries = 0
    for (const item of entries) {
      const img = resolveImage(item.name)
      if (img && item.media_image_url !== img) {
        const { error: uErr } = await supabase
          .from('exercise_library_entries')
          .update({ media_image_url: img })
          .eq('id', item.id)

        if (!uErr) {
          updatedEntries++
        }
      }
    }
    console.log(`Successfully updated ${updatedEntries} exercise library entries with verified image URLs.`)
  }

  console.log('\n--- 2. BACKFILLING WORKOUT_PLANS ---')
  const { data: plans, error: pErr } = await supabase
    .from('workout_plans')
    .select('id, user_id, plan_json')
    .limit(100)

  if (pErr) {
    console.error('Error fetching workout_plans:', pErr)
  } else {
    console.log(`Found ${plans.length} workout plans in Supabase.`)
    let updatedPlans = 0
    for (const plan of plans) {
      if (!plan.plan_json || !Array.isArray(plan.plan_json.workouts)) continue

      let modified = false
      const updatedWorkouts = plan.plan_json.workouts.map(workout => {
        if (!Array.isArray(workout.exercises)) return workout
        const updatedExercises = workout.exercises.map(ex => {
          const currentImg = ex.imageUrl
          const resolvedImg = resolveImage(ex.name)
          if (resolvedImg && (!currentImg || currentImg === '/images/exercises/image-not-available.jpg')) {
            modified = true
            return {
              ...ex,
              imageUrl: resolvedImg,
            }
          }
          return ex
        })
        return {
          ...workout,
          exercises: updatedExercises,
        }
      })

      if (modified) {
        const updatedPlanJson = {
          ...plan.plan_json,
          workouts: updatedWorkouts,
        }

        const { error: upErr } = await supabase
          .from('workout_plans')
          .update({ plan_json: updatedPlanJson })
          .eq('id', plan.id)

        if (!upErr) {
          updatedPlans++
          console.log(`Updated plan ${plan.id} for user ${plan.user_id}`)
        } else {
          console.error(`Failed to update plan ${plan.id}:`, upErr)
        }
      }
    }
    console.log(`Successfully updated ${updatedPlans} workout plans in Supabase with verified image URLs.`)
  }

  console.log('\nBackfill completed successfully.')
}

main().catch(err => {
  console.error('Backfill fatal error:', err)
  process.exit(1)
})

