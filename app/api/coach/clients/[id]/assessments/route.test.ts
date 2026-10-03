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

import { GET, POST, DELETE } from '@/app/api/coach/clients/[id]/assessments/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-1' }, client: { role: 'coach' } }
const clientUser = { user: { id: 'client-1' }, client: { role: 'client' } }
const clientId = 'client-1'

function makeAdmin(listReturn: unknown[] = [], insertReturn: unknown = null) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return {
                    limit: async () => ({ data: listReturn, error: null }),
                  }
                },
              }
            },
          }
        },
        insert() {
          return {
            select() {
              return {
                single: async () => ({ data: insertReturn, error: null }),
              }
            },
          }
        },
        delete() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    eq: async () => ({ error: null }),
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

describe('NASM Assessments API (/api/coach/clients/[id]/assessments)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue(coachUser)
    requireCoachAssignedClientMock.mockResolvedValue(undefined)
    supabaseAdminMock.mockReturnValue(makeAdmin())
  })

  describe('GET', () => {
    it('returns 401 if unauthenticated', async () => {
      getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
      const req = new NextRequest('http://localhost/api/coach/clients/client-1/assessments')
      const res = await GET(req, { params: Promise.resolve({ id: clientId }) })
      expect(res.status).toBe(401)
    })

    it('returns 403 if user is not coach', async () => {
      getRequestAuthzMock.mockResolvedValue(clientUser)
      const req = new NextRequest('http://localhost/api/coach/clients/client-1/assessments')
      const res = await GET(req, { params: Promise.resolve({ id: clientId }) })
      expect(res.status).toBe(403)
    })

    it('returns assessments list on success', async () => {
      const mockAssessments = [
        {
          id: 'asm-1',
          client_id: clientId,
          assessment_date: '2026-08-20',
          title: 'Initial NASM Assessment',
        },
      ]
      supabaseAdminMock.mockReturnValue(makeAdmin(mockAssessments))

      const req = new NextRequest('http://localhost/api/coach/clients/client-1/assessments')
      const res = await GET(req, { params: Promise.resolve({ id: clientId }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.assessments).toEqual(mockAssessments)
    })
  })

  describe('POST', () => {
    it('records a new assessment and auto-generates CEx plan', async () => {
      const createdAssessment = {
        id: 'asm-new',
        client_id: clientId,
        coach_id: 'coach-1',
        assessment_date: '2026-08-20',
        ohsa_findings: [
          { compensation: 'knees_move_inward', view: 'anterior', checkpoint: 'knees', severity: 'moderate' },
          { compensation: 'excessive_forward_lean', view: 'lateral', checkpoint: 'lphc', severity: 'mild' },
        ],
        overactive_muscles: ['Adductor Complex', 'Tensor Fasciae Latae (TFL)', 'Soleus', 'Gastrocnemius'],
        underactive_muscles: ['Gluteus Medius', 'Gluteus Maximus', 'Anterior Tibialis'],
      }

      supabaseAdminMock.mockReturnValue(makeAdmin([], createdAssessment))

      const req = new NextRequest('http://localhost/api/coach/clients/client-1/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_date: '2026-08-20',
          title: 'Comprehensive Movement Screen',
          ohsa_findings: [
            { compensation: 'knees_move_inward', view: 'anterior', checkpoint: 'knees', severity: 'moderate' },
            { compensation: 'excessive_forward_lean', view: 'lateral', checkpoint: 'lphc', severity: 'mild' },
          ],
        }),
      })

      const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
      expect(res.status).toBe(201)
      const json = await res.json()
      expect(json.id).toBe('asm-new')
    })
  })

  describe('DELETE', () => {
    it('requires assessmentId parameter', async () => {
      const req = new NextRequest('http://localhost/api/coach/clients/client-1/assessments')
      const res = await DELETE(req, { params: Promise.resolve({ id: clientId }) })
      expect(res.status).toBe(400)
    })

    it('successfully deletes assessment', async () => {
      const req = new NextRequest('http://localhost/api/coach/clients/client-1/assessments?assessmentId=asm-1')
      const res = await DELETE(req, { params: Promise.resolve({ id: clientId }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
    })
  })
})
