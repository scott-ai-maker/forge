import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { dispatchPendingSequenceEmailsMock } = vi.hoisted(() => ({
  dispatchPendingSequenceEmailsMock: vi.fn(),
}))

vi.mock('@/lib/marketing-email', () => ({
  dispatchPendingSequenceEmails: dispatchPendingSequenceEmailsMock,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({})),
}))

import { GET, POST } from './route'

describe('Marketing Dispatch Route (/api/marketing/dispatch)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MARKETING_CRON_SECRET', 'test-marketing-secret')
    vi.stubEnv('CRON_SECRET', 'test-vercel-cron-secret')
    dispatchPendingSequenceEmailsMock.mockResolvedValue({ dispatchedCount: 3, failedCount: 0 })
  })

  it('rejects unauthorized GET and POST with 401', async () => {
    const getReq = new NextRequest('http://localhost:3000/api/marketing/dispatch', { method: 'GET' })
    const getRes = await GET(getReq)
    expect(getRes.status).toBe(401)

    const postReq = new NextRequest('http://localhost:3000/api/marketing/dispatch', { method: 'POST' })
    const postRes = await POST(postReq)
    expect(postRes.status).toBe(401)
  })

  it('authorizes GET via Vercel Cron Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/marketing/dispatch', {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-vercel-cron-secret',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.dispatchedCount).toBe(3)
    expect(dispatchPendingSequenceEmailsMock).toHaveBeenCalledOnce()
  })

  it('authorizes POST via x-marketing-cron-secret header', async () => {
    const req = new NextRequest('http://localhost:3000/api/marketing/dispatch', {
      method: 'POST',
      headers: {
        'x-marketing-cron-secret': 'test-marketing-secret',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(dispatchPendingSequenceEmailsMock).toHaveBeenCalledOnce()
  })
})

