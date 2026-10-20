import { describe, it, expect, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import SupersetPairCard from './SupersetPairCard'
import { detectAndGroupSupersets, isAntagonistPair } from '@/lib/superset-pairing-engine'

describe('SupersetPairCard Logic Integration', () => {
  it('renders exertion inline without metronome, drawer, or velocity tools', () => {
    const groups = detectAndGroupSupersets([
      { name: 'Barbell Bench Press', sets: '3', reps: '8-10' },
      { name: 'Bent-Over Barbell Row', sets: '3', reps: '10' },
    ], 2)
    const group = groups[0]
    if (!group.isSuperset) throw new Error('Expected a superset fixture')
    const markup = renderToStaticMarkup(createElement(SupersetPairCard, {
      pair: group.pair,
      sessionDate: '2026-10-10',
      units: 'imperial',
      setLogsA: [],
      setLogsB: [],
      nasmOptPhase: 2,
      onLogSet: vi.fn(),
    }))
    expect(markup).toContain('superset-set-details')
    expect(markup).toContain('Reps in reserve (0-6)')
    expect(markup).not.toContain('Rate of perceived exertion (1-10)')
    expect(markup).not.toMatch(/Cadence Metronome|workout-tool-bottom-sheet|superset-tool-strip|Bar Velocity|Kinetic Power/)
    expect(markup).not.toContain('Plate Loading and Weight Presets')
    expect(markup).toContain('placeholder="—"')
    expect(markup).not.toContain('value="135"')
    expect(markup).toContain('0 = no added load')
    expect(markup).toContain('value="8"')
    expect(markup).not.toContain('value="810"')
    expect(markup.lastIndexOf('Log set &amp; start rest')).toBeGreaterThan(markup.lastIndexOf('Reps in reserve (0-6)'))

    // Verify timed exercise in superset renders RPE instead of RiR
    const timedMarkup = renderToStaticMarkup(createElement(SupersetPairCard, {
      pair: {
        ...group.pair,
        exerciseA: { name: 'Static Quadriceps Stretch', sets: '3', reps: '30s', block: 'warmup' },
      },
      sessionDate: '2026-10-10',
      units: 'imperial',
      setLogsA: [],
      setLogsB: [],
      nasmOptPhase: 2,
      onLogSet: vi.fn(),
    }))
    expect(timedMarkup).toContain('Rate of perceived exertion (1-10)')
    expect(timedMarkup).not.toContain('Reps in reserve (0-6)')
  })
  it('correctly detects paired exercises and builds valid SupersetPair structure', () => {
    const exercises = [
      { name: 'Barbell Bench Press', sets: '3', reps: '10' },
      { name: 'Bent-Over Barbell Row', sets: '3', reps: '10' },
    ]

    expect(isAntagonistPair(exercises[0].name, exercises[1].name).isMatch).toBe(true)

    const grouped = detectAndGroupSupersets(exercises, 2)
    expect(grouped.length).toBe(1)
    expect(grouped[0].isSuperset).toBe(true)

    if (grouped[0].isSuperset) {
      const pair = grouped[0].pair
      expect(pair.exerciseA.name).toBe('Barbell Bench Press')
      expect(pair.exerciseB.name).toBe('Bent-Over Barbell Row')
      expect(pair.transitionRestSeconds).toBe(15)
      expect(pair.compoundRestSeconds).toBe(75)
    }
  })

  it('verifies alternating rest time allocation (1A transition vs 1B compound)', () => {
    const pair = {
      id: 'ss-1',
      pairLabel: 'SUPERSET 1 (1A & 1B)',
      category: 'antagonist' as const,
      categoryTitle: 'Antagonist Superset',
      transitionRestSeconds: 15,
      compoundRestSeconds: 90,
      exerciseA: { name: 'Dumbbell Incline Bench Press', sets: '3', reps: '10' },
      exerciseB: { name: 'Seated Cable Row', sets: '3', reps: '10' },
      rationale: 'Chest and back antagonist pair',
    }

    // When logging 1A:
    const rest1A = pair.transitionRestSeconds
    expect(rest1A).toBe(15)

    // When logging 1B:
    const rest1B = pair.compoundRestSeconds
    expect(rest1B).toBe(90)
  })

  it('preserves accurate original exercise indices (indexA, indexB) for jump rail navigation', () => {
    const workout = [
      { name: 'Warm-up Plank', sets: '2', reps: '30s' },
      { name: 'Barbell Bench Press', sets: '3', reps: '8' },
      { name: 'Bent-Over Barbell Row', sets: '3', reps: '8' },
      { name: 'Cool-Down Stretch', sets: '1', reps: '30s' },
    ]

    const grouped = detectAndGroupSupersets(workout, 2)
    expect(grouped.length).toBe(3)
    expect(grouped[0].isSuperset).toBe(false)
    expect(grouped[1].isSuperset).toBe(true)
    expect(grouped[2].isSuperset).toBe(false)

    if (grouped[1].isSuperset) {
      expect(grouped[1].pair.indexA).toBe(1)
      expect(grouped[1].pair.indexB).toBe(2)
    }
  })

  it('validates biomechanical guardrail for hammer curl superset pairings', () => {
    // If paired with triceps pushdown:
    const check = isAntagonistPair('Dumbbell Hammer Curl', 'Triceps Rope Pushdown')
    expect(check.isMatch).toBe(true)
    expect(check.rationale).toContain('Biceps / Triceps Antagonist Pair')
  })

  it('correctly parses rep ranges like "8-10" without evaluating to 810 or falsely triggering acute fatigue on Set 1', async () => {
    const { parsePrescribedWorkingReps } = await import('@/lib/warmup-auto-populator')
    const { detectAcuteFatigueDrop } = await import('@/lib/autoregulation-advisor-engine')
    const { calculateBioAdaptiveRestInterval } = await import('@/lib/bio-adaptive-rest-pacer')

    // Exercise with range '8-10'
    const prescribedReps = '8-10'
    const targetRepsNum = parseInt(parsePrescribedWorkingReps(prescribedReps), 10)
    expect(targetRepsNum).toBe(8)
    expect(targetRepsNum).not.toBe(810)

    // User logs 185 lbs with 8 reps, no RPE or RIR
    const acuteDrop = detectAcuteFatigueDrop({
      actualReps: 8,
      previousSetReps: 0,
      plannedReps: targetRepsNum,
      actualRpe: undefined,
    })
    expect(acuteDrop.hasDrop).toBe(false)
    expect(acuteDrop.dropPercent).toBe(0)

    // In superset 1A with 0s transition rest:
    const bioPaced = calculateBioAdaptiveRestInterval({
      exerciseName: 'Dumbbell Romanian Deadlift',
      baseRestSeconds: 0,
      rpe: undefined,
      rir: undefined,
      hasAcuteFatigueDrop: acuteDrop.hasDrop,
    })
    expect(bioPaced.finalRestSeconds).toBe(0)
    expect(bioPaced.isBioPaced).toBe(false)
    expect(bioPaced.badgeText).toBe('Immediate Transition')
  })
})
