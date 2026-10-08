#!/usr/bin/env node

/**
 * Script: assign-jennifer-custom-program.ts
 * 
 * Elicits Master Coach Gordon AI (backed by Gemini 3.8 Flash and NASM OPT™ curriculum)
 * to generate a personalized, medium-length 3-day Strength & Stabilization Endurance
 * program for Jennifer Rainville (rainvilj@hotmail.com).
 * 
 * Tailored for:
 * - 245 lbs (111.13 kg), 34 yo female, 5'6", sedentary full-time job
 * - More fit and conditioned than beginner (intermediate strength/endurance)
 * - Burpee proficiency: Performs burpees well and genuinely doesn't mind them!
 * - Balance: A little off; requires progressive NASM OPT single-leg stabilization
 * - Core: Decent baseline core strength (planks, bird dogs, dead bugs)
 * - Weekend functional duty: Helps elderly father with tasks; needs strong posterior chain,
 *   hip-hinge resilience, and functional carrying/stepping capacity
 * - Strict Exclusions: DOES NOT LIKE mountain climbers or running (100% excluded)
 * - Equipment: Reebok Step bench, Dumbbells, Bands/Tubing, Stability Ball, Foam Roller, Bodyweight
 * - Cardio Architecture:
 *   1) In-Workout Reebok Step Bench Flush (10-12 mins post-workout at home, Tanaka Zone 1-2)
 *   2) Dedicated Parents' Visit Walking Ritual (fresh, clean, non-sweaty brisk walk on
 *      non-workout days/evenings to visit nearby mom and dad)
 * - Nutrition Strategy: Aversion to counting calories. Custom Precision Nutrition
 *   Hand-Portion & Visual Plate Architecture (Palm, Fist, Cupped Hand, Thumb) + 80% Fullness Cue.
 * - Session Length: Medium (40-45 minutes total)
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

  const clientEmail = 'rainvilj@hotmail.com'
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

  // 1. Update Jennifer's fitness profile
  const updatedInjuriesNotes =
    "[preferences: no_mountain_climbers, no_running] High burpee tolerance/proficiency; slight balance deficit (prescribe multiplanar balance & stabilization); enjoys Reebok Step cardio and outdoor walking. STRICT EXCLUSIONS: No mountain climbers, no running under any circumstances. Helps elderly father with tasks on weekends."
  const trainingDays = 3
  const preferredDays = ['monday', 'wednesday', 'friday']

  console.log(`\n📝 Updating Jennifer's fitness profile...`)
  console.log(`- Weight: 245 lbs (111.13 kg)`)
  console.log(`- Schedule: 3 Days / Week (${preferredDays.join(', ')}) | ~42 mins/session`)
  console.log(`- Experience Level: Intermediate (Good conditioning, burpee proficiency)`)
  console.log(`- Balance Focus: Progressive single-leg stabilization & step-to-balance`)
  console.log(`- Equipment: Reebok Step, Dumbbells, Resistance Bands, Stability Ball, Foam Roller`)
  console.log(`- Activity Level: Sedentary weekday desk job; active assisting elderly father on weekends`)
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
      experience_level: 'intermediate',
      equipment_access: [
        'Reebok Step',
        'Dumbbells',
        'Band or Tube',
        'Stability Ball',
        'Foam Roller',
        'Bodyweight',
      ],
      cardio_equipment_access: ['step', 'outdoor-walking'],
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

  const coachGuidance = `Custom Metabolic Strength & Step Conditioning Protocol for Jennifer Rainville personally.
Client Stats & Context:
- Current: 245 lbs, 34-year-old female, 5'6", sedentary weekday job.
- Experience & Conditioning: Intermediate fitness level. More conditioned than a beginner.
- Burpee Superpower: Jennifer can do burpees well and genuinely DOES NOT mind them at all! Prescribe "squat thrust burpees" as a premier metabolic fat-loss and athletic conditioning exercise.
- STRICT EXCLUSIONS: Jennifer strongly dislikes mountain climbers and running. Under NO circumstances prescribe mountain climbers or running. Strictly exclude both from all workouts and cardio.
- Balance & Stabilization: Decent core strength, but her balance is a little off. Integrate NASM OPT balance and stabilization movements: "step up to balance frontal", "step up to balance sagital", "single leg balance reach frontal plane", and "single leg glute bridge".
- Functional Weekend Strength: She helps her elderly father with tasks on the weekend (lifting, carrying, assisting). Prioritize hip hinges and posterior chain endurance ("dumbbell romanian deadlift", "squat to row", "standing tubing row", "stability ball wall squat") so her spine, hips, and knees stay durable and fatigue-resistant.
- Cardio Integration: She owns a Reebok Step bench and loves step cardio! Prescribe an integrated 10-12 minute Tanaka Stage 1/2 Reebok Step bench finisher (V-steps, step-taps, rhythmic step-ups in Zone 1-2: 115-135 BPM) done at home post-workout where she can shower immediately.
- Outdoor Walking (Parents' Visit): Her mom and dad live nearby and she loves walking to visit them, but does NOT want to visit them all sweaty right after a workout. Prescribe a separate "Fresh Non-Sweaty Walking Ritual" for non-workout days, evenings, or weekends to accumulate NEAT steps while visiting family clean and fresh.
- Nutrition Strategy (NO CALORIE COUNTING): Jennifer dislikes counting calories. We use the Precision Nutrition Hand-Portion System (Palms = Protein, Fists = Veggies, Cupped Hands = Carbs, Thumbs = Healthy Fats) and the 80% Fullness Cue (Hara Hachi Bu) for effortless, guilt-free fat loss.
- Session Length: Medium-length workout: ~40-45 minutes total (Warmup 7m, Core/Balance 8m, Resistance 18m, Reebok Step Finisher 10m, Cooldown 3m).
- Equipment Available: Reebok Step, Dumbbells, Band or Tube, Stability Ball, Foam Roller, Bodyweight.`

  const generatedPlan = await generateMasterNasmOptProgram({
    clientName: 'Jennifer Rainville',
    clientAge: 34,
    clientSex: 'female',
    goal: 'fat_loss',
    targetNasmPhase: 2,
    trainingDaysPerWeek: 3,
    experienceLevel: 'intermediate',
    equipmentAccess: [
      'Reebok Step',
      'Dumbbells',
      'Band or Tube',
      'Foam Roller',
      'Stability Ball',
      'Bodyweight',
    ],
    kineticCompensations: ['balance_instability', 'excessive_forward_lean'],
    contraindicationTags: ['no_mountain_climbers', 'no_running'],
    cardioBlendStyle: 'integrated_finishers',
    coachGuidanceNotes: coachGuidance,
    injuriesLimitations: updatedInjuriesNotes,
  })

  console.log(`\n✓ Program Generated by Coach Gordon AI: "${generatedPlan.planTitle}"`)
  console.log(`- Phase: Phase ${generatedPlan.nasmOptPhase} (${generatedPlan.phaseName})`)
  console.log(`- Sessions Per Week: ${generatedPlan.sessionsPerWeek}`)
  console.log(`- Workouts Synthesized: ${generatedPlan.workouts.length}`)

  // 3. Format Workouts Payload with Array Safeguards & Exclusions
  const toArr = (v: unknown): string[] => Array.isArray(v) ? v.map(String) : typeof v === 'string' ? [v] : []

  const workoutsPayload: CoachProgramWorkoutInput[] = generatedPlan.workouts.map(w => {
    // Sanitize any accidental mountain climber or running exercises
    const sanitizedExercises = w.exercises
      .filter(ex => {
        const nameLower = ex.name.toLowerCase()
        const isMountainClimber = nameLower.includes('mountain climber')
        const isRunning = nameLower.includes('running') || nameLower.includes('treadmill run')
        if (isMountainClimber || isRunning) {
          console.warn(`🛡️ Removed prohibited exercise "${ex.name}" per Jennifer's strict preferences.`)
          return false
        }
        return true
      })
      .map(ex => {
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
      })

    // Ensure burpees are present in Day 2 if not already present
    const hasBurpees = sanitizedExercises.some(e => e.name.toLowerCase().includes('burpee'))
    if (w.day === 2 && !hasBurpees) {
      sanitizedExercises.push({
        name: 'squat thrust burpees',
        block: 'resistance',
        sets: '3',
        reps: '10-12',
        tempo: '2/0/2',
        rest: '60s',
        coachingCues: [
          'Jennifer\'s Metabolic Finisher: Drop hands under shoulders, kick feet back cleanly into plank, snap forward, and stand tall with authority.',
          'Brace core tightly at the bottom plank to protect lumbar spine.',
        ],
        notes: 'Jennifer\'s Metabolic Power Movement: Smooth, steady cadence · 10-12 controlled reps.',
        description: 'NASM OPT Caloric Acceleration & Full Body Conditioning (Squat Thrust Burpees)',
        primaryEquipment: ['Bodyweight'],
      })
    }

    const modalities = toArr(w.cardioProtocol?.recommendedModalities).join(', ')
    const cardioNote = w.cardioProtocol
      ? `\n\nIntegrated Cardio: ${w.cardioProtocol.title || 'Tanaka Stage 1/2 Reebok Step Finisher'} (${w.cardioProtocol.durationMins || 10}m in ${w.cardioProtocol.targetZone || 'Zone 1-2'})\n• Modality: Reebok Step Bench (V-steps, step-taps, rhythmic low-impact intervals)\n• Home Setting: Complete at home post-workout before showering.\n• Separate Family Walk: Visit parents on non-workout days / evenings clean and fresh!`
      : ''

    const smr = toArr(w.warmupProtocol?.inhibitSmr).join(', ')
    const staticStretches = toArr(w.warmupProtocol?.lengthenStaticStretch).join(', ')
    const dynamicStretches = toArr(w.warmupProtocol?.activateDynamic).join(', ')

    return {
      day: w.day,
      focus: w.focus,
      notes: `${w.dailyPeriodizationMemo || ''}\n\nWarmup: Inhibit (${smr}) -> Lengthen (${staticStretches}) -> Activate (${dynamicStretches})${cardioNote}`,
      exercises: sanitizedExercises,
      cardioProtocol: w.cardioProtocol
        ? {
            ...w.cardioProtocol,
            title: w.cardioProtocol.title || 'Reebok Step Cardio Flush',
            recommendedModalities: ['Reebok Step Bench', 'Rhythmic Step-Ups & V-Steps'],
            coachingCues: toArr(w.cardioProtocol.coachingCues).length > 0
              ? toArr(w.cardioProtocol.coachingCues)
              : [
                  'Keep feet landing squarely in the center of the Reebok Step platform.',
                  'Stay in Tanaka Zone 1-2 (115-135 BPM) for continuous aerobic fat oxidation.',
                  'Enjoy this sweaty flush at home; keep your visits to mom and dad for fresh, clean walks!',
                ],
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
    name: generatedPlan.planTitle || 'Jennifer Rainville — Phase 2 Metabolic Strength & Step Conditioning Protocol',
    goal: generatedPlan.primaryGoal || 'fat_loss',
    nasmOptPhase: Number(generatedPlan.nasmOptPhase) || 2,
    phaseName: generatedPlan.phaseName || 'Strength Endurance with Balance & Metabolic Finishers',
    sessionsPerWeek: Number(generatedPlan.sessionsPerWeek) || 3,
    estimatedDurationMins: 42,
    startDate: '2026-10-12', // Next Monday for clean weekly alignment
    workouts: workoutsPayload,
  }

  const storedPlan = buildStoredProgramPlan(
    payload,
    (libraryExercises ?? []) as ExerciseLibraryRecord[],
    (equipmentData ?? []) as EquipmentLibraryRecord[]
  )

  // 5. Structure Stored Plan Row with Hand-Portion Nutrition & Periodization Memos
  const nutritionTargets = {
    currentWeightLbs: 245,
    targetWeightLbs: 175,
    weeklyLossLbs: 1.0,
    estimatedWeeks: 70,
    targetCalories: 1750,
    proteinGrams: 140,
    carbGrams: 170,
    fatGrams: 60,
  }

  const clinicalRationale = `COACH GORDON MASTER BRIEFING MEMO:
Jennifer, welcome to your custom Forge Athletic performance & metabolic conditioning program!
I designed every detail of this routine around your lifestyle, your physical strengths, and what actually makes fitness enjoyable and sustainable for you.

Here is why this plan is built specifically for you:

1. YOU OWN BURPEES (YOUR METABOLIC SUPERPOWER):
Most people dread burpees, but you do them well and don't mind them at all! That is a massive advantage for metabolic fat loss. In Session 2, we integrate controlled Squat Thrust Burpees to spike your caloric expenditure, build full-body endurance, and trigger post-exercise oxygen consumption (EPOC)—without needing dangerous plyometric jumps or joint-pounding high impact.

2. ZERO MOUNTAIN CLIMBERS & ZERO RUNNING (STRICTLY EXCLUDED):
You told me you hate mountain climbers and running. Consider them completely banished from your universe. You will never see a mountain climber or a running prescription on this protocol—ever.

3. DIALING IN YOUR BALANCE & REEBOK STEP CONDITONING:
Your core strength is solid, but your balance can be a little off. To build bulletproof stability and confidence, we've integrated NASM OPT Step-Up to Balance and Single-Leg Reach progressions. You have a Reebok Step bench and love step cardio—so every workout concludes with 10-12 minutes of rhythmic Reebok Step intervals (V-steps, step-taps, alternating step-ups) in Tanaka Zone 1-2 (115-135 BPM). This incinerates fat, elevates mood, and gives you a fantastic cardio sweat right in the comfort of your home.

4. THE "FRESH VISIT" OUTDOOR WALKING RITUAL:
Your mom and dad live nearby, and you love walking to visit them. But nobody wants to show up to their parents' living room drenched in post-workout sweat! Therefore, your sweaty Reebok Step cardio happens at home before your shower. Your walks to your parents are designated as your "Fresh Non-Sweaty Walking Ritual"—schedule them on non-workout days, relaxed evenings, or weekend mornings in fresh, clean clothes. You get quality time with your parents, fresh outdoor air, and an easy 3,000–5,000 steps of pure NEAT (non-exercise activity thermogenesis) with zero sweat pressure.

5. WEEKEND FUNCTIONAL STRENGTH (HELPING DAD):
Because you help your elderly father with household tasks on weekends, this program prioritizes hip-hinge endurance and posterior chain integrity (Dumbbell Romanian Deadlifts, Squat to Rows, Glute Bridges). This protects your lower back, strengthens your hips, and ensures you have all the stamina and lifting power you need to assist your dad safely.

6. CREATIVE NUTRITION: ZERO CALORIE COUNTING (HAND-PORTION METHOD):
You don't like counting calories, and you don't need to. Tedious food scales and logging apps only create burnout. Instead, we use your own hand as your personalized, portable portion guide for your 3-4 daily meals:
• PROTEIN (Your Palm): 1 palm-sized serving per meal (chicken breast, turkey, salmon, Greek yogurt, eggs, tofu). Protects lean muscle and crushes hunger.
• VEGETABLES (Your Fist): 1 to 2 fist-sized servings per meal (spinach, broccoli, zucchini, bell peppers, crisp greens). Abundant micronutrients and fullness.
• SMART CARBS (Your Cupped Hand): 1 cupped hand per meal (sweet potatoes, oats, brown rice, quinoa, fresh berries). Clean energy for workouts and brainpower.
• HEALTHY FATS (Your Entire Thumb): 1 thumb-sized serving per meal (extra virgin olive oil, avocado, almonds, walnuts). Hormone and joint health.
• THE 80% SATIETY RULE (Hara Hachi Bu): Eat mindfully without screens, and stop when you are 80% full (comfortably satisfied, not stuffed).
• HYDRATION ANCHOR: 80-100 oz of fresh water daily to keep your metabolism humming.

You have all the tools, the conditioning, and a protocol custom-molded to your life. Let's make this journey enjoyable, empowering, and life-changing. I'm right here with you every single rep!`

  const planRow = {
    user_id: client.id,
    name: generatedPlan.planTitle || 'Jennifer Rainville — Phase 2 Metabolic Strength & Step Conditioning Protocol',
    goal: 'fat_loss',
    nasm_opt_phase: Number(generatedPlan.nasmOptPhase) || 2,
    phase_name: generatedPlan.phaseName || 'Strength Endurance with Balance & Metabolic Finishers',
    sessions_per_week: Number(generatedPlan.sessionsPerWeek) || 3,
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

  console.log('\n🎉 SUCCESS! Custom program created and assigned to Jennifer Rainville.')
  console.log('--- Summary ---')
  console.log(`Title: ${planRow.name}`)
  console.log(`Phase: ${planRow.phase_name} (OPT Phase ${planRow.nasm_opt_phase})`)
  console.log(`Sessions: ${planRow.sessions_per_week} days / week | ~${planRow.estimated_duration_mins} mins per session`)
  console.log(`Nutrition Architecture: Precision Nutrition Hand-Portion Method (Palm Protein, Fist Veggie, Cupped Hand Carbs, Thumb Fats)`)
  console.log('----------------')
}

main().catch(err => {
  console.error('❌ Error executing script:', err)
  process.exit(1)
})

