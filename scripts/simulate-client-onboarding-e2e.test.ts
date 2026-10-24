import { describe, it, expect } from 'vitest'
import {
  runAiCoachOnboardingSynthesis,
  recommendPeriodizationFromScans,
  generateProgramDesignFromScans,
  type ClientOnboardingProfileInput,
} from '../lib/ai-coach-onboarding-orchestrator'
import {
  evaluateClientOnboardingProgression,
  parseParqAnswers,
  type ClientProgressionTelemetry,
} from '../lib/coach-onboarding-progression'
import { evaluateMedicalParq } from '../lib/liability-shield'
import { searchNasmLibraryMedia } from '../lib/nasm-fuzzy-matcher'
import type { BodyCompositionScanResult } from '../lib/ai-body-composition-engine'
import type { PosturalMeshScanResult } from '../lib/ai-postural-mesh-scanner'

describe('Client Onboarding & Intake Flow End-to-End Simulation', () => {
  it('Scenario 1: executes clean intake, PAR-Q+, ERAP, OHSA CEx warmups, and progression to Stage 7', () => {
    const standardClientInput: ClientOnboardingProfileInput = {
      clientId: 'client-exec-001',
      clientName: 'Alexander Hayes',
      age: 42,
      sex: 'male',
      heightCm: 185,
      weightKg: 86,
      fitnessGoal: 'fat_loss',
      trainingDaysPerWeek: 4,
      equipmentAccess: ['Barbell', 'Dumbbells', 'Cable Machine', 'Adjustable Bench', 'Pull-Up Bar'],
      cardioEquipmentAccess: ['Rowing Ergometer', 'Treadmill', 'Assault AirBike'],
    }

    const standardParqAnswers = {
      q1: false,
      q2: false,
      q3: false,
      q4: false,
      q5: false,
      q6: false,
      q7: false,
      erap: {
        workoutStreetAddress: '100 Executive Way',
        workoutUnitOrGateCode: 'Suite 400, Gate *1234',
        workoutCity: 'New York',
        workoutState: 'NY',
        workoutPostalCode: '10001',
        localEmergencyDispatchPhone: '212-555-0911',
        virtualTelehealthConsent: true,
      },
    }

    const medicalEvaluation = evaluateMedicalParq(parseParqAnswers(standardParqAnswers))
    expect(medicalEvaluation.clearanceStatus).toBe('cleared_unrestricted')
    expect(medicalEvaluation.riskTier).toBe('Low Risk')

    const erap = standardParqAnswers.erap
    expect(erap.workoutStreetAddress).toBeTruthy()
    expect(erap.localEmergencyDispatchPhone).toBeTruthy()
    expect(erap.virtualTelehealthConsent).toBe(true)

    const standardPostureScan: PosturalMeshScanResult = {
      view: 'overhead_squat',
      landmarks: [],
      angles: [{ name: 'Knee Valgus Q-Angle', angleDegrees: 10, status: 'moderate', normalRange: '< 5°', clinicalNote: 'Valgus' }],
      detectedCompensations: ['knees_cave_in'],
      ohsaObservations: [{ compensation: 'knees_move_inward', checkpoint: 'knees', observed: true, severity: 'mild', view: 'anterior' }],
      staticFindings: [],
      syndromeDetected: 'Pronation Distortion',
      cexPrescription: {
        inhibit: [{ muscle: 'Adductor Complex & TFL', protocol: 'SMR 30-60s on foam roller' }],
        lengthen: [{ muscle: 'Static Kneeling Hip Flexor / Adductor Stretch', protocol: 'Hold 30s x 2 sets' }],
        activate: [{ muscle: 'Gluteus Medius', protocol: '3 sets x 15 reps' }],
        integrate: [{ exercise: 'Single-Leg Squat to Bench with Band', protocol: '3 sets x 10 reps' }],
      },
      clinicalSummary: 'Pronation distortion syndrome.',
    }

    const standardDexaScan: BodyCompositionScanResult = {
      estimatedBodyFatPercent: 21.5,
      confidenceIntervalPercent: 1.1,
      confidenceScore: 0.95,
      bodyDensity: 1.05,
      classification: 'Fitness / Defined',
      weightKg: 86,
      weightLbs: 189.6,
      fatMassKg: 18.5,
      fatMassLbs: 40.8,
      leanBodyMassKg: 67.5,
      leanBodyMassLbs: 148.8,
      skeletalMuscleMassKg: 37.8,
      skeletalMuscleMassLbs: 83.3,
      ffmi: 20.8,
      normalizedFfmi: 20.6,
      ffmiCategory: 'Above Average',
      visceralFatRisk: 'Low',
      androidGynoidRatio: 0.95,
      waistToHeightRatio: 0.48,
      cunninghamBmr: 1840,
      katchMcArdleBmr: 1825,
      maintenanceCaloriesTdee: 2750,
      estimatedCircumferencesCm: {
        waistNavelCm: 88,
        neckCm: 40,
        hipGluteCm: 99,
        chestCm: 106,
        thighCm: 59,
        bicepCm: 37,
      },
      waistToHipRatio: 0.89,
      landmarks: [],
      regionalBreakdown: [],
      photoQualityAssessment: {
        overallRating: 'optimal',
        framingScore: 94,
        lightingScore: 92,
        clothingOcclusionWarning: false,
        postureCompensationDetected: true,
        multiViewEnhanced: true,
      },
      recompositionProjection: {
        targetWeightKg: 80,
        targetWeightLbs: 176,
        targetBodyFatPercent: 15,
        targetFatMassKg: 12,
        targetFatMassLbs: 26.5,
        fatToLoseKg: 6.5,
        fatToLoseLbs: 14.3,
        leanMassChangeKg: 0.5,
        leanMassChangeLbs: 1.1,
        estimatedWeeksToGoal: 12,
        dailyCaloricTarget: 2250,
        dailyProteinGrams: 175,
        recommendedNasmPhase: 1,
        phaseName: 'Phase 1: Stabilization Endurance',
        weeklyDeficitOrSurplusCalories: -3500,
        coachingDirectives: ['Execute stabilization protocols', 'Preserve LBM via 4/2/1 tempo'],
      },
      methodDescription: 'DEXA 4C Multi-View AI Spatial Anthropometry',
      coachSummaryNotes: 'Athletic build.',
    }

    const synthesis = runAiCoachOnboardingSynthesis({
      client: standardClientInput,
      dexaScan: standardDexaScan,
      postureScan: standardPostureScan,
    })

    expect(synthesis.periodizationRecommendation.targetNasmPhase).toBe(1)
    expect(synthesis.periodizationRecommendation.macrocyclePlan.weeks).toHaveLength(12)
    expect(synthesis.programDesignRecommendation.macrocyclePlan.workouts).toHaveLength(4)

    const days = synthesis.programDesignRecommendation.macrocyclePlan.workouts
    for (const day of days) {
      expect(day.warmupProtocol.inhibitSmr.length).toBeGreaterThan(0)
      expect(day.warmupProtocol.lengthenStaticStretch.length).toBeGreaterThan(0)
      expect(day.warmupProtocol.activateDynamic.length).toBeGreaterThan(0)
      for (const ex of day.exercises) {
        expect(searchNasmLibraryMedia(ex.name)).not.toBeNull()
      }
    }

    const clientTelemetry: ClientProgressionTelemetry = {
      clientId: standardClientInput.clientId,
      clientName: standardClientInput.clientName,
      email: 'alexander@forge-athletic.app',
      designatedCoachId: 'coach-sc-01',
      packages: [{ id: 'pkg-1', package_name: 'Forge Executive 12', sessions_remaining: 12, sessions_total: 12, source: 'paid' }],
      intakeForm: {
        parq_answers: standardParqAnswers,
        consent_signature_name: 'Alexander Hayes',
        consent_signed_at: new Date().toISOString(),
      },
      fitnessProfile: {
        height_cm: standardClientInput.heightCm,
        weight_kg: standardClientInput.weightKg,
        fitness_goal: standardClientInput.fitnessGoal,
        equipment_access: standardClientInput.equipmentAccess,
        training_days_per_week: standardClientInput.trainingDaysPerWeek,
      },
      latestPlan: {
        id: 'plan-hayes-1',
        name: 'Executive Strength Endurance Protocol',
        nasm_opt_phase: 1,
        plan_json: synthesis.programDesignRecommendation.macrocyclePlan,
      },
      enforceGates: true,
      gates: {
        1: { status: 'authorized', authorizedBy: 'coach-sc-01' },
        2: { status: 'authorized', authorizedBy: 'coach-sc-01' },
        3: { status: 'authorized', authorizedBy: 'coach-sc-01' },
        4: { status: 'authorized', authorizedBy: 'coach-sc-01' },
        5: { status: 'authorized', authorizedBy: 'coach-sc-01' },
        6: { status: 'authorized', authorizedBy: 'coach-sc-01' },
      },
    }

    const progression = evaluateClientOnboardingProgression(clientTelemetry)
    expect(progression.isBlockedByMedicalClearance).toBe(false)
    expect(progression.currentStageNumber).toBe(7)
    expect(progression.completedOnboardingCount).toBe(6)
    expect(progression.stages[6].gate.canAuthorize).toBe(true)
  })

  it('Scenario 2: enforces physician medical clearance gate and lumbar disc protection', () => {
    const highRiskClientInput: ClientOnboardingProfileInput = {
      clientId: 'client-risk-002',
      clientName: 'Robert Vance',
      age: 56,
      sex: 'male',
      heightCm: 178,
      weightKg: 95,
      fitnessGoal: 'fat_loss',
      trainingDaysPerWeek: 3,
      equipmentAccess: ['Dumbbells', 'Adjustable Bench', 'Resistance Bands'],
      injuriesLimitations: 'L4-L5 lumbar disc herniation, severe flexion intolerance. Takes Metoprolol for hypertension.',
      contraindicationTags: ['lumbar_disc_condition'],
    }

    const highRiskParqAnswers = {
      q1: true,
      q2: false,
      q3: false,
      q4: false,
      q5: true,
      q6: true,
      q7: false,
      erap: {
        workoutStreetAddress: '55 Park Avenue',
        workoutUnitOrGateCode: 'Apt 12B',
        workoutCity: 'New York',
        workoutState: 'NY',
        workoutPostalCode: '10016',
        localEmergencyDispatchPhone: '212-555-0911',
        virtualTelehealthConsent: true,
      },
    }

    const riskMedicalEval = evaluateMedicalParq(parseParqAnswers(highRiskParqAnswers))
    expect(riskMedicalEval.clearanceStatus).toBe('physician_clearance_required')
    expect(riskMedicalEval.riskTier).toBe('High Risk - Medical Clearance Required')

    const riskTelemetry: ClientProgressionTelemetry = {
      clientId: highRiskClientInput.clientId,
      clientName: highRiskClientInput.clientName,
      email: 'robert@forge-athletic.app',
      designatedCoachId: 'coach-sc-01',
      packages: [{ id: 'pkg-2', package_name: 'Rehab / Longevity 10', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
      intakeForm: {
        parq_answers: highRiskParqAnswers,
        consent_signature_name: 'Robert Vance',
        consent_signed_at: new Date().toISOString(),
      },
      enforceGates: true,
      gates: {
        1: { status: 'authorized', authorizedBy: 'coach-sc-01' },
      },
    }

    const riskProgression = evaluateClientOnboardingProgression(riskTelemetry)
    expect(riskProgression.isBlockedByMedicalClearance).toBe(true)
    expect(riskProgression.currentStageNumber).toBe(2)
    expect(riskProgression.stages[1].gate.status).toBe('blocked')
    expect(riskProgression.stages[1].gate.canAuthorize).toBe(false)

    const riskSynthesis = runAiCoachOnboardingSynthesis({
      client: highRiskClientInput,
      dexaScan: null,
      postureScan: null,
    })

    expect(riskSynthesis.periodizationRecommendation.targetNasmPhase).toBe(1)
    const riskDays = riskSynthesis.programDesignRecommendation.macrocyclePlan.workouts
    for (const day of riskDays) {
      for (const ex of day.exercises) {
        const lower = ex.name.toLowerCase()
        expect(lower).not.toContain('good morning')
        expect(lower).not.toContain('jefferson')
      }
    }
  })

  it('Scenario 3: clamps prenatal athlete to Phase 2 maximum and filters ballistic jumping', () => {
    const prenatalClientInput: ClientOnboardingProfileInput = {
      clientId: 'client-prenatal-003',
      clientName: 'Elena Rostova',
      age: 32,
      sex: 'female',
      heightCm: 168,
      weightKg: 68,
      fitnessGoal: 'Hypertrophy and Muscle Building',
      trainingDaysPerWeek: 3,
      equipmentAccess: ['Dumbbells', 'Adjustable Bench', 'Stability Ball', 'Resistance Bands'],
      injuriesLimitations: 'Currently pregnant in second trimester. Physician approved light-to-moderate exercise.',
    }

    const prenatalRecommendation = recommendPeriodizationFromScans({
      client: prenatalClientInput,
      dexaScan: null,
      postureScan: null,
    })

    expect(prenatalRecommendation.targetNasmPhase).toBeLessThanOrEqual(2)
    expect(prenatalRecommendation.macrocyclePlan.specialPopulation).toBe('pregnancy_prenatal')
    expect(prenatalRecommendation.macrocyclePlan.maxAllowedOptPhase).toBe(2)

    const prenatalProgram = generateProgramDesignFromScans({
      client: prenatalClientInput,
      dexaScan: null,
      postureScan: null,
      periodization: prenatalRecommendation,
    })

    for (const day of prenatalProgram.macrocyclePlan.workouts) {
      for (const ex of day.exercises) {
        const lower = ex.name.toLowerCase()
        expect(lower).not.toContain('jump')
        expect(lower).not.toContain('burpee')
      }
    }
  })
})
