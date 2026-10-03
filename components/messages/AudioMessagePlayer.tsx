'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { dataUrlToBlob, resolvePlayableAudioUrl } from '@/lib/audio-blob-utils'
import { getSharedAudioContext } from '@/lib/web-audio-cadence-engine'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import GaaIcon from '@/components/ui/GaaIcon'

interface AudioMessagePlayerProps {
  audioSrc: string
  durationSeconds?: number
  isSender?: boolean
}

/**
 * Universal safe AudioBuffer decoder supporting both callback & Promise
 * styles on iOS WebKit without detached buffer exceptions.
 */
function decodeAudioBufferSafely(ctx: AudioContext, arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const copy = arrayBuffer.slice(0)
      const res = ctx.decodeAudioData(
        copy,
        decoded => resolve(decoded),
        err => reject(err)
      )
      if (res && typeof res.then === 'function') {
        res.then(resolve).catch(reject)
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Generates an initial deterministic realistic waveform pattern (32 bars)
 * based on audioSrc and duration to avoid layout shift before audio decoding.
 */
function getDeterministicWaveform(src: string, count = 32): number[] {
  let hash = 42
  for (let i = 0; i < src.length; i++) {
    hash = (hash << 5) - hash + src.charCodeAt(i)
    hash |= 0
  }
  const bars: number[] = []
  for (let i = 0; i < count; i++) {
    const pseudo = Math.abs(Math.sin((hash + i * 19) * 0.3))
    // Height between 22% and 95%
    bars.push(Math.round((0.22 + pseudo * 0.73) * 100) / 100)
  }
  return bars
}

/**
 * Extracts normalized peak amplitude bars (32 bars) from decoded PCM buffer.
 */
function extractWaveformFromBuffer(buffer: AudioBuffer, count = 32): number[] {
  const channelData = buffer.getChannelData(0)
  const blockSize = Math.floor(channelData.length / count)
  if (blockSize <= 0) return getDeterministicWaveform('', count)

  const bars: number[] = []
  let maxVal = 0.05
  const rawAverages: number[] = []

  for (let i = 0; i < count; i++) {
    const start = i * blockSize
    let sum = 0
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(channelData[start + j] || 0)
    }
    const avg = sum / blockSize
    rawAverages.push(avg)
    if (avg > maxVal) maxVal = avg
  }

  for (const avg of rawAverages) {
    const normalized = Math.min(1, Math.max(0.2, (avg / maxVal) * 0.95))
    bars.push(Math.round(normalized * 100) / 100)
  }

  return bars
}

export default function AudioMessagePlayer({
  audioSrc,
  durationSeconds = 0,
  isSender = false,
}: AudioMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState<number>(durationSeconds || 0)
  const [playbackRate, setPlaybackRate] = useState<number>(1)
  const [hasError, setHasError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [customWaveform, setCustomWaveform] = useState<number[] | null>(null)

  // Web Audio state references
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const startOffsetRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null)
  const waveformContainerRef = useRef<HTMLDivElement | null>(null)

  const fallbackBars = useMemo(() => getDeterministicWaveform(audioSrc, 32), [audioSrc])
  const waveformBars = customWaveform || fallbackBars

  const stopWebAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      } catch {}
      sourceNodeRef.current = null
    }

    if (htmlAudioRef.current) {
      try {
        htmlAudioRef.current.pause()
      } catch {}
    }

    setIsPlaying(false)
  }, [])

  // Reset playback state when source changes
  useEffect(() => {
    stopWebAudio()
    audioBufferRef.current = null
    setCustomWaveform(null)
    setCurrentTime(0)
    startOffsetRef.current = 0
    setIsPlaying(false)
    setHasError(false)
  }, [audioSrc, stopWebAudio])

  // Sync initial duration fallback
  useEffect(() => {
    if (durationSeconds > 0 && (!duration || duration === 0 || !Number.isFinite(duration))) {
      setDuration(durationSeconds)
    }
  }, [durationSeconds, duration])

  // 60fps smooth scrub bar animation loop
  useEffect(() => {
    let frameId: number | null = null

    const loop = () => {
      const ctx = getSharedAudioContext()
      if (!ctx || !isPlaying) return

      const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate
      const current = startOffsetRef.current + elapsed

      const totalDur =
        audioBufferRef.current?.duration ||
        (duration && Number.isFinite(duration) ? duration : durationSeconds || 60)

      if (current >= totalDur) {
        stopWebAudio()
        setCurrentTime(0)
        startOffsetRef.current = 0
        return
      }

      setCurrentTime(Math.min(current, totalDur))
      frameId = requestAnimationFrame(loop)
    }

    if (isPlaying) {
      frameId = requestAnimationFrame(loop)
    }

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [duration, durationSeconds, isPlaying, playbackRate, stopWebAudio])

  // Fetches or decodes audio data into an in-memory AudioBuffer
  const getOrDecodeBuffer = async (ctx: AudioContext): Promise<AudioBuffer | null> => {
    if (audioBufferRef.current) {
      return audioBufferRef.current
    }

    let arrayBuffer: ArrayBuffer

    if (audioSrc.startsWith('data:')) {
      const blob = dataUrlToBlob(audioSrc)
      if (!blob || blob.size === 0) throw new Error('Audio payload is empty')
      arrayBuffer = await blob.arrayBuffer()
    } else {
      const res = await fetch(audioSrc)
      arrayBuffer = await res.arrayBuffer()
    }

    const decoded = await decodeAudioBufferSafely(ctx, arrayBuffer)
    audioBufferRef.current = decoded

    if (decoded.duration && Number.isFinite(decoded.duration) && decoded.duration > 0) {
      setDuration(Math.round(decoded.duration))
    }

    try {
      const peaks = extractWaveformFromBuffer(decoded, 32)
      setCustomWaveform(peaks)
    } catch {}

    return decoded
  }

  const togglePlay = async () => {
    triggerHaptic('tap')
    const ctx = getSharedAudioContext()

    // 1. Immediately unlock and resume AudioContext on iOS synchronously inside user touch handler
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch (err) {
        console.warn('AudioContext resume notice:', err)
      }
    }

    if (isPlaying) {
      if (ctx) {
        const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate
        const totalDur =
          audioBufferRef.current?.duration ||
          (duration && Number.isFinite(duration) ? duration : durationSeconds || 60)
        startOffsetRef.current = Math.min(startOffsetRef.current + elapsed, totalDur)
      }
      stopWebAudio()
      return
    }

    // 2. Play via Web Audio CoreAudio PCM buffer (Primary channel for iOS Chrome & Safari)
    if (ctx) {
      setIsLoading(true)
      try {
        const audioBuffer = await getOrDecodeBuffer(ctx)
        setIsLoading(false)

        if (audioBuffer) {
          const source = ctx.createBufferSource()
          source.buffer = audioBuffer
          source.playbackRate.value = playbackRate
          source.connect(ctx.destination)

          const totalDur = audioBuffer.duration
          let offset = startOffsetRef.current
          if (offset >= totalDur - 0.2) {
            offset = 0
            startOffsetRef.current = 0
          }

          source.start(0, offset)
          sourceNodeRef.current = source
          startTimeRef.current = ctx.currentTime
          setIsPlaying(true)
          setHasError(false)

          source.onended = () => {
            if (sourceNodeRef.current === source) {
              stopWebAudio()
              setCurrentTime(0)
              startOffsetRef.current = 0
            }
          }
          return
        }
      } catch (decodeErr) {
        console.warn('Web Audio decode failed, attempting HTML5 fallback:', decodeErr)
        setIsLoading(false)
      }
    }

    // 3. Fallback: HTML5 Audio Element
    if (htmlAudioRef.current) {
      const audio = htmlAudioRef.current
      audio.playbackRate = playbackRate
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
          setHasError(false)
        })
        .catch(err => {
          console.warn('HTML5 play fallback error:', err)
          setHasError(true)
          setIsPlaying(false)
        })
    }
  }

  const effectiveDuration =
    duration && Number.isFinite(duration) && duration > 0
      ? duration
      : durationSeconds && Number.isFinite(durationSeconds) && durationSeconds > 0
      ? durationSeconds
      : 1

  const seekTo = (newTime: number) => {
    const clamped = Math.max(0, Math.min(newTime, effectiveDuration))
    setCurrentTime(clamped)
    startOffsetRef.current = clamped

    if (isPlaying) {
      stopWebAudio()
      setTimeout(() => {
        void togglePlay()
      }, 30)
    }

    if (htmlAudioRef.current) {
      htmlAudioRef.current.currentTime = clamped
    }
  }

  const handleWaveformSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current) return
    const rect = waveformContainerRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seekTo(ratio * effectiveDuration)
  }

  const toggleSpeed = () => {
    triggerHaptic('tap')
    const speeds = [1, 1.25, 1.5, 2]
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length
    const nextSpeed = speeds[nextIdx]
    setPlaybackRate(nextSpeed)

    if (isPlaying && sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = nextSpeed
    }

    if (htmlAudioRef.current) {
      htmlAudioRef.current.playbackRate = nextSpeed
    }
  }

  const formatSecs = (sec: number) => {
    const validSec = Number.isFinite(sec) ? Math.max(0, sec) : 0
    const m = Math.floor(validSec / 60)
    const s = Math.floor(validSec % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (hasError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 16,
          padding: '8px 12px',
          fontSize: 12,
          color: '#FCA5A5',
        }}
      >
        <GaaIcon name="alert-triangle" size={14} tone="ruby" />
        <span>Audio memo unavailable</span>
      </div>
    )
  }

  const fallbackUrl = resolvePlayableAudioUrl(audioSrc).url
  const progressRatio = Math.max(0, Math.min(1, currentTime / effectiveDuration))
  const activeBarCount = Math.round(progressRatio * waveformBars.length)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: isSender
          ? 'rgba(10, 18, 30, 0.65)'
          : 'linear-gradient(135deg, rgba(22, 34, 50, 0.8) 0%, rgba(14, 23, 36, 0.9) 100%)',
        border: isSender ? '1px solid rgba(197, 160, 89, 0.28)' : '1px solid rgba(197, 160, 89, 0.3)',
        borderRadius: 20,
        padding: '8px 14px',
        minWidth: 240,
        maxWidth: 360,
        width: '100%',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
    >
      {/* Hidden fallback HTML5 audio tag */}
      {fallbackUrl ? (
        <audio
          ref={htmlAudioRef}
          src={fallbackUrl}
          preload="none"
          playsInline
          onEnded={() => {
            setIsPlaying(false)
            setCurrentTime(0)
          }}
        />
      ) : null}

      {/* Play / Pause Circular Button */}
      <button
        type="button"
        onClick={() => void togglePlay()}
        aria-label={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #C5A059 0%, #AA820A 100%)',
          color: '#080E14',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: isPlaying
            ? '0 0 14px rgba(197, 160, 89, 0.5)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? (
          <GaaIcon name="hourglass" size={15} tone="inherit" />
        ) : isPlaying ? (
          <GaaIcon name="pause" size={15} tone="inherit" />
        ) : (
          <div style={{ marginLeft: 2 }}>
            <GaaIcon name="play" size={15} tone="inherit" />
          </div>
        )}
      </button>

      {/* Interactive Waveform Bar Visualizer & Time Readout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div
          ref={waveformContainerRef}
          onClick={handleWaveformSeek}
          role="slider"
          aria-label="Seek voice memo"
          aria-valuemin={0}
          aria-valuemax={effectiveDuration}
          aria-valuenow={currentTime}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') seekTo(currentTime + 5)
            if (e.key === 'ArrowLeft') seekTo(currentTime - 5)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            height: 28,
            cursor: 'pointer',
            padding: '2px 0',
          }}
          title="Click to seek"
        >
          {waveformBars.map((heightNorm, idx) => {
            const isPlayed = idx < activeBarCount
            const barHeightPx = Math.max(4, Math.round(heightNorm * 24))
            const barBg = isPlayed ? '#E5D0A1' : 'rgba(148, 163, 184, 0.3)'

            return (
              <span
                key={idx}
                style={{
                  flex: 1,
                  height: `${barHeightPx}px`,
                  background: barBg,
                  borderRadius: 2,
                  transition: 'background 0.1s ease, height 0.2s ease',
                }}
              />
            )
          })}
        </div>

        {/* Timestamps */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10.5,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--gray)',
            fontWeight: 500,
            opacity: 0.9,
          }}
        >
          <span>{formatSecs(currentTime)}</span>
          <span>{formatSecs(effectiveDuration)}</span>
        </div>
      </div>

      {/* Speed Multiplier Pill Button */}
      <button
        type="button"
        onClick={toggleSpeed}
        aria-label={`Playback speed: ${playbackRate}x. Click to cycle.`}
        style={{
          background: 'rgba(197,160,89,0.15)',
          border: '1px solid rgba(197,160,89,0.4)',
          color: 'var(--gold-lt)',
          borderRadius: 12,
          padding: '3px 8px',
          fontSize: 10,
          fontWeight: 800,
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          letterSpacing: '0.02em',
        }}
      >
        {playbackRate}x
      </button>
    </div>
  )
}
