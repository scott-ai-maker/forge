import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

const suppressOnScreeningBookedMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({}),
}))

vi.mock('@/lib/automations/launchSequence', () => ({
  suppressOnScreeningBooked: (...args: unknown[]) => suppressOnScreeningBookedMock(...args),
}))

describe('POST /api/webhooks/screening-booked', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SCREENING_WEBHOOK_SECRET = 'test-screening-secret'
  })

  it('rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest('https://forge-athletic.app/api/webhooks/screening-booked', {
      method: 'POST',
      body: JSON.stringify({ email: 'member@example.com' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
    expect(suppressOnScreeningBookedMock).not.toHaveBeenCalled()
  })

  it('suppresses screening reminder for direct or Calendly-style invitee payloads', async () => {
    suppressOnScreeningBookedMock.mockResolvedValueOnce({ cancelledQueueRows: 1 })

    const req = new NextRequest('https://forge-athletic.app/api/webhooks/screening-booked', {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'test-screening-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        payload: { invitee: { email: 'alex@example.com' } },
      }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ success: true, cancelledQueueRows: 1 })
    expect(suppressOnScreeningBookedMock).toHaveBeenCalledWith(expect.anything(), {
      email: 'alex@example.com',
      userId: null,
    })
  })
})

