import { describe, it, expect } from 'vitest'
import { dataUrlToBlob, resolvePlayableAudioUrl } from './audio-blob-utils'

describe('audio-blob-utils', () => {
  it('converts base64 data URL to Blob correctly', () => {
    // Valid 1x1 png or simple base64 string
    const sampleDataUrl = 'data:audio/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ=='
    const blob = dataUrlToBlob(sampleDataUrl)
    expect(blob).not.toBeNull()
    expect(blob?.type).toBe('audio/mp4')
    expect(blob?.size).toBeGreaterThan(0)
  })

  it('returns null for invalid data URLs', () => {
    expect(dataUrlToBlob('')).toBeNull()
    expect(dataUrlToBlob('https://example.com/audio.mp3')).toBeNull()
    expect(dataUrlToBlob('invalid')).toBeNull()
  })

  it('resolves playable URL safely', () => {
    const res = resolvePlayableAudioUrl('https://example.com/audio.mp3')
    expect(res.url).toBe('https://example.com/audio.mp3')
    expect(() => res.revoke()).not.toThrow()
  })
})

