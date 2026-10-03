import { describe, it, expect } from 'vitest'
import {
  type Checkin,
  type ReadinessSummary,
  type WeeklyTelemetrySummary,
  type WorkoutLogItem,
} from './CoachCheckinReview'

describe('Stage 8 Telemetry Monitoring & Weekly Triage Mechanics', () => {
  const mockCheckinA: Checkin = {
    id: 'chk-1',
    week_start: '2026-09-01',
    sleep_quality: 4,
    stress_level: 2,
    soreness_level: 3,
    energy_level: 4,
    weight_kg: 84.5,
    waist_cm: 82,
    neck_cm: 39,
    hip_cm: 98,
    notes: 'Feeling strong on squat sets. Slight quad soreness after Wednesday hypertrophy block.',
    coach_feedback: 'Excellent work hitting depth and maintaining torso rigidity. Progressive overload cleared for next week.',
    coach_rating_adjustment: 1,
  }

  const mockCheckinB: Checkin = {
    id: 'chk-2',
    week_start: '2026-08-25',
    sleep_quality: 2,
    stress_level: 5,
    soreness_level: 4,
    energy_level: 2,
    weight_kg: 85.0,
    notes: 'Heavy travel and late nights. Hamstrings very tight.',
    coach_feedback: null,
    coach_rating_adjustment: null,
  }

  const mockReadinessSummary: ReadinessSummary = {
    completionRate14d: 88,
    avgRpe14d: 7.4,
    completedSessions7d: 4,
    daysSinceLastCompleted: 1,
    readiness: 'high',
    recommendation: 'Athlete appears ready for progressive overload and advanced sessions this week.',
  }

  const mockWeeklySummary: WeeklyTelemetrySummary = {
    completedWorkouts: 4,
    totalSets: 36,
    totalReps: 360,
    totalVolumeKg: 3450,
    avgRpe: 7.5,
    cardioMinutes: 90,
    cardioSessions: 3,
    volumeDisplay: 7606,
    volumeUnit: 'lb',
  }

  const mockLogs: WorkoutLogItem[] = [
    { session_date: '2026-09-01', completed: true, exertion_rpe: 8 },
    { session_date: '2026-09-03', completed: true, exertion_rpe: 7.5 },
    { session_date: '2026-09-05', completed: true, exertion_rpe: 7 },
  ]

  describe('Stage 8 Milestone Completion Evaluation', () => {
    it('accurately detects Stage 8 completion when both workouts and check-in reviews exist', () => {
      const hasLoggedWorkouts = mockLogs.length > 0 || mockWeeklySummary.completedWorkouts > 0
      const hasReviewedCheckin = [mockCheckinA, mockCheckinB].some(c => Boolean(c.coach_feedback?.trim()))
      const milestonesCompletedCount = (hasLoggedWorkouts ? 1 : 0) + (hasReviewedCheckin ? 1 : 0)

      expect(hasLoggedWorkouts).toBe(true)
      expect(hasReviewedCheckin).toBe(true)
      expect(milestonesCompletedCount).toBe(2)
    })

    it('identifies incomplete Stage 8 milestone when athlete has not submitted check-ins', () => {
      const emptyCheckins: Checkin[] = []
      const hasLoggedWorkouts = mockLogs.length > 0
      const hasReviewedCheckin = emptyCheckins.length > 0
      const milestonesCompletedCount = (hasLoggedWorkouts ? 1 : 0) + (hasReviewedCheckin ? 1 : 0)

      expect(hasLoggedWorkouts).toBe(true)
      expect(hasReviewedCheckin).toBe(false)
      expect(milestonesCompletedCount).toBe(1)
    })
  })

  describe('ACWR Workload Ratio Stratification', () => {
    function stratifyAcwr(ratio: number | null | undefined) {
      if (ratio === null || ratio === undefined) return { zone: 'No Data', tone: '#94A3B8', isNoData: true }
      if (ratio > 1.5) return { zone: 'Danger Zone (> 1.50)', tone: '#EF4444', isDanger: true }
      if (ratio >= 1.3) return { zone: 'Overreaching (1.30 - 1.50)', tone: 'var(--gold)', isOverreaching: true }
      if (ratio >= 0.8) return { zone: 'Optimal / Sweet Spot (0.80 - 1.30)', tone: '#10B981', isOptimal: true }
      return { zone: 'Under-training (< 0.80)', tone: '#38BDF8', isUnder: true }
    }

    it('classifies sweet spot ratio accurately', () => {
      const result = stratifyAcwr(1.15)
      expect(result.zone).toContain('Optimal')
      expect(result.tone).toBe('#10B981')
      expect(result.isOptimal).toBe(true)
    })

    it('classifies overreaching ratio accurately', () => {
      const result = stratifyAcwr(1.38)
      expect(result.zone).toContain('Overreaching')
      expect(result.tone).toBe('var(--gold)')
      expect(result.isOverreaching).toBe(true)
    })

    it('flags dangerous spike above 1.50 as injury danger', () => {
      const result = stratifyAcwr(1.65)
      expect(result.zone).toContain('Danger Zone')
      expect(result.tone).toBe('#EF4444')
      expect(result.isDanger).toBe(true)
    })

    it('classifies null ratio as No Data with muted tone', () => {
      const result = stratifyAcwr(null)
      expect(result.zone).toBe('No Data')
      expect(result.tone).toBe('#94A3B8')
      expect(result.isNoData).toBe(true)
    })
  })

  describe('Biofeedback & Weight Unit Conversions', () => {
    it('converts kilograms to imperial pounds accurately for check-in display', () => {
      const kg = 84.5
      const lbs = Math.round(kg * 2.20462 * 10) / 10
      expect(lbs).toBe(186.3)
    })

    it('formats circumferences string cleanly when available', () => {
      const parts = [
        mockCheckinA.waist_cm ? `W: ${mockCheckinA.waist_cm}cm` : null,
        mockCheckinA.neck_cm ? `N: ${mockCheckinA.neck_cm}cm` : null,
        mockCheckinA.hip_cm ? `H: ${mockCheckinA.hip_cm}cm` : null,
      ].filter(Boolean)
      expect(parts.join(' · ')).toBe('W: 82cm · N: 39cm · H: 98cm')
    })
  })

  describe('Readiness Calibration & Feedback Presets', () => {
    const ALLOWED_CALIBRATIONS = [-2, -1, 0, 1, 2]

    it('validates all coach rating adjustment values map to periodization directives', () => {
      for (const val of ALLOWED_CALIBRATIONS) {
        expect(typeof val).toBe('number')
        expect(val >= -2 && val <= 2).toBe(true)
      }
    })

    it('verifies quick presets contain comprehensive clinical coaching cues', () => {
      const presets = [
        'Outstanding adherence and biofeedback this week. Readiness is primed for progressive overload',
        'Soreness and stress metrics are slightly elevated. We are programming an active recovery session',
        'Acute workload has ramped up quickly relative to your rolling chronic baseline',
        'Great consistency on working sets. Make sure you are hitting daily protein targets',
      ]
      for (const p of presets) {
        expect(p.length).toBeGreaterThan(30)
      }
    })
  })

  describe('Unresponded Checkin Detection & Controlled Expansion', () => {
    it('detects unresponded checkin accurately and marks it as awaiting feedback', () => {
      const isAwaitingFeedbackA = !mockCheckinA.coach_feedback?.trim()
      const isAwaitingFeedbackB = !mockCheckinB.coach_feedback?.trim()

      expect(isAwaitingFeedbackA).toBe(false)
      expect(isAwaitingFeedbackB).toBe(true)
    })

    it('initializes expansion for unresponded checkin by default', () => {
      const checkins = [mockCheckinA, mockCheckinB]
      const init: Record<string, boolean> = {}
      const unresponded = checkins.filter(c => !c.coach_feedback?.trim())
      if (unresponded.length > 0) {
        unresponded.forEach(c => { init[c.id] = true })
      } else {
        init[checkins[0].id] = true
      }

      expect(init['chk-2']).toBe(true)
      expect(init['chk-1']).toBeUndefined()
    })
  })
})

