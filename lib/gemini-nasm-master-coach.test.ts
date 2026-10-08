import { describe, it, expect } from 'vitest'
import {
  generateMasterNasmOptProgram,
  enrichPlanWithNasmCdnMedia,
  filterNasmEdgeCatalogByEquipment,
  validateAndEnforceEquipmentConstraints,
  MASTER_NASM_COACH_SYSTEM_PROMPT,
} from './gemini-nasm-master-coach'
import { generateRagNasmProgram } from './rag-nasm-program-generator'

describe('Master NASM AI Head Coach Persona Engine', () => {
  it('defines the 20+ year master personal trainer persona with strict NASM OPT and Edge directives', () => {
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('Coach Scott Gordon')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('20 years')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('Deep Empathy & Compassionate Care')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('Client Safety & Strict Scope of Practice')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('Results-Driven & Super Intelligent')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('Highly Motivational & Master People Skills')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-Master CPT')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-PES')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-CES')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-PBC')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-BCS')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-WLS')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-CATM')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-MMACS')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('NASM-GFS')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('OPT™ Model Periodization')
    expect(MASTER_NASM_COACH_SYSTEM_PROMPT).toContain('STRICT NASM EDGE EXERCISE CATALOG')
  })

  it('filters NASM Edge exercise catalog accurately based on client equipment access', () => {
    const bwCatalog = filterNasmEdgeCatalogByEquipment(['Bodyweight'])
    expect(bwCatalog.length).toBeGreaterThan(50)
    expect(bwCatalog.every(name => !name.includes('barbell') && !name.includes('cable') && !name.includes('press machine'))).toBe(true)

    const homeCatalog = filterNasmEdgeCatalogByEquipment(['Dumbbells', 'Resistance Bands', 'Bodyweight'])
    expect(homeCatalog.length).toBeGreaterThan(bwCatalog.length)
    expect(homeCatalog.some(name => name.includes('dumbbell'))).toBe(true)
    expect(homeCatalog.every(name => !name.includes('barbell') && !name.includes('cable crossover'))).toBe(true)

    const fullGymCatalog = filterNasmEdgeCatalogByEquipment(['Full Commercial Gym'])
    expect(fullGymCatalog.length).toBeGreaterThan(250)
  })

  it('validates and auto-substitutes disallowed exercises in secondary validation pass', () => {
    const rawPlan = generateRagNasmProgram({
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 3,
      equipmentAccess: ['Full Commercial Gym'], // originally generated with barbells/machines
    })

    // Run enforcement pass for a client who only has dumbbells and bodyweight
    const validated = validateAndEnforceEquipmentConstraints(rawPlan, ['Dumbbells', 'Bodyweight'])
    for (const workout of validated.workouts) {
      for (const ex of workout.exercises) {
        const nameLower = ex.name.toLowerCase()
        expect(nameLower).not.toContain('barbell')
        expect(nameLower).not.toContain('cable crossover')
        expect(nameLower).not.toContain('leg press calf raise')
      }
    }
  })

  it('generates an authentic OPT periodized macrocycle and enriches 100% of exercises with official NASM CDN video and images', async () => {
    const plan = await generateMasterNasmOptProgram({
      clientName: 'Executive Athlete',
      clientAge: 42,
      clientSex: 'male',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      equipmentAccess: ['dumbbell', 'bench', 'stability ball', 'band', 'bodyweight'],
      kineticCompensations: ['knees_cave_in'],
    })

    expect(plan.nasmOptPhase).toBe(1)
    expect(plan.phaseName).toBe('Stabilization Endurance')
    expect(plan.workouts.length).toBe(3)

    // Check all exercises have non-null official NASM CDN media
    for (const workout of plan.workouts) {
      expect(workout.exercises.length).toBeGreaterThan(0)
      for (const exercise of workout.exercises) {
        expect(exercise.name).toBeDefined()
        expect(exercise.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}$/)
        expect(exercise.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[a-zA-Z0-9_-]{11}/)
        expect(exercise.imageUrl).toMatch(/^(https:\/\/img\.youtube\.com\/vi\/[a-zA-Z0-9_-]{11}\/hqdefault\.jpg|\/images\/exercises\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp))$/)
      }
    }
  })

  it('correctly handles Phase 3 Hypertrophy macrocycle with strength-cardio blend metadata', async () => {
    const plan = await generateMasterNasmOptProgram({
      clientName: 'Sarah Connor',
      clientAge: 32,
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
      equipmentAccess: ['barbell', 'dumbbell', 'cable', 'bench', 'pull-up bar', 'bodyweight'],
    })

    expect(plan.nasmOptPhase).toBe(3)
    expect(plan.phaseName).toBe('Muscular Development (Hypertrophy)')
    expect(plan.workouts.length).toBe(4)
    expect(plan.strengthCardioBlendSummary).toBeDefined()
    expect(plan.strengthCardioBlendSummary.strengthPct).toBe(80)
    expect(plan.strengthCardioBlendSummary.cardioPct).toBe(20)

    // Check all workouts
    const allExercises = plan.workouts.flatMap(w => w.exercises)
    expect(allExercises.every(e => Boolean(e.videoUrl && e.embedUrl && e.imageUrl))).toBe(true)
  })

  it('enriches any external plan with verified NASM CDN thumbnails and embed players', () => {
    const basePlan = generateRagNasmProgram({
      goal: 'performance',
      targetNasmPhase: 5,
      trainingDaysPerWeek: 3,
    })

    const enriched = enrichPlanWithNasmCdnMedia(basePlan)
    for (const workout of enriched.workouts) {
      for (const ex of workout.exercises) {
        expect(ex.videoUrl).toBeDefined()
        expect(ex.embedUrl).toBeDefined()
        expect(ex.imageUrl).toBeDefined()
      }
    }
  })

  it('guarantees runners knee contraindication replaces Walking Lunge with Reverse Lunge under home equipment constraints', async () => {
    const plan = await generateMasterNasmOptProgram({
      clientName: 'Lisa Gordon',
      clientAge: 55,
      clientSex: 'female',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 2,
      equipmentAccess: ['Dumbbells', 'Resistance Bands', 'Bodyweight', 'Foam Roller', 'Stability Ball'],
      injuriesLimitations: "Knee pain trouble with lunges; diagnosed with runner's knee (patellofemoral pain syndrome)",
      contraindicationTags: ['runners_knee', 'patellofemoral_pain_syndrome'],
    })

    expect(plan.sessionsPerWeek).toBe(2)
    expect(plan.workouts.length).toBe(2)

    // Check all exercises across both days
    const allExercises = plan.workouts.flatMap(w => w.exercises)
    const walkingLunges = allExercises.filter(e => e.name.toLowerCase().includes('walking lunge'))
    expect(walkingLunges.length).toBe(0)

    const day2 = plan.workouts[1]
    const safeLunge = day2.exercises.find(e =>
      e.name.toLowerCase().includes('reverse lunge') ||
      e.name.toLowerCase().includes('step-up to low box')
    )
    expect(safeLunge).toBeDefined()
    expect(safeLunge?.name).toContain('Reverse Lunge with Torso Lean')
  })

  it('synthesizes deep personalized program for Jennifer Rainville with burpees, exclusions, hand portions, and briefing memo', async () => {
    const plan = await generateMasterNasmOptProgram({
      clientName: 'Jennifer Rainville',
      clientAge: 34,
      clientSex: 'female',
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      experienceLevel: 'intermediate',
      equipmentAccess: ['Reebok Step', 'Dumbbells', 'Band or Tube', 'Foam Roller', 'Stability Ball', 'Bodyweight'],
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'flexible',
        targetSessionDurationMins: 42,
      },
      movementSuperpowers: ['burpees'],
      strictExclusions: ['mountain_climbers', 'running'],
      functionalDemands: 'Helping elderly father on weekends with lifting, carrying, and household chores',
      nutritionPhilosophy: 'precision_nutrition_hand_portion',
      dualCardioSplit: {
        sweatyFinisherModality: 'Reebok Step Bench Finisher',
        freshNeatWalkingMins: 25,
        freshNeatWalkingNotes: 'Walk to visit parents in clean fresh clothes without sweating',
      },
      coachGuidanceNotes: 'Custom Metabolic Strength & Step Conditioning Protocol for Jennifer Rainville.',
    })

    expect(plan.nasmOptPhase).toBe(2)
    expect(plan.workouts.length).toBe(3)

    // 1. Strict Exclusions: ZERO mountain climbers or running
    const allExercises = plan.workouts.flatMap(w => w.exercises)
    for (const ex of allExercises) {
      expect(ex.name.toLowerCase()).not.toContain('mountain climber')
      expect(ex.name.toLowerCase()).not.toContain('running')
    }

    // 2. Superpower: Burpees actively integrated
    const hasBurpees = allExercises.some(ex => ex.name.toLowerCase().includes('burpee'))
    expect(hasBurpees).toBe(true)

    // 3. Hand-Portion Nutrition Architecture generated
    expect(plan.handPortionPlan).toBeDefined()
    expect(plan.handPortionPlan?.philosophy).toBe('precision_nutrition_hand_portion')
    expect(plan.handPortionPlan?.guidelines.protein.handMeasure).toContain('Palm')
    expect(plan.handPortionPlan?.guidelines.vegetables.handMeasure).toContain('Closed fist')
    expect(plan.handPortionPlan?.guidelines.smartCarbs.handMeasure).toContain('Cupped hand')
    expect(plan.handPortionPlan?.guidelines.healthyFats.handMeasure).toContain('Entire thumb')
    expect(plan.handPortionPlan?.mindfulEatingCue).toContain('Hara Hachi Bu')

    // 4. Dual-Cardio Protocol generated
    expect(plan.dualCardioPlan).toBeDefined()
    expect(plan.dualCardioPlan?.sweatyFinisher.title).toContain('Reebok Step')
    expect(plan.dualCardioPlan?.freshNeatWalk?.title).toContain('Fresh Non-Sweaty Walking')

    // 5. Master Coach Gordon Briefing Memo
    expect(plan.clinicalRationale).toBeDefined()
    expect(plan.clinicalRationale).toContain('COACH GORDON MASTER BRIEFING MEMO:')
    expect(plan.clinicalRationale).toContain('Jennifer')
    expect(plan.clinicalRationale).toContain('BURPEE')
    expect(plan.clinicalRationale).toContain('MOUNTAIN CLIMBERS')
    expect(plan.clinicalRationale).toContain('HAND-PORTION')
    expect(plan.clinicalRationale).toContain('corner')
  })

  it('synthesizes deep personalized program for Scott Gordon with desk posture reversal, Phase 2 supersets, and blood pressure safeguards', async () => {
    const plan = await generateMasterNasmOptProgram({
      clientName: 'Scott Gordon',
      clientAge: 54,
      clientSex: 'male',
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 3,
      experienceLevel: 'intermediate',
      equipmentAccess: ['Bench', 'Dumbbells', 'Foam Roller', 'Medicine Ball', 'Stability Ball', 'Treadmill', 'Bodyweight'],
      lifestyleRhythm: {
        workStyle: 'sedentary_desk',
        dailyRhythm: 'flexible',
        targetSessionDurationMins: 40,
      },
      injuriesLimitations: 'Sedentary AI engineer (desk worker); prescription blood pressure medication (strict rhythmic breathing, avoid prolonged Valsalva); thoracic kyphosis and forward head posture',
      nutritionPhilosophy: 'macro_calorie_tracking',
      dualCardioSplit: {
        sweatyFinisherModality: 'Incline Treadmill Walk Flush',
        freshNeatWalkingMins: 20,
      },
    })

    expect(plan.nasmOptPhase).toBe(2)
    expect(plan.clinicalRationale).toBeDefined()
    expect(plan.clinicalRationale).toContain('Scott')
    expect(plan.clinicalRationale).toContain('DESK POSTURE')
    expect(plan.clinicalRationale).toContain('PHASE 2')
    expect(plan.clinicalRationale).toContain('contrast supersets')
    expect(plan.clinicalRationale).toContain('ORTHOPEDIC SHIELD')
  })
})

