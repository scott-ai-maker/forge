import { describe, it, expect } from 'vitest'
import {
  evaluateClientOnboardingProgression,
  type ClientProgressionTelemetry,
} from '@/lib/coach-onboarding-progression'
import {
  normalizeCoachDashboardTab,
  normalizeCoachClientTab,
  CoachDashboardTabSchema,
  CoachClientTabSchema,
} from '@/lib/validation'
import { evaluateClientTriage } from '@/lib/coach-triage'

describe('Coach Onboarding Progression Workflow — Regression & Smoke Tests', () => {
  describe('Tab Schema & Routing Smoke Tests', () => {
    it('validates onboarding tab in CoachDashboardTabSchema and normalizer', () => {
      expect(CoachDashboardTabSchema.safeParse('onboarding').success).toBe(true)
      expect(normalizeCoachDashboardTab('onboarding')).toBe('onboarding')
      expect(normalizeCoachDashboardTab(['onboarding'])).toBe('onboarding')
    })

    it('validates onboarding tab in CoachClientTabSchema and normalizer', () => {
      expect(CoachClientTabSchema.safeParse('onboarding').success).toBe(true)
      expect(normalizeCoachClientTab('onboarding')).toBe('onboarding')
      expect(normalizeCoachClientTab(['onboarding'])).toBe('onboarding')
    })
  })

  describe('Suggested Action & Direct URL Target Integrity', () => {
    it('ensures every one of the 9 stages defines non-empty actionHref, actionLabel, and actionTab', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'test-client-999',
        clientName: 'Regression Athlete',
        email: 'athlete@example.com',
        designatedCoachId: 'coach-123',
      }

      const profile = evaluateClientOnboardingProgression(telemetry)
      expect(profile.stages).toHaveLength(9)

      for (const stage of profile.stages) {
        expect(stage.actionHref).toBeTruthy()
        expect(stage.actionHref).toMatch(/^\/coach\/clients\/test-client-999\?tab=/)
        expect(stage.actionLabel).toBeTruthy()
        expect(stage.actionTab).toBeTruthy()
        expect(stage.milestones.length).toBeGreaterThan(0)

        // All milestones must have keys and labels
        for (const m of stage.milestones) {
          expect(m.key).toBeTruthy()
          expect(m.label).toBeTruthy()
        }
      }
    })

    it('routes Stage 1 to commerce tab for package allocation', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'client-1',
        clientName: 'Intake Athlete',
        email: 'intake@example.com',
        designatedCoachId: null,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)
      expect(profile.currentStageNumber).toBe(1)
      expect(profile.nextAction.tab).toBe('commerce')
      expect(profile.nextAction.href).toBe('/coach/clients/client-1?tab=commerce#workspace-tab-content')
    })

    it('routes Stage 2 to shield tab with urgent blocker if cardiovascular flags present', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'client-2',
        clientName: 'Cardio Risk Athlete',
        email: 'cardio@example.com',
        designatedCoachId: 'coach-123',
        packages: [{ id: 'p-1', package_name: 'Silver 10', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
        intakeForm: {
          parq_answers: { hasHeartCondition: true },
          consent_signature_name: 'Athlete Risk',
          consent_signed_at: '2026-09-01T00:00:00Z',
        },
      }
      const profile = evaluateClientOnboardingProgression(telemetry)
      expect(profile.currentStageNumber).toBe(2)
      expect(profile.isBlockedByMedicalClearance).toBe(true)
      expect(profile.nextAction.tab).toBe('shield')
      expect(profile.nextAction.href).toBe('/coach/clients/client-2?tab=shield#workspace-tab-content')
      expect(profile.nextAction.urgency).toBe('urgent')
    })

    it('routes Stage 4 to assessment tab when ready for movement screen', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'client-4',
        clientName: 'Movement Athlete',
        email: 'movement@example.com',
        designatedCoachId: 'coach-123',
        packages: [{ id: 'p-1', package_name: 'Silver 10', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
        intakeForm: {
          parq_answers: { hasHeartCondition: false },
          consent_signature_name: 'Cleared Athlete',
          consent_signed_at: '2026-09-01T00:00:00Z',
        },
        fitnessProfile: {
          height_cm: 180,
          weight_kg: 80,
          fitness_goal: 'Hypertrophy',
          equipment_access: ['barbell', 'dumbbells'],
          training_days_per_week: 4,
        },
      }
      const profile = evaluateClientOnboardingProgression(telemetry)
      expect(profile.currentStageNumber).toBe(4)
      expect(profile.nextAction.tab).toBe('assessment')
      expect(profile.nextAction.href).toBe('/coach/clients/client-4?tab=assessment&subtab=ohsa#workspace-tab-content')
      expect(profile.nextAction.label).toBe('Conduct Overhead Squat Assessment')
    })

    it('routes Stage 5 to periodization tab when OHSA is completed', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'client-5',
        clientName: 'Periodization Athlete',
        email: 'periodization@example.com',
        designatedCoachId: 'coach-123',
        packages: [{ id: 'p-1', package_name: 'Silver 10', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
        intakeForm: {
          parq_answers: {},
          consent_signature_name: 'Cleared Athlete',
          consent_signed_at: '2026-09-01T00:00:00Z',
        },
        fitnessProfile: {
          height_cm: 180,
          weight_kg: 80,
          fitness_goal: 'Power',
          equipment_access: ['full_gym'],
          training_days_per_week: 4,
        },
        assessments: [
          {
            id: 'ohsa-1',
            assessment_date: '2026-09-01',
            ohsa_findings: ['feet_turn_out'],
          },
        ],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)
      expect(profile.currentStageNumber).toBe(5)
      expect(profile.nextAction.tab).toBe('periodization')
      expect(profile.nextAction.href).toBe('/coach/clients/client-5?tab=periodization#workspace-tab-content')
      expect(profile.nextAction.label).toBe('Architect 12-Week Macrocycle')
    })

    it('routes Stage 6 to program workspace when periodization macrocycle is established', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'client-6',
        clientName: 'Program Athlete',
        email: 'program@example.com',
        designatedCoachId: 'coach-123',
        packages: [{ id: 'p-1', package_name: 'Silver 10', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
        intakeForm: {
          parq_answers: {},
          consent_signature_name: 'Cleared Athlete',
          consent_signed_at: '2026-09-01T00:00:00Z',
        },
        fitnessProfile: {
          height_cm: 180,
          weight_kg: 80,
          fitness_goal: 'Power',
          equipment_access: ['full_gym'],
          training_days_per_week: 4,
        },
        assessments: [
          {
            id: 'ohsa-1',
            assessment_date: '2026-09-01',
            ohsa_findings: [],
          },
        ],
        latestPlan: {
          id: 'plan-draft',
          name: 'Draft Program',
          nasm_opt_phase: 1,
          plan_json: {
            periodizationPlan: {
              macrocycleId: 'm-1',
              weeks: [{ weekNumber: 1, phaseNumber: 1 }],
            },
          },
        },
      }
      const profile = evaluateClientOnboardingProgression(telemetry)
      expect(profile.currentStageNumber).toBe(6)
      expect(profile.nextAction.tab).toBe('program')
      expect(profile.nextAction.href).toBe('/coach/clients/client-6?tab=program#workspace-tab-content')
      expect(profile.nextAction.label).toBe('Review & Publish Workout Program')
    })
  })

  describe('Auto-Triage Periodization Action Execution Verification', () => {
    it('produces valid 1-click suggested actions for high ACWR workload spikes', () => {
      const triage = evaluateClientTriage({
        clientId: 'client-triage-1',
        clientName: 'Overreached Athlete',
        email: 'athlete@example.com',
        daysSinceLastCheckin: 1,
        readinessScore: 40,
        completionRate14d: 90,
        currentOptPhase: 2,
        acwrRatio: 1.65,
        acuteWorkloadUnits: 1650,
        chronicWorkloadUnits: 1000,
      })

      expect(triage.priority).toBe('red')
      expect(triage.suggestedPeriodizationAction).toBe('insert_deload')
      expect(triage.suggestedActionLabel).toContain('1-Click Restorative Deload')
    })

    it('produces valid 1-click suggested actions for fast responders', () => {
      const triage = evaluateClientTriage({
        clientId: 'client-triage-2',
        clientName: 'Elite Responder',
        email: 'elite@example.com',
        daysSinceLastCheckin: 0,
        readinessScore: 92,
        completionRate14d: 95,
        currentOptPhase: 1,
        acwrRatio: 1.05,
        acuteWorkloadUnits: 1050,
        chronicWorkloadUnits: 1000,
        hasAchievedOverload: true,
      })

      expect(triage.priority).toBe('green')
      expect(triage.suggestedPeriodizationAction).toBe('accelerate_phase')
      expect(triage.suggestedActionLabel).toContain('1-Click Fast-Track Phase')
    })
  })
})
