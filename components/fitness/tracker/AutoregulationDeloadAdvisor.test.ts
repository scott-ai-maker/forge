import { describe, it, expect } from 'vitest'
import {
  evaluateExerciseAutoregulation,
  computeSessionRpeTelemetry,
} from '@/lib/autoregulation-advisor-engine'

describe('AutoregulationDeloadAdvisor Integration', () => {
  it('detects high fatigue and prescribes 5% deload when rep target is missed at RIR 0', () => {
    const sets = [
      { setNumber: 1, weightLbs: 225, reps: 8, rpe: 8, rir: 2, isWarmup: false },
      { setNumber: 2, weightLbs: 225, reps: 6, rpe: 10, rir: 0, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Bench Press',
      currentDraftWeightLbs: 225,
      currentDraftReps: 8,
      targetReps: 8,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.action).toBe('reduce_load_5pct')
    expect(advice.suggestedWeightLbs).toBe(215) // 225 * 0.95 = 213.75 -> 215 lbs
    expect(advice.suggestedRestExtensionSeconds).toBe(30)
    expect(advice.badgeText).toContain('−5% Load')
  })

  it('detects consecutive failure and prescribes 10% load reduction', () => {
    const sets = [
      { setNumber: 1, weightLbs: 315, reps: 5, rpe: 10, rir: 0, isWarmup: false },
      { setNumber: 2, weightLbs: 315, reps: 4, rpe: 10, rir: 0, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Back Squat',
      currentDraftWeightLbs: 315,
      currentDraftReps: 5,
      targetReps: 5,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.action).toBe('reduce_load_10pct')
    expect(advice.suggestedWeightLbs).toBe(285) // 315 * 0.9 = 283.5 -> 285 lbs
    expect(advice.suggestedRestExtensionSeconds).toBe(45)
    expect(advice.fatigueLevel).toBe('critical_overload')
  })

  it('enforces hammer curl biomechanical guardrail under fatigue', () => {
    const sets = [
      { setNumber: 1, weightLbs: 50, reps: 8, rpe: 10, rir: 0, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Dumbbell Hammer Curl',
      currentDraftWeightLbs: 50,
      currentDraftReps: 10,
      targetReps: 10,
      completedSets: sets,
    })

    expect(advice.isHammerCurl).toBe(true)
    expect(advice.biomechanicalWarning).toContain('Strict Neutral Grip Guardrail')
    expect(advice.biomechanicalWarning).toContain('thumbs pointing up')
  })

  it('computes Foster sRPE and training load correctly', () => {
    const sets = [
      { setNumber: 1, weightLbs: 185, reps: 10, rpe: 8, rir: 2, isWarmup: false },
      { setNumber: 2, weightLbs: 185, reps: 10, rpe: 9, rir: 1, isWarmup: false },
    ]

    const telemetry = computeSessionRpeTelemetry(sets, 45)
    expect(telemetry.sessionRpeFoster).toBe(8.5)
    expect(telemetry.fosterTrainingLoadAu).toBe(Math.round(8.5 * 45))
    expect(telemetry.totalWorkingSets).toBe(2)
  })

  it('triggers acute fatigue drop alert and drop-set recommendation on severe rep decay', () => {
    // 10 reps -> 7 reps (30% drop)
    const sets = [
      { setNumber: 1, weightLbs: 200, reps: 10, rpe: 8, rir: 2, isWarmup: false },
      { setNumber: 2, weightLbs: 200, reps: 7, rpe: 9.5, rir: 0.5, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Bench Press',
      currentDraftWeightLbs: 200,
      currentDraftReps: 10,
      targetReps: 10,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.hasAcuteFatigueDrop).toBe(true)
    expect(advice.acuteFatigueDropPercent).toBe(30)
    expect(advice.backOffPlan?.backOffWeightLbs).toBeLessThan(200)
    expect(advice.dropSetRecommendation?.shouldConvert).toBe(true)
    expect(advice.dropSetRecommendation?.stages.length).toBe(3)
  })

  it('generates cluster set protocol with velocity-preserving intra-rest and hammer guardrails', async () => {
    const { generateClusterSetPlan } = await import('@/lib/cluster-myoreps-advisor-engine')
    
    // Test compound lift (20s intra-rest)
    const compoundPlan = generateClusterSetPlan({
      exerciseName: 'Barbell Bench Press',
      currentWeightLbs: 225,
      targetReps: 6,
      units: 'imperial',
    })
    expect(compoundPlan.clusterCount).toBe(3)
    expect(compoundPlan.repsPerCluster).toBe(2)
    expect(compoundPlan.intraRestSeconds).toBe(20)
    expect(compoundPlan.stages.length).toBe(3)
    expect(compoundPlan.notesTag).toContain('[Cluster: 225lb × (2+2+2) | 20s intra-rest')

    // Test hammer curl variant with strict neutral grip guardrail
    const hammerPlan = generateClusterSetPlan({
      exerciseName: 'Dumbbell Hammer Curl',
      currentWeightLbs: 45,
      targetReps: 10,
      units: 'imperial',
    })
    expect(hammerPlan.isHammerCurl).toBe(true)
    expect(hammerPlan.repsPerCluster).toBe(4)
    expect(hammerPlan.intraRestSeconds).toBe(15) // isolation
    expect(hammerPlan.guardrailMandate).toContain('Strict Neutral Grip Guardrail')
    expect(hammerPlan.guardrailMandate).toContain('thumbs pointed up toward ceiling')
    expect(hammerPlan.guardrailMandate).toContain('zero wrist twisting/supination')
  })

  it('generates myo-reps protocol with activation set, mini-sets, and effective reps calculation', async () => {
    const { generateMyoRepsPlan } = await import('@/lib/cluster-myoreps-advisor-engine')
    
    const myoPlan = generateMyoRepsPlan({
      exerciseName: 'Dumbbell Hammer Curl',
      currentWeightLbs: 35,
      targetReps: 12,
      units: 'imperial',
    })

    expect(myoPlan.activationReps).toBe(12)
    expect(myoPlan.miniSets.length).toBe(4)
    expect(myoPlan.totalEffectiveReps).toBe(17) // 5 from activation + 4 * 3 = 17
    expect(myoPlan.totalReps).toBe(24) // 12 + 12
    expect(myoPlan.isHammerCurl).toBe(true)
    expect(myoPlan.guardrailMandate).toContain('Strict Neutral Grip Guardrail')
    expect(myoPlan.guardrailMandate).toContain('vertical dumbbell orientation')
    expect(myoPlan.notesTag).toContain('[MyoReps: 35lb × 12 + (3+3+3+3) | 15s intra-rest | 17 Effective Reps]')
  })

  it('AutoregulationDeloadAdvisor component exports cleanly and supports onApplyClusterSet / onApplyMyoReps', async () => {
    const componentModule = await import('./AutoregulationDeloadAdvisor')
    expect(componentModule.default).toBeDefined()
    expect(typeof componentModule.default).toBe('function')
  })
})
