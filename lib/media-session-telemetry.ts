/**
 * Web MediaSession & Lock Screen Telemetry Bridge
 * Keeps live workout time and current exercise visible on iOS Lock Screen, Dynamic Island,
 * Apple Watch Now Playing widget, and Android Media Center.
 */

export interface LiveSessionMediaMetadata {
  dayNumber: number
  workoutFocus: string
  elapsedSeconds: number
  activeStage: 'warmup' | 'strength' | 'cardio' | 'cooldown' | 'idle'
  currentExerciseName?: string
  completedSets?: number
  totalSets?: number
}

let silentAudioElement: HTMLAudioElement | null = null

function ensureSilentAudioLoop(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!silentAudioElement) {
    // Ultra-short base64 silent WAV
    const silentWavBase64 = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
    silentAudioElement = new Audio(silentWavBase64)
    silentAudioElement.loop = true
  }
  return silentAudioElement
}

export function updateLockScreenSessionTelemetry(
  meta: LiveSessionMediaMetadata,
  callbacks?: {
    onPause?: () => void
    onResume?: () => void
    onStop?: () => void
  }
) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return

  const mm = Math.floor(meta.elapsedSeconds / 60).toString().padStart(2, '0')
  const ss = (meta.elapsedSeconds % 60).toString().padStart(2, '0')
  const stageLabel = meta.activeStage === 'cardio' ? 'Cardio' : meta.activeStage === 'cooldown' ? 'Cool-Down' : 'Strength'

  const progress = meta.totalSets ? `Set ${meta.completedSets || 0}/${meta.totalSets}` : ''
  const exerciseText = meta.currentExerciseName ? ` · ${meta.currentExerciseName} (${progress})` : ''

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Day ${meta.dayNumber}: ${meta.workoutFocus}`,
      artist: `Gordon Athletic Advisory${exerciseText}`,
      album: `${mm}:${ss} (${stageLabel})`,
      artwork: [
        { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    })

    if (callbacks?.onPause) {
      navigator.mediaSession.setActionHandler('pause', callbacks.onPause)
    }
    if (callbacks?.onResume) {
      navigator.mediaSession.setActionHandler('play', callbacks.onResume)
    }
    if (callbacks?.onStop) {
      navigator.mediaSession.setActionHandler('stop', callbacks.onStop)
    }

    const audio = ensureSilentAudioLoop()
    if (audio && audio.paused) {
      audio.play().catch(() => {
        // Autoplay policy fallback
      })
    }
  } catch {
    // Ignore environments where MediaMetadata is restricted
  }
}

export function clearLockScreenSessionTelemetry() {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.setActionHandler('pause', null)
    navigator.mediaSession.setActionHandler('play', null)
    navigator.mediaSession.setActionHandler('stop', null)

    if (silentAudioElement) {
      silentAudioElement.pause()
      silentAudioElement.currentTime = 0
    }
  } catch {}
}

