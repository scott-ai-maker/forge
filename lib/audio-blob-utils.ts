/**
 * Forge Athletic — Audio & Blob Utilities for Cross-Platform Playback
 * 
 * iOS WebKit (Safari & Chrome on iPhone) has a known limitation where native <audio>
 * elements fail to play data: URLs directly. Converting data: URLs to memory Blobs
 * and generating blob: URLs (via URL.createObjectURL) resolves this issue completely.
 */

// Cache of created blob URLs to prevent re-creation and avoid premature revocation
const blobUrlCache = new Map<string, string>()

/**
 * Converts a base64 Data URL (data:audio/...;base64,...) into a binary Blob.
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return null
  }

  try {
    const commaIdx = dataUrl.indexOf(',')
    if (commaIdx === -1) return null

    const header = dataUrl.slice(0, commaIdx)
    const base64Data = dataUrl.slice(commaIdx + 1).trim().replace(/\s/g, '')

    const mimeMatch = header.match(/data:(.*?);base64/)
    let mimeType = mimeMatch ? mimeMatch[1].split(';')[0].trim() : 'audio/mp4'
    if (!mimeType) mimeType = 'audio/mp4'

    const binaryStr = atob(base64Data)
    const len = binaryStr.length
    const bytes = new Uint8Array(len)

    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    return new Blob([bytes], { type: mimeType })
  } catch (err) {
    console.warn('dataUrlToBlob conversion error:', err)
    return null
  }
}

/**
 * Safely resolves an audio source string (data: URL, blob: URL, or http URL)
 * into a playable URL string that iOS WebKit can decode without stalling.
 */
export function resolvePlayableAudioUrl(audioSrc: string): { url: string; revoke: () => void } {
  if (typeof window === 'undefined' || !audioSrc) {
    return { url: audioSrc || '', revoke: () => {} }
  }

  // If already a blob URL or HTTP URL, return as-is
  if (audioSrc.startsWith('blob:') || audioSrc.startsWith('http://') || audioSrc.startsWith('https://')) {
    return { url: audioSrc, revoke: () => {} }
  }

  if (audioSrc.startsWith('data:')) {
    if (blobUrlCache.has(audioSrc)) {
      return { url: blobUrlCache.get(audioSrc)!, revoke: () => {} }
    }

    const blob = dataUrlToBlob(audioSrc)
    if (blob) {
      const blobUrl = URL.createObjectURL(blob)
      blobUrlCache.set(audioSrc, blobUrl)
      return {
        url: blobUrl,
        revoke: () => {
          // Keep cached for session
        },
      }
    }
  }

  return { url: audioSrc, revoke: () => {} }
}
