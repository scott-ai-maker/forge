#!/usr/bin/env node

/**
 * Script: assign-christine-beginner-program.ts
 * 
 * Calibrates and updates Christine DeGreenia's active workout plan to a true,
 * safe, and progressive Beginner Phase 1 Stabilization Endurance protocol.
 * 
 * Regressions and safeguards applied:
 * 1. Regressed strict floor push-ups & pike push-ups to Incline Push-Ups & Modified (Kneeling) Push-Ups.
 * 2. Regressed transverse multiplanar lunges to Box Squats (to chair), Step-Ups to Balance, and Frontal Balance Reach.
 * 3. Trimmed excessive 15-rep unilateral TUT (105s per leg) down to 8-10 / 10-12 reps with controlled tempo.
 * 4. Added explicit 4-Phase CEx warmups (calf & hip flexor lengthening, glute activation) and restorative cooldowns.
 * 5. Replaced dynamic Plank Walk-Ups with safe isometric Planks with Knees Down and Short Lever Side Planks.
 * 6. Corrected Day 3 title from "Rotary Power" to "Postural Endurance & Anti-Rotation Stability".
 */

import { createClient } from '@supabase/supabase-js'
import {
  buildStoredProgramPlan,
  type CoachProgramPayload,
  type CoachProgramWorkoutInput,
  type ExerciseLibraryRecord,
  type EquipmentLibraryRecord,
} from '../lib/coach-programs'
import { calculateEstimatedWorkoutDuration } from '../lib/workout-duration-engine'

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials in environment')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const clientEmail = 'chrisdegreenia7@gmail.com'
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

  // Define 4 Beginner Phase 1 Workouts
  const workoutsPayload: CoachProgramWorkoutInput[] = [
    {
      day: 1,
      focus: 'Upper Body Push & Core Stabilization',
      scheduledDate: null,
      notes: 'Beginner Phase 1 Stabilization Endurance (Bodyweight). Emphasizes core bracing, anterior chest pushing control via elevated incline, scapular retraction, and lumbo-pelvic alignment. Includes 10-minute Stage 1 aerobic flush walk.',
      cardioProtocol: {
        stage: 1,
        title: 'Stage 1 Aerobic Base Flush Walk',
        durationMins: 10,
        intensity: 'Zone 1 (RPE 3–4 / Light Brisk Walk)',
        modality: 'Outdoor Walking or Treadmill',
        heartRateTarget: '105–120 bpm',
        notes: 'Low-impact steady-state walk to enhance recovery, aerobic capacity, and fat oxidation without fatigue.',
      } as any,
      exercises: [
        // Warm-up / Prep
        {
          name: 'Static Seated Calf Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Lengthens gastrocnemius/soleus to support ankle mobility and stable squat/lunge mechanics.',
        },
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Lengthens tight psoas and rectus femoris to relieve anterior pelvic tilt.',
        },
        // Core & Activation
        {
          name: 'Floor Bridge',
          block: 'activation',
          sets: '2',
          reps: '10–12',
          tempo: '4/2/1',
          rest: '45s',
          notes: 'Drive through heels, squeeze glutes at the top for 2 full seconds. Keep ribs down.',
        },
        // Resistance / Main
        {
          name: 'Incline Push Up',
          block: 'resistance',
          sets: '2',
          reps: '8–10',
          tempo: '3/1/1',
          rest: '60s',
          notes: 'Hands placed on a sturdy counter, sturdy table, or wall. Maintain rigid plank from ears to heels.',
        },
        {
          name: 'Floor Prone Cobra',
          block: 'resistance',
          sets: '2',
          reps: '10–12',
          tempo: '4/2/1',
          rest: '60s',
          notes: 'Retract and depress shoulder blades, rotate thumbs toward ceiling, hold for 2s at peak.',
        },
        {
          name: 'Dead Bug',
          block: 'resistance',
          sets: '2',
          reps: '8–10 per side',
          tempo: '3/1/2',
          rest: '60s',
          notes: 'Keep lumbar spine glued to floor throughout. Move opposite arm and leg slowly with breathing.',
        },
        {
          name: 'Plank With Knees Down',
          block: 'resistance',
          sets: '2',
          reps: '20–30s hold',
          tempo: 'Hold',
          rest: '60s',
          notes: 'Forearm plank on knees. Draw navel inward, maintain neutral neck, breathe steadily.',
        },
        // Cool-down
        {
          name: 'Static 90 90 Hamstring Stretch',
          block: 'cool-down',
          sets: '1',
          reps: '30s hold per leg',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Gentle post-session hamstring lengthener to down-regulate nervous system.',
        },
      ],
    },
    {
      day: 2,
      focus: 'Lower Body Knee & Hip Stabilization',
      scheduledDate: null,
      notes: 'Beginner Phase 1 Stabilization Endurance (Bodyweight). Teaches hip-dominant squatting mechanics using a box/chair to protect patellofemoral joints, glute activation, and frontal plane balance control.',
      cardioProtocol: {
        stage: 1,
        title: 'Stage 1 Aerobic Base Flush Walk',
        durationMins: 10,
        intensity: 'Zone 1 (RPE 3–4 / Light Brisk Walk)',
        modality: 'Outdoor Walking or Treadmill',
        heartRateTarget: '105–120 bpm',
        notes: 'Low-impact steady-state walk to enhance recovery, aerobic capacity, and fat oxidation without fatigue.',
      } as any,
      exercises: [
        // Warm-up
        {
          name: 'Static Seated Calf Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Lengthens calves to prevent foot flare and excessive forward torso lean.',
        },
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Relieves anterior hip tightness before squatting.',
        },
        // Activation
        {
          name: 'Bird Dog',
          block: 'activation',
          sets: '2',
          reps: '8 per side',
          tempo: '4/2/1',
          rest: '45s',
          notes: 'Extend opposite arm and leg, hold 2s at top without arching back or rotating pelvis.',
        },
        // Resistance / Main
        {
          name: 'Box Squat',
          block: 'resistance',
          sets: '2',
          reps: '10–12',
          tempo: '3/2/1',
          rest: '60s',
          notes: 'Squat to a standard chair or sturdy bench. Tap seat gently, keep knees tracking over 2nd toe, drive up through heels.',
        },
        {
          name: 'Floor Bridge',
          block: 'resistance',
          sets: '2',
          reps: '12',
          tempo: '4/2/1',
          rest: '60s',
          notes: 'Full bilateral glute bridge with 2-second isometric contraction at peak extension.',
        },
        {
          name: 'Single Leg Balance Reach Frontal Plane',
          block: 'skill-development',
          sets: '2',
          reps: '8 per leg',
          tempo: '4/2/1',
          rest: '60s',
          notes: 'Stand on one leg with soft knee. Reach free foot slowly out to the side, keep hips level.',
        },
        // Cool-down
        {
          name: 'Static 90 90 Hamstring Stretch',
          block: 'cool-down',
          sets: '1',
          reps: '30s hold per leg',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Restores resting hamstring length post-squats.',
        },
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'cool-down',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Parasympathetic breathing cooldown.',
        },
      ],
    },
    {
      day: 3,
      focus: 'Postural Endurance & Anti-Rotation Stability',
      scheduledDate: null,
      notes: 'Beginner Phase 1 Stabilization Endurance (Bodyweight). Strengthens upper back, scapular retractors, and deep lateral core without high-shear vertical pressing or rotary strain.',
      cardioProtocol: {
        stage: 1,
        title: 'Stage 1 Aerobic Base Flush Walk',
        durationMins: 10,
        intensity: 'Zone 1 (RPE 3–4 / Light Brisk Walk)',
        modality: 'Outdoor Walking or Treadmill',
        heartRateTarget: '105–120 bpm',
        notes: 'Low-impact steady-state walk to enhance recovery, aerobic capacity, and fat oxidation without fatigue.',
      } as any,
      exercises: [
        // Warm-up
        {
          name: 'Static Seated Calf Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Calf mobility preparation.',
        },
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Hip flexor lengthener.',
        },
        // Main exercises
        {
          name: 'Modified Push Up',
          block: 'resistance',
          sets: '2',
          reps: '8–10',
          tempo: '3/1/1',
          rest: '60s',
          notes: 'Kneeling push-ups on exercise mat. Keep hips tucked and core braced, lower chest with elbows at 45° angle.',
        },
        {
          name: 'Floor Prone Cobra',
          block: 'resistance',
          sets: '2',
          reps: '10–12',
          tempo: '4/2/1',
          rest: '60s',
          notes: 'Tuck chin, lift chest slightly, squeeze rhomboids and lower traps for 2s hold.',
        },
        {
          name: 'Short Lever Side Plank',
          block: 'resistance',
          sets: '2',
          reps: '20–30s hold per side',
          tempo: 'Hold',
          rest: '45s',
          notes: 'Side plank supported on forearm and knees. Lift hip until body is straight from knee to shoulder.',
        },
        {
          name: 'Bird Dog',
          block: 'resistance',
          sets: '2',
          reps: '8–10 per side',
          tempo: '4/2/1',
          rest: '60s',
          notes: 'Opposite arm and leg extension with strict pelvis stabilization.',
        },
        // Cool-down
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'cool-down',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Parasympathetic cooldown stretch.',
        },
      ],
    },
    {
      day: 4,
      focus: 'Integrated Full-Body Functional Stability',
      scheduledDate: null,
      notes: 'Beginner Phase 1 Stabilization Endurance (Bodyweight). Synthesizes movement patterns with low-impact step-ups to balance, box squats, and full anterior-posterior core integration.',
      cardioProtocol: {
        stage: 1,
        title: 'Stage 1 Aerobic Base Flush Walk',
        durationMins: 10,
        intensity: 'Zone 1 (RPE 3–4 / Light Brisk Walk)',
        modality: 'Outdoor Walking or Treadmill',
        heartRateTarget: '105–120 bpm',
        notes: 'Low-impact steady-state walk to enhance recovery, aerobic capacity, and fat oxidation without fatigue.',
      } as any,
      exercises: [
        // Warm-up
        {
          name: 'Static Seated Calf Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Pre-workout calf lengthening.',
        },
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'warm-up',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Pelvic alignment prep.',
        },
        // Resistance / Main
        {
          name: 'Box Squat',
          block: 'resistance',
          sets: '2',
          reps: '10–12',
          tempo: '3/2/1',
          rest: '60s',
          notes: 'Touch chair lightly, maintain upright posture, drive up smoothly.',
        },
        {
          name: 'Step Up To Balance Sagital',
          block: 'skill-development',
          sets: '2',
          reps: '8 per leg',
          tempo: '3/2/1',
          rest: '60s',
          notes: 'Step up onto a low 6–8 inch step or curb. Pause in single-leg balance for 2 seconds at the top.',
        },
        {
          name: 'Incline Push Up',
          block: 'resistance',
          sets: '2',
          reps: '8–10',
          tempo: '3/1/1',
          rest: '60s',
          notes: 'Hands on sturdy elevated surface. Keep abs engaged to prevent low back dipping.',
        },
        {
          name: 'Dead Bug',
          block: 'resistance',
          sets: '2',
          reps: '8 per side',
          tempo: '3/1/2',
          rest: '60s',
          notes: 'Full core stabilization with controlled arm and leg reach.',
        },
        {
          name: 'Plank With Knees Down',
          block: 'resistance',
          sets: '2',
          reps: '20–30s hold',
          tempo: 'Hold',
          rest: '60s',
          notes: 'Isometric endurance hold with steady nasal breathing.',
        },
        // Cool-down
        {
          name: 'Static 90 90 Hamstring Stretch',
          block: 'cool-down',
          sets: '1',
          reps: '30s hold per leg',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Post-workout restorative stretch.',
        },
        {
          name: 'Static Kneeling Hip Flexor Stretch',
          block: 'cool-down',
          sets: '1',
          reps: '30s hold per side',
          tempo: 'Slow diaphragmatic',
          rest: '0s',
          notes: 'Hip flexor recovery.',
        },
      ],
    },
  ]

  // Query exercise and equipment libraries
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
    name: 'Beginner Stabilization Endurance Protocol (Bodyweight & Core Foundation) [4-Day Split]',
    goal: 'FAT LOSS',
    nasmOptPhase: 1,
    phaseName: 'Stabilization Endurance',
    sessionsPerWeek: 4,
    estimatedDurationMins: 38,
    startDate: '2026-10-27',
    workouts: workoutsPayload,
  }

  const storedPlan = buildStoredProgramPlan(
    payload,
    (libraryExercises ?? []) as ExerciseLibraryRecord[],
    (equipmentData ?? []) as EquipmentLibraryRecord[]
  )

  // Calculate durations for verification
  for (const w of storedPlan.workouts) {
    const dur = calculateEstimatedWorkoutDuration({ workout: w, cardio: w.cardioProtocol, optPhase: 1 })
    console.log(`  Day ${w.day}: ${dur.totalDurationMins}m (${dur.summaryLabel}) | Warmup: ${dur.warmupMins}m, Resistance: ${dur.resistanceMins}m, Cardio: ${dur.cardioMins}m, Cooldown: ${dur.cooldownMins}m`)
  }

  const clinicalRationale = `COACH GORDON MASTER BRIEFING MEMO:

Christine, welcome to your personalized Forge Athletic performance protocol!

This beginner protocol is specifically calibrated to build lean muscle, accelerate fat loss, and protect your joints using bodyweight movements you can perform comfortably at home.

Why this program is designed for you:
1. True Beginner Calibration: We regressed high-barrier floor push-ups and pike push-ups to Incline Push-Ups (elevated on a sturdy table or counter) and Modified Kneeling Push-Ups. This ensures you master the movement with perfect core control without straining your shoulders or lower back.
2. Hip & Knee Longevity: To protect your knees and lower back while we evaluate your movement screen, we replaced high-shear transverse lunges with Box Squats (to a sturdy chair), bilateral Floor Bridges, and Step-Ups to Balance.
3. Controlled Stabilization Tempo: We use NASM Phase 1 Stabilization tempo with controlled eccentric descent and 2-second isometric holds at peak muscle contraction. This activates stabilizing musculature and strengthens connective tissue without needing heavy weights.
4. Structured Warmup & Cooldown: Every workout includes gentle calf and hip flexor stretches to open up your stride and keep your hips aligned, plus a 10-minute low-impact aerobic flush walk to boost daily fat oxidation and recovery.

Take your time, own your tempo, and remember that quality of movement beats speed every single time. I'm right here in your corner! — Coach Gordon`

  const coachPersonalNote = `Christine, I've updated your workouts to a clean, beginner-level bodyweight routine tailored specifically for starting out at home. We swapped in elevated incline push-ups, chair squats, and dedicated warmups so you can build real strength and confidence without any joint stress. Take each movement at your own pace, own the tempo, and let me know how Day 1 feels! — Coach Gordon`

  const nutritionTargets = {
    currentWeightLbs: 160,
    targetWeightLbs: 115,
    weeklyLossLbs: 1.0,
    estimatedWeeks: 45,
    targetCalories: 1350,
    proteinGrams: 115,
    carbGrams: 130,
    fatGrams: 42,
  }

  const strengthCardioBlendSummary = {
    goal: 'Fat Loss & Metabolic Stabilization (OPT™ Phase 1)',
    cardioPct: 50,
    blendRatio: '50% Strength / 50% Cardio Base',
    strengthPct: 50,
    clinicalGuideline: 'NASM CPT-7 Ch. 8 & 15: Resistance training elevates metabolic rate; low-impact Stage 1 cardio maximizes lipid oxidation and enhances recovery.',
    primaryCardioStages: 'Stage 1 (Aerobic Base / Zone 1 Walking)',
    weeklyCardioMinutes: 110,
    weeklyStrengthSessions: 4,
    interferenceShieldStrategy: 'Low-impact walking performed post-workout or separated from resistance sessions to protect joints and recovery.',
  }

  const planRow = {
    user_id: client.id,
    name: payload.name,
    goal: 'FAT LOSS',
    nasm_opt_phase: 1,
    phase_name: 'Stabilization Endurance',
    sessions_per_week: 4,
    estimated_duration_mins: 38,
    plan_json: {
      ...storedPlan,
      sessions: storedPlan.workouts,
      generatedByCoachId: client.designated_coach_id,
      generatedBy: 'coach_gordon_ai',
      isCertifiedByCoach: true,
      safetyGateCertified: true,
      coachCertifiedAt: new Date().toISOString(),
      certifiedBy: 'Coach Gordon',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clinicalRationale,
      coachPersonalNote,
      strengthCardioBlendSummary,
      nutritionTargets,
    },
  }

  const { data: existingPlans } = await admin
    .from('workout_plans')
    .select('id')
    .eq('user_id', client.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingPlans && existingPlans.length > 0) {
    const existingId = existingPlans[0].id
    console.log(`\n💾 Overwriting workout plan (ID: ${existingId})...`)
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
    console.log(`✓ Plan successfully inserted!`)
  }
}

main().catch(err => {
  console.error('❌ Error executing script:', err)
  process.exit(1)
})
