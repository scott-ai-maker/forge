'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { useSfxMuted } from '@/lib/sfx-audio'
import {
  evaluateCameraReadiness,
  READINESS_PRESET_LABELS,
  type ReadinessEvaluationResult,
  type ReadinessPresetId,
  type ReadinessScreenMode,
} from '@/lib/camera-readiness-engine'
import {
  recordDailyReadinessAndComfort,
  type InjectedReadinessDrill,
} from '@/lib/posture-profile-state'

export interface CameraReadinessCheckProps {
  expressModeActive?: boolean
  allowDualScreen?: boolean
  onRequestUpgradeDualScreen?: () => void
  onComplete: (result: {
    readinessScore: number
    injectedDrills: InjectedReadinessDrill[]
    restrictionFlags: string[]
  }) => void
  onSkip: () => void
}

const REP_CUES: Record<ReadinessScreenMode, [string, string, string]> = {
  overhead_squat: [
    'Rep 1 of 3 · Arms tall overhead, sit hips back smoothly for 2 seconds.',
    'Rep 2 of 3 · Keep heels planted flat and knees tracking over toes.',
    'Rep 3 of 3 · Hold comfortable bottom depth for 1 second, then stand tall.',
  ],
  scapular_wall_slides: [
    'Rep 1 of 3 · Back and wrists near wall, glide forearms smoothly upward.',
    'Rep 2 of 3 · Keep lower ribs down and chin gently tucked.',
    'Rep 3 of 3 · Reach comfortable overhead peak, then draw elbows down.',
  ],
  dual_screen: [
    'Rep 1 of 3 · Overhead Squat: sit smoothly with heels anchored.',
    'Rep 2 of 3 · Overhead Squat + Overhead Reach: steady ribs and knees.',
    'Rep 3 of 3 · Scapular Wall Slide check: glide tall with neutral neck.',
  ],
}

