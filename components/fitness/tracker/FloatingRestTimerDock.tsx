'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import ActiveRestCardioPacerTray from './ActiveRestCardioPacerTray'
import {
  evaluateDynamicRestHeartRateRecovery,
  type RestAudioMetronomeMode,
} from '@/lib/rest-timer-audio-hr-engine'

export interface ActiveRestState {
  exerciseName: string
  key: string
  restSeconds: number
  remainingSeconds: number
  isRunning: boolean
  isBioPaced?: boolean
  bioPacedDelta?: number
  bioPacedReason?: string
  badgeText?: string
  hasAcuteFatigueDrop?: boolean
  acuteFatigueDropPercent?: number
  velocityLossPercent?: number
}

export interface FloatingRestTimerDockProps {
  activeRestState: ActiveRestState | null
  onAddSeconds: (seconds: number) => void
  onTogglePause: () => void
  onCompleteRest: () => void
  triggerHaptic?: (type: 'tap' | 'heavy' | 'success') => void
  currentHeartRateBpm?: number | null
  restingHeartRateBpm?: number | null
  userAge?: number
  soundMetronomeEnabled?: boolean
  onToggleSoundMetronome?: () => void
  soundMetronomeMode?: RestAudioMetronomeMode
  onChangeMetronomeMode?: (mode: RestAudioMetronomeMode) => void
}

