import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { sendWeeklyCheckinNudgesMock } = vi.hoisted(() => ({
  sendWeeklyCheckinNudgesMock: vi.fn(),
}))

vi.mock('@/lib/notifications', () => ({
  sendWeeklyCheckinNudges: sendWeeklyCheckinNudgesMock,
}))

import { GET, POST } from './route'

describe('Weekly Check-in Notifications Route (/api/internal/notifications/weekly-checkin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('INTERNAL_CRON_SECRET', 'test-internal-secret')
    vi.stubEnv('CRON_SECRET', 'test-vercel-cron-secret')
    sendWeeklyCheckinNudgesMock.mockResolvedValue({ sentCount: 5, errorCount: 0 })
  })

  it('rejects unauthorized GET and POST with 401', async () => {
    const getReq = new NextRequest('http://localhost:3000/api/internal/notifications/weekly-checkin', {
      method: 'GET',
    })
    const getRes = await GET(getReq)
    expect(getRes.status).toBe(401)

    const postReq = new NextRequest('http://localhost:3000/api/internal/notifications/weekly-checkin', {
      method: 'POST',
    })
    const postRes = await POST(postReq)
    expect(postRes.status).toBe(401)
  })

  it('authorizes GET via Vercel Cron Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/internal/notifications/weekly-checkin', {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-vercel-cron-secret',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.sentCount).toBe(5)
    expect(sendWeeklyCheckinNudgesMock).toHaveBeenCalledOnce()
  })

  it('authorizes POST via INTERNAL_CRON_SECRET Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/internal/notifications/weekly-checkin', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-internal-secret',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.sentCount).toBe(5)
    expect(sendWeeklyCheckinNudgesMock).toHaveBeenCalledOnce()
  })
})

