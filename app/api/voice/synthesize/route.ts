import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireActiveClient, requireRole } from '@/lib/authz'
import {
  sanitizeCoachSpeechText,
  truncateSpeechAtSentenceBoundary,
} from '@/lib/coach-voice-synthesizer'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { validateCoachBrandSafetyOutput } from '@/src/lib/safety/clinicalGuardrails'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

const DEFAULT_COACH_VOICE_ID = 'UPezm4CtrvcD6aNXjeU1'
const VOICE_ID_PATTERN = /^[A-Za-z0-9]{15,30}$/
const VOICE_STORAGE_BUCKET = 'coach-voice-cache'
const VOICE_STORAGE_PREFIX = 'eleven_turbo_v2_5_v2'
const MAX_COACH_SPOKEN_TEXT_CHARS = 2500
const MAX_CLIENT_SPOKEN_TEXT_CHARS = 800
const MAX_SERVER_MEMORY_ENTRIES = 150

// Bounded server-side in-memory audio cache keyed by SHA-256 `(voice_id + normalized_text)`
const serverMemoryAudioCache = new Map<string, Uint8Array>()

function computeServerVoiceHash(voiceId: string, normalizedText: string): string {
  return createHash('sha256')
    .update(`${voiceId}:${normalizedText}`, 'utf8')
    .digest('hex')
}

function normalizeServerSpeechText(rawText: string, maxChars: number): {
  spokenText: string
  normalizedKeyText: string
} {
  const safetyChecked = validateCoachBrandSafetyOutput(rawText)
  const sanitized = sanitizeCoachSpeechText(safetyChecked.cleanText)
  const spokenText = truncateSpeechAtSentenceBoundary(sanitized, maxChars)
  const normalizedKeyText = spokenText.toLowerCase().replace(/\s+/g, ' ').trim()
  return { spokenText, normalizedKeyText }
}

async function readFromSupabaseVoiceCache(hash: string): Promise<Uint8Array | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return null
    }
    const admin = supabaseAdmin()
    const { data, error } = await admin.storage
      .from(VOICE_STORAGE_BUCKET)
      .download(`${VOICE_STORAGE_PREFIX}/${hash}.mp3`)
    if (error || !data) return null
    const arrayBuffer = await data.arrayBuffer()
    return arrayBuffer.byteLength > 128 ? new Uint8Array(arrayBuffer) : null
  } catch {
    return null
  }
}

async function writeToSupabaseVoiceCache(hash: string, bytes: Uint8Array): Promise<void> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return
    }
    const admin = supabaseAdmin()
    await admin.storage
      .from(VOICE_STORAGE_BUCKET)
      .upload(`${VOICE_STORAGE_PREFIX}/${hash}.mp3`, Buffer.from(bytes), {
        contentType: 'audio/mpeg',
        upsert: true,
        cacheControl: '31536000',
      })
  } catch {
    // Non-fatal if bucket has not been provisioned yet in local dev
  }
}

/**
 * POST /api/voice/synthesize
 *
 * Server-side proxy for Coach Gordon's cloned ElevenLabs voice (`eleven_turbo_v2_5`).
 * - Never exposes `ELEVENLABS_API_KEY` or `COACH_GORDON_VOICE_ID` to the browser.
 * - Caches synthesized audio blobs by SHA-256 `(voice_id + normalized_text)` in
 *   server LRU memory + private Supabase Storage (`coach-voice-cache`) + client IndexedDB.
 */
