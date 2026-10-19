import { describe, it, expect } from 'vitest'
import {
  calculateMuscleRecoveryTelemetry,
  getAgeRecoveryMultiplier,
  getConditioningRecoveryMultiplier,
  getRecoveryColorHex,
  mapExerciseToMuscleZones,
  extractMuscleStrainsFromWorkoutLogs,
  resolveClientConditioningTier,
  screenRecoverySupplementsForContraindications,
  parseParqMedicationsAndConditions,
  SUPPLEMENT_RECOVERY_EFFECTS,
  type MuscleZoneId,
  type RecoverySupplementKey,
  type MuscleTrainingStrain,
} from '@/lib/muscle-recovery-telemetry'
import { MUSCLE_TARGET_COORDINATES } from '@/components/fitness/MuscleRecoveryHeatmap3D'

describe('MuscleRecoveryHeatmap3D & Biomechanical Supercompensation Engine (Tool #14)', () => {
  describe('Kinetic Muscle Anatomy & Zone Mapping', () => {
    it('correctly maps compound exercises to primary and secondary muscle zones', () => {
      // 1. Bench Press -> Chest primary, Triceps & Anterior Deltoids secondary
      const benchZones = mapExerciseToMuscleZones('Barbell Flat Bench Press')
      expect(benchZones.primary).toContain('chest')
      expect(benchZones.secondary).toContain('triceps')
      expect(benchZones.secondary).toContain('deltoids_anterior')

      // 2. Barbell Back Squat -> Quadriceps primary, Glutes & Hamstrings secondary
      const squatZones = mapExerciseToMuscleZones('Barbell Back Squat')
      expect(squatZones.primary).toContain('quadriceps')
      expect(squatZones.secondary).toContain('gluteals')

      // 3. Barbell Deadlift -> Hamstrings & Erector Spinae primary, Latissimus Dorsi & Glutes secondary
      const deadliftZones = mapExerciseToMuscleZones('Romanian Deadlift')
      expect(deadliftZones.primary).toContain('hamstrings')
      expect(deadliftZones.primary).toContain('gluteals')

      // 4. Pull-Up / Lat Pulldown -> Latissimus Dorsi primary, Biceps & Rhomboids secondary
      const latZones = mapExerciseToMuscleZones('Overhand Grip Pull-Up')
      expect(latZones.primary).toContain('latissimus_dorsi')
      expect(latZones.secondary).toContain('biceps')
    })
  })

  describe('Biological Multipliers (Age, Sex, Conditioning)', () => {
    it('slows recovery rate as chronological age increases past 40', () => {
      const age25Mult = getAgeRecoveryMultiplier(25)
      const age35Mult = getAgeRecoveryMultiplier(35)
      const age45Mult = getAgeRecoveryMultiplier(45)
      const age55Mult = getAgeRecoveryMultiplier(55)

      expect(age25Mult).toBe(1.0)
      expect(age35Mult).toBe(1.05)
      expect(age45Mult).toBe(1.15)
      expect(age55Mult).toBe(1.25)
      expect(age55Mult).toBeGreaterThan(age25Mult)
    })

    it('accelerates recovery rate for elite and advanced conditioning levels', () => {
      const beginnerMult = getConditioningRecoveryMultiplier('beginner')
      const intermediateMult = getConditioningRecoveryMultiplier('intermediate')
      const advancedMult = getConditioningRecoveryMultiplier('advanced')
      const eliteMult = getConditioningRecoveryMultiplier('elite')

      expect(beginnerMult).toBe(1.3)
      expect(intermediateMult).toBe(1.0)
      expect(advancedMult).toBe(0.85)
      expect(eliteMult).toBe(0.75)
      expect(eliteMult).toBeLessThan(beginnerMult)
    })
  })

  describe('Color Coded Supercompensation Spectrum', () => {
    it('returns exact hex and tier classifications across recovery spectrum', () => {
      // 100% -> Emerald Green
      const fullyRecovered = getRecoveryColorHex(100)
      expect(fullyRecovered.colorHex).toBe('#10B981')
      expect(fullyRecovered.colorTier).toBe('emerald_green')

      // 70% -> Golden Yellow (Neural Consolidation)
      const consolidating = getRecoveryColorHex(70)
      expect(consolidating.colorHex).toBe('#FBBF24')
      expect(consolidating.colorTier).toBe('yellow')

      // 40% -> Amber Orange (Active Rebuild)
      const rebuilding = getRecoveryColorHex(40)
      expect(rebuilding.colorHex).toBe('#F97316')
      expect(rebuilding.colorTier).toBe('amber')

      // 15% -> Crimson Red (Acute Microtrauma)
      const severe = getRecoveryColorHex(15)
      expect(severe.colorHex).toBe('#DC2626')
      expect(severe.colorTier).toBe('dark_red')
    })
  })

  describe('Live Workout Log Ingestion & Strain Extraction', () => {
    it('extracts muscle strain from authentic workout logs and completed sets', () => {
      const now = new Date()
      const getDateStr = (daysAgo: number) => {
        const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        return d.toISOString().split('T')[0]
      }

      const mockLogs = [
        { id: 'log-leg', session_date: getDateStr(1), session_title: 'Heavy Squat Day', exertion_rpe: 9 },
        { id: 'log-push', session_date: getDateStr(2), session_title: 'Bench Press Day', exertion_rpe: 8.5 },
      ]

      const mockSets = [
        { id: 's-1', session_date: getDateStr(1), exercise_name: 'Barbell Back Squat', set_number: 1, reps: 8, rpe: 9, tempo: '2/0/2' },
        { id: 's-2', session_date: getDateStr(1), exercise_name: 'Barbell Back Squat', set_number: 2, reps: 8, rpe: 9, tempo: '2/0/2' },
        { id: 's-3', session_date: getDateStr(1), exercise_name: 'Barbell Back Squat', set_number: 3, reps: 8, rpe: 9, tempo: '2/0/2' },
        { id: 's-4', session_date: getDateStr(2), exercise_name: 'Barbell Bench Press', set_number: 1, reps: 10, rpe: 8.5, tempo: '2/0/2' },
        { id: 's-5', session_date: getDateStr(2), exercise_name: 'Barbell Bench Press', set_number: 2, reps: 10, rpe: 8.5, tempo: '2/0/2' },
      ]

      const extraction = extractMuscleStrainsFromWorkoutLogs({
        workoutLogs: mockLogs,
        workoutSetLogs: mockSets,
        hoursOffset: 0,
      })

      expect(extraction.totalSetsAnalyzed).toBe(5)
      expect(extraction.strains.length).toBeGreaterThan(0)

      // Verify quadriceps and chest have active strains
      const quadStrain = extraction.strains.find(s => s.muscleId === 'quadriceps')
      expect(quadStrain).toBeDefined()
      expect(quadStrain?.totalSetsPerformed).toBe(3)
      expect(quadStrain?.averageRpe).toBe(9)

      const chestStrain = extraction.strains.find(s => s.muscleId === 'chest')
      expect(chestStrain).toBeDefined()
      expect(chestStrain?.totalSetsPerformed).toBe(2)
      expect(chestStrain?.averageRpe).toBe(8.5)
    })
  })

  describe('Time-Lapse Predictive Recovery Simulator', () => {
    it('progressively models supercompensation as time-lapse offset advances from 0h to +48h', () => {
      // 4 heavy sets of squats 12 hours ago
      const baseStrain: MuscleTrainingStrain = {
        muscleId: 'quadriceps',
        hoursElapsedSinceSession: 12,
        totalSetsPerformed: 4,
        averageRpe: 9,
        eccentricTempoMultiplier: 1.1,
      }

      // Telemetry right now (12h elapsed)
      const nowTelemetry = calculateMuscleRecoveryTelemetry({
        age: 35,
        sex: 'male',
        conditioning: 'intermediate',
        activeSupplements: [],
        strains: [baseStrain],
      })

      // Telemetry in 24 hours (+24h offset -> 36h elapsed)
      const after24hTelemetry = calculateMuscleRecoveryTelemetry({
        age: 35,
        sex: 'male',
        conditioning: 'intermediate',
        activeSupplements: [],
        strains: [{ ...baseStrain, hoursElapsedSinceSession: 36 }],
      })

      // Telemetry in 48 hours (+48h offset -> 60h elapsed)
      const after48hTelemetry = calculateMuscleRecoveryTelemetry({
        age: 35,
        sex: 'male',
        conditioning: 'intermediate',
        activeSupplements: [],
        strains: [{ ...baseStrain, hoursElapsedSinceSession: 60 }],
      })

      const nowPct = nowTelemetry.muscles.quadriceps.recoveryPercentage
      const plus24Pct = after24hTelemetry.muscles.quadriceps.recoveryPercentage
      const plus48Pct = after48hTelemetry.muscles.quadriceps.recoveryPercentage

      expect(plus24Pct).toBeGreaterThan(nowPct)
      expect(plus48Pct).toBeGreaterThan(plus24Pct)
      expect(plus48Pct).toBeGreaterThanOrEqual(60)
    })
  })

  describe('PAR-Q Safety & Contraindication Screening for Supplements', () => {
    it('screens out contraindicated supplements when client reports relevant medical conditions', () => {
      // Intake with kidney limitation and blood pressure medication
      const parsedMedical = parseParqMedicationsAndConditions(
        { takesBloodPressureOrHeartMedication: true },
        'Lisinopril 10mg daily',
        'Stage 1 Chronic Kidney Disease, Mild Hypertension'
      )

      const requestedSupps: RecoverySupplementKey[] = ['whey_leucine', 'creatine', 'tart_cherry', 'omega3', 'magnesium']
      const screened = screenRecoverySupplementsForContraindications(requestedSupps, parsedMedical)

      // Creatine should be flagged for kidney disease
      const creatineWarning = screened.contraindicatedSupplements.find(s => s.key === 'creatine')
      expect(creatineWarning).toBeDefined()
      expect(creatineWarning?.reason).toContain('creatinine filtration')

      // Safe supplements remain in allowed list
      expect(screened.allowedSupplements).toContain('tart_cherry')
      expect(screened.allowedSupplements).toContain('magnesium')
    })
  })

  describe('Anatomical Overlay & Reticle Coordinate Calibration', () => {
    it('ensures crosshair reticles sit directly on muscle bellies and respect joint boundaries', () => {
      // 1. Quadriceps must sit above the patella (< 460)
      const quadCoords = MUSCLE_TARGET_COORDINATES.quadriceps.anterior!
      expect(quadCoords).toBeDefined()
      expect(quadCoords.length).toBe(2)
      quadCoords.forEach(([cx, cy]) => {
        expect(cy).toBeLessThanOrEqual(450) // Calibrated to 445 (above knee joint at ~520)
        expect(cy).toBeGreaterThan(400)
      })

      // 2. Gluteals must sit above the inferior gluteal fold (< 410)
      const gluteCoords = MUSCLE_TARGET_COORDINATES.gluteals.posterior!
      expect(gluteCoords).toBeDefined()
      gluteCoords.forEach(([cx, cy]) => {
        expect(cy).toBeLessThanOrEqual(400) // Calibrated to 390 (above hamstring origin)
        expect(cy).toBeGreaterThan(350)
      })

      // 3. Rectus Abdominis core reticle sits centered on the 6-pack (between 270 and 295)
      const absCoords = MUSCLE_TARGET_COORDINATES.abdominals.anterior!
      expect(absCoords).toBeDefined()
      expect(absCoords[0][1]).toBe(285)

      // 4. Hamstrings sit between gluteal fold and popliteal fossa (< 500)
      const hamCoords = MUSCLE_TARGET_COORDINATES.hamstrings.posterior!
      expect(hamCoords).toBeDefined()
      hamCoords.forEach(([cx, cy]) => {
        expect(cy).toBeLessThanOrEqual(490) // Calibrated to 485
        expect(cy).toBeGreaterThan(440)
      })

      // 5. Gastrocnemius (calves) sits in the upper diamond heads (< 630)
      const calfCoords = MUSCLE_TARGET_COORDINATES.calves_gastrocnemius.posterior!
      expect(calfCoords).toBeDefined()
      calfCoords.forEach(([cx, cy]) => {
        expect(cy).toBeLessThanOrEqual(620) // Calibrated to 610 (above Achilles tendon)
        expect(cy).toBeGreaterThan(570)
      })
    })
  })
})

