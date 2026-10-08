#!/usr/bin/env node

/**
 * Script: assign-lisa-custom-program.ts
 * 
 * Elicits Master Coach Gordon AI (backed by Gemini 3.8 Flash and NASM OPT™ curriculum)
 * to generate a personalized, medium-length 3-day Stabilization Endurance (Phase 1)
 * program for Lisa Gordon (da_mona_lisa@msn.com).
 * 
 * Tailored for:
 * - 245 lbs, 55 yo female, sedentary full-time job
 * - Early morning riser who loves outdoor walks
 * - Beginner to strength training, with aerobic machine/walking background
 * - Goal: Sustainable weight and fat loss, joint longevity, core/stabilizer strength
 * - Orthopedic Safeguard: Patellofemoral Knee Protection (Runner's knee / trouble with lunges;
 *   strict exclusion of forward lunges and high patellar shear; emphasis on glute activation,
 *   hip-dominant hinges, wall squats, and multiplanar balance)
 * - Equipment: Bodyweight, Band or Tube, Dumbbells, Stability Ball, Foam Roller, Treadmill, Outdoor Walking
 * - Workout Length: Medium (40-45 minutes)
 * - Cardio: Integrated Tanaka Stage 1 Aerobic Base (Outdoor Sunrise Walk / Incline Treadmill Flush)
 */

