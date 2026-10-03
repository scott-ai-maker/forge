'use client'

import { useState, useRef, useEffect } from 'react'
import LiveTelestratorCanvas, { TelestratorTool, TelestratorColor } from './LiveTelestratorCanvas'
import { GaaIcon, type GaaIconName } from '@/components/ui/GaaIcon'

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

  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = playbackRate

    const handleLoaded = () => {
      if (video.duration) setDuration(video.duration)
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
      void video.play()
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
    const nextTime = Math.max(0, Math.min(duration, video.currentTime + deltaSeconds))
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const target = Number(e.target.value)
    video.currentTime = target
    setCurrentTime(target)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100004,
        background: 'rgba(4,7,13,0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          width: '100%',
          background: '#080D1A',
          border: '1px solid rgba(212,160,23,0.5)',
          borderRadius: 14,
          overflow: 'hidden',
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
            background: 'rgba(14,21,37,0.95)',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: '#F59E0B' }} />
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Instant DVR Slow-Mo Replay · {clientName}
              </span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, margin: '2px 0 0', color: '#FFF', letterSpacing: '0.04em' }}>
              {exerciseName} — BIOMECHANICAL FREEZE-FRAME REVIEW
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
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
            padding: '8px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Telestrator Drawing Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800, marginRight: 4 }}>
              Telestrator:
            </span>
            {[
              { id: 'pen' as TelestratorTool, label: 'Pen', icon: 'edit' as GaaIconName },
              { id: 'arrow' as TelestratorTool, label: 'Vector', icon: 'target' as GaaIconName },
              { id: 'circle' as TelestratorTool, label: 'Focus', icon: 'eye' as GaaIconName },
              { id: 'protractor' as TelestratorTool, label: 'Angle', icon: 'angle' as GaaIconName },
            ].map(tool => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setTelestratorActive(true)
                  setActiveTool(tool.id)
                }}
                style={{
                  background: activeTool === tool.id ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  color: activeTool === tool.id ? '#0A0E18' : '#FFF',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name={tool.icon} size={11} tone={activeTool === tool.id ? 'inherit' : 'gold'} />
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Color Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[
              { color: '#D4AF37' as TelestratorColor, label: 'Gold' },
              { color: '#10B981' as TelestratorColor, label: 'Green' },
              { color: '#EF4444' as TelestratorColor, label: 'Red' },
              { color: '#38BDF8' as TelestratorColor, label: 'Cyan' },
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => setActiveColor(c.color)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  background: c.color,
                  border: activeColor === c.color ? '2px solid #FFF' : '1px solid rgba(0,0,0,0.5)',
                  cursor: 'pointer',
                  boxShadow: activeColor === c.color ? `0 0 8px ${c.color}` : 'none',
                }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* ── Playback & Speed Controls ── */}
        <div
          style={{
            background: 'rgba(6,10,18,0.98)',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Timeline Scrubber */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'monospace', minWidth: 42 }}>
              {currentTime.toFixed(1)}s
            </span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              style={{
                flex: 1,
                accentColor: 'var(--gold)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--gray)', fontFamily: 'monospace', minWidth: 42 }}>
              {duration.toFixed(1)}s
            </span>
          </div>

          {/* Buttons: Play, Speeds, Frame Step */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  padding: '6px 14px',
                  background: 'var(--gold)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 4,
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
                onClick={() => stepFrame(-0.1)}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Step backward 1 frame"
              >
                <GaaIcon name="rotate-ccw" size={11} tone="inherit" />
                <span>-0.1s</span>
              </button>

              <button
                type="button"
                onClick={() => stepFrame(0.1)}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#FFF',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Step forward 1 frame"
              >
                <span>+0.1s</span>
                <GaaIcon name="play" size={10} tone="inherit" />
              </button>
            </div>

            {/* Speed Multiplier Radios */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700 }}>
                Speed:
              </span>
              {[
                { speed: 0.1, label: '0.1x (Slow-Mo)' },
                { speed: 0.25, label: '0.25x' },
                { speed: 0.5, label: '0.5x' },
                { speed: 1.0, label: '1.0x (Normal)' },
              ].map(s => (
                <button
                  key={s.speed}
                  type="button"
                  onClick={() => changeSpeed(s.speed)}
                  style={{
                    background: playbackRate === s.speed ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                    color: playbackRate === s.speed ? '#0A0E18' : '#FFF',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
