import { describe, it, expect } from 'vitest'
import {
  recommendPeriodizationFromScans,
  generateProgramDesignFromScans,
  runAiCoachOnboardingSynthesis,
  extractCExContinuum,
  type ClientOnboardingProfileInput,
} from './ai-coach-onboarding-orchestrator'
import type { BodyCompositionScanResult } from './ai-body-composition-engine'
import type { PosturalMeshScanResult } from './ai-postural-mesh-scanner'

describe('ai-coach-onboarding-orchestrator', () => {
  const mockClient: ClientOnboardingProfileInput = {
    clientId: 'client-101',
    clientName: 'Marcus Vance',
    age: 38,
    sex: 'male',
    heightCm: 182,
    weightKg: 88,
    fitnessGoal: 'Body Recomposition & Joint Health',
    trainingDaysPerWeek: 4,
    equipmentAccess: ['Barbell', 'Dumbbells', 'Adjustable Bench', 'Resistance Bands', 'Foam Roller'],
  }

  const mockDexaScan: BodyCompositionScanResult = {
    estimatedBodyFatPercent: 26.4,
    confidenceIntervalPercent: 1.2,
    confidenceScore: 0.94,
    bodyDensity: 1.04,
    classification: 'Elevated Fat Mass',
    weightKg: 88,
    weightLbs: 194,
    fatMassKg: 23.2,
    fatMassLbs: 51.2,
    leanBodyMassKg: 64.8,
    leanBodyMassLbs: 142.8,
    skeletalMuscleMassKg: 35.2,
    skeletalMuscleMassLbs: 77.6,
    ffmi: 19.6,
    normalizedFfmi: 19.4,
    ffmiCategory: 'Average',
    visceralFatRisk: 'Moderate',
    androidGynoidRatio: 1.05,
    waistToHeightRatio: 0.52,
    cunninghamBmr: 1780,
    katchMcArdleBmr: 1765,
    maintenanceCaloriesTdee: 2600,
    estimatedCircumferencesCm: {
      waistNavelCm: 94,
      neckCm: 41,
      hipGluteCm: 102,
      chestCm: 104,
      thighCm: 60,
      bicepCm: 36,
    },
    waistToHipRatio: 0.92,
    landmarks: [],
    regionalBreakdown: [],
    photoQualityAssessment: {
      overallRating: 'optimal',
      framingScore: 92,
      lightingScore: 90,
      clothingOcclusionWarning: false,
      postureCompensationDetected: true,
      multiViewEnhanced: true,
    },
    recompositionProjection: {
      targetWeightKg: 80,
      targetWeightLbs: 176,
      targetBodyFatPercent: 18,
      targetFatMassKg: 14.4,
      targetFatMassLbs: 31.7,
      fatToLoseKg: 8.16,
      fatToLoseLbs: 18,
      leanMassChangeKg: 0,
      leanMassChangeLbs: 0,
      estimatedWeeksToGoal: 16,
      dailyCaloricTarget: 2100,
      dailyProteinGrams: 160,
      recommendedNasmPhase: 1,
      phaseName: 'Phase 1: Stabilization Endurance',
      weeklyDeficitOrSurplusCalories: -3500,
      coachingDirectives: ['Create modest energy deficit', 'Preserve LBM via 4/2/1 tempo'],
    },
    methodDescription: 'DEXA 4C Multi-View AI Spatial Anthropometry',
    coachSummaryNotes: 'Elevated fat mass with moderate visceral risk.',
  }

  const mockPostureScan: PosturalMeshScanResult = {
    view: 'overhead_squat',
    landmarks: [],
    angles: [
      { name: 'Knee Valgus Q-Angle', angleDegrees: 11, status: 'moderate', normalRange: '< 5°', clinicalNote: 'Medial knee collapse' },
      { name: 'Pelvic Incline Angle', angleDegrees: 14, status: 'moderate', normalRange: '5° - 10°', clinicalNote: 'Anterior pelvic tilt' },
    ],
    detectedCompensations: ['knees_cave_in', 'excessive_forward_lean', 'low_back_arches'],
    ohsaObservations: [
      { compensation: 'knees_move_inward', checkpoint: 'knees', observed: true, severity: 'moderate', view: 'anterior' },
      { compensation: 'excessive_forward_lean', checkpoint: 'lphc', observed: true, severity: 'moderate', view: 'lateral' },
      { compensation: 'low_back_arches', checkpoint: 'lphc', observed: true, severity: 'moderate', view: 'lateral' },
    ],
    staticFindings: [
      { checkpoint: 'knees', observation: 'Bilateral knee valgus', distortionSyndrome: 'lower_crossed' },
      { checkpoint: 'lphc', observation: 'Anterior pelvic tilt', distortionSyndrome: 'lower_crossed' },
    ],
    syndromeDetected: 'Lower Crossed',
    cexPrescription: {
      inhibit: [
        { muscle: 'Adductor Complex & TFL', protocol: 'SMR 30-60s per leg' },
        { muscle: 'Gastrocnemius & Soleus', protocol: 'SMR 30-60s on foam roller' },
      ],
      lengthen: [
        { muscle: 'Static Hip Flexor / Psoas Stretch', protocol: 'Hold 30s x 2 sets' },
        { muscle: 'Static Adductor Stretch', protocol: 'Hold 30s x 2 sets' },
      ],
      activate: [
        { muscle: 'Gluteus Medius / Minimus', protocol: 'Banded Side-Lying Clamshell 3x15' },
        { muscle: 'Anterior Tibialis', protocol: 'Single-Leg Balance to Reach 3x10' },
      ],
      integrate: [
        { exercise: 'Ball Squat to Overhead Press', protocol: '3 sets x 12 reps (4/2/1 tempo)' },
        { exercise: 'Single-Leg Romanian Deadlift to Balance', protocol: '3 sets x 10 reps/side (3/2/1 tempo)' },
      ],
    },
    clinicalSummary: 'Lower crossed syndrome with knee valgus and excessive forward lean.',
  }

  it('recommends Phase 1 Stabilization when Lower Crossed Syndrome and knee valgus are detected', () => {
    const recommendation = recommendPeriodizationFromScans({
      client: mockClient,
      dexaScan: mockDexaScan,
      postureScan: mockPostureScan,
    })

    expect(recommendation.targetNasmPhase).toBe(1)
    expect(recommendation.targetPhaseName).toBe('Phase 1: Stabilization Endurance')
    expect(recommendation.macrocyclePlan.weeks.length).toBe(12)
    expect(recommendation.clinicalRationale.summary).toContain('Phase 1 Stabilization')
    expect(recommendation.clinicalRationale.bodyCompAnalysis).toContain('26.4%')
    expect(recommendation.clinicalRationale.postureOhsaAnalysis).toContain('Lower Crossed')
  })

  it('extracts complete 4-Phase CEx continuum from posture scan', () => {
    const cex = extractCExContinuum(mockPostureScan)
    expect(cex.inhibit.length).toBeGreaterThan(0)
    expect(cex.lengthen.length).toBeGreaterThan(0)
    expect(cex.activate.length).toBeGreaterThan(0)
    expect(cex.integrate.length).toBeGreaterThan(0)
    expect(cex.inhibit[0]).toContain('Adductor')
  })

  it('generates program design embedding 4-Phase CEx into every workout day', () => {
    const periodization = recommendPeriodizationFromScans({
      client: mockClient,
      dexaScan: mockDexaScan,
      postureScan: mockPostureScan,
    })

    const program = generateProgramDesignFromScans({
      client: mockClient,
      dexaScan: mockDexaScan,
      postureScan: mockPostureScan,
      periodization,
    })

    expect(program.nasmOptPhase).toBe(1)
    expect(program.macrocyclePlan.workouts.length).toBe(4)

    // Every workout day must contain the embedded 4-Phase CEx warmup protocol
    for (const day of program.macrocyclePlan.workouts) {
      expect(day.warmupProtocol.inhibitSmr.length).toBeGreaterThan(0)
      expect(day.warmupProtocol.lengthenStaticStretch.length).toBeGreaterThan(0)
      expect(day.warmupProtocol.activateDynamic.length).toBeGreaterThan(0)
      expect(day.dailyPeriodizationMemo).toContain('AI 4-Phase CEx')
    }

    // Must include master coach cues addressing knee valgus
    expect(program.masterCoachCues.some(cue => cue.includes('knee tracking') || cue.includes('knees'))).toBe(true)
  })

  it('executes full 1-step AI Coach synthesis orchestrator', () => {
    const synthesis = runAiCoachOnboardingSynthesis({
      client: mockClient,
      dexaScan: mockDexaScan,
      postureScan: mockPostureScan,
    })

    expect(synthesis.clientId).toBe('client-101')
    expect(synthesis.periodizationRecommendation.targetNasmPhase).toBe(1)
    expect(synthesis.programDesignRecommendation.macrocyclePlan.workouts.length).toBe(4)
    expect(synthesis.synthesizedAt).toBeTruthy()
  })

  it('gracefully handles missing scans with safe clinical fallbacks', () => {
    const synthesis = runAiCoachOnboardingSynthesis({
      client: mockClient,
      dexaScan: null,
      postureScan: null,
    })

    expect(synthesis.periodizationRecommendation.targetNasmPhase).toBe(1)
    expect(synthesis.periodizationRecommendation.clinicalRationale.bodyCompAnalysis).toContain('Baseline biometrics established')
    expect(synthesis.programDesignRecommendation.macrocyclePlan.workouts.length).toBe(4)
  })
})

