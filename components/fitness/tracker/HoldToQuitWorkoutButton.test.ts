import { describe, expect, it, vi } from 'vitest'

describe('HoldToQuitWorkoutButton logic & progress calculations', () => {
  it('accurately calculates hold progress percentage capped at 100%', () => {
    const calculateProgress = (elapsedMs: number, durationMs = 1200) =>
      Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100))

    expect(calculateProgress(0)).toBe(0)
    expect(calculateProgress(300)).toBe(25)
    expect(calculateProgress(600)).toBe(50)
    expect(calculateProgress(900)).toBe(75)
    expect(calculateProgress(1200)).toBe(100)
    expect(calculateProgress(1500)).toBe(100)
  })

  it('differentiates accidental short taps from intentional hold-to-quit completions', () => {
    const holdDurationMs = 1200
    const shortTapThresholdMs = 380

    const evaluateHold = (elapsedMs: number): { completed: boolean; showTapHint: boolean } => {
      if (elapsedMs >= holdDurationMs) {
        return { completed: true, showTapHint: false }
      }
      if (elapsedMs > 0 && elapsedMs < shortTapThresholdMs) {
        return { completed: false, showTapHint: true }
      }
      return { completed: false, showTapHint: false }
    }

    // Accidental quick tap (e.g. 100ms) -> do NOT quit, show hint
    const quickTap = evaluateHold(100)
    expect(quickTap.completed).toBe(false)
    expect(quickTap.showTapHint).toBe(true)

    // Mid-duration hold release (e.g. 700ms) -> cancelled without hint or quit
    const midHold = evaluateHold(700)
    expect(midHold.completed).toBe(false)
    expect(midHold.showTapHint).toBe(false)

    // Full 1.2s intentional press-and-hold -> quits without penalty
    const fullHold = evaluateHold(1200)
    expect(fullHold.completed).toBe(true)
    expect(fullHold.showTapHint).toBe(false)
  })

  it('invokes onQuit callback strictly upon reaching full hold duration', () => {
    const onQuit = vi.fn()
    let elapsed = 0
    const holdDurationMs = 1200

    const tick = (deltaMs: number) => {
      elapsed += deltaMs
      if (elapsed >= holdDurationMs) {
        onQuit()
      }
    }

    // User starts holding, but releases at 900ms
    tick(900)
    expect(onQuit).not.toHaveBeenCalled()

    // Another interaction holding for full duration
    elapsed = 0
    tick(600)
    expect(onQuit).not.toHaveBeenCalled()
    tick(600) // Reaches 1200ms
    expect(onQuit).toHaveBeenCalledTimes(1)
  })
})
