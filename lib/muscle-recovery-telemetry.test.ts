import { describe, expect, it } from 'vitest'
import {
  calculateMuscleRecoveryTelemetry,
  getAgeRecoveryMultiplier,
  getConditioningRecoveryMultiplier,
  getSexRecoveryMultiplier,
  getRecoveryColorHex,
  mapExerciseToMuscleZones,
  extractMuscleStrainsFromWorkoutLogs,
  resolveClientConditioningTier,
  parseParqMedicationsAndConditions,
  getGoalRecommendedRecoverySupplements,
  screenRecoverySupplementsForContraindications,
  type MuscleTrainingStrain,
} from './muscle-recovery-telemetry'

describe('muscle-recovery-telemetry', () => {
  it('calculates full recovery (100% readiness, emerald green) when no muscle strain is recorded', () => {
    const res = calculateMuscleRecoveryTelemetry({
      age: 32,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: [],
      strains: [],
    })

    expect(res.overallBodyReadinessScore).toBe(100)
    expect(res.muscles.chest.recoveryPercentage).toBe(100)
    expect(res.muscles.chest.colorHex).toBe('#10B981')
    expect(res.muscles.chest.colorTier).toBe('emerald_green')
    expect(res.muscles.chest.hoursRemaining).toBe(0)
  })

  it('calculates severe fatigue (crimson red) immediately after heavy leg session', () => {
    const res = calculateMuscleRecoveryTelemetry({
      age: 35,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: [],
      strains: [
        {
          muscleId: 'quadriceps',
          hoursElapsedSinceSession: 6,
          totalSetsPerformed: 6,
          averageRpe: 9,
          eccentricTempoMultiplier: 1.2,
        },
      ],
    })

    const quads = res.muscles.quadriceps
    expect(quads.recoveryPercentage).toBeLessThanOrEqual(25)
    expect(quads.colorHex).toBe('#DC2626')
    expect(quads.colorTier).toBe('dark_red')
    expect(quads.hoursRemaining).toBeGreaterThan(50)
    expect(quads.readinessRating).toBe('Severely Fatigued')
  })

  it('accelerates recovery hours significantly when multi-compound supplement stack is applied', () => {
    const withoutSupps = calculateMuscleRecoveryTelemetry({
      age: 45,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: [],
      strains: [
        {
          muscleId: 'chest',
          hoursElapsedSinceSession: 24,
          totalSetsPerformed: 5,
          averageRpe: 8,
        },
      ],
    })

    const withSupps = calculateMuscleRecoveryTelemetry({
      age: 45,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: ['tart_cherry', 'whey_leucine', 'creatine', 'omega3', 'magnesium'],
      strains: [
        {
          muscleId: 'chest',
          hoursElapsedSinceSession: 24,
          totalSetsPerformed: 5,
          averageRpe: 8,
        },
      ],
    })

    expect(withSupps.netRecoverySpeedBonusPercentage).toBe(45) // Capped at 45%
    expect(withSupps.muscles.chest.hoursRemaining).toBeLessThan(withoutSupps.muscles.chest.hoursRemaining)
    expect(withSupps.muscles.chest.recoveryPercentage).toBeGreaterThan(withoutSupps.muscles.chest.recoveryPercentage)
  })

  it('correctly calculates age-based recovery multipliers', () => {
    expect(getAgeRecoveryMultiplier(25)).toBe(1.0)
    expect(getAgeRecoveryMultiplier(42)).toBe(1.15)
    expect(getAgeRecoveryMultiplier(55)).toBe(1.25)
    expect(getAgeRecoveryMultiplier(68)).toBe(1.38)
    expect(getAgeRecoveryMultiplier(75)).toBe(1.5)
  })

  it('calculates sex-differentiated metabolic clearance multipliers', () => {
    expect(getSexRecoveryMultiplier('female')).toBe(0.94)
    expect(getSexRecoveryMultiplier('male')).toBe(1.0)
  })

  it('calculates conditioning level multipliers', () => {
    expect(getConditioningRecoveryMultiplier('beginner')).toBe(1.3)
    expect(getConditioningRecoveryMultiplier('intermediate')).toBe(1.0)
    expect(getConditioningRecoveryMultiplier('advanced')).toBe(0.85)
    expect(getConditioningRecoveryMultiplier('elite')).toBe(0.75)
  })

  it('maps recovery percentage ranges to 4 distinct color tiers and status descriptions', () => {
    expect(getRecoveryColorHex(15).colorTier).toBe('dark_red')
    expect(getRecoveryColorHex(40).colorTier).toBe('amber')
    expect(getRecoveryColorHex(70).colorTier).toBe('yellow')
    expect(getRecoveryColorHex(95).colorTier).toBe('emerald_green')
  })

  it('correctly maps exercises to primary and secondary muscle zones', () => {
    const bench = mapExerciseToMuscleZones('Barbell Flat Bench Press')
    expect(bench.primary).toContain('chest')
    expect(bench.secondary).toContain('triceps')
    expect(bench.secondary).toContain('deltoids_anterior')

    const squat = mapExerciseToMuscleZones('Barbell Back Squat')
    expect(squat.primary).toContain('quadriceps')
    expect(squat.secondary).toContain('gluteals')

    const rdl = mapExerciseToMuscleZones('Romanian Deadlift (RDL)')
    expect(rdl.primary).toContain('hamstrings')
    expect(rdl.primary).toContain('erector_spinae')

    const latPull = mapExerciseToMuscleZones('Wide-Grip Lat Pulldown')
    expect(latPull.primary).toContain('latissimus_dorsi')
    expect(latPull.secondary).toContain('biceps')
  })

  it('ingests real workout set logs and accurately calculates hours elapsed and accumulated strain', () => {
    const fixedNow = new Date('2026-08-27T12:00:00Z').getTime()
    const sessionYesterday = new Date('2026-08-26T12:00:00Z').toISOString() // 24 hours ago

    const workoutSetLogs = [
      { session_date: sessionYesterday, exercise_name: 'Incline Dumbbell Press', set_number: 1, reps: 10, rpe: 8.5 },
      { session_date: sessionYesterday, exercise_name: 'Incline Dumbbell Press', set_number: 2, reps: 10, rpe: 9.0 },
      { session_date: sessionYesterday, exercise_name: 'Incline Dumbbell Press', set_number: 3, reps: 8, rpe: 9.0 },
      { session_date: sessionYesterday, exercise_name: 'Cable Tricep Pushdown', set_number: 1, reps: 12, rpe: 8.0 },
      { session_date: sessionYesterday, exercise_name: 'Cable Tricep Pushdown', set_number: 2, reps: 12, rpe: 8.5 },
    ]

    const extracted = extractMuscleStrainsFromWorkoutLogs({
      workoutSetLogs,
      referenceDate: fixedNow,
      hoursOffset: 0,
    })

    expect(extracted.totalSetsAnalyzed).toBe(5)
    expect(extracted.strains.length).toBeGreaterThan(0)

    const chestStrain = extracted.strains.find((s: MuscleTrainingStrain) => s.muscleId === 'chest')
    expect(chestStrain).toBeDefined()
    expect(chestStrain?.totalSetsPerformed).toBe(3)
    expect(chestStrain?.hoursElapsedSinceSession).toBeCloseTo(24, 0)
    expect(chestStrain?.averageRpe).toBeCloseTo(8.8, 1)

    const chestLoggedInfo = extracted.muscleLastTrained.chest
    expect(chestLoggedInfo?.exerciseName).toBe('Incline Dumbbell Press')
    expect(chestLoggedInfo?.hoursAgo).toBe(24)
  })

  it('accurately resolves muscle recovery over time from fatigued to supercompensated', () => {
    const fixedNow = new Date('2026-08-27T12:00:00Z').getTime()
    const sessionDate = new Date('2026-08-27T08:00:00Z').toISOString() // 4 hours ago

    const workoutSetLogs = [
      { session_date: sessionDate, exercise_name: 'Barbell Flat Bench Press', set_number: 1, reps: 8, rpe: 9 },
      { session_date: sessionDate, exercise_name: 'Barbell Flat Bench Press', set_number: 2, reps: 8, rpe: 9 },
      { session_date: sessionDate, exercise_name: 'Barbell Flat Bench Press', set_number: 3, reps: 8, rpe: 9.5 },
      { session_date: sessionDate, exercise_name: 'Barbell Flat Bench Press', set_number: 4, reps: 6, rpe: 10 },
    ]

    // 1. Immediately post-workout (+0h = 4h elapsed) -> Severe Fatigue (Crimson Red / Amber)
    const at4h = extractMuscleStrainsFromWorkoutLogs({ workoutSetLogs, referenceDate: fixedNow, hoursOffset: 0 })
    const telemetry4h = calculateMuscleRecoveryTelemetry({
      age: 35,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: [],
      strains: at4h.strains,
    })
    expect(telemetry4h.muscles.chest.recoveryPercentage).toBeLessThan(25)
    expect(telemetry4h.muscles.chest.colorTier).toBe('dark_red')
    expect(telemetry4h.muscles.chest.hoursRemaining).toBeGreaterThan(50)

    // 2. Advance time +24 hours (+24h = 28h elapsed) -> Rebuilding (Amber / Yellow)
    const at28h = extractMuscleStrainsFromWorkoutLogs({ workoutSetLogs, referenceDate: fixedNow, hoursOffset: 24 })
    const telemetry28h = calculateMuscleRecoveryTelemetry({
      age: 35,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: [],
      strains: at28h.strains,
    })
    expect(telemetry28h.muscles.chest.recoveryPercentage).toBeGreaterThanOrEqual(35)
    expect(telemetry28h.muscles.chest.hoursRemaining).toBeLessThan(telemetry4h.muscles.chest.hoursRemaining)

    // 3. Advance time +72 hours (+72h = 76h elapsed) -> Full Supercompensation (Emerald Green, 100%)
    const at76h = extractMuscleStrainsFromWorkoutLogs({ workoutSetLogs, referenceDate: fixedNow, hoursOffset: 72 })
    const telemetry76h = calculateMuscleRecoveryTelemetry({
      age: 35,
      sex: 'male',
      conditioning: 'intermediate',
      activeSupplements: [],
      strains: at76h.strains,
    })
    expect(telemetry76h.muscles.chest.recoveryPercentage).toBe(100)
    expect(telemetry76h.muscles.chest.colorHex).toBe('#10B981')
    expect(telemetry76h.muscles.chest.colorTier).toBe('emerald_green')
    expect(telemetry76h.muscles.chest.hoursRemaining).toBe(0)
    expect(telemetry76h.muscles.chest.readinessRating).toBe('Fully Primed')
  })

  describe('resolveClientConditioningTier', () => {
    it('automatically resolves conditioning tier from client profile experience_level', () => {
      expect(resolveClientConditioningTier({ experience_level: 'beginner' })).toBe('beginner')
      expect(resolveClientConditioningTier({ experience_level: 'intermediate' })).toBe('intermediate')
      expect(resolveClientConditioningTier({ experience_level: 'advanced' })).toBe('advanced')
      expect(resolveClientConditioningTier({ experience_level: 'elite' })).toBe('elite')
    })

    it('resolves tier from activity_level when experience_level is not provided', () => {
      expect(resolveClientConditioningTier({ activity_level: 'sedentary' })).toBe('beginner')
      expect(resolveClientConditioningTier({ activity_level: 'athlete' })).toBe('advanced')
      expect(resolveClientConditioningTier({ activity_level: 'very_active' })).toBe('advanced')
    })

    it('resolves tier from NASM OPT phase when profile fields are missing', () => {
      expect(resolveClientConditioningTier(null, { nasm_opt_phase: 1 })).toBe('beginner')
      expect(resolveClientConditioningTier(null, { nasm_opt_phase: 2 })).toBe('intermediate')
      expect(resolveClientConditioningTier(null, { nasm_opt_phase: 4 })).toBe('advanced')
      expect(resolveClientConditioningTier(null, { nasm_opt_phase: 5 })).toBe('elite')
    })

    it('falls back to intermediate when inputs are empty or ambiguous', () => {
      expect(resolveClientConditioningTier(null, null)).toBe('intermediate')
      expect(resolveClientConditioningTier({}, null)).toBe('intermediate')
    })
  })

  describe('parseParqMedicationsAndConditions', () => {
    it('detects antihypertensives from PAR-Q question 6 and blood pressure meds', () => {
      const parqWithQ6 = parseParqMedicationsAndConditions({ takesBloodPressureOrHeartMedication: true })
      expect(parqWithQ6.takingAntihypertensives).toBe(true)
      expect(parqWithQ6.hasHypertension).toBe(true)

      const textWithLisinopril = parseParqMedicationsAndConditions(null, 'Lisinopril 10mg once daily')
      expect(textWithLisinopril.takingAntihypertensives).toBe(true)
      expect(textWithLisinopril.detectedMedicationCategories).toContain('Antihypertensives & Cardiovascular')
    })

    it('detects anticoagulants / blood thinners from free-text medications', () => {
      const eliquis = parseParqMedicationsAndConditions(null, 'Eliquis 5mg twice daily')
      expect(eliquis.takingAnticoagulants).toBe(true)
      expect(eliquis.takingBloodThinners).toBe(true)
      expect(eliquis.detectedMedicationCategories).toContain('Anticoagulants / Blood Thinners')

      const warfarin = parseParqMedicationsAndConditions(null, 'Warfarin 5mg daily for DVT')
      expect(warfarin.takingAnticoagulants).toBe(true)

      const dailyAspirin = parseParqMedicationsAndConditions(null, 'Baby aspirin 81mg daily cardio regimen')
      expect(dailyAspirin.takingAnticoagulants).toBe(true)
    })

    it('detects thyroid, statins, antidepressants, diabetes meds, and kidney conditions', () => {
      const thyroid = parseParqMedicationsAndConditions(null, 'Levothyroxine 75mcg')
      expect(thyroid.takingThyroidHormone).toBe(true)

      const statin = parseParqMedicationsAndConditions(null, 'Atorvastatin 20mg')
      expect(statin.takingStatins).toBe(true)

      const ssri = parseParqMedicationsAndConditions(null, 'Zoloft 50mg')
      expect(ssri.takingAntidepressants).toBe(true)

      const diabetes = parseParqMedicationsAndConditions(null, 'Metformin 500mg and Ozempic')
      expect(diabetes.takingDiabetesMedications).toBe(true)

      const renal = parseParqMedicationsAndConditions(null, null, 'Stage 3 chronic kidney disease')
      expect(renal.hasKidneyCondition).toBe(true)
      expect(renal.detectedMedicationCategories).toContain('Renal / Kidney Impairment')
    })
  })

  describe('getGoalRecommendedRecoverySupplements', () => {
    it('returns power & strength recovery stack for athletic power goal', () => {
      const supps = getGoalRecommendedRecoverySupplements('Maximal Strength & Athletic Power')
      expect(supps).toContain('creatine')
      expect(supps).toContain('whey_leucine')
      expect(supps).toContain('magnesium')
      expect(supps).toContain('tart_cherry')
      expect(supps).toContain('collagen')
    })

    it('returns lean preservation & anti-inflammatory stack for fat loss goal', () => {
      const supps = getGoalRecommendedRecoverySupplements('Fat Loss & Conditioning')
      expect(supps).toContain('whey_leucine')
      expect(supps).toContain('magnesium')
      expect(supps).toContain('omega3')
      expect(supps).toContain('tart_cherry')
    })

    it('returns mitochondrial & joint longevity stack for longevity goal', () => {
      const supps = getGoalRecommendedRecoverySupplements('Longevity & Vitality')
      expect(supps).toContain('ubiquinol')
      expect(supps).toContain('omega3')
      expect(supps).toContain('magnesium')
      expect(supps).toContain('tart_cherry')
      expect(supps).toContain('collagen')
    })

    it('returns hypertrophy muscle building stack for muscle building goal', () => {
      const supps = getGoalRecommendedRecoverySupplements('Hypertrophy & Muscular Development')
      expect(supps).toContain('whey_leucine')
      expect(supps).toContain('creatine')
      expect(supps).toContain('magnesium')
      expect(supps).toContain('omega3')
    })
  })

  describe('screenRecoverySupplementsForContraindications', () => {
    it('strictly withholds Tart Cherry and high-dose Omega-3 for clients on Anticoagulants (Blood Thinners)', () => {
      const candidateSupps = getGoalRecommendedRecoverySupplements('Longevity & Vitality')
      expect(candidateSupps).toContain('tart_cherry')
      expect(candidateSupps).toContain('omega3')

      const screened = screenRecoverySupplementsForContraindications(candidateSupps, {
        takingAnticoagulants: true,
      })

      expect(screened.allowedSupplements).not.toContain('tart_cherry')
      expect(screened.allowedSupplements).not.toContain('omega3')
      expect(screened.contraindicatedSupplements.some(c => c.key === 'tart_cherry')).toBe(true)
      expect(screened.contraindicatedSupplements.some(c => c.key === 'omega3')).toBe(true)
      expect(screened.contraindicatedSupplements[0].medicationCategory).toContain('Anticoagulant')
    })

    it('strictly withholds Creatine and high-protein Whey for clients with Kidney/Renal impairment', () => {
      const candidateSupps = getGoalRecommendedRecoverySupplements('Athletic Power')
      expect(candidateSupps).toContain('creatine')
      expect(candidateSupps).toContain('whey_leucine')

      const screened = screenRecoverySupplementsForContraindications(candidateSupps, {
        hasKidneyCondition: true,
      })

      expect(screened.allowedSupplements).not.toContain('creatine')
      expect(screened.allowedSupplements).not.toContain('whey_leucine')
      expect(screened.contraindicatedSupplements.some(c => c.key === 'creatine')).toBe(true)
      expect(screened.contraindicatedSupplements.some(c => c.key === 'whey_leucine')).toBe(true)
    })

    it('enforces chrono-separation guidance for clients on Thyroid Hormone replacement (Levothyroxine)', () => {
      const candidateSupps = getGoalRecommendedRecoverySupplements('General Health')
      const screened = screenRecoverySupplementsForContraindications(candidateSupps, {
        takingThyroidHormone: true,
      })

      expect(screened.chronoSeparationNotes.some(n => n.key === 'magnesium')).toBe(true)
      expect(screened.chronoSeparationNotes.some(n => n.note.includes('4-Hour Separation'))).toBe(true)
    })

    it('strictly withholds Magnesium for clients currently taking oral antibiotics', () => {
      const candidateSupps = ['magnesium', 'whey_leucine'] as const
      const screened = screenRecoverySupplementsForContraindications([...candidateSupps], {
        takingOralAntibiotics: true,
      })

      expect(screened.allowedSupplements).not.toContain('magnesium')
      expect(screened.allowedSupplements).toContain('whey_leucine')
      expect(screened.contraindicatedSupplements.some(c => c.key === 'magnesium')).toBe(true)
    })

    it('permits all supplements for clients with clean PAR-Q and no medications', () => {
      const candidateSupps = getGoalRecommendedRecoverySupplements('Athletic Power')
      const screened = screenRecoverySupplementsForContraindications(candidateSupps, {})

      expect(screened.allowedSupplements).toEqual(candidateSupps)
      expect(screened.contraindicatedSupplements.length).toBe(0)
    })
  })
})
