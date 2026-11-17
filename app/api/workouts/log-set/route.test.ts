import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

interface StoredSetLog extends Record<string, unknown> {
  id: string
  user_id: string
  session_date: string
  exercise_name: string
  set_number: number | null
  reps: number
}

const storedSetLogs = new Map<string, StoredSetLog>()
let simulateConcurrentUniqueRace = false

const mockGetRequestAuthz = vi.fn()

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: (...args: unknown[]) => mockGetRequestAuthz(...args),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table !== 'workout_set_logs') {
        throw new Error(`Unexpected table ${table}`)
      }
      return {
        select: () => {
          const filters: Record<string, string> = {}
          const builder = {
            eq: (col: string, val: string) => {
              filters[col] = val
              return builder
            },
            order: () => builder,
            limit: async () => ({
              data: Array.from(storedSetLogs.values()).filter(row =>
                Object.entries(filters).every(([k, v]) => String(row[k]) === String(v))
              ),
              error: null,
            }),
            maybeSingle: async () => {
              const found = Array.from(storedSetLogs.values()).find(row =>
                Object.entries(filters).every(([k, v]) => String(row[k]) === String(v))
              )
              return { data: found ?? null, error: null }
            },
          }
          return builder
        },
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              if (simulateConcurrentUniqueRace && typeof payload.id === 'string') {
                const winner: StoredSetLog = {
                  ...(payload as StoredSetLog),
                  id: payload.id,
                }
                storedSetLogs.set(payload.id, winner)
                return {
                  data: null,
                  error: { code: '23505', message: 'duplicate key value violates unique constraint' },
                }
              }

              const id =
                typeof payload.id === 'string'
                  ? payload.id
                  : `srv_${storedSetLogs.size + 1}`
              const record: StoredSetLog = {
                ...(payload as StoredSetLog),
                id,
              }
              storedSetLogs.set(id, record)
              return { data: record, error: null }
            },
          }),
        }),
      }
    },
  }),
}))

import { GET, POST } from './route'

describe('/api/workouts/log-set route', () => {
  beforeEach(() => {
    storedSetLogs.clear()
    simulateConcurrentUniqueRace = false
    mockGetRequestAuthz.mockReset()
    mockGetRequestAuthz.mockResolvedValue({
      user: { id: 'athlete-uuid-001', email: 'athlete@forge-athletic.app' },
      client: { id: 'athlete-uuid-001', role: 'client', designated_coach_id: 'coach-gordon' },
    })
  })

  it('rejects unauthenticated GET and POST requests with 401 and no-store cache headers', async () => {
    mockGetRequestAuthz.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const getRes = await GET(new NextRequest('http://localhost:3000/api/workouts/log-set'))
    expect(getRes.status).toBe(401)
    expect(getRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')

    mockGetRequestAuthz.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const postRes = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({ exerciseName: 'Back Squat', reps: 8 }),
      })
    )
    expect(postRes.status).toBe(401)
    expect(postRes.headers.get('Cache-Control')).toBe('no-store, max-age=0')
  })

  it('blocks POST set logging with 403 when athlete status is paused on an Injury / Medical Hold', async () => {
    mockGetRequestAuthz.mockResolvedValueOnce({
      user: { id: 'athlete-uuid-001', email: 'athlete@forge-athletic.app' },
      client: {
        id: 'athlete-uuid-001',
        role: 'client',
        status: 'paused',
        designated_coach_id: 'coach-gordon',
      },
    })

    const postRes = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({ exerciseName: 'Back Squat', reps: 8 }),
      })
    )
    expect(postRes.status).toBe(403)
    const body = await postRes.json()
    expect(body.error).toContain('temporary hold')
  })

  it('validates exerciseName and positive reps with 400 errors', async () => {
    const missingExercise = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({ exerciseName: '   <>   ', reps: 8 }),
      })
    )
    expect(missingExercise.status).toBe(400)

    const zeroReps = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({ exerciseName: 'Romanian Deadlift', reps: 0 }),
      })
    )
    expect(zeroReps.status).toBe(400)
  })

  it('sanitizes control characters and HTML angle brackets and deduplicates retries by eventId UUID', async () => {
    const eventId = '550e8400-e29b-41d4-a716-446655440777'
    const payload = {
      eventId,
      sessionDate: '2026-11-15',
      exerciseName: 'Barbell\u0007 Bench <script>Press',
      setNumber: 2,
      reps: 8,
      weightKg: 102.5,
      tempo: '3/1/<1>',
      notes: 'Clean lockout\u0000 <img src=x onerror=alert(1)>',
    }

    const res1 = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
    const json1 = await res1.json()
    expect(res1.status).toBe(200)
    expect(res1.headers.get('Cache-Control')).toBe('no-store, max-age=0')
    expect(json1.setLog.exercise_name).toBe('Barbell  Bench scriptPress')
    expect(json1.setLog.tempo).toBe('3/1/1')
    expect(json1.setLog.notes).toBe('Clean lockout  img src=x onerror=alert(1)')
    expect(json1.setLog.user_id).toBe('athlete-uuid-001')

    // Replay same offline queue item -> pre-select idempotency returns deduplicated: true
    const res2 = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    )
    const json2 = await res2.json()
    expect(res2.status).toBe(200)
    expect(json2.deduplicated).toBe(true)
    expect(storedSetLogs.size).toBe(1)
  })

  it('recovers idempotently from concurrent 23505 unique constraint violations during reconnect bursts', async () => {
    simulateConcurrentUniqueRace = true
    const eventId = '550e8400-e29b-41d4-a716-446655440888'

    const res = await POST(
      new NextRequest('http://localhost:3000/api/workouts/log-set', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          sessionDate: '2026-11-15',
          exerciseName: 'Trap Bar Deadlift',
          setNumber: 1,
          reps: 5,
          weightKg: 160,
        }),
      })
    )

    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.deduplicated).toBe(true)
    expect(json.setLog.id).toBe(eventId)
  })
})
