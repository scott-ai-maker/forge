import { describe, it, expect } from 'vitest'
import {
  evaluateClientOnboardingProgression,
  ClientProgressionTelemetry,
} from './coach-onboarding-progression'

describe('Client Onboarding Progression Engine', () => {
  it('evaluates a fresh unassigned lead at Stage 1', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-1',
      clientName: 'Alex Mercer',
      email: 'alex@example.com',
      designatedCoachId: null,
      packages: [],
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.currentStageNumber).toBe(1)
    expect(result.currentStageId).toBe('intake_claim')
    expect(result.overallProgressPercent).toBe(0)
    expect(result.completedStagesCount).toBe(0)
    expect(result.stages[0].state).toBe('in_progress')
    expect(result.isFullyOnboarded).toBe(false)
    expect(result.nextAction.title).toContain('Stage 1')
  })

  it('evaluates an assigned athlete with packages moving to Stage 2', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-2',
      clientName: 'Jordan Lee',
      email: 'jordan@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 10, sessions_total: 10 }],
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[0].state).toBe('completed')
    expect(result.currentStageNumber).toBe(2)
    expect(result.currentStageId).toBe('liability_shield')
    expect(result.stages[1].state).toBe('in_progress')
    expect(result.nextAction.tab).toBe('shield')
  })

  it('flags clinical blocker if athlete has cardiovascular PAR-Q flag requiring MD clearance', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-3',
      clientName: 'Taylor Hayes',
      email: 'taylor@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 5, sessions_total: 5 }],
      intakeForm: {
        parq_answers: { hasHeartCondition: true },
        parq_any_yes: true,
        consent_signature_name: 'Taylor Hayes',
        consent_signed_at: '2026-09-01T12:00:00Z',
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.currentStageNumber).toBe(2)
    expect(result.stages[1].state).toBe('blocked')
    expect(result.isBlockedByMedicalClearance).toBe(true)
    expect(result.nextAction.urgency).toBe('urgent')
    expect(result.nextAction.title).toBe('Resolve Clinical Clearance Blocker')
    expect(result.nextAction.tab).toBe('shield')
  })

  it('progresses to Stage 4 (Movement Screen) when vitals and equipment are configured', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-4',
      clientName: 'Sam Rivera',
      email: 'sam@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 12, sessions_total: 12 }],
      intakeForm: {
        parq_answers: {
          hasHeartCondition: false,
          experiencesChestPain: false,
          experiencesDizzinessOrSyncope: false,
          hasBoneOrJointProblem: false,
          takesBloodPressureOrHeartMedication: false,
          hasChronicSpinalOrDiscCondition: false,
          hasRecentSurgeryOrInjury: false,
        },
        consent_signature_name: 'Sam Rivera',
        consent_signed_at: '2026-09-01T12:00:00Z',
      },
      fitnessProfile: {
        height_cm: 180,
        weight_kg: 82,
        fitness_goal: 'hypertrophy',
        equipment_access: ['dumbbells', 'barbell', 'bench'],
        training_days_per_week: 4,
        onboarding_completed_at: '2026-09-01T14:00:00Z',
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[0].state).toBe('completed') // Stage 1
    expect(result.stages[1].state).toBe('completed') // Stage 2
    expect(result.stages[2].state).toBe('completed') // Stage 3
    expect(result.currentStageNumber).toBe(4)
    expect(result.currentStageId).toBe('movement_testing')
    expect(result.stages[3].state).toBe('in_progress')
    expect(result.nextAction.tab).toBe('assessment')
    expect(result.nextAction.label).toContain('Overhead Squat')
  })

  it('completes Stage 4 when OHSA assessment is recorded and prompts Periodization', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-5',
      clientName: 'Morgan Bailey',
      email: 'morgan@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 12, sessions_total: 12 }],
      intakeForm: {
        parq_answers: {},
        consent_signature_name: 'Morgan Bailey',
        consent_signed_at: '2026-09-01T12:00:00Z',
      },
      fitnessProfile: {
        height_cm: 175,
        weight_kg: 70,
        fitness_goal: 'fat_loss',
        equipment_access: ['dumbbells'],
        training_days_per_week: 3,
      },
      assessments: [
        {
          id: 'asm-1',
          assessment_date: '2026-09-02T10:00:00Z',
          ohsa_findings: [{ compensation: 'knees_move_inward', severity: 'moderate' }],
          static_posture: [{ checkpoint: 'knees', observation: 'Knee valgus' }],
        },
      ],
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[3].state).toBe('completed') // Movement Testing complete
    expect(result.currentStageNumber).toBe(5)
    expect(result.currentStageId).toBe('periodization')
    expect(result.nextAction.tab).toBe('periodization')
    expect(result.nextAction.label).toContain('Macrocycle')
  })

  it('marks isFullyOnboarded true when Stage 7 (Delivery Kickoff) is completed', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-6',
      clientName: 'Casey Vance',
      email: 'casey@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 8, sessions_total: 8 }],
      intakeForm: {
        parq_answers: {},
        consent_signature_name: 'Casey Vance',
        consent_signed_at: '2026-09-01T12:00:00Z',
      },
      fitnessProfile: {
        height_cm: 185,
        weight_kg: 90,
        fitness_goal: 'strength',
        equipment_access: ['barbell', 'rack'],
        training_days_per_week: 4,
      },
      assessments: [
        {
          id: 'asm-1',
          assessment_date: '2026-09-02T10:00:00Z',
          ohsa_findings: [{ compensation: 'feet_turn_out' }],
        },
      ],
      latestPlan: {
        id: 'plan-1',
        name: 'Phase 2 Strength Endurance Block',
        nasm_opt_phase: 2,
        plan_json: {
          periodizationPlan: { macrocycleWeeks: 12 },
          sessions: [{ name: 'Workout A', exercises: [{ name: 'Barbell Squat' }] }],
        },
      },
    }

    let result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[4].state).toBe('completed') // Periodization complete
    expect(result.stages[5].state).toBe('completed') // Program published
    expect(result.completedOnboardingCount).toBe(6)
    expect(result.isFullyOnboarded).toBe(false) // Onboarding not complete until Stage 7
    expect(result.isOnboardingComplete).toBe(false)
    expect(result.currentStageNumber).toBe(7)
    expect(result.currentStageId).toBe('delivery_kickoff')
    expect(result.nextAction.tab).toBe('sessions')

    // Now complete Stage 7 per consultation waive
    telemetry.consultWaived = true
    result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[6].state).toBe('completed')
    expect(result.completedOnboardingCount).toBe(7)
    expect(result.isFullyOnboarded).toBe(true)
    expect(result.isOnboardingComplete).toBe(true)
    expect(result.isMaintenanceAndCompliance).toBe(true)
    expect(result.currentStageNumber).toBe(8)
  })

  it('tracks progression through delivery and follow-ups to Stage 9', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-7',
      clientName: 'Devon Smith',
      email: 'devon@example.com',
      designatedCoachId: 'coach-1',
      currentStatus: 'active',
      packages: [{ id: 'pkg-1', sessions_remaining: 6, sessions_total: 10 }],
      intakeForm: {
        parq_answers: {},
        consent_signature_name: 'Devon Smith',
        consent_signed_at: '2026-08-01T12:00:00Z',
      },
      fitnessProfile: {
        height_cm: 172,
        weight_kg: 68,
        fitness_goal: 'recomposition',
        equipment_access: ['gym'],
        training_days_per_week: 4,
      },
      assessments: [
        {
          id: 'asm-1',
          assessment_date: '2026-08-02T10:00:00Z',
          ohsa_findings: [{ compensation: 'arms_fall_forward' }],
        },
      ],
      latestPlan: {
        id: 'plan-1',
        name: 'Phase 1 Stabilization Endurance',
        nasm_opt_phase: 1,
        plan_json: {
          periodizationPlan: { macrocycleWeeks: 12 },
          sessions: [{ name: 'Day 1' }],
        },
      },
      sessions: [
        {
          id: 'session-1',
          status: 'completed',
          scheduled_at: '2026-08-05T14:00:00Z',
          notes: 'SOAP: Athlete performed well with 4/2/1 tempo.',
        },
      ],
      weeklyCheckins: [
        {
          id: 'chk-1',
          week_start: '2026-08-10',
          coach_feedback: 'Great compliance, keep up the tempo control.',
        },
      ],
      workoutLogs: [
        { session_date: '2026-08-11', completed: true },
        { session_date: '2026-08-13', completed: true },
      ],
      auditLogsCount: 3,
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[6].state).toBe('completed') // Stage 7: Delivery kickoff complete
    expect(result.stages[7].state).toBe('completed') // Stage 8: Follow-ups complete
    expect(result.stages[8].state).toBe('completed') // Stage 9: Retention & Governance complete
    expect(result.onboardingProgressPercent).toBe(100)
    expect(result.complianceProgressPercent).toBe(100)
    expect(result.overallProgressPercent).toBe(100)
    expect(result.completedStagesCount).toBe(9)
  })

  it('calculates independent progress percentages for onboarding (Phases 1-7) and compliance (Phases 8-9)', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-dual-prog',
      clientName: 'Dual Track Athlete',
      email: 'dual@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 5, sessions_total: 10 }],
      intakeForm: {
        parq_answers: {},
        consent_signature_name: 'Dual Track Athlete',
        consent_signed_at: '2026-08-01T12:00:00Z',
      },
      fitnessProfile: {
        height_cm: 180,
        weight_kg: 75,
        fitness_goal: 'strength',
        equipment_access: ['gym'],
        training_days_per_week: 3,
      },
    }

    // Stages 1, 2, 3 complete = 3/7 onboarding phases => 43%
    let result = evaluateClientOnboardingProgression(telemetry)
    expect(result.completedOnboardingCount).toBe(3)
    expect(result.onboardingProgressPercent).toBe(43) // Math.round((3/7)*100) = 43
    expect(result.complianceProgressPercent).toBe(0)

    // Complete Stage 7 => 100% onboarding
    telemetry.assessments = [{ id: 'asm-1', assessment_date: '2026-08-02T10:00:00Z' }]
    telemetry.latestPlan = { id: 'plan-1', name: 'Plan', nasm_opt_phase: 1, plan_json: { periodizationPlan: { macrocycleWeeks: 4 }, sessions: [{ name: 'Day 1' }] } }
    telemetry.sessions = [{ id: 's-1', status: 'completed', scheduled_at: '2026-08-05T14:00:00Z', notes: 'Done' }]
    result = evaluateClientOnboardingProgression(telemetry)
    expect(result.completedOnboardingCount).toBe(7)
    expect(result.onboardingProgressPercent).toBe(100)
    expect(result.complianceProgressPercent).toBe(0)

    // Complete Stage 8 with Stage 9 paused (1 of 2 compliance pillars) => 50% compliance
    telemetry.currentStatus = 'paused'
    telemetry.workoutLogs = [{ session_date: '2026-08-11', completed: true }]
    telemetry.weeklyCheckins = [{ id: 'chk-1', week_start: '2026-08-10', coach_feedback: 'Good work' }]
    result = evaluateClientOnboardingProgression(telemetry)
    expect(result.completedComplianceCount).toBe(1)
    expect(result.onboardingProgressPercent).toBe(100)
    expect(result.complianceProgressPercent).toBe(50) // Math.round((1/2)*100) = 50

    // Set active standing => 100% compliance
    telemetry.currentStatus = 'active'
    result = evaluateClientOnboardingProgression(telemetry)
    expect(result.completedComplianceCount).toBe(2)
    expect(result.complianceProgressPercent).toBe(100)
  })

  it('correctly maps all 9 stages to their corresponding coach tabs and numbers', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-8',
      clientName: 'Robin Hayes',
      email: 'robin@example.com',
    }
    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages).toHaveLength(9)
    const expectedTabs = [
      'commerce',      // 1: intake_claim
      'shield',        // 2: liability_shield
      'overview',      // 3: baseline_biometrics
      'assessment',    // 4: movement_testing
      'periodization', // 5: periodization
      'program',       // 6: program_design
      'sessions',      // 7: delivery_kickoff
      'checkins',      // 8: followups_triage
      'lifecycle',     // 9: retention_governance
    ]
    result.stages.forEach((stage, idx) => {
      expect(stage.stageNumber).toBe(idx + 1)
      expect(stage.actionTab).toBe(expectedTabs[idx])
      expect(stage.actionHref).toContain(`/coach/clients/client-8`)
    })
  })

  it('handles empty and partial telemetry gracefully without errors', () => {
    const minimal: ClientProgressionTelemetry = {
      clientId: 'client-empty',
      clientName: '',
      email: '',
    }
    const result = evaluateClientOnboardingProgression(minimal)
    expect(result.currentStageNumber).toBe(1)
    expect(result.stages).toHaveLength(9)
    expect(result.nextAction).toBeDefined()
    expect(result.nextAction.href).toBeDefined()
  })

  it('reflects AI DEXA body composition scan completion in Stage 3 milestones', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-dexa',
      clientName: 'Dexa Athlete',
      email: 'dexa@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'p-1', sessions_remaining: 10, sessions_total: 10 }],
      intakeForm: { consent_signature_name: 'Dexa Athlete', consent_signed_at: '2026-09-01' },
      fitnessProfile: {
        height_cm: 180,
        weight_kg: 80,
        fitness_goal: 'recomposition',
        equipment_access: ['dumbbells'],
        training_days_per_week: 3,
      },
      latestBodyComposition: {
        id: 'bc-1',
        estimated_bodyfat_percent: 18.5,
        method: 'DEXA 4C Vision',
        confidence_score: 0.95,
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)
    const stage3 = result.stages[2]
    const dexaMilestone = stage3.milestones.find(m => m.key === 'dexa_body_comp_scanned')

    expect(dexaMilestone).toBeDefined()
    expect(dexaMilestone?.completed).toBe(true)
    expect(dexaMilestone?.detail).toContain('18.5%')
  })

  it('completes Stage 6 Program Design and advances to Stage 7 when plan_json has workouts array', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-workouts',
      clientName: 'Workout Athlete',
      email: 'workout@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 10, sessions_total: 10 }],
      intakeForm: { consent_signature_name: 'Workout Athlete', consent_signed_at: '2026-09-01' },
      fitnessProfile: {
        height_cm: 175,
        weight_kg: 75,
        fitness_goal: 'hypertrophy',
        equipment_access: ['barbell'],
        training_days_per_week: 4,
      },
      assessments: [
        {
          id: 'asm-1',
          assessment_date: '2026-09-02T10:00:00Z',
          ohsa_findings: [{ compensation: 'arms_fall_forward' }],
        },
      ],
      latestPlan: {
        id: 'plan-real-world',
        name: 'Phase 1 Stabilization Endurance Protocol',
        nasm_opt_phase: 1,
        phase_name: 'Phase 1: Stabilization Endurance',
        sessions_per_week: 4,
        plan_json: {
          workouts: [
            { day: 1, focus: 'Total Body Stabilization', exercises: [{ name: 'Ball Squat' }] },
            { day: 2, focus: 'Upper Body Stabilization', exercises: [{ name: 'Push Up' }] },
          ],
        },
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)
    const stage6 = result.stages[5]

    expect(stage6.state).toBe('completed')
    expect(stage6.milestones[0].completed).toBe(true)
    expect(stage6.milestones[0].detail).toContain('2 workout sessions programmed')
    expect(stage6.milestones[1].completed).toBe(true)
    expect(result.isFullyOnboarded).toBe(false)
    expect(result.completedOnboardingCount).toBe(6)
    expect(result.currentStageNumber).toBe(7)
    expect(result.currentStageId).toBe('delivery_kickoff')
  })

  it('automatically completes Stage 7 and advances to Stage 8 when a live session is completed without notes', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-auto-progress',
      clientName: 'Live Athlete',
      email: 'live@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 10, sessions_total: 10 }],
      intakeForm: { consent_signature_name: 'Live Athlete', consent_signed_at: '2026-09-01' },
      fitnessProfile: {
        height_cm: 175,
        weight_kg: 75,
        fitness_goal: 'hypertrophy',
        equipment_access: ['barbell'],
        training_days_per_week: 4,
      },
      assessments: [
        {
          id: 'asm-1',
          assessment_date: '2026-09-02T10:00:00Z',
          ohsa_findings: [{ compensation: 'arms_fall_forward' }],
        },
      ],
      latestPlan: {
        id: 'plan-1',
        name: 'Phase 1 Stabilization Endurance Protocol',
        nasm_opt_phase: 1,
        phase_name: 'Phase 1: Stabilization Endurance',
        sessions_per_week: 4,
        plan_json: {
          periodizationPlan: { macrocycleWeeks: 12 },
          workouts: [{ day: 1, focus: 'Total Body', exercises: [] }],
        },
      },
      sessions: [
        {
          id: 'sess-completed-no-notes',
          status: 'completed',
          scheduled_at: '2026-09-03T14:00:00Z',
          notes: '', // Notes empty - should still advance!
        },
      ],
    }

    const result = evaluateClientOnboardingProgression(telemetry)
    const stage7 = result.stages[6]

    expect(stage7.state).toBe('completed')
    expect(result.currentStageNumber).toBe(8)
    expect(result.currentStageId).toBe('followups_triage')
    expect(result.nextAction.tab).toBe('checkins')
  })

  it('automatically completes Stage 7 and advances to Stage 8 when consultation is waived', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-waived',
      clientName: 'Async Athlete',
      email: 'async@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 10, sessions_total: 10 }],
      intakeForm: { consent_signature_name: 'Async Athlete', consent_signed_at: '2026-09-01' },
      fitnessProfile: {
        height_cm: 175,
        weight_kg: 75,
        fitness_goal: 'hypertrophy',
        equipment_access: ['barbell'],
        training_days_per_week: 4,
      },
      assessments: [
        {
          id: 'asm-1',
          assessment_date: '2026-09-02T10:00:00Z',
          ohsa_findings: [{ compensation: 'arms_fall_forward' }],
        },
      ],
      latestPlan: {
        id: 'plan-1',
        name: 'Phase 1 Stabilization Endurance Protocol',
        nasm_opt_phase: 1,
        phase_name: 'Phase 1: Stabilization Endurance',
        sessions_per_week: 4,
        plan_json: {
          periodizationPlan: { macrocycleWeeks: 12 },
          workouts: [{ day: 1, focus: 'Total Body', exercises: [] }],
        },
      },
      sessions: [
        {
          id: 'sess-waived',
          status: 'completed',
          scheduled_at: '2026-09-03T14:00:00Z',
          notes: '1:1 Live consultation waived per client preference (proceeded directly to asynchronous program delivery).',
        },
      ],
    }

    const result = evaluateClientOnboardingProgression(telemetry)
    const stage7 = result.stages[6]

    expect(stage7.state).toBe('completed')
    expect(stage7.milestones[0].completed).toBe(true)
    expect(stage7.milestones[1].completed).toBe(true)
    expect(result.currentStageNumber).toBe(8)
    expect(result.currentStageId).toBe('followups_triage')
  })

  it('classifies Stages 1–7 as onboarding_phase and Stages 8–9 as maintenance_compliance', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-taxonomy',
      clientName: 'Taxonomy Athlete',
      email: 'taxonomy@example.com',
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.onboardingPhasesCount).toBe(7)
    expect(result.complianceStagesCount).toBe(2)

    for (let i = 0; i < 7; i++) {
      expect(result.stages[i].category).toBe('onboarding_phase')
    }
    expect(result.stages[7].category).toBe('maintenance_compliance')
    expect(result.stages[8].category).toBe('maintenance_compliance')
  })

  it('does NOT count cancelled sessions as booked sessions in Stage 7', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-cancelled-test',
      clientName: 'Cancelled Test Client',
      email: 'cancelled@example.com',
      designatedCoachId: 'coach-1',
      packages: [{ id: 'pkg-1', sessions_remaining: 5, sessions_total: 10 }],
      intakeForm: { consent_signature_name: 'Athlete', consent_signed_at: '2026-09-01' },
      fitnessProfile: {
        height_cm: 180,
        weight_kg: 80,
        fitness_goal: 'strength',
        equipment_access: ['barbell'],
        training_days_per_week: 3,
      },
      assessments: [
        { id: 'asm-1', assessment_date: '2026-09-02T10:00:00Z', ohsa_findings: [] },
      ],
      latestPlan: {
        id: 'plan-1',
        name: 'Phase 1',
        nasm_opt_phase: 1,
        phase_name: 'Phase 1: Stabilization Endurance',
        sessions_per_week: 3,
        plan_json: { workouts: [] },
      },
      sessions: [
        {
          id: 'sess-cancelled',
          status: 'cancelled',
          scheduled_at: '2026-09-03T14:00:00Z',
          notes: 'Client cancelled session',
        },
      ],
    }

    const result = evaluateClientOnboardingProgression(telemetry)
    const stage7 = result.stages[6]

    expect(stage7.milestones[0].completed).toBe(false)
    expect(stage7.milestones[0].detail).toBe('No live or async sessions booked')
    expect(stage7.state).toBe('in_progress')
  })

  it('excludes expired packages from active credits tally in Stage 1', () => {
    const telemetry: ClientProgressionTelemetry = {
      clientId: 'client-expired-test',
      clientName: 'Expired Test Client',
      email: 'expired@example.com',
      designatedCoachId: 'coach-1',
      packages: [
        {
          id: 'pkg-expired',
          package_name: 'Old Package',
          sessions_remaining: 5,
          sessions_total: 10,
          expires_at: '2020-01-01T00:00:00Z', // Expired
        },
        {
          id: 'pkg-active',
          package_name: 'Active Package',
          sessions_remaining: 3,
          sessions_total: 4,
          expires_at: null, // Indefinite / Active
        },
      ],
    }

    const result = evaluateClientOnboardingProgression(telemetry)
    const stage1 = result.stages[0]

    expect(stage1.milestones[1].detail).toBe('3 session credits on record')
  })
})


