import { NextRequest, NextResponse } from 'next/server'
import { sanitizeCoachSpeechText, COACH_GORDON_ELEVENLABS_VOICE_ID } from '@/lib/coach-voice-synthesizer'
import { getRequestAuthz, requireRole, requireActiveClient, AuthzError } from '@/lib/authz'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import { validateCoachBrandSafetyOutput } from '@/src/lib/safety/clinicalGuardrails'

// In-memory LRU audio buffer cache (avoids repeated API calls for identical cues)
const audioBufferCache = new Map<string, { buffer: ArrayBuffer; contentType: string; cachedAt: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_ENTRIES = 200

const MAX_COACH_TTS_CHARS = 2500
const MAX_CLIENT_TTS_CHARS = 800
const MAX_GET_TTS_CHARS = 500
const VOICE_ID_PATTERN = /^[A-Za-z0-9]{15,30}$/

// Default ElevenLabs voice: Coach Gordon authentic custom clone
const DEFAULT_ELEVENLABS_VOICE_ID =
  process.env.COACH_GORDON_ELEVENLABS_VOICE_ID ||
  process.env.ELEVENLABS_VOICE_ID ||
  COACH_GORDON_ELEVENLABS_VOICE_ID

function resolveAllowedVoiceIds(): Set<string> {
  const allowed = new Set<string>([COACH_GORDON_ELEVENLABS_VOICE_ID, DEFAULT_ELEVENLABS_VOICE_ID])
  const extra = process.env.ELEVENLABS_ALLOWED_VOICE_IDS
  if (extra) {
    for (const id of extra.split(',')) {
      const trimmed = id.trim()
      if (VOICE_ID_PATTERN.test(trimmed)) {
        allowed.add(trimmed)
      }
    }
  }
  return allowed
}

async function authenticateAndRateLimit(req: NextRequest): Promise<{
  authorized: boolean
  role: 'coach' | 'client'
  response?: NextResponse
}> {
  let userId = 'anonymous'
  let role: 'coach' | 'client' = 'client'
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
    requireActiveClient(authz.client)
    userId = authz.user.id
    role = authz.client.role === 'coach' ? 'coach' : 'client'
  } catch (error) {
    // SECURITY (#36): Never honor NEXT_PUBLIC_ALLOW_ANON_PREVIEW for ElevenLabs voice-clone synthesis
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return {
      authorized: false,
      role: 'client',
      response: NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } }),
    }
  }

  const isDev = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  if (!isDev && !isTest) {
    const ip = getClientIp(req)
    const ipLimit = await enforceRateLimit({
      key: `tts:ip:${ip}`,
      limit: 120,
      windowSeconds: 60,
      route: '/api/coach/tts',
      dimension: 'ip',
    })
    if (!ipLimit.allowed) {
      return {
        authorized: false,
        role,
        response: NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment before requesting more voice cues.' },
          { status: 429 }
        ),
      }
    }

    if (userId !== 'anonymous') {
      const userLimit = await enforceRateLimit({
        key: `tts:user:${userId}`,
        limit: role === 'coach' ? 400 : 120,
        windowSeconds: 600,
        route: '/api/coach/tts',
        dimension: 'user',
      })
      if (!userLimit.allowed) {
        return {
          authorized: false,
          role,
          response: NextResponse.json(
            { error: 'Voice synthesis limit reached. Please slow down.' },
            { status: 429 }
          ),
        }
      }
    }
  }

  return { authorized: true, role }
}

function setCachedAudio(key: string, buffer: ArrayBuffer, contentType: string) {
  if (audioBufferCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = audioBufferCache.keys().next().value
    if (oldestKey) audioBufferCache.delete(oldestKey)
  }
  audioBufferCache.set(key, {
    buffer,
    contentType,
    cachedAt: Date.now(),
  })
}

async function handleTtsRequest(
  rawText: string,
  role: 'coach' | 'client',
  voiceIdOverride?: string,
  maxCharsOverride?: number
) {
  const maxAllowedChars =
    maxCharsOverride ?? (role === 'coach' ? MAX_COACH_TTS_CHARS : MAX_CLIENT_TTS_CHARS)
  if (rawText.length > maxAllowedChars) {
    return NextResponse.json(
      { error: `Text exceeds maximum synthesis length (${maxAllowedChars} characters).` },
      { status: 400 }
    )
  }

  // SECURITY (#36): Strict regex & allowlist validation prevents `../` ElevenLabs API path traversal / SSRF
  let resolvedVoiceId = DEFAULT_ELEVENLABS_VOICE_ID
  if (voiceIdOverride !== undefined && voiceIdOverride !== '') {
    if (typeof voiceIdOverride !== 'string' || !VOICE_ID_PATTERN.test(voiceIdOverride.trim())) {
      return NextResponse.json(
        { error: 'Invalid voice identifier format.' },
        { status: 400 }
      )
    }
    const candidateVoiceId = voiceIdOverride.trim()
    const allowedVoices = resolveAllowedVoiceIds()
    if (!allowedVoices.has(candidateVoiceId)) {
      return NextResponse.json(
        { error: 'Requested voice identifier is not permitted.' },
        { status: 403 }
      )
    }
    resolvedVoiceId = candidateVoiceId
  }

  const brandSafe = validateCoachBrandSafetyOutput(rawText)
  const cleanText = sanitizeCoachSpeechText(brandSafe.cleanText)
  if (!cleanText) {
    return NextResponse.json({ error: 'Clean text is empty' }, { status: 400 })
  }

  const cacheKey = `tts_${resolvedVoiceId}_${cleanText.slice(0, 120)}_${cleanText.length}`

  const cached = audioBufferCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'private, max-age=86400',
        'X-Forge-Voice-Provider': 'cache',
      },
    })
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY

  if (elevenLabsKey) {
    try {
      const safeVoiceSegment = encodeURIComponent(resolvedVoiceId)
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${safeVoiceSegment}?output_format=mp3_44100_128`

      const response = await fetch(elevenUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      })

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        setCachedAudio(cacheKey, audioBuffer, 'audio/mpeg')

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'private, max-age=86400',
            'X-Forge-Voice-Provider': 'elevenlabs-coach-gordon',
          },
        })
      } else {
        const errText = await response.text().catch(() => '')
        console.error('ElevenLabs TTS error response:', response.status, errText)
      }
    } catch (err) {
      console.warn('ElevenLabs TTS error:', err)
    }
  }

  return NextResponse.json(
    {
      provider: 'browser-fallback',
      cleanText,
      message: 'No external TTS key configured; fallback to high-fidelity client Web Speech API.',
    },
    { status: 200 }
  )
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateAndRateLimit(req)
    if (!auth.authorized) {
      return auth.response!
    }

    const body = await req.json().catch(() => ({}))
    const rawText = body.text
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    return handleTtsRequest(rawText, auth.role, body.voiceId)
  } catch (error) {
    console.error('TTS POST handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal voice generation error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateAndRateLimit(req)
    if (!auth.authorized) {
      return auth.response!
    }

    const { searchParams } = new URL(req.url)
    const rawText = searchParams.get('text')
    if (!rawText || !rawText.trim()) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 })
    }
    return handleTtsRequest(
      rawText,
      auth.role,
      searchParams.get('voiceId') || undefined,
      Math.min(MAX_GET_TTS_CHARS, auth.role === 'coach' ? MAX_COACH_TTS_CHARS : MAX_CLIENT_TTS_CHARS)
    )
  } catch (error) {
    console.error('TTS GET handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal voice generation error' },
      { status: 500 }
    )
  }
}
