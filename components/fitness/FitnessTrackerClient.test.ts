import { describe, it, expect } from 'vitest'
import { resolveWorkoutCardioProtocol } from './FitnessTrackerClient'
import type { IntegratedCardioPrescription } from '@/lib/rag-nasm-program-generator'

describe('FitnessTrackerClient - Cardio Protocol Robustness', () => {
  it('normalizes coachingCues and recommendedModalities when provided as strings', () => {
    const rawCardioProtocol = {
      stage: 1,
      title: 'Post-Workout Tanaka Stage 1 Aerobic Fat Flush Walk',
      stageName: 'Aerobic Base Conditioning',
      targetZone: 'Zone 1 (111-128 BPM, max ceiling 135 BPM)',
      coachingCues: 'Maintain relaxed arm swing and tall spine. Breathe naturally in through nose.',
      durationMins: 12,
      workRestRatio: 'Continuous steady state (12:0)',
      recommendedModalities: 'Incline Treadmill Walk',
    } as unknown as IntegratedCardioPrescription

    const workout = {
      day: 1,
      focus: 'Upper Body Stabilization',
      notes: null,
      cardioProtocol: rawCardioProtocol,
    }

    const resolved = resolveWorkoutCardioProtocol(workout)

    expect(resolved).not.toBeNull()
    expect(Array.isArray(resolved?.coachingCues)).toBe(true)
    expect(resolved?.coachingCues).toEqual([
      'Maintain relaxed arm swing and tall spine. Breathe naturally in through nose.',
    ])

    expect(Array.isArray(resolved?.recommendedModalities)).toBe(true)
    expect(resolved?.recommendedModalities.length).toBeGreaterThan(0)
    expect(typeof resolved?.recommendedModalities[0]).toBe('string')
  })

  it('preserves coachingCues and recommendedModalities when already arrays', () => {
    const rawCardioProtocol = {
      stage: 1,
      title: 'Stage 1 Walk',
      stageName: 'Stage 1 Aerobic Base',
      targetZone: 'Zone 1',
      coachingCues: ['Breathe deeply', 'Pace yourself'],
      durationMins: 15,
      workRestRatio: 'Continuous',
      recommendedModalities: ['Outdoor Brisk Walking', 'Treadmill Walk'],
    } as unknown as IntegratedCardioPrescription

    const workout = {
      day: 2,
      focus: 'Lower Body',
      notes: null,
      cardioProtocol: rawCardioProtocol,
    }

    const resolved = resolveWorkoutCardioProtocol(workout)

    expect(resolved).not.toBeNull()
    expect(resolved?.coachingCues).toEqual(['Breathe deeply', 'Pace yourself'])
    expect(Array.isArray(resolved?.recommendedModalities)).toBe(true)
  })

  it('handles null/undefined coachingCues and recommendedModalities gracefully', () => {
    const rawCardioProtocol = {
      stage: 2,
      title: 'Intervals',
      stageName: 'Stage 2 Intervals',
      targetZone: 'Zone 2-3',
      coachingCues: null,
      durationMins: 20,
      workRestRatio: '1:2',
      recommendedModalities: null,
    } as unknown as IntegratedCardioPrescription

    const workout = {
      day: 3,
      focus: 'Full Body',
      notes: null,
      cardioProtocol: rawCardioProtocol,
    }

    const resolved = resolveWorkoutCardioProtocol(workout)

    expect(resolved).not.toBeNull()
    expect(Array.isArray(resolved?.coachingCues)).toBe(true)
    expect(resolved?.coachingCues).toEqual([])
    expect(Array.isArray(resolved?.recommendedModalities)).toBe(true)
    expect(resolved?.recommendedModalities.length).toBeGreaterThan(0)
  })
})

describe('FitnessTrackerClient - Coach Validation Banner Removed', () => {
  it('does not render coach validation banners as validation occurs at multi-step approval gate', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const clientFilePath = path.resolve(process.cwd(), 'components/fitness/FitnessTrackerClient.tsx')
    const clientContent = fs.readFileSync(clientFilePath, 'utf-8')

    expect(clientContent).not.toContain('safety-gate-certified-badge')
    expect(clientContent).not.toContain('safety-gate-pending-badge')
    expect(clientContent).not.toContain('In Master Coach Safety Gate Queue')
  })

  it('safely handles both string and structured object formats for clinicalRationale', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const clientFilePath = path.resolve(process.cwd(), 'components/fitness/FitnessTrackerClient.tsx')
    const clientContent = fs.readFileSync(clientFilePath, 'utf-8')

    expect(clientContent).toContain("typeof plan.plan_json.clinicalRationale === 'string'")
    expect(clientContent).toContain("typeof plan.plan_json.clinicalRationale === 'object'")
    expect(clientContent).toContain('bodyCompAnalysis')
    expect(clientContent).toContain('postureOhsaAnalysis')
    expect(clientContent).toContain('recommendedStrategy')
    expect(clientContent).toContain('weeklyCardioPrescription')
  })
})


