'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

interface CinematicVideoPlayerProps {
  src?: string
  poster?: string
  title?: string
  autoPlay?: boolean
  loop?: boolean
  allowCustomUrl?: boolean
}

export default function CinematicVideoPlayer({
  src = '/videos/gaa-founding-manifesto.mp4',
  poster = '/images/backgrounds/coach-olympic-facility-gaa.jpg',
  title = 'Kinetic Architecture & Biomechanical Precision',
  autoPlay = true,
  loop = true,
  allowCustomUrl = true,
}: CinematicVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [activeSrc, setActiveSrc] = useState(src)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isLooping, setIsLooping] = useState(loop)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [customInputUrl, setCustomInputUrl] = useState('')
  const [showUrlDrawer, setShowUrlDrawer] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseMove = () => {
    setIsControlsVisible(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false)
      }, 3000)
    }
  }

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const toggleMute = () => {
    if (!videoRef.current) return
    const nextMuted = !videoRef.current.muted
    videoRef.current.muted = nextMuted
    setIsMuted(nextMuted)
  }

  const toggleLoop = () => {
    if (!videoRef.current) return
    const nextLoop = !isLooping
    videoRef.current.loop = nextLoop
    setIsLooping(nextLoop)
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      // Fallback
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const seekTime = Number(e.target.value)
    videoRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customInputUrl.trim()) return
    setActiveSrc(customInputUrl.trim())
    setShowUrlDrawer(false)
    setIsVideoLoaded(false)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setIsControlsVisible(false)}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#060B12',
        border: '1.5px solid rgba(197, 160, 89, 0.4)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(197, 160, 89, 0.1)',
        aspectRatio: '16/9',
        width: '100%',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={activeSrc}
        poster={poster}
        playsInline
        muted={isMuted}
        loop={isLooping}
        autoPlay={autoPlay}
        preload="metadata"
        onClick={togglePlay}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration)
            setIsVideoLoaded(true)
            if (autoPlay) {
              videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
            }
          }
        }}
        onEnded={() => !isLooping && setIsPlaying(false)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {/* Atmospheric Vignette Overlay */}
      <div
        onClick={togglePlay}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(6,11,18,0.7) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Diagnostic Header Badge */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(8, 14, 24, 0.82)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: 6,
          border: '1px solid rgba(197, 160, 89, 0.3)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isPlaying ? 'var(--gold)' : 'var(--gray)',
            boxShadow: isPlaying ? '0 0 8px var(--gold)' : 'none',
          }}
        />
        <span
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold-lt)',
          }}
        >
          GAA Clinical Labs · 4K Motion Reel
        </span>
      </div>

      {/* Custom URL Drawer Trigger Button */}
      {allowCustomUrl && (
        <button
          type="button"
          onClick={() => setShowUrlDrawer(!showUrlDrawer)}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'rgba(8, 14, 24, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(197, 160, 89, 0.3)',
            color: 'var(--gold-lt)',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'Raleway, sans-serif',
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            zIndex: 4,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
          title="Switch or preview custom video URL"
        >
          <GaaIcon name="video-studio" size={13} tone="gold" />
          <span>Change Video</span>
        </button>
      )}

      {/* URL Drawer Popover */}
      {showUrlDrawer && (
        <div
          style={{
            position: 'absolute',
            top: 50,
            right: 14,
            width: 320,
            maxWidth: 'calc(100% - 28px)',
            background: 'rgba(10, 16, 28, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 16px 36px rgba(0,0,0,0.8)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Custom Video Source
            </span>
            <button
              type="button"
              onClick={() => setShowUrlDrawer(false)}
              style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleApplyCustomUrl} style={{ display: 'grid', gap: 8 }}>
            <input
              type="url"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="https://... (direct .mp4 URL)"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="submit"
                className="sgf-button sgf-button-gold"
                style={{ flex: 1, padding: '6px 12px', fontSize: 11, fontWeight: 800 }}
              >
                Load Video
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSrc('/videos/gaa-founding-manifesto.mp4')
                  setShowUrlDrawer(false)
                }}
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'var(--gray)',
                  fontSize: 11,
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Reset Default
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Center Big Play Button Overlay (when paused) */}
      {!isPlaying && (
        <div
          onClick={togglePlay}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.95) 0%, rgba(138, 107, 43, 0.95) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(197, 160, 89, 0.6), 0 8px 24px rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,255,255,0.4)',
              transition: 'transform 0.2s ease',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#080E14" style={{ marginLeft: 3 }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p
            style={{
              marginTop: 14,
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 14,
              letterSpacing: '0.06em',
              fontWeight: 700,
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {title}
          </p>
        </div>
      )}

      {/* Bottom Luxury HUD Control Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px 14px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(6, 11, 18, 0.95) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          opacity: isControlsVisible || !isPlaying ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: isControlsVisible || !isPlaying ? 'auto' : 'none',
          zIndex: 3,
        }}
      >
        {/* Progress Scrub Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              appearance: 'none',
              background: `linear-gradient(to right, var(--gold) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
        </div>

        {/* Action Controls & Telemetry Readout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gold-lt)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              style={{
                background: 'transparent',
                border: 'none',
                color: isMuted ? 'var(--gray)' : 'var(--gold-lt)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>

            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 12,
                color: 'var(--gold-lt)',
                letterSpacing: '0.04em',
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={toggleLoop}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLooping ? 'var(--gold-lt)' : 'var(--gray)',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Loop</span>
              <span style={{ fontSize: 9 }}>{isLooping ? '●' : '○'}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Toggle Fullscreen"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

