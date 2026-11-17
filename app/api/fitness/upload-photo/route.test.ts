import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  protectCSRFMock,
  createClientMock,
  supabaseAdminMock,
  enforceRateLimitMock,
  createSignedFitnessPhotoUrlMock,
} = vi.hoisted(() => ({
  protectCSRFMock: vi.fn().mockResolvedValue({ valid: true }),
  createClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  enforceRateLimitMock: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 19,
    resetAt: new Date(Date.now() + 300_000).toISOString(),
  }),
  createSignedFitnessPhotoUrlMock: vi.fn().mockResolvedValue('https://signed.example/before-photo.jpg'),
}))

vi.mock('@/lib/csrf', () => ({
  protectCSRF: protectCSRFMock,
}))

vi.mock('@/lib/supabase-server', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: enforceRateLimitMock,
}))

vi.mock('@/lib/fitness-photos', async () => {
  const actual = await vi.importActual<typeof import('@/lib/fitness-photos')>('@/lib/fitness-photos')
  return {
    ...actual,
    createSignedFitnessPhotoUrl: createSignedFitnessPhotoUrlMock,
  }
})

import { POST } from './route'

describe('POST /api/fitness/upload-photo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 19,
      resetAt: new Date(Date.now() + 300_000).toISOString(),
    })
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    })
  })

  it('returns 401 when unauthenticated', async () => {
    createClientMock.mockResolvedValueOnce({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    })
    const form = new FormData()
    const req = new NextRequest('http://localhost/api/fitness/upload-photo', {
      method: 'POST',
      body: form,
    })
    const res = await POST(req)
    expect(res!.status).toBe(401)
    expect(res!.headers.get('cache-control')).toContain('no-store')
  })

  it('returns 429 when rate limited', async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60_000).toISOString(),
    })
    supabaseAdminMock.mockReturnValue({})
    const form = new FormData()
    const req = new NextRequest('http://localhost/api/fitness/upload-photo', {
      method: 'POST',
      body: form,
    })
    const res = await POST(req)
    expect(res!.status).toBe(429)
    expect(res!.headers.get('retry-after')).toBeTruthy()
  })

  it('rejects non-image MIME types with 400', async () => {
    supabaseAdminMock.mockReturnValue({})
    const form = new FormData()
    form.set('photo', new File(['<svg></svg>'], 'bad.svg', { type: 'image/svg+xml' }))
    const req = new NextRequest('http://localhost/api/fitness/upload-photo', {
      method: 'POST',
      body: form,
    })
    const res = await POST(req)
    expect(res!.status).toBe(400)
    await expect(res!.json()).resolves.toMatchObject({ error: 'File must be an image' })
  })

  it('uploads valid image to private bucket, clears legacy URL, and returns signed URL with no-store', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    supabaseAdminMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { before_photo_path: 'user-123/old.jpg', age: 28 },
          error: null,
        }),
        update: updateMock,
      })),
      storage: {
        from: vi.fn(() => ({
          remove: vi.fn().mockResolvedValue({ error: null }),
          list: vi.fn().mockResolvedValue({ data: [], error: null }),
          upload: vi.fn().mockResolvedValue({ error: null }),
        })),
      },
    })

    const form = new FormData()
    form.set('photo', new File(['jpeg-bytes'], 'front.jpg', { type: 'image/jpeg' }))
    const req = new NextRequest('http://localhost/api/fitness/upload-photo', {
      method: 'POST',
      body: form,
    })

    const res = await POST(req)
    expect(res!.status).toBe(200)
    expect(res!.headers.get('cache-control')).toContain('no-store')
    await expect(res!.json()).resolves.toEqual({ photoUrl: 'https://signed.example/before-photo.jpg' })
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        before_photo_path: expect.stringMatching(/^user-123\/before-photo-\d+\.jpg$/),
        before_photo_url: null,
      })
    )
  })

  it('blocks photo uploads with 403 when user has no adult verified profile or is under 18 (COPPA safeguard)', async () => {
    const uploadSpy = vi.fn()
    supabaseAdminMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      storage: { from: vi.fn(() => ({ upload: uploadSpy })) },
    })

    const form1 = new FormData()
    form1.set('photo', new File(['jpeg-bytes'], 'front.jpg', { type: 'image/jpeg' }))
    const res1 = await POST(
      new NextRequest('http://localhost/api/fitness/upload-photo', { method: 'POST', body: form1 })
    )
    expect(res1!.status).toBe(403)
    expect(uploadSpy).not.toHaveBeenCalled()

    supabaseAdminMock.mockReturnValueOnce({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { age: 15 }, error: null }),
      })),
      storage: { from: vi.fn(() => ({ upload: uploadSpy })) },
    })

    const form2 = new FormData()
    form2.set('photo', new File(['jpeg-bytes'], 'front.jpg', { type: 'image/jpeg' }))
    const res2 = await POST(
      new NextRequest('http://localhost/api/fitness/upload-photo', { method: 'POST', body: form2 })
    )
    expect(res2!.status).toBe(403)
    expect(uploadSpy).not.toHaveBeenCalled()
  })
})