import { createClient } from '@supabase/supabase-js'
import { generateMasterNasmOptProgram } from '../lib/gemini-nasm-master-coach'
import {
  buildStoredProgramPlan,
  type CoachProgramPayload,
  type CoachProgramWorkoutInput,
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
  console.log(`\n🔍 Looking up client account for ${clientEmail}...`)

  const { data: client, error: clientErr } = await admin
    .from('clients')
    .select('id, full_name, email, role, designated_coach_id')
    .eq('email', clientEmail)
    .single()

  if (clientErr || !client) {
    throw new Error(`Client not found: ${clientErr?.message}`)
  }

  console.log(`✓ Found client: ${client.full_name} (${client.id})`)

  // 1. Update Lisa's fitness profile
  const updatedInjuriesNotes = "[injuries: runners_knee] (Runner's Knee (Patellofemoral Pain Syndrome / PFPS)) — Notes: Knee pain trouble with lunges; diagnosed with runner's knee (patellofemoral pain syndrome). Early morning riser, loves outdoor walking. Avoid high patellar shear and deep forward lunges."
  const trainingDays = 3
  const preferredDays = ['monday', 'wednesday', 'friday']

  console.log(`\n📝 Updating Lisa's fitness profile...`)
  console.log(`- Weight: 245 lbs (111.13 kg)`)
  console.log(`- Schedule: Early Morning Riser | ${trainingDays} Days / Week (${preferredDays.join(', ')})`)
  console.log(`- Experience Level: Beginner (Strength Training) | Loves Outdoor Walks`)
  console.log(`- Activity Level: Sedentary`)
  console.log(`- Target Weight: 175 lbs (79.38 kg) | 24% Body Fat`)

  const { data: profile, error: profileErr } = await admin
    .from('fitness_profiles')
    .update({
      weight_kg: 111.13,
      target_weight_kg: 79.38,
      target_bodyfat_percent: 24,
      activity_level: 'sedentary',
      training_days_per_week: trainingDays,
      preferred_training_days: preferredDays,
      fitness_goal: 'fat-loss',
      injuries_limitations: updatedInjuriesNotes,
      experience_level: 'beginner',
      cardio_equipment_access: ['treadmill', 'outdoor-walking'],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', client.id)
    .select()
    .single()

  if (profileErr) {
    throw new Error(`Failed to update fitness profile: ${profileErr.message}`)
  }

  console.log('✓ Fitness profile successfully updated!')

  // 2. Invoke Master Coach Gordon AI via Gemini 3.8 Flash
  console.log('\n🤖 Eliciting Coach Gordon AI via Gemini 3.8 Flash with Master NASM OPT™ Directives...')

  const coachGuidance = `Custom Morning Starter & Joint Longevity Program for Lisa Gordon personally.
Client Stats & Context:
- Current: 245 lbs, 55-year-old female, 5'7", sedentary job. Early morning riser.
- Experience: Beginner with strength training. Has aerobic exercise history with treadmill and brisk walks; genuinely LOVES outdoor walks.
- Orthopedic & Safety: History of Runner's Knee (patellofemoral pain syndrome / PFPS) with trouble doing lunges. STRICT DIRECTIVE: Do NOT prescribe forward lunges, jumping plyometrics, or movements causing anterior patellar knee shear. Prioritize gluteus medius activation, box squats with vertical shins, stability ball wall squats, glute bridges, band lateral walks, and hamstring curls.
- Methodology: NASM OPT Phase 1 Stabilization Endurance. Emphasize 4/2/1 tempo (4s eccentric descent, 2s isometric stabilization pause, 1s concentric push), 12-15 reps, 2-3 sets, 60s rest. Proprioceptively rich, joint-friendly, and perfect for building foundational stability, muscular endurance, and posture.
- Session Length: Medium-length workout: 40-45 minutes total (Warmup 7m, Core/Balance 8m, Resistance 18m, Outdoor Walk / Cardio Flush 10-12m, Cooldown 3m).
- Cardio Integration: Tanaka Stage 1 Aerobic Base (Zone 1: 105-125 BPM) with prescription for Lisa's favorite: Brisk Morning Outdoor Walk or Incline Treadmill Walk.
- Equipment Access: Bodyweight, Band or Tube, Dumbbells, Foam Roller, Stability Ball, Treadmill.`

  const generatedPlan = await generateMasterNasmOptProgram({
    clientName: 'Lisa Gordon',
    clientAge: 55,
    clientSex: 'female',
    goal: 'fat_loss',
    targetNasmPhase: 1,
    trainingDaysPerWeek: 3,
    experienceLevel: 'beginner',
    equipmentAccess: [
      'Bodyweight',
      'Band or Tube',
      'Dumbbells',
      'Foam Roller',
      'Stability Ball',
    ],
    kineticCompensations: ['knees_cave_in', 'excessive_forward_lean'],
    contraindicationTags: ['runners_knee'],
    cardioBlendStyle: 'integrated_finishers',
    coachGuidanceNotes: coachGuidance,
    injuriesLimitations: updatedInjuriesNotes,
  })

  console.log(`\n✓ Program Generated by Coach Gordon AI: "${generatedPlan.planTitle}"`)
  console.log(`- Phase: Phase ${generatedPlan.nasmOptPhase} (${generatedPlan.phaseName})`)
  console.log(`- Sessions Per Week: ${generatedPlan.sessionsPerWeek}`)
  console.log(`- Workouts Synthesized: ${generatedPlan.workouts.length}`)

  // 3. Format Workouts Payload
  const toArr = (v: unknown): string[] => Array.isArray(v) ? v.map(String) : typeof v === 'string' ? [v] : []

  const workoutsPayload: CoachProgramWorkoutInput[] = generatedPlan.workouts.map(w => {
    const modalities = toArr(w.cardioProtocol?.recommendedModalities).join(', ')
    const cardioNote = w.cardioProtocol
      ? `\n\nIntegrated Cardio: ${w.cardioProtocol.title || 'Tanaka Stage 1 Morning Walk'} (${w.cardioProtocol.durationMins || 12}m in ${w.cardioProtocol.targetZone || 'Zone 1'})\n• Modalities: ${modalities || 'Brisk Outdoor Walk or Incline Treadmill'}\n• Rationale: ${w.cardioProtocol.metabolicRationale || 'Gentle aerobic fat oxidation & joint circulation'}`
      : ''

    const smr = toArr(w.warmupProtocol?.inhibitSmr).join(', ')
    const staticStretches = toArr(w.warmupProtocol?.lengthenStaticStretch).join(', ')
    const dynamicStretches = toArr(w.warmupProtocol?.activateDynamic).join(', ')

    return {
      day: w.day,
      focus: w.focus,
      notes: `${w.dailyPeriodizationMemo || ''}\n\nWarmup: Inhibit (${smr}) -> Lengthen (${staticStretches}) -> Activate (${dynamicStretches})${cardioNote}`,
      exercises: w.exercises.map(ex => {
        const cues = toArr(ex.coachingCues)
        return {
          name: ex.name,
          block: ex.block || 'resistance',
          sets: String(ex.sets),
          reps: String(ex.reps),
          tempo: ex.tempo || '4/2/1',
          rest: ex.rest || '60s',
          coachingCues: cues,
          notes: `${cues.join(' · ')}${ex.targetLoadLbs ? ` | Prescribed Load: ${ex.targetLoadLbs} lbs` : ''}`,
          description: ex.nasmClinicalSource || '',
          primaryEquipment: detectExerciseEquipment(ex.name, ex.nasmClinicalSource),
        }
      }),
      cardioProtocol: w.cardioProtocol
        ? {
            ...w.cardioProtocol,
            recommendedModalities: toArr(w.cardioProtocol.recommendedModalities),
            coachingCues: toArr(w.cardioProtocol.coachingCues),
          }
        : null,
    }
  })

  // 4. Query Exercise and Equipment Libraries for Rich Media Linking
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

  console.log(`- Linked ${libraryExercises?.length || 0} exercises with official video & thumbnail media.`)

  const payload: CoachProgramPayload = {
    clientId: client.id,
    name: generatedPlan.planTitle,
    goal: generatedPlan.primaryGoal,
    nasmOptPhase: Number(generatedPlan.nasmOptPhase),
    phaseName: generatedPlan.phaseName,
    sessionsPerWeek: Number(generatedPlan.sessionsPerWeek),
    estimatedDurationMins: 42,
    startDate: '2026-10-12', // Next Monday for clean weekly alignment
    workouts: workoutsPayload,
  }

  const storedPlan = buildStoredProgramPlan(
    payload,
    (libraryExercises ?? []) as ExerciseLibraryRecord[],
    (equipmentData ?? []) as EquipmentLibraryRecord[]
  )

  // 5. Structure Stored Plan Row with Nutrition and Periodization Memos
  const nutritionTargets = {
    currentWeightLbs: 245,
    targetWeightLbs: 175,
    weeklyLossLbs: 1.0,
    estimatedWeeks: 70,
    targetCalories: 1700,
    proteinGrams: 140,
    carbGrams: 165,
    fatGrams: 55,
  }

  const clinicalRationale = `COACH GORDON MASTER BRIEFING MEMO:
Lisa, welcome to your personalized morning foundation program!
This routine was crafted specifically around your daily rhythm as an early morning riser, your love for brisk outdoor walks, and your goal of healthy, sustained fat loss.
Because you are beginning your strength training journey, we are utilizing the NASM OPT™ Phase 1 (Stabilization Endurance) model. This phase uses a controlled 4/2/1 tempo (4 seconds down, a 2-second hold at the bottom to build deep joint stability, and 1 smooth second back up). You do not need to lift heavy weights to see incredible changes—this controlled tempo activates and strengthens all the stabilizing muscles around your hips, spine, and knees.
Orthopedic Protection: Because you have experienced runner's knee (patellofemoral pain) in the past with lunges, we have strictly excluded high-impact forward lunges. Instead, we focus on glute bridges, stability ball wall squats (which keep your shins vertical and protect your kneecaps), band tube walking for your hip stabilizers, and core balance reach movements.
Every session finishes with 12-15 minutes of your favorite activity: a brisk, peaceful morning outdoor walk or an easy-paced incline treadmill stroll. This provides gentle, therapeutic fat oxidation without beating up your joints.
Focus on consistency, breathe naturally, and enjoy the morning sunrise. I'm right here in your corner!`

  const planRow = {
    user_id: client.id,
    name: generatedPlan.planTitle,
    goal: 'fat_loss',
    nasm_opt_phase: Number(generatedPlan.nasmOptPhase),
    phase_name: generatedPlan.phaseName,
    sessions_per_week: Number(generatedPlan.sessionsPerWeek),
    estimated_duration_mins: 42,
    plan_json: {
      ...storedPlan,
      sessions: storedPlan.workouts,
      generatedByCoachId: client.designated_coach_id,
      generatedBy: 'coach_gordon_ai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clinicalRationale,
      strengthCardioBlendSummary: generatedPlan.strengthCardioBlendSummary,
      periodizationPlan: {
        weeklyMemos: generatedPlan.periodizationWeeklyMemos,
        ragSourcesCited: generatedPlan.ragSourcesCited,
      },
      nutritionTargets,
    },
  }

  // 6. Overwrite Previous Plan or Insert New
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
    console.log(`✓ Plan successfully updated and attached to ${clientEmail}! (Plan ID: ${existingId})`)
  } else {
    console.log('\n💾 Inserting new workout plan...')
    const { error: insertPlanErr } = await admin
      .from('workout_plans')
      .insert(planRow)

    if (insertPlanErr) {
      throw new Error(`Failed to insert workout plan: ${insertPlanErr.message}`)
    }
    console.log(`✓ New plan inserted and attached to ${clientEmail}!`)
  }

  console.log('\n🎉 SUCCESS! Custom program created and assigned to Lisa Gordon.')
  console.log('--- Summary ---')
  console.log(`Title: ${planRow.name}`)
  console.log(`Phase: ${planRow.phase_name} (OPT Phase ${planRow.nasm_opt_phase})`)
  console.log(`Sessions: ${planRow.sessions_per_week} days / week | ~${planRow.estimated_duration_mins} mins per session`)
  console.log(`Nutrition Target: 1,700 kcal/day | 140g Protein | 165g Carbs | 55g Fat`)
  console.log('----------------')
}

main().catch(err => {
  console.error('❌ Error executing script:', err)
  process.exit(1)
})

