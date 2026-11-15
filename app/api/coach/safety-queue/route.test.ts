import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const { getRequestAuthzMock, assignedClientsRef, telemetryEventsRef } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  assignedClientsRef: { current: [] as Array<{ id: string; full_name: string; email: string }> },
  telemetryEventsRef: { current: [] as Array<Record<string, unknown>> },
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({ data: assignedClientsRef.current, error: null }),
            }),
          }),
        }
      }
      if (table === 'client_telemetry_events') {
        return {
          select: () => ({
            in: (_col: string, ids: string[]) => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({
                    data: telemetryEventsRef.current.filter(ev =>
                      ids.includes(String(ev.user_id))
                    ),
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }
      }
      return {
        select: () => ({
          not: async () => ({ count: 14, error: null }),
        }),
      }
    },
  }),
}))

import { GET } from './route'

describe('/api/coach/safety-queue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    assignedClientsRef.current = [
      { id: 'assigned-client-1', full_name: 'Maya Lin', email: 'maya@example.com' },
    ]
    telemetryEventsRef.current = [
      {
        event_id: 'ev-safety-1',
        user_id: 'assigned-client-1',
        event_type: 'safety_flag',
        client_timestamp: '2026-11-15T14:00:00.000Z',
        payload: {
          severity: 'clinical_stop',
          joint_area: 'Knee',
          exercise_name: 'Barbell Back Squat',
          swapped_to_exercise: 'Box-Supported Goblet Squat',
          action_taken: 'Paused lift and offered pain-free box squat regression.',
        },
      },
      {
        event_id: 'ev-sms-1',
        user_id: 'assigned-client-1',
        event_type: 'escalation_sms',
        client_timestamp: '2026-11-15T14:05:00.000Z',
        payload: {
          tier_id: 'coach_support',
          active_exercise: 'Dumbbell Romanian Deadlift',
          question_preview: 'Checking hip hinge depth for hotel dumbbells.',
        },
      },
      {
        event_id: 'ev-email-unassigned',
        user_id: 'other-coaches-client-999',
        event_type: 'escalation_email',
        client_timestamp: '2026-11-15T14:06:00.000Z',
        payload: {
          tier_id: 'core_lab',
          question_preview: 'Should never leak across coaches.',
        },
      },
    ]
  })

  it('rejects client-role callers with 403 Forbidden (coach-only endpoint)', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'client-1' },
      client: { role: 'client', status: 'active' },
    })

    const res = await GET(new NextRequest('http://localhost:3000/api/coach/safety-queue'))
    expect(res.status).toBe(403)
  })

  it('rejects unauthenticated callers with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const res = await GET(new NextRequest('http://localhost:3000/api/coach/safety-queue'))
    expect(res.status).toBe(401)
  })

  it('returns only safety_flag and escalation_* items for clients assigned to the authenticated coach', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-gordon-1' },
      client: { role: 'coach', status: 'active' },
    })

    const res = await GET(new NextRequest('http://localhost:3000/api/coach/safety-queue'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.items).toHaveLength(2)
    expect(body.items.map((i: { eventId: string }) => i.eventId)).toEqual([
      'ev-safety-1',
      'ev-sms-1',
    ])
    expect(body.items[0].swappedToExercise).toBe('Box-Supported Goblet Squat')
    expect(body.items[1].severity).toBe('priority_24h_sla')
    expect(body.libraryIndex.totalPassages).toBeGreaterThan(0)
  })
})
