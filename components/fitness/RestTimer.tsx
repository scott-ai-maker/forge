'use client'

import { useState, useEffect, useRef } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { isSfxMuted } from '@/lib/sfx-audio'

interface RestTimerProps {
  defaultSeconds?: number
  autoStart?: boolean
  onDone?: () => void
}

export default function RestTimer({ defaultSeconds = 90, autoStart = false, onDone }: RestTimerProps) {
  const [targetSeconds, setTargetSeconds] = useState(defaultSeconds)
  const [remaining, setRemaining] = useState<number | null>(autoStart ? defaultSeconds : null)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    setTargetSeconds(defaultSeconds)
    if (autoStart) {
      setRemaining(defaultSeconds)
      setRunning(true)
    }
  }, [defaultSeconds, autoStart])

  async function playDoneSound() {
    triggerHaptic('timer')
    if (isSfxMuted()) return
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const now = ctx.currentTime
      const playBeep = (frequency: number, startAt: number, duration: number) => {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()

        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, startAt)

        gain.gain.setValueAtTime(0.0001, startAt)
        gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

        oscillator.connect(gain)
        gain.connect(ctx.destination)

        oscillator.start(startAt)
        oscillator.stop(startAt + duration)
      }

      playBeep(880, now, 0.18)
      playBeep(1047, now + 0.24, 0.22)
    } catch {
      // Ignore audio failures (e.g., autoplay restrictions) and keep timer behavior intact.
    }
  }

  async function playWarningPip() {
    triggerHaptic('tap')
    if (isSfxMuted()) return
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const now = ctx.currentTime
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(659.25, now)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start(now)
      oscillator.stop(now + 0.08)
    } catch {
      // Ignore audio failures
    }
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev === null || prev <= 1) {
            setRunning(false)
            onDone?.()
            void playDoneSound()
            return 0
          }
          const next = prev - 1
          if (next === 3 || next === 2 || next === 1) {
            void playWarningPip()
          }
          return next
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, onDone])

  function start() {
    setRemaining(targetSeconds)
    setRunning(true)
  }

  function stop() {
    setRunning(false)
    setRemaining(null)
  }

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }
    }
  }, [])

  const mins = remaining !== null ? Math.floor(remaining / 60) : Math.floor(targetSeconds / 60)
  const secs = remaining !== null ? remaining % 60 : targetSeconds % 60
  const pct = remaining !== null ? remaining / targetSeconds : 1
  const done = remaining === 0

  const timerColor = done
    ? '#34D399'
    : remaining !== null && remaining < 15
      ? '#FB7185'
      : '#FBBF24'

  return (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <div className="relative h-14 w-14 shrink-0">
        <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={28} cy={28} r={23} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
          <circle
            cx={28}
            cy={28}
            r={23}
            fill="none"
            stroke={timerColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 23}`}
            strokeDashoffset={`${2 * Math.PI * 23 * (1 - pct)}`}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold tabular-nums"
          style={{ color: timerColor }}
        >
          {done ? <GaaIcon name="check" size={16} tone="emerald" /> : `${mins}:${String(secs).padStart(2, '0')}`}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Rest Timer
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!running && (
            <>
              <select
                value={targetSeconds}
                aria-label="Rest timer duration"
                onChange={e => setTargetSeconds(Number(e.target.value))}
                className="min-h-[44px] cursor-pointer rounded-xl border border-white/10 bg-[#181B22] px-3 py-1.5 font-mono text-sm font-semibold tabular-nums text-white transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
              >
                {[30, 45, 60, 90, 120, 150, 180, 240, 300].map(s => (
                  <option key={s} value={s}>
                    {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={start}
                className="forge-tactile-press min-h-[44px] rounded-xl bg-emerald-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
              >
                Start
              </button>
            </>
          )}
          {running && (
            <button
              type="button"
              onClick={stop}
              className="forge-tactile-press min-h-[44px] rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-rose-300 transition-colors duration-150 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Stop
            </button>
          )}
          {done && !running && (
            <button
              type="button"
              onClick={start}
              className="forge-tactile-press min-h-[44px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-300 transition-colors duration-150 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Restart
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
