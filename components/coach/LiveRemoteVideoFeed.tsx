'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

export interface LiveRemoteVideoFeedProps {
  stream: MediaStream | null
  participantName?: string
  participantRole?: 'Coach' | 'Athlete'
  isConnected?: boolean
  isPeerInLobby?: boolean
  lobbyWaitSeconds?: number
  peerLatencyMs?: number | null
  style?: React.CSSProperties
  onVideoRef?: (el: HTMLVideoElement | null) => void
  mirrored?: boolean
  className?: string
}

/**
 * Enterprise Remote WebRTC Video Player for Live 1:1 Coach Gordon Studio.
 * Guaranteed live playback across iOS Safari, WKWebView, Chrome, and Desktop:
 * - Automatically recovers from iOS unmuted autoplay policies by falling back to muted play + tap-to-unmute.
 * - Listens for track onunmute to unfreeze initial video frames immediately upon arrival.
 * - Self-heals when video stalls or pauses unexpectedly.
 * - Displays active lobby waiting room presence when peer is in studio lobby.
 */
export default function LiveRemoteVideoFeed({
  stream,
  participantName = 'Athlete',
  participantRole = 'Athlete',
  isConnected = false,
  isPeerInLobby = false,
  lobbyWaitSeconds,
  peerLatencyMs,
  style,
  onVideoRef,
  mirrored = false,
  className,
}: LiveRemoteVideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioBlocked, setIsAudioBlocked] = useState(false)
  const [hasActiveTracks, setHasActiveTracks] = useState(false)

  // Safe playback function that gracefully degrades to muted video if iOS/WebKit blocks unmuted audio
  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || !stream) return

    // Ensure srcObject is bound
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    try {
      // First attempt unmuted playback
      await video.play()
      setIsPlaying(true)
      setIsAudioBlocked(false)
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name || ''
      // Browser autoplay policy rejected unmuted video (typical on mobile Safari)
      if (errorName === 'NotAllowedError' || errorName === 'AbortError') {
        try {
          video.muted = true
          await video.play()
          setIsPlaying(true)
          setIsAudioBlocked(true)
        } catch {
          setIsPlaying(false)
        }
      } else {
        setIsPlaying(false)
      }
    }
  }, [stream])

  // User gesture handler to unmute audio and guarantee continuous live streaming
  const handleUserUnmute = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    video.muted = false
    try {
      await video.play()
      setIsAudioBlocked(false)
      setIsPlaying(true)
    } catch {
      // Keep muted if browser still resists
      video.muted = true
    }
  }, [])

  // Bind stream and listen to track arrivals / unmuting
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) {
      setHasActiveTracks(false)
      setIsPlaying(false)
      return
    }

    const checkTracks = () => {
      const tracks = stream.getTracks()
      const active = tracks.some(t => t.readyState === 'live')
      setHasActiveTracks(active)
      if (active) {
        void attemptPlay()
      }
    }

    checkTracks()

    // Bind stream to element
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    void attemptPlay()

    // Event listeners on stream tracks
    const handleTrackEvent = () => {
      checkTracks()
    }

    stream.addEventListener('addtrack', handleTrackEvent)
    stream.addEventListener('removetrack', handleTrackEvent)

    const tracks = stream.getTracks()
    tracks.forEach(t => {
      t.addEventListener('unmute', handleTrackEvent)
      t.addEventListener('mute', handleTrackEvent)
      t.addEventListener('ended', handleTrackEvent)
    })

    return () => {
      stream.removeEventListener('addtrack', handleTrackEvent)
      stream.removeEventListener('removetrack', handleTrackEvent)
      tracks.forEach(t => {
        t.removeEventListener('unmute', handleTrackEvent)
        t.removeEventListener('mute', handleTrackEvent)
        t.removeEventListener('ended', handleTrackEvent)
      })
    }
  }, [stream, attemptPlay])

  const initials =
    participantName
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('') || (participantRole === 'Coach' ? 'CG' : 'AT')

  return (
    <div
      data-testid="live-remote-video-feed"
      onClick={isAudioBlocked ? handleUserUnmute : undefined}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#04070E',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isAudioBlocked ? 'pointer' : 'default',
        ...style,
      }}
      className={className}
    >
      {/* Video Element */}
      {stream ? (
        <video
          ref={el => {
            videoRef.current = el
            onVideoRef?.(el)
            if (el && stream && el.srcObject !== stream) {
              el.srcObject = stream
              void attemptPlay()
            }
          }}
          data-testid="remote-video-element"
          autoPlay
          playsInline
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsPlaying(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirrored ? 'scaleX(-1)' : 'none',
            display: hasActiveTracks ? 'block' : 'none',
          }}
        />
      ) : null}

      {/* Standby / Connecting / Lobby Avatar when stream is not active */}
      {(!stream || !hasActiveTracks) && (
        <div style={{ textAlign: 'center', padding: 20, zIndex: 2 }}>
          <div
            style={{
              position: 'relative',
              width: 76,
              height: 76,
              margin: '0 auto 14px',
            }}
          >
            {/* Animated pulsing halo when peer is waiting in lobby */}
            {isPeerInLobby && (
              <div
                style={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: '2px solid rgba(16, 185, 129, 0.6)',
                  animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
            )}
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: isPeerInLobby
                  ? 'linear-gradient(135deg, #10B981 0%, #065F46 100%)'
                  : 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
                border: isPeerInLobby ? '2px solid #34D399' : '2px solid rgba(212,175,55,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 24,
                color: isPeerInLobby ? '#FFFFFF' : '#0A0E18',
                fontWeight: 700,
                boxShadow: isPeerInLobby
                  ? '0 0 20px rgba(16, 185, 129, 0.6)'
                  : '0 0 15px rgba(212,160,23,0.4)',
                transition: 'all 0.3s ease',
              }}
            >
              {initials}
            </div>
            {isPeerInLobby && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #04070E',
                  boxShadow: '0 0 8px #10B981',
                }}
                title="Active in Live Studio Lobby"
              />
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 18, color: '#FFF' }}>
            {participantName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: isPeerInLobby ? '#34D399' : isConnected ? '#60A5FA' : 'var(--gold-lt)',
              fontWeight: 800,
              marginTop: 6,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isPeerInLobby ? 'rgba(16, 185, 129, 0.12)' : 'rgba(212, 160, 23, 0.08)',
              border: isPeerInLobby ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(212, 160, 23, 0.25)',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isPeerInLobby ? '#34D399' : isConnected ? '#60A5FA' : '#D4AF37',
                boxShadow: isPeerInLobby ? '0 0 6px #34D399' : 'none',
              }}
            />
            <span>
              {isPeerInLobby
                ? `In Studio Lobby Waiting ${lobbyWaitSeconds !== undefined && lobbyWaitSeconds > 0 ? `(${Math.floor(lobbyWaitSeconds / 60)}m ${lobbyWaitSeconds % 60}s)` : ''}`
                : isConnected
                ? 'Signal Connected · Awaiting Camera'
                : 'Standby · Awaiting Remote Stream'}
            </span>
          </div>
        </div>
      )}

      {/* Live Connection Telemetry Pill */}
      {hasActiveTracks && peerLatencyMs != null && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            background: 'rgba(4, 7, 14, 0.85)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: 10,
            fontFamily: 'monospace',
            color: peerLatencyMs < 100 ? '#34D399' : peerLatencyMs < 250 ? '#FBBF24' : '#F87171',
            fontWeight: 700,
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: peerLatencyMs < 100 ? '#34D399' : '#FBBF24' }} />
          <span>{peerLatencyMs}ms RTT</span>
        </div>
      )}

      {/* Audio Autoplay Blocked Warning & 1-Tap Unmute Banner */}
      {isAudioBlocked && hasActiveTracks && (
        <div
          data-testid="audio-unmute-banner"
          onClick={e => {
            e.stopPropagation()
            void handleUserUnmute()
          }}
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(212, 160, 23, 0.95)',
            color: '#04070E',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            cursor: 'pointer',
            zIndex: 10,
            animation: 'pulse 2s infinite',
          }}
        >
          <GaaIcon name="volume-x" size={14} tone="slate" />
          <span>AUDIO MUTED BY BROWSER · TAP TO UNMUTE</span>
        </div>
      )}

      {/* Stalled Video 1-Tap Resume Overlay */}
      {!isPlaying && hasActiveTracks && stream && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            void attemptPlay()
          }}
          data-testid="resume-video-button"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(4,7,14,0.4)',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            color: '#FFF',
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(212,160,23,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            <GaaIcon name="play" size={20} tone="slate" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--gold-lt)' }}>
            TAP TO RESUME LIVE VIDEO
          </span>
        </button>
      )}
    </div>
  )
}

