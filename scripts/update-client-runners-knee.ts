import { createClient } from '@supabase/supabase-js'
import { generateRagNasmProgram } from '../lib/rag-nasm-program-generator'
import { serializeInjuriesWithNotes } from '../lib/sports-injuries'
import {
  buildStoredProgramPlan,
  type CoachProgramPayload,
  type ExerciseLibraryRecord,
  type EquipmentLibraryRecord,
} from '../lib/coach-programs'
import { detectExerciseEquipment } from '../lib/nasm-equipment-detector'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials in environment')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const clientEmail = 'da_mona_lisa@msn.com'
  console.log(`\n🔍 Looking up client ${clientEmail}...`)

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, full_name, email, role, designated_coach_id')
    .eq('email', clientEmail)
    .single()

  if (clientErr || !client) {
    throw new Error(`Client not found: ${clientErr?.message}`)
  }

  console.log(`Found client: ${client.full_name} (${client.id})`)

  // 1. Prepare updated profile data
  const updatedInjuriesNotes = serializeInjuriesWithNotes(
    ['runners_knee'],
    "Knee pain trouble with lunges; diagnosed with runner's knee (patellofemoral pain syndrome)"
  )
  const trainingDays = 2
  const preferredDays = ['tuesday', 'thursday']

  console.log(`\n📝 Updating fitness profile...`)
  console.log(`- Injuries/Limitations: ${updatedInjuriesNotes}`)
  console.log(`- Training Days Per Week: ${trainingDays} (reduced from 4)`)
  console.log(`- Preferred Days: ${preferredDays.join(', ')}`)

  const { data: profile, error: profileErr } = await admin
    .from('fitness_profiles')
    .update({
      injuries_limitations: updatedInjuriesNotes,
      training_days_per_week: trainingDays,
      preferred_training_days: preferredDays,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', client.id)
    .select()
    .single()

  if (profileErr) {
    throw new Error(`Failed to update fitness profile: ${profileErr.message}`)
  }

  console.log('✓ Fitness profile successfully updated!')

  // 2. Generate new 2-day NASM RAG Program with Runner's Knee Guardrails
  console.log('\n⚙️ Generating RAG NASM 2-Day Program with Orthopedic Runner\'s Knee Guardrails...')
  const generatedPlan = generateRagNasmProgram({
    clientName: client.full_name || 'Lisa Gordon',
    clientAge: profile.age || 55,
    clientSex: 'female',
    goal: 'fat_loss',
    targetNasmPhase: 1,
    trainingDaysPerWeek: 2,
    injuriesLimitations: updatedInjuriesNotes,
    equipmentAccess: profile.equipment_access ?? [
      'Bodyweight',
      'Band or Tube',
      'Dumbbells',
      'Foam Roller',
      'Stability Ball',
      'Barbell',
    ],
    cardioEquipmentAccess: profile.cardio_equipment_access ?? ['treadmill'],
    experienceLevel: 'beginner',
  })

  console.log(`✓ Generated Plan: "${generatedPlan.planTitle}"`)
  console.log(`- Sessions Per Week: ${generatedPlan.sessionsPerWeek}`)
  console.log(`- Workouts Count: ${generatedPlan.workouts.length}`)

  // 3. Prepare workouts payload
  const workoutsPayload = generatedPlan.workouts.map(w => {
    const cardioNote = w.cardioProtocol
      ? `\n\nIntegrated Cardio: ${w.cardioProtocol.title} (${w.cardioProtocol.durationMins}m in ${w.cardioProtocol.targetZone})\n• Modalities: ${w.cardioProtocol.recommendedModalities.join(', ')}\n• Rationale: ${w.cardioProtocol.metabolicRationale}`
      : ''

    return {
      day: w.day,
      focus: w.focus,
      notes: `${w.dailyPeriodizationMemo}\n\nWarmup: Inhibit (${w.warmupProtocol.inhibitSmr.join(', ')}) -> Lengthen (${w.warmupProtocol.lengthenStaticStretch.join(', ')}) -> Activate (${w.warmupProtocol.activateDynamic.join(', ')})${cardioNote}`,
      exercises: w.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        tempo: ex.tempo,
        rest: ex.rest,
        notes: `${ex.coachingCues.join(' · ')}${ex.targetLoadLbs ? ` | Prescribed Load: ${ex.targetLoadLbs} lbs` : ''}`,
        description: ex.nasmClinicalSource,
        primaryEquipment: detectExerciseEquipment(ex.name, ex.nasmClinicalSource),
      })),
      cardioProtocol: w.cardioProtocol ?? null,
    }
  })

  // 4. Query library exercises & equipment for rich media linking
  const exerciseNames = workoutsPayload.flatMap(w => w.exercises.map(e => e.name))
  const [{ data: libraryExercises }, { data: equipmentData }] = await Promise.all([
    admin
      .from('exercise_library_entries')
      .select('id, name, slug, description, coaching_cues, primary_equipment, media_image_url, media_video_url, open_externally_only')
      .eq('is_active', true)
      .in('name', exerciseNames),
    admin
      .from('equipment_library_entries')
      .select('id, name, slug, description, media_image_url')
      .eq('is_active', true),
  ])

  const payload: CoachProgramPayload = {
    clientId: client.id,
    name: generatedPlan.planTitle,
    goal: generatedPlan.primaryGoal,
    nasmOptPhase: Number(generatedPlan.nasmOptPhase),
    phaseName: generatedPlan.phaseName,
    sessionsPerWeek: Number(generatedPlan.sessionsPerWeek),
    estimatedDurationMins: 50,
    workouts: workoutsPayload,
  }

  const storedPlan = buildStoredProgramPlan(
    payload,
    (libraryExercises ?? []) as ExerciseLibraryRecord[],
    (equipmentData ?? []) as EquipmentLibraryRecord[]
  )

  // 5. Update active plan in Supabase
  const planRow = {
    user_id: client.id,
    name: generatedPlan.planTitle,
    goal: generatedPlan.primaryGoal,
    nasm_opt_phase: Number(generatedPlan.nasmOptPhase),
    phase_name: generatedPlan.phaseName,
    sessions_per_week: Number(generatedPlan.sessionsPerWeek),
    estimated_duration_mins: 50,
    plan_json: {
      ...storedPlan,
      sessions: storedPlan.workouts,
      generatedByCoachId: client.designated_coach_id,
      generatedBy: 'coach',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }

  // Check for existing plan to update or insert new
  const { data: existingPlans } = await admin
    .from('workout_plans')
    .select('id')
    .eq('user_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingPlans && existingPlans.length > 0) {
    const existingId = existingPlans[0].id
    console.log(`\n💾 Overwriting previous workout plan (ID: ${existingId})...`)
    const { error: updatePlanErr } = await admin
      .from('workout_plans')
      .update(planRow)
      .eq('id', existingId)

    if (updatePlanErr) {
      throw new Error(`Failed to update workout plan: ${updatePlanErr.message}`)
    }
    console.log(`✓ Existing plan (ID: ${existingId}) updated successfully!`)
  } else {
    console.log('\n💾 Inserting new workout plan...')
    const { error: insertPlanErr } = await admin
      .from('workout_plans')
      .insert(planRow)

    if (insertPlanErr) {
      throw new Error(`Failed to insert workout plan: ${insertPlanErr.message}`)
    }
    console.log('✓ New plan inserted successfully!')
  }

  console.log('\n🎉 Client update and program recreation completed successfully!')
}

main().catch(err => {
  console.error('❌ Error executing script:', err)
  process.exit(1)
})

