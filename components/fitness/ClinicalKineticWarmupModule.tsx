'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import GaaIcon from '@/components/ui/GaaIcon'
import type { NasmAssessmentRecord } from '@/lib/nasm-assessments'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from '@/lib/nasm-generated-images'
import { getNasmClinicalMovementCard } from '@/lib/nasm-clinical-movement-cards'
import ExerciseVideoModal, { ExerciseModalData } from '@/components/fitness/ExerciseVideoModal'
import { ClinicalBreathPacer } from './ClinicalCoolDownModule'
import { playCountdownPip } from '@/lib/web-audio-cadence-engine'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { speakCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import { isUnilateralMovement } from '@/lib/exercise-logging-helpers'

interface ClinicalKineticWarmupModuleProps {
  workoutDay?: number
  workoutFocus?: string
  notes?: string | null
  latestAssessment?: NasmAssessmentRecord | null
  onWarmupCompleted?: (day: number) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onOpenExerciseModal?: (exercise: ExerciseModalData) => void
  planId?: string | null
  workoutWeek?: number
  sessionDate?: string | null
  isCompleted?: boolean
}

interface WarmupItem {
  id: string
  phase: 'inhibit' | 'lengthen' | 'activate' | 'integrate'
  phaseNumber: number
  phaseLabel: string
  name: string
  target: string
  protocol: string
  durationSec: number
  cues: string[]
  instructions: string[]
  isUnilateral?: boolean
}

function deriveHowToSteps(phase: 'inhibit' | 'lengthen' | 'activate' | 'integrate', name: string, _cues: string[]): string[] {
  const norm = name.toLowerCase()
  if (phase === 'inhibit') {
    if (norm.includes('calf') || norm.includes('gastrocnemius')) {
      return [
        '1. Sit on floor and place foam roller or lacrosse ball under your calf muscle.',
        '2. Slowly roll forward and back until you find a tender, tight trigger point.',
        '3. Hold static pressure directly on the knot for 30–60 seconds while taking slow diaphragmatic breaths until tension releases.',
      ]
    }
    if (norm.includes('thoracic') || norm.includes('back')) {
      return [
        '1. Lie face up with foam roller horizontally across your mid-back (below neck, above lower back).',
        '2. Cross arms over chest and lift hips slightly off the floor.',
        '3. Roll slowly over tight segments. Hold static pressure on tight spots for 30–60 seconds and breathe deeply.',
      ]
    }
    if (norm.includes('lat') || norm.includes('latissimus')) {
      return [
        '1. Lie on your side with foam roller under your armpit and latissimus muscle.',
        '2. Slowly roll downward until finding the most sensitive knot.',
        '3. Hold sustained bodyweight pressure for 30–60 seconds per side without rolling back and forth.',
      ]
    }
    return [
      '1. Position foam roller or massage ball directly beneath the targeted muscle.',
      '2. Roll slowly along the muscle belly to find the primary tender knot or trigger point.',
      '3. Hold constant static pressure on the spot for 30–60 seconds while breathing deeply to release myofascial tension.',
    ]
  }

  if (phase === 'lengthen') {
    if (norm.includes('hip flexor') || norm.includes('psoas')) {
      return [
        '1. Kneel on one knee in a half-kneeling lunge posture with front knee at 90 degrees.',
        '2. Posteriorly tuck your pelvis (tuck tailbone under) and gently shift body weight forward.',
        '3. Reach the arm on the kneeling side straight overhead. Hold static for 30 seconds per side without arching lower back.',
      ]
    }
    if (norm.includes('pec') || norm.includes('chest') || norm.includes('doorway')) {
      return [
        '1. Stand in a doorway with elbow bent 90 degrees placed against the doorframe at shoulder height.',
        '2. Step forward gently with the same-side foot until you feel a comfortable stretch across your chest/anterior deltoid.',
        '3. Keep posture tall and hold statically for 30 seconds per side without bouncing.',
      ]
    }
    return [
      '1. Move slowly into the stretch until you feel gentle elongation tension without pain.',
      '2. Keep spine tall and pelvis neutral (avoid arching or twisting).',
      '3. Hold the static stretch steadily for 30 seconds per side without bouncing. Exhale to deepen relaxation.',
    ]
  }

  if (phase === 'activate') {
    if (norm.includes('bridge')) {
      return [
        '1. Lie on your back with knees bent at 90 degrees and feet flat on the floor, hip-width apart.',
        '2. Brace your core and drive through your heels to raise hips into full extension.',
        '3. Squeeze glutes forcefully for 2 full seconds at top peak before lowering slowly (4-second descent). Perform 12–15 reps.',
      ]
    }
    if (norm.includes('cobra') || norm.includes('rhomboid') || norm.includes('trap')) {
      return [
        '1. Lie prone (face down) with arms at your sides, thumbs pointed upward toward ceiling.',
        '2. Retract and depress shoulder blades to lift chest slightly off the floor.',
        '3. Hold the top contraction for 2 seconds, then lower slowly (4-second tempo). Perform 12–15 reps.',
      ]
    }
    return [
      '1. Set up in stable anatomical alignment with joints stacked and core engaged.',
      '2. Isolate and contract the target muscle using the 4-2-1 tempo (4s lowering, 2s squeeze hold at peak, 1s lift).',
      '3. Perform 12–15 strict controlled reps, keeping primary prime movers relaxed.',
    ]
  }

  if (norm.includes('squat') || norm.includes('scaption') || norm.includes('reach')) {
    return [
      '1. Stand with feet shoulder-width apart, holding light resistance or using bodyweight.',
      '2. Squat down with hips back and knees tracking over 2nd toes.',
      '3. As you stand up, drive hips forward and raise arms overhead at a 45-degree angle in the scapular plane.',
      '4. Move in a smooth, continuous tempo for 10–12 repetitions.',
    ]
  }
  return [
    '1. Execute a coordinated multi-joint functional pattern linking lower body, core, and upper limbs.',
    '2. Keep knees tracked over toes and shoulders retracted in optimal alignment.',
    '3. Move smoothly through full range of motion for 10–12 repetitions to prime full-body movement.',
  ]
}

export function getWarmupStorageKey(
  planId?: string | null,
  week?: number,
  day?: number,
  sessionDate?: string | null
): string {
  const p = planId ? `p_${planId}_` : ''
  const w = typeof week === 'number' ? `w${week}_` : ''
  const d = typeof day === 'number' ? `d${day}` : 'd1'
  const dt = sessionDate ? `_${sessionDate}` : ''
  return `sgf_warmup_done_${p}${w}${d}${dt}`
}

export function isFutureWarmupSession(
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

export function cleanupLegacyWarmupKeys(): void {
  if (typeof window === 'undefined') return
  try {
    for (let d = 1; d <= 14; d++) {
      localStorage.removeItem(`sgf_warmup_done_day_${d}`)
    }
  } catch {}
}

export default function ClinicalKineticWarmupModule({
  workoutDay = 1,
  workoutFocus: _workoutFocus = 'Kinetic Chain Mobility & Corrective Preparation',
  notes: _notes,
  latestAssessment,
  onWarmupCompleted,
  isCollapsed,
  onToggleCollapse,
  onOpenExerciseModal,
  planId,
  workoutWeek,
  sessionDate,
  isCompleted: _isCompleted,
}: ClinicalKineticWarmupModuleProps) {
  const [localCollapsed, setLocalCollapsed] = useState<boolean>(false)
  const collapsed = isCollapsed !== undefined ? isCollapsed : localCollapsed
  const handleToggleCollapse = onToggleCollapse ?? (() => setLocalCollapsed(p => !p))

  const isFuture = useMemo(() => {
    return isFutureWarmupSession(sessionDate, workoutWeek)
  }, [sessionDate, workoutWeek])

  const storageKey = useMemo(() => {
    return getWarmupStorageKey(planId, workoutWeek, workoutDay, sessionDate)
  }, [planId, workoutWeek, workoutDay, sessionDate])

  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined' || isFuture) return {}
    try {
      cleanupLegacyWarmupKeys()
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
      cleanupLegacyWarmupKeys()
      const saved = localStorage.getItem(storageKey)
      setCompletedItems(saved ? JSON.parse(saved) : {})
    } catch {
      setCompletedItems({})
    }
  }, [storageKey, isFuture])

  const [guidedModalOpen, setGuidedModalOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!guidedModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGuidedModalOpen(false)
      }
    }
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [guidedModalOpen])

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(30)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [guidedSide, setGuidedSide] = useState<1 | 2>(1)
  const [prepCountdown, setPrepCountdown] = useState<number>(0)
  const [activeInlineTimerId, setActiveInlineTimerId] = useState<string | null>(null)
  const [inlineTimerSeconds, setInlineTimerSeconds] = useState<number>(30)
  const [inlineSide, setInlineSide] = useState<1 | 2>(1)
  const [activeMovementModal, setActiveMovementModal] = useState<WarmupItem | null>(null)

  const openMovementModal = useCallback((item: WarmupItem) => {
    if (onOpenExerciseModal) {
      onOpenExerciseModal({
        name: item.name,
        block: item.phaseLabel,
        description: item.protocol || item.target,
        coachingCues: item.cues,
        instructions:
          item.instructions && item.instructions.length > 0
            ? item.instructions
            : deriveHowToSteps(item.phase, item.name, item.cues),
        phaseLabel: item.phaseLabel,
      })
    } else {
      setActiveMovementModal(item)
    }
  }, [onOpenExerciseModal])

  // Derive clinical warmup items from assessment or workout notes
  const warmupItems: WarmupItem[] = React.useMemo(() => {
    const items: WarmupItem[] = []

    if (latestAssessment?.prescribed_correctives) {
      const pc = latestAssessment.prescribed_correctives
      const inhibit = Array.isArray(pc.inhibit) ? pc.inhibit : []
      const lengthen = Array.isArray(pc.lengthen) ? pc.lengthen : []
      const activate = Array.isArray(pc.activate) ? pc.activate : []
      const integrate = Array.isArray(pc.integrate) ? pc.integrate : []

      inhibit.slice(0, 2).forEach((ex, i) => {
        const cues = ex.coachingCues || []
        const isUnilateral = isUnilateralMovement({ phase: 'inhibit', name: ex.name, protocol: ex.protocol || ex.repsOrDuration })
        items.push({
          id: `inhibit-${i}`,
          phase: 'inhibit',
          phaseNumber: 1,
          phaseLabel: '1. Inhibit (SMR Trigger Points)',
          name: ex.name,
          target: ex.targetMuscle || 'Overactive Myofascial Tissue',
          protocol: ex.protocol || ex.repsOrDuration || 'Hold tender spot 30-60s',
          durationSec: 30,
          cues,
          instructions: deriveHowToSteps('inhibit', ex.name, cues),
          isUnilateral,
        })
      })

      lengthen.slice(0, 2).forEach((ex, i) => {
        const cues = ex.coachingCues || []
        const isUnilateral = isUnilateralMovement({ phase: 'lengthen', name: ex.name, protocol: ex.protocol || ex.repsOrDuration })
        items.push({
          id: `lengthen-${i}`,
          phase: 'lengthen',
          phaseNumber: 2,
          phaseLabel: '2. Lengthen (Static Stretches)',
          name: ex.name,
          target: ex.targetMuscle || 'Shortened Kinetic Checkpoint',
          protocol: ex.protocol || ex.repsOrDuration || 'Static hold 30s per side',
          durationSec: 30,
          cues,
          instructions: deriveHowToSteps('lengthen', ex.name, cues),
          isUnilateral,
        })
      })

      activate.slice(0, 2).forEach((ex, i) => {
        const cues = ex.coachingCues || []
        items.push({
          id: `activate-${i}`,
          phase: 'activate',
          phaseNumber: 3,
          phaseLabel: '3. Activate (Isolated Stabilizers)',
          name: ex.name,
          target: ex.targetMuscle || 'Underactive Stabilizer',
          protocol: `${ex.sets ?? '1-2'} sets × ${ex.repsOrDuration ?? '12-15'} (${ex.tempo ?? '4/2/1'} tempo)`,
          durationSec: 45,
          cues,
          instructions: deriveHowToSteps('activate', ex.name, cues),
        })
      })

      integrate.slice(0, 1).forEach((ex, i) => {
        const cues = ex.coachingCues || []
        items.push({
          id: `integrate-${i}`,
          phase: 'integrate',
          phaseNumber: 4,
          phaseLabel: '4. Integrate (Kinetic Chain)',
          name: ex.name,
          target: ex.targetMuscle || 'Integrated Kinetic Chain',
          protocol: `${ex.sets ?? '1-2'} sets × ${ex.repsOrDuration ?? '10-12'}`,
          durationSec: 45,
          cues,
          instructions: deriveHowToSteps('integrate', ex.name, cues),
        })
      })
    }

    // If assessment correctives are empty, fallback to standard protocol
    if (items.length === 0) {
      items.push(
        {
          id: 'inhibit-def-1',
          phase: 'inhibit',
          phaseNumber: 1,
          phaseLabel: '1. Inhibit (SMR Foam Roll)',
          name: 'SMR Calves & Thoracic Spine',
          target: 'Gastrocnemius / Soleus & Thoracic Extensors',
          protocol: 'Hold tender spots 30-60s',
          durationSec: 30,
          cues: ['Roll slowly over muscle bellies. Hold pressure when finding tender points.'],
          instructions: [
            '1. Sit on floor with foam roller under mid-calf or mid-back.',
            '2. Slowly roll along muscle to find the most tender trigger point.',
            '3. Hold static direct pressure for 30–60s while taking deep diaphragmatic breaths until tension releases.',
          ],
        },
        {
          id: 'lengthen-def-1',
          phase: 'lengthen',
          phaseNumber: 2,
          phaseLabel: '2. Lengthen (Static Stretch)',
          name: 'Kneeling Hip Flexor & Latissimus Stretch',
          target: 'Psoas / Rectus Femoris & Lats',
          protocol: 'Static hold 30s per side',
          durationSec: 30,
          isUnilateral: true,
          cues: ['Tuck pelvis slightly (posterior tilt) and reach overhead.'],
          instructions: [
            '1. Half-kneeling lunge on one knee, front knee bent 90 degrees.',
            '2. Tuck your pelvis under (posterior tilt) and shift forward slightly.',
            '3. Reach overhead on the kneeling side. Hold for 30s per side without bouncing.',
          ],
        },
        {
          id: 'activate-def-1',
          phase: 'activate',
          phaseNumber: 3,
          phaseLabel: '3. Activate (Stabilizers)',
          name: 'Glute Bridge with 2s Isometric Hold',
          target: 'Gluteus Maximus & Core Local Stabilizers',
          protocol: '2 sets × 12 reps (4/2/1 tempo)',
          durationSec: 45,
          cues: ['Drive through heels, maintain neutral spine, squeeze glutes for 2 seconds at peak.'],
          instructions: [
            '1. Lie on back, feet flat and hip-width apart.',
            '2. Drive through heels to raise hips into full extension.',
            '3. Squeeze glutes for 2 seconds at top, then lower for 4 seconds. Complete 12 reps.',
          ],
        },
        {
          id: 'integrate-def-1',
          phase: 'integrate',
          phaseNumber: 4,
          phaseLabel: '4. Integrate (Dynamic Movement)',
          name: 'Squat to Overhead Reach & Scaption',
          target: 'Full Kinetic Chain & Scapulohumeral Rhythm',
          protocol: '1-2 sets × 10 reps',
          durationSec: 45,
          cues: ['Keep knees tracked over 2nd toes, arms moving at 45 degree scapular plane.'],
          instructions: [
            '1. Stand feet shoulder-width, knees aligned over 2nd toes.',
            '2. Squat down under control with hips back.',
            '3. Stand up and simultaneously reach arms overhead at a 45° angle. Repeat for 10 reps.',
          ],
        }
      )
    }

    return items
  }, [latestAssessment])

  const allCompleted = warmupItems.length > 0 && warmupItems.every(item => completedItems[item.id])

  const [expandedStepId, setExpandedStepId] = useState<string | null>(null)

  const effectiveOpenStepId = useMemo(() => {
    if (expandedStepId !== null) {
      return expandedStepId === 'none' ? null : expandedStepId
    }
    const firstUnfinished = warmupItems.find(item => !completedItems[item.id])
    return firstUnfinished ? firstUnfinished.id : (warmupItems[0]?.id ?? null)
  }, [expandedStepId, warmupItems, completedItems])

  const toggleItem = useCallback((id: string) => {
    const isNowDone = !completedItems[id]
    const updated = { ...completedItems, [id]: isNowDone }
    setCompletedItems(updated)
    if (typeof window !== 'undefined' && !isFuture) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {}
    }
    if (warmupItems.every(item => updated[item.id]) && onWarmupCompleted) {
      onWarmupCompleted(workoutDay)
    }

    // Auto-advance to next step if marking done
    if (isNowDone) {
      const curIdx = warmupItems.findIndex(item => item.id === id)
      if (curIdx >= 0 && curIdx + 1 < warmupItems.length) {
        setExpandedStepId(warmupItems[curIdx + 1].id)
      }
    }
  }, [completedItems, isFuture, onWarmupCompleted, storageKey, warmupItems, workoutDay])

  const markAllComplete = useCallback(() => {
    const updated: Record<string, boolean> = {}
    warmupItems.forEach(item => {
      updated[item.id] = true
    })
    setCompletedItems(updated)
    if (typeof window !== 'undefined' && !isFuture) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {}
    }
    if (onWarmupCompleted) {
      onWarmupCompleted(workoutDay)
    }
  }, [isFuture, onWarmupCompleted, storageKey, warmupItems, workoutDay])

  // Inline Step Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (activeInlineTimerId && inlineTimerSeconds > 0) {
      interval = setInterval(() => {
        setInlineTimerSeconds(prev => {
          if (prev <= 4 && prev >= 2) {
            playCountdownPip(prev - 1)
          }
          return prev - 1
        })
      }, 1000)
    } else if (inlineTimerSeconds === 0 && activeInlineTimerId) {
      const activeItem = warmupItems.find(i => i.id === activeInlineTimerId)
      const isUnilateral = activeItem ? (activeItem.isUnilateral ?? isUnilateralMovement(activeItem)) : false

      if (isUnilateral && inlineSide === 1) {
        // Switch to Side 2 for unilateral stretch
        playCountdownPip(0)
        triggerHaptic('heavy')
        speakCoachVoiceCue('Switch sides! Now side 2.')
        setInlineSide(2)
        setInlineTimerSeconds(activeItem?.durationSec || 30)
      } else {
        // Both sides complete (or single bilateral movement)
        playCountdownPip(0)
        triggerHaptic('heavy')
        speakCoachVoiceCue(activeItem?.phase === 'lengthen' ? 'Both sides complete!' : 'Warmup movement complete!')
        toggleItem(activeInlineTimerId)
        setActiveInlineTimerId(null)
        setInlineSide(1)
      }
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeInlineTimerId, inlineTimerSeconds, inlineSide, warmupItems, toggleItem])

  const startInlineTimer = (item: WarmupItem) => {
    if (activeInlineTimerId === item.id) {
      setActiveInlineTimerId(null)
      setInlineSide(1)
    } else {
      setActiveInlineTimerId(item.id)
      setInlineSide(1)
      setInlineTimerSeconds(item.durationSec)
      triggerHaptic('tap')
      playCountdownPip(item.durationSec)
      const isUnilateral = item.isUnilateral ?? isUnilateralMovement(item)
      if (isUnilateral) {
        speakCoachVoiceCue(`Starting Side 1: ${item.name}`)
      } else {
        speakCoachVoiceCue(`Starting ${item.durationSec} second timer`)
      }
    }
  }

  // Guided Timer Countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (guidedModalOpen && isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 4 && prev >= 2) {
            playCountdownPip(prev - 1)
          }
          return prev - 1
        })
      }, 1000)
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      const currentItem = warmupItems[activeStepIndex]
      const isUnilateral = currentItem ? (currentItem.isUnilateral ?? isUnilateralMovement(currentItem)) : false

      if (isUnilateral && guidedSide === 1) {
        // Switch to Side 2 for unilateral movement with 3-second get ready buffer!
        playCountdownPip(0)
        triggerHaptic('heavy')
        speakCoachVoiceCue('Switch sides! Now side 2. Get ready in 3, 2, 1.')
        setGuidedSide(2)
        setTimerSecondsLeft(currentItem?.durationSec ?? 30)
        setIsTimerRunning(false)
        setPrepCountdown(3)
      } else {
        // Both sides complete (or bilateral movement done)
        playCountdownPip(0)
        triggerHaptic('heavy')
        if (currentItem) {
          toggleItem(currentItem.id)
        }

        const nextIdx = activeStepIndex + 1
        if (nextIdx < warmupItems.length) {
          // Naturally advance to the next exercise with 3-second get ready buffer!
          setActiveStepIndex(nextIdx)
          setGuidedSide(1)
          const nextItem = warmupItems[nextIdx]
          setTimerSecondsLeft(nextItem?.durationSec ?? 30)
          setIsTimerRunning(false)
          setPrepCountdown(3)
          if (nextItem) {
            const nextIsUnilateral = nextItem.isUnilateral ?? isUnilateralMovement(nextItem)
            if (nextIsUnilateral) {
              speakCoachVoiceCue(`Next: Side 1 of ${nextItem.name}. Get ready in 3, 2, 1.`)
            } else {
              speakCoachVoiceCue(`Next: ${nextItem.name}. Get ready in 3, 2, 1.`)
            }
          }
        } else {
          // Entire guided sequence completed
          speakCoachVoiceCue('Warmup complete! Great work.')
          markAllComplete()
          setGuidedModalOpen(false)
          setGuidedSide(1)
          setPrepCountdown(0)
          setIsTimerRunning(false)
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [
    guidedModalOpen,
    isTimerRunning,
    timerSecondsLeft,
    activeStepIndex,
    guidedSide,
    warmupItems,
    toggleItem,
    markAllComplete,
    playCountdownPip,
    speakCoachVoiceCue,
  ])

  // Guided Prep Countdown (3-second buffer to get ready for the next stretch)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (guidedModalOpen && prepCountdown > 0) {
      interval = setInterval(() => {
        setPrepCountdown(prev => {
          if (prev <= 1) {
            playCountdownPip(0)
            triggerHaptic('timer')
            setIsTimerRunning(true)
            speakCoachVoiceCue('Begin stretch')
            return 0
          }
          playCountdownPip(prev - 1)
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [guidedModalOpen, prepCountdown, playCountdownPip, speakCoachVoiceCue])

  const startGuidedFlow = () => {
    setActiveStepIndex(0)
    setGuidedSide(1)
    setPrepCountdown(0)
    const firstItem = warmupItems[0]
    setTimerSecondsLeft(firstItem?.durationSec ?? 30)
    setIsTimerRunning(true)
    setGuidedModalOpen(true)
    triggerHaptic('tap')
    if (firstItem) {
      const isUnilateral = firstItem.isUnilateral ?? isUnilateralMovement(firstItem)
      if (isUnilateral) {
        speakCoachVoiceCue(`Starting Side 1: ${firstItem.name}`)
      } else {
        speakCoachVoiceCue(`Starting warmup: ${firstItem.name}`)
      }
    }
  }

  const nextGuidedStep = () => {
    const nextIdx = activeStepIndex + 1
    if (nextIdx < warmupItems.length) {
      setActiveStepIndex(nextIdx)
      setGuidedSide(1)
      const nextItem = warmupItems[nextIdx]
      setTimerSecondsLeft(nextItem?.durationSec ?? 30)
      setIsTimerRunning(false)
      setPrepCountdown(3)
      triggerHaptic('tap')
      if (nextItem) {
        const isUnilateral = nextItem.isUnilateral ?? isUnilateralMovement(nextItem)
        if (isUnilateral) {
          speakCoachVoiceCue(`Next: Side 1 of ${nextItem.name}. Get ready in 3, 2, 1.`)
        } else {
          speakCoachVoiceCue(`Next: ${nextItem.name}. Get ready in 3, 2, 1.`)
        }
      }
    } else {
      markAllComplete()
      setGuidedModalOpen(false)
      setGuidedSide(1)
      setPrepCountdown(0)
    }
  }

  const handleManualSwitchSide = () => {
    const currentItem = warmupItems[activeStepIndex]
    if (!currentItem) return
    playCountdownPip(0)
    triggerHaptic('tap')
    if (guidedSide === 1) {
      speakCoachVoiceCue('Switching to Side 2. Get ready in 3, 2, 1.')
      setGuidedSide(2)
      setTimerSecondsLeft(currentItem.durationSec ?? 30)
      setIsTimerRunning(false)
      setPrepCountdown(3)
    } else {
      speakCoachVoiceCue('Side 1')
      setGuidedSide(1)
      setTimerSecondsLeft(currentItem.durationSec ?? 30)
      setIsTimerRunning(true)
    }
  }

  const activeItem = warmupItems[activeStepIndex]

  return (
    <section
      aria-label="Pre-Lift Kinetic Warmup"
      style={{
        border: allCompleted ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(212,160,23,0.35)',
        background: allCompleted
          ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(10,20,30,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(212,160,23,0.08) 0%, rgba(10,16,28,0.95) 100%)',
        borderRadius: 8,
        padding: 'clamp(10px, 3vw, 16px)',
        marginBottom: 20,
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
                background: allCompleted ? '#10B981' : 'var(--gold)',
                color: '#0A0E18',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {allCompleted ? (
                <>
                  <GaaIcon name="check" size={11} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                  <span>Warmup Completed</span>
                </>
              ) : (
                <>
                  <GaaIcon name="flame" size={11} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                  <span>STEP 1: PRE-LIFT KINETIC WARMUP</span>
                </>
              )}
            </span>
            <span style={{ fontSize: 11, color: 'var(--gold-lt)', fontWeight: 600 }}>
              NASM Corrective Continuum (CEx)
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
            Day {workoutDay} Mobility & Joint Activation Flow
          </h3>
          <p style={{ margin: '2px 0 0', color: 'var(--gray)', fontSize: 12 }}>
            Perform each step in order prior to resistance training to prime stabilization and prevent injury.
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
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  color: '#0A0E18',
                  border: 'none',
                  borderRadius: 5,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(212,160,23,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <GaaIcon name="lightning" size={13} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                <span>Start 5-Min Guided Flow</span>
              </button>
              {!allCompleted && (
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
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="check" size={11} tone="white" />
                  <span>Mark All Done</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="tactile-btn"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'var(--gold-lt)',
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
            {collapsed ? '▼ Expand Warmup' : '▲ Collapse'}
          </button>
        </div>
      </div>

      {/* ── 4-Phase Step-by-Step Single-Open Accordion Cards ───────────── */}
      {!collapsed && (
        <div style={{ display: 'grid', gap: 8 }}>
          {warmupItems.map(item => {
            const isDone = Boolean(completedItems[item.id])
            const isTimerActive = activeInlineTimerId === item.id
            const isExpanded = effectiveOpenStepId === item.id
            const movementCard = getNasmClinicalMovementCard(item.name, {
              description: item.protocol || item.target,
              coachingCues: item.cues,
            })
            const gaaImg = resolveGaaExerciseImage(item.name, true)
            const imgUrl = gaaImg || movementCard.imageUrl || movementCard.fallbackImageUrl || BRAND_LOGO_FALLBACK_IMAGE
            const hasVideo = Boolean(movementCard.embedUrl || movementCard.videoUrl)

            return (
              <details
                key={item.id}
                name={`warmup-step-group-day-${workoutDay}`}
                open={isExpanded}
                style={{
                  background: isDone ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                  border: isDone ? '1px solid rgba(16,185,129,0.35)' : isExpanded ? '1px solid rgba(212,160,23,0.45)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  transition: 'all 0.15s',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <summary
                  onClick={(e) => {
                    e.preventDefault()
                    setExpandedStepId(prev => {
                      const currentEffective = prev !== null ? prev : (effectiveOpenStepId ?? 'none')
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
                        openMovementModal(item)
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
                        border: isDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(212,160,23,0.35)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title={`View NASM Clinical Form & Demonstration for ${item.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        <GaaIcon name={hasVideo ? "play" : "book"} size={13} tone="white" />
                      </div>
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            color: isDone ? '#10B981' : 'var(--gold-lt)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {item.phaseLabel}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--gold)', fontWeight: 600 }}>
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
                      <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <GaaIcon name="check" size={11} tone="emerald" />
                        <span>Done</span>
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--gold-lt)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>
                      ▼
                    </span>
                  </div>
                </summary>

                {/* Step Expanded Content */}
                <div style={{ padding: '8px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--gray)', marginBottom: 10, wordBreak: 'break-word' }}>
                    <strong style={{ color: 'var(--gold-lt)' }}>Target: </strong>{item.target}
                  </div>

                  {/* High-Definition Visual Movement Demonstration Banner */}
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
                      border: isDone ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(212,160,23,0.35)',
                      cursor: 'pointer',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
                    }}
                    title={`View NASM Clinical Form & Demonstration for ${item.name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        background: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(212,160,23,0.55)',
                        color: 'var(--gold-lt)',
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
                      <GaaIcon name={hasVideo ? "play" : "book"} size={12} tone="gold" />
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

                  {/* How to do this step instructions */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderLeft: '2px solid var(--gold)',
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
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="book" size={12} tone="gold" />
                      <span>How to perform:</span>
                    </div>
                    {(item.instructions || []).map((stepText, sIdx) => (
                      <div key={sIdx} style={{ marginBottom: sIdx === (item.instructions?.length ?? 1) - 1 ? 0 : 3, wordBreak: 'break-word' }}>
                        {stepText}
                      </div>
                    ))}
                  </div>

                  {/* Inline Action Row with Timer, Video Demo & Mark Done */}
                  {item.name.toLowerCase().includes('breath') ? (
                    <div style={{ marginBottom: 12 }}>
                      <ClinicalBreathPacer
                        requestedItem={item}
                        onComplete={() => toggleItem(item.id)}
                        compact={true}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      {(() => {
                        const itemIsUnilateral = item.isUnilateral ?? isUnilateralMovement(item)
                        return (
                          <>
                            <button
                              onClick={() => startInlineTimer(item)}
                              className="tactile-btn"
                              style={{
                                background: isTimerActive ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.06)',
                                border: isTimerActive ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.18)',
                                color: isTimerActive ? 'var(--gold-lt)' : 'var(--white)',
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
                              <GaaIcon name="timer" size={12} tone="gold" />
                              <span>
                                {isTimerActive
                                  ? itemIsUnilateral
                                    ? `Side ${inlineSide}/2: ${inlineTimerSeconds}s Left`
                                    : `${inlineTimerSeconds}s Left`
                                  : itemIsUnilateral
                                    ? `${item.durationSec}s/Side Timer (Both Sides)`
                                    : `${item.durationSec}s Timer`}
                              </span>
                            </button>

                            {isTimerActive && itemIsUnilateral && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic('tap')
                                  playCountdownPip(0)
                                  if (inlineSide === 1) {
                                    speakCoachVoiceCue('Switching to Side 2')
                                    setInlineSide(2)
                                    setInlineTimerSeconds(item.durationSec)
                                  } else {
                                    speakCoachVoiceCue('Both sides complete!')
                                    toggleItem(item.id)
                                    setActiveInlineTimerId(null)
                                    setInlineSide(1)
                                  }
                                }}
                                className="tactile-btn"
                                style={{
                                  background: inlineSide === 1 ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                                  border: inlineSide === 1 ? '1px solid #3B82F6' : '1px solid #10B981',
                                  color: inlineSide === 1 ? '#60A5FA' : '#34D399',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '5px 10px',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                                title={inlineSide === 1 ? 'Skip to Side 2' : 'Finish Both Sides'}
                              >
                                <span>{inlineSide === 1 ? 'Switch to Side 2 ↻' : 'Finish Both Sides ✓'}</span>
                              </button>
                            )}
                          </>
                        )
                      })()}

                      <button
                        type="button"
                        onClick={() => openMovementModal(item)}
                        className="tactile-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: 'rgba(212,160,23,0.15)',
                          border: '1px solid rgba(212,160,23,0.4)',
                          color: 'var(--gold-lt)',
                          fontSize: 11.5,
                          fontWeight: 700,
                          padding: '5px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        <GaaIcon name="video-studio" size={12} tone="gold" />
                        <span>NASM Demo & Form</span>
                      </button>
                      
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isDone ? (
                          <>
                            <GaaIcon name="check" size={11} tone="emerald" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <span>Mark Done</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}

      {/* ── Guided Flow Timer Modal ────────────────────────────────────── */}
      {guidedModalOpen && activeItem && mounted && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Guided Warmup Flow: ${activeItem.name}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuidedModalOpen(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 100050,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 'max(16px, env(safe-area-inset-top, 16px)) max(12px, env(safe-area-inset-right, 12px)) max(24px, env(safe-area-inset-bottom, 24px)) max(12px, env(safe-area-inset-left, 12px))',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="responsive-modal-surface"
            style={{
              position: 'relative',
              background: 'linear-gradient(180deg, #182030 0%, #0E1420 100%)',
              border: '1px solid rgba(212,160,23,0.45)',
              borderRadius: 14,
              padding: 'clamp(16px, 4vw, 26px)',
              maxWidth: 500,
              width: '100%',
              margin: 'auto 0',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              boxSizing: 'border-box',
            }}
          >
            {/* Top-Right Quick Dismiss '✕' Button */}
            <button
              type="button"
              onClick={() => setGuidedModalOpen(false)}
              aria-label="Close guided flow"
              title="Close guided flow"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E2E8F0',
                fontSize: 16,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              ✕
            </button>

            <div style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, paddingRight: 32 }}>
              Step {activeStepIndex + 1} of {warmupItems.length} · {activeItem.phaseLabel}
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

            <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 14 }}>
              Target: <strong>{activeItem.target}</strong> · {activeItem.protocol}
            </div>

            {/* Visual Movement Demonstration Card */}
            {(() => {
              const movementCard = getNasmClinicalMovementCard(activeItem.name, {
                description: activeItem.protocol || activeItem.target,
                coachingCues: activeItem.cues || [],
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
                    maxHeight: 'clamp(140px, 24vh, 220px)',
                    height: 'auto',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 14,
                    border: '1px solid rgba(212,160,23,0.35)',
                    backgroundColor: '#0a0f1d',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                    cursor: 'pointer',
                  }}
                  title={`View NASM Clinical Form & Demonstration for ${activeItem.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                      border: '1px solid rgba(212,160,23,0.55)',
                      color: 'var(--gold-lt)',
                      borderRadius: 5,
                      padding: '5px 10px',
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                    }}
                  >
                    <GaaIcon name={hasActiveVideo ? "play" : "book"} size={12} tone="gold" />
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
                      WebkitBackdropFilter: 'blur(4px)',
                    }}
                  >
                    {movementCard.category} · {activeItem.phaseLabel}
                  </div>
                </div>
              )
            })()}

            {activeItem.name.toLowerCase().includes('breath') ? (
              <div style={{ marginBottom: 16 }}>
                <ClinicalBreathPacer
                  requestedItem={activeItem}
                  onComplete={() => toggleItem(activeItem.id)}
                  compact={true}
                />
              </div>
            ) : (
              <>
                {(() => {
                  const activeIsUnilateral = activeItem ? (activeItem.isUnilateral ?? isUnilateralMovement(activeItem)) : false
                  return (
                    <>
                      {activeIsUnilateral && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: guidedSide === 1 ? 'rgba(212,160,23,0.25)' : 'rgba(255,255,255,0.06)',
                              border: guidedSide === 1 ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.12)',
                              color: guidedSide === 1 ? '#FDE047' : 'var(--gray)',
                            }}
                          >
                            <span>Side 1 of 2</span>
                            {guidedSide === 1 && isTimerRunning && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FDE047', display: 'inline-block' }} />
                            )}
                            {guidedSide === 2 && <span>✓</span>}
                          </div>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 20,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: guidedSide === 2 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)',
                              border: guidedSide === 2 ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.12)',
                              color: guidedSide === 2 ? '#34D399' : 'var(--gray)',
                            }}
                          >
                            <span>Side 2 of 2</span>
                            {guidedSide === 2 && isTimerRunning && (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Circular Timer Clock */}
                      {prepCountdown > 0 && (
                        <div
                          style={{
                            background: 'rgba(56,189,248,0.15)',
                            border: '1px solid rgba(56,189,248,0.4)',
                            borderRadius: 20,
                            padding: '4px 14px',
                            margin: '0 auto 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#38BDF8',
                            fontSize: 11.5,
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                          }}
                        >
                          <GaaIcon name="timer" size={13} tone="cyan" />
                          <span>
                            {activeIsUnilateral && guidedSide === 2
                              ? `Get into position for Side 2 (${prepCountdown}s)`
                              : `Get into position for next stretch (${prepCountdown}s)`}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          width: 'clamp(100px, 24vw, 130px)',
                          height: 'clamp(100px, 24vw, 130px)',
                          borderRadius: '50%',
                          margin: '0 auto 14px',
                          border: prepCountdown > 0 ? '4px solid rgba(56,189,248,0.5)' : '4px solid rgba(212,160,23,0.3)',
                          borderTopColor: prepCountdown > 0 ? '#38BDF8' : '#D4AF37',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          background: 'rgba(0,0,0,0.4)',
                          boxShadow: prepCountdown > 0 ? '0 0 25px rgba(56,189,248,0.35)' : '0 0 25px rgba(212,160,23,0.2)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: 700, color: prepCountdown > 0 ? '#38BDF8' : '#D4AF37', lineHeight: 1 }}>
                          {prepCountdown > 0 ? prepCountdown : `${timerSecondsLeft}s`}
                        </div>
                        <div style={{ fontSize: 10, color: prepCountdown > 0 ? '#38BDF8' : 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4, fontWeight: prepCountdown > 0 ? 800 : 500 }}>
                          {prepCountdown > 0
                            ? 'Get Ready'
                            : activeIsUnilateral
                              ? (guidedSide === 1 ? 'Side 1 Hold' : 'Side 2 Hold')
                              : (isTimerRunning ? 'In Progress' : 'Paused')}
                        </div>
                      </div>
                    </>
                  )
                })()}

                {/* Step-by-Step Instructions */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 16,
                    textAlign: 'left',
                    fontSize: 12,
                    color: '#E2E8F0',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ fontSize: 10.5, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="book" size={12} tone="gold" />
                    <span>How to perform this step:</span>
                  </div>
                  {(activeItem.instructions || []).map((step, idx) => (
                    <div key={idx} style={{ marginBottom: idx === (activeItem.instructions?.length ?? 1) - 1 ? 0 : 3 }}>
                      {step}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Modal Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {!activeItem.name.toLowerCase().includes('breath') && (
                <>
                  <button
                    type="button"
                    disabled={prepCountdown > 0}
                    onClick={() => setIsTimerRunning(prev => !prev)}
                    style={{
                      background: prepCountdown > 0 ? 'rgba(56,189,248,0.08)' : isTimerRunning ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.2)',
                      border: prepCountdown > 0 ? '1px solid rgba(56,189,248,0.25)' : isTimerRunning ? '1px solid rgba(255,255,255,0.2)' : '1px solid #10B981',
                      color: prepCountdown > 0 ? '#38BDF8' : isTimerRunning ? '#FFFFFF' : '#10B981',
                      padding: '9px 18px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: prepCountdown > 0 ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      opacity: prepCountdown > 0 ? 0.75 : 1,
                    }}
                  >
                    {prepCountdown > 0 ? (
                      <>
                        <GaaIcon name="timer" size={12} tone="cyan" />
                        <span>Ready in {prepCountdown}s</span>
                      </>
                    ) : isTimerRunning ? (
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

                  {Boolean(activeItem && (activeItem.isUnilateral ?? isUnilateralMovement(activeItem)) && guidedSide === 1) && (
                    <button
                      type="button"
                      onClick={handleManualSwitchSide}
                      style={{
                        background: 'rgba(59,130,246,0.2)',
                        border: '1px solid #3B82F6',
                        color: '#60A5FA',
                        padding: '9px 16px',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span>Switch to Side 2 ↻</span>
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={nextGuidedStep}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  border: 'none',
                  color: '#0A0E18',
                  padding: '9px 20px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(212,160,23,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {activeStepIndex < warmupItems.length - 1 ? (
                  <span>Next Step →</span>
                ) : (
                  <>
                    <GaaIcon name="check" size={13} style={{ color: '#0A0E18', stroke: '#0A0E18' }} />
                    <span>Complete Warmup</span>
                  </>
                )}
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GaaIcon name="close" size={12} tone="inherit" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Official NASM Movement Standards & Video Modal ── */}
      {activeMovementModal && (
        <ExerciseVideoModal
          exercise={{
            name: activeMovementModal.name,
            block: activeMovementModal.phaseLabel,
            description: activeMovementModal.protocol || activeMovementModal.target,
            coachingCues: activeMovementModal.cues,
            instructions:
              activeMovementModal.instructions && activeMovementModal.instructions.length > 0
                ? activeMovementModal.instructions
                : deriveHowToSteps(activeMovementModal.phase, activeMovementModal.name, activeMovementModal.cues),
            phaseLabel: activeMovementModal.phaseLabel,
          }}
          onClose={() => setActiveMovementModal(null)}
        />
      )}
    </section>
  )
}
