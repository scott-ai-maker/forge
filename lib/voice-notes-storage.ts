import type { SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const COACH_VOICE_NOTES_BUCKET = 'coach-voice-notes'
export const VOICE_NOTE_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 // 24 hours

export interface VoiceNoteMeta {
  duration: number
  payload: string
}

/**
 * Checks if a message body is formatted as a voice note.
 */
export function isVoiceNoteBody(body: string | null | undefined): boolean {
  if (!body || typeof body !== 'string') return false
  const clean = body.startsWith('[retracted]:') ? body.slice('[retracted]:'.length) : body
  return clean.startsWith('[voice-note]:')
}

/**
 * Parses duration and payload from a voice note string.
 * Example: "[voice-note]:15:client-123/voice_17123.mp4" => { duration: 15, payload: "client-123/voice_17123.mp4" }
 */
export function parseVoiceNoteBody(body: string | null | undefined): VoiceNoteMeta | null {
  if (!body || typeof body !== 'string') return null
  const clean = body.startsWith('[retracted]:') ? body.slice('[retracted]:'.length) : body
  const match = clean.match(/^\[voice-note\]:(\d+(?:\.\d+)?):([\s\S]+)$/)
  if (!match) return null

  return {
    duration: Math.round(Number(match[1])) || 0,
    payload: match[2].trim(),
  }
}

/**
 * Formats duration and path into a voice note message string.
 */
export function formatVoiceNoteBody(duration: number, pathOrUrl: string): string {
  return `[voice-note]:${Math.max(0, Math.round(duration))}:${pathOrUrl.trim()}`
}

/**
 * Uploads a base64 audio data URL to private Supabase Storage bucket and returns
 * the relative storage path (e.g., "clientId/voice_1712345678_abcd.mp4").
 *
 * If upload fails (e.g. bucket unavailable in local dev/mock test), falls back
 * safely to returning the original data URL so no voice data is lost.
 */
export async function uploadVoiceNoteAudio(
  admin: SupabaseClient | { storage: { from: (bucket: string) => any } },
  params: {
    clientId: string
    audioDataUrl: string
    duration: number
  }
): Promise<string> {
  const { clientId, audioDataUrl, duration } = params

  // If already a storage path or HTTP URL, return as-is
  if (!audioDataUrl.startsWith('data:')) {
    return formatVoiceNoteBody(duration, audioDataUrl)
  }

  if (!('storage' in admin) || !admin.storage?.from) {
    return formatVoiceNoteBody(duration, audioDataUrl)
  }

  try {
    const commaIdx = audioDataUrl.indexOf(',')
    if (commaIdx === -1) {
      return formatVoiceNoteBody(duration, audioDataUrl)
    }

    const header = audioDataUrl.slice(0, commaIdx)
    const base64Data = audioDataUrl.slice(commaIdx + 1).trim().replace(/\s/g, '')

    const mimeMatch = header.match(/data:(.*?);base64/)
    const mimeType = mimeMatch ? mimeMatch[1].split(';')[0].trim() : 'audio/mp4'

    const ext = mimeType.includes('webm')
      ? 'webm'
      : mimeType.includes('ogg')
      ? 'ogg'
      : mimeType.includes('aac')
      ? 'aac'
      : 'mp4'

    const buffer = Buffer.from(base64Data, 'base64')
    const randomHex = randomBytes(6).toString('hex')
    const filename = `${clientId}/voice_${Date.now()}_${randomHex}.${ext}`

    const { error: uploadError } = await admin.storage
      .from(COACH_VOICE_NOTES_BUCKET)
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.warn('[VoiceNotes] Supabase voice note storage upload failed, using inline fallback:', uploadError.message)
      return formatVoiceNoteBody(duration, audioDataUrl)
    }

    // Successfully uploaded to private storage bucket!
    return formatVoiceNoteBody(duration, filename)
  } catch (err) {
    console.warn('[VoiceNotes] Voice note storage processing exception:', err)
    return formatVoiceNoteBody(duration, audioDataUrl)
  }
}

/**
 * Batch generates signed URLs for messages containing private storage paths.
 */
export async function enrichMessagesWithSignedVoiceUrls(
  admin: SupabaseClient | { storage: { from: (bucket: string) => any } },
  messages: Array<{
    id: string
    message_body: string
    clean_body?: string
    [key: string]: unknown
  }>
): Promise<Array<{
  id: string
  message_body: string
  clean_body?: string
  [key: string]: unknown
}>> {
  const pathsToSign: string[] = []

  for (const m of messages) {
    const parsed = parseVoiceNoteBody(m.message_body)
    if (parsed) {
      const payload = parsed.payload
      // If it's a storage path (not data: or http/https)
      if (!payload.startsWith('data:') && !payload.startsWith('http://') && !payload.startsWith('https://') && !payload.startsWith('blob:')) {
        pathsToSign.push(payload)
      }
    }
  }

  if (pathsToSign.length === 0 || !('storage' in admin) || !admin.storage?.from) {
    return messages
  }

  const uniquePaths = Array.from(new Set(pathsToSign))
  const signedUrlMap = new Map<string, string>()

  try {
    const { data, error } = await admin.storage
      .from(COACH_VOICE_NOTES_BUCKET)
      .createSignedUrls(uniquePaths, VOICE_NOTE_SIGNED_URL_TTL_SECONDS)

    if (!error && Array.isArray(data)) {
      for (const item of data) {
        if (item?.signedUrl && item?.path) {
          signedUrlMap.set(item.path, item.signedUrl)
        }
      }
    }
  } catch (err) {
    console.warn('Failed to batch sign voice note URLs:', err)
  }

  if (signedUrlMap.size === 0) {
    return messages
  }

  return messages.map(m => {
    const parsed = parseVoiceNoteBody(m.message_body)
    if (!parsed) return m

    const signedUrl = signedUrlMap.get(parsed.payload)
    if (!signedUrl) return m

    const isRetracted = String(m.message_body).startsWith('[retracted]:')
    const replacedBody = formatVoiceNoteBody(parsed.duration, signedUrl)
    const finalBody = isRetracted ? `[retracted]:${replacedBody}` : replacedBody

    return {
      ...m,
      message_body: finalBody,
      clean_body: replacedBody,
    }
  })
}
