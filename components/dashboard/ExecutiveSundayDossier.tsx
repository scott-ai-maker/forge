'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { DossierMetrics } from '@/lib/sunday-dossier-engine'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import GaaIcon from '@/components/ui/GaaIcon'
import { speakCoachVoiceCue, stopCoachVoiceCue } from '@/lib/coach-voice-synthesizer'

interface ExecutiveSundayDossierProps {
  athleteName: string
  optPhase: string
  dossier: DossierMetrics
  weekEndingDate?: string
  isModal?: boolean
  onClose?: () => void
  voiceNoteUrl?: string | null
}

export function computeDossierDocRefId(athleteName: string, weekEndingDate: string): string {
  const digits = weekEndingDate.replace(/\D/g, '')
  const dateStamp = digits.length >= 4 ? digits.slice(-4) : (digits || '2026')
  const nameCode = athleteName.split(' ').map(n => n[0]).join('').toUpperCase() || 'MEMBER'
  return `FORGE-PROGRESS-${nameCode}-${dateStamp}`
}

export function computeDossierRecoveryState(recoveryIndexScore: number) {
  if (recoveryIndexScore >= 80) {
    return {
      label: 'Ready to train',
      color: '#34D399',
      badgeBg: 'rgba(52, 211, 153, 0.12)',
      badgeBorder: 'rgba(52, 211, 153, 0.35)',
    }
  }
  if (recoveryIndexScore >= 65) {
    return {
      label: 'Steady recovery',
      color: '#FBBF24',
      badgeBg: 'rgba(251, 191, 36, 0.12)',
      badgeBorder: 'rgba(251, 191, 36, 0.35)',
    }
  }
  return {
    label: 'More recovery may help',
    color: '#F87171',
    badgeBg: 'rgba(248, 113, 113, 0.12)',
    badgeBorder: 'rgba(248, 113, 113, 0.35)',
  }
}

export function computeAcwrZoneState(zone?: string) {
  switch (zone) {
    case 'Sweet Spot':
      return {
        label: 'Within your usual range (0.80–1.30)',
        color: '#34D399',
        badgeBg: 'rgba(52, 211, 153, 0.12)',
        badgeBorder: 'rgba(52, 211, 153, 0.35)',
      }
    case 'Overreaching':
      return {
        label: 'Higher than usual (1.31–1.49)',
        color: '#FBBF24',
        badgeBg: 'rgba(251, 191, 36, 0.12)',
        badgeBorder: 'rgba(251, 191, 36, 0.35)',
      }
    case 'Danger Zone':
      return {
        label: 'Much higher than usual (≥1.50)',
        color: '#F87171',
        badgeBg: 'rgba(248, 113, 113, 0.12)',
        badgeBorder: 'rgba(248, 113, 113, 0.35)',
      }
    case 'Under-training':
      return {
        label: 'Lower than usual (<0.80)',
        color: '#60A5FA',
        badgeBg: 'rgba(96, 165, 250, 0.12)',
        badgeBorder: 'rgba(96, 165, 250, 0.35)',
      }
    case 'No Data':
    default:
      return {
        label: 'Not enough training data yet',
        color: '#94A3B8',
        badgeBg: 'rgba(148, 163, 184, 0.12)',
        badgeBorder: 'rgba(148, 163, 184, 0.35)',
      }
  }
}

export function buildCoachDebriefScript(params: {
  athleteName: string
  weekEndingDate: string
  optPhase: string
  dossier: DossierMetrics
}): string {
  const { athleteName, weekEndingDate, optPhase, dossier } = params
  return `Hi ${athleteName}. Here is your weekly training update for the week ending ${weekEndingDate}. During ${optPhase}, you lifted a total of ${dossier.totalTonnageLbs.toLocaleString()} pounds across ${dossier.totalWorkingSets} working sets. Your average effort rating was ${dossier.avgSessionRpe} out of 10. You logged ${dossier.zone2CardioMins} minutes of steady, moderate-intensity cardio. Your recovery score was ${dossier.recoveryIndexScore} out of 100, and you completed ${dossier.adherencePct} percent of your planned sessions. For next week, focus on: ${dossier.nextWeekFocus}. Keep listening to your body and adjust as needed.`
}

