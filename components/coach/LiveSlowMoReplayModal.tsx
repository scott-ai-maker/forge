'use client'

import { useState, useRef, useEffect, useId, type CSSProperties } from 'react'
import LiveTelestratorCanvas, { TelestratorTool, TelestratorColor } from './LiveTelestratorCanvas'
import { GaaIcon, type GaaIconName } from '@/components/ui/GaaIcon'
import { useNativeStudioDialog } from './useNativeStudioDialog'

interface LiveSlowMoReplayModalProps {
  videoUrl: string
  clientName?: string
  exerciseName?: string
  onClose: () => void
}

export default function LiveSlowMoReplayModal({
  videoUrl,
  clientName = 'Athlete',
  exerciseName = 'Set Breakdown',
  onClose,
}: LiveSlowMoReplayModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(0.25)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  // Telestrator state for replay review
  const [telestratorActive, setTelestratorActive] = useState(true)
  const [activeTool, setActiveTool] = useState<TelestratorTool>('pen')
  const [activeColor, setActiveColor] = useState<TelestratorColor>('#D4AF37')

  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const titleId = useId()
  const scrubberId = useId()

  useNativeStudioDialog(dialogRef, true, onClose)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackRate

    const handleLoaded = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [playbackRate])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      void video.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  const stepFrame = (deltaSeconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.pause()
    setIsPlaying(false)
    const maxTime = duration > 0 ? duration : video.duration || 10
    const nextTime = Math.max(0, Math.min(maxTime, video.currentTime + deltaSeconds))
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const target = Number(e.target.value)
    if (!Number.isFinite(target)) return
    video.currentTime = target
    setCurrentTime(target)
  }

  const safeDuration = duration > 0 ? duration : 1

  return (
    <dialog
      ref={dialogRef}
      className="forge-live-studio-dialog"
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, unknown>)}
      style={{
        maxWidth: 'min(960px, calc(100vw - 16px))',
      }}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '94dvh',
          background: '#080D1A',
          border: '1px solid rgba(212,160,23,0.5)',
          borderRadius: 14,
          overflowY: 'auto',
          overflowX: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.95)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Top Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            background: 'rgba(14,21,37,0.95)',
            padding: '12px clamp(14px, 2vw, 20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ minInlineSize: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#F59E0B', flexShrink: 0 }} />
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Instant DVR Slow-Mo Replay · {clientName}
              </span>
            </div>
            <h2
              id={titleId}
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 'clamp(15px, 2vw, 18px)',
                margin: '2px 0 0',
                color: '#FFF',
                letterSpacing: '0.04em',
              }}
            >
              {exerciseName} — BIOMECHANICAL FREEZE-FRAME REVIEW
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 44,
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFF',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕ Return to Live Feed
          </button>
        </div>

        {/* ── Video Player & Telestrator Canvas Stage ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            maxHeight: 520,
            background: '#000',
            overflow: 'hidden',
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            playsInline
            loop
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />

          {/* Active Drawing Canvas Overlay */}
          <LiveTelestratorCanvas
            isActive={telestratorActive}
            activeTool={activeTool}
            activeColor={activeColor}
          />
        </div>

        {/* ── Telestrator Tool Palette Bar ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(10,16,28,0.98)',
            padding: '8px clamp(12px, 2vw, 16px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Telestrator Drawing Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800, marginRight: 4 }}>
              Telestrator:
            </span>
            {[
              { id: 'pen' as TelestratorTool, label: 'Pen', icon: 'edit' as GaaIconName },
              { id: 'arrow' as TelestratorTool, label: 'Vector', icon: 'target' as GaaIconName },
              { id: 'circle' as TelestratorTool, label: 'Focus', icon: 'eye' as GaaIconName },
              { id: 'protractor' as TelestratorTool, label: 'Angle', icon: 'angle' as GaaIconName },
            ].map(tool => {
              const selected = telestratorActive && activeTool === tool.id
              return (
                <button
                  key={tool.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setTelestratorActive(true)
                    setActiveTool(tool.id)
                  }}
                  style={{
                    minHeight: 38,
                    background: selected ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                    color: selected ? '#0A0E18' : '#FFF',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    padding: '6px 11px',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name={tool.icon} size={11} tone={selected ? 'inherit' : 'gold'} />
                  <span>{tool.label}</span>
                </button>
              )
            })}
          </div>

          {/* Color Selectors with >= 38px accessible touch targets */}
          <div role="group" aria-label="Telestrator ink color" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[
              { color: '#D4AF37' as TelestratorColor, label: 'Gold' },
              { color: '#10B981' as TelestratorColor, label: 'Green' },
              { color: '#EF4444' as TelestratorColor, label: 'Red' },
              { color: '#38BDF8' as TelestratorColor, label: 'Cyan' },
            ].map(c => {
              const selected = activeColor === c.color
              return (
                <button
                  key={c.color}
                  type="button"
                  aria-label={`${c.label} telestrator ink`}
                  aria-pressed={selected}
                  onClick={() => setActiveColor(c.color)}
                  style={{
                    minWidth: 38,
                    minHeight: 38,
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      background: c.color,
                      border: selected ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.5)',
                      boxShadow: selected ? `0 0 8px ${c.color}` : 'none',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Playback & Speed Controls ── */}
        <div
          style={{
            background: 'rgba(6,10,18,0.98)',
            padding: '12px clamp(12px, 2vw, 20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Timeline Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'monospace', minWidth: 42, fontVariantNumeric: 'tabular-nums' }}>
              {currentTime.toFixed(1)}s
            </span>
            <label htmlFor={scrubberId} className="sr-only">
              Replay timeline scrubber
            </label>
            <input
              id={scrubberId}
              name="replay_scrubber"
              type="range"
              className="forge-range-slider"
              min={0}
              max={safeDuration}
              step={0.05}
              value={currentTime}
              aria-valuetext={`${currentTime.toFixed(1)} of ${duration.toFixed(1)} seconds`}
              onChange={handleSeek}
              style={
                {
                  flex: 1,
                  '--slider-fill-color': '#D4AF37',
                  '--slider-thumb-color': '#D4AF37',
                  '--attr-min': 0,
                  '--attr-max': safeDuration,
                  '--control-value': currentTime,
                } as CSSProperties
              }
            />
            <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'monospace', minWidth: 42, fontVariantNumeric: 'tabular-nums' }}>
              {duration.toFixed(1)}s
            </span>
          </div>

          {/* Buttons: Play, Speeds, Frame Step */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  minHeight: 40,
                  padding: '6px 14px',
                  background: 'var(--gold)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <GaaIcon name={isPlaying ? 'pause' : 'play'} size={13} tone="inherit" />
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                aria-label="Step backward 0.1 seconds"
                onClick={() => stepFrame(-0.1)}
                style={{
                  minHeight: 40,
                  padding: '6px 11px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="rotate-ccw" size={11} tone="inherit" />
                <span>-0.1s</span>
              </button>

              <button
                type="button"
                aria-label="Step forward 0.1 seconds"
                onClick={() => stepFrame(0.1)}
                style={{
                  minHeight: 40,
                  padding: '6px 11px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>+0.1s</span>
                <GaaIcon name="play" size={10} tone="inherit" />
              </button>
            </div>

            {/* Speed Multiplier Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                Speed:
              </span>
              {[
                { speed: 0.1, label: '0.1x' },
                { speed: 0.25, label: '0.25x' },
                { speed: 0.5, label: '0.5x' },
                { speed: 0.75, label: '0.75x' },
                { speed: 1.0, label: '1.0x' },
              ].map(s => {
                const selected = playbackRate === s.speed
                return (
                  <button
                    key={s.speed}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => changeSpeed(s.speed)}
                    style={{
                      minHeight: 38,
                      background: selected ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                      color: selected ? '#0A0E18' : '#FFF',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
