import { beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'
import { POST } from './route'

describe('/api/concierge/chat', () => {
  beforeEach(() => {
    resetRateLimiterForTests()
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_GENAI_API_KEY
  })

  it('answers public membership inquiries with tier guidance and action links', async () => {
    const req = new NextRequest('http://localhost:3000/api/concierge/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': '203.0.113.10' },
      body: JSON.stringify({
        message: 'How does the 33-point posture scan protect my privacy?',
        pageContext: '/packages',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.botId).toBe('sales-concierge')
    expect(body.replyMarkdown).toContain('100% locally in your browser')
    expect(Array.isArray(body.actionLinks)).toBe(true)
  })

  it('silently handles honeypot bot submissions without calling external engines', async () => {
    const req = new NextRequest('http://localhost:3000/api/concierge/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': '203.0.113.11' },
      body: JSON.stringify({
        message: 'Buy crypto now',
        honeypot: 'filled-by-spam-bot',
      }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.engineMode).toBe('deterministic_concierge')
  })

  it('rejects empty messages with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/concierge/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-real-ip': '203.0.113.12' },
      body: JSON.stringify({ message: '   ' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
