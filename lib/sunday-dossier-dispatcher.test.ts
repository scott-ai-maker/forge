import { beforeEach, describe, expect, it, vi } from 'vitest'

const { adminMock, notifyUserMock } = vi.hoisted(() => ({
  adminMock: vi.fn(),
  notifyUserMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({ supabaseAdmin: adminMock }))
vi.mock('@/lib/notifications', () => ({ notifyUser: notifyUserMock }))

import { dispatchSundayPerformanceDossiers } from './sunday-dossier-dispatcher'

describe('dispatchSundayPerformanceDossiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notifyUserMock.mockResolvedValue({ channels: ['push', 'email'] })
  })

  function createMockAdmin(opts: {
    clients?: { id: string; full_name?: string; email?: string; role: string }[]
    existingLogs?: string[]
    setLogs?: { session_date: string; weight_lbs: number; reps: number; is_warmup?: boolean; rpe?: number; exercise_name?: string }[]
    cardioLogs?: { session_date: string; activity_type: string; duration_mins: number; avg_heart_rate?: number }[]
    prs?: { exercise_name: string; weight_lbs: number; reps: number; achieved_at: string }[]
  }) {
    const clients = opts.clients ?? [
      { id: 'c1', full_name: 'Marcus Vance', email: 'marcus@example.com', role: 'client' },
    ]
    const existingLogs = new Set(opts.existingLogs ?? [])

    const from = (table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = () => chain
      chain.eq = (_col: string, val: string) => {
        if (table === 'notification_log' && existingLogs.has(val)) {
          chain._isExisting = true
        }
        return chain
      }
      chain.gte = () => chain
      chain.order = () => chain
      chain.limit = () => chain
      chain.maybeSingle = () => {
        if (table === 'notification_log') {
          return Promise.resolve({ data: chain._isExisting ? { id: 'log_1' } : null })
        }
        if (table === 'workout_plans') {
          return Promise.resolve({
            data: { nasm_opt_phase: 2, phase_name: 'Strength Endurance', goal: 'hypertrophy' },
          })
        }
        if (table === 'fitness_profiles') {
          return Promise.resolve({ data: { fitness_goal: 'Strength & Hypertrophy' } })
        }
        if (table === 'athlete_wearable_metrics') {
          return Promise.resolve({ data: { resting_heart_rate: 52, hrv_rmssd_ms: 74 } })
        }
        return Promise.resolve({ data: null })
      }

      // Default resolution for array queries
      const resolveArray = () => {
        if (table === 'clients') return Promise.resolve({ data: clients, error: null })
        if (table === 'workout_set_logs') {
          return Promise.resolve({
            data: opts.setLogs ?? [
              { session_date: '2026-10-24', weight_lbs: 225, reps: 5, is_warmup: false, rpe: 8, exercise_name: 'Barbell Squat' },
              { session_date: '2026-10-24', weight_lbs: 225, reps: 5, is_warmup: false, rpe: 8, exercise_name: 'Barbell Squat' },
              { session_date: '2026-10-22', weight_lbs: 185, reps: 8, is_warmup: false, rpe: 8, exercise_name: 'Bench Press' },
            ],
            error: null,
          })
        }
        if (table === 'cardio_logs') {
          return Promise.resolve({
            data: opts.cardioLogs ?? [
              { session_date: '2026-10-23', activity_type: 'Zone 2 Rower', duration_mins: 25, avg_heart_rate: 135 },
            ],
            error: null,
          })
        }
        if (table === 'personal_records') {
          return Promise.resolve({
            data: opts.prs ?? [
              { exercise_name: 'Barbell Squat', weight_lbs: 225, reps: 5, achieved_at: '2026-10-24T14:00:00Z' },
            ],
            error: null,
          })
        }
        return Promise.resolve({ data: [], error: null })
      }

      // Support thenable chain
      chain.then = (onFulfilled: (val: unknown) => unknown) => resolveArray().then(onFulfilled)
      return chain
    }

    return { from }
  }

  it('aggregates weekly metrics and dispatches certified Sunday dossier notifications', async () => {
    const admin = createMockAdmin({})
    adminMock.mockReturnValue(admin)

    const result = await dispatchSundayPerformanceDossiers(new Date('2026-10-25T23:00:00Z'))

    expect(result.weekEndingDate).toBe('2026-10-25')
    expect(result.clientsConsidered).toBe(1)
    expect(result.dispatchedCount).toBe(1)
    expect(result.skippedCount).toBe(0)

    expect(notifyUserMock).toHaveBeenCalledOnce()
    const callArgs = notifyUserMock.mock.calls[0][0]
    expect(callArgs.userId).toBe('c1')
    expect(callArgs.type).toBe('sunday_dossier_ready')
    expect(callArgs.title).toBe('Weekly Performance Dossier Ready')
    expect(callArgs.body).toContain('Marcus')
    expect(callArgs.body).toContain('lbs across')
    expect(callArgs.url).toBe('/dashboard/dossier')
    expect(callArgs.dedupeKey).toBe('sunday-dossier:2026-10-25:c1')
    expect(callArgs.data.shareToken).toBeDefined()
  })

  it('skips clients already notified in the current week dedupe window', async () => {
    const admin = createMockAdmin({
      existingLogs: ['sunday-dossier:2026-10-25:c1'],
    })
    adminMock.mockReturnValue(admin)

    const result = await dispatchSundayPerformanceDossiers(new Date('2026-10-25T23:00:00Z'))

    expect(result.clientsConsidered).toBe(1)
    expect(result.dispatchedCount).toBe(0)
    expect(result.skippedCount).toBe(1)
    expect(notifyUserMock).not.toHaveBeenCalled()
  })

  it('sends weekly recovery and upcoming schedule briefing when client has 0 tonnage logged', async () => {
    const admin = createMockAdmin({
      setLogs: [],
      cardioLogs: [],
      prs: [],
    })
    adminMock.mockReturnValue(admin)

    const result = await dispatchSundayPerformanceDossiers(new Date('2026-10-25T23:00:00Z'))

    expect(result.dispatchedCount).toBe(1)
    const callArgs = notifyUserMock.mock.calls[0][0]
    expect(callArgs.title).toBe('Weekly Training & Recovery Briefing')
    expect(callArgs.body).toContain('sports science briefing is ready')
  })
})
