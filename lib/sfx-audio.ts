'use client'

import { useState, useEffect, useCallback } from 'react'

export const SFX_MUTED_STORAGE_KEY = 'forge_sfx_muted_v1'
const SFX_EVENT_NAME = 'forge:sfx-muted-changed'

export type TactileToneType = 'tick' | 'chime' | 'cue' | 'success' | 'countdown' | 'rep_complete'

let sharedAudioCtx: AudioContext | null = null

/**
 * Global SFX Muted state.
 * Strictly defaults to `true` (SFX MUTED) when unset or in SSR.
 */
export function isSfxMuted(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(SFX_MUTED_STORAGE_KEY)
    if (raw === null) return true
    return raw !== 'false'
  } catch {
    return true
  }
}

export function setSfxMuted(muted: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SFX_MUTED_STORAGE_KEY, muted ? 'true' : 'false')
    window.dispatchEvent(new CustomEvent(SFX_EVENT_NAME, { detail: { muted } }))
  } catch {
    // Ignore storage quota / private browsing errors
  }
}

export function playForgeTactileTone(type: TactileToneType): void {
  if (isSfxMuted()) return
  if (typeof window === 'undefined') return

  try {
    if (!sharedAudioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      sharedAudioCtx = new AudioContextClass()
    }
    const ctx = sharedAudioCtx
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const now = ctx.currentTime

    if (type === 'tick') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(540, now)
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04)
      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.04)
    } else if (type === 'countdown') {
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

  useEffect(() => {
    setSfxMutedState(isSfxMuted())

    const handleSync = (event: Event) => {
      const custom = event as CustomEvent<{ muted?: boolean }>
      if (typeof custom.detail?.muted === 'boolean') {
        setSfxMutedState(custom.detail.muted)
      } else {
        setSfxMutedState(isSfxMuted())
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SFX_MUTED_STORAGE_KEY) {
        setSfxMutedState(isSfxMuted())
      }
    }

    window.addEventListener(SFX_EVENT_NAME, handleSync)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(SFX_EVENT_NAME, handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const toggleSfxMuted = useCallback(() => {
    const nextMuted = !isSfxMuted()
    setSfxMuted(nextMuted)
    setSfxMutedState(nextMuted)
    if (!nextMuted) {
      playForgeTactileTone('chime')
    }
  }, [])

  const updateSfxMuted = useCallback((muted: boolean) => {
    setSfxMuted(muted)
    setSfxMutedState(muted)
  }, [])

  return {
    sfxMuted,
    soundEnabled: !sfxMuted,
    toggleSfxMuted,
    setSfxMuted: updateSfxMuted,
    playTone: playForgeTactileTone,
  }
}
