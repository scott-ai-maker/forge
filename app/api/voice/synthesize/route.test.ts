import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'
import { resetRateLimiterForTests } from '@/src/lib/security/rateLimiter'

const { getRequestAuthzMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return { ...actual, getRequestAuthz: getRequestAuthzMock }
})

import { POST } from './route'

describe('/api/voice/synthesize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    resetRateLimiterForTests()
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-voice-1' },
      client: { role: 'client', status: 'active' },
    })
  })

  it('rejects unauthenticated requests in production even when NEXT_PUBLIC_ALLOW_ANON_PREVIEW is true', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_ALLOW_ANON_PREVIEW', 'true')
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))

    const req = new NextRequest('http://localhost:3000/api/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({ text: 'Morning athlete, welcome to Phase 02.' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when text is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('enforces brand-safety output filter and returns deterministic SHA-256 fallback without ELEVENLABS_API_KEY', async () => {
    delete process.env.ELEVENLABS_API_KEY
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const req = new NextRequest('http://localhost:3000/api/voice/synthesize', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Welcome to GAA Gordon Athletic Phase 2 training!',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.fallback).toBe('web_speech')
    expect(data.cacheHash).toMatch(/^[a-f0-9]{64}$/)
    expect(data.spokenText).toContain('Forge Athletic')
    expect(data.spokenText).not.toMatch(/\bGAA\b/)
    expect(data.spokenText).not.toContain('Gordon Athletic')
  })

  it('caches synthesized ElevenLabs audio in server memory with private Cache-Control and HIT-MEMORY on repeat', async () => {
    vi.stubEnv('ELEVENLABS_API_KEY', 'el_synth_test_key')
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const mp3Bytes = new Uint8Array(512).fill(7)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(mp3Bytes.buffer, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
      })
    )

    const firstRes = await POST(
      new NextRequest('http://localhost:3000/api/voice/synthesize', {
        method: 'POST',
        body: JSON.stringify({ text: 'Keep your ribs stacked over your pelvis on every rep.' }),
      })
    )
    expect(firstRes.status).toBe(200)
    expect(firstRes.headers.get('X-Voice-Cache')).toBe('MISS')
    expect(firstRes.headers.get('Cache-Control')).toContain('private')
    const hash = firstRes.headers.get('X-Voice-Cache-Hash')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)

    const secondRes = await POST(
      new NextRequest('http://localhost:3000/api/voice/synthesize', {
        method: 'POST',
        body: JSON.stringify({ text: '  keep your RIBS stacked   over your pelvis on every rep. ' }),
      })
    )
    expect(secondRes.status).toBe(200)
    expect(secondRes.headers.get('X-Voice-Cache')).toBe('HIT-MEMORY')
    expect(secondRes.headers.get('X-Voice-Cache-Hash')).toBe(hash)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    fetchSpy.mockRestore()
  })
})
