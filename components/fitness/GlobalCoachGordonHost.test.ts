import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  openCoachGordon,
  closeCoachGordon,
  shouldShowCoachGordonFab,
  type CoachGordonContext,
} from './GlobalCoachGordonHost'

describe('GlobalCoachGordonHost Event Bus & Integration', () => {
  const originalWindow = (globalThis as unknown as { window?: unknown }).window

  beforeEach(() => {
    const listeners: Record<string, ((event: unknown) => void)[]> = {}
    ;(globalThis as unknown as { window: unknown }).window = {
      addEventListener: vi.fn((type: string, handler: (event: unknown) => void) => {
        listeners[type] = listeners[type] || []
        listeners[type].push(handler)
      }),
      removeEventListener: vi.fn((type: string, handler: (event: unknown) => void) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter(h => h !== handler)
        }
      }),
      dispatchEvent: vi.fn((event: { type: string; detail?: unknown }) => {
        if (listeners[event.type]) {
          listeners[event.type].forEach(h => h(event))
        }
        return true
      }),
    }
  })

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window
    } else {
      ;(globalThis as unknown as { window: unknown }).window = originalWindow
    }
  })

  it('dispatches open-coach-gordon event with telemetry context', () => {
    const eventHandler = vi.fn()
    window.addEventListener('open-coach-gordon', eventHandler)

    const testContext: CoachGordonContext = {
      athleteName: 'Jordan Vance',
      goal: 'hypertrophy',
      nasmOptPhase: 3,
      currentWorkoutFocus: 'Hypertrophy Upper Body',
      currentExerciseName: 'Incline Dumbbell Bench Press',
      equipmentAccess: ['dumbbells', 'bench'],
      recentReadinessScore: 92,
    }

    openCoachGordon(testContext)

    expect(window.dispatchEvent).toHaveBeenCalledTimes(1)
    expect(eventHandler).toHaveBeenCalledTimes(1)
    const event = eventHandler.mock.calls[0][0] as CustomEvent<CoachGordonContext>
    expect(event.detail).toEqual(testContext)
  })

  it('dispatches close-coach-gordon event cleanly', () => {
    const eventHandler = vi.fn()
    window.addEventListener('close-coach-gordon', eventHandler)

    closeCoachGordon()

    expect(window.dispatchEvent).toHaveBeenCalledTimes(1)
    expect(eventHandler).toHaveBeenCalledTimes(1)
  })

  it('openCoachGordon handles empty/omitted context safely', () => {
    const eventHandler = vi.fn()
    window.addEventListener('open-coach-gordon', eventHandler)

    openCoachGordon()

    expect(window.dispatchEvent).toHaveBeenCalledTimes(1)
    expect(eventHandler).toHaveBeenCalledTimes(1)
    const event = eventHandler.mock.calls[0][0] as CustomEvent<CoachGordonContext>
    expect(event.detail).toEqual({})
  })

  it('handles server-side / SSR execution gracefully when window is undefined', () => {
    delete (globalThis as unknown as { window?: unknown }).window
    expect(() => openCoachGordon({ athleteName: 'Test' })).not.toThrow()
    expect(() => closeCoachGordon()).not.toThrow()
  })

  describe('Page Filtering & Contextual Floating Button Suppression', () => {
    it('shows the Ask Coach Gordon floating button ONLY on /dashboard and /dashboard/fitness', () => {
      expect(shouldShowCoachGordonFab('/dashboard')).toBe(true)
      expect(shouldShowCoachGordonFab('/dashboard/')).toBe(true)
      expect(shouldShowCoachGordonFab('/dashboard?view=metrics')).toBe(true)
      expect(shouldShowCoachGordonFab('/dashboard/fitness')).toBe(true)
      expect(shouldShowCoachGordonFab('/dashboard/fitness?tab=acwr')).toBe(true)
      expect(shouldShowCoachGordonFab('/dashboard/fitness/periodization')).toBe(true)
    })

    it('hides the Ask Coach Gordon floating button on pages where it does not make sense', () => {
      // Concierge chat with coach
      expect(shouldShowCoachGordonFab('/dashboard/messages')).toBe(false)
      expect(shouldShowCoachGordonFab('/dashboard/messages/chat')).toBe(false)

      // Live 1:1 telehealth WebRTC video studio
      expect(shouldShowCoachGordonFab('/dashboard/live')).toBe(false)

      // Consultation booking
      expect(shouldShowCoachGordonFab('/dashboard/book')).toBe(false)

      // Account & profile settings
      expect(shouldShowCoachGordonFab('/dashboard/settings')).toBe(false)

      // Onboarding & PAR-Q intake wizard
      expect(shouldShowCoachGordonFab('/dashboard/onboarding')).toBe(false)

      // Sunday executive dossier report
      expect(shouldShowCoachGordonFab('/dashboard/dossier')).toBe(false)

      // Non-dashboard pages
      expect(shouldShowCoachGordonFab('/coach')).toBe(false)
      expect(shouldShowCoachGordonFab('/')).toBe(false)
      expect(shouldShowCoachGordonFab('')).toBe(false)
      expect(shouldShowCoachGordonFab(null)).toBe(false)
      expect(shouldShowCoachGordonFab(undefined)).toBe(false)
    })

    it('verifies globals.css includes suppression rules during active workout tracking and modals', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const cssPath = path.resolve(__dirname, '../../app/globals.css')
      const content = fs.readFileSync(cssPath, 'utf-8')

      expect(content).toContain('.global-coach-gordon-fab')
      expect(content).toContain('body:has(.live-session-sticky-dock) .global-coach-gordon-fab')
      expect(content).toContain('body:has(.floating-rest-timer-dock) .global-coach-gordon-fab')
      expect(content).toContain('body:has([aria-label="Coach Gordon Cardio Studio"]) .global-coach-gordon-fab')
    })
  })
})

