import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { resolveExerciseVideoEmbed, extractYouTubeVideoId } from '@/lib/nasm-exercise-video-catalog'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import ExerciseVideoModal, { ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { syncActivityToAppleHealth } from '@/lib/native-healthkit-bridge'

interface ClinicalCoolDownModuleProps {
  workoutDay?: number
  workoutFocus?: string
  notes?: string | null
  exercises?: Array<{ name: string; block?: string | null }>
  onCoolDownCompleted?: (day: number) => void
  onFlowToBreathwork?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onOpenExerciseModal?: (exercise: ExerciseModalData) => void
  planId?: string | null
  workoutWeek?: number
  sessionDate?: string | null
  isCompleted?: boolean
}

interface CoolDownItem {
  id: string
  phaseNumber: number
  phaseLabel: string
  name: string
  target: string
  protocol: string
  durationSec: number
  instructions: string[]
  clinicalRationale: string
}

export type BreathPatternType = '4-7-8' | '4-6' | 'box' | '5-5'

export interface BreathPhase {
  type: 'inhale' | 'hold-in' | 'exhale' | 'hold-out'
  duration: number
  label: string
  actionText: string
  cue: string
  color: string
}

export interface BreathPatternConfig {
  id: BreathPatternType
  name: string
  shortName: string
  description: string
  phases: BreathPhase[]
  defaultCycles: number
}

export const BREATH_PATTERNS: Record<BreathPatternType, BreathPatternConfig> = {
  '4-7-8': {
    id: '4-7-8',
    name: '4-7-8 Parasympathetic Reset',
    shortName: '4-7-8 Relax',
    description: 'Inhale 4s · Hold 7s · Exhale 8s (Activates vagal brake & lowers cortisol)',
    phases: [
      { type: 'inhale', duration: 4, label: 'IN', actionText: 'BREATHE IN', cue: 'Inhale deeply through nose, expand abdomen', color: '#60A5FA' },
      { type: 'hold-in', duration: 7, label: 'HOLD', actionText: 'HOLD BREATH', cue: 'Hold gently with lungs full, relax shoulders', color: '#A78BFA' },
      { type: 'exhale', duration: 8, label: 'OUT', actionText: 'BREATHE OUT', cue: 'Slowly release breath through mouth with a soft whoosh', color: '#34D399' },
    ],
    defaultCycles: 6,
  },
  '4-6': {
    id: '4-6',
    name: '4-6 Calming Extended Exhale',
    shortName: '4-6 Calming',
    description: 'Inhale 4s · Exhale 6s (Extended exhale to trigger immediate parasympathetic calm)',
    phases: [
      { type: 'inhale', duration: 4, label: 'IN', actionText: 'BREATHE IN', cue: 'Inhale smoothly through nose for 4 seconds', color: '#60A5FA' },
      { type: 'exhale', duration: 6, label: 'OUT', actionText: 'BREATHE OUT', cue: 'Slowly and smoothly exhale for 6 seconds to calm the nervous system', color: '#34D399' },
    ],
    defaultCycles: 8,
  },
  box: {
    id: 'box',
    name: '4-4-4-4 Box Breathing',
    shortName: 'Box 4-4-4-4',
    description: 'Inhale 4s · Hold 4s · Exhale 4s · Hold 4s (Downregulates sympathetic fight-or-flight)',
    phases: [
      { type: 'inhale', duration: 4, label: 'IN', actionText: 'BREATHE IN', cue: 'Inhale smoothly through nose', color: '#60A5FA' },
      { type: 'hold-in', duration: 4, label: 'HOLD', actionText: 'HOLD FULL', cue: 'Hold breath with calm focus', color: '#A78BFA' },
      { type: 'exhale', duration: 4, label: 'OUT', actionText: 'BREATHE OUT', cue: 'Exhale steadily through mouth', color: '#34D399' },
      { type: 'hold-out', duration: 4, label: 'PAUSE', actionText: 'HOLD EMPTY', cue: 'Pause with lungs empty before next inhale', color: '#F59E0B' },
    ],
    defaultCycles: 6,
  },
  '5-5': {
    id: '5-5',
    name: '5-5 Coherent Breathing',
    shortName: '5-5 Coherent',
    description: 'Inhale 5s · Exhale 5s (Optimal heart rate variability & rhythm balance)',
    phases: [
      { type: 'inhale', duration: 5, label: 'IN', actionText: 'BREATHE IN', cue: 'Inhale smoothly for 5 seconds', color: '#60A5FA' },
      { type: 'exhale', duration: 5, label: 'OUT', actionText: 'BREATHE OUT', cue: 'Exhale smoothly for 5 seconds', color: '#34D399' },
    ],
    defaultCycles: 8,
  },
}

export interface ParsedBreathwork {
  patternId: BreathPatternType
  customConfig?: BreathPatternConfig
  targetCycles: number
  totalDurationSec: number
  name: string
  protocol: string
  instructions: string[]
  rationale: string
}

export function parseRequestedBreathwork(
  name?: string,
  protocol?: string,
  instructions?: string[],
  durationSec?: number,
  notes?: string | null,
  workoutFocus?: string
): ParsedBreathwork {
  const text = `${name || ''} ${protocol || ''} ${(instructions || []).join(' ')} ${notes || ''} ${workoutFocus || ''}`.toLowerCase()

  let patternId: BreathPatternType = '4-7-8'
  let customConfig: BreathPatternConfig | undefined = undefined

  // 1. Check for 4-6 Calming Breath (Extended Exhalation)
  if (
    text.includes('4-6') ||
    text.includes('4/6') ||
    text.includes('4 - 6') ||
    text.includes('4-0-6') ||
    text.includes('4s in, 6s out') ||
    text.includes('4s in 6s out') ||
    text.includes('calming breath') ||
    text.includes('extended exhale') ||
    text.includes('extended exhalation')
  ) {
    patternId = '4-6'
  }
  // 2. Check for Box Breathing (4-4-4-4)
  else if (
    text.includes('box') ||
    text.includes('4-4-4-4') ||
    text.includes('4/4/4/4') ||
    text.includes('square') ||
    text.includes('4s in, 4s hold')
  ) {
    patternId = 'box'
  }
  // 3. Check for 5-5 Coherent Breathing
  else if (
    text.includes('5-5') ||
    text.includes('5/5') ||
    text.includes('coherent') ||
    text.includes('resonant') ||
    text.includes('5s in, 5s out')
  ) {
    patternId = '5-5'
  }
  // 4. Check for 4-7-8 Parasympathetic
  else if (
    text.includes('4-7-8') ||
    text.includes('4/7/8') ||
    text.includes('4s in, 7s hold, 8s out') ||
    text.includes('vagal')
  ) {
    patternId = '4-7-8'
  }

  // 5. Check for custom in/hold/out tempo format e.g. "Inhale 4s, Hold 2s, Exhale 6s"
  const customTempoMatch = text.match(/inhale\s*(\d+)\s*s?.*?hold\s*(\d+)\s*s?.*?exhale\s*(\d+)\s*s?/i)
  if (customTempoMatch) {
    const inSec = parseInt(customTempoMatch[1], 10) || 4
    const holdSec = parseInt(customTempoMatch[2], 10) || 0
    const outSec = parseInt(customTempoMatch[3], 10) || 6

    const phases: BreathPhase[] = [
      { type: 'inhale', duration: inSec, label: 'IN', actionText: 'BREATHE IN', cue: `Inhale smoothly through nose for ${inSec}s`, color: '#60A5FA' },
    ]
    if (holdSec > 0) {
      phases.push({ type: 'hold-in', duration: holdSec, label: 'HOLD', actionText: 'HOLD FULL', cue: `Hold breath gently for ${holdSec}s`, color: '#A78BFA' })
    }
    phases.push({ type: 'exhale', duration: outSec, label: 'OUT', actionText: 'BREATHE OUT', cue: `Exhale smoothly for ${outSec}s`, color: '#34D399' })

    const totalPhaseSec = inSec + holdSec + outSec
    customConfig = {
      id: patternId,
      name: `Coach Prescribed Breath (${inSec}-${holdSec > 0 ? `${holdSec}-` : ''}${outSec})`,
      shortName: `${inSec}-${holdSec > 0 ? `${holdSec}-` : ''}${outSec}`,
      description: `Inhale ${inSec}s · ${holdSec > 0 ? `Hold ${holdSec}s · ` : ''}Exhale ${outSec}s`,
      phases,
      defaultCycles: Math.max(4, Math.round(120 / totalPhaseSec)),
    }
  }

  const activeConfig = customConfig || BREATH_PATTERNS[patternId]
  const singleCycleSec = activeConfig.phases.reduce((sum, p) => sum + p.duration, 0)

  // 6. Parse Duration & Target Cycles
  let totalDurationSec = durationSec || 120
  let explicitCycles: number | null = null

  const cycleMatch = text.match(/(\d+)\s*(?:cycles|breaths|reps)/i)
  if (cycleMatch) {
    explicitCycles = parseInt(cycleMatch[1], 10)
  }

  const minMatch = text.match(/(\d+)\s*(?:min|mins|minute|minutes)/i)
  if (minMatch && !durationSec) {
    totalDurationSec = parseInt(minMatch[1], 10) * 60
  }

  let targetCycles: number
  if (explicitCycles && explicitCycles > 0) {
    targetCycles = explicitCycles
    totalDurationSec = targetCycles * singleCycleSec
  } else {
    targetCycles = Math.max(2, Math.round(totalDurationSec / singleCycleSec))
  }

  return {
    patternId,
    customConfig,
    targetCycles,
    totalDurationSec,
    name: activeConfig.name,
    protocol: `${Math.round(totalDurationSec / 60)} mins (${targetCycles} cycles · ${activeConfig.shortName})`,
    instructions: [
      `1. Pattern: ${activeConfig.description}.`,
      `2. Sit with tall spine or lie comfortably on your back with relaxed shoulders.`,
      `3. Follow the guided breath pacer for ${targetCycles} full cycles (${totalDurationSec}s total duration).`,
    ],
    rationale: 'NASM Autonomic Science: Regulates autonomic tone, lowers heart rate and blood pressure, suppresses cortisol, and shifts into parasympathetic recovery.',
  }
}

export function ClinicalBreathPacer({
  onComplete,
  defaultPattern = '4-7-8',
  requestedItem,
  requestedDurationSec,
  requestedCycles,
  compact = false,
}: {
  onComplete?: () => void
  defaultPattern?: BreathPatternType
  requestedItem?: { name?: string; protocol?: string; instructions?: string[]; durationSec?: number; notes?: string }
  requestedDurationSec?: number
  requestedCycles?: number
  compact?: boolean
}) {
  const parsed = useMemo(() => {
    if (requestedItem) {
      return parseRequestedBreathwork(
        requestedItem.name,
        requestedItem.protocol,
        requestedItem.instructions,
        requestedItem.durationSec || requestedDurationSec,
        requestedItem.notes
      )
    }
    return null
  }, [requestedItem, requestedDurationSec])

  const initialPattern = parsed?.patternId || defaultPattern
  const [patternType, setPatternType] = useState<BreathPatternType>(initialPattern)
  const currentConfig = (patternType === parsed?.patternId && parsed?.customConfig) ? parsed.customConfig : BREATH_PATTERNS[patternType]

  const initialTargetCycles = requestedCycles || (parsed && patternType === parsed.patternId ? parsed.targetCycles : currentConfig.defaultCycles)

  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [phaseIndex, setPhaseIndex] = useState<number>(0)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(currentConfig.phases[0].duration)
  const [currentCycle, setCurrentCycle] = useState<number>(1)
  const [targetCycles, setTargetCycles] = useState<number>(initialTargetCycles)
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const [appleHealthSyncMsg, setAppleHealthSyncMsg] = useState<string | null>(null)

  const currentPhase = currentConfig.phases[phaseIndex] || currentConfig.phases[0]

  const selectPattern = (newPattern: BreathPatternType) => {
    setPatternType(newPattern)
    const cfg = BREATH_PATTERNS[newPattern]
    const cycleSec = cfg.phases.reduce((sum, p) => sum + p.duration, 0)
    const targetTotalSec = parsed?.totalDurationSec || (requestedDurationSec || 120)
    const newCycles = Math.max(2, Math.round(targetTotalSec / cycleSec))

    setPhaseIndex(0)
    setSecondsRemaining(cfg.phases[0].duration)
    setCurrentCycle(1)
    setTargetCycles(newCycles)
    setIsRunning(false)
    setIsFinished(false)
    setAppleHealthSyncMsg(null)
  }

  const resetPacer = () => {
    setPhaseIndex(0)
    setSecondsRemaining(currentConfig.phases[0].duration)
    setCurrentCycle(1)
    setIsRunning(false)
    setIsFinished(false)
    setAppleHealthSyncMsg(null)
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    if (isRunning && !isFinished) {
      timer = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev > 1) {
            return prev - 1
          }
          const phases = currentConfig.phases
          const nextIdx = (phaseIndex + 1) % phases.length
          if (nextIdx === 0) {
            if (currentCycle >= targetCycles) {
              setIsRunning(false)
              setIsFinished(true)
              if (onComplete) onComplete()

              // Log mindful minutes to Apple Health
              const cycleSec = phases.reduce((s, p) => s + p.duration, 0)
              const totalMins = Math.max(1, Math.round((targetCycles * cycleSec) / 60))
              syncActivityToAppleHealth({
                type: 'mindfulness',
                durationMinutes: totalMins,
                notes: `NASM Post-Workout Breathwork: ${currentConfig.name} (${totalMins} min)`,
              }).then(res => {
                if (res.synced) {
                  setAppleHealthSyncMsg(
                    res.source === 'native-healthkit'
                      ? '✓ Synced to Apple Health'
                      : '✓ Synced to Wearables'
                  )
                }
              }).catch(() => {})

              return 0
            } else {
              setCurrentCycle(c => c + 1)
              setPhaseIndex(0)
              return phases[0].duration
            }
          } else {
            setPhaseIndex(nextIdx)
            return phases[nextIdx].duration
          }
        })
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isRunning, isFinished, phaseIndex, currentConfig, currentCycle, targetCycles, onComplete])

  const orbScale = !isRunning && !isFinished
    ? 1
    : currentPhase.type === 'inhale'
      ? 1.25
      : currentPhase.type === 'hold-in'
        ? 1.25
        : 0.85

  const orbColor = isFinished
    ? '#10B981'
    : !isRunning
      ? '#60A5FA'
      : currentPhase.color

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(13,27,42,0.92) 0%, rgba(8,16,28,0.96) 100%)',
        border: `1px solid ${orbColor}50`,
        borderRadius: 10,
        padding: compact ? '12px 14px' : '18px 20px',
        textAlign: 'center',
        marginTop: 8,
        boxShadow: `0 8px 30px ${orbColor}20`,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Pattern Selector Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['4-7-8', '4-6', 'box', '5-5'] as BreathPatternType[]).map(pKey => {
          const cfg = BREATH_PATTERNS[pKey]
          const isSelected = patternType === pKey
          return (
            <button
              key={pKey}
              type="button"
              onClick={() => selectPattern(pKey)}
              style={{
                background: isSelected ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.05)',
                border: isSelected ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.12)',
                color: isSelected ? '#93C5FD' : 'var(--gray)',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cfg.shortName}
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
        {currentConfig.description}
      </div>

      {/* Animated Glowing Breath Orb */}
      <div style={{ height: compact ? 150 : 180, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div
          style={{
            width: compact ? 120 : 140,
            height: compact ? 120 : 140,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orbColor}35 0%, ${orbColor}10 70%, transparent 100%)`,
            border: `3px solid ${orbColor}`,
            boxShadow: isRunning ? `0 0 35px ${orbColor}60` : `0 0 15px ${orbColor}25`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${orbScale})`,
            transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.8s ease, box-shadow 0.8s ease, background 0.8s ease',
            userSelect: 'none',
          }}
        >
          {isFinished ? (
            <>
              <div style={{ fontSize: 28, color: '#10B981' }}>✓</div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Complete
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: orbColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 1,
                }}
              >
                {isRunning ? currentPhase.actionText : 'READY'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-telemetry, monospace)',
                  fontSize: compact ? 32 : 40,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  lineHeight: 1,
                }}
              >
                {isRunning ? `${secondsRemaining}s` : `${currentPhase.duration}s`}
              </div>
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isRunning ? `${currentPhase.label} (${currentPhase.duration}s)` : 'Press Start'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Real-time coaching cue text */}
      <div
        style={{
          minHeight: 34,
          fontSize: 12,
          fontWeight: 600,
          color: isFinished ? '#A7F3D0' : '#E2E8F0',
          margin: '10px 0 8px',
          padding: '6px 10px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1.35,
        }}
      >
        {isFinished ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="celebration" size={14} tone="emerald" />
              <span>Parasympathetic recovery completed! Autonomic tone restored.</span>
            </span>
            {appleHealthSyncMsg && (
              <span style={{ fontSize: 11, color: '#34D399', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>🍎</span> {appleHealthSyncMsg}
              </span>
            )}
          </div>
        ) : isRunning ? (
          currentPhase.cue
        ) : (
          'Find a comfortable position with shoulders relaxed and spine neutral.'
        )}
      </div>

      {/* Cycle Progress Tracker */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--gray)', marginBottom: 3 }}>
          <span>Breath Cycles</span>
          <span style={{ color: '#93C5FD', fontWeight: 700 }}>
            {isFinished ? `Done (${targetCycles}/${targetCycles})` : `Cycle ${currentCycle} of ${targetCycles}`}
          </span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${isFinished ? 100 : Math.round(((currentCycle - 1 + (1 - secondsRemaining / currentPhase.duration)) / targetCycles) * 100)}%`,
              background: 'linear-gradient(90deg, #60A5FA 0%, #34D399 100%)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Controller Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!isRunning ? (
          <button
            type="button"
            onClick={() => {
              if (isFinished) {
                resetPacer()
              }
              setIsRunning(true)
            }}
            style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
              border: 'none',
              color: '#FFFFFF',
              padding: '7px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {isFinished ? (
              <>
                <GaaIcon name="rotate-ccw" size={11} tone="inherit" />
                <span>Restart Breathing</span>
              </>
            ) : (
              <>
                <GaaIcon name="play" size={11} tone="inherit" />
                <span>Start Breathing Pacer</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsRunning(false)}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#FFFFFF',
              padding: '7px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="pause" size={11} tone="inherit" />
            <span>Pause</span>
          </button>
        )}

        <button
          type="button"
          onClick={resetPacer}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--gray)',
            padding: '7px 12px',
            borderRadius: 6,
            fontSize: 11.5,
            cursor: 'pointer',
          }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  )
}

export function getCoolDownStorageKey(
  planId?: string | null,
  week?: number,
  day?: number,
  sessionDate?: string | null
): string {
  const p = planId ? `p_${planId}_` : ''
  const w = typeof week === 'number' ? `w${week}_` : ''
  const d = typeof day === 'number' ? `d${day}` : 'd1'
  const dt = sessionDate ? `_${sessionDate}` : ''
  return `sgf_cooldown_done_${p}${w}${d}${dt}`
}

export function isFutureCoolDownSession(
  sessionDate?: string | null,
  workoutWeek?: number,
  currentWeek?: number
): boolean {
  if (sessionDate) {
    const today = new Date().toISOString().slice(0, 10)
    if (sessionDate > today) return true
  }
  if (typeof workoutWeek === 'number' && typeof currentWeek === 'number' && workoutWeek > currentWeek) {
    return true
  }
  return false
}

export function cleanupLegacyCoolDownKeys(): void {
  if (typeof window === 'undefined') return
  try {
    for (let d = 1; d <= 14; d++) {
      localStorage.removeItem(`sgf_cooldown_done_day_${d}`)
    }
  } catch {}
}

export default function ClinicalCoolDownModule({
  workoutDay = 1,
  workoutFocus = 'Full-Body Recovery & Autonomic Downregulation',
  notes,
  exercises = [],
  onCoolDownCompleted,
  onFlowToBreathwork,
  isCollapsed,
  onToggleCollapse,
  onOpenExerciseModal,
  planId,
  workoutWeek,
  sessionDate,
  isCompleted: _isCompleted,
}: ClinicalCoolDownModuleProps) {
  const [localCollapsed, setLocalCollapsed] = useState<boolean>(false)
  const collapsed = isCollapsed !== undefined ? isCollapsed : localCollapsed
  const handleToggleCollapse = onToggleCollapse ?? (() => setLocalCollapsed(p => !p))

  const isFuture = useMemo(() => {
    return isFutureCoolDownSession(sessionDate, workoutWeek)
  }, [sessionDate, workoutWeek])

  const storageKey = useMemo(() => {
    return getCoolDownStorageKey(planId, workoutWeek, workoutDay, sessionDate)
  }, [planId, workoutWeek, workoutDay, sessionDate])

  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined' || isFuture) return {}
    try {
      cleanupLegacyCoolDownKeys()
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Synchronize when active plan, week, day, or session date changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isFuture) {
      setCompletedItems({})
      return
    }
    try {
      cleanupLegacyCoolDownKeys()
      const saved = localStorage.getItem(storageKey)
      setCompletedItems(saved ? JSON.parse(saved) : {})
    } catch {
      setCompletedItems({})
    }
  }, [storageKey, isFuture])

  const [guidedModalOpen, setGuidedModalOpen] = useState<boolean>(false)
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(30)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [activeInlineTimerId, setActiveInlineTimerId] = useState<string | null>(null)
  const [inlineTimerSeconds, setInlineTimerSeconds] = useState<number>(30)
  const [activeMovementModal, setActiveMovementModal] = useState<CoolDownItem | null>(null)

  const openMovementModal = useCallback((item: CoolDownItem) => {
    if (onOpenExerciseModal) {
      onOpenExerciseModal({
        name: item.name,
        block: item.phaseLabel,
        description: item.protocol || item.target || item.clinicalRationale,
        coachingCues: [item.clinicalRationale],
        instructions: item.instructions,
        phaseLabel: item.phaseLabel,
      })
    } else {
      setActiveMovementModal(item)
    }
  }, [onOpenExerciseModal])

  // Dynamically tailor stretches and SMR based on session focus and exercises
  const isUpper = workoutFocus.toLowerCase().includes('upper') || workoutFocus.toLowerCase().includes('push') || workoutFocus.toLowerCase().includes('pull')
  const isLower = workoutFocus.toLowerCase().includes('lower') || workoutFocus.toLowerCase().includes('leg') || workoutFocus.toLowerCase().includes('squat') || workoutFocus.toLowerCase().includes('deadlift')

  const coolDownItems: CoolDownItem[] = useMemo(() => {
    // Check if any specific breathing exercise was passed in exercises or notes
    const explicitBreathEx = exercises.find(e =>
      e.name.toLowerCase().includes('breath') ||
      (e.block === 'cooldown' && (e.name.toLowerCase().includes('downregulation') || e.name.toLowerCase().includes('recovery')))
    )

    const parsedBreath = parseRequestedBreathwork(
      explicitBreathEx?.name,
      undefined,
      undefined,
      undefined,
      notes,
      workoutFocus
    )

    const items: CoolDownItem[] = [
      {
        id: `cd-stretch-1-${workoutDay}`,
        phaseNumber: 1,
        phaseLabel: '1. Static Stretching (Length-Tension Reset)',
        name: isLower
          ? 'static kneeling hip flexor stretch'
          : isUpper
            ? 'static latissimus dorsi ball stretch'
            : 'static kneeling hip flexor stretch',
        target: isLower
          ? 'Psoas & Rectus Femoris (Hip Flexors)'
          : isUpper
            ? 'Latissimus Dorsi & Shoulder Girdle'
            : 'Hip Flexors & Lumbo-Pelvic Hip Complex',
        protocol: 'Hold 30s per side (no bouncing)',
        durationSec: 60,
        instructions: [
          '1. Move gently into the stretch until you feel comfortable elongation without pain.',
          '2. Maintain neutral spine and pelvis (posterior pelvic tilt).',
          '3. Hold statically for 30 seconds per side while breathing deeply.',
        ],
        clinicalRationale: 'NASM Ch. 5 & 20: Autogenic inhibition via Golgi Tendon Organs (GTO) resets resting sarcomere length.',
      },
      {
        id: `cd-stretch-2-${workoutDay}`,
        phaseNumber: 2,
        phaseLabel: '2. Secondary Static Stretch',
        name: isLower
          ? 'static 90 90 hamstring stretch'
          : isUpper
            ? 'static upper trapezius stretch'
            : 'static 90 90 hamstring stretch',
        target: isLower ? 'Hamstrings Complex & Calves' : 'Upper Trapezius & Neck Extensors',
        protocol: 'Hold 30s per side',
        durationSec: 60,
        instructions: [
          '1. Lie back or sit tall with neutral alignment.',
          '2. Gently extend limb until mild tension is felt in target muscle belly.',
          '3. Exhale smoothly and hold position for 30s per side.',
        ],
        clinicalRationale: 'NASM Clinical Guideline: Restores reciprocal length-tension balance and eliminates post-lifting tonic spasm.',
      },
      {
        id: `cd-smr-${workoutDay}`,
        phaseNumber: 3,
        phaseLabel: '3. SMR Myofascial Downregulation',
        name: isLower
          ? 'self myofascial release smr quadriceps'
          : isUpper
            ? 'self myofascial release smr thoracic spine'
            : 'foam roll calves',
        target: isLower ? 'Quadriceps & IT-Band Complex' : 'Thoracic Spine Extensors & Lats',
        protocol: 'Hold tender spots 30–60s',
        durationSec: 60,
        instructions: [
          '1. Position foam roller beneath heavily worked muscle group.',
          '2. Roll slowly along muscle belly to locate focal areas of high tone (trigger points).',
          '3. Hold steady bodyweight compression on tender spots for 30–60 seconds to stimulate tissue release.',
        ],
        clinicalRationale: 'NASM Ch. 5: Calms hyperactive muscle spindle afferents and stimulates interstitial fluid exchange.',
      },
      {
        id: `cd-breath-${workoutDay}`,
        phaseNumber: 4,
        phaseLabel: '4. Parasympathetic Recovery Reset',
        name: parsedBreath.name,
        target: 'Vagus Nerve & Autonomic Downregulation',
        protocol: parsedBreath.protocol,
        durationSec: parsedBreath.totalDurationSec,
        instructions: parsedBreath.instructions,
        clinicalRationale: parsedBreath.rationale,
      },
    ]

    return items
  }, [workoutDay, workoutFocus, isUpper, isLower, notes, exercises])

  const allCompleted = coolDownItems.length > 0 && coolDownItems.every(item => completedItems[item.id])

  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)

  const effectiveOpenStepId = useMemo(() => {
    if (expandedStepId !== null) {
      return expandedStepId === 'none' ? null : expandedStepId
    }
    const firstUnfinished = coolDownItems.find(item => !completedItems[item.id])
    return firstUnfinished ? firstUnfinished.id : (coolDownItems[0]?.id ?? null)
  }, [expandedStepId, coolDownItems, completedItems])

  const toggleItem = useCallback((id: string) => {
    const isNowDone = !completedItems[id]
    const updated = { ...completedItems, [id]: isNowDone }
    setCompletedItems(updated)
    if (typeof window !== 'undefined' && !isFuture) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {}
    }
    if (coolDownItems.every(item => updated[item.id]) && onCoolDownCompleted) {
      onCoolDownCompleted(workoutDay)
    }

    // Auto-advance to next step if marking done
    if (isNowDone) {
      const curIdx = coolDownItems.findIndex(item => item.id === id)
      if (curIdx >= 0 && curIdx + 1 < coolDownItems.length) {
        setExpandedStepId(coolDownItems[curIdx + 1].id)
      }
    }
  }, [completedItems, coolDownItems, isFuture, onCoolDownCompleted, storageKey, workoutDay])

  const markAllComplete = () => {
    const updated: Record<string, boolean> = {}
    coolDownItems.forEach(item => {
      updated[item.id] = true
    })
    setCompletedItems(updated)
    if (typeof window !== 'undefined' && !isFuture) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {}
    }
    if (onCoolDownCompleted) {
      onCoolDownCompleted(workoutDay)
    }
  }

  // Inline Step Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (activeInlineTimerId && inlineTimerSeconds > 0) {
      interval = setInterval(() => {
        setInlineTimerSeconds(prev => prev - 1)
      }, 1000)
    } else if (inlineTimerSeconds === 0 && activeInlineTimerId) {
      toggleItem(activeInlineTimerId)
      setActiveInlineTimerId(null)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeInlineTimerId, inlineTimerSeconds, toggleItem])

  const startInlineTimer = (item: CoolDownItem) => {
    if (activeInlineTimerId === item.id) {
      setActiveInlineTimerId(null)
    } else {
      setActiveInlineTimerId(item.id)
      setInlineTimerSeconds(item.durationSec)
    }
  }

  // Guided Modal Timer Countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (guidedModalOpen && isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => prev - 1)
      }, 1000)
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      const currentItem = coolDownItems[activeStepIndex]
      if (currentItem) {
        toggleItem(currentItem.id)
      }
      setIsTimerRunning(false)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [guidedModalOpen, isTimerRunning, timerSecondsLeft, activeStepIndex, coolDownItems, toggleItem])

  const startGuidedFlow = () => {
    setActiveStepIndex(0)
    setTimerSecondsLeft(coolDownItems[0]?.durationSec ?? 60)
    setIsTimerRunning(true)
    setGuidedModalOpen(true)
  }

  const nextGuidedStep = () => {
    const nextIdx = activeStepIndex + 1
    if (nextIdx < coolDownItems.length) {
      setActiveStepIndex(nextIdx)
      setTimerSecondsLeft(coolDownItems[nextIdx]?.durationSec ?? 60)
      setIsTimerRunning(true)
    } else {
      markAllComplete()
      setGuidedModalOpen(false)
    }
  }

  const activeItem = coolDownItems[activeStepIndex]

  return (
    <section
      aria-label="Post-Workout Clinical Cool-Down"
      style={{
        marginTop: 20,
        border: allCompleted ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(96,165,250,0.35)',
        background: allCompleted
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,20,30,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(96,165,250,0.08) 0%, rgba(10,16,28,0.95) 100%)',
        borderRadius: 8,
        padding: 'clamp(10px, 3vw, 16px)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
        maxWidth: '100%',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
          paddingBottom: collapsed ? 0 : 12,
          marginBottom: collapsed ? 0 : 14,
        }}
      >
        <div style={{ minWidth: 0, flex: '1 1 240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                background: allCompleted ? '#10B981' : '#60A5FA',
                color: '#0A0E18',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {allCompleted ? (
                <>
                  <GaaIcon name="check" size={11} tone="dark" />
                  <span>Cool-Down Completed</span>
                </>
              ) : (
                <>
                  <GaaIcon name="snowflake" size={11} tone="dark" />
                  <span>STEP 4: CLINICAL COOL-DOWN</span>
                </>
              )}
            </span>
            <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 600 }}>
              NASM Clinical Recovery Protocol (7th Ed. Evidence-Based)
            </span>
          </div>

          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '4px 0 0',
              color: '#FFFFFF',
            }}
          >
            Post-Workout Tissue Recovery & Downregulation
          </h3>
          <p style={{ margin: '2px 0 0', color: 'var(--gray)', fontSize: 12 }}>
            Restore resting length-tension relationships, accelerate blood clearance, and stimulate parasympathetic nervous recovery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {!collapsed && (
            <>
              <button
                type="button"
                onClick={startGuidedFlow}
                className="tactile-btn"
                style={{
                  background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 5,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="lightning" size={12} tone="inherit" />
                <span>Start 5-Min Guided Flow</span>
              </button>
              {!allCompleted ? (
                <button
                  type="button"
                  onClick={markAllComplete}
                  className="tactile-btn"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'var(--white)',
                    borderRadius: 5,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ✓ Mark Cool-Down Done
                </button>
              ) : onFlowToBreathwork ? (
                <button
                  type="button"
                  onClick={onFlowToBreathwork}
                  className="tactile-btn"
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                    border: '1px solid rgba(56,189,248,0.5)',
                    color: '#FFFFFF',
                    borderRadius: 5,
                    padding: '6px 12px',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 2px 8px rgba(2,132,199,0.35)',
                  }}
                >
                  <GaaIcon name="wind" size={11} tone="inherit" />
                  <span>Flow to Mindful Breathwork</span>
                </button>
              ) : null}
            </>
          )}

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="tactile-btn"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#93C5FD',
              borderRadius: 5,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {collapsed ? '▼ Expand Cool-Down' : '▲ Collapse'}
          </button>
        </div>
      </div>

      {/* ── 4-Phase Step-by-Step Single-Open Accordion Cards ───────────── */}
      {!collapsed && (
        <div style={{ display: 'grid', gap: 8 }}>
        {coolDownItems.map(item => {
          const isDone = Boolean(completedItems[item.id])
          const isTimerActive = activeInlineTimerId === item.id
          const isExpanded = effectiveOpenStepId === item.id
          const isBreathing = item.name.toLowerCase().includes('breath') || item.phaseLabel.toLowerCase().includes('parasympathetic') || item.name.toLowerCase().includes('box')
          const movementCard = getNasmClinicalMovementCard(item.name, {
            description: item.protocol || item.target || item.clinicalRationale,
            coachingCues: [item.clinicalRationale],
          })
          const gaaImg = isBreathing ? BRAND_LOGO_FALLBACK_IMAGE : resolveGaaExerciseImage(item.name, true)
          const imgUrl = gaaImg || movementCard.imageUrl || movementCard.fallbackImageUrl || BRAND_LOGO_FALLBACK_IMAGE
          const hasVideo = !isBreathing && Boolean(movementCard.embedUrl || movementCard.videoUrl)

          return (
            <details
              key={item.id}
              name={`cooldown-step-group-day-${workoutDay}`}
              open={isExpanded}
              style={{
                background: isDone ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                border: isDone ? '1px solid rgba(16,185,129,0.35)' : isExpanded ? '1px solid rgba(96,165,250,0.45)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                transition: 'all 0.15s',
                maxWidth: '100%',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <summary
                onClick={(e) => {
                  e.preventDefault()
                  setExpandedStepId(prev => {
                    const currentEffective = prev !== null ? (prev === 'none' ? null : prev) : effectiveOpenStepId
                    return currentEffective === item.id ? 'none' : item.id
                  })
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleItem(item.id)}
                    aria-label={`Mark ${item.name} complete`}
                    style={{
                      accentColor: '#10B981',
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />

                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isBreathing) {
                        openMovementModal(item)
                      }
                    }}
                    style={{
                      position: 'relative',
                      width: 'clamp(84px, 18vw, 112px)',
                      aspectRatio: '16 / 10',
                      minWidth: 'clamp(84px, 18vw, 112px)',
                      height: 'auto',
                      borderRadius: 6,
                      overflow: 'hidden',
                      backgroundColor: '#0a0f1d',
                      border: isDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(96,165,250,0.35)',
                      cursor: isBreathing ? 'default' : 'pointer',
                      flexShrink: 0,
                    }}
                    title={isBreathing ? item.name : `View NASM Clinical Form & Demonstration for ${item.name}`}
                  >
                    <img
                      src={imgUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        aspectRatio: '16 / 10',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                      }}
                    />
                    {!isBreathing ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <GaaIcon name={hasVideo ? "play" : "book"} size={12} tone="white" />
                      </div>
                    ) : isBreathing ? (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(10,16,28,0.45)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <GaaIcon name="wind" size={16} tone="cyan" />
                      </div>
                    ) : null}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: isDone ? '#10B981' : '#93C5FD',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.phaseLabel}
                      </span>
                      <span style={{ fontSize: 10.5, color: '#60A5FA', fontWeight: 600 }}>
                        {item.protocol}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: isDone ? '#A7F3D0' : '#FFFFFF',
                        textDecoration: isDone ? 'line-through' : 'none',
                        margin: '1px 0 0',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {isDone && (
                    <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>
                      ✓ Done
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#93C5FD', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                    ▼
                  </span>
                </div>
              </summary>

              {/* Step Expanded Content */}
              <div style={{ padding: '8px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11.5, color: 'var(--gray)', marginBottom: 10, wordBreak: 'break-word' }}>
                  <strong style={{ color: '#93C5FD' }}>Target: </strong>{item.target}
                </div>

                {!isBreathing && (
                  <div
                    onClick={() => openMovementModal(item)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 9',
                      maxHeight: 'clamp(180px, 32vh, 260px)',
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 12,
                      backgroundColor: '#0a0f1d',
                      border: isDone ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(96,165,250,0.35)',
                      cursor: 'pointer',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                    }}
                    title={`View NASM Clinical Form & Demonstration for ${item.name}`}
                  >
                    <img
                      src={imgUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.78)',
                        border: '1px solid rgba(96,165,250,0.55)',
                        color: '#93C5FD',
                        borderRadius: 5,
                        padding: '5px 10px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      }}
                    >
                      <GaaIcon name={hasVideo ? "play" : "book"} size={12} tone="cyan" />
                      <span>{hasVideo ? "Watch Video Demonstration" : "NASM Form Standards"}</span>
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        background: 'rgba(7,11,20,0.85)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#E2E8F0',
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {movementCard.category} · {item.phaseLabel}
                    </div>
                  </div>
                )}

                {/* How to do this step instructions */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderLeft: '2px solid #3B82F6',
                    padding: '8px 10px',
                    borderRadius: '0 4px 4px 0',
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: '#E2E8F0',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="folder" size={11} tone="cyan" />
                    <span>How to perform:</span>
                  </div>
                  {item.instructions.map((stepText, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: sIdx === item.instructions.length - 1 ? 0 : 3, wordBreak: 'break-word' }}>
                      {stepText}
                    </div>
                  ))}
                </div>

                {isBreathing ? (
                  <div style={{ marginBottom: 12 }}>
                    <ClinicalBreathPacer
                      requestedItem={item}
                      onComplete={() => toggleItem(item.id)}
                      compact={true}
                    />
                  </div>
                ) : (
                  /* Inline Action Row with Timer, Demo & Mark Done */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => startInlineTimer(item)}
                      className="tactile-btn"
                      style={{
                        background: isTimerActive ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)',
                        border: isTimerActive ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.18)',
                        color: isTimerActive ? '#93C5FD' : 'var(--white)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <GaaIcon name="watch" size={11} tone="cyan" />
                      <span>{isTimerActive ? `${inlineTimerSeconds}s Left` : `${item.durationSec}s Timer`}</span>
                    </button>

                    {!isBreathing && (
                      <button
                        type="button"
                        onClick={() => openMovementModal(item)}
                        className="tactile-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'rgba(59,130,246,0.15)',
                          border: '1px solid rgba(96,165,250,0.4)',
                          color: '#93C5FD',
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <GaaIcon name="video-studio" size={12} tone="cyan" />
                        <span>NASM Demo & Form</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className="tactile-btn"
                      style={{
                        background: isDone ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                        border: isDone ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.14)',
                        color: isDone ? '#10B981' : 'var(--gray)',
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: '5px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {isDone ? '✓ Completed' : 'Mark Done'}
                    </button>
                  </div>
                )}
              </div>
            </details>
          )
        })}

        {allCompleted && onFlowToBreathwork && (
          <div
            style={{
              marginTop: 12,
              padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.16) 0%, rgba(13, 27, 42, 0.95) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GaaIcon name="wind" size={22} tone="cyan" />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  COOL-DOWN COMPLETE!
                </div>
                <div style={{ fontSize: 11.5, color: '#BAE6FD', marginTop: 1 }}>
                  Advance to parasympathetic recovery reset &amp; conscious breathwork
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onFlowToBreathwork}
              className="tactile-btn"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: 5,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
              }}
            >
              <span>Flow to Mindful Breathwork</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* ── Guided Flow Timer Modal ────────────────────────────────────── */}
      {guidedModalOpen && activeItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 100050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="responsive-modal-surface"
            style={{
              background: 'linear-gradient(180deg, #101626 0%, #080B14 100%)',
              border: '1px solid rgba(96,165,250,0.5)',
              borderRadius: 14,
              padding: 'clamp(18px, 4vw, 32px)',
              maxWidth: 520,
              width: 'min(520px, calc(100vw - 24px))',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ fontSize: 11, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
              Step {activeStepIndex + 1} of {coolDownItems.length} · {activeItem.phaseLabel}
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '8px 0 4px',
                color: '#FFFFFF',
              }}
            >
              {activeItem.name}
            </h3>

            <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
              Target: <strong>{activeItem.target}</strong> · {activeItem.protocol}
            </div>

            {/* Breathing Step: Render Dedicated Breath Pacer */}
            {(activeItem.name.toLowerCase().includes('breath') || activeItem.phaseLabel.toLowerCase().includes('parasympathetic') || activeItem.name.toLowerCase().includes('box')) ? (
              <div style={{ marginBottom: 20 }}>
                <ClinicalBreathPacer
                  requestedItem={activeItem}
                  onComplete={() => toggleItem(activeItem.id)}
                  compact={false}
                />
              </div>
            ) : (
              /* Non-breathing: Visual Movement Card & Circular Timer Clock */
              <>
                {(() => {
                  const movementCard = getNasmClinicalMovementCard(activeItem.name, {
                    description: activeItem.protocol || activeItem.target || activeItem.clinicalRationale,
                    coachingCues: [activeItem.clinicalRationale],
                  })
                  const activeImg = resolveGaaExerciseImage(activeItem.name, true) || movementCard.imageUrl || movementCard.fallbackImageUrl || BRAND_LOGO_FALLBACK_IMAGE
                  const hasActiveVideo = Boolean(movementCard.embedUrl || movementCard.videoUrl)
                  return (
                    <div
                      onClick={() => openMovementModal(activeItem)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16 / 9',
                        maxHeight: 'clamp(200px, 34vh, 300px)',
                        height: 'auto',
                        borderRadius: 8,
                        overflow: 'hidden',
                        marginBottom: 16,
                        border: '1px solid rgba(96,165,250,0.35)',
                        backgroundColor: '#0a0f1d',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                        cursor: 'pointer',
                      }}
                      title={`View NASM Clinical Form & Demonstration for ${activeItem.name}`}
                    >
                      <img
                        src={activeImg}
                        alt={activeItem.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = BRAND_LOGO_FALLBACK_IMAGE
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center',
                          display: 'block',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(96,165,250,0.55)',
                          color: '#93C5FD',
                          borderRadius: 5,
                          padding: '5px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        <GaaIcon name={hasActiveVideo ? "play" : "book"} size={12} tone="cyan" />
                        <span>{hasActiveVideo ? "Watch Video Demonstration" : "NASM Form Standards"}</span>
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          background: 'rgba(7,11,20,0.85)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#E2E8F0',
                          borderRadius: 4,
                          padding: '3px 8px',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {movementCard.category} · {activeItem.phaseLabel}
                      </div>
                    </div>
                  )
                })()}

                <div
                  style={{
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    border: '4px solid rgba(96,165,250,0.3)',
                    borderTopColor: '#60A5FA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    background: 'rgba(0,0,0,0.4)',
                    boxShadow: '0 0 25px rgba(96,165,250,0.2)',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 36, fontWeight: 700, color: '#60A5FA', lineHeight: 1 }}>
                    {timerSecondsLeft}s
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isTimerRunning ? 'In Progress' : 'Paused'}
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 20,
                    textAlign: 'left',
                    fontSize: 12,
                    color: '#E2E8F0',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ fontSize: 10.5, color: '#93C5FD', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="folder" size={11} tone="cyan" />
                    <span>How to perform this step:</span>
                  </div>
                  {activeItem.instructions.map((step, idx) => (
                    <div key={idx} style={{ marginBottom: idx === activeItem.instructions.length - 1 ? 0 : 3 }}>
                      {step}
                    </div>
                  ))}
                  <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--gray)', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                    <GaaIcon name="sparkles" size={11} tone="gold" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{activeItem.clinicalRationale}</span>
                  </div>
                </div>
              </>
            )}

            {/* Modal Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {!(activeItem.name.toLowerCase().includes('breath') || activeItem.phaseLabel.toLowerCase().includes('parasympathetic') || activeItem.name.toLowerCase().includes('box')) && (
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(prev => !prev)}
                  style={{
                    background: isTimerRunning ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.2)',
                    border: isTimerRunning ? '1px solid rgba(255,255,255,0.2)' : '1px solid #10B981',
                    color: isTimerRunning ? '#FFFFFF' : '#10B981',
                    padding: '9px 18px',
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isTimerRunning ? (
                    <>
                      <GaaIcon name="pause" size={12} tone="inherit" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <GaaIcon name="play" size={12} tone="inherit" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={nextGuidedStep}
                style={{
                  background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '9px 20px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                }}
              >
                {activeStepIndex < coolDownItems.length - 1 ? 'Next Step →' : '✓ Finish Cool-Down'}
              </button>

              <button
                type="button"
                onClick={() => setGuidedModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'var(--gray)',
                  padding: '9px 12px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official NASM Movement Standards & Video Modal ── */}
      {activeMovementModal && (
        <ExerciseVideoModal
          exercise={{
            name: activeMovementModal.name,
            block: activeMovementModal.phaseLabel,
            description: activeMovementModal.protocol || activeMovementModal.target || activeMovementModal.clinicalRationale,
            coachingCues: [activeMovementModal.clinicalRationale],
            instructions:
              activeMovementModal.instructions && activeMovementModal.instructions.length > 0
                ? activeMovementModal.instructions
                : [
                    `Target tissue focus: ${activeMovementModal.target}.`,
                    `Apply clinical protocol: ${activeMovementModal.protocol}.`,
                    `Biomechanical rationale: ${activeMovementModal.clinicalRationale}.`,
                  ],
            phaseLabel: activeMovementModal.phaseLabel,
          }}
          onClose={() => setActiveMovementModal(null)}
        />
      )}
    </section>
  )
}