import { createClient } from '@supabase/supabase-js'
import { enrichExerciseMedia } from '../lib/nasm-exercise-video-catalog'

async function updateScottDay3() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials in environment')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const PLAN_ID = 'a936e62d-c5e4-4f4d-8c91-41507cd455e3'
  const { data: plan, error } = await admin
    .from('workout_plans')
    .select('*')
    .eq('id', PLAN_ID)
    .single()

  if (error || !plan) {
    console.error('Plan not found:', error)
    return
  }

  console.log(`Found plan: "${plan.name}"`)
  const planJson = plan.plan_json || {}
  const workouts = planJson.workouts || []

  if (workouts.length < 3) {
    console.error('Day 3 workout not found in plan')
    return
  }

  const day3 = workouts[2]
  console.log('Current Day 3 exercises count:', day3.exercises?.length)

  // Calibrate Day 3 exercises according to Option A:
  // 1. Half Kneeling Tubing Rotation (Core)
  // 2. Single-Leg Dumbbell Overhead Press (Resistance) -> 12-15 switch legs halfway
  // 3. Dumbbell Bent Over Row (Resistance) -> 12-15 bilateral stable stance
  // 4. Russian Twist (Resistance) -> 15 per side (replaces duplicate Half Kneeling Tubing Rotation)
  // 5. Static Kneeling Hip Flexor Stretch (Cooldown)

  const updatedExercises = [
    // 1. Core
    day3.exercises[0],

    // 2. Single-Leg Dumbbell Overhead Press
    enrichExerciseMedia({
      ...day3.exercises[1],
      name: 'Single-Leg Dumbbell Overhead Press',
      reps: '12–15 (switch legs halfway)',
      coachingCues: [
        'Do not arch lumbar spine',
        'Press overhead while balancing on one foot',
      ],
      nasmClinicalSource: 'CPT7_Fat_Loss6.pdf',
    }),

    // 3. Stable Bilateral Dumbbell Bent Over Row
    enrichExerciseMedia({
      ...day3.exercises[2],
      name: 'Dumbbell Bent Over Row',
      reps: '12–15',
      coachingCues: [
        'Keep lats engaged throughout arch',
        'Maintain flat spine and neutral neck',
      ],
      nasmClinicalSource: 'CPT7_Ch21',
    }),

    // 4. Russian Twist (replaces duplicate Half Kneeling Tubing Rotation)
    enrichExerciseMedia({
      block: 'resistance',
      name: 'Russian Twist',
      sets: '2',
      reps: '15 per side',
      tempo: '4/2/1',
      rest: '60s',
      intensityPercentage1RM: 0.55,
      coachingCues: [
        'Rotate from trail hip through thoracic spine',
        '4s eccentric return to center',
      ],
      nasmClinicalSource: 'CPT7_Fat_Loss7.pdf (Home Dumbbell Adaptation)',
    }),

    // 5. Cooldown
    day3.exercises[4] || day3.exercises[day3.exercises.length - 1],
  ]

  day3.exercises = updatedExercises
  workouts[2] = day3
  planJson.workouts = workouts
  planJson.sessions = workouts

  const { error: updateError } = await admin
    .from('workout_plans')
    .update({ plan_json: planJson })
    .eq('id', PLAN_ID)

  if (updateError) {
    console.error('Failed to update plan in Supabase:', updateError)
    process.exit(1)
  }

  console.log('✅ Successfully updated Scott Day 3 in Supabase!')
  console.log('\nNew Day 3 Exercises:')
  updatedExercises.forEach((ex, i) => {
    console.log(` ${i + 1}. [${ex.block}] ${ex.name} | ${ex.sets} sets | ${ex.reps} | video: ${ex.videoUrl}`)
  })
}

updateScottDay3().catch(err => {
  console.error(err)
  process.exit(1)
})
