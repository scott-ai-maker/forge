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

  it('rejects unauthenticated requests in production environment even if NEXT_PUBLIC_ALLOW_ANON_PREVIEW is set', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_ALLOW_ANON_PREVIEW', 'true')

    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Hello athlete' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)

    vi.unstubAllEnvs()
  })

  it('requires authentication BEFORE serving cached audio buffers and sets private Cache-Control', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'el_test_key')
    const fakeMp3 = new Uint8Array(256).fill(42).buffer
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(fakeMp3, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    )

    // 1. Authenticated warm-up populates server cache
    const warmReq = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Brace core and control eccentric tempo.' }),
    })
    const warmRes = await POST(warmReq)
    expect(warmRes.status).toBe(200)
    expect(warmRes.headers.get('Cache-Control')).toBe('private, max-age=86400')

    // 2. Unauthenticated production request for the exact same cached text MUST return 401
    vi.stubEnv('NODE_ENV', 'production')
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const unauthReq = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Brace core and control eccentric tempo.' }),
    })
    const unauthRes = await POST(unauthReq)
    expect(unauthRes.status).toBe(401)

    // 3. Authenticated request hits cache with private Cache-Control
    const cachedReq = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({ text: 'Brace core and control eccentric tempo.' }),
    })
    const cachedRes = await POST(cachedReq)
    expect(cachedRes.status).toBe(200)
    expect(cachedRes.headers.get('X-Forge-Voice-Provider')).toBe('cache')
    expect(cachedRes.headers.get('Cache-Control')).toBe('private, max-age=86400')

    fetchSpy.mockRestore()
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

  it('blocks ElevenLabs path traversal / non-allowlisted voiceId and oversized text payloads (#36)', async () => {
    const traversalReq = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Brace core.',
        voiceId: '../../v1/voices',
      }),
    })
    const traversalRes = await POST(traversalReq)
    expect(traversalRes.status).toBe(400)

    const foreignVoiceReq = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Brace core.',
        voiceId: 'AbCdEfGhIjKlMnOpQrSt1',
      }),
    })
    const foreignRes = await POST(foreignVoiceReq)
    expect(foreignRes.status).toBe(403)

    const hugeTextReq = new NextRequest('http://localhost:3000/api/coach/tts', {
      method: 'POST',
      body: JSON.stringify({
        text: 'A'.repeat(2600),
      }),
    })
    const hugeRes = await POST(hugeTextReq)
    expect(hugeRes.status).toBe(400)
  })
})
