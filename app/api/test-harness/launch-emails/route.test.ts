import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

describe('/api/test-harness/launch-emails', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 404 in production so test harness is never exposed publicly', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = new NextRequest('http://localhost:3000/api/test-harness/launch-emails')
    const res = await GET(req)
    expect(res.status).toBe(404)

    const postRes = await POST(
      new NextRequest('http://localhost:3000/api/test-harness/launch-emails', {
        method: 'POST',
        body: JSON.stringify({ sendAllEmails: true, toEmail: 'test@example.com' }),
      })
    )
    expect(postRes.status).toBe(404)
  })

  it('renders all 10 launch templates with suppression and schedule info in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const req = new NextRequest(
      'http://localhost:3000/api/test-harness/launch-emails?firstName=Scott&account_activated=true&screening_booked=false'
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.items).toHaveLength(10)

    const rescue = json.items.find((i: { id: string }) => i.id === 'rescue_02a_email')
    expect(rescue.suppression).toEqual({
      allowed: false,
      reason: 'account_already_activated',
    })

    const screening = json.items.find((i: { id: string }) => i.id === 'screening_03_email')
    expect(screening.suppression.allowed).toBe(true)
    expect(screening.rendered.html).toContain('Hi Scott,')
  })
})

