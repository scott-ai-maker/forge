import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SmartExerciseSwapModal from '@/components/coach/SmartExerciseSwapModal'
import InSetCoachAdaptationsBar from '@/components/fitness/tracker/InSetCoachAdaptationsBar'
import OptPhaseRoadmap, { OPT_PHASES } from '@/components/fitness/OptPhaseRoadmap'
import { getSmartSubstitutions } from '@/lib/nasm-exercise-substitution'
import {
  evaluatePainAndRedFlagTriage,
  evaluateProgressionAndIntensityCaps,
} from '@/src/lib/safety/clinicalGuardrails'

const REPO_ROOT = process.cwd()

describe('Feature #2 — Daily Workout Player, Smart Swap & 5-Phase NASM OPT™ Engine', () => {
  const swapModalSource = fs.readFileSync(
    path.join(REPO_ROOT, 'components/coach/SmartExerciseSwapModal.tsx'),
    'utf8'
  )
  const inSetBarSource = fs.readFileSync(
    path.join(REPO_ROOT, 'components/fitness/tracker/InSetCoachAdaptationsBar.tsx'),
    'utf8'
  )
  const trackerSource = fs.readFileSync(
    path.join(REPO_ROOT, 'components/fitness/FitnessTrackerClient.tsx'),
    'utf8'
  )

  it('renders SmartExerciseSwapModal as a native modal <dialog> with closedby="any", 44px targets, and aria-pressed filter buttons', () => {
    expect(swapModalSource).toContain('<dialog')
    expect(swapModalSource).toContain('dialog.showModal()')
    expect(swapModalSource).toContain("closedby: 'any'")
    expect(swapModalSource).toContain("!('closedBy' in HTMLDialogElement.prototype)")
    expect(swapModalSource).not.toContain('role="dialog"')
    expect(swapModalSource).not.toContain('aria-modal')

    const html = renderToStaticMarkup(
      React.createElement(SmartExerciseSwapModal, {
        currentExerciseName: 'Barbell Back Squat',
        optPhase: 'Phase 2: Strength Endurance',
        initialDiscomfort: 'knee',
        onSelectSubstitution: () => {},
        onClose: () => {},
      })
    )

    expect(html).toContain('data-testid="smart-exercise-swap-modal"')
    expect(html).toContain('SUBSTITUTE: Barbell Back Squat')
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('Knee / Patellar Relief')

    const kneeSubs = getSmartSubstitutions('Barbell Back Squat', 'Phase 2', 'knee')
    expect(kneeSubs.length).toBeGreaterThan(0)
    expect(kneeSubs[0].name.toLowerCase()).not.toBe('barbell back squat')
  })

  it('preserves active exercise accordion open state and InSetCoachAdaptationsBar mount stability across in-workout swaps', () => {
    // Regression guard: swapping an exercise must update expandedExerciseKey, read adaptedExercisesByDay in effectiveOpenExerciseKey,
    // and key exercise list items by stable slot index so safety override banners never collapse or unmount.
    expect(trackerSource).toContain('setExpandedExerciseKey(`${workoutDay}-${substitution.name}`)')
    expect(trackerSource).toContain('adaptedExercisesByDay[workout.day] ?? workout.exercises')
    expect(trackerSource).toContain('key={`${workout.day}-slot-${exIdx}`}')

    // SkipExerciseModal must also use native <dialog> and forward coach context notes to /api/fitness/skip-exercise
    expect(trackerSource).toContain('data-testid="skip-exercise-modal"')
    expect(trackerSource).toContain('...(trimmedNotes ? { notes: trimmedNotes } : {})')
  })

  it('enforces 44px minimum touch targets on InSetCoachAdaptationsBar controls and evaluates pinchy-joint safety regressions', () => {
    expect(inSetBarSource).not.toContain('min-h-[32px]')
    expect(inSetBarSource).not.toContain('min-h-[40px]')

    const html = renderToStaticMarkup(
      React.createElement(InSetCoachAdaptationsBar, {
        exerciseName: 'Barbell Overhead Press',
        optPhase: 2,
        currentTempo: '2-0-2-0',
        currentWeightInput: '95',
        onApplySubstitution: () => {},
        onAdjustLoadAndTempo: () => {},
      })
    )

    expect(html).toContain('data-testid="in-set-joint-pinchy-btn"')
    expect(html).toContain('data-testid="in-set-too-easy-hard-btn"')
    expect(html).toContain('data-testid="in-set-equipment-swap-btn"')

    const decision = evaluatePainAndRedFlagTriage({
      pinchyButtonTriggered: true,
      exerciseName: 'Barbell Overhead Press',
      optPhase: 2,
      jointComfort100: 60,
    })
    expect(decision.regression).toBeDefined()
    expect(decision.regression?.replacementExercise).toBeTruthy()

    const phase1Cap = evaluateProgressionAndIntensityCaps({
      currentOptPhase: 1,
      targetOptPhase: 1,
      stabilizationCertified: false,
      readinessIndex: 82,
      jointComfortScore100: 85,
      requestedLoadIncreasePct: 7.5,
    })
    expect(phase1Cap.maxAllowedRpe).toBeLessThanOrEqual(8)
  })

  it('renders all 5 NASM OPT™ phases in OptPhaseRoadmap with Phase 01–05 biomechanical prescriptions', () => {
    expect(OPT_PHASES.map(p => p.phase)).toEqual([1, 2, 3, 4, 5])
    expect(OPT_PHASES[0].tempo).toContain('4-2-1')
    expect(OPT_PHASES[3].tempo).toContain('X-0-X')

    const html = renderToStaticMarkup(
      React.createElement(OptPhaseRoadmap, {
        activePhaseNumber: 2,
        unlockedThroughPhase: 3,
        sandboxMode: true,
      })
    )
    expect(html).toContain('5-Phase NASM OPT™ Progression Roadmap')
    expect(html).toContain('PHASE 01')
    expect(html).toContain('PHASE 05')
    expect(html).toContain('Lean Muscle Work Capacity &amp; Superset Stamina')
  })
})
