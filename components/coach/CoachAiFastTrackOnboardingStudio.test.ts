import { describe, expect, it } from 'vitest'
import {
  runAiCoachOnboardingSynthesis,
  type ClientOnboardingProfileInput,
} from '@/lib/ai-coach-onboarding-orchestrator'
import type { BodyCompositionScanResult } from '@/lib/ai-body-composition-engine'
import type { PosturalMeshScanResult } from '@/lib/ai-postural-mesh-scanner'

describe('CoachAiFastTrackOnboardingStudio Logic & Integration', () => {
  const mockClient: ClientOnboardingProfileInput = {
    clientId: 'client-fast-track',
    clientName: 'Julian Ray',
    age: 34,
    sex: 'male',
    heightCm: 185,
    weightKg: 86,
    fitnessGoal: 'Body Recomposition & Core Power',
    trainingDaysPerWeek: 4,
    equipmentAccess: ['Commercial Gym'],
  }

  const mockDexa: BodyCompositionScanResult = {
    estimatedBodyFatPercent: 21.2,
    confidenceIntervalPercent: 1.0,
    confidenceScore: 0.95,
    bodyDensity: 1.05,
    classification: 'Fitness / Defined',
    weightKg: 86,
    weightLbs: 190,
    fatMassKg: 18.2,
    fatMassLbs: 40.2,
    leanBodyMassKg: 67.8,
    leanBodyMassLbs: 149.8,
    skeletalMuscleMassKg: 36.0,
    skeletalMuscleMassLbs: 79.5,
    ffmi: 20.8,
    normalizedFfmi: 20.6,
    ffmiCategory: 'Above Average',
    visceralFatRisk: 'Low',
    androidGynoidRatio: 0.94,
    waistToHeightRatio: 0.47,
    cunninghamBmr: 1820,
    katchMcArdleBmr: 1790,
    maintenanceCaloriesTdee: 2700,
    estimatedCircumferencesCm: { waistNavelCm: 84, neckCm: 40, hipGluteCm: 98, chestCm: 104, thighCm: 59, bicepCm: 36 },
    waistToHipRatio: 0.86,
    landmarks: [],
    regionalBreakdown: [],
    photoQualityAssessment: { overallRating: 'optimal', framingScore: 95, lightingScore: 92, clothingOcclusionWarning: false, postureCompensationDetected: true, multiViewEnhanced: true },
    recompositionProjection: {
      targetWeightKg: 82,
      targetWeightLbs: 180,
      targetBodyFatPercent: 14,
      targetFatMassKg: 11.48,
      targetFatMassLbs: 25.2,
      fatToLoseKg: 4.54,
      fatToLoseLbs: 10,
      leanMassChangeKg: 0,
      leanMassChangeLbs: 0,
      estimatedWeeksToGoal: 10,
      dailyCaloricTarget: 2300,
      dailyProteinGrams: 170,
      recommendedNasmPhase: 1,
      phaseName: 'Phase 1: Stabilization Endurance',
      weeklyDeficitOrSurplusCalories: -2800,
      coachingDirectives: ['Moderate energy deficit', 'Preserve high LBM via 4/2/1 tempo'],
    },
    methodDescription: 'DEXA 4C Vision Scan',
    coachSummaryNotes: 'Fitness/Defined classification with above average FFMI.',
  }

  const mockPosture: PosturalMeshScanResult = {
    view: 'overhead_squat',
    landmarks: [],
    angles: [],
    detectedCompensations: ['knees_cave_in', 'excessive_forward_lean'],
    ohsaObservations: [
      { compensation: 'knees_move_inward', checkpoint: 'knees', observed: true, severity: 'moderate', view: 'anterior' },
      { compensation: 'excessive_forward_lean', checkpoint: 'lphc', observed: true, severity: 'moderate', view: 'lateral' },
    ],
    staticFindings: [
      { checkpoint: 'knees', observation: 'Knee valgus', distortionSyndrome: 'lower_crossed' },
    ],
    syndromeDetected: 'Lower Crossed',
    cexPrescription: {
      inhibit: [{ muscle: 'Adductors', protocol: 'SMR 30-60s' }],
      lengthen: [{ muscle: 'Hip Flexors', protocol: 'Static stretch 30s' }],
      activate: [{ muscle: 'Gluteus Medius', protocol: 'Banded Clamshells 3x15' }],
      integrate: [{ exercise: 'Ball Squat to Press', protocol: '3x12 @ 4/2/1 tempo' }],
    },
    clinicalSummary: 'Lower Crossed Syndrome observed during dynamic OHSA.',
  }

  it('runs rapid AI Coach onboarding synthesis with both DEXA and Posture/OHSA results', () => {
    const synthesis = runAiCoachOnboardingSynthesis({
      client: mockClient,
      dexaScan: mockDexa,
      postureScan: mockPosture,
    })

    expect(synthesis.periodizationRecommendation.targetNasmPhase).toBe(1)
    expect(synthesis.periodizationRecommendation.macrocyclePlan.weeks).toHaveLength(12)
    expect(synthesis.programDesignRecommendation.embeddedCEx.inhibit[0]).toContain('Adductors')
    expect(synthesis.programDesignRecommendation.macrocyclePlan.workouts.length).toBe(4)

    // Verify all 4 workout days embed the 4-phase CEx warmups
    synthesis.programDesignRecommendation.macrocyclePlan.workouts.forEach(day => {
      expect(day.warmupProtocol.inhibitSmr.length).toBeGreaterThan(0)
      expect(day.warmupProtocol.lengthenStaticStretch.length).toBeGreaterThan(0)
      expect(day.warmupProtocol.activateDynamic.length).toBeGreaterThan(0)
    })
  })

  it('formats payload for 1-click apply_all endpoint correctly', () => {
    const synthesis = runAiCoachOnboardingSynthesis({
      client: mockClient,
      dexaScan: mockDexa,
      postureScan: mockPosture,
    })

    const applyPayload = {
      action: 'apply_all',
      periodizationRecommendation: synthesis.periodizationRecommendation,
      programDesignRecommendation: synthesis.programDesignRecommendation,
      dexaScan: mockDexa,
      postureScan: mockPosture,
    }

    expect(applyPayload.action).toBe('apply_all')
    expect(applyPayload.periodizationRecommendation.targetNasmPhase).toBe(1)
    expect(applyPayload.programDesignRecommendation.planTitle).toContain('Julian Ray')
  })
})

