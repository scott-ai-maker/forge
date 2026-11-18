'use client'

import { useState, useEffect, useCallback } from 'react'

export const SFX_MUTED_STORAGE_KEY = 'forge_sfx_muted_v1'
export const COACH_AUDIO_MODE_STORAGE_KEY = 'forge_audio_mode_v1'
export const SFX_EVENT_NAME = 'forge:sfx-muted-changed'
export const COACH_AUDIO_MODE_EVENT_NAME = 'forge:coach-audio-mode-changed'

export type CoachAudioMode = 'muted' | 'chimes_only' | 'voice_and_chimes'
export type TactileToneType = 'tick' | 'chime' | 'cue' | 'success' | 'countdown' | 'rep_complete'

let sharedAudioCtx: AudioContext | null = null
let iosAudioUnlocked = false
let inMemoryAudioMode: CoachAudioMode = 'muted'

export function getSharedCoachAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    sharedAudioCtx = new AudioContextClass()
  }
  return sharedAudioCtx
}

/**
 * Unlocks iOS Safari / WKWebView Web AudioContext cleanly inside a user tap handler
 * by resuming any suspended AudioContext and playing a 1-sample silent buffer.
 */
export function unlockSharedAudioContextOnGesture(): AudioContext | null {
  const ctx = getSharedCoachAudioContext()
  if (!ctx) return null
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    if (!iosAudioUnlocked) {
      const silentBuffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = silentBuffer
      source.connect(ctx.destination)
      source.start(0)
      iosAudioUnlocked = true
    }
  } catch {
    // Ignore restricted AudioContext errors
  }
  return ctx
}

/**
 * Resolves the 3-state global audio mode:
 * - `'voice_and_chimes'`
 * - `'chimes_only'`
 * - `'muted'` (strictly default until explicit user interaction)
 */
export function getCoachAudioMode(): CoachAudioMode {
  if (typeof window === 'undefined' || typeof window.localStorage?.getItem !== 'function') {
    return inMemoryAudioMode
  }
  try {
    const rawMode = window.localStorage.getItem(COACH_AUDIO_MODE_STORAGE_KEY)
    if (rawMode === 'voice_and_chimes' || rawMode === 'chimes_only' || rawMode === 'muted') {
      return rawMode
    }
    const legacyMuted = window.localStorage.getItem(SFX_MUTED_STORAGE_KEY)
    if (legacyMuted === 'false') {
      return 'voice_and_chimes'
    }
    return 'muted'
  } catch {
    return inMemoryAudioMode
  }
}

export function setCoachAudioMode(mode: CoachAudioMode): void {
  inMemoryAudioMode = mode
  if (typeof window === 'undefined') return
  const muted = mode === 'muted'
  if (!muted) {
    unlockSharedAudioContextOnGesture()
  }
  try {
    if (typeof window.localStorage?.setItem === 'function') {
      window.localStorage.setItem(COACH_AUDIO_MODE_STORAGE_KEY, mode)
      window.localStorage.setItem(SFX_MUTED_STORAGE_KEY, muted ? 'true' : 'false')
    }
    window.dispatchEvent(new CustomEvent(SFX_EVENT_NAME, { detail: { muted, mode } }))
    window.dispatchEvent(new CustomEvent(COACH_AUDIO_MODE_EVENT_NAME, { detail: { mode, muted } }))
  } catch {
    // Ignore storage quota / private browsing errors
  }
}

/**
 * Global SFX Muted state.
 * Strictly defaults to `true` (SFX MUTED) when unset or in SSR.
 * Returns `false` when mode is `'chimes_only'` or `'voice_and_chimes'`.
 */
export function isSfxMuted(): boolean {
  return getCoachAudioMode() === 'muted'
}

export function setSfxMuted(muted: boolean): void {
  if (muted) {
    setCoachAudioMode('muted')
  } else {
    const current = getCoachAudioMode()
    setCoachAudioMode(current === 'muted' ? 'voice_and_chimes' : current)
  }
}

export function playForgeTactileTone(type: TactileToneType): void {
  // Synthetic UI button click/tick tones are disabled; only workout rest/tempo chimes remain active.
  if (type === 'tick') return
  if (isSfxMuted()) return
  if (typeof window === 'undefined') return

  try {
    const ctx = getSharedCoachAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const now = ctx.currentTime

    if (type === 'countdown') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(480, now)
      gain.gain.setValueAtTime(0.045, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === 'rep_complete' || type === 'chime' || type === 'cue') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, now)
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12)
      gain.gain.setValueAtTime(0.055, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.16)
    } else if (type === 'success') {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.08)
        gain.gain.setValueAtTime(0.07, now + i * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.08)
        osc.stop(now + i * 0.08 + 0.45)
      })
    }
  } catch {
    // AudioContext unavailable or restricted; silently degrade
  }
}

export function useSfxMuted() {
  const [sfxMuted, setSfxMutedState] = useState<boolean>(true)
  const [audioMode, setAudioModeState] = useState<CoachAudioMode>('muted')

  useEffect(() => {
    setSfxMutedState(isSfxMuted())
    setAudioModeState(getCoachAudioMode())

    const handleSync = (event: Event) => {
      const custom = event as CustomEvent<{ muted?: boolean; mode?: CoachAudioMode }>
      if (typeof custom.detail?.muted === 'boolean') {
        setSfxMutedState(custom.detail.muted)
      } else {
        setSfxMutedState(isSfxMuted())
      }
      setAudioModeState(custom.detail?.mode ?? getCoachAudioMode())
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SFX_MUTED_STORAGE_KEY || event.key === COACH_AUDIO_MODE_STORAGE_KEY) {
        setSfxMutedState(isSfxMuted())
        setAudioModeState(getCoachAudioMode())
      }
    }

    window.addEventListener(SFX_EVENT_NAME, handleSync)
    window.addEventListener(COACH_AUDIO_MODE_EVENT_NAME, handleSync)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(SFX_EVENT_NAME, handleSync)
      window.removeEventListener(COACH_AUDIO_MODE_EVENT_NAME, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const toggleSfxMuted = useCallback(() => {
    const nextMuted = !isSfxMuted()
    setSfxMuted(nextMuted)
    setSfxMutedState(nextMuted)
    setAudioModeState(getCoachAudioMode())
  }, [])

  const updateSfxMuted = useCallback((muted: boolean) => {
    setSfxMuted(muted)
    setSfxMutedState(muted)
    setAudioModeState(getCoachAudioMode())
  }, [])

  const updateAudioMode = useCallback((mode: CoachAudioMode) => {
    setCoachAudioMode(mode)
    setAudioModeState(mode)
    setSfxMutedState(mode === 'muted')
  }, [])

  return {
    sfxMuted,
    soundEnabled: !sfxMuted,
    audioMode,
    voiceEnabled: audioMode === 'voice_and_chimes',
    toggleSfxMuted,
    setSfxMuted: updateSfxMuted,
    setAudioMode: updateAudioMode,
    playTone: playForgeTactileTone,
  }
}
