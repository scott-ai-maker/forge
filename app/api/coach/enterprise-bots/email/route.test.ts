import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'

const { getRequestAuthzMock, sendTransactionalEmailMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  sendTransactionalEmailMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/marketing-email', () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}))

import { POST } from './route'

describe('/api/coach/enterprise-bots/email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimiterForTests()
    sendTransactionalEmailMock.mockResolvedValue({ skipped: false, id: 'email-123' })
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'b2b-partnerships',
        subject: 'Q1 Biotech Playbook',
        markdownBody: 'Playbook body content for testing email dispatch.',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('allows Lisa Gordon to dispatch executive brief emails to her authenticated address', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'lisa-1', email: 'Lisa.gordon1@outlook.com' },
      client: { id: 'lisa-1', role: 'client', status: 'active' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'cfo-revenue',
        subject: 'Monday Retention Pulse',
        markdownBody: 'Weekly retention checklist for Forge Athletic.',
      }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.to).toBe('Lisa.gordon1@outlook.com')
  })

  it('rejects non-leadership client role with 403', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'client-1', email: 'athlete@forge-athletic.app' },
      client: { id: 'client-1', role: 'client', status: 'active' },
    })
    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'cfo-revenue',
        subject: 'ARR Bridge',
        markdownBody: 'Confidential financial model for testing.',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('sends an executive brief from the advisor official @forge-athletic.app email with escaped HTML', async () => {
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'coach-1', email: 'scott@forge-athletic.app' },
      client: { id: 'coach-1', role: 'coach', status: 'active' },
    })

    const req = new NextRequest('http://localhost:3000/api/coach/enterprise-bots/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'b2b-partnerships',
        subject: 'Route 128 Biotech Outreach',
        markdownBody: 'Target **10-seat cohorts** and escape <script>alert(1)</script> safely.',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.from).toBe('Marcus Vance <marcus.vance@forge-athletic.app>')
    expect(body.to).toBe('scott@forge-athletic.app')
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(1)

    const callArg = sendTransactionalEmailMock.mock.calls[0][0]
    expect(callArg.from).toBe('Marcus Vance <marcus.vance@forge-athletic.app>')
    expect(callArg.replyTo).toBe('marcus.vance@forge-athletic.app')
    expect(callArg.html).not.toContain('<script>')
    expect(callArg.html).toContain('&lt;script&gt;')
  })
})
