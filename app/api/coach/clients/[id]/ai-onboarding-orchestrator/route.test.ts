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
    requireCoachAssignedClient: vi.fn().mockImplementation(async (coachId, clientId) => {
      if (coachId === 'unauthorized-coach') {
        throw new actual.AuthzError('Not authorized for this athlete.', 403)
      }
    }),
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from '@/app/api/coach/clients/[id]/ai-onboarding-orchestrator/route'
import { AuthzError } from '@/lib/authz'

const coachUser = { user: { id: 'coach-123' }, client: { role: 'coach' } }
const clientId = 'client-456'

describe('/api/coach/clients/[id]/ai-onboarding-orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue(coachUser)

    supabaseAdminMock.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(async () => {
          if (table === 'clients') {
            return { data: { id: clientId, full_name: 'Elena Rostova', email: 'elena@example.com' }, error: null }
          }
          if (table === 'fitness_profiles') {
            return { data: { fitness_goal: 'Body Recomposition & Core Stability', equipment_access: ['dumbbells', 'bands'] }, error: null }
          }
          if (table === 'client_intake_forms') {
            return { data: { medical_conditions: 'Mild low back stiffness' }, error: null }
          }
          if (table === 'body_composition_analyses') {
            return { data: { estimated_bodyfat_percent: 24.5, method: 'DEXA 4C Vision Scan' }, error: null }
          }
          if (table === 'nasm_assessments') {
            return {
              data: {
                assessment_date: '2026-09-01',
                ohsa_findings: ['knees_cave_in', 'excessive_forward_lean'],
                static_posture: [{ checkpoint: 'knees', observation: 'Knee valgus' }],
                overactive_muscles: ['Adductors', 'TFL'],
                underactive_muscles: ['Gluteus Medius'],
              },
              error: null,
            }
          }
          if (table === 'workout_plans') {
            return { data: { id: 'plan-existing-1', name: 'Old Plan' }, error: null }
          }
          return { data: null, error: null }
        }),
        insert: vi.fn().mockImplementation((row: unknown) => ({
          select: () => ({
            single: async () => ({ data: { id: 'plan-new-1', ...row as object }, error: null }),
          }),
        })),
        update: vi.fn().mockImplementation((row: unknown) => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'plan-existing-1', ...row as object }, error: null }),
            }),
          }),
        })),
      })),
    })
  })

  it('rejects unauthorized unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest(`http://localhost:3000/api/coach/clients/${clientId}/ai-onboarding-orchestrator`, {
      method: 'POST',
      body: JSON.stringify({ action: 'recommend' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(401)
  })

  it('generates full AI Coach synthesis recommendation from DEXA and OHSA records', async () => {
    const req = new NextRequest(`http://localhost:3000/api/coach/clients/${clientId}/ai-onboarding-orchestrator`, {
      method: 'POST',
      body: JSON.stringify({ action: 'recommend' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.data.periodizationRecommendation.targetNasmPhase).toBe(1)
    expect(json.data.programDesignRecommendation.macrocyclePlan.workouts.length).toBeGreaterThan(0)
    expect(json.data.periodizationRecommendation.clinicalRationale.summary).toContain('Phase 1 Stabilization')
  })

  it('applies and publishes 1-click periodization and program design to database', async () => {
    const req = new NextRequest(`http://localhost:3000/api/coach/clients/${clientId}/ai-onboarding-orchestrator`, {
      method: 'POST',
      body: JSON.stringify({ action: 'apply_all' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: clientId }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.planId).toBe('plan-existing-1')
    expect(json.message).toContain('Successfully applied')
  })
})

