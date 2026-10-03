import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createUnsubscribeToken } from '@/lib/marketing-email'

const { suppressEmailMock, verifyUnsubscribeTokenMock } = vi.hoisted(() => ({
  suppressEmailMock: vi.fn(),
  verifyUnsubscribeTokenMock: vi.fn(),
}))

vi.mock('@/lib/marketing-email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/marketing-email')>()
  return {
    ...actual,
    suppressEmail: suppressEmailMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({})),
}))

import { GET, POST } from './route'

describe('Unsubscribe API Route (/api/marketing/unsubscribe)', () => {
  const testEmail = 'athlete@example.com'
  let validToken: string

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('MARKETING_CRON_SECRET', 'test-cron-secret')
    validToken = createUnsubscribeToken(testEmail)
  })

  it('rejects GET requests without email or token with 400 HTML', async () => {
    const req = new NextRequest('http://localhost:3000/api/marketing/unsubscribe')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).toContain('Invalid or expired')
  })

  it('rejects GET requests with forged or invalid token', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/marketing/unsubscribe?email=${encodeURIComponent(testEmail)}&token=invalid-token-123`
    )
    const res = await GET(req)
    expect(res.status).toBe(400)
    expect(suppressEmailMock).not.toHaveBeenCalled()
  })

  it('processes valid GET request, suppresses email, and returns 200 HTML page', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/marketing/unsubscribe?email=${encodeURIComponent(testEmail)}&token=${validToken}`
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('Unsubscribe Confirmed')
    expect(suppressEmailMock).toHaveBeenCalledWith(expect.anything(), testEmail, 'unsubscribed')
  })

  it('processes valid RFC 8058 POST one-click unsubscribe with 200 JSON', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/marketing/unsubscribe?email=${encodeURIComponent(testEmail)}&token=${validToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'List-Unsubscribe=One-Click',
      }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.email).toBe(testEmail)
    expect(suppressEmailMock).toHaveBeenCalledWith(expect.anything(), testEmail, 'unsubscribed')
  })

  it('rejects invalid RFC 8058 POST request with 400 JSON', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/marketing/unsubscribe?email=${encodeURIComponent(testEmail)}&token=wrong-token`,
      { method: 'POST' }
    )
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    expect(suppressEmailMock).not.toHaveBeenCalled()
  })
})

