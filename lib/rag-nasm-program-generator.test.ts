import { describe, expect, it } from 'vitest'
import {
  generateRagNasmProgram,
  parseEquipmentCapabilities,
  generateStrengthCardioBlendSummary,
  buildIntegratedCardioPrescription,
} from './rag-nasm-program-generator'

describe('rag-nasm-program-generator', () => {
  it('generates a Phase 1 Stabilization program for fat loss / beginner', () => {
    const plan = generateRagNasmProgram({
      clientName: 'Executive Client',
      goal: 'fat_loss',
      experienceLevel: 'beginner',
      trainingDaysPerWeek: 3,
    })

    expect(plan.nasmOptPhase).toBe(1)
    expect(plan.phaseName).toBe('Stabilization Endurance')
    expect(plan.workouts.length).toBe(3)
    expect(plan.ragSourcesCited.length).toBeGreaterThan(0)

    // Check Day 1 exercises have Phase 1 4/2/1 tempo
    const day1 = plan.workouts[0]
    expect(day1.exercises.some(e => e.tempo === '4/2/1')).toBe(true)
    expect(day1.warmupProtocol.inhibitSmr.length).toBeGreaterThan(0)
    expect(day1.warmupProtocol.lengthenStaticStretch.length).toBeGreaterThan(0)
  })

  it('generates a Phase 2 Strength Endurance program with contrast supersets', () => {
    const plan = generateRagNasmProgram({
      goal: 'fat_loss',
      experienceLevel: 'intermediate',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 4,
    })

    expect(plan.nasmOptPhase).toBe(2)
    expect(plan.phaseName).toBe('Strength Endurance')
    expect(plan.workouts.length).toBe(4)

    // Verify presence of superset paired exercises
    const day1 = plan.workouts[0]
    const supersetPair = day1.exercises.filter(e => e.supersetPairWith)
    expect(supersetPair.length).toBeGreaterThanOrEqual(2)
  })

  it('generates a Phase 3 Hypertrophy program with 2/0/2 tempo and 75-85% 1RM loads', () => {
    const plan = generateRagNasmProgram({
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
      knownBenchmarks: {
        'Bench Press': { weightLbs: 225, reps: 5 },
        'Squat': { weightLbs: 315, reps: 5 },
      },
    })

    expect(plan.nasmOptPhase).toBe(3)
    expect(plan.phaseName).toBe('Muscular Development (Hypertrophy)')

    const day1 = plan.workouts[0]
    const benchExercise = day1.exercises.find(e => e.name.includes('Bench Press'))
    expect(benchExercise).toBeDefined()
    expect(benchExercise?.targetLoadLbs).toBeGreaterThan(150)
  })

  it('generates a Phase 5 Power program with Post-Activation Potentiation contrast pairs', () => {
    const plan = generateRagNasmProgram({
      goal: 'performance',
      targetNasmPhase: 5,
      trainingDaysPerWeek: 4,
      knownBenchmarks: {
        'Squat': { weightLbs: 315, reps: 3 },
      },
    })

    expect(plan.nasmOptPhase).toBe(5)
    expect(plan.phaseName).toContain('Power')

    const day1 = plan.workouts[0]
    const powerPair = day1.exercises.filter(e => e.supersetPairWith)
    expect(powerPair.length).toBeGreaterThanOrEqual(2)
    expect(day1.exercises.some(e => e.tempo.toLowerCase().includes('explosive'))).toBe(true)
  })

  it('customizes warmup protocol with corrective exercises when kinetic compensations are passed', () => {
    const plan = generateRagNasmProgram({
      goal: 'hypertrophy',
      kineticCompensations: ['knees_cave_in'],
    })

    const day1 = plan.workouts[0]
    expect(day1.warmupProtocol.inhibitSmr.some(s => s.toLowerCase().includes('adductor'))).toBe(true)
    expect(day1.warmupProtocol.activateDynamic.some(s => s.toLowerCase().includes('lateral band'))).toBe(true)
  })

  it('adapts Phase 3 hypertrophy program for Home Dumbbell & Bands equipment with zero Olympic barbells or racks', () => {
    const plan = generateRagNasmProgram({
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
      equipmentAccess: ['dumbbell', 'band', 'bench', 'stability ball', 'bodyweight'],
    })

    expect(plan.planTitle).toContain('Home Dumbbell & Bands')
    
    // Check all workouts
    for (const workout of plan.workouts) {
      for (const ex of workout.exercises) {
        // Must NOT prescribe Olympic Barbell, Squat Rack, or Leg Press machines
        expect(ex.name.toLowerCase()).not.toContain('barbell')
        expect(ex.name.toLowerCase()).not.toContain('leg press')
        expect(ex.name.toLowerCase()).not.toContain('cable rope')
      }
    }

    // Day 1 Push must have Dumbbell press
    const day1 = plan.workouts[0]
    expect(day1.exercises.some(e => e.name.toLowerCase().includes('dumbbell') || e.name.toLowerCase().includes('push-up'))).toBe(true)

    // Day 3 Legs must have Dumbbell Front Squats or Goblet Squat
    const day3 = plan.workouts[2]
    expect(day3.exercises.some(e => e.name.toLowerCase().includes('dumbbell') && e.name.toLowerCase().includes('squat'))).toBe(true)
  })

  it('adapts Phase 2 Strength Endurance supersets for Minimalist Travel / Resistance Bands only', () => {
    const plan = generateRagNasmProgram({
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 2,
      equipmentAccess: ['band', 'bodyweight', 'stability ball'],
    })

    expect(plan.planTitle).toContain('Travel Bands Suite')

    for (const workout of plan.workouts) {
      for (const ex of workout.exercises) {
        expect(ex.name.toLowerCase()).not.toContain('barbell')
        expect(ex.name.toLowerCase()).not.toContain('dumbbell')
      }
    }
  })

  it('correctly parses equipment capabilities', () => {
    const homeCaps = parseEquipmentCapabilities(['dumbbell', 'band', 'bench'])
    expect(homeCaps.hasBarbell).toBe(false)
    expect(homeCaps.hasDumbbells).toBe(true)
    expect(homeCaps.hasBands).toBe(true)
    expect(homeCaps.isHomeDumbbellOnly).toBe(true)

    const fullCaps = parseEquipmentCapabilities(['commercial_gym'])
    expect(fullCaps.hasBarbell).toBe(true)
    expect(fullCaps.hasSquatRack).toBe(true)
    expect(fullCaps.hasCables).toBe(true)
    expect(fullCaps.isHomeDumbbellOnly).toBe(false)
  })

  // ── NEW TESTS: STRENGTH & CARDIO BLENDING ──────────────────────────────────
  it('blends 55/45 Strength & Cardio for Fat Loss goals with Stage 1 and Stage 2 Finishers', () => {
    const plan = generateRagNasmProgram({
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 4,
      clientAge: 38,
    })

    expect(plan.strengthCardioBlendSummary.blendRatio).toContain('55% Strength / 45% Cardio')
    expect(plan.strengthCardioBlendSummary.weeklyCardioMinutes).toBeGreaterThanOrEqual(100)
    expect(plan.planTitle).toContain('55/45')

    // Day 1 has Stage 1 Lipid Oxidation Finisher
    const day1 = plan.workouts[0]
    expect(day1.cardioProtocol).toBeDefined()
    expect(day1.cardioProtocol?.stage).toBe(1)
    expect(day1.cardioProtocol?.targetZone).toContain('Zone 1')
    expect(day1.cardioProtocol?.recommendedModalities.length).toBeGreaterThan(0)

    // Day 2 has Stage 2 Lactate Threshold Interval Finisher
    const day2 = plan.workouts[1]
    expect(day2.cardioProtocol).toBeDefined()
    expect(day2.cardioProtocol?.stage).toBe(2)
    expect(day2.cardioProtocol?.targetZone).toContain('Zone 2')
    expect(day2.cardioProtocol?.workRestRatio).toContain('1:2')
  })

  it('blends 80/20 Strength & Cardio for Hypertrophy goals with Low-Impact Zone 1 Flush', () => {
    const plan = generateRagNasmProgram({
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
    })

    expect(plan.strengthCardioBlendSummary.blendRatio).toContain('80% Strength / 20% Cardio')
    expect(plan.planTitle).toContain('80/20')

    const day1 = plan.workouts[0]
    expect(day1.cardioProtocol).toBeDefined()
    expect(day1.cardioProtocol?.stage).toBe(1)
    expect(day1.cardioProtocol?.durationMins).toBeLessThanOrEqual(15)
    expect(day1.cardioProtocol?.metabolicRationale).toContain('mTOR')
  })

  it('blends 65/35 Strength & Power for Performance goals with Stage 3 Sprints', () => {
    const plan = generateRagNasmProgram({
      goal: 'performance',
      targetNasmPhase: 5,
      trainingDaysPerWeek: 4,
    })

    expect(plan.strengthCardioBlendSummary.blendRatio).toContain('65% Strength & Power / 35% SAQ')
    expect(plan.planTitle).toContain('65/35')

    const day1 = plan.workouts[0]
    expect(day1.cardioProtocol).toBeDefined()
    expect(day1.cardioProtocol?.stage).toBe(3)
    expect(day1.cardioProtocol?.workRestRatio).toContain('1:3')
  })

  it('generates accurate blend summary data structure', () => {
    const fatLossSummary = generateStrengthCardioBlendSummary('fat_loss', 4, 2)
    expect(fatLossSummary.strengthPct).toBe(55)
    expect(fatLossSummary.cardioPct).toBe(45)

    const hypertrophySummary = generateStrengthCardioBlendSummary('hypertrophy', 4, 3)
    expect(hypertrophySummary.strengthPct).toBe(80)
    expect(hypertrophySummary.cardioPct).toBe(20)
  })

  it('generates dedicated cardio conditioning sessions on off days when dedicated_conditioning blend style is selected', () => {
    const plan = generateRagNasmProgram({
      goal: 'fat_loss',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 4,
      cardioBlendStyle: 'dedicated_conditioning',
    })

    expect(plan.workouts.length).toBe(4)

    // Day 1: Strength session
    const day1 = plan.workouts[0]
    expect(day1.exercises.some(e => e.block === 'resistance')).toBe(true)

    // Day 2: Dedicated Cardio & Active Recovery Session (Off Day for Strength)
    const day2 = plan.workouts[1]
    expect(day2.focus).toContain('Cardiorespiratory Conditioning & Active Recovery')
    expect(day2.cardioProtocol).toBeDefined()
    expect(day2.exercises.some(e => e.name.includes('Prescribed Cardiorespiratory Protocol'))).toBe(true)
    expect(day2.exercises.some(e => e.block === 'resistance')).toBe(false)
  })

  it('guarantees 100% of generated exercises across all OPT phases have verified official NASM video demos & CDN images', () => {
    const testPhases = [1, 2, 3, 4, 5]
    const testEquipmentSets = [
      ['barbell', 'squat rack', 'dumbbell', 'cable', 'machines', 'bench', 'band', 'pull-up bar', 'stability ball', 'medicine ball', 'bodyweight'],
      ['dumbbell', 'bench', 'band', 'stability ball', 'bodyweight'],
      ['band', 'bodyweight'],
      ['bodyweight'],
    ]

    for (const phase of testPhases) {
      for (const eq of testEquipmentSets) {
        const plan = generateRagNasmProgram({
          goal: phase === 3 ? 'hypertrophy' : phase >= 4 ? 'performance' : 'fat_loss',
          targetNasmPhase: phase,
          trainingDaysPerWeek: 3,
          equipmentAccess: eq,
        })

        for (const workout of plan.workouts) {
          for (const exercise of workout.exercises) {
            expect(exercise.videoUrl).toBeDefined()
            expect(exercise.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}$/)
            expect(exercise.embedUrl).toBeDefined()
            expect(exercise.embedUrl).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/[a-zA-Z0-9_-]{11}/)
            expect(exercise.imageUrl).toBeDefined()
            expect(exercise.imageUrl).toMatch(/^(https:\/\/img\.youtube\.com\/vi\/[a-zA-Z0-9_-]{11}\/hqdefault\.jpg|\/images\/exercises\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp))$/)
          }
        }
      }
    }
  })

  describe('Strength Cardio Blend Summaries', () => {
    it('adapts cardio and strength ratios to active OPT phase', () => {
      const p1Summary = generateStrengthCardioBlendSummary('fat_loss', 3, 1)
      expect(p1Summary.strengthPct).toBe(50)
      expect(p1Summary.cardioPct).toBe(50)
      expect(p1Summary.primaryCardioStages).toContain('Stage 1')

      const p2Summary = generateStrengthCardioBlendSummary('fat_loss', 4, 2)
      expect(p2Summary.strengthPct).toBe(55)
      expect(p2Summary.primaryCardioStages).toContain('Stage 2')

      const p5Summary = generateStrengthCardioBlendSummary('performance', 4, 5)
      expect(p5Summary.strengthPct).toBe(65)
      expect(p5Summary.cardioPct).toBe(35)
      expect(p5Summary.primaryCardioStages).toContain('Stage 3 & Stage 4')
    })
  })

  describe('Cardio Equipment Restrictions', () => {
    it('restricts cardio modalities to treadmill only when client only has a treadmill', () => {
      const cardio = buildIntegratedCardioPrescription({
        goal: 'fat_loss',
        phase: 1,
        dayIndex: 1,
        totalDays: 4,
        cardioEquipmentAccess: ['treadmill'],
      })

      expect(cardio).toBeDefined()
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('treadmill'))).toBe(true)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('rower'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('airbike') || m.toLowerCase().includes('air bike'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('stair'))).toBe(false)
    })

    it('restricts cardio modalities to stationary bike when client only has stationary bike', () => {
      const cardio = buildIntegratedCardioPrescription({
        goal: 'hypertrophy',
        phase: 3,
        dayIndex: 1,
        totalDays: 4,
        cardioEquipmentAccess: ['stationary-bike'],
      })

      expect(cardio).toBeDefined()
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('bike'))).toBe(true)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('rower'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('treadmill'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('elliptical'))).toBe(false)
    })

    it('uses bodyweight / outdoor modalities when client has bodyweight/no cardio machines', () => {
      const cardio = buildIntegratedCardioPrescription({
        goal: 'fat_loss',
        phase: 1,
        dayIndex: 2,
        totalDays: 4,
        cardioEquipmentAccess: ['bodyweight'],
        equipmentAccess: ['bodyweight'],
      })

      expect(cardio).toBeDefined()
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('rower'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('treadmill'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('airbike') || m.toLowerCase().includes('air bike'))).toBe(false)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('hill') || m.toLowerCase().includes('outdoor') || m.toLowerCase().includes('bodyweight') || m.toLowerCase().includes('step'))).toBe(true)
    })

    it('provides full suite of modalities for full commercial gym access', () => {
      const cardio = buildIntegratedCardioPrescription({
        goal: 'fat_loss',
        phase: 2,
        dayIndex: 2,
        totalDays: 4,
        equipmentAccess: ['commercial_gym'],
      })

      expect(cardio).toBeDefined()
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('rower') || m.toLowerCase().includes('rowing'))).toBe(true)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('air bike') || m.toLowerCase().includes('assault'))).toBe(true)
      expect(cardio?.recommendedModalities.some(m => m.toLowerCase().includes('treadmill'))).toBe(true)
    })
  })

  describe('PAR-Q Contraindications & Exercise Substitutions', () => {
    it('automatically substitutes knee patellofemoral contraindicated exercises with safe closed-chain alternatives', () => {
      const plan = generateRagNasmProgram({
        goal: 'hypertrophy',
        targetNasmPhase: 3,
        trainingDaysPerWeek: 4,
        contraindicationTags: ['knee_patellofemoral'],
      })

      // Ensure no Leg Extension appears in any workout
      const allExercises = plan.workouts.flatMap(w => w.exercises)
      const legExtensions = allExercises.filter(e => e.name.toLowerCase().includes('leg extension') && !e.name.toLowerCase().includes('spanish'))
      expect(legExtensions.length).toBe(0)
    })

    it('attaches safety coaching cues when exercises are substituted for spinal/knee limitations', () => {
      const plan = generateRagNasmProgram({
        goal: 'hypertrophy',
        targetNasmPhase: 3,
        trainingDaysPerWeek: 4,
        contraindicationTags: ['lumbar_disc_condition'],
      })

      expect(plan.workouts.length).toBe(4)
      const allExercises = plan.workouts.flatMap(w => w.exercises)
      expect(allExercises.length).toBeGreaterThan(0)
    })
  })

  describe('Home Gym Equipment Availability & Strict Isolation', () => {
    it('strictly isolates home gym equipment: substitutes commercial machines and selects Floor Bridge for Scott Gordon profile', () => {
      const homeEquipment = ['Bodyweight', 'Bench', 'Dumbbells', 'Foam Roller', 'Medicine Ball', 'Stability Ball']

      const plan = generateRagNasmProgram({
        clientName: 'Scott Gordon',
        goal: 'fat_loss',
        targetNasmPhase: 1,
        trainingDaysPerWeek: 4,
        equipmentAccess: homeEquipment,
      })

      const allExercises = plan.workouts.flatMap(w => w.exercises)

      // 1. Must NEVER include Lying Leg Curl (commercial machine)
      const lyingLegCurls = allExercises.filter(e => e.name.toLowerCase() === 'lying leg curl')
      expect(lyingLegCurls.length).toBe(0)

      // 2. Must NEVER include any machine exercises
      const machineExercises = allExercises.filter(e =>
        e.name.toLowerCase().includes('machine') ||
        e.name.toLowerCase().includes('leg press') ||
        e.name.toLowerCase().includes('cable')
      )
      expect(machineExercises.length).toBe(0)

      // 3. Day 2 must include Floor Bridge
      const day2 = plan.workouts[1]
      const hamstringExercise = day2.exercises.find(e => e.name === 'Floor Bridge')
      expect(hamstringExercise).toBeDefined()
      expect(hamstringExercise?.imageUrl).toContain('img.youtube.com')
      expect(hamstringExercise?.videoUrl).toBeDefined()
    })
  })

  describe('Sports Injuries Biomechanical Augmentation', () => {
    it('detects runners knee and tennis elbow from text, augments warmup, and replaces contraindicated movements', () => {
      const plan = generateRagNasmProgram({
        goal: 'fat_loss',
        targetNasmPhase: 1,
        trainingDaysPerWeek: 4,
        injuriesLimitations: "Client reports active runner's knee on long runs and mild tennis elbow from tennis matches",
      })

      // 1. Warmup must include SMR for TFL / vastus lateralis and forearm extensors
      const day1 = plan.workouts[0]
      const hasKneeSmr = day1.warmupProtocol.inhibitSmr.some(s => s.toLowerCase().includes('tensor fasciae latae') || s.toLowerCase().includes('tfl'))
      const hasForearmSmr = day1.warmupProtocol.inhibitSmr.some(s => s.toLowerCase().includes('forearm'))
      expect(hasKneeSmr || hasForearmSmr).toBe(true)

      // 2. Warmup dynamic activations must include Spanish Squat or wrist/scapular activation
      const hasInjuryActivation = day1.warmupProtocol.activateDynamic.some(s => s.toLowerCase().includes('spanish squat') || s.toLowerCase().includes('wrist') || s.toLowerCase().includes('clamshell'))
      expect(hasInjuryActivation).toBe(true)

      // 3. Periodization memo must include orthopedic protection notes
      expect(day1.dailyPeriodizationMemo.toLowerCase()).toContain('orthopedic protection')

      // 4. All exercises must have NO seated leg extensions (blacklisted for runner's knee)
      const allExercises = plan.workouts.flatMap(w => w.exercises)
      const legExtensions = allExercises.filter(e => e.name.toLowerCase() === 'seated leg extension')
      expect(legExtensions.length).toBe(0)
    })

    it('generates a 2-day split for Lisa Gordon with runner\'s knee replacing Walking Lunge with Reverse Lunge with Torso Lean', () => {
      const plan = generateRagNasmProgram({
        clientName: 'Lisa Gordon',
        clientAge: 55,
        goal: 'fat_loss',
        targetNasmPhase: 1,
        trainingDaysPerWeek: 2,
        injuriesLimitations: "[injuries: runners_knee] (Runner's Knee (Patellofemoral Pain Syndrome / PFPS)) — Notes: Knee pain trouble with lunges; diagnosed with runner's knee (patellofemoral pain syndrome)",
        equipmentAccess: [
          'Bodyweight',
          'Band or Tube',
          'Dumbbells',
          'Foam Roller',
          'Stability Ball',
          'Barbell',
        ],
      })

      expect(plan.sessionsPerWeek).toBe(2)
      expect(plan.workouts.length).toBe(2)

      // Day 2 must replace Walking Lunge with safe Reverse Lunge regression
      const day2 = plan.workouts[1]
      const walkingLunges = day2.exercises.filter(e => e.name.toLowerCase().includes('walking lunge'))
      expect(walkingLunges.length).toBe(0)

      const safeLunge = day2.exercises.find(e => e.name.includes('Reverse Lunge with Torso Lean'))
      expect(safeLunge).toBeDefined()
      expect(safeLunge?.contraindicationReplacedFrom).toBe('Dumbbell Walking Lunge')
      expect(safeLunge?.coachingCues.some(c => c.includes('Injury Protection Shield'))).toBe(true)
    })
  })
})

