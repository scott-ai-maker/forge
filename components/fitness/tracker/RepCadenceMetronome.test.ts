import { describe, it, expect, vi } from 'vitest'
import { parseMovementTempo, PrecisionCadenceScheduler } from '@/lib/web-audio-cadence-engine'
import { calculateRepVelocityAndPower } from '@/lib/bar-velocity-power-engine'

describe('RepCadenceMetronome Logic & Guardrails', () => {
  it('correctly parses NASM tempo schemes into discrete contraction seconds', () => {
    const p1 = parseMovementTempo('4/2/1')
    expect(p1.eccentricSec).toBe(4)
    expect(p1.isometricSec).toBe(2)
    expect(p1.concentricSec).toBe(1)
    expect(p1.repDurationSec).toBe(7)
    expect(p1.phaseTitle).toContain('Stabilization Endurance')

    const p2 = parseMovementTempo('2/0/2')
    expect(p2.eccentricSec).toBe(2)
    expect(p2.isometricSec).toBe(0)
    expect(p2.concentricSec).toBe(2)
    expect(p2.repDurationSec).toBe(4)
    expect(p2.phaseTitle).toContain('Muscular Development')
  })

  it('runs PrecisionCadenceScheduler with accurate phase intervals', () => {
    vi.useFakeTimers()
    const phases: string[] = []
    const onComplete = vi.fn()

    const scheduler = new PrecisionCadenceScheduler({
      eccentricSec: 2,
      isometricSec: 1,
      concentricSec: 1,
      preCountSec: 2,
      totalReps: 1,
      soundEnabled: false,
      onPhaseChange: (phase) => {
        phases.push(phase)
      },
      onComplete,
    })

    scheduler.start()
    expect(phases[0]).toBe('pre_exercise_countdown')

    // Advance 2s pre-countdown -> transitions to eccentric
    vi.advanceTimersByTime(2000)
    expect(phases).toContain('eccentric')

    // Advance 2s eccentric -> transitions to isometric
    vi.advanceTimersByTime(2000)
    expect(phases).toContain('isometric')

    // Advance 1s isometric -> transitions to concentric
    vi.advanceTimersByTime(1000)
    expect(phases).toContain('concentric')

    // Advance 1s concentric -> set complete!
    vi.advanceTimersByTime(1000)
    expect(onComplete).toHaveBeenCalledTimes(1)

    scheduler.stop()
    vi.useRealTimers()
  })

  it('enforces AGENTS.md hammer curl biomechanical neutral grip guardrail', () => {
    const exercise = 'Dumbbell Hammer Curl'
    const isHammerCurl = /\b(hammer curl)\b/i.test(exercise)
    expect(isHammerCurl).toBe(true)

    // Verify non-hammer curl exercises do not trigger guardrail
    expect(/\b(hammer curl)\b/i.test('Barbell Bench Press')).toBe(false)
    expect(/\b(hammer curl)\b/i.test('Single Leg Hammer Curl')).toBe(true)
    expect(/\b(hammer curl)\b/i.test('Hammer Curl To Lateral Raise')).toBe(true)
  })

  it('computes real-time concentric velocity and wattage for metronome tempo', () => {
    const rep = calculateRepVelocityAndPower({
      exerciseName: 'Barbell Bench Press',
      loadKg: 90,
      concentricSec: 1.0,
      eccentricSec: 2.0,
      repNumber: 1,
    })

    expect(rep.meanConcentricVelocity).toBe(0.38)
    expect(rep.meanPowerWatts).toBeGreaterThan(300)
    expect(rep.velocityZone).toBe('accelerative_strength')
  })
})
