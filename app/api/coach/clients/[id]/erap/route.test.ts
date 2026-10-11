import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { getRequestAuthz } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

vi.mock('@/lib/authz', () => ({
  getRequestAuthz: vi.fn(),
  requireRole: vi.fn((role, allowed) => {
    if (!allowed.includes(role)) {
      const err = new Error('Forbidden') as Error & { status: number }
      err.status = 403
      throw err
    }
  }),
  requireCoachAssignedClient: vi.fn().mockResolvedValue(true),
  AuthzError: class AuthzError extends Error {
    status: number
    constructor(message: string, status = 403) {
      super(message)
      this.status = status
    }
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(),
}))

describe('Coach Client ERAP Route (/api/coach/clients/[id]/erap)', () => {
  const mockCoachAuthz = {
    user: { id: 'coach-123', email: 'coach@forge.com' },
    client: { role: 'coach', id: 'coach-123' },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestAuthz).mockResolvedValue(mockCoachAuthz as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)
  })

  it('retrieves client emergency remote action plan details and telehealth consent', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'client-456',
                  full_name: 'Marcus Vance',
                  email: 'marcus@example.com',
                  phone: '555-0199',
                },
                error: null,
              }),
            })),
          })),
        }
      }
      if (table === 'client_intake_forms') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  emergency_contact_name: 'Elena Vance',
                  emergency_contact_phone: '555-0188',
                  medical_conditions: 'Mild asthma, managed with rescue inhaler',
                  consent_signature_name: 'Marcus Vance',
                  consent_signed_at: '2026-10-11T12:00:00Z',
                  parq_answers: {
                    q1: false,
                    q2: false,
                    q3: false,
                    q4: false,
                    q5: false,
                    q6: false,
                    q7: false,
                    erap: {
                      workoutStreetAddress: '742 Evergreen Terrace',
                      workoutUnitOrGateCode: 'Gate #4092',
                      workoutCity: 'Springfield',
                      workoutState: 'OR',
                      workoutPostalCode: '97477',
                      localEmergencyDispatchPhone: '541-726-3714',
                      hasAcceptedVirtualTelehealthConsent: true,
                    },
                  },
                },
                error: null,
              }),
            })),
          })),
        }
      }
      return {}
    })

    vi.mocked(supabaseAdmin).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost:3000/api/coach/clients/client-456/erap')
    const res = await GET(req, { params: Promise.resolve({ id: 'client-456' }) })
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.athleteName).toBe('Marcus Vance')
    expect(data.athletePhone).toBe('555-0199')
    expect(data.emergencyContactName).toBe('Elena Vance')
    expect(data.emergencyContactPhone).toBe('555-0188')
    expect(data.erap).toBeDefined()
    expect(data.erap.workoutStreetAddress).toBe('742 Evergreen Terrace')
    expect(data.erap.workoutUnitOrGateCode).toBe('Gate #4092')
    expect(data.erap.localEmergencyDispatchPhone).toBe('541-726-3714')
    expect(data.virtualTelehealthDisclaimer).toContain('NASM VIRTUAL COACHING & REMOTE TELEHEALTH AGREEMENT')
  })

  it('returns 404 if client does not exist', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        })),
      })),
    }))

    vi.mocked(supabaseAdmin).mockReturnValue({ from: mockFrom } as unknown as ReturnType<typeof supabaseAdmin>)

    const req = new NextRequest('http://localhost:3000/api/coach/clients/missing/erap')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })
})
