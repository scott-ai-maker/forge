import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyExpressCapToInjectedDrills,
  buildSynthetic3RepTrajectory,
  createReadinessRepSession,
  finalizeReadinessSession,
  ingestPoseFrameIntoSession,
} from '@/lib/camera-readiness-engine'
import {
  loadPostureProfileState,
  POSTURE_PROFILE_STORAGE_KEY,
  recordDailyReadinessAndComfort,
  removeInjectedWarmupForToday,
  setExpressModeActive,
} from '@/lib/posture-profile-state'

const REPO_ROOT = process.cwd()
const CHECK_PATH = path.join(REPO_ROOT, 'components/fitness/CameraReadinessCheck.tsx')
const BRIDGE_PATH = path.join(REPO_ROOT, 'components/fitness/PreWorkoutReadinessBridge.tsx')
const GLOBALS_CSS_PATH = path.join(REPO_ROOT, 'app/globals.css')

function installMemoryWindowStorage() {
  const store = new Map<string, string>()
  const listeners = new Map<string, Set<() => void>>()
  const fakeWindow = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
    },
    addEventListener: (evt: string, fn: () => void) => {
      if (!listeners.has(evt)) listeners.set(evt, new Set())
      listeners.get(evt)!.add(fn)
    },
    removeEventListener: (evt: string, fn: () => void) => {
      listeners.get(evt)?.delete(fn)
    },
    dispatchEvent: (event: { type: string }) => {
      listeners.get(event.type)?.forEach(fn => fn())
      return true
    },
  }
  // @ts-expect-error node test shim for window + CustomEvent
  globalThis.window = fakeWindow
  if (typeof globalThis.CustomEvent === 'undefined') {
    // @ts-expect-error minimal CustomEvent shim for node environment
    globalThis.CustomEvent = class CustomEvent {
      type: string
      constructor(type: string) {
        this.type = type
      }
    }
  }
  return store
}

describe('CameraReadinessCheck & PreWorkoutReadinessBridge — Component & Integration Contracts', () => {
  const checkSource = fs.readFileSync(CHECK_PATH, 'utf8')
  const bridgeSource = fs.readFileSync(BRIDGE_PATH, 'utf8')
  const globalsCss = fs.readFileSync(GLOBALS_CSS_PATH, 'utf8')

  beforeEach(() => {
    const store = installMemoryWindowStorage()
    store.delete(POSTURE_PROFILE_STORAGE_KEY)
  })

  it('removes leaked developer Simulate Readiness Check <select> and uses accessible <details> self-check disclosure', () => {
    expect(checkSource).not.toContain('Simulate Readiness Check:')
    expect(checkSource).not.toContain('id="simulate-readiness-preset"')
    expect(checkSource).not.toContain('>Run Preset<')

    expect(checkSource).toContain('data-testid="readiness-self-check-disclosure"')
    expect(checkSource).toContain('<details')
    expect(checkSource).toContain('<summary')
    // Accessibility requirement: never nest heading elements inside <summary>
    const summaryMatch = checkSource.match(/<summary[\s\S]*?<\/summary>/)
    expect(summaryMatch).not.toBeNull()
    expect(summaryMatch![0]).not.toMatch(/<h[1-6]\b/i)
  })

  it('wires real MediaPipe 33-point PoseLandmarker VIDEO loop, 5s countdown, and hardware release on dialog close', () => {
    expect(checkSource).toContain('PoseLandmarker.createFromOptions')
    expect(checkSource).toContain("runningMode: 'VIDEO'")
    expect(checkSource).toContain('detectForVideo')
    expect(checkSource).toContain("forVisionTasks('/wasm')")
    expect(checkSource).toContain('ingestPoseFrameIntoSession')
    expect(checkSource).toContain('finalizeReadinessSession')
    expect(checkSource).toContain('COUNTDOWN_SECONDS = 5')
    expect(checkSource).toContain('SCAN_WINDOW_SECONDS = 25')
    expect(checkSource).toContain('<progress')

    // Parent <dialog> passes isOpen={modalOpen} and CameraReadinessCheck stops tracks when !isOpen
    expect(bridgeSource).toContain('isOpen={modalOpen}')
    expect(checkSource).toContain('if (!isOpen)')
    expect(checkSource).toContain('cleanupCamera()')
  })

  it('enforces native <dialog> light-dismiss, bounding-rect pointer fallback, and backdrop scroll containment', () => {
    expect(bridgeSource).toContain('<dialog')
    expect(bridgeSource).toContain("closedby: 'any'")
    expect(bridgeSource).not.toContain('role="dialog"')
    expect(bridgeSource).not.toContain('aria-modal')
    expect(bridgeSource).toContain("'closedBy' in HTMLDialogElement.prototype")
    expect(bridgeSource).toContain('getBoundingClientRect()')
    expect(bridgeSource).toContain("addEventListener('pointerdown'")
    expect(bridgeSource).toContain("addEventListener('pointerup'")

    expect(globalsCss).toContain('dialog.forge-glass-modal:modal')
    expect(globalsCss).toContain('dialog.forge-glass-modal::backdrop')
    expect(globalsCss).toContain('overscroll-behavior: contain;')
  })

  it('persists uncapped readiness drills to posture profile state and dynamically toggles 90s Express cap', () => {
    let session = createReadinessRepSession('overhead_squat')
    for (const frame of buildSynthetic3RepTrajectory('overhead_squat', 'tight_hips_ankles')) {
      session = ingestPoseFrameIntoSession(session, frame.landmarks, frame.timestampMs).session
    }
    const fullEval = finalizeReadinessSession(session, false)!
    expect(fullEval.injectedDrills).toHaveLength(3)
    expect(fullEval.totalInjectedDurationSec).toBe(150)

    recordDailyReadinessAndComfort({
      readinessScore: fullEval.readinessScore,
      screenType: fullEval.screenMode,
      restrictionFlags: fullEval.restrictionFlags,
      injectedDrills: fullEval.injectedDrills,
    })

    const saved = loadPostureProfileState()
    expect(saved.injectedWarmupDrills).toHaveLength(3)

    // Toggle 20m Express ON -> caps to 2 drills and <= 90s
    setExpressModeActive(true)
    const expressState = loadPostureProfileState()
    expect(expressState.expressModeActive).toBe(true)
    const capped = applyExpressCapToInjectedDrills(
      expressState.injectedWarmupDrills,
      expressState.expressModeActive
    )
    expect(capped).toHaveLength(2)
    expect(capped.reduce((sum, d) => sum + d.durationSec, 0)).toBeLessThanOrEqual(90)

    // Toggle 20m Express OFF -> restores full 3 drills (150s) without losing drill #3
    setExpressModeActive(false)
    const restoredState = loadPostureProfileState()
    const uncapped = applyExpressCapToInjectedDrills(
      restoredState.injectedWarmupDrills,
      restoredState.expressModeActive
    )
    expect(uncapped).toHaveLength(3)
    expect(uncapped.reduce((sum, d) => sum + d.durationSec, 0)).toBe(150)

    // Removing injected warm-up clears drills cleanly for today
    removeInjectedWarmupForToday()
    expect(loadPostureProfileState().injectedWarmupDrills).toHaveLength(0)
  })
})
