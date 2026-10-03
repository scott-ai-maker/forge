'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import AudioMessagePlayer from '@/components/messages/AudioMessagePlayer'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'

interface VoiceNoteRecorderProps {
  onSend: (audioDataUrl: string, durationSeconds: number) => void
  onCancel: () => void
}

/**
 * Detects native supported audio container across iOS Safari, Chrome, Firefox, and Android.
 */
function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return ''

  const candidates = [
    'audio/mp4', // Native iOS Safari & Chrome on iPhone
    'audio/aac',
    'audio/webm;codecs=opus', // Modern Chrome, Android, Edge, Firefox
    'audio/webm',
    'audio/ogg;codecs=opus',
  ]

  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime
      }
    } catch {}
  }

  return ''
}

export default function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'error'>('idle')
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const createdBlobUrlRef = useRef<string | null>(null)

  const stopCanvasWaveform = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        void audioCtxRef.current.close()
      } catch {}
      audioCtxRef.current = null
    }
  }, [])

  const startCanvasWaveform = useCallback((stream: MediaStream) => {
    try {
      const AudioClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioClass) return

      const ctx = new AudioClass()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      const canvas = canvasRef.current
      if (!canvas) return
      const canvasCtx = canvas.getContext('2d')
      if (!canvasCtx) return

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw)
        analyser.getByteFrequencyData(dataArray)

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
        const barWidth = (canvas.width / bufferLength) * 1.5
        let x = 0

        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#E5D0A1')
        gradient.addColorStop(1, '#C5A059')

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height
          canvasCtx.fillStyle = gradient
          canvasCtx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, Math.max(3, barHeight))
          x += barWidth + 1
        }
      }
      draw()
    } catch {}
  }, [])

  const revokeBlobUrl = useCallback(() => {
    if (createdBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(createdBlobUrlRef.current)
      } catch {}
      createdBlobUrlRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setErrorMsg(null)
      chunksRef.current = []
      setRecordedAudioUrl(null)
      setPreviewBlobUrl(null)
      revokeBlobUrl()
      setRecordingSeconds(0)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone is not supported in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      const chosenMime = getSupportedAudioMimeType()
      let recorder: MediaRecorder

      try {
        recorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream)
      } catch {
        recorder = new MediaRecorder(stream)
      }
      recorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        // Stop stream tracks so iOS returns to speaker playback mode
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => {
            t.stop()
            t.enabled = false
          })
          streamRef.current = null
        }
        stopCanvasWaveform()

        if (chunksRef.current.length === 0) {
          console.warn('VoiceNoteRecorder: chunksRef is empty')
          setErrorMsg('No audio data was captured. Please try recording again.')
          setStatus('error')
          return
        }

        const mimeType = recorder.mimeType || chosenMime || 'audio/mp4'
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })

        if (audioBlob.size === 0) {
          console.warn('VoiceNoteRecorder: audioBlob.size is 0')
          setErrorMsg('Recorded audio was empty. Please check microphone permissions.')
          setStatus('error')
          return
        }

        // Create direct blob URL for instant local preview
        const blobUrl = URL.createObjectURL(audioBlob)
        createdBlobUrlRef.current = blobUrl
        setPreviewBlobUrl(blobUrl)

        const reader = new FileReader()
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string)
          setStatus('recorded')
        }
        reader.readAsDataURL(audioBlob)
      }

      // Unfragmented continuous recording to guarantee standard moov headers on iOS
      recorder.start()
      setStatus('recording')
      startCanvasWaveform(stream)

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          if (s >= 59) {
            stopRecording()
            return 60
          }
          return s + 1
        })
      }, 1000)
    } catch (err) {
      console.warn('VoiceNoteRecorder start error:', err)
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Microphone permission denied or unavailable.'
      )
      setStatus('error')
      stopCanvasWaveform()
    }
  }, [revokeBlobUrl, startCanvasWaveform, stopCanvasWaveform])

  const stopRecording = () => {
    triggerHaptic('tap')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (recorderRef.current && recorderRef.current.state === 'recording') {
      try {
        recorderRef.current.requestData()
      } catch {}
      recorderRef.current.stop()
    }
  }

  // Auto-start on mount
  useEffect(() => {
    void startRecording()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopCanvasWaveform()
      revokeBlobUrl()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          t.stop()
          t.enabled = false
        })
        streamRef.current = null
      }
    }
  }, [startRecording, stopCanvasWaveform, revokeBlobUrl])

  const handleSend = () => {
    triggerHaptic('success')
    if (recordedAudioUrl) {
      onSend(recordedAudioUrl, Math.max(1, recordingSeconds))
    }
  }

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(16, 26, 40, 0.98) 0%, rgba(10, 18, 28, 0.98) 100%)',
        border: '1px solid rgba(197, 160, 89, 0.45)',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      {/* Recording State */}
      {status === 'recording' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#EF4444',
                  opacity: 0.75,
                  animation: 'radarPing 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#EF4444',
                  boxShadow: '0 0 10px #EF4444',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: '#EF4444' }}>
                Recording Voice Note
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, color: '#F8FAFC', fontVariantNumeric: 'tabular-nums' }}>
                {formatSecs(recordingSeconds)} <span style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 400 }}>/ 1:00</span>
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(8, 14, 20, 0.6)', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
            <canvas ref={canvasRef} width={130} height={30} style={{ display: 'block', borderRadius: 4 }} />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={stopRecording}
              className="tactile-btn"
              style={{
                background: 'linear-gradient(135deg, #C5A059 0%, #AA820A 100%)',
                color: '#080E14',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(197, 160, 89, 0.35)',
              }}
            >
              <GaaIcon name="stop" size={13} tone="inherit" />
              <span>Done Recording</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap')
                onCancel()
              }}
              style={{
                background: 'transparent',
                color: 'var(--gray)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Recorded & Ready to Preview / Send State */}
      {status === 'recorded' && (previewBlobUrl || recordedAudioUrl) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 300px', maxWidth: '100%' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 6 }}>
              Preview Voice Memo Before Sending:
            </div>
            <AudioMessagePlayer
              audioSrc={previewBlobUrl || recordedAudioUrl || ''}
              durationSeconds={recordingSeconds}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap')
                void startRecording()
              }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(197,160,89,0.35)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="rotate-ccw" size={13} tone="inherit" /> Re-record
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap')
                onCancel()
              }}
              style={{
                background: 'transparent',
                color: 'var(--gray)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="tactile-btn"
              style={{
                background: 'linear-gradient(135deg, #C5A059 0%, #AA820A 100%)',
                color: '#080E14',
                border: 'none',
                borderRadius: 8,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(197, 160, 89, 0.4)',
              }}
            >
              <span>Send Voice Note</span>
              <GaaIcon name="rocket" size={14} tone="inherit" />
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ color: '#F87171', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={15} tone="ruby" />
            <span>{errorMsg || 'Could not access microphone.'}</span>
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap')
                void startRecording()
              }}
              style={{
                background: 'var(--gold)',
                color: '#080E14',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="rotate-ccw" size={12} tone="inherit" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'transparent',
                color: 'var(--gray)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes radarPing {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
