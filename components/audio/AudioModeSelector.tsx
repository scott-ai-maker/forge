'use client'

import React from 'react'
import { Bell, Mic, VolumeX } from 'lucide-react'
import { useCoachVoiceEngine, type CoachAudioMode } from '@/src/lib/audio/coachVoiceEngine'
import { unlockSharedAudioContextOnGesture } from '@/lib/sfx-audio'

export interface AudioModeSelectorProps {
  compact?: boolean
  className?: string
}

const AUDIO_MODE_OPTIONS: Array<{
  mode: CoachAudioMode
  label: string
  shortLabel: string
}> = [
  { mode: 'voice_and_chimes', label: 'Voice + Chimes', shortLabel: 'Voice' },
  { mode: 'chimes_only', label: 'Chimes Only', shortLabel: 'Chimes' },
  { mode: 'muted', label: 'Muted', shortLabel: 'Muted' },
]

export default function AudioModeSelector({
  compact = false,
  className = '',
}: AudioModeSelectorProps) {
  const { audioMode, setAudioMode } = useCoachVoiceEngine()

  const handleSelect = (nextMode: CoachAudioMode) => {
    if (nextMode !== 'muted') {
      unlockSharedAudioContextOnGesture()
    }
    setAudioMode(nextMode)
  }

  if (compact) {
    const cycleNext = () => {
      const next: CoachAudioMode =
        audioMode === 'muted'
          ? 'voice_and_chimes'
          : audioMode === 'voice_and_chimes'
            ? 'chimes_only'
            : 'muted'
      handleSelect(next)
    }

    return (
      <button
        type="button"
        onClick={cycleNext}
        data-testid="coach-audio-mode-cycle"
        aria-label={`Coach audio mode: ${
          audioMode === 'voice_and_chimes'
            ? 'Voice and Chimes'
            : audioMode === 'chimes_only'
              ? 'Chimes Only'
              : 'Muted'
        }. Tap to switch audio mode.`}
        className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
          audioMode === 'voice_and_chimes'
            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
            : audioMode === 'chimes_only'
              ? 'border-amber-500/35 bg-amber-500/12 text-amber-300'
              : 'border-white/10 bg-[#181B22] text-zinc-400 hover:border-white/15 hover:text-zinc-200'
        } ${className}`}
      >
        {audioMode === 'voice_and_chimes' ? (
          <Mic size={13} strokeWidth={1.85} aria-hidden="true" />
        ) : audioMode === 'chimes_only' ? (
          <Bell size={13} strokeWidth={1.85} aria-hidden="true" />
        ) : (
          <VolumeX size={13} strokeWidth={1.85} aria-hidden="true" />
        )}
        <span>
          {audioMode === 'voice_and_chimes'
            ? 'Voice + Chimes'
            : audioMode === 'chimes_only'
              ? 'Chimes Only'
              : 'Muted'}
        </span>
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-label="Coach Gordon audio mode"
      data-testid="coach-audio-mode-selector"
      className={`grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-[#090A0D] p-1 ${className}`}
    >
      {AUDIO_MODE_OPTIONS.map(opt => {
        const active = audioMode === opt.mode
        return (
          <button
            key={opt.mode}
            type="button"
            aria-pressed={active}
            onClick={() => handleSelect(opt.mode)}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
              active
                ? opt.mode === 'voice_and_chimes'
                  ? 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : opt.mode === 'chimes_only'
                    ? 'border border-amber-500/40 bg-amber-500/15 text-amber-200'
                    : 'border border-white/15 bg-[#181B22] text-zinc-100'
                : 'text-zinc-400 hover:bg-[#181B22]/70 hover:text-zinc-200'
            }`}
          >
            {opt.mode === 'voice_and_chimes' ? (
              <Mic size={12} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
            ) : opt.mode === 'chimes_only' ? (
              <Bell size={12} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
            ) : (
              <VolumeX size={12} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
            )}
            <span className="truncate">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
