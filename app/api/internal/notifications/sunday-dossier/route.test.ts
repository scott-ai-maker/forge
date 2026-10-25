import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { dispatchSundayPerformanceDossiersMock } = vi.hoisted(() => ({
  dispatchSundayPerformanceDossiersMock: vi.fn(),
}))

vi.mock('@/lib/sunday-dossier-dispatcher', () => ({
  dispatchSundayPerformanceDossiers: dispatchSundayPerformanceDossiersMock,
}))

import { GET, POST } from './route'

describe('Sunday Performance Dossier Route (/api/internal/notifications/sunday-dossier)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('INTERNAL_CRON_SECRET', 'test-internal-secret')
    vi.stubEnv('CRON_SECRET', 'test-vercel-cron-secret')
    dispatchSundayPerformanceDossiersMock.mockResolvedValue({
      weekEndingDate: '2026-10-25',
      clientsConsidered: 12,
      dispatchedCount: 10,
      skippedCount: 2,
      errors: [],
    })
  })

  it('rejects unauthorized GET and POST with 401', async () => {
    const getReq = new NextRequest('http://localhost:3000/api/internal/notifications/sunday-dossier', {
      method: 'GET',
    })
    const getRes = await GET(getReq)
    expect(getRes.status).toBe(401)

    const postReq = new NextRequest('http://localhost:3000/api/internal/notifications/sunday-dossier', {
      method: 'POST',
    })
    const postRes = await POST(postReq)
    expect(postRes.status).toBe(401)
  })

  it('authorizes GET via Vercel Cron Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/internal/notifications/sunday-dossier', {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-vercel-cron-secret',
      },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.dispatchedCount).toBe(10)
    expect(dispatchSundayPerformanceDossiersMock).toHaveBeenCalledOnce()
  })

  it('authorizes POST via INTERNAL_CRON_SECRET Bearer token', async () => {
    const req = new NextRequest('http://localhost:3000/api/internal/notifications/sunday-dossier', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-internal-secret',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.dispatchedCount).toBe(10)
    expect(dispatchSundayPerformanceDossiersMock).toHaveBeenCalledOnce()
  })
})
