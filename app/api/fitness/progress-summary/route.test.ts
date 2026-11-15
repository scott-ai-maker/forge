import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireCoachAssignedClientMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
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
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from '@/app/api/fitness/progress-summary/route'
import { AuthzError } from '@/lib/authz'

function makeAdminMock(options?: {
  checkins?: unknown[]
  measurements?: unknown[]
  setLogs?: unknown[]
}) {
  const checkins = options?.checkins ?? []
  const measurements = options?.measurements ?? []
  const setLogs = options?.setLogs ?? []

  return {
    from(table: string) {
      if (table === 'weekly_checkins') {
        return {
          select(cols: string) {
            const isMeasurements = cols.includes('waist_cm')
            return {
              eq() {
                return {
                  order() {
                    return {
                      limit: async () => ({
                        data: isMeasurements ? measurements : checkins,
                        error: null,
                      }),
                    }
                  },
                }
              },
            }
          },
        }
      }
      return {
        select() {
          return {
            eq() {
              return {
                not() {
                  return {
                    gt() {
                      return {
                        order() {
                          return {
                            limit: async () => ({ data: setLogs, error: null }),
                          }
                        },
                      }
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
  }
}

describe('GET /api/fitness/progress-summary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 with no-store headers when unauthenticated', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const res = await GET(new NextRequest('http://localhost/api/fitness/progress-summary'))
    expect(res.status).toBe(401)
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
  })

  it('enforces HIPAA coach client assignment check when coach requests clientId', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { id: 'coach-1', role: 'coach', status: 'active', email: 'c@forge.app', designated_coach_id: null },
    })

    const missingClientRes = await GET(new NextRequest('http://localhost/api/fitness/progress-summary'))
    expect(missingClientRes.status).toBe(400)

    requireCoachAssignedClientMock.mockRejectedValueOnce(
      new AuthzError('Client is not assigned to this coach', 403)
    )
    const idorRes = await GET(
      new NextRequest('http://localhost/api/fitness/progress-summary?clientId=other-athlete')
    )
    expect(idorRes.status).toBe(403)
    expect(idorRes.headers.get('cache-control')).toBe('no-store, max-age=0')
  })

  it('aggregates weight, measurement, wellness, strength trends, and deduplicated PRs', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'athlete-1' },
      client: { id: 'athlete-1', role: 'client', status: 'active', email: 'a@forge.app', designated_coach_id: null },
    })
    supabaseAdminMock.mockReturnValue(
      makeAdminMock({
        checkins: [
          { week_start: '2026-10-05', weight_kg: 84.5, sleep_quality: 4, stress_level: 3, soreness_level: 4, energy_level: 4 },
          { week_start: '2026-10-12', weight_kg: 83.9, sleep_quality: 5, stress_level: 4, soreness_level: 5, energy_level: 5 },
        ],
        measurements: [
          { week_start: '2026-10-05', waist_cm: 83.0, hip_cm: 98.0, neck_cm: 39.5 },
        ],
        setLogs: [
          { exercise_name: 'Barbell Bench Press', weight_kg: 105, reps: 5, created_at: '2026-10-12T10:00:00Z' },
          { exercise_name: 'barbell bench press', weight_kg: 100, reps: 6, created_at: '2026-10-05T10:00:00Z' },
        ],
      })
    )

    const res = await GET(new NextRequest('http://localhost/api/fitness/progress-summary'))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store, max-age=0')
    const json = await res.json()

    expect(json.weightTrend).toHaveLength(2)
    expect(json.measurementTrend).toHaveLength(1)
    expect(json.wellnessTrend).toHaveLength(2)
    expect(json.personalRecords).toHaveLength(1)
    expect(json.personalRecords[0].weightKg).toBe(105)
    expect(json.strengthTrend).toHaveLength(1)
    expect(json.strengthTrend[0].points).toHaveLength(2)
  })
})
