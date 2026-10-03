import { describe, it, expect } from 'vitest'
import {
  evaluateClientOnboardingProgression,
  ClientProgressionTelemetry,
} from './coach-onboarding-progression'

describe('Athlete 9-Phase Onboarding Continuum: Smoke, Unit & Regression Suite', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. SMOKE TEST: Full Sequential 1-to-9 Phase Progression Trajectory
  // ──────────────────────────────────────────────────────────────────────────
  describe('Full Sequential 1-to-9 Phase Trajectory (Smoke Test)', () => {
    it('seamlessly transitions through all 9 stages in sequential order', () => {
      // Step 1: Initial Lead State (Stage 1 In Progress)
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'continuum-athlete-1',
        clientName: 'Sarah Connor',
        email: 'sarah@example.com',
        designatedCoachId: null,
        packages: [],
        currentStatus: 'active',
      }

      let result = evaluateClientOnboardingProgression(telemetry)
      expect(result.currentStageNumber).toBe(1)
      expect(result.currentStageId).toBe('intake_claim')
      expect(result.stages[0].state).toBe('in_progress')
      expect(result.stages[1].state).toBe('pending')
      expect(result.nextAction.tab).toBe('commerce')
      expect(result.completedStagesCount).toBe(0)
      expect(result.overallProgressPercent).toBe(0)
      expect(result.isFullyOnboarded).toBe(false)

      // Step 2: Coach Claims Lead & Grants Training Credits (Stage 1 -> Stage 2)
      telemetry.designatedCoachId = 'coach-scott-gordon'
      telemetry.packages = [{ id: 'pkg-101', sessions_remaining: 12, sessions_total: 12 }]
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[0].state).toBe('completed')
      expect(result.currentStageNumber).toBe(2)
      expect(result.currentStageId).toBe('liability_shield')
      expect(result.stages[1].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('shield')
      expect(result.completedStagesCount).toBe(1)

      // Step 3: Client Completes PAR-Q+ & Signs Liability Shield (Stage 2 -> Stage 3)
      telemetry.intakeForm = {
        consent_signature_name: 'Sarah Connor',
        consent_signed_at: '2026-09-01T09:00:00Z',
        parq_answers: {
          hasHeartCondition: false,
          experiencesChestPain: false,
          experiencesDizzinessOrSyncope: false,
          hasBoneOrJointProblem: false,
          takesBloodPressureOrHeartMedication: false,
          hasChronicSpinalOrDiscCondition: false,
          hasRecentSurgeryOrInjury: false,
        },
      }
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[1].state).toBe('completed')
      expect(result.currentStageNumber).toBe(3)
      expect(result.currentStageId).toBe('baseline_biometrics')
      expect(result.stages[2].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('overview')
      expect(result.completedStagesCount).toBe(2)

      // Step 4: Baseline Biometrics, Goal, Schedule & AI DEXA Scan (Stage 3 -> Stage 4)
      telemetry.fitnessProfile = {
        height_cm: 172,
        weight_kg: 66,
        fitness_goal: 'Body Recomposition & Joint Longevity',
        equipment_access: ['Commercial Gym', 'Barbell', 'Dumbbells', 'Cables'],
        training_days_per_week: 4,
      }
      telemetry.latestBodyComposition = {
        id: 'dexa-101',
        estimated_bodyfat_percent: 21.4,
        method: 'DEXA 4C Vision Scan',
        confidence_score: 0.96,
      }
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[2].state).toBe('completed')
      expect(result.currentStageNumber).toBe(4)
      expect(result.currentStageId).toBe('movement_testing')
      expect(result.stages[3].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('assessment')
      expect(result.completedStagesCount).toBe(3)

      // Step 5: AI Posture & OHSA Movement Screen Recorded (Stage 4 -> Stage 5)
      telemetry.assessments = [
        {
          id: 'nasm-asm-101',
          assessment_date: '2026-09-02T14:30:00Z',
          ohsa_findings: [
            { checkpoint: 'lumbar_pelvic_hip', compensation: 'anterior_pelvic_tilt', severity: 'moderate' },
            { checkpoint: 'upper_body', compensation: 'arms_fall_forward', severity: 'minor' },
          ],
          static_posture: [{ checkpoint: 'lumbar_pelvic_hip', observation: 'Excessive lordosis' }],
        },
      ]
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[3].state).toBe('completed')
      expect(result.currentStageNumber).toBe(5)
      expect(result.currentStageId).toBe('periodization')
      expect(result.stages[4].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('periodization')
      expect(result.completedStagesCount).toBe(4)

      // Step 6: 12-Week OPT Macrocycle Architecture Designated (Stage 5 -> Stage 6)
      telemetry.latestPlan = {
        id: 'plan-101',
        name: 'Sarah Connor 12-Week Stabilization & Hypertrophy Continuum',
        nasm_opt_phase: 1,
        phase_name: 'Phase 1: Stabilization Endurance',
        sessions_per_week: 4,
        plan_json: {
          periodizationPlan: {
            macrocycleWeeks: 12,
            mesocycles: [
              { name: 'Block 1: Stabilization Endurance', weeks: 4, phase: 1 },
              { name: 'Block 2: Strength Endurance', weeks: 4, phase: 2 },
              { name: 'Block 3: Hypertrophy & Deload', weeks: 4, phase: 3 },
            ],
          },
        },
      }
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[4].state).toBe('completed')
      expect(result.currentStageNumber).toBe(6)
      expect(result.currentStageId).toBe('program_design')
      expect(result.stages[5].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('program')
      expect(result.completedStagesCount).toBe(5)

      // Step 7: Program Design Prescribed with 4-Phase CEx Warmup (Stage 6 -> Stage 7)
      telemetry.latestPlan = {
        ...telemetry.latestPlan,
        plan_json: {
          ...telemetry.latestPlan.plan_json,
          workouts: [
            {
              day: 1,
              focus: 'Total Body Stabilization & Kinetic Chain Integration',
              exercises: [
                { name: 'SMR Foam Roll Hip Flexors', tempo: 'Hold 30s' },
                { name: 'Static Hip Flexor Stretch', tempo: 'Hold 30s' },
                { name: 'Glute Bridge with Resistance Loop', sets: 3, reps: 15, tempo: '4/2/1' },
                { name: 'Single-Leg Dumbbell Romanian Deadlift', sets: 3, reps: 12, tempo: '4/2/1' },
              ],
            },
            {
              day: 2,
              focus: 'Upper Body Stabilization & Latissimus Re-alignment',
              exercises: [
                { name: 'Ball Squat to Overhead Press', sets: 3, reps: 12, tempo: '4/2/1' },
              ],
            },
          ],
        },
      }
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[5].state).toBe('completed')
      expect(result.isFullyOnboarded).toBe(false)
      expect(result.isOnboardingComplete).toBe(false)
      expect(result.completedOnboardingCount).toBe(6)
      expect(result.currentStageNumber).toBe(7)
      expect(result.currentStageId).toBe('delivery_kickoff')
      expect(result.stages[6].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('sessions')
      expect(result.completedStagesCount).toBe(6)

      // Step 8: Live Coaching Session Delivered & SOAP Notes Dictated (Stage 7 -> Stage 8)
      telemetry.sessions = [
        {
          id: 'session-live-1',
          status: 'completed',
          scheduled_at: '2026-09-03T11:00:00Z',
          notes: 'SOAP: S: Athlete energized. O: 4/2/1 tempo maintained on single-leg RDL. A: Valgus corrected. P: Advance loads next microcycle.',
        },
      ]
      result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[6].state).toBe('completed')
      expect(result.isFullyOnboarded).toBe(true)
      expect(result.isOnboardingComplete).toBe(true)
      expect(result.completedOnboardingCount).toBe(7)
      expect(result.isMaintenanceAndCompliance).toBe(true)
      expect(result.currentStageNumber).toBe(8)
      expect(result.currentStageId).toBe('followups_triage')
      expect(result.stages[7].state).toBe('in_progress')
      expect(result.nextAction.tab).toBe('checkins')
      expect(result.completedStagesCount).toBe(7)

      // Step 9: Workout Logs & Sunday Check-In Reviewed -> Full 9-Phase Onboarding Continuum Complete!
      telemetry.workoutLogs = [
        { session_date: '2026-09-04', completed: true },
        { session_date: '2026-09-06', completed: true },
      ]
      telemetry.weeklyCheckins = [
        {
          id: 'checkin-wk1',
          week_start: '2026-09-07',
          coach_feedback: 'Outstanding form adherence. ACWR ratio at optimal 1.05 sweet spot.',
        },
      ]
      result = evaluateClientOnboardingProgression(telemetry)

      // Both Stage 8 and Stage 9 (active standing retained) complete!
      expect(result.stages[7].state).toBe('completed')
      expect(result.stages[8].state).toBe('completed')
      expect(result.completedStagesCount).toBe(9)
      expect(result.totalStagesCount).toBe(9)
      expect(result.overallProgressPercent).toBe(100)
      expect(result.isFullyOnboarded).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 2. REGRESSION TESTS: Edge Cases, Payloads & Clinical Safety
  // ──────────────────────────────────────────────────────────────────────────
  describe('Clinical Blocker & Clearance Safety (Regression)', () => {
    it('locks pipeline at Stage 2 when cardiovascular red flags require MD clearance', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'blocked-athlete',
        clientName: 'Cardio Risk Athlete',
        email: 'cardio@example.com',
        designatedCoachId: 'coach-1',
        packages: [{ id: 'p1', sessions_remaining: 10, sessions_total: 10 }],
        intakeForm: {
          consent_signature_name: 'Cardio Risk Athlete',
          consent_signed_at: '2026-09-01',
          parq_answers: {
            hasHeartCondition: true,
            experiencesChestPain: true,
          },
        },
      }

      const result = evaluateClientOnboardingProgression(telemetry)

      expect(result.currentStageNumber).toBe(2)
      expect(result.currentStageId).toBe('liability_shield')
      expect(result.stages[1].state).toBe('blocked')
      expect(result.isBlockedByMedicalClearance).toBe(true)
      expect(result.medicalClearanceTier).toBe('High Risk - Medical Clearance Required')
      expect(result.nextAction.urgency).toBe('urgent')
      expect(result.nextAction.title).toBe('Resolve Clinical Clearance Blocker')
      expect(result.stages[2].state).toBe('blocked')
      expect(result.stages[3].state).toBe('blocked')
      expect(result.stages[4].state).toBe('blocked')
      expect(result.stages[5].state).toBe('blocked')
    })

    it('unblocks immediately when physician clearance is confirmed', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'cleared-athlete',
        clientName: 'Cleared Athlete',
        email: 'cleared@example.com',
        designatedCoachId: 'coach-1',
        packages: [{ id: 'p1', sessions_remaining: 10, sessions_total: 10 }],
        intakeForm: {
          consent_signature_name: 'Cleared Athlete',
          consent_signed_at: '2026-09-01',
          parq_answers: {
            hasHeartCondition: false,
            experiencesChestPain: false,
            hasBoneOrJointProblem: true, // Orthopedic condition cleared with modifications
          },
        },
        fitnessProfile: {
          height_cm: 175,
          weight_kg: 72,
          fitness_goal: 'Strength Endurance',
          equipment_access: ['dumbbells'],
          training_days_per_week: 3,
        },
      }

      const result = evaluateClientOnboardingProgression(telemetry)

      expect(result.stages[1].state).toBe('completed')
      expect(result.isBlockedByMedicalClearance).toBe(false)
      expect(result.medicalClearanceTier).toBe('Moderate Risk')
      expect(result.stages[2].state).toBe('completed')
      expect(result.currentStageNumber).toBe(4) // Directly advances to Movement Screen
    })
  })

  describe('Program Design Payload Resilience (Regression)', () => {
    it('accepts workout payload formatted as plan_json.macrocyclePlan.workouts', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'macrocycle-athlete',
        clientName: 'Macro Athlete',
        email: 'macro@example.com',
        designatedCoachId: 'coach-1',
        packages: [{ id: 'p1', sessions_remaining: 10, sessions_total: 10 }],
        intakeForm: { consent_signature_name: 'Macro Athlete', consent_signed_at: '2026-09-01' },
        fitnessProfile: {
          height_cm: 180,
          weight_kg: 78,
          fitness_goal: 'hypertrophy',
          equipment_access: ['gym'],
          training_days_per_week: 4,
        },
        assessments: [{ id: 'asm-1', assessment_date: '2026-09-02', ohsa_findings: [] }],
        latestPlan: {
          id: 'plan-nested',
          name: 'AI Synthesized Protocol',
          nasm_opt_phase: 2,
          phase_name: 'Phase 2: Strength Endurance',
          plan_json: {
            macrocyclePlan: {
              workouts: [
                { day: 1, focus: 'Upper Push / Pull' },
                { day: 2, focus: 'Lower Knee / Hip' },
                { day: 3, focus: 'Core & Kinetic Chain' },
              ],
            },
          },
        },
      }

      const result = evaluateClientOnboardingProgression(telemetry)
      expect(result.stages[5].state).toBe('completed')
      expect(result.stages[5].milestones[0].completed).toBe(true)
      expect(result.stages[5].milestones[0].detail).toContain('3 workout sessions programmed')
      expect(result.isFullyOnboarded).toBe(false)
      expect(result.completedOnboardingCount).toBe(6)
      expect(result.currentStageNumber).toBe(7)
    })

    it('falls back to sessions_per_week count if exercise matrix is pre-calibrated and not periodization-only', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'fallback-athlete',
        clientName: 'Fallback Athlete',
        email: 'fallback@example.com',
        designatedCoachId: 'coach-1',
        packages: [{ id: 'p1', sessions_remaining: 8, sessions_total: 8 }],
        intakeForm: { consent_signature_name: 'Fallback Athlete', consent_signed_at: '2026-09-01' },
        fitnessProfile: {
          height_cm: 170,
          weight_kg: 65,
          fitness_goal: 'general_fitness',
          equipment_access: ['bodyweight'],
          training_days_per_week: 3,
        },
        assessments: [{ id: 'asm-1', assessment_date: '2026-09-02', ohsa_findings: [] }],
        latestPlan: {
          id: 'plan-freq-fallback',
          name: 'Pre-calibrated 3-Day Protocol',
          nasm_opt_phase: 1,
          phase_name: 'Phase 1: Stabilization Endurance',
          sessions_per_week: 3,
          plan_json: null,
        },
      }

      const result = evaluateClientOnboardingProgression(telemetry)
      expect(result.stages[5].state).toBe('completed')
      expect(result.stages[5].milestones[0].completed).toBe(true)
      expect(result.stages[5].milestones[0].detail).toContain('3 workout sessions programmed')
      expect(result.isFullyOnboarded).toBe(false)
      expect(result.completedOnboardingCount).toBe(6)
      expect(result.currentStageNumber).toBe(7)
    })
  })

  describe('Client Lifecycle Status Variations (Regression)', () => {
    it('holds Stage 9 in progress if client status is paused or inactive', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'paused-athlete',
        clientName: 'Paused Athlete',
        email: 'paused@example.com',
        designatedCoachId: 'coach-1',
        currentStatus: 'paused',
        packages: [{ id: 'p1', sessions_remaining: 5, sessions_total: 10 }],
        intakeForm: { consent_signature_name: 'Paused Athlete', consent_signed_at: '2026-08-01' },
        fitnessProfile: { height_cm: 180, weight_kg: 80, fitness_goal: 'recomp', equipment_access: ['gym'], training_days_per_week: 3 },
        assessments: [{ id: 'asm-1', assessment_date: '2026-08-02', ohsa_findings: [] }],
        latestPlan: {
          id: 'p-1',
          name: 'Plan',
          nasm_opt_phase: 1,
          phase_name: 'Phase 1: Stabilization Endurance',
          sessions_per_week: 3,
          plan_json: { workouts: [{ day: 1 }] },
        },
        sessions: [{ id: 's-1', status: 'completed', scheduled_at: '2026-08-05', notes: 'SOAP notes recorded' }],
        workoutLogs: [{ session_date: '2026-08-06', completed: true }],
        weeklyCheckins: [{ id: 'c-1', week_start: '2026-08-10', coach_feedback: 'Feedback' }],
        auditLogsCount: 2,
      }

      const result = evaluateClientOnboardingProgression(telemetry)
      expect(result.stages[7].state).toBe('completed') // Stage 8 complete
      expect(result.stages[8].state).toBe('in_progress') // Stage 9 paused
      expect(result.completedStagesCount).toBe(8)
      expect(result.overallProgressPercent).toBe(89)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 3. UNIT TESTS: Exact Milestone Accuracy & Action Routing Across All 9 Stages
  // ──────────────────────────────────────────────────────────────────────────
  describe('Exact Action Routing & Milestone Mapping (Unit)', () => {
    it('verifies that each stage targets the exact corresponding coach workspace tab and hash anchor', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: 'tab-athlete',
        clientName: 'Tab Athlete',
        email: 'tab@example.com',
      }
      const result = evaluateClientOnboardingProgression(telemetry)

      const expectedTabMappings = [
        { stage: 1, tab: 'commerce', href: '/coach/clients/tab-athlete?tab=commerce#workspace-tab-content' },
        { stage: 2, tab: 'shield', href: '/coach/clients/tab-athlete?tab=shield#workspace-tab-content' },
        { stage: 3, tab: 'overview', href: '/coach/clients/tab-athlete?tab=overview#workspace-tab-content' },
        { stage: 4, tab: 'assessment', href: '/coach/clients/tab-athlete?tab=assessment&subtab=ohsa#workspace-tab-content' },
        { stage: 5, tab: 'periodization', href: '/coach/clients/tab-athlete?tab=periodization#workspace-tab-content' },
        { stage: 6, tab: 'program', href: '/coach/clients/tab-athlete?tab=program#workspace-tab-content' },
        { stage: 7, tab: 'sessions', href: '/coach/clients/tab-athlete?tab=sessions#workspace-tab-content' },
        { stage: 8, tab: 'checkins', href: '/coach/clients/tab-athlete?tab=checkins#workspace-tab-content' },
        { stage: 9, tab: 'lifecycle', href: '/coach/clients/tab-athlete?tab=lifecycle#workspace-tab-content' },
      ]

      expectedTabMappings.forEach(mapping => {
        const stage = result.stages[mapping.stage - 1]
        expect(stage.stageNumber).toBe(mapping.stage)
        expect(stage.actionTab).toBe(mapping.tab)
        expect(stage.actionHref).toBe(mapping.href)
      })
    })

    it('verifies AI DEXA body composition scan is an optional bonus milestone in Stage 3', () => {
      const telemetryWithoutDexa: ClientProgressionTelemetry = {
        clientId: 'no-dexa-athlete',
        clientName: 'No Dexa Athlete',
        email: 'nodexa@example.com',
        designatedCoachId: 'coach-1',
        packages: [{ id: 'p1', sessions_remaining: 10, sessions_total: 10 }],
        intakeForm: { consent_signature_name: 'No Dexa', consent_signed_at: '2026-09-01' },
        fitnessProfile: {
          height_cm: 182,
          weight_kg: 84,
          fitness_goal: 'Powerlifting',
          equipment_access: ['Commercial Gym'],
          training_days_per_week: 4,
        },
      }

      const result = evaluateClientOnboardingProgression(telemetryWithoutDexa)
      const stage3 = result.stages[2]
      expect(stage3.state).toBe('completed')
      const dexaMilestone = stage3.milestones.find(m => m.key === 'dexa_body_comp_scanned')
      expect(dexaMilestone?.completed).toBe(false)
      expect(dexaMilestone?.required).toBe(false)
    })
  })
})
