import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { suppressEmailMock, updateQueueMock } = vi.hoisted(() => ({
  suppressEmailMock: vi.fn(),
  updateQueueMock: vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
}))

vi.mock('@/lib/marketing-email', () => ({
  suppressEmail: suppressEmailMock,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      update: updateQueueMock,
    })),
  })),
}))

import { POST } from './route'

describe('Resend Webhook Route (/api/webhooks/resend)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_WEBHOOK_SECRET', 'test-resend-webhook-secret')
  })

  it('rejects unauthorized requests when secret does not match', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'x-resend-webhook-secret': 'wrong-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'email.bounced', data: { to: ['user@example.com'] } }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('suppresses recipients on email.bounced event', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        'x-resend-webhook-secret': 'test-resend-webhook-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'email.bounced',
        created_at: new Date().toISOString(),
        data: {
          email_id: 're_123',
          to: ['bounce1@example.com', 'bounce2@example.com'],
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
    expect(suppressEmailMock).toHaveBeenCalledTimes(2)
    expect(suppressEmailMock).toHaveBeenCalledWith(expect.anything(), 'bounce1@example.com', 'bounced')
    expect(suppressEmailMock).toHaveBeenCalledWith(expect.anything(), 'bounce2@example.com', 'bounced')
  })

  it('suppresses recipients on email.complained event', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-resend-webhook-secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'email.complained',
        created_at: new Date().toISOString(),
        data: {
          email_id: 're_456',
          to: ['complainer@example.com'],
        },
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(suppressEmailMock).toHaveBeenCalledWith(expect.anything(), 'complainer@example.com', 'complained')
  })
})

