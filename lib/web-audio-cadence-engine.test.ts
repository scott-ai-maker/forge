import { describe, it, expect, vi } from 'vitest'
import {
  CADENCE_FREQUENCIES,
  PrecisionCadenceScheduler,
  parseMovementTempo,
  playPrecisionTone,
  playPrFanfare,
  playRestChime,
} from './web-audio-cadence-engine'

describe('web-audio-cadence-engine', () => {
  it('defines correct biomechanical frequency palette', () => {
    expect(CADENCE_FREQUENCIES.PRE_COUNT).toBe(523.25)
    expect(CADENCE_FREQUENCIES.ECCENTRIC_TICK).toBe(440.0)
    expect(CADENCE_FREQUENCIES.ISOMETRIC_HOLD).toBe(329.63)
    expect(CADENCE_FREQUENCIES.CONCENTRIC_DRIVE).toBe(880.0)
    expect(CADENCE_FREQUENCIES.REP_COMPLETE).toBe(659.25)
  })

  it('runs playPrecisionTone, playPrFanfare, and playRestChime safely in test environment', () => {
    expect(() => playPrecisionTone({ freq: 440 })).not.toThrow()
    expect(() => playPrFanfare()).not.toThrow()
    expect(() => playRestChime()).not.toThrow()
  })

  it('initializes PrecisionCadenceScheduler and transitions phases correctly', () => {
    vi.useFakeTimers()
    const phaseChanges: Array<{ phase: string; rep: number; sec: number }> = []
    const onComplete = vi.fn()

    const scheduler = new PrecisionCadenceScheduler({
      eccentricSec: 4,
      isometricSec: 2,
      concentricSec: 1,
      preCountSec: 3,
      totalReps: 2,
      soundEnabled: false,
      onPhaseChange: (phase, rep, sec) => {
        phaseChanges.push({ phase, rep, sec })
      },
      onComplete,
    })

    scheduler.start()
    expect(phaseChanges[0]).toEqual({ phase: 'pre_exercise_countdown', rep: 0, sec: 3 })

    // Advance 3 seconds through pre-countdown
    vi.advanceTimersByTime(1000)
    expect(phaseChanges[phaseChanges.length - 1].sec).toBe(2)

    vi.advanceTimersByTime(1000)
    expect(phaseChanges[phaseChanges.length - 1].sec).toBe(1)

    vi.advanceTimersByTime(1000)
    // Now transitioned to eccentric phase Rep 1
    const current = phaseChanges[phaseChanges.length - 1]
    expect(current.phase).toBe('eccentric')
    expect(current.rep).toBe(1)
    expect(current.sec).toBe(4)

    scheduler.stop()
    vi.useRealTimers()
  })

  it('parses diverse movement tempo notations accurately', () => {
    const t1 = parseMovementTempo('4/2/1')
    expect(t1.isValid).toBe(true)
    expect(t1.eccentricSec).toBe(4)
    expect(t1.isometricSec).toBe(2)
    expect(t1.concentricSec).toBe(1)
    expect(t1.repDurationSec).toBe(7)
    expect(t1.phaseTitle).toContain('Phase 1')

    const t2 = parseMovementTempo('2/0/2')
    expect(t2.isValid).toBe(true)
    expect(t2.eccentricSec).toBe(2)
    expect(t2.isometricSec).toBe(0)
    expect(t2.concentricSec).toBe(2)
    expect(t2.repDurationSec).toBe(4)

    const tPower = parseMovementTempo('X/0/X')
    expect(tPower.isValid).toBe(true)
    expect(tPower.eccentricSec).toBe(1)
    expect(tPower.isometricSec).toBe(0)
    expect(tPower.concentricSec).toBe(1)
    expect(tPower.phaseTitle).toContain('Phase 5')

    const fallback = parseMovementTempo(null)
    expect(fallback.isValid).toBe(false)
    expect(fallback.eccentricSec).toBe(2)
    expect(fallback.concentricSec).toBe(2)
  })

  it('supports pause and resume during execution', () => {
    vi.useFakeTimers()
    const scheduler = new PrecisionCadenceScheduler({
      eccentricSec: 3,
      isometricSec: 1,
      concentricSec: 1,
      preCountSec: 0,
      totalReps: 3,
      soundEnabled: false,
    })

    scheduler.start()
    expect(scheduler.getIsRunning()).toBe(true)
    expect(scheduler.getIsPaused()).toBe(false)
    expect(scheduler.getCurrentPhase()).toBe('eccentric')

    scheduler.pause()
    expect(scheduler.getIsPaused()).toBe(true)

    scheduler.resume()
    expect(scheduler.getIsPaused()).toBe(false)

    scheduler.stop()
    expect(scheduler.getIsRunning()).toBe(false)
    vi.useRealTimers()
  })
})

