'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import {
  BANDWIDTH_PROFILES,
  captureLowBandwidthSnapshot,
  formatSnapshotAge,
  type BandwidthMode,
  type NetworkQualityGrade,
  type ResolvedBandwidthTier,
} from '@/lib/live-bandwidth-profiles'

export interface LiveRemoteVideoFeedProps {
  stream: MediaStream | null
  participantName?: string
  participantRole?: 'Coach' | 'Athlete'
  isConnected?: boolean
  isPeerInLobby?: boolean
  lobbyWaitSeconds?: number
  peerLatencyMs?: number | null
  effectiveTier?: ResolvedBandwidthTier
  networkQuality?: NetworkQualityGrade
  snapshotFrameUrl?: string | null
  snapshotTimestamp?: number | null
  activeExerciseName?: string
  activeTempo?: string
  activeCoachCue?: string | null
  restRemaining?: number | null
  onRequestSnapshot?: () => void
  onSwitchBandwidthMode?: (mode: BandwidthMode) => void
  style?: React.CSSProperties
  onVideoRef?: (el: HTMLVideoElement | null) => void
  mirrored?: boolean
  className?: string
}

/**
 * Enterprise Remote WebRTC Video & Low-Bandwidth Audio-First Player for Forge Athletic Live Studio.
 * Guaranteed live playback across iOS Safari, WKWebView, Chrome, and Desktop:
 * - Eliminates black screens when bandwidth drops by tracking true unmuted decoded video frames
 *   separately from Opus voice tracks and holding a Last-Good-Frame / Periodic Form Snapshot buffer.
 * - Seamlessly transitions into Audio-First + Form Snapshot Coaching Mode (~36 kbps) on constrained cellular.
 * - Automatically recovers from iOS unmuted autoplay policies by falling back to muted play + tap-to-unmute.
 */
