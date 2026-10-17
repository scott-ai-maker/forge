'use client'

import React, { useState, useEffect, useRef } from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import {
  SanctuaryAudioNote,
  playSanctuaryAcousticIntroChime,
  markAudioNoteListened,
} from '@/lib/sanctuary-audio-notes-engine'
import { configureAudioSession } from '@/lib/web-audio-cadence-engine'

export interface SanctuaryAudioNotePlayerProps {
  note: SanctuaryAudioNote
  onClose?: () => void
  onMarkDone?: () => void
  compact?: boolean
  autoPlayOnMount?: boolean
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
}

export default function SanctuaryAudioNotePlayer({
  note,
  onClose,
  onMarkDone,
  compact = false,
  autoPlayOnMount = false,
  triggerHaptic,
}: SanctuaryAudioNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showTranscript, setShowTranscript] = useState(!compact)
  const [isSynthesizing, setIsSynthesizing] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const totalDuration = note.durationSeconds || 30

  // Category Theme Badges
  const categoryConfig: Record<
    string,
    { label: string; color: string; bg: string; border: string; icon: string }
  > = {
    movement_cue: {
      label: 'Biomechanical Cue',
      color: 'var(--gold, #D4AF37)',
      bg: 'rgba(212, 175, 55, 0.12)',
      border: 'rgba(212, 175, 55, 0.35)',
      icon: 'barbell',
    },
    cns_recovery: {
      label: 'CNS Vagal Down-Reg',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.35)',
      icon: 'activity',
    },
    mental_focus: {
      label: 'Sanctuary Focus',
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.35)',
      icon: 'target',
    },
    workout_briefing: {
      label: 'Coach Session Briefing',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      icon: 'sparkles',
    },
    personal_feedback: {
      label: 'Personal Voice Memo',
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      icon: 'headphones',
    },
  }

  const category = categoryConfig[note.category] || categoryConfig.movement_cue

  // Stop playback cleanly
  const stopAllAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel()
      } catch {}
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setIsPlaying(false)
    setIsSynthesizing(false)
    setCurrentTime(0)
    configureAudioSession('ambient')
  }

  // Play audio note
  const startPlayback = () => {
    triggerHaptic?.('tap')
    stopAllAudio()

    // 1. Duck background music
    configureAudioSession('ambient')

    // 2. Play acoustic intro chime
    playSanctuaryAcousticIntroChime()

    setIsPlaying(true)
    markAudioNoteListened(note.id)

    // Check if recorded audio data URL exists
    if (note.audioDataUrl && typeof window !== 'undefined') {
      if (!audioRef.current) {
        audioRef.current = new Audio(note.audioDataUrl)
      } else {
        audioRef.current.src = note.audioDataUrl
      }

      audioRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentTime(totalDuration)
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
        triggerHaptic?.('success')
        onMarkDone?.()
      }

      audioRef.current.onerror = () => {
        // Fallback to speech synthesis if audio failed
        playViaSpeechSynthesis()
      }

      void audioRef.current.play().catch(() => {
        playViaSpeechSynthesis()
      })

      // Scrubber interval
      progressTimerRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(Math.min(totalDuration, Math.round(audioRef.current.currentTime)))
        }
      }, 500)
    } else {
      // Natural speech synthesis fallback for text notes
      playViaSpeechSynthesis()
    }
  }

  const playViaSpeechSynthesis = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      // Mock progress simulation for environments without speech
      simulateMockProgress()
      return
    }

    setIsSynthesizing(true)
    const utterance = new SpeechSynthesisUtterance(note.transcript)
    speechUtteranceRef.current = utterance

    // Coach Scott Gordon Voice Tuning: Authoritative, steady, measured
    utterance.rate = 0.96
    utterance.pitch = 0.94
    utterance.volume = 1.0

    // Try to pick natural English voice
    const voices = window.speechSynthesis.getVoices?.() || []
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Daniel') || v.name.includes('Male')))
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    let progress = 0
    progressTimerRef.current = setInterval(() => {
      progress += 1
      setCurrentTime(prev => {
        if (prev >= totalDuration) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current)
          return totalDuration
        }
        return prev + 1
      })
    }, 1000)

    utterance.onend = () => {
      setIsPlaying(false)
      setIsSynthesizing(false)
      setCurrentTime(totalDuration)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      triggerHaptic?.('success')
      onMarkDone?.()
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsSynthesizing(false)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }

    window.speechSynthesis.speak(utterance)
  }

  const simulateMockProgress = () => {
    progressTimerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= totalDuration) {
          setIsPlaying(false)
          if (progressTimerRef.current) clearInterval(progressTimerRef.current)
          onMarkDone?.()
          return totalDuration
        }
        return prev + 1
      })
    }, 1000)
  }

  const togglePlayback = () => {
    if (isPlaying) {
      stopAllAudio()
    } else {
      startPlayback()
    }
  }

  const handleSeek = (newSeconds: number) => {
    setCurrentTime(newSeconds)
    if (audioRef.current) {
      audioRef.current.currentTime = newSeconds
    }
  }

  useEffect(() => {
    if (autoPlayOnMount) {
      const timer = setTimeout(() => {
        startPlayback()
      }, 350)
      return () => clearTimeout(timer)
    }
    return () => {
      stopAllAudio()
    }
  }, [note.id])

  const progressPercent = Math.min(100, Math.round((currentTime / totalDuration) * 100))

  return (
    <div
      role="region"
      aria-label={`Coach Sanctuary Audio Note: ${note.title}`}
      className="sanctuary-audio-note-card"
      style={{
        background: compact
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(8, 14, 24, 0.99) 100%)'
          : 'linear-gradient(180deg, #0F172A 0%, #080E18 100%)',
        border: compact
          ? '1px solid rgba(212, 175, 55, 0.5)'
          : '1.5px solid rgba(212, 175, 55, 0.65)',
        borderRadius: compact ? 10 : 14,
        padding: compact ? '10px 12px' : '16px 18px',
        boxShadow: compact
          ? '0 6px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 175, 55, 0.2)'
          : '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 24px rgba(212, 175, 55, 0.25)',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Header: Coach Credentials & Category Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: compact ? 8 : 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* Coach Avatar Badge */}
          <div
            style={{
              width: compact ? 28 : 34,
              height: compact ? 28 : 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4AF37 0%, #996515 100%)',
              color: '#0A0E18',
              fontWeight: 800,
              fontSize: compact ? 11 : 13,
              fontFamily: 'var(--font-heading)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(212, 175, 55, 0.35)',
              border: '1.5px solid #FDE68A',
            }}
          >
            {note.coachInitials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: compact ? 12 : 13,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span>{note.coachName}</span>
              <span
                style={{
                  fontSize: 9,
                  color: '#34D399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}
              >
                VERIFIED COACH
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#94A3B8',
                fontFamily: 'var(--font-telemetry)',
                letterSpacing: '0.04em',
              }}
            >
              In-Ear Audio Memo · Rest Delivery
            </div>
          </div>
        </div>

        {/* Category Pill & Dismiss */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: category.color,
              background: category.bg,
              border: `1px solid ${category.border}`,
              padding: '2px 7px',
              borderRadius: 4,
              fontFamily: 'var(--font-telemetry)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>{category.label}</span>
          </span>

          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopAllAudio()
                onClose()
              }}
              aria-label="Close Coach Note"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4,
              }}
            >
              <ForgeIcon name="close" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Note Title & Target Movement */}
      <div style={{ marginBottom: compact ? 8 : 12 }}>
        <h4
          style={{
            margin: 0,
            fontSize: compact ? 13 : 15,
            fontWeight: 700,
            color: '#F8FAFC',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{note.title}</span>
          {note.exerciseScope && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--gold-lt, #F3E5AB)',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              🎯 {note.exerciseScope}
            </span>
          )}
        </h4>
      </div>

      {/* ── ACOUSTIC WAVEFORM & CONTROLS ── */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 8,
          padding: compact ? '8px 10px' : '10px 14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: compact ? 6 : 10,
        }}
      >
        {/* Dynamic Waveform Visualizer */}
        <div
          data-testid="audio-waveform-bars"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2.5,
            height: compact ? 30 : 42,
            marginBottom: 8,
            cursor: 'pointer',
          }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickX = e.clientX - rect.left
            const pct = Math.max(0, Math.min(1, clickX / rect.width))
            handleSeek(Math.round(pct * totalDuration))
          }}
          title="Click to scrub audio"
        >
          {note.waveformPoints.map((point, idx) => {
            const barPct = (idx / note.waveformPoints.length) * 100
            const isPassed = barPct <= progressPercent
            const isCurrent = Math.abs(barPct - progressPercent) < 4
            const barHeight = Math.max(
              6,
              Math.round(point * (compact ? 28 : 38) * (isPlaying && isCurrent ? 1.25 : 1))
            )

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: barHeight,
                  borderRadius: 2,
                  background: isPassed
                    ? isPlaying
                      ? 'linear-gradient(180deg, #FDE68A 0%, #D4AF37 100%)'
                      : '#D4AF37'
                    : 'rgba(255, 255, 255, 0.16)',
                  boxShadow:
                    isPlaying && isPassed
                      ? '0 0 6px rgba(212, 175, 55, 0.5)'
                      : 'none',
                  transition: 'height 0.15s ease, background 0.2s ease',
                }}
              />
            )
          })}
        </div>

        {/* Scrub Slider & Time Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            fontFamily: 'var(--font-telemetry)',
            color: '#94A3B8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                color: isPlaying ? 'var(--gold-lt)' : '#FFFFFF',
                fontWeight: 700,
              }}
            >
              {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, '0')}
            </span>
            <span>/</span>
            <span>
              {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
            </span>
            {isSynthesizing && (
              <span style={{ color: '#38BDF8', fontSize: 9.5, fontWeight: 700 }}>
                ● Acoustic Stream
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
            <ForgeIcon name="headphones" size={11} style={{ color: '#D4AF37' }} />
            <span>AirPods / Audio Ducking Active</span>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR: PLAY/PAUSE, REPLAY, TRANSCRIPT TOGGLE ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Primary Play/Pause Button */}
          <button
            type="button"
            data-testid="play-sanctuary-note-btn"
            onClick={togglePlayback}
            className="tactile-btn"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: isPlaying ? '1px solid #EF4444' : '1px solid #D4AF37',
              color: isPlaying ? '#FFFFFF' : '#0A0E18',
              padding: compact ? '6px 14px' : '8px 18px',
              borderRadius: 6,
              fontSize: compact ? 11 : 12,
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: isPlaying
                ? '0 2px 10px rgba(239, 68, 68, 0.4)'
                : '0 2px 10px rgba(212, 175, 55, 0.35)',
            }}
          >
            <ForgeIcon name={isPlaying ? 'pause' : 'play'} size={12} />
            <span>{isPlaying ? 'Pause' : currentTime > 0 && currentTime < totalDuration ? 'Resume' : 'Play In Ear'}</span>
          </button>

          {/* Replay Button */}
          {currentTime > 0 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.('tap')
                handleSeek(0)
                if (!isPlaying) startPlayback()
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#CBD5E1',
                padding: compact ? '6px 10px' : '8px 12px',
                borderRadius: 6,
                fontSize: compact ? 10.5 : 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Restart from beginning"
            >
              <ForgeIcon name="rotate-ccw" size={11} />
              <span>Replay</span>
            </button>
          )}

          {/* Transcript Toggle */}
          <button
            type="button"
            onClick={() => setShowTranscript(prev => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showTranscript ? 'var(--gold-lt)' : '#94A3B8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 6px',
            }}
          >
            <span>{showTranscript ? 'Hide Notes' : 'Read Transcript'}</span>
          </button>
        </div>

        {/* Mark Done / Dismissed Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {note.isListened && (
            <span
              style={{
                fontSize: 10,
                color: '#34D399',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontFamily: 'var(--font-telemetry)',
              }}
            >
              <ForgeIcon name="check" size={11} />
              <span>Listened</span>
            </span>
          )}
        </div>
      </div>

      {/* ── READABLE TRANSCRIPT DRAWER ── */}
      {showTranscript && (
        <div
          data-testid="audio-note-transcript-drawer"
          style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            fontSize: compact ? 12 : 13,
            lineHeight: 1.5,
            color: '#E2E8F0',
            fontStyle: 'italic',
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              textTransform: 'uppercase',
              color: 'var(--gold, #D4AF37)',
              fontWeight: 700,
              fontFamily: 'var(--font-telemetry)',
              marginBottom: 4,
              fontStyle: 'normal',
              letterSpacing: '0.06em',
            }}
          >
            Coach Memo Transcript
          </div>
          &ldquo;{note.transcript}&rdquo;
        </div>
      )}
    </div>
  )
}
