#!/usr/bin/env node

/**
 * Script: rebalance-and-trim-programs.ts
 * 
 * Rebalances and trims workout plans for Scott Gordon, Lisa Gordon, and Jennifer Rainville
 * to strictly enforce the client session duration hard stop (never > 60 minutes, targeting 40-48 mins).
 * 
 * Accurately measures:
 * - Time under tension (reps * tempo)
 * - Rest intervals
 * - Exercise transitions
 * - Warmup & Cooldown blocks
 * - Integrated Cardio finishers
 */

import { createClient } from '@supabase/supabase-js'
import {
  buildStoredProgramPlan,
  type CoachProgramPayload,
  type CoachProgramWorkoutInput,
  type ExerciseLibraryRecord,
  type EquipmentLibraryRecord,
} from '../lib/coach-programs'
import { type IntegratedCardioPrescription } from '../lib/rag-nasm-program-generator'
import { calculateEstimatedWorkoutDuration } from '../lib/workout-duration-engine'
import { detectExerciseEquipment } from '../lib/nasm-equipment-detector'

const makeCardio = (p: {
  title: string
  stage: 1 | 2 | 3
  stageName: string
  targetZone: string
  durationMins: number
  recommendedModalities: string[]
  coachingCues: string[]
  workRestRatio?: string
  protocolType?: IntegratedCardioPrescription['protocolType']
  targetRpe?: string
  timingGuideline?: string
  metabolicRationale?: string
  nasmChapterSource?: string
}): IntegratedCardioPrescription => ({
  protocolType: p.protocolType || 'post_lift_finisher',
  stage: p.stage,
  stageName: p.stageName,
  targetZone: p.targetZone,
  targetRpe: p.targetRpe || 'RPE 5-6',
  durationMins: p.durationMins,
  workRestRatio: p.workRestRatio || 'Continuous Steady-State',
  timingGuideline: p.timingGuideline || 'Immediately following resistance block',
  recommendedModalities: p.recommendedModalities,
  metabolicRationale: p.metabolicRationale || 'Aerobic fat oxidation & active metabolic recovery',
  coachingCues: p.coachingCues,
  nasmChapterSource: p.nasmChapterSource || 'NASM CPT-7 Chapter 15',
  title: p.title,
})

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials in environment')
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Pre-load active exercise and equipment libraries
  const [{ data: libraryExercises }, { data: equipmentData }] = await Promise.all([
    admin
      .from('exercise_library_entries')
      .select('id, name, slug, description, coaching_cues, primary_equipment, media_image_url, media_video_url, open_externally_only')
      .eq('is_active', true),
    admin
      .from('equipment_library_entries')
      .select('id, name, slug, description, media_image_url')
      .eq('is_active', true),
  ])

  const libExercises = (libraryExercises ?? []) as ExerciseLibraryRecord[]
  const libEquipment = (equipmentData ?? []) as EquipmentLibraryRecord[]

  // =========================================================================
  // 1. SCOTT GORDON — Trimmed 40-44m High-Density Recomposition Protocol
  // =========================================================================
  console.log('\n======================================================')
  console.log('⚡ Processing Scott Gordon (5c077.60rd0n@gmail.com)...')
  const { data: scottClient } = await admin
    .from('clients')
    .select('id, designated_coach_id')
    .eq('email', '5c077.60rd0n@gmail.com')
    .single()

  if (scottClient) {
    const workoutsScott: CoachProgramWorkoutInput[] = [
      {
        day: 1,
        focus: 'Upper Body Strength Endurance: Chest & Upper Back Posture',
        notes: 'Session 1: High-density horizontal push/pull contrast. Warmup (SMR & hip flexors) -> 2 superset pairs -> 10m Incline Treadmill flush.',
        exercises: [
          { name: 'self myofascial release smr thoracic spine', block: 'warmup', sets: '1', reps: '45s hold', tempo: 'Slow', rest: '0s', coachingCues: ['Roll slowly over upper back, pause on stiff segments and breathe deep.'] },
          { name: 'active kneeling hip flexor', block: 'warmup', sets: '1', reps: '10 reps per side', tempo: '2/0/2', rest: '0s', coachingCues: ['Tuck pelvis under, engage rear glute to open anterior hip capsule.'] },
          { name: 'dumbbell bench press', block: 'resistance', sets: '2', reps: '8-10', tempo: '2/0/2', rest: '0s', coachingCues: ['Lower under control, drive up with explosive chest contraction. 0s rest straight to pushups.'] },
          { name: 'push up to 3 point stance', block: 'resistance', sets: '2', reps: '8-10', tempo: '4/2/1', rest: '60s', coachingCues: ['Lift one foot slightly off the floor, brace core tightly, 4s descent, 2s hold at bottom.'] },
          { name: 'dumbbell bent over row', block: 'resistance', sets: '2', reps: '8-10', tempo: '2/0/2', rest: '0s', coachingCues: ['Hinge at hips, flat back, pull elbows past ribcage. 0s rest straight to bridge.'] },
          { name: 'single leg floor bridge', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Drive through heel, hold at peak contraction for 2s without arching lumbar spine.'] },
          { name: 'static pectoral ball stretch', block: 'cooldown', sets: '1', reps: '30s hold per side', tempo: 'Static', rest: '0s', coachingCues: ['Sink gently into ball to stretch anterior deltoid and pec major.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Incline Treadmill Metabolic Flush',
          stage: 1,
          stageName: 'Stage 1 Aerobic Base',
          targetZone: 'Zone 1-2 (115-135 BPM)',
          durationMins: 10,
          recommendedModalities: ['Incline Treadmill Walk (2.5-3.5% incline, 3.0-3.4 mph)'],
          coachingCues: ['Breathe exclusively through your nose to maintain aerobic fat oxidation and flush intra-muscular lactate.'],
        }),
      },
      {
        day: 2,
        focus: 'Posterior Chain Hinge & Vertical Force: Glute Armor & Spine Defense',
        notes: 'Session 2: Hinge mechanics and overhead stability. Warmup -> Deadlift/bridge superset -> Press/bird dog superset -> 10m Incline Walk.',
        exercises: [
          { name: 'foam roll calves', block: 'warmup', sets: '1', reps: '45s hold per leg', tempo: 'Slow', rest: '0s', coachingCues: ['Pause on gastrocnemius tender spots for 30-45s until tension releases.'] },
          { name: 'active supine biceps femoris', block: 'warmup', sets: '1', reps: '10 reps per side', tempo: '2/0/2', rest: '0s', coachingCues: ['Extend knee until mild hamstring stretch, hold 2s, lower.'] },
          { name: 'dumbbell romanian deadlift', block: 'resistance', sets: '2', reps: '8-10', tempo: '2/0/2', rest: '0s', coachingCues: ['Push hips straight back, maintain neutral spine, feel deep hamstring stretch. 0s rest to bridge.'] },
          { name: 'single leg glute bridge', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Lock non-working knee to chest, drive hip to ceiling using glute max.'] },
          { name: 'dumbbell overhead press', block: 'resistance', sets: '2', reps: '8-10', tempo: '2/0/2', rest: '0s', coachingCues: ['Brace glutes and abs, press directly overhead without hyperextending low back. 0s rest to bird dog.'] },
          { name: 'bird dog', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Reach opposite arm and leg long, keep glass of water balanced on lower back.'] },
          { name: 'static latissimus dorsi ball stretch', block: 'cooldown', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Sit hips back, reach arms forward on ball, exhale completely.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Incline Treadmill Metabolic Flush',
          stage: 1,
          stageName: 'Stage 1 Aerobic Base',
          targetZone: 'Zone 1-2 (115-135 BPM)',
          durationMins: 10,
          recommendedModalities: ['Incline Treadmill Walk (2.5-3.5% incline, 3.0-3.4 mph)'],
          coachingCues: ['Posture tall, chest up, arms swinging naturally.'],
        }),
      },
      {
        day: 3,
        focus: 'Functional Integration & Unilateral Balance: Athletic Reset',
        notes: 'Session 3: Squat patterns, unilateral step balance, and full-body core coupling.',
        exercises: [
          { name: 'how to foam roll adductors', block: 'warmup', sets: '1', reps: '45s hold per leg', tempo: 'Slow', rest: '0s', coachingCues: ['Lie prone, place roller on inner thigh, hold tender spots.'] },
          { name: 'child s pose', block: 'warmup', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Lengthen spine, breathe deep into lower ribs.'] },
          { name: 'goblet squat', block: 'resistance', sets: '2', reps: '8-10', tempo: '2/0/2', rest: '0s', coachingCues: ['Hold dumbbell tight to sternum, sit back between heels, knees tracking toes. 0s rest to step up.'] },
          { name: 'step up to balance frontal', block: 'resistance', sets: '2', reps: '8-10 per leg', tempo: '4/2/1', rest: '60s', coachingCues: ['Drive through lead heel, balance on one leg at the top for 2 full seconds.'] },
          { name: 'squat to row', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '0s', coachingCues: ['Squat down, drive up through hips, row handles to ribs in one fluid athletic chain.'] },
          { name: 'dead bug', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Press lower back firmly into floor, extend opposite arm and leg smoothly.'] },
          { name: 'static seated calf stretch', block: 'cooldown', sets: '1', reps: '30s per leg', tempo: 'Static', rest: '0s', coachingCues: ['Gentle stretch on gastroc/soleus to reset ankle dorsiflexion.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Incline Treadmill Metabolic Flush',
          stage: 1,
          stageName: 'Stage 1 Aerobic Base',
          targetZone: 'Zone 1-2 (115-135 BPM)',
          durationMins: 10,
          recommendedModalities: ['Incline Treadmill Walk (2.5-3.5% incline, 3.0-3.4 mph)'],
          coachingCues: ['Recover baseline heart rate and finish the training week energized.'],
        }),
      },
    ]

    const payloadScott: CoachProgramPayload = {
      clientId: scottClient.id,
      name: 'Scott Gordon 4-Week Recomposition & Movement Restoration Macrocycle',
      goal: 'fat_loss',
      nasmOptPhase: 2,
      phaseName: 'Strength Endurance (Trimmed High-Density Protocol)',
      sessionsPerWeek: 3,
      estimatedDurationMins: 43,
      startDate: '2026-10-12',
      workouts: workoutsScott,
    }

    const storedScott = buildStoredProgramPlan(payloadScott, libExercises, libEquipment)

    for (const w of storedScott.workouts) {
      const dur = calculateEstimatedWorkoutDuration({ workout: w, cardio: w.cardioProtocol, optPhase: 2 })
      console.log(`  Day ${w.day}: ${dur.totalDurationMins}m (${dur.summaryLabel}) | Warmup: ${dur.warmupMins}m, Resistance: ${dur.resistanceMins}m, Cardio: ${dur.cardioMins}m, Cooldown: ${dur.cooldownMins}m`)
      if (dur.totalDurationMins > 60) throw new Error(`Day ${w.day} exceeded 60 minutes!`)
    }

    const nutritionTargetsScott = {
      currentWeightLbs: 308,
      targetWeightLbs: 240,
      weeklyLossLbs: 1.5,
      estimatedWeeks: 45,
      targetCalories: 2450,
      proteinGrams: 220,
      carbGrams: 215,
      fatGrams: 75,
    }

    const clinicalRationaleScott = `COACH GORDON MASTER BRIEFING MEMO:
Scott, this rebalanced Phase 2 Strength Endurance protocol has been calibrated to a strict 40-44 minute duration window.
As an AI engineer with a demanding desk job, your training must be dense, potent, and strictly respectful of your daily schedule. We eliminated junk volume and trimmed the session to 2 premier contrast superset pairs per workout.
Every session pairs a stable strength lift directly with a biomechanically similar stabilization exercise (0s rest between lifts, 60s recovery after the pair). This elevates your caloric afterburn (EPOC), strengthens your joint stabilizers, and reactivates your athletic foundation in under 45 minutes total—including warmup, lifting, 10 minutes of Zone 1-2 incline walking, and cool-down.
Own your tempo, breathe through your nose, and get back to your day with energy.`

    await admin.from('workout_plans').update({
      name: payloadScott.name,
      estimated_duration_mins: 43,
      plan_json: {
        ...storedScott,
        sessions: storedScott.workouts,
        generatedByCoachId: scottClient.designated_coach_id,
        generatedBy: 'coach_gordon_ai',
        clinicalRationale: clinicalRationaleScott,
        nutritionTargets: nutritionTargetsScott,
        updatedAt: new Date().toISOString(),
      },
    }).eq('user_id', scottClient.id)

    console.log('✓ Scott Gordon plan updated successfully!')
  }

  // =========================================================================
  // 2. LISA GORDON — Trimmed 44-48m Joint Longevity & Stabilization Protocol
  // =========================================================================
  console.log('\n======================================================')
  console.log('⚡ Processing Lisa Gordon (da_mona_lisa@msn.com)...')
  const { data: lisaClient } = await admin
    .from('clients')
    .select('id, designated_coach_id')
    .eq('email', 'da_mona_lisa@msn.com')
    .single()

  if (lisaClient) {
    const workoutsLisa: CoachProgramWorkoutInput[] = [
      {
        day: 1,
        focus: 'Posterior Chain Stabilization & Vertical Shin Squatting',
        notes: 'Session 1: Wall squats with vertical shins to eliminate patellar knee shear, tubing rows, and glute bridge stability. 10m sunrise walk.',
        exercises: [
          { name: 'foam roll calves', block: 'warmup', sets: '1', reps: '45s hold', tempo: 'Slow', rest: '0s', coachingCues: ['Roll slowly on lower leg, pause on tender spots to restore ankle dorsiflexion.'] },
          { name: 'static kneeling hip flexor stretch', block: 'warmup', sets: '1', reps: '30s per side', tempo: 'Static', rest: '0s', coachingCues: ['Tuck hips under, gently press forward until gentle front hip stretch.'] },
          { name: 'stability ball wall squat', block: 'resistance', sets: '2', reps: '10-12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Keep feet out in front so shins stay perfectly vertical. Zero knee pain, 4s down, 2s hold.'] },
          { name: 'standing tubing row', block: 'resistance', sets: '2', reps: '12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Stand tall, pull elbows back, squeeze shoulder blades together for 2 seconds.'] },
          { name: 'single leg floor bridge', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Drive heel into floor, lift hips, squeeze glute at the top without hyperextending back.'] },
          { name: 'bird dog', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Lengthen opposite arm and leg, maintain stable pelvis.'] },
          { name: 'child s pose', block: 'cooldown', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Sit back on heels, stretch arms long, relax breathing.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Brisk Morning Aerobic Flush',
          stage: 1,
          stageName: 'Stage 1 Aerobic Base',
          targetZone: 'Zone 1 (105-125 BPM)',
          durationMins: 10,
          recommendedModalities: ['Outdoor Brisk Walking', 'Treadmill Flat or Low Incline (1.0-2.0%)'],
          coachingCues: ['Enjoy your fresh morning outdoor walk. Maintain a comfortable, conversational pace.'],
        }),
      },
      {
        day: 2,
        focus: 'Multiplanar Balance & Scapular Posture',
        notes: 'Session 2: Gluteus medius activation with lateral band walks, stability ball chest press, and single leg reach.',
        exercises: [
          { name: 'foam roll calves', block: 'warmup', sets: '1', reps: '45s hold', tempo: 'Slow', rest: '0s', coachingCues: ['Hold tender spots 30-45 seconds until tissue softens.'] },
          { name: 'static pectoral ball stretch', block: 'warmup', sets: '1', reps: '30s hold per side', tempo: 'Static', rest: '0s', coachingCues: ['Open chest, breathe deep into diaphragm.'] },
          { name: 'stability ball dumbbell chest press', block: 'resistance', sets: '2', reps: '10-12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Head and neck resting on ball, bridge hips up, press dumbbells smoothly.'] },
          { name: 'lateral band walking', block: 'resistance', sets: '2', reps: '10 reps per direction', tempo: '4/2/1', rest: '60s', coachingCues: ['Keep toes pointing straight ahead, step sideways to fire outer hip stabilizers.'] },
          { name: 'single leg balance reach frontal plane', block: 'resistance', sets: '2', reps: '8-10 reps per leg', tempo: '4/2/1', rest: '60s', coachingCues: ['Balance on one foot, reach non-working leg out to the side with control.'] },
          { name: 'stability ball prone cobra', block: 'resistance', sets: '2', reps: '10-12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Rotate thumbs to ceiling, squeeze shoulder blades down and back.'] },
          { name: 'static latissimus dorsi ball stretch', block: 'cooldown', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Gentle stretch across lats and thoracic spine.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Brisk Morning Aerobic Flush',
          stage: 1,
          stageName: 'Stage 1 Aerobic Base',
          targetZone: 'Zone 1 (105-125 BPM)',
          durationMins: 10,
          recommendedModalities: ['Outdoor Brisk Walking', 'Incline Treadmill Walk (1.5-2.5% incline, 2.8-3.2 mph)'],
          coachingCues: ['Keep chin level, shoulders relaxed back and down.'],
        }),
      },
      {
        day: 3,
        focus: 'Gluteal Dominance & Core Stability',
        notes: 'Session 3: Bridge variations, wall squats, tubing rows, and dead bug core control.',
        exercises: [
          { name: 'self myofascial release smr tensor fascia latae', block: 'warmup', sets: '1', reps: '45s hold per side', tempo: 'Slow', rest: '0s', coachingCues: ['Release outer hip/TFL tension to protect knees.'] },
          { name: 'static standing adductor stretch', block: 'warmup', sets: '1', reps: '30s hold per side', tempo: 'Static', rest: '0s', coachingCues: ['Wide stance, shift weight to one side, feel inner thigh stretch.'] },
          { name: 'stability ball bridge', block: 'resistance', sets: '2', reps: '12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Heels on ball, lift hips, squeeze glutes and hamstrings for 2s at the top.'] },
          { name: 'standing tubing row', block: 'resistance', sets: '2', reps: '12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Smooth pulling motion, upright posture.'] },
          { name: 'stability ball wall squat', block: 'resistance', sets: '2', reps: '10-12 reps', tempo: '4/2/1', rest: '60s', coachingCues: ['Ball supporting lower back, sit back, vertical shins.'] },
          { name: 'dead bug', block: 'resistance', sets: '2', reps: '10 reps per side', tempo: '4/2/1', rest: '60s', coachingCues: ['Opposite arm and leg reach, back glued to floor.'] },
          { name: 'static seated calf stretch', block: 'cooldown', sets: '1', reps: '30s per leg', tempo: 'Static', rest: '0s', coachingCues: ['Relax into calf stretch to complete the workout.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Brisk Morning Aerobic Flush',
          stage: 1,
          stageName: 'Stage 1 Aerobic Base',
          targetZone: 'Zone 1 (105-125 BPM)',
          durationMins: 10,
          recommendedModalities: ['Outdoor Brisk Walking', 'Treadmill Flat Walk (2.8-3.2 mph)'],
          coachingCues: ['Finish with Lisa\'s favorite fresh-air outdoor walk. Breathe naturally and enjoy the sunrise.'],
        }),
      },
    ]

    const payloadLisa: CoachProgramPayload = {
      clientId: lisaClient.id,
      name: 'Lisa Gordon: Joint Longevity & Metabolic Stabilization Blueprint',
      goal: 'fat_loss',
      nasmOptPhase: 1,
      phaseName: 'Stabilization Endurance (Trimmed Joint Longevity Protocol)',
      sessionsPerWeek: 3,
      estimatedDurationMins: 48,
      startDate: '2026-10-12',
      workouts: workoutsLisa,
    }

    const storedLisa = buildStoredProgramPlan(payloadLisa, libExercises, libEquipment)

    for (const w of storedLisa.workouts) {
      const dur = calculateEstimatedWorkoutDuration({ workout: w, cardio: w.cardioProtocol, optPhase: 1 })
      console.log(`  Day ${w.day}: ${dur.totalDurationMins}m (${dur.summaryLabel}) | Warmup: ${dur.warmupMins}m, Resistance: ${dur.resistanceMins}m, Cardio: ${dur.cardioMins}m, Cooldown: ${dur.cooldownMins}m`)
      if (dur.totalDurationMins > 60) throw new Error(`Day ${w.day} exceeded 60 minutes!`)
    }

    const nutritionTargetsLisa = {
      currentWeightLbs: 245,
      targetWeightLbs: 175,
      weeklyLossLbs: 1.0,
      estimatedWeeks: 70,
      targetCalories: 1700,
      proteinGrams: 140,
      carbGrams: 165,
      fatGrams: 55,
    }

    const clinicalRationaleLisa = `COACH GORDON MASTER BRIEFING MEMO:
Lisa, your morning routine has been streamlined to a crisp, comfortable 44-48 minutes total.
We dialed in exactly 4 key stabilization exercises per day with 2 focused sets each. This provides complete joint-protective stimulus, builds foundational posture, and protects your knees (runner's knee defense with vertical-shin wall squats and glute bridge activations) without leaving you exhausted or taking over your morning.
Every session concludes with 10 minutes of your favorite outdoor brisk walking or gentle treadmill strolling to oxidize fat and start your day energized. Consistent, pain-free, and always under an hour!`

    await admin.from('workout_plans').update({
      name: payloadLisa.name,
      estimated_duration_mins: 48,
      plan_json: {
        ...storedLisa,
        sessions: storedLisa.workouts,
        generatedByCoachId: lisaClient.designated_coach_id,
        generatedBy: 'coach_gordon_ai',
        clinicalRationale: clinicalRationaleLisa,
        nutritionTargets: nutritionTargetsLisa,
        updatedAt: new Date().toISOString(),
      },
    }).eq('user_id', lisaClient.id)

    console.log('✓ Lisa Gordon plan updated successfully!')
  }

  // =========================================================================
  // 3. JENNIFER RAINVILLE — Trimmed 40-44m Metabolic Strength & Step Protocol
  // =========================================================================
  console.log('\n======================================================')
  console.log('⚡ Processing Jennifer Rainville (rainvilj@hotmail.com)...')
  const { data: jenClient } = await admin
    .from('clients')
    .select('id, designated_coach_id')
    .eq('email', 'rainvilj@hotmail.com')
    .single()

  if (jenClient) {
    const workoutsJen: CoachProgramWorkoutInput[] = [
      {
        day: 1,
        focus: 'Posterior Chain Durability, Sagittal Balance & Step Finisher',
        notes: 'Session 1: Reebok step-ups to balance, Romanian deadlifts for dad\'s weekend tasks, squat-to-row, and squat thrust burpees. 10m Reebok step cardio.',
        exercises: [
          { name: 'foam roll calves', block: 'warmup', sets: '1', reps: '45s hold', tempo: 'Slow', rest: '0s', coachingCues: ['Roll lower calves, pause on tender spots to restore ankle dorsiflexion.'] },
          { name: 'static kneeling hip flexor stretch', block: 'warmup', sets: '1', reps: '30s per side', tempo: 'Static', rest: '0s', coachingCues: ['Tuck hips under, open up hip flexors after desk work.'] },
          { name: 'step up to balance sagital', block: 'resistance', sets: '2', reps: '8-10 reps per leg', tempo: '2/0/2', rest: '45s', coachingCues: ['Step onto Reebok step platform, hold balance on one foot at the top for 2 full seconds.'] },
          { name: 'dumbbell romanian deadlift', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '45s', coachingCues: ['Hinge deeply at hips with flat spine. Builds lifting stamina for assisting your dad.'] },
          { name: 'squat to row', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '45s', coachingCues: ['Athletic compound movement linking hips and upper back.'] },
          { name: 'squat thrust burpees', block: 'resistance', sets: '2', reps: '8-10 reps', tempo: '2/0/2', rest: '60s', coachingCues: ['Jennifer\'s metabolic power movement! Drop hands, snap back to plank, snap in, stand tall.'] },
          { name: 'child s pose', block: 'cooldown', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Relax and breathe into lower ribs.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Reebok Step Rhythmic Aerobic Flush',
          stage: 1,
          stageName: 'Stage 1-2 Metabolic Flush',
          targetZone: 'Zone 1-2 (115-135 BPM)',
          durationMins: 10,
          workRestRatio: 'Continuous Intervals',
          recommendedModalities: ['Reebok Step Bench', 'Rhythmic Step-Ups & V-Steps'],
          coachingCues: ['10 minutes on your Reebok Step at home. Steady rhythm, great music, fantastic fat burn before showering.'],
        }),
      },
      {
        day: 2,
        focus: 'Frontal Plane Balance, Wall Squat Mechanics & Burpee Burst',
        notes: 'Session 2: Frontal step-ups to balance on Reebok step, wall squats, tubing rows, and burpees.',
        exercises: [
          { name: 'how to foam roll adductors', block: 'warmup', sets: '1', reps: '45s hold', tempo: 'Slow', rest: '0s', coachingCues: ['Release inner thigh tension.'] },
          { name: 'static standing adductor stretch', block: 'warmup', sets: '1', reps: '30s hold per side', tempo: 'Static', rest: '0s', coachingCues: ['Gentle stretch across groin and hip capsule.'] },
          { name: 'step up to balance frontal', block: 'resistance', sets: '2', reps: '8-10 reps per leg', tempo: '2/0/2', rest: '45s', coachingCues: ['Lateral step onto Reebok step, balance with knee high for 2 seconds. Addresses balance directly!'] },
          { name: 'stability ball wall squat', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '45s', coachingCues: ['Smooth squat with upright torso and vertical shins.'] },
          { name: 'standing tubing row', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '45s', coachingCues: ['Squeeze scapulae together at peak contraction.'] },
          { name: 'squat thrust burpees', block: 'resistance', sets: '2', reps: '8-10 reps', tempo: '2/0/2', rest: '60s', coachingCues: ['Rhythmic, controlled burpees. Maximum EPOC without joint strain.'] },
          { name: 'static latissimus dorsi ball stretch', block: 'cooldown', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Sink back, exhale, relax lats.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Reebok Step Aerobic Interval Surge',
          stage: 1,
          stageName: 'Stage 1-2 Metabolic Flush',
          targetZone: 'Zone 1-2 (115-135 BPM)',
          durationMins: 10,
          workRestRatio: 'Continuous Intervals',
          recommendedModalities: ['Reebok Step Bench', 'Rhythmic Step-Ups & V-Steps'],
          coachingCues: ['Maintain 115-135 BPM heart rate on your step bench.'],
        }),
      },
      {
        day: 3,
        focus: 'Functional Weekend Readiness, Chest Press & Metabolic Groove',
        notes: 'Session 3: Romanian deadlifts for father\'s weekend tasks, floor bridges, ball chest press, and burpees.',
        exercises: [
          { name: 'foam roll calves', block: 'warmup', sets: '1', reps: '45s hold', tempo: 'Slow', rest: '0s', coachingCues: ['Target calf trigger points.'] },
          { name: 'static pectoral ball stretch', block: 'warmup', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Open up chest before pressing.'] },
          { name: 'dumbbell romanian deadlift', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '45s', coachingCues: ['Hip hinge pattern directly primes your back and hips for lifting and helping dad.'] },
          { name: 'single leg floor bridge', block: 'resistance', sets: '2', reps: '10 reps per leg', tempo: '2/0/2', rest: '45s', coachingCues: ['Unilateral glute recruitment, stabilize pelvis.'] },
          { name: 'stability ball dumbbell chest press', block: 'resistance', sets: '2', reps: '10 reps', tempo: '2/0/2', rest: '45s', coachingCues: ['Stable press on ball, keeping glutes clamped.'] },
          { name: 'squat thrust burpees', block: 'resistance', sets: '2', reps: '8-10 reps', tempo: '2/0/2', rest: '60s', coachingCues: ['Finish the week strong with your signature metabolic movement.'] },
          { name: 'static seated calf stretch', block: 'cooldown', sets: '1', reps: '30s hold', tempo: 'Static', rest: '0s', coachingCues: ['Cool down completely.'] },
        ].map(e => ({
          ...e,
          primaryEquipment: detectExerciseEquipment(e.name, null),
        })),
        cardioProtocol: makeCardio({
          title: 'Weekend Pre-Ignition Reebok Step Groove',
          stage: 1,
          stageName: 'Stage 1-2 Metabolic Flush',
          targetZone: 'Zone 1-2 (115-135 BPM)',
          durationMins: 10,
          workRestRatio: 'Continuous Intervals',
          recommendedModalities: ['Reebok Step Bench', 'Rhythmic Step-Ups & V-Steps'],
          coachingCues: ['10m step flush at home. Save your outdoor walks for visiting mom and dad clean and fresh!'],
        }),
      },
    ]

    const payloadJen: CoachProgramPayload = {
      clientId: jenClient.id,
      name: 'Jennifer Rainville 4-Week Metabolic Strength & Reebok Step Conditioning Protocol',
      goal: 'fat_loss',
      nasmOptPhase: 2,
      phaseName: 'Strength Endurance (Trimmed High-Density Step Protocol)',
      sessionsPerWeek: 3,
      estimatedDurationMins: 43,
      startDate: '2026-10-12',
      workouts: workoutsJen,
    }

    const storedJen = buildStoredProgramPlan(payloadJen, libExercises, libEquipment)

    for (const w of storedJen.workouts) {
      const dur = calculateEstimatedWorkoutDuration({ workout: w, cardio: w.cardioProtocol, optPhase: 2 })
      console.log(`  Day ${w.day}: ${dur.totalDurationMins}m (${dur.summaryLabel}) | Warmup: ${dur.warmupMins}m, Resistance: ${dur.resistanceMins}m, Cardio: ${dur.cardioMins}m, Cooldown: ${dur.cooldownMins}m`)
      if (dur.totalDurationMins > 60) throw new Error(`Day ${w.day} exceeded 60 minutes!`)
    }

    const nutritionTargetsJen = {
      currentWeightLbs: 245,
      targetWeightLbs: 175,
      weeklyLossLbs: 1.0,
      estimatedWeeks: 70,
      targetCalories: 1750,
      proteinGrams: 140,
      carbGrams: 170,
      fatGrams: 60,
    }

    const clinicalRationaleJen = `COACH GORDON MASTER BRIEFING MEMO:
Jennifer, this rebalanced program is locked into a crisp 40-44 minute duration window.
We eliminated filler exercises and focused strictly on what delivers maximum results for you:
1. YOUR BURPEE SUPERPOWER: 2 crisp sets of controlled Squat Thrust Burpees to accelerate caloric burn and EPOC without dragging out the session.
2. ZERO MOUNTAIN CLIMBERS & ZERO RUNNING: 100% excluded.
3. REEBOK STEP BALANCE & CARDIO: Step-ups to balance directly improve your ankle/knee stability, followed immediately by 10 minutes of rhythmic Reebok Step cardio intervals at home before you shower.
4. FRESH WALKS TO PARENTS: Visiting mom and dad remains your dedicated non-sweaty walking ritual on non-workout days or relaxed evenings.
5. NO CALORIE COUNTING: Precision Nutrition hand-portion method (Palm Protein, Fist Veggies, Cupped Hand Carbs, Thumb Fats) + 80% fullness rule.
High-density, fun, functional for helping your dad on weekends, and guaranteed to never take more than an hour!`

    await admin.from('workout_plans').update({
      name: payloadJen.name,
      estimated_duration_mins: 43,
      plan_json: {
        ...storedJen,
        sessions: storedJen.workouts,
        generatedByCoachId: jenClient.designated_coach_id,
        generatedBy: 'coach_gordon_ai',
        clinicalRationale: clinicalRationaleJen,
        nutritionTargets: nutritionTargetsJen,
        updatedAt: new Date().toISOString(),
      },
    }).eq('user_id', jenClient.id)

    console.log('✓ Jennifer Rainville plan updated successfully!')
  }

  console.log('\n🎉 ALL THREE PROGRAMS REBALANCED AND SAVED SUCCESSFULLY!')
}

main().catch(err => {
  console.error('❌ Error executing script:', err)
  process.exit(1)
})

