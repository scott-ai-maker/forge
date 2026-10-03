import { describe, expect, it, vi } from 'vitest'
import {
  isVoiceNoteBody,
  parseVoiceNoteBody,
  formatVoiceNoteBody,
  uploadVoiceNoteAudio,
  enrichMessagesWithSignedVoiceUrls,
  COACH_VOICE_NOTES_BUCKET,
} from './voice-notes-storage'

describe('lib/voice-notes-storage', () => {
  it('identifies and parses voice note bodies correctly', () => {
    expect(isVoiceNoteBody('Hello coach')).toBe(false)
    expect(isVoiceNoteBody('[voice-note]:12:path/to/audio.mp4')).toBe(true)
    expect(isVoiceNoteBody('[retracted]:[voice-note]:12:path/to/audio.mp4')).toBe(true)

    const parsed = parseVoiceNoteBody('[voice-note]:14.6:client-1/voice_123.mp4')
    expect(parsed).toEqual({
      duration: 15,
      payload: 'client-1/voice_123.mp4',
    })

    const formatted = formatVoiceNoteBody(15, 'client-1/voice_123.mp4')
    expect(formatted).toBe('[voice-note]:15:client-1/voice_123.mp4')
  })

  it('uploads base64 audio data URL to Supabase storage bucket', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null })
    const adminMock = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: uploadMock,
        }),
      },
    }

    const testDataUrl = 'data:audio/mp4;base64,AAAA'
    const res = await uploadVoiceNoteAudio(adminMock as any, {
      clientId: 'client-abc',
      audioDataUrl: testDataUrl,
      duration: 8,
    })

    expect(adminMock.storage.from).toHaveBeenCalledWith(COACH_VOICE_NOTES_BUCKET)
    expect(uploadMock).toHaveBeenCalledOnce()
    expect(res).toMatch(/^\[voice-note\]:8:client-abc\/voice_\d+_[a-f0-9]+\.mp4$/)
  })

  it('falls back safely to inline data URL if storage upload fails', async () => {
    const adminMock = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ error: new Error('Bucket not found') }),
        }),
      },
    }

    const testDataUrl = 'data:audio/webm;base64,GkXf'
    const res = await uploadVoiceNoteAudio(adminMock as any, {
      clientId: 'client-abc',
      audioDataUrl: testDataUrl,
      duration: 5,
    })

    expect(res).toBe(`[voice-note]:5:${testDataUrl}`)
  })

  it('batch enriches messages with signed CDN URLs', async () => {
    const adminMock = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrls: vi.fn().mockResolvedValue({
            data: [
              { path: 'client-1/voice_1.mp4', signedUrl: 'https://cdn.example.com/signed_1.mp4' },
              { path: 'client-1/voice_2.mp4', signedUrl: 'https://cdn.example.com/signed_2.mp4' },
            ],
            error: null,
          }),
        }),
      },
    }

    const rawMessages = [
      { id: '1', message_body: 'Great workout today!' },
      { id: '2', message_body: '[voice-note]:10:client-1/voice_1.mp4' },
      { id: '3', message_body: '[retracted]:[voice-note]:20:client-1/voice_2.mp4' },
    ]

    const enriched = await enrichMessagesWithSignedVoiceUrls(adminMock as any, rawMessages)

    expect(enriched[0].message_body).toBe('Great workout today!')
    expect(enriched[1].message_body).toBe('[voice-note]:10:https://cdn.example.com/signed_1.mp4')
    expect(enriched[2].message_body).toBe('[retracted]:[voice-note]:20:https://cdn.example.com/signed_2.mp4')
  })
})

