'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import TelemetryRingGauge from '@/components/ui/TelemetryRingGauge'
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
import { TELEMETRY_CAMERA_RELEASE_EVENT, trackEvent } from '@/src/lib/telemetry/telemetryClient'

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
    const handleHardwareRelease = () => cleanupCamera()
    if (typeof window !== 'undefined') {
      window.addEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, handleHardwareRelease)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(TELEMETRY_CAMERA_RELEASE_EVENT, handleHardwareRelease)
      }
      cleanupCamera()
    }
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

      const peakRomDeltas: Record<
        string,
        {
          measured_deg: number | null
          baseline_deg: number | null
          delta_deg: number | null
          severity: string
        }
      > = {}
      for (const check of evaluated.checks) {
        peakRomDeltas[check.id] = {
          measured_deg: check.measuredDeg,
          baseline_deg: check.baselineDeg,
          delta_deg: Number((check.measuredDeg - check.baselineDeg).toFixed(1)),
          severity: check.status,
        }
      }

      void trackEvent('readiness_check_completed', {
        readiness_index: evaluated.readinessScore,
        movement_type: mode,
        peak_rom_deltas: peakRomDeltas,
        restriction_flags: evaluated.restrictionFlags,
        injected_warmup_drills: evaluated.injectedDrills.map(d => ({
          id: d.id,
          title: d.name,
          duration_sec: d.durationSec,
        })),
        express_mode_active: expressModeActive,
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
        setCameraNotice('Camera permission unavailable — running hands-free biomechanics cadence.')
        void trackEvent('client_runtime_diagnostic', {
          diagnostic_kind: 'camera_permission',
          camera_permission_state: 'denied',
          component_context: 'CameraReadinessCheck',
        })
      }
    } else {
      setCameraNotice('Live camera stream unavailable in this browser — running hands-free cadence.')
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

  const isRepLocked = currentRep === 3

  return (
    <section
      data-testid="camera-readiness-check"
      aria-label="30-Second Pre-Workout Camera Readiness Check"
      className="forge-surface-card mb-3 space-y-3.5 rounded-2xl p-4 text-zinc-100 sm:p-5"
    >
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              33-Point Readiness · 30s Check
            </span>
            {expressModeActive && (
              <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums text-amber-300">
                20m Express Cap: Max 90s Warm-Up
              </span>
            )}
          </div>
          <h3
            className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl"
            style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}
          >
            30-Second Camera Readiness Check
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSfxMuted}
            aria-label="Readiness audio cues"
            aria-pressed={!sfxMuted}
            className={`forge-tactile-press inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
              sfxMuted
                ? 'border-white/10 bg-[#181B22] text-zinc-400 hover:border-white/15 hover:bg-[#1D212A] hover:text-zinc-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
            }`}
          >
            {sfxMuted ? 'SFX MUTED' : 'SFX ON'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-[#181B22] px-3.5 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            Skip to Workout →
          </button>
        </div>
      </div>

      {/* Screen Selector */}
      {!isScanning && !result && (
        <>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setScreenMode('overhead_squat')}
              aria-pressed={screenMode === 'overhead_squat'}
              className={`forge-tactile-press min-h-[44px] rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                screenMode === 'overhead_squat'
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-white'
                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              <div className="text-xs font-bold tabular-nums text-white">3 Bodyweight Overhead Squats</div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                Ankle dorsiflexion · Hip depth · Knee valgus · Torso lean
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScreenMode('scapular_wall_slides')}
              aria-pressed={screenMode === 'scapular_wall_slides'}
              className={`forge-tactile-press min-h-[44px] rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                screenMode === 'scapular_wall_slides'
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-white'
                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              <div className="text-xs font-bold tabular-nums text-white">3 Scapular Wall Slides</div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
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
              aria-pressed={screenMode === 'dual_screen'}
              className={`forge-tactile-press min-h-[44px] rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D] ${
                screenMode === 'dual_screen'
                  ? 'border-amber-500/35 bg-amber-500/10 text-white'
                  : 'border-white/10 bg-[#181B22] text-zinc-200 hover:border-white/15 hover:bg-[#1D212A]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white">Dual-Screen Full Check</span>
                {!allowDualScreen && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-amber-300">
                    PLUS
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                Lower + Upper kinetic chain + trend alerts
              </div>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void startThirtySecondCheck()}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              <GaaIcon name="camera" size={14} tone="dark" />
              <span>Start 3-Rep Camera Check</span>
            </button>

            {/* Dev / Preview Simulate Readiness Check Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="simulate-readiness-preset"
                className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400"
              >
                Simulate Readiness Check:
              </label>
              <select
                id="simulate-readiness-preset"
                value={selectedPreset}
                onChange={e => handleSimulatePreset(e.target.value as ReadinessPresetId)}
                className="min-h-[44px] cursor-pointer rounded-xl border border-white/10 bg-[#181B22] px-3 py-2 text-base text-white transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
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
                className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 transition-colors duration-150 hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
              >
                Run Preset
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active 3-Rep Computer-Vision HUD */}
      {isScanning && (
        <div
          className={`relative overflow-hidden rounded-2xl border bg-[#090A0D] p-3.5 transition-colors duration-300 ${
            isRepLocked ? 'border-emerald-400/70' : 'border-amber-400/70'
          }`}
        >
          <div className="relative overflow-hidden rounded-xl bg-[#090A0D]">
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: 215,
                objectFit: 'cover',
                display: 'block',
                background: '#090A0D',
              }}
            />

            {/* Frosted-Glass Top Instruction Pill */}
            <div className="forge-glass-pill absolute inset-x-2.5 top-2.5 z-10 flex items-center justify-between gap-2 rounded-full px-3 py-1.5 text-[11.5px] text-zinc-100">
              <span className="truncate font-medium">
                Frame full body in lens · <strong className="tabular-nums text-white">Rep {currentRep} of 3</strong>
              </span>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ${
                  isRepLocked
                    ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                    : 'border-amber-500/35 bg-amber-500/15 text-amber-300'
                }`}
              >
                {isRepLocked ? 'LOCKED' : 'TRACKING'}
              </span>
            </div>

            {/* Corner Framing Brackets + Glowing Vector Skeleton Overlay */}
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              <defs>
                <filter id="readiness-hud-glow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="0.7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 5 16 L 5 9 L 13 9 M 87 9 L 95 9 L 95 16 M 5 48 L 5 55 L 13 55 M 87 55 L 95 55 L 95 48"
                fill="none"
                stroke={isRepLocked ? '#34D399' : '#FBBF24'}
                strokeWidth="0.9"
                strokeLinecap="round"
                style={{ transition: 'stroke 260ms ease' }}
              />
              <g filter="url(#readiness-hud-glow)" opacity="0.88">
                <line x1="50" y1="16" x2="50" y2="33" stroke={isRepLocked ? '#34D399' : '#FBBF24'} strokeWidth="0.75" />
                <line x1="42" y1="21" x2="58" y2="21" stroke={isRepLocked ? '#34D399' : '#FBBF24'} strokeWidth="0.75" />
                <line x1="42" y1="21" x2="38" y2="12" stroke="#34D399" strokeWidth="0.65" />
                <line x1="58" y1="21" x2="62" y2="12" stroke="#34D399" strokeWidth="0.65" />
                <line x1="45" y1="33" x2="55" y2="33" stroke={isRepLocked ? '#34D399' : '#FBBF24'} strokeWidth="0.75" />
                <line x1="45" y1="33" x2="43" y2="49" stroke="#34D399" strokeWidth="0.75" />
                <line x1="55" y1="33" x2="57" y2="49" stroke="#34D399" strokeWidth="0.75" />
              </g>
              {[
                { x: 50, y: 15 },
                { x: 42, y: 21 },
                { x: 58, y: 21 },
                { x: 45, y: 33 },
                { x: 55, y: 33 },
                { x: 43, y: 49 },
                { x: 57, y: 49 },
              ].map((pt, i) => (
                <g key={i} opacity={0.94 - i * 0.03}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="2.1"
                    fill={isRepLocked ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}
                    stroke={isRepLocked ? 'rgba(52,211,153,0.5)' : 'rgba(251,191,36,0.5)'}
                    strokeWidth="0.35"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="1.05"
                    fill="#090A0D"
                    stroke="#FFFFFF"
                    strokeWidth="0.55"
                  />
                </g>
              ))}
            </svg>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span
              className={`font-mono text-xs font-extrabold uppercase tracking-wider tabular-nums ${
                isRepLocked ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              Rep {currentRep} of 3
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(r => (
                <span
                  key={r}
                  className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                    r <= currentRep
                      ? isRepLocked
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-2 text-xs font-medium leading-relaxed text-zinc-100 sm:text-sm">
            {REP_CUES[screenMode][currentRep - 1]}
          </div>

          {cameraNotice && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#181B22] px-3 py-2 text-xs text-zinc-300">
              <span>{cameraNotice}</span>
              <button
                type="button"
                onClick={() => handleSimulatePreset(selectedPreset)}
                className="forge-tactile-press min-h-[44px] rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-300 transition-colors hover:bg-emerald-500/25"
              >
                Run Demo Scan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Evaluated Readiness Score & Warm-Up Preview */}
      {result && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-[#181B22]/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TelemetryRingGauge
                score={result.readinessScore}
                max={100}
                size={60}
                strokeWidth={4.5}
                showMax
                tone={result.readinessScore >= 85 ? 'emerald' : 'amber'}
                label={`Forge Readiness Score ${result.readinessScore} out of 100`}
              />
              <div>
                <div className="forge-eyebrow-micro">Forge Readiness Score</div>
                <div
                  className={`mt-0.5 font-mono text-2xl font-extrabold tabular-nums ${
                    result.readinessScore >= 85 ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {result.readinessScore}
                  <span className="text-xs font-medium text-zinc-400">/100</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {result.checks.map(chk => (
                <span
                  key={chk.id}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-semibold tabular-nums ${
                    chk.status === 'optimal'
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                  }`}
                >
                  {chk.label}: {chk.measuredDeg}°
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
            {result.coachSummary}
          </p>

          {result.injectedDrills.length > 0 && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-200">
              <strong className="tabular-nums text-amber-100">
                Auto-Injecting {result.injectedDrills.length} Corrective Drills ({result.totalInjectedDurationSec}s
                {expressModeActive ? ' · 20m Express Capped' : ''}):
              </strong>{' '}
              {result.injectedDrills.map(d => d.name).join(' · ')}
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() =>
                onComplete({
                  readinessScore: result.readinessScore,
                  injectedDrills: result.injectedDrills,
                  restrictionFlags: result.restrictionFlags,
                })
              }
              className="forge-tactile-press min-h-[44px] flex-1 basis-52 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              {result.injectedDrills.length > 0
                ? 'Apply Warm-Up & Begin Set 1 →'
                : 'Begin Today’s Workout →'}
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="forge-tactile-press min-h-[44px] rounded-xl border border-white/10 bg-[#090A0D] px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#111318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Re-Scan
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
