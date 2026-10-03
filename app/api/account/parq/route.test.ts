import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET, POST } from '@/app/api/account/parq/route'
import { AuthzError } from '@/lib/authz'

const mockUser = {
  user: { id: 'client-user-123', email: 'vip@example.com' },
  client: { id: 'client-row-123', role: 'client', full_name: 'John Doe', designated_coach_id: 'coach-999' },
}

describe('/api/account/parq', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue(mockUser)
  })

  describe('GET', () => {
    it('rejects unauthorized requests with 401', async () => {
      getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
      const req = new NextRequest('http://localhost:3000/api/account/parq')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns empty/default structure when no intake record exists', async () => {
      supabaseAdminMock.mockReturnValue({
        from: (table: string) => {
          if (table === 'client_intake_forms') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }
          }
          return {}
        },
      })

      const req = new NextRequest('http://localhost:3000/api/account/parq')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.answers).toBeDefined()
      expect(data.evaluation.riskTier).toBe('Low Risk')
    })
  })

  describe('POST', () => {
    it('evaluates PAR-Q answers, updates intake forms, updates fitness profile, and alerts coach', async () => {
      let intakeUpsertPayload: Record<string, unknown> | null = null
      let profileUpdatePayload: Record<string, unknown> | null = null
      let coachMessagePayload: Record<string, unknown> | null = null

      supabaseAdminMock.mockReturnValue({
        from: (table: string) => {
          if (table === 'clients') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: 'client-row-123', full_name: 'John Doe', designated_coach_id: 'coach-999' },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'client_intake_forms') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
              upsert: (payload: Record<string, unknown>) => {
                intakeUpsertPayload = payload
                return Promise.resolve({ error: null })
              },
            }
          }
          if (table === 'fitness_profiles') {
            return {
              update: (payload: Record<string, unknown>) => {
                profileUpdatePayload = payload
                return {
                  eq: () => Promise.resolve({ error: null }),
                }
              },
            }
          }
          if (table === 'coach_client_messages') {
            return {
              insert: (payload: Record<string, unknown>) => {
                coachMessagePayload = payload
                return Promise.resolve({ error: null })
              },
            }
          }
          return {}
        },
      })

      const req = new NextRequest('http://localhost:3000/api/account/parq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasHeartCondition: false,
          experiencesChestPain: false,
          experiencesDizzinessOrSyncope: false,
          hasBoneOrJointProblem: true,
          takesBloodPressureOrHeartMedication: false,
          hasChronicSpinalOrDiscCondition: false,
          hasRecentSurgeryOrInjury: true,
          reportedConditionsNotes: 'Torn meniscus left knee, no deep squats',
          signedWaiverName: 'John Doe',
          signedAt: new Date().toISOString(),
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.evaluation.riskTier).toContain('Moderate Risk')
      expect(data.evaluation.contraindicationTags).toContain('knee_patellofemoral')
      expect(intakeUpsertPayload).toBeDefined()
      expect(profileUpdatePayload).toBeDefined()
      expect(coachMessagePayload).toBeDefined()
    })
  })
})

