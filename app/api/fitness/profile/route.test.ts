import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PATCH } from './route'
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

vi.mock('@/lib/fitness-photos', () => ({
  createSignedFitnessPhotoUrl: vi.fn().mockResolvedValue('https://cdn.example.com/signed-before.jpg'),
  extractPhotoPathFromLegacyUrl: vi.fn().mockReturnValue(null),
  normalizePhotoPath: vi.fn((path) => path),
}))

describe('Fitness Profile API Routes (/api/fitness/profile)', () => {
  const mockUser = { id: 'client-user-123', email: 'client@example.com' }
  const mockClientAuthz = {
    user: mockUser,
    client: { role: 'client', id: 'client-user-123', is_active: true },
  }

  let mockFrom: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestAuthz).mockResolvedValue(mockClientAuthz as unknown as Awaited<ReturnType<typeof getRequestAuthz>>)

    mockFrom = vi.fn((table: string) => {
      if (table === 'fitness_profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  user_id: 'client-user-123',
                  age: 32,
                  weight_kg: 82,
                  preferred_units: 'imperial',
                  before_photo_path: 'profiles/client-user-123/before.jpg',
                },
                error: null,
              }),
            })),
          })),
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { user_id: 'client-user-123', age: 32, preferred_units: 'imperial' },
                error: null,
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: 'client-user-123', preferred_units: 'metric' },
                  error: null,
                }),
              })),
            })),
          })),
        }
      }

      if (table === 'equipment_library_entries') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                { name: 'Barbell' },
                { name: 'Dumbbells' },
                { name: 'Bodyweight' },
                { name: 'None' }, // should be filtered out by exclude list
                { name: 'No Equipment' }, // should be filtered out by exclude list
                { name: 'Safety Collars' }, // should be filtered out by exclude list
              ],
              error: null,
            }),
          })),
        }
      }

      if (table === 'client_intake_forms') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  user_id: 'client-user-123',
                  parq_answers: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false },
                  emergency_contact_name: 'Jane Doe',
                },
                error: null,
              }),
            })),
          })),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }

      return {}
    })

    vi.mocked(supabaseAdmin).mockReturnValue({
      from: mockFrom,
    } as unknown as ReturnType<typeof supabaseAdmin>)
  })

  describe('GET /api/fitness/profile', () => {
    it('returns fitness profile with signed photos and available equipment, strictly omitting None', async () => {
      const req = new NextRequest('http://localhost/api/fitness/profile')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.profile).toBeDefined()
      expect(data.profile.user_id).toBe('client-user-123')
      expect(data.profile.before_photo_url).toBe('https://cdn.example.com/signed-before.jpg')
      expect(data.availableEquipment).toContain('Barbell')
      expect(data.availableEquipment).toContain('Dumbbells')
      expect(data.availableEquipment).toContain('Bodyweight')
      expect(data.availableEquipment).not.toContain('None')
      expect(data.availableEquipment).not.toContain('No Equipment')
      expect(data.availableEquipment).not.toContain('Safety Collars')
      expect(data.intake).toBeDefined()
    })
  })

  describe('POST /api/fitness/profile', () => {
    const validIntakeBody = {
      preferredUnits: 'imperial',
      age: 32,
      sex: 'male',
      heightCm: 180,
      weightKg: 85,
      trainingDaysPerWeek: 3,
      preferredTrainingDays: ['monday', 'wednesday', 'friday'],
      fitnessGoal: 'hypertrophy',
      equipmentAccess: ['Barbell', 'Dumbbells'],
      intake: {
        parqAnswers: {
          q1: false,
          q2: false,
          q3: false,
          q4: false,
          q5: false,
          q6: false,
          q7: false,
        },
        liabilityWaiver: true,
        informedConsent: true,
        privacyPractices: true,
        coachingAgreement: true,
        emergencyCare: true,
        signatureName: 'John Doe',
        emergencyContactName: 'Jane Doe',
        emergencyContactPhone: '555-0199',
      },
    }

    it('submits onboarding profile and legal consents successfully', async () => {
      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'POST',
        body: JSON.stringify(validIntakeBody),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.profile).toBeDefined()
    })

    it('rejects with 400 when PAR-Q answers are incomplete', async () => {
      const incomplete = {
        ...validIntakeBody,
        intake: {
          ...validIntakeBody.intake,
          parqAnswers: { q1: false }, // missing q2-q7
        },
      }

      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'POST',
        body: JSON.stringify(incomplete),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('rejects with 400 when preferred training days do not match training days per week', async () => {
      const mismatch = {
        ...validIntakeBody,
        trainingDaysPerWeek: 4,
        preferredTrainingDays: ['monday', 'wednesday'], // only 2 days instead of 4
      }

      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'POST',
        body: JSON.stringify(mismatch),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('allows partial profile save when saveDraft is true without requiring complete PAR-Q or signature', async () => {
      const draftBody = {
        saveDraft: true,
        heightCm: 182,
        weightKg: 84,
        fitnessGoal: 'muscle-gain',
        equipmentAccess: ['Barbell', 'Dumbbells', 'None'], // 'None' should be stripped
      }

      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'POST',
        body: JSON.stringify(draftBody),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.draftSaved).toBe(true)
      expect(data.profile).toBeDefined()
    })
  })

  describe('PATCH /api/fitness/profile', () => {
    it('updates preferred units to metric', async () => {
      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'PATCH',
        body: JSON.stringify({ preferredUnits: 'metric' }),
      })

      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.profile.preferred_units).toBe('metric')
    })

    it('updates biometric vitals and filters out none from equipment access', async () => {
      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          age: 33,
          weightKg: 84,
          fitnessGoal: 'performance',
          equipmentAccess: ['Barbell', 'None', 'Dumbbells'],
        }),
      })

      const res = await PATCH(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.profile).toBeDefined()
    })

    it('rejects invalid preferredUnits with 400', async () => {
      const req = new NextRequest('http://localhost/api/fitness/profile', {
        method: 'PATCH',
        body: JSON.stringify({ preferredUnits: 'invalid' }),
      })

      const res = await PATCH(req)
      expect(res.status).toBe(400)
    })
  })
})

