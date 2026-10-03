import { describe, it, expect } from 'vitest'
import {
  evaluateExerciseAutoregulation,
  computeSessionRpeTelemetry,
  isHammerCurlExercise,
  detectAcuteFatigueDrop,
  generateBackOffAndDropSetPlan,
} from './autoregulation-advisor-engine'

describe('Dynamic Autoregulation & Session RPE Deload Advisor Engine', () => {
  it('identifies fresh state when no working sets have been completed', () => {
    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Bench Press',
      currentDraftWeightLbs: 225,
      currentDraftReps: 8,
      targetReps: 8,
      completedSets: [],
      units: 'imperial',
    })

    expect(advice.action).toBe('maintain')
    expect(advice.fatigueLevel).toBe('fresh')
    expect(advice.headline).toContain('Fresh Neuromuscular Reserve')
  })

  it('prescribes −10% back-off load when 2 consecutive sets reach involuntary failure', () => {
    const sets = [
      { setNumber: 1, weightLbs: 225, reps: 8, rpe: 10, rir: 0, isWarmup: false },
      { setNumber: 2, weightLbs: 225, reps: 6, rpe: 10, rir: 0, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Back Squat',
      currentDraftWeightLbs: 225,
      currentDraftReps: 8,
      targetReps: 8,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.action).toBe('reduce_load_10pct')
    expect(advice.fatigueLevel).toBe('critical_overload')
    expect(advice.suggestedWeightLbs).toBe(205) // 225 * 0.9 = 202.5 -> 205 lbs
    expect(advice.suggestedRestExtensionSeconds).toBe(45)
    expect(advice.headline).toContain('Consecutive Involuntary Failure')
  })

  it('prescribes −5% load reduction when rep target is missed at RIR 0', () => {
    const sets = [
      { setNumber: 1, weightLbs: 200, reps: 6, rpe: 9.5, rir: 0, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Overhead Press',
      currentDraftWeightLbs: 200,
      currentDraftReps: 8,
      targetReps: 8,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.action).toBe('reduce_load_5pct')
    expect(advice.fatigueLevel).toBe('elevated_fatigue')
    expect(advice.suggestedWeightLbs).toBe(190) // 200 * 0.95 = 190 lbs
    expect(advice.suggestedRestExtensionSeconds).toBe(30)
    expect(advice.headline).toContain('Rep Target Missed at Failure')
  })

  it('prescribes rep cap when rep drop-off >= 2 reps occurs across consecutive sets', () => {
    const sets = [
      { setNumber: 1, weightLbs: 185, reps: 10, rpe: 8, rir: 2, isWarmup: false },
      { setNumber: 2, weightLbs: 185, reps: 8, rpe: 9, rir: 1, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Incline Dumbbell Press',
      currentDraftWeightLbs: 185,
      currentDraftReps: 10,
      targetReps: 10,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.action).toBe('cap_reps')
    expect(advice.suggestedReps).toBe(8)
    expect(advice.headline).toContain('Velocity Loss & Rep Decay Detected')
  })

  it('maintains scheduled load when working within optimal RIR zone (RIR 1-3)', () => {
    const sets = [
      { setNumber: 1, weightLbs: 315, reps: 5, rpe: 8, rir: 2, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Deadlift',
      currentDraftWeightLbs: 315,
      currentDraftReps: 5,
      targetReps: 5,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.action).toBe('maintain')
    expect(advice.fatigueLevel).toBe('optimal_strain')
    expect(advice.badgeText).toContain('2 RIR')
  })

  it('enforces strict neutral grip guardrail for hammer curl exercises under fatigue', () => {
    expect(isHammerCurlExercise('Dumbbell Hammer Curl')).toBe(true)
    expect(isHammerCurlExercise('Single Leg Hammer Curl')).toBe(true)
    expect(isHammerCurlExercise('Hammer Curl To Lateral Raise')).toBe(true)
    expect(isHammerCurlExercise('Barbell Biceps Curl')).toBe(false)

    const sets = [
      { setNumber: 1, weightLbs: 45, reps: 8, rpe: 10, rir: 0, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Dumbbell Hammer Curl',
      currentDraftWeightLbs: 45,
      currentDraftReps: 10,
      targetReps: 10,
      completedSets: sets,
    })

    expect(advice.isHammerCurl).toBe(true)
    expect(advice.biomechanicalWarning).toContain('Strict Neutral Grip Guardrail')
    expect(advice.biomechanicalWarning).toContain('thumbs pointing up')
    expect(advice.biomechanicalWarning).toContain('zero wrist supination/twisting')
  })

  it('computes Foster Session RPE and training load across workout', () => {
    const sets = [
      { setNumber: 1, weightLbs: 225, reps: 8, rpe: 8, rir: 2, isWarmup: false },
      { setNumber: 2, weightLbs: 225, reps: 8, rpe: 8.5, rir: 1.5, isWarmup: false },
      { setNumber: 3, weightLbs: 225, reps: 7, rpe: 9.5, rir: 0.5, isWarmup: false },
    ]

    const metrics = computeSessionRpeTelemetry(sets, 50)
    expect(metrics.totalWorkingSets).toBe(3)
    expect(metrics.averageRpe).toBeGreaterThanOrEqual(8.5)
    expect(metrics.fosterTrainingLoadAu).toBe(Math.round(metrics.sessionRpeFoster * 50))
    expect(metrics.loadZone).toBe('optimal')
  })

  it('detects acute fatigue drop (>15% threshold) from rep loss and velocity loss', () => {
    // 10 planned/previous reps -> dropped to 7 reps (30% drop)
    const severeDrop = detectAcuteFatigueDrop({
      plannedReps: 10,
      actualReps: 7,
      previousSetReps: 10,
      actualRpe: 9.5,
    })
    expect(severeDrop.hasDrop).toBe(true)
    expect(severeDrop.dropPercent).toBe(30)
    expect(severeDrop.severity).toBe('severe')

    // Moderate drop: 10 planned -> 8 reps (20% drop)
    const moderateDrop = detectAcuteFatigueDrop({
      plannedReps: 10,
      actualReps: 8,
    })
    expect(moderateDrop.hasDrop).toBe(true)
    expect(moderateDrop.dropPercent).toBe(20)
    expect(moderateDrop.severity).toBe('moderate')

    // Below threshold: 10 planned -> 9 reps (10% drop, under 15% threshold)
    const mild = detectAcuteFatigueDrop({
      plannedReps: 10,
      actualReps: 9,
    })
    expect(mild.hasDrop).toBe(false)
    expect(mild.dropPercent).toBe(10)
    expect(mild.severity).toBe('mild')
  })

  it('generates optimal back-off loads and auto-regulated drop-set plans', () => {
    const plan = generateBackOffAndDropSetPlan({
      exerciseName: 'Barbell Bench Press',
      currentWeightLbs: 225,
      currentReps: 6,
      targetReps: 8,
      fatigueDropPercent: 25, // severe fatigue -> 15% reduction
      units: 'imperial',
    })

    // 225 * 0.85 = 191.25 -> rounded to 190 lbs
    expect(plan.backOffPlan.backOffWeightLbs).toBe(190)
    expect(plan.backOffPlan.reductionPercent).toBe(15)
    expect(plan.dropSetRecommendation.shouldConvert).toBe(true)
    expect(plan.dropSetRecommendation.stages.length).toBe(3)
    expect(plan.dropSetRecommendation.stages[0].weightLbs).toBe(225)
    expect(plan.dropSetRecommendation.stages[1].weightLbs).toBeLessThan(225)
    expect(plan.coachVoiceCue).toContain('Acute fatigue drop detected')
  })

  it('surfaces back-off load and drop-set recommendation in evaluateExerciseAutoregulation on acute drop', () => {
    // Set 1: 10 reps @ 200 lb, Set 2: 7 reps @ 200 lb (30% drop)
    const sets = [
      { setNumber: 1, weightLbs: 200, reps: 10, rpe: 8, rir: 2, isWarmup: false },
      { setNumber: 2, weightLbs: 200, reps: 7, rpe: 9.5, rir: 0.5, isWarmup: false },
    ]

    const advice = evaluateExerciseAutoregulation({
      exerciseName: 'Barbell Back Squat',
      currentDraftWeightLbs: 200,
      currentDraftReps: 10,
      targetReps: 10,
      completedSets: sets,
      units: 'imperial',
    })

    expect(advice.hasAcuteFatigueDrop).toBe(true)
    expect(advice.acuteFatigueDropPercent).toBeGreaterThanOrEqual(15)
    expect(advice.backOffPlan).toBeDefined()
    expect(advice.backOffPlan?.backOffWeightLbs).toBeLessThan(200)
    expect(advice.dropSetRecommendation).toBeDefined()
    expect(advice.dropSetRecommendation?.shouldConvert).toBe(true)
    expect(advice.dropSetRecommendation?.stages.length).toBe(3)
  })
})