export default function FloatingRestTimerDock({
  activeRestState,
  onAddSeconds,
  onTogglePause,
  onCompleteRest,
  triggerHaptic,
  currentHeartRateBpm,
  restingHeartRateBpm = 60,
  userAge = 30,
  soundMetronomeEnabled = false,
  onToggleSoundMetronome,
  soundMetronomeMode = 'cardiac_pulse',
  onChangeMetronomeMode,
}: FloatingRestTimerDockProps) {
  const [showCardioPacer, setShowCardioPacer] = useState(false)
  const [dismissedExtensionAlert, setDismissedExtensionAlert] = useState(false)

  const elapsedRestSecs = activeRestState
    ? Math.max(0, activeRestState.restSeconds - activeRestState.remainingSeconds)
    : 0

  const hrAdaptation = useMemo(() => {
    if (!activeRestState) return null
    return evaluateDynamicRestHeartRateRecovery({
      exerciseName: activeRestState.exerciseName,
      baseRestSeconds: activeRestState.restSeconds,
      remainingSeconds: activeRestState.remainingSeconds,
      elapsedRestSeconds: elapsedRestSecs,
      currentHeartRateBpm,
      restingHeartRateBpm: restingHeartRateBpm || 60,
      userAge,
      hasAcuteFatigueDrop: activeRestState.hasAcuteFatigueDrop,
      acuteFatigueDropPercent: activeRestState.acuteFatigueDropPercent,
      velocityLossPercent: activeRestState.velocityLossPercent,
    })
  }, [
    activeRestState,
    elapsedRestSecs,
    currentHeartRateBpm,
    restingHeartRateBpm,
    userAge,
  ])

  if (!activeRestState) return null

  const isComplete = activeRestState.remainingSeconds === 0
  const isWarning = activeRestState.remainingSeconds < 15

  return (
    <aside
      aria-label="Active Rest Timer"
      role="status"
      aria-live="polite"
      className="floating-rest-timer-dock"
      style={{
        position: 'fixed',
        bottom: 'clamp(14px, 3vw, 22px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        maxWidth: 'calc(100vw - 20px)',
        width: 520,
        background: 'linear-gradient(135deg, rgba(14,23,36,0.98) 0%, rgba(8,14,20,0.99) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isComplete ? '1.5px solid #10B981' : '1.5px solid rgba(212,160,23,0.6)',
        borderRadius: 14,
        padding: '10px 16px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.75), 0 0 28px rgba(212,160,23,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
      }}
    >
      {/* ── Tier 1: Header Bar (Radial Timer + Exercise Info + Primary Ready Button) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%' }}>
        {/* Radial Progress + Countdown Display + Metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={22} cy={22} r={18} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3.5} />
              <circle
                cx={22}
                cy={22}
                r={18}
                fill="none"
                stroke={isComplete ? '#10B981' : isWarning ? '#EF4444' : 'var(--gold)'}
                strokeWidth={3.5}
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - (activeRestState.restSeconds > 0 ? activeRestState.remainingSeconds / activeRestState.restSeconds : 0))}`}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-telemetry, monospace)',
                fontWeight: 700,
                fontSize: 13.5,
                color: isComplete ? '#34D399' : isWarning ? '#F87171' : 'var(--gold-lt)',
                letterSpacing: '0.04em',
              }}
            >
              {isComplete
                ? <GaaIcon name="check" size={16} tone="emerald" />
                : `${Math.floor(activeRestState.remainingSeconds / 60)}:${String(activeRestState.remainingSeconds % 60).padStart(2, '0')}`}
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                color: 'var(--gold)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3.5, flexShrink: 0 }}>
                <GaaIcon name="timer" size={11} tone="gold" />
                <span>Rest Interval</span>
              </span>
              <span style={{ color: activeRestState.isRunning ? '#34D399' : '#FCD34D', flexShrink: 0 }}>
                ● {activeRestState.isRunning ? 'Active' : 'Paused'}
              </span>

              {/* Real-Time Heart Rate Zone Badge */}
              {hrAdaptation && (
                <span
                  data-testid="hr-recovery-zone-badge"
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: `${hrAdaptation.zoneTelemetry.zoneColor}22`,
                    border: `1px solid ${hrAdaptation.zoneTelemetry.zoneColor}55`,
                    color: hrAdaptation.zoneTelemetry.zoneColor,
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0,
                  }}
                  title={`${hrAdaptation.zoneTelemetry.zoneLabel}: ${hrAdaptation.zoneTelemetry.currentBpm} bpm (${hrAdaptation.zoneTelemetry.percentHrMax}% HRmax)`}
                >
                  <GaaIcon name="heart" size={9} tone="inherit" />
                  <span>{hrAdaptation.zoneTelemetry.currentBpm} BPM (Z{hrAdaptation.zoneTelemetry.zone})</span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {activeRestState.exerciseName}
              </div>

              {activeRestState.isBioPaced && (
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: 'rgba(212,160,23,0.25)',
                    border: '1px solid rgba(212,160,23,0.5)',
                    color: 'var(--gold-lt, #F3E5AB)',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    flexShrink: 0,
                  }}
                  title={activeRestState.bioPacedReason}
                  data-testid="bio-paced-rest-badge"
                >
                  <GaaIcon name="lightning" size={9} tone="gold" />
                  <span>{activeRestState.badgeText || 'Bio-Paced'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary CTA: Ready / Start Next Set */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('success')
            onCompleteRest()
          }}
          className="tactile-btn"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
            border: '1px solid #D4AF37',
            color: '#0A0E18',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(212,175,55,0.25)',
          }}
          title="I'm ready for the next set"
        >
          <GaaIcon name="lightning" size={12} tone="inherit" />
          <span>Ready</span>
        </button>
      </div>

      {/* ── Tier 2: Action Grid Controls (+15s, +30s, Pause/Resume, Audio, Pacer) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: onToggleSoundMetronome ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)',
          gap: 6,
          width: '100%',
          marginTop: 2,
        }}
      >
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            onAddSeconds(15)
          }}
          className="tactile-btn"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'var(--white)',
            padding: '5px 4px',
            borderRadius: 5,
            fontSize: 10.5,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Add 15 seconds"
        >
          +15s
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            onAddSeconds(30)
          }}
          className="tactile-btn"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: 'var(--white)',
            padding: '5px 4px',
            borderRadius: 5,
            fontSize: 10.5,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Add 30 seconds"
        >
          +30s
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            onTogglePause()
          }}
          className="tactile-btn"
          style={{
            background: activeRestState.isRunning ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            border: activeRestState.isRunning ? '1px solid #EF4444' : '1px solid #10B981',
            color: activeRestState.isRunning ? '#FCA5A5' : '#6EE7B7',
            padding: '5px 4px',
            borderRadius: 5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
          }}
          title={activeRestState.isRunning ? 'Pause Rest Timer' : 'Resume Rest Timer'}
        >
          <GaaIcon name={activeRestState.isRunning ? 'pause' : 'play'} size={11} tone="inherit" />
          <span>{activeRestState.isRunning ? 'Pause' : 'Play'}</span>
        </button>

        {/* Audio Metronome Quick Toggle */}
        {onToggleSoundMetronome && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic?.('tap')
              onToggleSoundMetronome()
            }}
            className="tactile-btn"
            data-testid="toggle-rest-metronome-btn"
            style={{
              background: soundMetronomeEnabled ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.06)',
              border: soundMetronomeEnabled ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.18)',
              color: soundMetronomeEnabled ? 'var(--gold-lt)' : '#94A3B8',
              padding: '5px 4px',
              borderRadius: 5,
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
            title={soundMetronomeEnabled ? 'Rest Audio Metronome On' : 'Enable Rest Audio Metronome'}
          >
            <GaaIcon name={soundMetronomeEnabled ? 'volume' : 'volume-x'} size={11} tone={soundMetronomeEnabled ? 'gold' : 'slate'} />
            <span>Audio</span>
          </button>
        )}

        {/* Cardio Pacer Quick Toggle */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic?.('tap')
            setShowCardioPacer(prev => !prev)
          }}
          className="tactile-btn"
          style={{
            background: showCardioPacer ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.06)',
            border: showCardioPacer ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.18)',
            color: showCardioPacer ? '#38BDF8' : 'var(--white)',
            padding: '5px 4px',
            borderRadius: 5,
            fontSize: 10.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
          title="Toggle Active Rest Cardio & Breath Pacer"
          data-testid="toggle-cardio-pacer-btn"
        >
          <GaaIcon name="heart" size={11} tone={showCardioPacer ? 'cyan' : 'slate'} />
          <span>Pacer</span>
        </button>
      </div>

      {/* ── Dynamic Cardiac Delay / Acute Fatigue Extension Alert ── */}
      {hrAdaptation?.shouldExtend && !dismissedExtensionAlert && (
        <div
          data-testid="dynamic-cardiac-extension-alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: '#FCD34D',
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <GaaIcon name="activity" size={12} tone="amber" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hrAdaptation.adaptationReason}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button
              type="button"
              data-testid="apply-hr-extension-btn"
              onClick={() => {
                triggerHaptic?.('tap')
                onAddSeconds(hrAdaptation.suggestedExtensionSeconds)
                setDismissedExtensionAlert(true)
              }}
              style={{
                background: 'rgba(245, 158, 11, 0.3)',
                border: '1px solid #F59E0B',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title={`Add +${hrAdaptation.suggestedExtensionSeconds}s for cardiac recovery`}
            >
              + {hrAdaptation.suggestedExtensionSeconds}s
            </button>
            <button
              type="button"
              onClick={() => setDismissedExtensionAlert(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: 12,
                padding: '0 4px',
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Dynamic Early Parasympathetic Recovery Banner (Zone 1) ── */}
      {hrAdaptation?.isRecoveredEarly && (
        <div
          data-testid="dynamic-early-recovery-alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.45)',
            color: '#6EE7B7',
            fontSize: 10.5,
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <GaaIcon name="check" size={12} tone="emerald" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Zone 1 Recovery Achieved ({hrAdaptation.zoneTelemetry.currentBpm} BPM) — Ready to Lift
            </span>
          </div>
          <button
            type="button"
            data-testid="accept-early-ready-btn"
            onClick={() => {
              triggerHaptic?.('success')
              onCompleteRest()
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.3)',
              border: '1px solid #10B981',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 800,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Start set early"
          >
            Start Set
          </button>
        </div>
      )}

      {/* ── Biomechanical Guardrail: Hammer Curl Neutral Grip Rest Mandate ── */}
      {hrAdaptation?.isHammerCurl && (
        <div
          data-testid="hammer-curl-rest-guardrail-banner"
          style={{
            fontSize: 9.5,
            color: 'var(--gold-lt, #F3E5AB)',
            background: 'rgba(212,160,23,0.12)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 5,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="shield" size={11} tone="gold" />
          <span>
            <strong>Neutral Grip Rest Guardrail:</strong> Palms must face inward, thumbs pointed up toward ceiling, zero wrist twisting/supination. Decompress forearms neutrally.
          </span>
        </div>
      )}

      {/* ── EXPANDABLE ACTIVE REST CARDIO & BREATH PACER TRAY ── */}
      {showCardioPacer && (
        <ActiveRestCardioPacerTray
          exerciseName={activeRestState.exerciseName}
          elapsedRestSeconds={elapsedRestSecs}
          totalRestSeconds={activeRestState.restSeconds}
          currentHeartRateBpm={currentHeartRateBpm}
          restingHeartRateBpm={restingHeartRateBpm}
          userAge={userAge}
          onClose={() => setShowCardioPacer(false)}
          triggerHaptic={triggerHaptic}
        />
      )}
    </aside>
  )
}
