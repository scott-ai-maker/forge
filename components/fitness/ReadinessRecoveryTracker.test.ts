import { describe, it, expect } from 'vitest'
import {
  calculateReadinessScore,
  calculateAcwr,
  generateDeloadMicrocycle,
  ReadinessEvaluation,
  AcwrAnalysis,
  DeloadMicrocycleProtocol,
} from '@/lib/readiness-telemetry'
import { calculateAcwrFromWorkoutLogs } from '@/lib/coach-triage'
import type { DailyBiometricSummary } from '@/lib/wearables-telemetry'

describe('ReadinessRecoveryTracker & Recovery Workload Gate (Tool #13)', () => {
  describe('Master Gate Evaluation & Readiness Scoring', () => {
    it('evaluates Green gate (Score >= 80) under optimal physiological conditions', () => {
      const evaluation: ReadinessEvaluation = calculateReadinessScore({
        sleepHours: 8.5,
        sleepQuality: 9,
        restingHeartRate: 50,
        baselineRhr: 52,
        sorenessLevel: 2,
        stressLevel: 2,
        recentWorkloadUnits: [400, 450, 0, 420, 450, 0, 400],
        chronicAvgWeeklyWorkload: 2150,
      })

      expect(evaluation.gate).toBe('GREEN')
      expect(evaluation.score).toBeGreaterThanOrEqual(80)
      expect(evaluation.hasTelemetry).toBe(true)
      expect(evaluation.workoutAction).toBe('proceed_normal')
      expect(evaluation.rpeCap).toBe(9.5)
      expect(evaluation.intensityMultiplier).toBe(1.0)
      expect(evaluation.restIntervalAdjustmentSec).toBe(0)
      expect(evaluation.color).toBe('#34d399')
      expect(evaluation.tier).toBe('Optimal Adaptation')
      expect(evaluation.recommendation).toContain('Central Nervous System fully recovered')
    })

    it('evaluates Yellow gate (55 <= Score < 80) and recommends volume moderation when fatigued', () => {
      const evaluation: ReadinessEvaluation = calculateReadinessScore({
        sleepHours: 6.5,
        sleepQuality: 6,
        restingHeartRate: 55,
        baselineRhr: 52,
        sorenessLevel: 6,
        stressLevel: 5,
        recentWorkloadUnits: [500, 600, 0, 550, 600, 0, 550],
        chronicAvgWeeklyWorkload: 2200,
      })

      expect(evaluation.gate).toBe('YELLOW')
      expect(evaluation.score).toBeGreaterThanOrEqual(55)
      expect(evaluation.score).toBeLessThan(80)
      expect(evaluation.workoutAction).toBe('reduce_volume')
      expect(evaluation.rpeCap).toBe(8.0)
      expect(evaluation.intensityMultiplier).toBe(0.85)
      expect(evaluation.restIntervalAdjustmentSec).toBe(30)
      expect(evaluation.color).toBe('#C5A059')
      expect(evaluation.tier).toBe('Moderate Fatigue / Overreaching')
      expect(evaluation.recommendation).toContain('Moderate accumulated fatigue detected')
    })

    it('evaluates Red gate (Score < 55) and triggers active deload when severely exhausted', () => {
      const evaluation: ReadinessEvaluation = calculateReadinessScore({
        sleepHours: 5.0,
        sleepQuality: 4,
        restingHeartRate: 64,
        baselineRhr: 52, // +12 BPM elevated RHR indicates severe sympathetic stress
        sorenessLevel: 8,
        stressLevel: 8,
        recentWorkloadUnits: [800, 900, 0, 850, 900, 0, 850], // 4300 acute
        chronicAvgWeeklyWorkload: 2200, // ACWR = 1.95 (Danger Zone)
      })

      expect(evaluation.gate).toBe('RED')
      expect(evaluation.score).toBeLessThan(55)
      expect(evaluation.workoutAction).toBe('trigger_deload')
      expect(evaluation.rpeCap).toBe(7.0)
      expect(evaluation.intensityMultiplier).toBe(0.6)
      expect(evaluation.restIntervalAdjustmentSec).toBe(60)
      expect(evaluation.color).toBe('#f87171')
      expect(evaluation.tier).toBe('High Systemic / CNS Exhaustion')
      expect(evaluation.recommendation).toContain('Active Deload Microcycle')
      expect(evaluation.deloadPlan).toBeDefined()
      expect(evaluation.deloadPlan?.durationDays).toBe(7)
    })

    it('returns NO_DATA gate with null score when no biological telemetry exists', () => {
      const evaluation: ReadinessEvaluation = calculateReadinessScore({})

      expect(evaluation.gate).toBe('NO_DATA')
      expect(evaluation.score).toBeNull()
      expect(evaluation.hasTelemetry).toBe(false)
      expect(evaluation.tier).toBe('Awaiting Telemetry')
      expect(evaluation.color).toBe('#94A3B8')
      expect(evaluation.acwr.zone).toBe('No Data')
      expect(evaluation.acwr.ratio).toBeNull()
      expect(evaluation.recommendation).toContain('No telemetry data detected')
    })
  })

  describe('Intra-Workout Throttler Controls', () => {
    it('provides precise volume allowances, RIR ceilings, and rest adjustments for each gate', () => {
      // Helper to compute throttler specs from gate evaluation
      const getThrottlerSpecs = (evaluation: ReadinessEvaluation) => ({
        volumeAllowancePct: evaluation.hasTelemetry ? Math.round(evaluation.intensityMultiplier * 100) : 100,
        rpeCeiling: evaluation.rpeCap,
        targetRir: Math.round((10 - evaluation.rpeCap) * 10) / 10,
        restAdjustmentSec: evaluation.restIntervalAdjustmentSec,
      })

      // Green gate
      const greenEval = calculateReadinessScore({ sleepHours: 8, sleepQuality: 9, restingHeartRate: 50, baselineRhr: 52 })
      const greenSpecs = getThrottlerSpecs(greenEval)
      expect(greenSpecs.volumeAllowancePct).toBe(100)
      expect(greenSpecs.rpeCeiling).toBe(9.5)
      expect(greenSpecs.targetRir).toBe(0.5)
      expect(greenSpecs.restAdjustmentSec).toBe(0)

      // Yellow gate
      const yellowEval = calculateReadinessScore({ sleepHours: 6.5, sleepQuality: 6, restingHeartRate: 56, baselineRhr: 52, sorenessLevel: 6 })
      const yellowSpecs = getThrottlerSpecs(yellowEval)
      expect(yellowSpecs.volumeAllowancePct).toBe(85)
      expect(yellowSpecs.rpeCeiling).toBe(8.0)
      expect(yellowSpecs.targetRir).toBe(2.0)
      expect(yellowSpecs.restAdjustmentSec).toBe(30)

      // Red gate
      const redEval = calculateReadinessScore({ sleepHours: 5, sleepQuality: 3, restingHeartRate: 65, baselineRhr: 52, sorenessLevel: 9, stressLevel: 9 })
      const redSpecs = getThrottlerSpecs(redEval)
      expect(redSpecs.volumeAllowancePct).toBe(60)
      expect(redSpecs.rpeCeiling).toBe(7.0)
      expect(redSpecs.targetRir).toBe(3.0)
      expect(redSpecs.restAdjustmentSec).toBe(60)
    })
  })

  describe('Tim Gabbett ACWR & Injury Risk Dynamics', () => {
    it('classifies 0.80 to 1.30 ratio as Sweet Spot (Optimal Overload)', () => {
      const acwr: AcwrAnalysis = calculateAcwr([500, 500, 500, 500, 500, 0, 0], 2500)
      expect(acwr.hasData).toBe(true)
      expect(acwr.ratio).toBe(1.00)
      expect(acwr.zone).toBe('Sweet Spot (Optimal Overload)')
      expect(acwr.deloadRecommended).toBe(false)
      expect(acwr.injuryRiskPercentage).toBeLessThanOrEqual(10)
    })

    it('classifies 1.31 to 1.49 ratio as Overreaching with elevated injury risk', () => {
      const acwr: AcwrAnalysis = calculateAcwr([700, 700, 700, 700, 700, 0, 0], 2500) // 3500 / 2500 = 1.40
      expect(acwr.hasData).toBe(true)
      expect(acwr.ratio).toBe(1.40)
      expect(acwr.zone).toBe('Overreaching')
      expect(acwr.deloadRecommended).toBe(false)
      expect(acwr.injuryRiskPercentage).toBe(22)
    })

    it('classifies ratio >= 1.50 as Danger Zone (OTS Risk) and recommends deload', () => {
      const acwr: AcwrAnalysis = calculateAcwr([800, 800, 800, 800, 800, 0, 0], 2000) // 4000 / 2000 = 2.00
      expect(acwr.hasData).toBe(true)
      expect(acwr.ratio).toBe(2.00)
      expect(acwr.zone).toBe('Danger Zone (OTS Risk)')
      expect(acwr.deloadRecommended).toBe(true)
      expect(acwr.injuryRiskPercentage).toBe(42)
    })

    it('protects against cold-start artifact by calibrating baseline to 1.00 ratio', () => {
      // Athlete with acute volume but no established 28-day baseline history
      const acwr: AcwrAnalysis = calculateAcwr([600, 600, 600, 600, 600, 0, 0], 0)
      expect(acwr.hasData).toBe(true)
      expect(acwr.isCalibrating).toBe(true)
      expect(acwr.ratio).toBe(1.00)
      expect(acwr.zone).toBe('Sweet Spot (Optimal Overload)')
      expect(acwr.deloadRecommended).toBe(false)
    })
  })

  describe('Real Workout Logs & Set Volume Integration (calculateAcwrFromWorkoutLogs)', () => {
    it('derives authentic ACWR from athlete workout logs and completed sets', () => {
      const now = new Date()
      const getDateStr = (daysAgo: number) => {
        const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
        return d.toISOString().split('T')[0]
      }

      // Generate 3 sessions per week over 3 weeks (21 days)
      const mockLogs = [
        { id: 'log-1', session_date: getDateStr(1), session_title: 'Chest & Arms', exertion_rpe: 8 },
        { id: 'log-2', session_date: getDateStr(3), session_title: 'Back & Core', exertion_rpe: 8 },
        { id: 'log-3', session_date: getDateStr(5), session_title: 'Legs & Shoulders', exertion_rpe: 8 },
        { id: 'log-4', session_date: getDateStr(8), session_title: 'Chest & Arms', exertion_rpe: 8 },
        { id: 'log-5', session_date: getDateStr(10), session_title: 'Back & Core', exertion_rpe: 8 },
        { id: 'log-6', session_date: getDateStr(12), session_title: 'Legs & Shoulders', exertion_rpe: 8 },
        { id: 'log-7', session_date: getDateStr(15), session_title: 'Chest & Arms', exertion_rpe: 8 },
        { id: 'log-8', session_date: getDateStr(17), session_title: 'Back & Core', exertion_rpe: 8 },
        { id: 'log-9', session_date: getDateStr(19), session_title: 'Legs & Shoulders', exertion_rpe: 8 },
      ]

      // 4 sets per workout, 10 reps @ 60kg = 600 units per set x 4 = 2400 units per session
      const mockSets: Array<{ session_date: string; exercise_name: string; set_number: number; reps: number; weight_kg: number }> = []
      mockLogs.forEach(log => {
        for (let s = 1; s <= 4; s++) {
          mockSets.push({
            session_date: log.session_date,
            exercise_name: 'Bench Press',
            set_number: s,
            reps: 10,
            weight_kg: 60,
          })
        }
      })

      const acwrResult = calculateAcwrFromWorkoutLogs(mockLogs, mockSets)

      expect(acwrResult.hasData).toBe(true)
      expect(acwrResult.acuteWorkloadUnits).toBeGreaterThan(0)
      expect(acwrResult.chronicWorkloadUnits).toBeGreaterThan(0)
      expect(acwrResult.acwrRatio).toBeGreaterThanOrEqual(0.8)
      expect(acwrResult.acwrRatio).toBeLessThanOrEqual(1.3)
      expect(acwrResult.acwrZone).toBe('Sweet Spot')
    })
  })

  describe('NASM CPT-7 Chapter 21 Deload Microcycle Protocol', () => {
    it('generates a 7-day periodized active recovery microcycle with -40% volume reduction', () => {
      const deload: DeloadMicrocycleProtocol = generateDeloadMicrocycle()

      expect(deload.durationDays).toBe(7)
      expect(deload.protocolTitle).toContain('Periodized Active Deload')
      expect(deload.volumeReduction).toContain('-40%')
      expect(deload.intensityStrategy).toContain('80–85% 1RM')
      expect(deload.days).toHaveLength(7)

      // Day 1: -45% volume, RPE cap 7
      expect(deload.days[0].title).toBe('Upper Kinetic Chain Deload')
      expect(deload.days[0].volumeReductionPct).toBe(45)
      expect(deload.days[0].rpeCap).toBe(7)
      expect(deload.days[0].focus).toContain('Compound pushing & pulling')

      // Day 2: Parasympathetic Active Recovery
      expect(deload.days[1].title).toBe('Parasympathetic Active Recovery')
      expect(deload.days[1].conditioning).toContain('Zone 1')

      // Day 7: Pre-Macrocycle Re-Assessment
      expect(deload.days[6].title).toBe('Pre-Macrocycle Re-Assessment')
      expect(deload.days[6].mobilityFocus).toBeDefined()
    })
  })

  describe('Wearable Telemetry Synchronization (Apple Health / Health Connect)', () => {
    it('processes Apple Health daily biometric telemetry accurately', () => {
      const appleTelemetry: DailyBiometricSummary = {
        date: '2026-10-19',
        provider: 'apple_health',
        sleepHours: 8.2,
        restingHeartRate: 50,
        hrvRmssdMs: 74,
        cnsStressScore: 92,
        updatedAt: '2026-10-19T07:30:00Z',
      }

      const evaluation = calculateReadinessScore({
        sleepHours: appleTelemetry.sleepHours,
        restingHeartRate: appleTelemetry.restingHeartRate,
        baselineRhr: 52,
      })

      expect(evaluation.hasTelemetry).toBe(true)
      expect(evaluation.gate).toBe('GREEN')
      expect(evaluation.score).toBeGreaterThanOrEqual(85)
      expect(evaluation.workoutAction).toBe('proceed_normal')
    })
  })
})