export default function LiveRemoteVideoFeed({
  stream,
  participantName = 'Athlete',
  participantRole = 'Athlete',
  isConnected = false,
  isPeerInLobby = false,
  lobbyWaitSeconds,
  peerLatencyMs,
  effectiveTier = 'hd',
  networkQuality = 'excellent',
  snapshotFrameUrl = null,
  snapshotTimestamp = null,
  activeExerciseName,
  activeTempo,
  activeCoachCue,
  restRemaining,
  onRequestSnapshot,
  onSwitchBandwidthMode,
  style,
  onVideoRef,
  mirrored = false,
  className,
}: LiveRemoteVideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioBlocked, setIsAudioBlocked] = useState(false)
  const [hasActiveTracks, setHasActiveTracks] = useState(false)
  const [hasLiveVideoTrack, setHasLiveVideoTrack] = useState(false)
  const [hasLiveAudioTrack, setHasLiveAudioTrack] = useState(false)
  const [hasDecodedFrame, setHasDecodedFrame] = useState(false)
  const [lastGoodFrame, setLastGoodFrame] = useState<{ url: string; capturedAt: number } | null>(null)
  const [ageTick, setAgeTick] = useState(0)

  // Safe playback function that gracefully degrades to muted playback if iOS/WebKit blocks unmuted audio
  const attemptPlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || !stream) return

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }

    try {
      await video.play()
      setIsPlaying(true)
      setIsAudioBlocked(false)
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setHasDecodedFrame(true)
      }
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name || ''
      if (errorName === 'NotAllowedError' || errorName === 'AbortError') {
        try {
          video.muted = true
          await video.play()
          setIsPlaying(true)
          setIsAudioBlocked(true)
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setHasDecodedFrame(true)
          }
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
      video.muted = true
    }
  }, [])

  // Bind stream and inspect audio vs video track readiness/mute state
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) {
      setHasActiveTracks(false)
      setHasLiveVideoTrack(false)
      setHasLiveAudioTrack(false)
      setHasDecodedFrame(false)
      setIsPlaying(false)
      return
    }

    const checkTracks = () => {
      const tracks = stream.getTracks()
      const anyLive = tracks.some(t => t.readyState === 'live')
      const liveVideo = tracks.some(
        t => t.kind === 'video' && t.readyState === 'live' && t.enabled !== false && !t.muted
      )
      const liveAudio = tracks.some(
        t => t.kind === 'audio' && t.readyState === 'live' && t.enabled !== false
      )

      setHasActiveTracks(anyLive)
      setHasLiveVideoTrack(liveVideo)
      setHasLiveAudioTrack(liveAudio)

      if (!liveVideo) {
        setHasDecodedFrame(false)
      } else if (video.videoWidth > 0 && video.videoHeight > 0) {
        setHasDecodedFrame(true)
      }

      if (anyLive) {
        void attemptPlay()
      }
    }

    checkTracks()

    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    void attemptPlay()

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

  // Periodic liveness check + Last-Good-Frame freeze buffer so bandwidth dips never flash black
  useEffect(() => {
    if (!isConnected && !stream && !snapshotFrameUrl) return
    const interval = setInterval(() => {
      setAgeTick(t => t + 1)
      const video = videoRef.current
      if (video && stream && video.paused && hasActiveTracks) {
        void attemptPlay()
      }
      if (video && hasLiveVideoTrack && video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
        setHasDecodedFrame(true)
        const snap = captureLowBandwidthSnapshot(video, 360, 0.5)
        if (snap) {
          setLastGoodFrame({ url: snap, capturedAt: Date.now() })
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isConnected, stream, snapshotFrameUrl, hasActiveTracks, hasLiveVideoTrack, attemptPlay])

  const isAudioFirstTier = effectiveTier === 'audio_first'
  const showLiveVideo = Boolean(
    stream && !isAudioFirstTier && hasLiveVideoTrack && hasDecodedFrame
  )

  // Pick freshest available fallback keyframe (incoming low-bandwidth snapshot vs cached last video frame)
  const activeFallbackSnapshot = (() => {
    if (snapshotFrameUrl && lastGoodFrame) {
      return (snapshotTimestamp || 0) >= lastGoodFrame.capturedAt
        ? { url: snapshotFrameUrl, capturedAt: snapshotTimestamp || Date.now() }
        : lastGoodFrame
    }
    if (snapshotFrameUrl) {
      return { url: snapshotFrameUrl, capturedAt: snapshotTimestamp || Date.now() }
    }
    return lastGoodFrame
  })()

  const isLowBandwidthSession =
    isAudioFirstTier ||
    effectiveTier === 'low_data' ||
    networkQuality === 'constrained' ||
    networkQuality === 'critical' ||
    Boolean(!showLiveVideo && (hasLiveAudioTrack || activeFallbackSnapshot || (isConnected && hasActiveTracks)))

  const tierSpec = BANDWIDTH_PROFILES[effectiveTier]

  const initials =
    participantName
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('') || (participantRole === 'Coach' ? 'CG' : 'AT')

  // Reference ageTick so relative snapshot timestamp refreshes smoothly
  void ageTick

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
      {/* Keep <video> mounted whenever stream exists so Opus audio plays & WebRTC video decoder stays warm,
          while hiding unrendered/muted black frames behind opacity: 0 */}
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
          onLoadedData={e => {
            const v = e.currentTarget
            if (v.videoWidth > 0 && v.videoHeight > 0) {
              setHasDecodedFrame(true)
            }
          }}
          onResize={e => {
            const v = e.currentTarget
            if (v.videoWidth > 0 && v.videoHeight > 0) {
              setHasDecodedFrame(true)
            }
          }}
          onPlaying={e => {
            setIsPlaying(true)
            const v = e.currentTarget
            if (v.videoWidth > 0 && v.videoHeight > 0) {
              setHasDecodedFrame(true)
            }
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsPlaying(false)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: mirrored ? 'scaleX(-1)' : 'none',
            opacity: showLiveVideo ? 1 : 0,
            pointerEvents: showLiveVideo ? 'auto' : 'none',
            transition: 'opacity 0.25s ease',
          }}
        />
      ) : null}

      {/* Periodic Form Keyframe / Last-Good-Frame Backdrop (Zero Black Screen on Low Bandwidth!) */}
      {!showLiveVideo && activeFallbackSnapshot && (
        <div
          data-testid="low-bandwidth-snapshot-stage"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeFallbackSnapshot.url}
            alt={`${participantName} live form check snapshot`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: mirrored ? 'scaleX(-1)' : 'none',
              filter: 'brightness(0.92) contrast(1.03)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(4,7,14,0.35) 0%, rgba(4,7,14,0.08) 45%, rgba(4,7,14,0.78) 100%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 54,
              right: 10,
              background: 'rgba(6, 10, 18, 0.88)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(212, 160, 23, 0.45)',
              borderRadius: 16,
              padding: '3px 10px',
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--gold-lt)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            <span>Form Snapshot · {formatSnapshotAge(activeFallbackSnapshot.capturedAt)}</span>
            {onRequestSnapshot && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onRequestSnapshot()
                }}
                style={{
                  marginLeft: 4,
                  background: 'rgba(212, 160, 23, 0.2)',
                  border: '1px solid rgba(212, 160, 23, 0.5)',
                  borderRadius: 10,
                  color: '#FFF',
                  fontSize: 9.5,
                  fontWeight: 800,
                  padding: '1px 6px',
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            )}
          </div>
        </div>
      )}

      {/* Low-Bandwidth / Audio-First Coaching Stage (when video is throttled/starved so client & coach keep training) */}
      {!showLiveVideo && isLowBandwidthSession && (
        <div
          data-testid="low-bandwidth-stage-overlay"
          style={{
            position: activeFallbackSnapshot ? 'absolute' : 'relative',
            bottom: activeFallbackSnapshot ? 10 : undefined,
            left: activeFallbackSnapshot ? 10 : undefined,
            right: activeFallbackSnapshot ? 10 : undefined,
            zIndex: 3,
            maxWidth: activeFallbackSnapshot ? undefined : 380,
            margin: activeFallbackSnapshot ? 0 : '0 16px',
            padding: activeFallbackSnapshot ? '8px 12px' : '18px 20px',
            borderRadius: 12,
            background: activeFallbackSnapshot
              ? 'rgba(6, 10, 18, 0.9)'
              : 'linear-gradient(145deg, rgba(10, 17, 30, 0.96) 0%, rgba(6, 10, 18, 0.98) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.65)',
            display: 'flex',
            flexDirection: activeFallbackSnapshot ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: activeFallbackSnapshot ? 10 : 12,
            textAlign: activeFallbackSnapshot ? 'left' : 'center',
            flexWrap: 'wrap',
          }}
        >
          {!activeFallbackSnapshot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
                  border: '2px solid #34D399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 18,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  boxShadow: '0 0 18px rgba(16, 185, 129, 0.45)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: '#FFF' }}>
                  {participantName}
                </div>
                <div style={{ fontSize: 11, color: '#34D399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
                  <span>
                    {hasLiveAudioTrack
                      ? `Live Voice Active · ${tierSpec.shortLabel} (${tierSpec.estimatedKbps})`
                      : `Low-Bandwidth Coaching · ${tierSpec.shortLabel}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeFallbackSnapshot && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 700 }}>
                <strong style={{ color: '#34D399' }}>Voice Priority Active</strong> · {tierSpec.shortLabel} ({tierSpec.estimatedKbps})
              </div>
            </div>
          )}

          {/* Synchronized Exercise / Tempo / Rest Telemetry so client trains smoothly without HD video */}
          {(activeExerciseName || restRemaining != null || activeCoachCue) && (
            <div
              style={{
                width: activeFallbackSnapshot ? 'auto' : '100%',
                background: 'rgba(212, 160, 23, 0.09)',
                border: '1px solid rgba(212, 160, 23, 0.3)',
                borderRadius: 8,
                padding: activeFallbackSnapshot ? '4px 10px' : '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              {activeExerciseName && (
                <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--gold-lt)' }}>
                  {activeExerciseName} {activeTempo ? `· Tempo ${activeTempo}` : ''}
                </div>
              )}
              {restRemaining != null && restRemaining > 0 && (
                <div style={{ fontSize: 11, fontWeight: 800, color: '#34D399', fontFamily: 'monospace' }}>
                  ⏱ Rest Interval: {restRemaining}s remaining
                </div>
              )}
              {activeCoachCue && (
                <div style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 600 }}>
                  &ldquo;{activeCoachCue}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {onRequestSnapshot && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onRequestSnapshot()
                }}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(212, 160, 23, 0.18)',
                  border: '1px solid rgba(212, 160, 23, 0.5)',
                  borderRadius: 6,
                  color: 'var(--gold-lt)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Snap Form Check
              </button>
            )}
            {onSwitchBandwidthMode && !isAudioFirstTier && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onSwitchBandwidthMode('audio_first')
                }}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  borderRadius: 6,
                  color: '#34D399',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Lock Audio-First
              </button>
            )}
            {onSwitchBandwidthMode && isAudioFirstTier && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onSwitchBandwidthMode('auto')
                }}
                style={{
                  padding: '5px 10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#E2E8F0',
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Resume Auto Video
              </button>
            )}
          </div>
        </div>
      )}

      {/* Standby / Connecting / Lobby Avatar when peer has not started streaming yet */}
      {!showLiveVideo && !isLowBandwidthSession && (
        <div style={{ textAlign: 'center', padding: 20, zIndex: 2 }}>
          <div
            style={{
              position: 'relative',
              width: 76,
              height: 76,
              margin: '0 auto 14px',
            }}
          >
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
                ? 'Signal Connected · Synchronizing Stream'
                : 'Standby · Awaiting Remote Stream'}
            </span>
          </div>
        </div>
      )}

      {/* Live Connection Telemetry Pill */}
      {(hasActiveTracks || isLowBandwidthSession) && peerLatencyMs != null && (
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
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: peerLatencyMs < 100 ? '#34D399' : peerLatencyMs < 250 ? '#FBBF24' : '#F87171',
            }}
          />
          <span>
            {peerLatencyMs}ms · {tierSpec.shortLabel}
          </span>
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
          <ForgeIcon name="volume-x" size={14} tone="slate" />
          <span>AUDIO MUTED BY BROWSER · TAP TO UNMUTE</span>
        </div>
      )}

      {/* Stalled Video 1-Tap Resume Overlay */}
      {!isPlaying && showLiveVideo && stream && (
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
            <ForgeIcon name="play" size={20} tone="slate" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--gold-lt)' }}>
            TAP TO RESUME LIVE VIDEO
          </span>
        </button>
      )}
    </div>
  )
}