export async function POST(req: NextRequest) {
  let authenticatedUserId: string | null = null
  let callerRole: 'coach' | 'client' = 'client'
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach', 'client'])
    requireActiveClient(authz.client)
    authenticatedUserId = authz.user.id
    callerRole = authz.client.role === 'coach' ? 'coach' : 'client'
  } catch (error) {
    // SECURITY (#36): Never honor NEXT_PUBLIC_ALLOW_ANON_PREVIEW for cloned-voice synthesis
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
  }

  const body = await req.json().catch(() => null)
  const rawText = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!rawText) {
    return NextResponse.json({ error: 'Text is required for voice synthesis' }, { status: 400 })
  }

  const maxChars = callerRole === 'coach' ? MAX_COACH_SPOKEN_TEXT_CHARS : MAX_CLIENT_SPOKEN_TEXT_CHARS
  const { spokenText, normalizedKeyText } = normalizeServerSpeechText(rawText, maxChars)
  if (!spokenText || !normalizedKeyText) {
    return NextResponse.json({ error: 'Sanitized speech text is empty' }, { status: 400 })
  }

  const rawVoiceId =
    process.env.COACH_GORDON_VOICE_ID ||
    process.env.COACH_GORDON_ELEVENLABS_VOICE_ID ||
    process.env.ELEVENLABS_VOICE_ID ||
    DEFAULT_COACH_VOICE_ID
  const voiceId = VOICE_ID_PATTERN.test(rawVoiceId.trim()) ? rawVoiceId.trim() : DEFAULT_COACH_VOICE_ID

  const cacheHash = computeServerVoiceHash(voiceId, normalizedKeyText)

  // 1. Check Server In-Memory LRU Cache
  const memCached = serverMemoryAudioCache.get(cacheHash)
  if (memCached) {
    return new NextResponse(Buffer.from(memCached), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Voice-Cache': 'HIT-MEMORY',
        'X-Voice-Cache-Hash': cacheHash,
      },
    })
  }

  // 2. Check Private Supabase Storage Cache
  const storageCached = await readFromSupabaseVoiceCache(cacheHash)
  if (storageCached) {
    serverMemoryAudioCache.set(cacheHash, storageCached)
    return new NextResponse(Buffer.from(storageCached), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Voice-Cache': 'HIT-STORAGE',
        'X-Voice-Cache-Hash': cacheHash,
      },
    })
  }

  // 2.5 Per-User & Per-IP Rate Limit (enforced on uncached ElevenLabs API calls — #36)
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    const ip = getClientIp(req)
    const dbIpLimit = await enforceRateLimit({
      key: `voice_synth:ip:${ip}`,
      limit: 60,
      windowSeconds: 600,
      route: '/api/voice/synthesize',
      dimension: 'ip',
    })
    if (!dbIpLimit.allowed) {
      return NextResponse.json(
        {
          fallback: 'web_speech',
          cacheHash,
          spokenText,
          reason: 'Voice synthesis IP rate limit reached; using device speech fallback.',
        },
        { status: 429 }
      )
    }

    if (authenticatedUserId) {
      const dbUserLimit = await enforceRateLimit({
        key: `voice_synth:user:${authenticatedUserId}`,
        limit: callerRole === 'coach' ? 150 : 30,
        windowSeconds: 600,
        route: '/api/voice/synthesize',
        dimension: 'user',
      })
      if (!dbUserLimit.allowed) {
        return NextResponse.json(
          {
            fallback: 'web_speech',
            cacheHash,
            spokenText,
            reason: 'Voice synthesis quota reached for this window; using device speech fallback.',
          },
          { status: 429 }
        )
      }
    }
  }

  const rateCheck = checkSlidingWindowRateLimit({
    namespace: 'voice_synthesize_uncached',
    subjectKey: resolveRequestSubjectKey(req, authenticatedUserId),
    maxRequests: callerRole === 'coach' ? 120 : 25,
    windowMs: 10 * 60 * 1000,
  })
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        fallback: 'web_speech',
        cacheHash,
        spokenText,
        reason: 'Voice synthesis quota reached for this window; using device speech fallback.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateCheck.retryAfterSeconds),
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // 3. Call ElevenLabs Low-Latency Streaming Endpoint (`eleven_turbo_v2_5`)
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
  if (!elevenLabsApiKey) {
    return NextResponse.json(
      {
        fallback: 'web_speech',
        cacheHash,
        spokenText,
        reason: 'ELEVENLABS_API_KEY not configured in local environment',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
          'X-Voice-Cache': 'LOCAL-FALLBACK',
          'X-Voice-Cache-Hash': cacheHash,
        },
      }
    )
  }

  try {
    // Use full single-stream synthesis (without /stream?optimize_streaming_latency=3) so multi-paragraph
    // coaching descriptions never suffer chunked-MP3 header duration truncation or trailing-syllable clipping.
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId
    )}?output_format=mp3_44100_128`

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: spokenText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.62,
          similarity_boost: 0.86,
          style: 0.18,
          use_speaker_boost: true,
        },
      }),
    })

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => '')
      console.warn('[VoiceSynthesize] ElevenLabs upstream status:', upstream.status, errBody.slice(0, 180))
      return NextResponse.json(
        {
          fallback: 'web_speech',
          cacheHash,
          spokenText,
          reason: 'Upstream voice service temporarily unavailable',
        },
        { status: 200 }
      )
    }

    const audioArrayBuffer = await upstream.arrayBuffer()
    const audioBytes = new Uint8Array(audioArrayBuffer)

    if (audioBytes.byteLength > 128) {
      if (serverMemoryAudioCache.size >= MAX_SERVER_MEMORY_ENTRIES) {
        const oldest = serverMemoryAudioCache.keys().next().value
        if (oldest) serverMemoryAudioCache.delete(oldest)
      }
      serverMemoryAudioCache.set(cacheHash, audioBytes)
      void writeToSupabaseVoiceCache(cacheHash, audioBytes)
    }

    return new NextResponse(Buffer.from(audioBytes), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Voice-Cache': 'MISS',
        'X-Voice-Cache-Hash': cacheHash,
      },
    })
  } catch (err) {
    console.error('[VoiceSynthesize] Unexpected proxy error:', err)
    return NextResponse.json(
      {
        fallback: 'web_speech',
        cacheHash,
        spokenText,
      },
      { status: 200 }
    )
  }
}