export default function CameraReadinessCheck({
  expressModeActive = false,
  allowDualScreen = false,
  onRequestUpgradeDualScreen,
  onComplete,
  onSkip,
}: CameraReadinessCheckProps) {
  const { sfxMuted, toggleSfxMuted, playTone } = useSfxMuted()

  const [screenMode, setScreenMode] = useState<ReadinessScreenMode>('overhead_squat')
  const [selectedPreset, setSelectedPreset] = useState<ReadinessPresetId>('tight_hips_ankles')
  const [isScanning, setIsScanning] = useState(false)
  const [currentRep, setCurrentRep] = useState<1 | 2 | 3>(1)
  const [result, setResult] = useState<ReadinessEvaluationResult | null>(null)
  const [cameraNotice, setCameraNotice] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const repIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupCamera = useCallback(() => {
    if (repIntervalRef.current) {
      clearInterval(repIntervalRef.current)
      repIntervalRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  useEffect(() => {
    return () => cleanupCamera()
  }, [cleanupCamera])

  const commitEvaluation = useCallback(
    (mode: ReadinessScreenMode, preset: ReadinessPresetId) => {
      const evaluated = evaluateCameraReadiness({
        screenMode: mode,
        preset,
        expressModeActive,
      })
      setResult(evaluated)
      playTone('success')

      recordDailyReadinessAndComfort({
        readinessScore: evaluated.readinessScore,
        screenType: mode,
        restrictionFlags: evaluated.restrictionFlags,
        injectedDrills: evaluated.injectedDrills,
      })
    },
    [expressModeActive, playTone]
  )

  const startThirtySecondCheck = async () => {
    setResult(null)
    setCameraNotice(null)
    setCurrentRep(1)
    setIsScanning(true)

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play().catch(() => {})
        }
      } catch {
        setCameraNotice('Hands-free simulation active (camera permission optional).')
      }
    } else {
      setCameraNotice('Hands-free simulation active in current browser.')
    }

    playTone('countdown')
    let rep = 1
    repIntervalRef.current = setInterval(() => {
      rep += 1
      if (rep <= 3) {
        setCurrentRep(rep as 1 | 2 | 3)
        playTone('rep_complete')
      } else {
        cleanupCamera()
        const inferredPreset: ReadinessPresetId =
          screenMode === 'scapular_wall_slides' ? 'stiff_upper_back' : selectedPreset
        commitEvaluation(screenMode, inferredPreset)
      }
    }, 2400)
  }

  const handleSimulatePreset = (preset: ReadinessPresetId) => {
    setSelectedPreset(preset)
    cleanupCamera()
    const targetMode: ReadinessScreenMode =
      preset === 'stiff_upper_back' ? 'scapular_wall_slides' : screenMode
    setScreenMode(targetMode)
    commitEvaluation(targetMode, preset)
  }

  return (
    <section
      data-testid="camera-readiness-check"
      aria-label="30-Second Pre-Workout Camera Readiness Check"
      style={{
        background: 'linear-gradient(180deg, rgba(13, 23, 38, 0.97) 0%, rgba(7, 12, 22, 0.99) 100%)',
        border: '1.5px solid rgba(56, 189, 248, 0.42)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '2px 7px',
                borderRadius: 4,
              }}
            >
              Pre-Workout Overview · 30s Check
            </span>
            {expressModeActive && (
              <span
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#FBBF24',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                20m Express Cap: Max 90s Warm-Up
              </span>
            )}
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              margin: '4px 0 0',
            }}
          >
            30-Second Camera Readiness Check
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={toggleSfxMuted}
            aria-label={sfxMuted ? 'Unmute readiness audio cues (currently SFX MUTED)' : 'Mute readiness audio cues'}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: sfxMuted ? '#94A3B8' : '#FBBF24',
              borderRadius: 6,
              padding: '6px 9px',
              fontSize: 10.5,
              fontFamily: 'var(--font-telemetry, monospace)',
              cursor: 'pointer',
            }}
          >
            {sfxMuted ? 'SFX MUTED' : 'SFX ON'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#E2E8F0',
              borderRadius: 6,
              padding: '6px 11px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Skip to Workout →
          </button>
        </div>
      </div>

      {/* Screen Selector */}
      {!isScanning && !result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            <button
              type="button"
              onClick={() => setScreenMode('overhead_squat')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background:
                  screenMode === 'overhead_squat'
                    ? 'rgba(56, 189, 248, 0.16)'
                    : 'rgba(8, 14, 24, 0.85)',
                border:
                  screenMode === 'overhead_squat'
                    ? '1.5px solid #38BDF8'
                    : '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>3 Bodyweight Overhead Squats</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                Ankle dorsiflexion · Hip depth · Knee valgus · Torso lean
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScreenMode('scapular_wall_slides')}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background:
                  screenMode === 'scapular_wall_slides'
                    ? 'rgba(56, 189, 248, 0.16)'
                    : 'rgba(8, 14, 24, 0.85)',
                border:
                  screenMode === 'scapular_wall_slides'
                    ? '1.5px solid #38BDF8'
                    : '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>3 Scapular Wall Slides</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                Thoracic extension · Shoulder flexion · Cervical drift
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!allowDualScreen) {
                  onRequestUpgradeDualScreen?.()
                  return
                }
                setScreenMode('dual_screen')
              }}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background:
                  screenMode === 'dual_screen'
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'rgba(8, 14, 24, 0.85)',
                border:
                  screenMode === 'dual_screen'
                    ? '1.5px solid #F59E0B'
                    : '1px solid rgba(255,255,255,0.1)',
                color: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800 }}>Dual-Screen Full Check</span>
                {!allowDualScreen && (
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-telemetry, monospace)', color: '#FBBF24', background: 'rgba(245,158,11,0.18)', padding: '1px 5px', borderRadius: 4 }}>
                    PLUS
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                Lower + Upper kinetic chain + trend alerts
              </div>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => void startThirtySecondCheck()}
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                minHeight: 44,
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
                color: '#041019',
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="camera" size={14} tone="dark" />
              <span>Start 3-Rep Camera Check</span>
            </button>

            {/* Dev / Preview Simulate Readiness Check Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <label
                htmlFor="simulate-readiness-preset"
                style={{ fontSize: 11, fontFamily: 'var(--font-telemetry, monospace)', color: '#94A3B8' }}
              >
                Simulate Readiness Check:
              </label>
              <select
                id="simulate-readiness-preset"
                value={selectedPreset}
                onChange={e => handleSimulatePreset(e.target.value as ReadinessPresetId)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: '#080E18',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#F8FAFC',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                {(Object.keys(READINESS_PRESET_LABELS) as ReadinessPresetId[]).map(presetKey => (
                  <option key={presetKey} value={presetKey}>
                    {READINESS_PRESET_LABELS[presetKey]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleSimulatePreset(selectedPreset)}
                style={{
                  padding: '8px 11px',
                  minHeight: 40,
                  borderRadius: 7,
                  background: 'rgba(245, 158, 11, 0.14)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#FBBF24',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Run Preset
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active 3-Rep HUD */}
      {isScanning && (
        <div
          style={{
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            background: '#050A14',
            border: '1.5px solid #38BDF8',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            style={{
              width: '100%',
              maxHeight: 210,
              objectFit: 'cover',
              borderRadius: 8,
              background: '#080E18',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-telemetry, monospace)',
                fontSize: 13,
                fontWeight: 800,
                color: '#38BDF8',
              }}
            >
              Rep {currentRep} of 3
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {[1, 2, 3].map(r => (
                <span
                  key={r}
                  style={{
                    width: 28,
                    height: 6,
                    borderRadius: 999,
                    background: r <= currentRep ? '#38BDF8' : 'rgba(255,255,255,0.14)',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>
            {REP_CUES[screenMode][currentRep - 1]}
          </div>
          {cameraNotice && <div style={{ fontSize: 11, color: '#94A3B8' }}>{cameraNotice}</div>}
        </div>
      )}

      {/* Evaluated Readiness Score & Warm-Up Preview */}
      {result && (
        <div
          style={{
            background: 'rgba(8, 14, 24, 0.88)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--font-telemetry, monospace)', color: '#94A3B8', textTransform: 'uppercase' }}>
                Forge Readiness Score
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: 24,
                  fontWeight: 800,
                  color: result.readinessScore >= 85 ? '#34D399' : '#FBBF24',
                }}
              >
                {result.readinessScore}/100
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {result.checks.map(chk => (
                <span
                  key={chk.id}
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'var(--font-telemetry, monospace)',
                    padding: '3px 7px',
                    borderRadius: 5,
                    background:
                      chk.status === 'optimal'
                        ? 'rgba(16, 185, 129, 0.14)'
                        : 'rgba(245, 158, 11, 0.15)',
                    border:
                      chk.status === 'optimal'
                        ? '1px solid rgba(16, 185, 129, 0.35)'
                        : '1px solid rgba(245, 158, 11, 0.4)',
                    color: chk.status === 'optimal' ? '#6EE7B7' : '#FDE68A',
                  }}
                >
                  {chk.label}: {chk.measuredDeg}°
                </span>
              ))}
            </div>
          </div>

          <p style={{ margin: 0, fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.45 }}>
            {result.coachSummary}
          </p>

          {result.injectedDrills.length > 0 && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                color: '#FDE68A',
              }}
            >
              <strong>
                Auto-Injecting {result.injectedDrills.length} Corrective Drills ({result.totalInjectedDurationSec}s
                {expressModeActive ? ' · 20m Express Capped' : ''}):
              </strong>{' '}
              {result.injectedDrills.map(d => d.name).join(' · ')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() =>
                onComplete({
                  readinessScore: result.readinessScore,
                  injectedDrills: result.injectedDrills,
                  restrictionFlags: result.restrictionFlags,
                })
              }
              className="tactile-btn"
              style={{
                flex: '1 1 200px',
                minHeight: 44,
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#080E14',
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {result.injectedDrills.length > 0
                ? 'Apply Warm-Up & Begin Set 1 →'
                : 'Begin Today’s Workout →'}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              style={{
                minHeight: 44,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#CBD5E1',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Re-Scan
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

