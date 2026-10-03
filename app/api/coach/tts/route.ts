import { NextRequest, NextResponse } from 'next/server'
import { sanitizeCoachSpeechText, COACH_GORDON_ELEVENLABS_VOICE_ID } from '@/lib/coach-voice-synthesizer'
import { getRequestAuthz, requireRole, requireActiveClient, AuthzError } from '@/lib/authz'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'

// In-memory LRU audio buffer cache (avoids repeated API calls for identical cues)
const audioBufferCache = new Map<string, { buffer: ArrayBuffer; contentType: string; cachedAt: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_ENTRIES = 200

// Default ElevenLabs voice: Coach Scott Gordon authentic custom clone
const DEFAULT_ELEVENLABS_VOICE_ID =
  process.env.COACH_GORDON_ELEVENLABS_VOICE_ID ||
  process.env.ELEVENLABS_VOICE_ID ||
  COACH_GORDON_ELEVENLABS_VOICE_ID

async function authenticateAndRateLimit(req: NextRequest) {
  let userId = 'anonymous'
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
    requireActiveClient(authz.client)
    userId = authz.user.id
  } catch (error) {
    const isDevPreview = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_ANON_PREVIEW === 'true'
    const isTest = process.env.NODE_ENV === 'test'
    if (!isDevPreview && !isTest) {
      const status = error instanceof AuthzError ? error.status : 401
      const message = error instanceof Error ? error.message : 'Unauthorized'
      return { authorized: false, response: NextResponse.json({ error: message }, { status }) }
    }
  }

  // Enforce IP rate limit (60 requests per minute)
  const ip = getClientIp(req)
  const ipLimit = await enforceRateLimit({
    key: `tts:ip:${ip}`,
    limit: 60,
    windowSeconds: 60,
    route: '/api/coach/tts',
    dimension: 'ip',
  })
  if (!ipLimit.allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before requesting more voice cues.' },
        { status: 429 }
      ),
    }
  }

  // Enforce User rate limit (100 requests per 10 minutes)
  if (userId !== 'anonymous') {
    const userLimit = await enforceRateLimit({
      key: `tts:user:${userId}`,
      limit: 100,
      windowSeconds: 600,
      route: '/api/coach/tts',
      dimension: 'user',
    })
    if (!userLimit.allowed) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Voice synthesis limit reached. Please slow down.' },
          { status: 429 }
        ),
      }
    }
  }

  return { authorized: true }
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

async function handleTtsRequest(rawText: string, voiceIdOverride?: string) {
  const cleanText = sanitizeCoachSpeechText(rawText)
  if (!cleanText) {
    return NextResponse.json({ error: 'Clean text is empty' }, { status: 400 })
  }

  const voiceId = voiceIdOverride || DEFAULT_ELEVENLABS_VOICE_ID
  const cacheKey = `tts_${voiceId}_${cleanText.slice(0, 120)}_${cleanText.length}`

  // Check in-memory cache first
  const cached = audioBufferCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return new NextResponse(cached.buffer, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-GAA-Voice-Provider': 'cache',
      },
    })
  }

  const elevenLabsKey = process.env.ELEVENLABS_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  // 1. Try ElevenLabs (Premier Athletic Baritone - Marcus)
  if (elevenLabsKey) {
    try {
      const voiceId = voiceIdOverride || DEFAULT_ELEVENLABS_VOICE_ID
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`

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
            'Cache-Control': 'public, max-age=86400',
            'X-GAA-Voice-Provider': 'elevenlabs-coach-gordon',
          },
        })
      }
    } catch (err) {
      console.warn('ElevenLabs TTS error:', err)
    }
  }

  // 2. Try OpenAI TTS (Onyx Baritone)
  if (openAiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'onyx',
          input: cleanText,
        }),
      })

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        setCachedAudio(cacheKey, audioBuffer, 'audio/mpeg')

        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            'X-GAA-Voice-Provider': 'openai-onyx',
          },
        })
      }
    } catch (err) {
      console.warn('OpenAI TTS error:', err)
    }
  }

  // Fallback response
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
    return handleTtsRequest(rawText, body.voiceId)
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
    return handleTtsRequest(rawText, searchParams.get('voiceId') || undefined)
  } catch (error) {
    console.error('TTS GET handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal voice generation error' },
      { status: 500 }
    )
  }
}
