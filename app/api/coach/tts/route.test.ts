import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

import { POST, GET } from './route'
import { COACH_GORDON_ELEVENLABS_VOICE_ID } from '@/lib/coach-voice-synthesizer'

describe('/api/coach/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-123' },
      client: { role: 'client', status: 'active' },
    })
  })
  it('returns 400 if text is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated requests in production environment', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW

    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello athlete' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)

    vi.unstubAllEnvs()
  })

  it('handles valid text and returns JSON fallback when no external neural keys are active in test env', async () => {
    const req = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: '🎯 Primary Focus: Upper body power and endurance.',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await res.json()
      expect(data.cleanText).toBeDefined()
      expect(data.cleanText).not.toContain('🎯')
      expect(data.provider).toBe('browser-fallback')
    }
  })

  it('supports GET requests with text query parameter', async () => {
    const req = new NextRequest('http://localhost:3000/api/coach/tts?text=Stay%20tight%20and%20brace')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cleanText).toBe('Stay tight and brace')
  })

  it('exports COACH_GORDON_ELEVENLABS_VOICE_ID matching Coach Gordon authentic custom clone', () => {
    expect(COACH_GORDON_ELEVENLABS_VOICE_ID).toBe('UPezm4CtrvcD6aNXjeU1')
  })
})