export function estimateDebriefAudioDuration(script: string): number {
  const wordCount = script.split(/\s+/).length
  return Math.max(28, Math.round(wordCount / 2.6))
}

export default function ExecutiveSundayDossier({
  athleteName,
  optPhase,
  dossier,
  weekEndingDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  isModal = false,
  onClose,
  voiceNoteUrl,
}: ExecutiveSundayDossierProps) {
  const [copied, setCopied] = useState(false)
  const [isPlayingVoice, setIsPlayingVoice] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [viewMode, setViewMode] = useState<'briefing' | 'soap'>('briefing')
  const [printTheme, setPrintTheme] = useState<'obsidian' | 'ivory'>('obsidian')

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const docRefId = useMemo(() => computeDossierDocRefId(athleteName, weekEndingDate), [athleteName, weekEndingDate])
  const debriefSpeechText = useMemo(() => buildCoachDebriefScript({ athleteName, weekEndingDate, optPhase, dossier }), [athleteName, weekEndingDate, optPhase, dossier])
  const totalDuration = useMemo(() => estimateDebriefAudioDuration(debriefSpeechText), [debriefSpeechText])
  const recoveryState = useMemo(() => computeDossierRecoveryState(dossier.recoveryIndexScore), [dossier.recoveryIndexScore])
  const acwrState = useMemo(() => computeAcwrZoneState(dossier.acwrZone), [dossier.acwrZone])

  // Clean up audio, timers, and print classes on unmount
  useEffect(() => {
    const handleAfterPrint = () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('print-theme-ivory')
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', handleAfterPrint)
    }
    return () => {
      stopCoachVoiceCue()
      if (typeof window !== 'undefined') {
        window.removeEventListener('afterprint', handleAfterPrint)
      }
      if (typeof document !== 'undefined') {
        document.body.classList.remove('print-theme-ivory')
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const handlePrint = (theme: 'obsidian' | 'ivory' = printTheme) => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (theme === 'ivory') {
        document.body.classList.add('print-theme-ivory')
      } else {
        document.body.classList.remove('print-theme-ivory')
      }
      window.print()
    }
  }

  const handleCopySummary = async () => {
    const text = `FORGE ATHLETIC — WEEKLY PROGRESS SUMMARY\nREF: ${docRefId} | Week ending: ${weekEndingDate}\nName: ${athleteName} | Training phase: ${optPhase}\n\n• Training volume: ${dossier.totalTonnageLbs.toLocaleString()} lbs (${dossier.totalWorkingSets} sets, ${dossier.avgSessionRpe}/10 average effort)\n• Recent-to-usual workload ratio: ${dossier.acwrRatio !== null && dossier.acwrRatio !== undefined ? dossier.acwrRatio.toFixed(2) : 'Not enough data'} (${dossier.acwrZone || 'Not enough data'})\n• Steady cardio: ${dossier.zone2CardioMins} mins (${dossier.totalCardioMins} mins total)\n• Recovery score: ${dossier.recoveryIndexScore}/100\n• Planned sessions completed: ${dossier.adherencePct}% (${dossier.completedSessions}/${dossier.targetSessions})\n\nNext week's focus: ${dossier.nextWeekFocus}\n\nCoach: Scott Gordon, CSCS, NASM-CPT`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleAudioDebrief = () => {
    if (isPlayingVoice) {
      stopCoachVoiceCue()
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setIsPlayingVoice(false)
      return
    }

    if (voiceNoteUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(voiceNoteUrl)
        audioRef.current.ontimeupdate = () => {
          if (audioRef.current && audioRef.current.duration) {
            setAudioCurrentTime(Math.round(audioRef.current.currentTime))
            setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)
          }
        }
        audioRef.current.onended = () => {
          setIsPlayingVoice(false)
          setAudioProgress(0)
          setAudioCurrentTime(0)
        }
      }
      audioRef.current.play().then(() => {
        setIsPlayingVoice(true)
      }).catch(() => {
        setIsPlayingVoice(false)
      })
      return
    }

    setIsPlayingVoice(true)
    setAudioCurrentTime(0)
    setAudioProgress(0)

    const startTime = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      if (elapsed >= totalDuration) {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsPlayingVoice(false)
        setAudioProgress(100)
        setAudioCurrentTime(totalDuration)
        setTimeout(() => {
          setAudioProgress(0)
          setAudioCurrentTime(0)
        }, 1500)
      } else {
        setAudioCurrentTime(Math.min(totalDuration, Math.round(elapsed)))
        setAudioProgress(Math.min(100, (elapsed / totalDuration) * 100))
      }
    }, 250)

    speakCoachVoiceCue(debriefSpeechText, {
      onEnded: () => {
        if (timerRef.current) clearInterval(timerRef.current)
        setIsPlayingVoice(false)
        setAudioProgress(0)
        setAudioCurrentTime(0)
      },
    })
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const containerContent = (
    <div
      className="executive-dossier-document"
      style={{
        background: 'linear-gradient(180deg, #0D1424 0%, #080C16 100%)',
        border: '1px solid rgba(212,160,23,0.4)',
        borderRadius: 14,
        padding: 'clamp(20px, 4vw, 36px)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        boxShadow: isModal ? '0 30px 90px rgba(0,0,0,0.92)' : '0 12px 40px rgba(0,0,0,0.45)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans, Raleway), -apple-system, sans-serif',
      }}
    >
      {/* Background Watermark Seal */}
      {/* Background Watermark Seal */}
      <div className="dossier-watermark" style={{ position: 'absolute', top: -20, right: -20, zIndex: 0, pointerEvents: 'none' }}>
        <GaaMasterWatermarkSeal size={180} opacity={0.06} />
      </div>

      {/* ── Print-Only Formal Memorandum Running Header ── */}
      <div
        className="dossier-print-banner"
        style={{
          display: 'none',
          color: printTheme === 'ivory' ? '#8A6508' : '#D4AF37',
          fontFamily: 'var(--font-telemetry, monospace)',
        }}
      >
        <span>Forge Athletic · Sports Science Division</span>
        <span>Private training summary</span>
        <span>Ref: {docRefId}</span>
      </div>

      {/* ── Security & Boardroom Classification Ribbon ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 10,
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#D4AF37',
              boxShadow: '0 0 8px #D4AF37',
            }}
          />
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: 'var(--gold-lt)',
            }}
          >
            Your private weekly training summary
          </span>
        </div>
        <div
          className="font-telemetry font-mono"
          style={{
            fontFamily: 'var(--font-telemetry, monospace)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 10,
            color: 'var(--gray)',
            letterSpacing: '0.08em',
          }}
        >
          {docRefId}
        </div>
      </div>

      {/* ── Document Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(212,160,23,0.3)',
          paddingBottom: 20,
          flexWrap: 'wrap',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold-lt)', fontWeight: 800 }}>
              Forge Athletic · Training summary
            </span>
          </div>
          <h2
            className="font-serif"
            style={{
              fontSize: 'clamp(24px, 3.5vw, 32px)',
              margin: '6px 0 0',
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              lineHeight: 1.15,
              fontWeight: 700,
            }}
          >
            YOUR WEEKLY TRAINING SUMMARY
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--gray)' }}>
            <span>Name: <strong style={{ color: '#FFFFFF' }}>{athleteName}</strong></span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span>Week ending: <strong style={{ color: 'var(--gold-lt)' }}>{weekEndingDate}</strong></span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span
              style={{
                fontSize: 11,
                background: 'rgba(212,160,23,0.12)',
                color: 'var(--gold-lt)',
                padding: '2px 9px',
                borderRadius: 4,
                border: '1px solid rgba(212,160,23,0.35)',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {optPhase}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span
              style={{
                fontSize: 11,
                background: recoveryState.badgeBg,
                color: recoveryState.color,
                padding: '2px 9px',
                borderRadius: 4,
                border: `1px solid ${recoveryState.badgeBorder}`,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {recoveryState.label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span
              style={{
                fontSize: 11,
                background: acwrState.badgeBg,
                color: acwrState.color,
                padding: '2px 9px',
                borderRadius: 4,
                border: `1px solid ${acwrState.badgeBorder}`,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              ACWR: <span className="font-telemetry font-mono">{dossier.acwrRatio !== null && dossier.acwrRatio !== undefined ? dossier.acwrRatio.toFixed(2) : 'No Data'}</span> · {dossier.acwrZone || 'No Data'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="dossier-actions no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.06)',
              padding: 3,
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('briefing')}
              style={{
                padding: '6px 12px',
                borderRadius: 5,
                border: 'none',
                background: viewMode === 'briefing' ? 'var(--gold)' : 'transparent',
                color: viewMode === 'briefing' ? '#080C16' : 'var(--gray)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Progress overview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('soap')}
              style={{
                padding: '6px 12px',
                borderRadius: 5,
                border: 'none',
                background: viewMode === 'soap' ? 'var(--gold)' : 'transparent',
                color: viewMode === 'soap' ? '#080C16' : 'var(--gray)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Coach notes
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="tactile-btn"
            style={{
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: copied ? 'var(--gold-lt)' : '#FFFFFF',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name={copied ? 'check' : 'copy'} size={13} tone={copied ? 'gold' : 'inherit'} />
            <span>{copied ? 'Summary copied' : 'Copy summary'}</span>
          </button>

          {/* Print Theme Switcher */}
          <div className="dossier-theme-switch" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <button
              type="button"
              onClick={() => setPrintTheme(t => t === 'obsidian' ? 'ivory' : 'obsidian')}
              title="Choose a dark or light print layout"
              style={{
                padding: '7px 11px',
                borderRadius: 6,
                border: '1px solid rgba(212,160,23,0.35)',
                background: printTheme === 'obsidian' ? 'rgba(0,0,0,0.5)' : '#FFFFFF',
                color: printTheme === 'obsidian' ? 'var(--gold-lt)' : '#0A0E18',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {printTheme === 'obsidian' ? 'Dark layout' : 'Light layout'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePrint(printTheme)}
            className="tactile-btn"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #8A6508 100%)',
              border: 'none',
              color: '#080C16',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 10px rgba(212,175,55,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="printer" size={13} tone="inherit" />
            <span>Print or save summary</span>
          </button>

          <a
            href="/dashboard/fitness?workspace=coach"
            className="tactile-btn"
            style={{
              padding: '8px 14px',
              background: 'rgba(212, 160, 23, 0.15)',
              border: '1px solid var(--gold)',
              color: 'var(--gold-lt)',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="clipboard" size={13} tone="gold" />
            <span>Weekly Check-In ➔</span>
          </a>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#FFFFFF',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Coach Scott Gordon Voice Debrief Bar ── */}
      <div
        className="dossier-audio-bar no-print"
        style={{
          background: 'linear-gradient(135deg, rgba(14,21,36,0.9) 0%, rgba(20,29,48,0.9) 100%)',
          border: '1px solid rgba(212,160,23,0.35)',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={toggleAudioDebrief}
          aria-label={isPlayingVoice ? 'Pause debrief' : 'Play debrief'}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: isPlayingVoice ? 'rgba(212,160,23,0.2)' : 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
            border: isPlayingVoice ? '2px solid var(--gold-lt)' : 'none',
            color: isPlayingVoice ? 'var(--gold-lt)' : '#080C16',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: isPlayingVoice ? '0 0 16px rgba(212,175,55,0.4)' : '0 2px 8px rgba(0,0,0,0.5)',
            transition: 'all 0.2s ease',
          }}
        >
          <GaaIcon name={isPlayingVoice ? 'pause' : 'play'} size={17} tone="inherit" />
        </button>

        {/* Debrief Meta & Equalizer */}
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--gold-lt)',
                }}
              >
                Coach Scott Gordon · Audio progress summary
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  background: 'rgba(255,255,255,0.08)',
                  padding: '1px 6px',
                  borderRadius: 3,
                  color: 'var(--gray)',
                  fontWeight: 600,
                }}
              >
                Coach-voiced audio
              </span>
            </div>

            <div className="font-telemetry" style={{ fontSize: 11, color: isPlayingVoice ? 'var(--gold-lt)' : 'var(--gray)' }}>
              {formatSeconds(audioCurrentTime)} / {formatSeconds(totalDuration)}
            </div>
          </div>

          {/* Progress Scrub Bar */}
          <div
            style={{
              width: '100%',
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${audioProgress}%`,
                height: '100%',
                backgroundColor: 'var(--gold)',
                transition: isPlayingVoice ? 'width 0.25s linear' : 'width 0.15s ease',
              }}
            />
          </div>
        </div>

        {/* Equalizer Visualization */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2.5,
            height: 24,
            padding: '0 4px',
            flexShrink: 0,
          }}
        >
          {[0.4, 0.7, 1.0, 0.5, 0.9, 0.6, 0.8, 0.3, 0.75, 0.5, 0.85, 0.4].map((scale, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: isPlayingVoice ? `${Math.max(4, 24 * scale * (0.5 + 0.5 * Math.sin((i + audioCurrentTime) * 1.5)))}px` : '4px',
                backgroundColor: isPlayingVoice ? 'var(--gold-lt)' : 'rgba(255,255,255,0.2)',
                borderRadius: 1.5,
                transition: 'height 0.2s ease, background-color 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Weekly training and recovery metrics ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Tonnage / Mechanical Volume Load */}
        <div
          className="dossier-metric-card"
          style={{
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800, letterSpacing: '0.1em' }}>
              Training volume (weight lifted)
            </div>
            <div
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '6px 0 2px',
                lineHeight: 1,
              }}
            >
              {dossier.totalTonnageLbs.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--gold-lt)', fontWeight: 800 }}>LBS</span>
            </div>
          </div>
          <div>
            {/* Sparkbar */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (dossier.totalTonnageLbs / 80000) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8A6508 0%, #D4AF37 100%)',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>
              Across <strong style={{ color: '#FFF' }}>{dossier.totalWorkingSets}</strong> working sets · <span className="font-telemetry font-mono">{dossier.avgSessionRpe}/10</span> avg RPE
            </div>
          </div>
        </div>

        {/* Acute-to-Chronic Workload Ratio (ACWR) */}
        <div
          className="dossier-metric-card"
          style={{
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800, letterSpacing: '0.1em' }}>
              Workload Ratio (ACWR)
            </div>
            <div
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '6px 0 2px',
                lineHeight: 1,
              }}
            >
              {dossier.acwrRatio !== null && dossier.acwrRatio !== undefined ? dossier.acwrRatio.toFixed(2) : 'No Data'}{' '}
              <span style={{ fontSize: 12, color: acwrState.color, fontWeight: 800 }}>
                {dossier.acwrZone || 'No Data'}
              </span>
            </div>
          </div>
          <div>
            {/* Sparkbar */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${dossier.acwrRatio !== null && dossier.acwrRatio !== undefined ? Math.min(100, (dossier.acwrRatio / 1.8) * 100) : 0}%`,
                  height: '100%',
                  background: acwrState.color,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>
              Compares this week with your recent training · {acwrState.label}
            </div>
          </div>
        </div>

        {/* Steady cardio (Zone 2) */}
        <div
          className="dossier-metric-card"
          style={{
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800, letterSpacing: '0.1em' }}>
              Steady cardio (Zone 2)
            </div>
            <div
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '6px 0 2px',
                lineHeight: 1,
              }}
            >
              {dossier.zone2CardioMins} <span style={{ fontSize: 13, color: '#34D399', fontWeight: 800 }}>MINS</span>
            </div>
          </div>
          <div>
            {/* Sparkbar */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (dossier.zone2CardioMins / 180) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #059669 0%, #34D399 100%)',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>
              {dossier.totalCardioMins} total cardio minutes · steady effort
            </div>
          </div>
        </div>

        {/* Recovery score */}
        <div
          className="dossier-metric-card"
          style={{
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800, letterSpacing: '0.1em' }}>
              Recovery score
            </div>
            <div
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '6px 0 2px',
                lineHeight: 1,
              }}
            >
              {dossier.recoveryIndexScore} <span style={{ fontSize: 13, color: 'var(--gold-lt)', fontWeight: 800 }}>/ 100</span>
            </div>
          </div>
          <div>
            {/* Sparkbar */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, dossier.recoveryIndexScore)}%`,
                  height: '100%',
                  background: dossier.recoveryIndexScore >= 80 ? '#34D399' : dossier.recoveryIndexScore >= 65 ? '#FBBF24' : '#F87171',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: recoveryState.color, fontWeight: 700 }}>
              ● {recoveryState.label}
            </div>
          </div>
        </div>

        {/* Planned sessions completed */}
        <div
          className="dossier-metric-card"
          style={{
            background: 'rgba(10, 15, 26, 0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800, letterSpacing: '0.1em' }}>
              Planned sessions completed
            </div>
            <div
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 30,
                fontWeight: 700,
                color: '#FFFFFF',
                margin: '6px 0 2px',
                lineHeight: 1,
              }}
            >
              {dossier.adherencePct}<span style={{ fontSize: 16, color: 'var(--gold-lt)' }}>%</span>
            </div>
          </div>
          <div>
            {/* Sparkbar */}
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, margin: '8px 0 6px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, dossier.adherencePct)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284C7 0%, #38BDF8 100%)',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)' }}>
              <strong style={{ color: '#FFF' }}>{dossier.completedSessions}</strong> of <strong style={{ color: '#FFF' }}>{dossier.targetSessions}</strong> planned sessions
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress overview: movement, records, and next steps ── */}
      {viewMode === 'briefing' && (
        <>
          {/* ── Kinetic Movement Pattern Distribution ── */}
          {dossier.kineticDistribution && (
            <div
              className="dossier-section"
              style={{
                background: 'rgba(10, 15, 26, 0.75)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '16px 20px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'var(--gold-lt)',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <GaaIcon name="dna" size={14} tone="gold" />
                  <span>Movement pattern balance</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                  Total Working Sets: <strong className="font-telemetry font-mono" style={{ color: '#FFFFFF' }}>{dossier.kineticDistribution.totalSets || dossier.totalWorkingSets}</strong>
                </div>
              </div>

              {/* Segmented Volume Bar */}
              <div
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  overflow: 'hidden',
                  display: 'flex',
                  background: 'rgba(255,255,255,0.06)',
                  marginBottom: 12,
                }}
              >
                <div style={{ width: `${dossier.kineticDistribution.pushPct}%`, background: '#38BDF8' }} title={`Push: ${dossier.kineticDistribution.pushPct}%`} />
                <div style={{ width: `${dossier.kineticDistribution.pullPct}%`, background: '#34D399' }} title={`Pull: ${dossier.kineticDistribution.pullPct}%`} />
                <div style={{ width: `${dossier.kineticDistribution.squatPct}%`, background: '#F59E0B' }} title={`Squat: ${dossier.kineticDistribution.squatPct}%`} />
                <div style={{ width: `${dossier.kineticDistribution.hingePct}%`, background: '#D4AF37' }} title={`Hinge: ${dossier.kineticDistribution.hingePct}%`} />
                <div style={{ width: `${dossier.kineticDistribution.carryCorePct}%`, background: '#A855F7' }} title={`Carry/Core: ${dossier.kineticDistribution.carryCorePct}%`} />
              </div>

              {/* Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                {[
                  { label: 'Push (Chest/Press)', pct: dossier.kineticDistribution.pushPct, sets: dossier.kineticDistribution.pushSets, color: '#38BDF8' },
                  { label: 'Pull (Back/Rows)', pct: dossier.kineticDistribution.pullPct, sets: dossier.kineticDistribution.pullSets, color: '#34D399' },
                  { label: 'Squat (Anterior Chain)', pct: dossier.kineticDistribution.squatPct, sets: dossier.kineticDistribution.squatSets, color: '#F59E0B' },
                  { label: 'Hinge (Posterior Chain)', pct: dossier.kineticDistribution.hingePct, sets: dossier.kineticDistribution.hingeSets, color: '#D4AF37' },
                  { label: 'Carry & Core (Trunk)', pct: dossier.kineticDistribution.carryCorePct, sets: dossier.kineticDistribution.carryCoreSets, color: '#A855F7' },
                ].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6,
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: p.color, marginRight: 5 }} />
                      {p.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                      <span className="font-telemetry font-mono" style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                        {p.pct}%
                      </span>
                      <span className="font-telemetry font-mono" style={{ fontSize: 11, color: 'var(--gold-lt)' }}>
                        ({p.sets} sets)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Key Performance PRs (if achieved) ── */}
          {dossier.topPrsThisWeek.length > 0 && (
            <div
              className="dossier-section"
              style={{
                background: 'rgba(212,160,23,0.06)',
                border: '1px solid rgba(212,160,23,0.3)',
                borderRadius: 10,
                padding: '16px 20px',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--gold-lt)',
                  fontWeight: 800,
                  marginBottom: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <GaaIcon name="trophy" size={14} tone="gold" />
                <span>Personal bests</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {dossier.topPrsThisWeek.map((pr, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(212,160,23,0.35)',
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{pr.exercise_name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
                    <span className="font-telemetry font-mono" style={{ color: 'var(--gold-lt)', fontWeight: 800 }}>
                      {pr.weight_lbs} lbs × {pr.reps} {pr.reps === 1 ? 'rep' : 'reps'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Training progress and what it means ── */}
          <div
            className="dossier-section"
            style={{
              background: 'rgba(10, 15, 26, 0.75)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: 20,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
                marginBottom: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <GaaIcon name="dna" size={14} tone="gold" />
              <span>How your training is progressing</span>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                fontSize: 13.5,
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.6,
              }}
            >
              {dossier.executiveSummary.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      color: 'var(--gold-lt)',
                      fontSize: 14,
                      lineHeight: 1.4,
                      flexShrink: 0,
                    }}
                  >
                    ◆
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Next week's focus ── */}
          <div
            className="dossier-section"
            style={{
              background: 'linear-gradient(135deg, rgba(212,160,23,0.1) 0%, rgba(14,23,36,0.95) 100%)',
              border: '1px solid rgba(212,160,23,0.45)',
              borderRadius: 10,
              padding: '18px 22px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--gold-lt)',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <GaaIcon name="target" size={14} tone="gold" />
              <span>Next week's focus</span>
            </div>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 14,
                color: '#FFFFFF',
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              {dossier.nextWeekFocus}
            </p>
          </div>
        </>
      )}

      {/* ── Coach notes view ── */}
      {viewMode === 'soap' && dossier.soapRecord && (
        <div
          className="dossier-section dossier-soap-box"
          style={{
            background: 'rgba(10, 15, 26, 0.85)',
            border: '1px solid rgba(212,160,23,0.35)',
            borderRadius: 10,
            padding: '22px 24px',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GaaIcon name="clipboard" size={16} tone="gold" />
              <h3
                className="font-serif"
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: '#FFFFFF',
                  letterSpacing: '0.04em',
                }}
              >
                COACH NOTES
              </h3>
            </div>
            <span
              className="font-telemetry font-mono"
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 10.5,
                color: 'var(--gold-lt)',
                letterSpacing: '0.08em',
              }}
            >
              Training notes
            </span>
          </div>

          {/* S - Subjective */}
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#60A5FA', marginBottom: 6 }}>
              How you felt
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#E2E8F0', lineHeight: 1.6 }}>
              {dossier.soapRecord.subjective}
            </p>
          </div>

          {/* O - Objective */}
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#34D399', marginBottom: 6 }}>
              Training details
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#E2E8F0', lineHeight: 1.6 }}>
              {dossier.soapRecord.objective}
            </p>
          </div>

          {/* A - Assessment */}
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#FBBF24', marginBottom: 6 }}>
              Coach&apos;s notes
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#E2E8F0', lineHeight: 1.6 }}>
              {dossier.soapRecord.assessment}
            </p>
          </div>

          {/* P - Plan */}
          <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', marginBottom: 6 }}>
              Next steps
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: '#E2E8F0', lineHeight: 1.6 }}>
              {dossier.soapRecord.plan}
            </p>
          </div>
        </div>
      )}

      {/* ── Coach sign-off ── */}
      <div
        className="dossier-footer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 18,
          flexWrap: 'wrap',
          gap: 14,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div>
          <div
            className="font-serif"
            style={{
              fontSize: 17,
              color: 'var(--gold-lt)',
              letterSpacing: '0.06em',
              fontWeight: 700,
            }}
          >
            SCOTT GORDON, NASM MASTER TRAINER
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 2 }}>
            Founder &amp; Performance Director · NASM-CPT® · CES® · PES® · CNC™ · CSNC
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div
            className="font-telemetry font-mono"
            style={{
              fontFamily: 'var(--font-telemetry, monospace)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 9.5,
              color: 'var(--gray)',
              letterSpacing: '0.06em',
              textAlign: 'right',
            }}
          >
            <div>Report reference: {docRefId}</div>
          </div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#080C16',
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 4,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="shield-check" size={12} tone="inherit" />
            <span>Training summary</span>
          </div>
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div
        className="dossier-modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100003,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          overflowY: 'auto',
        }}
      >
        <div
          onClick={onClose}
          className="dossier-modal-backdrop"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 860, width: '100%', margin: 'auto' }}>
          {containerContent}
        </div>
      </div>
    )
  }

  return containerContent
}
