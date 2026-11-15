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

    it('enforces Coach Gordon drawer, escalation modal, and default-muted voice contracts', async () => {
      const fs = await import('fs')
      const path = await import('path')

      const assistantSrc = fs.readFileSync(
        path.resolve(__dirname, '../coach-gordon/CoachGordonAssistant.tsx'),
        'utf-8'
      )
      expect(assistantSrc).not.toContain('min-h-[38px]')
      expect(assistantSrc).toContain('role="log"')
      expect(assistantSrc).toContain('closeBtnRef.current?.focus({ preventScroll: true })')
      expect(assistantSrc).toContain('data-testid="coach-action-applied-badge"')

      const escalationSrc = fs.readFileSync(
        path.resolve(__dirname, '../coach-gordon/CoachEscalationModal.tsx'),
        'utf-8'
      )
      expect(escalationSrc).toContain("closedby: 'any'")
      expect(escalationSrc).toContain('zIndex: 100060')
      expect(escalationSrc).toContain("'escalation_sms'")
      expect(escalationSrc).toContain("'escalation_email'")
      expect(escalationSrc).not.toContain('if (e.target === e.currentTarget) onClose()')

      const synthSrc = fs.readFileSync(
        path.resolve(__dirname, '../../lib/coach-voice-synthesizer.ts'),
        'utf-8'
      )
      expect(synthSrc).toContain("if (getCoachAudioMode() !== 'voice_and_chimes') return null")

      const engineSrc = fs.readFileSync(
        path.resolve(__dirname, '../../src/lib/audio/coachVoiceEngine.ts'),
        'utf-8'
      )
      expect(engineSrc).toContain('stopCoachVoiceCue()')
    })

    it('falls back to audit_fallback in recordTelemetryBatch when DB rejects escalation_* on legacy 23514 check constraint', async () => {
      const { recordTelemetryBatch, __resetServerTelemetryFallbackForTests } = await import(
        '@/lib/telemetry-storage'
      )
      __resetServerTelemetryFallbackForTests()

      const fakeAdmin = {
        from: (table: string) => {
          if (table === 'client_telemetry_events') {
            return {
              select: () => ({
                in: async () => ({ data: [], error: null }),
              }),
              upsert: async () => ({
                error: {
                  code: '23514',
                  message: 'new row violates check constraint "client_telemetry_events_event_type_check"',
                },
              }),
            }
          }
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: async () => ({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            insert: async () => ({ error: null }),
          }
        },
      }

      const res = await recordTelemetryBatch(fakeAdmin as never, 'user-123', [
        {
          event_id: '550e8400-e29b-41d4-a716-446655440000',
          event_type: 'escalation_sms',
          session_id: 'sess-1',
          client_timestamp: '2026-11-15T15:00:00.000Z',
          timezone_offset_mins: -300,
          platform: 'mobile_web',
          app_version: '1.0.0',
          payload: {
            tier_id: 'coach_support',
            source_context: 'safety_override',
            sla_badge: '24h Priority SLA',
          },
        },
      ])

      expect(res.storageMode).toBe('audit_fallback')
      expect(res.insertedCount).toBe(1)
    })
  })
})

