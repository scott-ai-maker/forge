import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const {
  getRequestAuthzMock,
  requireCoachAssignedClientMock,
  assignedClientsRef,
  telemetryEventsRef,
  auditLogsInserted,
  messagesInserted,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  assignedClientsRef: {
    current: [] as Array<{ id: string; full_name: string; email: string; status?: string }>,
  },
  telemetryEventsRef: { current: [] as Array<Record<string, unknown>> },
  auditLogsInserted: [] as Array<Record<string, unknown>>,
  messagesInserted: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'clients') {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              eq: async () => ({ data: assignedClientsRef.current, error: null }),
              maybeSingle: async () => ({
                data:
                  assignedClientsRef.current.find(c => String(c[col as keyof typeof c]) === val) ??
                  null,
                error: null,
              }),
            }),
          }),
          update: (patch: Record<string, unknown>) => ({
            eq: async (_col: string, val: string) => {
              const target = assignedClientsRef.current.find(c => c.id === val)
              if (target && typeof patch.status === 'string') {
                target.status = patch.status
              }
              return { error: null }
            },
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
            eq: (_c1: string, eventId: string) => ({
              eq: (_c2: string, userId: string) => ({
                maybeSingle: async () => ({
                  data:
                    telemetryEventsRef.current.find(
                      ev => ev.event_id === eventId && ev.user_id === userId
                    ) ?? null,
                  error: null,
                }),
              }),
            }),
          }),
          update: (patch: { payload: Record<string, unknown> }) => ({
            eq: (_c1: string, eventId: string) => ({
              eq: async (_c2: string, userId: string) => {
                const ev = telemetryEventsRef.current.find(
                  row => row.event_id === eventId && row.user_id === userId
                )
                if (ev) ev.payload = patch.payload
                return { error: null }
              },
            }),
          }),
        }
      }
      if (table === 'client_lifecycle_audit_logs') {
        return {
          insert: async (row: Record<string, unknown>) => {
            auditLogsInserted.push(row)
            return { error: null }
          },
        }
      }
      if (table === 'coach_client_messages') {
        return {
          insert: async (row: Record<string, unknown>) => {
            messagesInserted.push(row)
            return { error: null }
          },
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

import { GET, PATCH } from './route'

describe('/api/coach/safety-queue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auditLogsInserted.length = 0
    messagesInserted.length = 0
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    assignedClientsRef.current = [
      { id: 'assigned-client-1', full_name: 'Maya Lin', email: 'maya@example.com', status: 'active' },
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

  it('returns only unacknowledged safety_flag and escalation_* items for clients assigned to the authenticated coach', async () => {
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

  it('blocks acknowledging a clinical_stop red flag without pausing training or documenting clinical rationale', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-gordon-1' },
      client: { role: 'coach', status: 'active', full_name: 'Coach Gordon' },
    })

    const res = await PATCH(
      new NextRequest('http://localhost:3000/api/coach/safety-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'ev-safety-1',
          clientId: 'assigned-client-1',
          action: 'acknowledge',
          notes: '',
        }),
      })
    )
    expect(res.status).toBe(400)
  })

  it('pauses the injured athlete program (status=paused, injury_medical_leave), logs lifecycle audit, and notifies athlete on acknowledge_and_pause_training', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-gordon-1' },
      client: { role: 'coach', status: 'active', full_name: 'Coach Gordon' },
    })

    const patchRes = await PATCH(
      new NextRequest('http://localhost:3000/api/coach/safety-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'ev-safety-1',
          clientId: 'assigned-client-1',
          action: 'acknowledge_and_pause_training',
          notes: 'Pausing lower-body axial loads pending knee evaluation.',
        }),
      })
    )
    expect(patchRes.status).toBe(200)
    const patchBody = await patchRes.json()
    expect(patchBody.clientStatus).toBe('paused')
    expect(assignedClientsRef.current[0].status).toBe('paused')
    expect(auditLogsInserted).toHaveLength(1)
    expect(auditLogsInserted[0].reason_code).toBe('injury_medical_leave')
    expect(messagesInserted).toHaveLength(1)

    // Subsequent GET excludes acknowledged event
    const getRes = await GET(new NextRequest('http://localhost:3000/api/coach/safety-queue'))
    const getBody = await getRes.json()
    expect(getBody.items.map((i: { eventId: string }) => i.eventId)).toEqual(['ev-sms-1'])
  })
})
