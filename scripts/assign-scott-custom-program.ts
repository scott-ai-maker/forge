#!/usr/bin/env node

/**
 * Script: assign-scott-custom-program.ts
 * 
 * Elicits Master Coach Gordon AI (backed by Gemini 3.8 Flash and NASM OPT™ curriculum)
 * to generate a personalized, time-efficient 3-day Strength Endurance (Phase 2)
 * body recomposition program for Scott Gordon (5c077.60rd0n@gmail.com).
 * 
 * Tailored for:
 * - 308 lbs, ~27% bodyfat (~225 lbs Lean Body Mass foundation)
 * - Goal: Weight loss & fat loss to rebuild personal trainer physique (~240 lbs @ 12-14% BF)
 * - Sedentary AI engineer job: Desk posture reversal, hip flexor lengthening, glute activation
 * - Time-efficiency: 35-40 minutes high-density superset sessions
 * - Medical caution: Prescription BP medication (continuous cadence, rhythmic breathing, low-impact cardio)
 * - Equipment: Dumbbells, Bench, Stability Ball, Foam Roller, Medicine Ball, Treadmill
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

  const clientEmail = '5c077.60rd0n@gmail.com'
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

  // 1. Update Scott's fitness profile
  const updatedInjuriesNotes = 'Sedentary AI engineer (desk worker); prescription blood pressure medication (strict rhythmic breathing, avoid prolonged Valsalva); deconditioned joint tolerance; thoracic kyphosis and forward head posture'
  const trainingDays = 3
  const preferredDays = ['monday', 'wednesday', 'friday']

  console.log(`\n📝 Updating Scott's fitness profile...`)
  console.log(`- Weight: 308 lbs (139.71 kg) | Approx 27% Body Fat (~225 lbs Lean Mass)`)
  console.log(`- Target: 240 lbs (108.86 kg) | ~12% Body Fat (Personal Trainer Physique)`)
  console.log(`- Frequency: ${trainingDays} Days / Week (${preferredDays.join(', ')})`)
  console.log(`- Activity Level: Sedentary (Full-time AI Engineer)`)

  const { data: profile, error: profileErr } = await admin
    .from('fitness_profiles')
    .update({
      weight_kg: 139.71,
      target_weight_kg: 108.86,
      target_bodyfat_percent: 12,
      activity_level: 'sedentary',
      training_days_per_week: trainingDays,
      preferred_training_days: preferredDays,
      fitness_goal: 'fat-loss',
      injuries_limitations: updatedInjuriesNotes,
      experience_level: 'intermediate',
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
  
  const coachGuidance = `Personal Trainer Physique Recomposition Protocol for Scott Gordon personally.
Client Stats & Context:
- Current: 308 lbs with approx 27% body fat (~225 lbs of existing lean body mass!). He already has the muscle of a personal trainer underneath; our goal is targeted fat loss and neuromuscular reconditioning.
- Profession: Sedentary full-time AI Engineer sitting at desk all day. Critical need for Upper and Lower Crossed Syndrome reversal: thoracic extension, pectoral and lat inhibition/stretching, hip flexor lengthening, and glute/core activation.
- Time Constraint: Very busy, does not have a ton of time to workout each day. Program MUST be high-density, 35-40 minutes max per session, 3 days per week (Monday, Wednesday, Friday).
- Methodology: NASM OPT Phase 2 Strength Endurance. Use superset contrasts (stable strength lift @ 2/0/2 tempo paired immediately with stabilization lift @ 4/2/1 tempo) to maximize caloric expenditure, elevate EPOC, rebuild stabilizing musculature, and preserve lean mass while keeping workouts under 40 minutes.
- Medical & Health: Flagged for prescription blood pressure medication. Emphasize continuous rhythmic breathing (in through nose, out through mouth, zero prolonged breath holding / Valsalva).
- Integrated Cardio: Low-impact Tanaka Stage 1 Incline Treadmill Walk (10-12 mins, 2.8-3.2 mph, 3-5% incline, Zone 1-2 aerobic fat flush) at the end of each session. Zero high-impact jumping or running to protect knees and back at 308 lbs.
- Equipment Access: Bodyweight, Bench, Dumbbells, Foam Roller, Medicine Ball, Stability Ball, Treadmill.`

  const generatedPlan = await generateMasterNasmOptProgram({
    clientName: 'Scott Gordon',
    clientAge: 54,
    clientSex: 'male',
    goal: 'fat_loss',
    targetNasmPhase: 2,
    trainingDaysPerWeek: 3,
    experienceLevel: 'intermediate',
    equipmentAccess: [
      'Bodyweight',
      'Bench',
      'Dumbbells',
      'Foam Roller',
      'Medicine Ball',
      'Stability Ball',
    ],
    kineticCompensations: ['excessive_forward_lean', 'arms_fall_forward', 'asymmetric_weight_shift'],
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
      ? `\n\nIntegrated Cardio: ${w.cardioProtocol.title || 'Tanaka Stage 1 Incline Flush'} (${w.cardioProtocol.durationMins || 10}m in ${w.cardioProtocol.targetZone || 'Zone 1-2'})\n• Modalities: ${modalities || 'Incline Treadmill Walk'}\n• Rationale: ${w.cardioProtocol.metabolicRationale || 'Aerobic fat oxidation & active recovery'}`
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
          tempo: ex.tempo || '2/0/2',
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
    estimatedDurationMins: 40,
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
    currentWeightLbs: 308,
    targetWeightLbs: 240,
    weeklyLossLbs: 1.5,
    estimatedWeeks: 45,
    targetCalories: 2450,
    proteinGrams: 220,
    carbGrams: 215,
    fatGrams: 75,
  }

  const clinicalRationale = `COACH GORDON MASTER BRIEFING MEMO:
Scott, I designed this custom Phase 2 Strength Endurance protocol specifically for you and where you're at right now.
At 308 lbs and ~27% body fat, you have approximately 225 lbs of solid lean body mass on your frame. You already possess the muscular foundation of a personal trainer—our singular mission is to strip off the adipose tissue, reactivate your stabilizers, and let that athletic build show.
Because you're at a desk all day doing intense AI engineering, we must undo the damage of sitting without consuming your day. We've dialed this into 3 high-density, 40-minute sessions per week.
Every workout uses NASM Phase 2 contrast supersets: pairing a stable dumbbell strength exercise directly with a stabilization/core movement. This doubles your caloric burn, spikes your post-exercise oxygen consumption (EPOC), and protects your joints.
For cardio, we finish each session with 10-12 minutes of low-impact Tanaka Stage 1 Incline Treadmill walking (Zone 1-2). This flushes lactic acid, maximizes pure fatty acid oxidation, and protects your knees and blood pressure.
Keep your breathing continuous: in through the nose, out through the mouth. Own your tempo. Let's get after it!`

  const planRow = {
    user_id: client.id,
    name: generatedPlan.planTitle,
    goal: 'fat_loss',
    nasm_opt_phase: Number(generatedPlan.nasmOptPhase),
    phase_name: generatedPlan.phaseName,
    sessions_per_week: Number(generatedPlan.sessionsPerWeek),
    estimated_duration_mins: 40,
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

  console.log('\n🎉 SUCCESS! Custom program created and assigned to Scott Gordon.')
  console.log('--- Summary ---')
  console.log(`Title: ${planRow.name}`)
  console.log(`Phase: ${planRow.phase_name} (OPT Phase ${planRow.nasm_opt_phase})`)
  console.log(`Sessions: ${planRow.sessions_per_week} days / week | ~${planRow.estimated_duration_mins} mins per session`)
  console.log(`Nutrition Target: 2,450 kcal/day | 220g Protein | 215g Carbs | 75g Fat`)
  console.log('----------------')
}

main().catch(err => {
  console.error('❌ Error executing script:', err)
  process.exit(1)
})

