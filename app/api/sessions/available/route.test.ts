import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireRoleMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireRoleMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireRole: requireRoleMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { GET } from '@/app/api/sessions/available/route'
import { generateSlots } from '@/lib/session-slots'
import { AuthzError } from '@/lib/authz'

describe('generateSlots - Coach Gordon Operating Hours', () => {
  it('generates weekday slots strictly between 5pm-8pm ET (17:00, 18:00, 19:00)', () => {
    // 2026-11-02 was a Monday at 12:00 UTC (7:00 AM ET)
    const mondayMorning = new Date('2026-11-02T12:00:00.000Z')
    // Generate 1 day ahead
    const slots = generateSlots(mondayMorning, 1)

    // Monday slots
    const mondaySlots = slots.filter(s => s.date === '2026-11-02')
    expect(mondaySlots.length).toBe(3)
    expect(mondaySlots.map(s => s.time)).toEqual(['5:00 PM', '6:00 PM', '7:00 PM'])
  })

  it('generates weekend slots on Saturday and Sunday strictly between 8am-2pm ET', () => {
    // 2026-11-07 was a Saturday at 05:00 UTC (1:00 AM ET)
    const saturdayEarly = new Date('2026-11-07T05:00:00.000Z')
    const slots = generateSlots(saturdayEarly, 2)

    // Saturday
    const saturdaySlots = slots.filter(s => s.date === '2026-11-07')
    expect(saturdaySlots.map(s => s.time)).toEqual([
      '8:00 AM',
      '9:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '1:00 PM',
    ])

    // Sunday (formerly closed, now open 8am-2pm ET!)
    const sundaySlots = slots.filter(s => s.date === '2026-11-08')
    expect(sundaySlots.map(s => s.time)).toEqual([
      '8:00 AM',
      '9:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '1:00 PM',
    ])
  })
})

describe('GET /api/sessions/available', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client' },
    })
    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        }),
      }),
    })
  })

  it('rejects unauthenticated requests', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('allows client and returns open slots', async () => {
    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(requireRoleMock).toHaveBeenCalledWith('client', ['client', 'coach'])
    expect(res.status).toBe(200)
    const slots = await res.json()
    expect(Array.isArray(slots)).toBe(true)
    expect(slots.length).toBeGreaterThan(0)
  })

  it('filters out already booked slots so only open slots show', async () => {
    // Mock that one slot is already booked in the database
    const sampleSlots = generateSlots(new Date(), 3)
    const bookedSlotTime = sampleSlots[0].datetime

    supabaseAdminMock.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => Promise.resolve({
                data: [{ scheduled_at: bookedSlotTime }],
                error: null,
              }),
            }),
          }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const returnedSlots = await res.json()

    // The booked slot must be omitted
    const bookedSlotFound = returnedSlots.some(
      (s: { datetime: string }) => s.datetime.substring(0, 16) === bookedSlotTime.substring(0, 16)
    )
    expect(bookedSlotFound).toBe(false)
  })

  it('allows coach and returns slots', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach' },
    })
    const req = new NextRequest('http://localhost/api/sessions/available')
    const res = await GET(req)
    expect(requireRoleMock).toHaveBeenCalledWith('coach', ['client', 'coach'])
    expect(res.status).toBe(200)
    const slots = await res.json()
    expect(Array.isArray(slots)).toBe(true)
  })
})
