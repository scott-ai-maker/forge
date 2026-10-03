import { describe, it, expect } from 'vitest'
import {
  evaluateClientOnboardingProgression,
  type ClientProgressionTelemetry,
} from '@/lib/coach-onboarding-progression'
import { CoachClientTabSchema } from '@/lib/validation'

describe('9-Phase Athlete Onboarding & Development Continuum UI & Integration Suite', () => {
  const baseClientId = 'test-athlete-900'

  // Baseline mock data chunks for cumulative testing
  const mockCoach = { designatedCoachId: 'coach-123' }
  const mockPackages = [
    { id: 'pkg-1', package_name: '12-Week Executive Hybrid', sessions_remaining: 12, sessions_total: 12, source: 'paid' },
  ]
  const mockCleanIntake = {
    parq_answers: {
      hasHeartCondition: false,
      experiencesChestPain: false,
      experiencesDizzinessOrSyncope: false,
      hasBoneOrJointProblem: false,
      takesBloodPressureOrHeartMedication: false,
      hasChronicSpinalOrDiscCondition: false,
      hasRecentSurgeryOrInjury: false,
    },
    consent_signature_name: 'Marcus Sterling',
    consent_signed_at: '2026-09-01T12:00:00Z',
  }
  const mockFlaggedCardiacIntake = {
    parq_answers: {
      hasHeartCondition: true,
      experiencesChestPain: true,
    },
    medical_conditions: 'Ventricular arrhythmia diagnosed in 2024',
    consent_signature_name: 'Marcus Sterling',
    consent_signed_at: '2026-09-01T12:00:00Z',
  }
  const mockFitnessProfile = {
    height_cm: 185,
    weight_kg: 86,
    age: 34,
    sex: 'male',
    fitness_goal: 'Hypertrophy & Joint Longevity',
    equipment_access: ['Barbell', 'Dumbbells', 'Cables', 'Squat Rack'],
    cardio_equipment_access: ['Rower', 'Treadmill'],
    training_days_per_week: 4,
    preferred_training_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    injuries_limitations: 'Mild L5-S1 lumbar stiffness under heavy spinal loading',
  }
  const mockDexaScan = {
    id: 'dexa-1',
    estimated_bodyfat_percent: 16.4,
    method: 'DEXA 4C Vision Scan',
    confidence_score: 0.96,
  }
  const mockAssessment = {
    id: 'nasm-1',
    assessment_date: '2026-09-02',
    ohsa_findings: ['Feet Turn Out', 'Anterior Pelvic Tilt', 'Arms Fall Forward'],
    static_posture: ['Lower Crossed Syndrome'],
  }
  const mockPeriodizedPlan = {
    id: 'plan-101',
    name: '12-Week OPT Hypertrophy Macrocycle',
    nasm_opt_phase: 2,
    phase_name: 'Strength Endurance',
    sessions_per_week: 4,
    plan_json: {
      periodizationPlan: {
        macrocycleWeeks: 12,
        phases: [{ phase: 1, weeks: 4 }, { phase: 2, weeks: 8 }],
      },
      workouts: [
        { day: 'Day 1', name: 'Upper Strength Endurance', exercises: [{ name: 'Bench Press', sets: 3, reps: '12' }] },
        { day: 'Day 2', name: 'Lower Kinetic Chain', exercises: [{ name: 'Barbell Squat', sets: 4, reps: '10' }] },
      ],
    },
  }
  const mockLiveSession = {
    id: 'sess-1',
    status: 'completed',
    scheduled_at: '2026-09-03T14:00:00Z',
    notes: 'S: Client energetic. O: Overhead squat compensations corrected. A: Good hip hinge. P: Progress to Phase 2.',
  }
  const mockWorkoutLogs = [
    { session_date: '2026-09-04', completed: true },
    { session_date: '2026-09-06', completed: true },
  ]
  const mockWeeklyCheckin = {
    id: 'chk-1',
    week_start: '2026-09-07',
    coach_feedback: 'Outstanding adherence this week. Sleep hygiene improved, ready for load progression.',
  }

  // ── Phase 1: Intake & Coach Claim ──────────────────────────
  describe('Phase 1: Lead Intake & Coach Assignment (intake_claim)', () => {
    it('holds at Stage 1 with urgent action when coach or packages are missing', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        designatedCoachId: null, // Unassigned
        packages: [],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(1)
      expect(profile.currentStageId).toBe('intake_claim')
      expect(profile.stages[0].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('commerce')
      expect(profile.nextAction.label).toBe('Assign Package & Credits')
      expect(profile.nextAction.href).toBe(`/coach/clients/${baseClientId}?tab=commerce#workspace-tab-content`)
      expect(profile.nextAction.urgency).toBe('urgent')
    })

    it('completes Stage 1 when designated coach is assigned and packages exist', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[0].state).toBe('completed')
      expect(profile.stages[0].milestones[0].completed).toBe(true) // coach assigned
      expect(profile.stages[0].milestones[1].completed).toBe(true) // package allocated
      expect(profile.currentStageNumber).toBe(2) // Advances to Stage 2
    })
  })

  // ── Phase 2: Liability Shield & PAR-Q+ ──────────────────────
  describe('Phase 2: Clinical Liability Shield & PAR-Q+ (liability_shield)', () => {
    it('holds at Stage 2 with pending intake review before documents are submitted', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: null,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(2)
      expect(profile.currentStageId).toBe('liability_shield')
      expect(profile.stages[1].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('shield')
      expect(profile.nextAction.label).toBe('Verify PAR-Q+ & Waiver')
      expect(profile.nextAction.href).toBe(`/coach/clients/${baseClientId}?tab=shield#workspace-tab-content`)
    })

    it('blocks the entire continuum and raises urgent blocker when cardiovascular red flags are flagged', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockFlaggedCardiacIntake,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(2)
      expect(profile.stages[1].state).toBe('blocked')
      expect(profile.isBlockedByMedicalClearance).toBe(true)
      expect(profile.medicalClearanceTier).toBe('High Risk - Medical Clearance Required')
      expect(profile.stages[1].blockerReason).toContain('Physician Medical Clearance Required')

      // Subsequent stages must all be blocked
      expect(profile.stages[2].state).toBe('blocked')
      expect(profile.stages[3].state).toBe('blocked')
      expect(profile.stages[4].state).toBe('blocked')

      // Urgent next action
      expect(profile.nextAction.urgency).toBe('urgent')
      expect(profile.nextAction.tab).toBe('shield')
      expect(profile.nextAction.label).toBe('Review Medical Red Flag')
      expect(profile.nextAction.title).toBe('Resolve Clinical Clearance Blocker')
    })

    it('unblocks and advances to Stage 3 when PAR-Q+ is cleared and waiver is digitally signed', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[1].state).toBe('completed')
      expect(profile.isBlockedByMedicalClearance).toBe(false)
      expect(profile.currentStageNumber).toBe(3) // Advances to Stage 3
    })
  })

  // ── Phase 3: Baseline Biometrics & Environmental Readiness ──
  describe('Phase 3: Baseline Biometrics & Environmental Readiness (baseline_biometrics)', () => {
    it('routes Stage 3 next action to overview tab with vitals configuration label', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: null, // missing vitals
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(3)
      expect(profile.currentStageId).toBe('baseline_biometrics')
      expect(profile.stages[2].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('overview')
      expect(profile.nextAction.href).toBe(`/coach/clients/${baseClientId}?tab=overview#workspace-tab-content`)
      expect(profile.nextAction.label).toBe('Configure Vitals & Equipment')
    })

    it('advances to Stage 4 when height, weight, goal, equipment, and training schedule are recorded', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        latestBodyComposition: mockDexaScan,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[2].state).toBe('completed')
      const stage3Milestones = profile.stages[2].milestones
      expect(stage3Milestones.find(m => m.key === 'anthropometry_logged')?.completed).toBe(true)
      expect(stage3Milestones.find(m => m.key === 'dexa_body_comp_scanned')?.completed).toBe(true)
      expect(stage3Milestones.find(m => m.key === 'fitness_goal_defined')?.completed).toBe(true)
      expect(stage3Milestones.find(m => m.key === 'equipment_mapped')?.completed).toBe(true)
      expect(stage3Milestones.find(m => m.key === 'schedule_configured')?.completed).toBe(true)
      expect(profile.currentStageNumber).toBe(4) // Advances to Stage 4
    })
  })

  // ── Phase 4: NASM Movement Screen & Testing Suite ──────────
  describe('Phase 4: NASM Movement Screen & Testing Suite (movement_testing)', () => {
    it('routes Stage 4 to assessment tab with deep links to posture, ohsa, and cex', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(4)
      expect(profile.currentStageId).toBe('movement_testing')
      expect(profile.stages[3].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('assessment')
      expect(profile.nextAction.href).toBe(`/coach/clients/${baseClientId}?tab=assessment&subtab=ohsa#workspace-tab-content`)
      expect(profile.nextAction.label).toBe('Conduct Overhead Squat Assessment')

      // Check subtab deep-links
      const s4 = profile.stages[3]
      expect(s4.milestones.find(m => m.key === 'kinetic_chain_postural_screen')?.actionHref).toContain('subtab=posture#workspace-tab-content')
      expect(s4.milestones.find(m => m.key === 'overhead_squat_screen')?.actionHref).toContain('subtab=ohsa#workspace-tab-content')
      expect(s4.milestones.find(m => m.key === 'cex_warmup_generated')?.actionHref).toContain('subtab=cex#workspace-tab-content')
    })

    it('completes Stage 4 when NASM assessment and OHSA findings are recorded', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[3].state).toBe('completed')
      expect(profile.currentStageNumber).toBe(5) // Advances to Stage 5
    })
  })

  // ── Phase 5: Periodization Architecture ─────────────────────
  describe('Phase 5: Periodization Architecture (periodization)', () => {
    it('holds at Stage 5 and routes to periodization tab when macrocycle is pending', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: null,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(5)
      expect(profile.currentStageId).toBe('periodization')
      expect(profile.stages[4].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('periodization')
      expect(profile.nextAction.href).toBe(`/coach/clients/${baseClientId}?tab=periodization#workspace-tab-content`)
      expect(profile.nextAction.label).toBe('Architect 12-Week Macrocycle')
    })

    it('completes Stage 5 when OPT phase and periodization plan are designated', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: {
          id: 'p-1',
          name: '12-Week Roadmap',
          nasm_opt_phase: 2,
          phase_name: 'Strength Endurance',
          plan_json: { periodizationPlan: { weeks: 12 } },
        },
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[4].state).toBe('completed')
      expect(profile.currentStageNumber).toBe(6) // Advances to Stage 6
    })
  })

  // ── Phase 6: Program Design & Prescription Workspace ────────
  describe('Phase 6: Program Design & Prescription Workspace (program_design)', () => {
    it('holds at Stage 6 when workouts are not yet programmed in the plan', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: {
          id: 'p-1',
          name: 'Draft Roadmap',
          nasm_opt_phase: 2,
          plan_json: { periodizationPlan: { weeks: 12 }, workouts: [] },
        },
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(6)
      expect(profile.currentStageId).toBe('program_design')
      expect(profile.stages[5].state).toBe('in_progress')
      expect(profile.isFullyOnboarded).toBe(false)
      expect(profile.nextAction.tab).toBe('program')
      expect(profile.nextAction.label).toBe('Review & Publish Workout Program')
    })

    it('completes Stage 6, advances to Stage 7 (final onboarding phase), and keeps isFullyOnboarded = false until Stage 7 completes', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[5].state).toBe('completed')
      expect(profile.completedOnboardingCount).toBe(6)
      expect(profile.isFullyOnboarded).toBe(false)
      expect(profile.isOnboardingComplete).toBe(false)
      expect(profile.currentStageNumber).toBe(7) // Advances to Stage 7
    })
  })

  // ── Phase 7: Delivery Kickoff & Live Coaching ───────────────
  describe('Phase 7: Delivery Kickoff & Live Coaching (delivery_kickoff)', () => {
    it('holds at Stage 7 when first session is unscheduled and undelivered', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(7)
      expect(profile.currentStageId).toBe('delivery_kickoff')
      expect(profile.stages[6].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('sessions')
      expect(profile.nextAction.label).toBe('Deliver Session & Record SOAP Notes')
      expect(profile.nextAction.href).toBe(`/coach/clients/${baseClientId}?tab=sessions#workspace-tab-content`)
    })

    it('completes Stage 7 when session is delivered, completes onboarding (7/7), and advances to Stage 8 (Maintenance & Compliance)', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [mockLiveSession],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[6].state).toBe('completed')
      expect(profile.completedOnboardingCount).toBe(7)
      expect(profile.isFullyOnboarded).toBe(true)
      expect(profile.isOnboardingComplete).toBe(true)
      expect(profile.isMaintenanceAndCompliance).toBe(true)
      expect(profile.currentStageNumber).toBe(8) // Advances to Stage 8
    })

    it('auto-advances Stage 7 to Stage 8 when client opts out or consult is waived', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [],
        consultWaived: true, // Client opted out / coach skipped
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[6].state).toBe('completed')
      expect(profile.stages[6].milestones[0].completed).toBe(true) // waived satisfies
      expect(profile.stages[6].milestones[1].completed).toBe(true) // waived satisfies
      expect(profile.completedOnboardingCount).toBe(7)
      expect(profile.isFullyOnboarded).toBe(true)
      expect(profile.isOnboardingComplete).toBe(true)
      expect(profile.isMaintenanceAndCompliance).toBe(true)
      expect(profile.currentStageNumber).toBe(8) // Automatically advanced to Stage 8
    })
  })

  // ── Phase 8: Telemetry Monitoring & Weekly Triage ────────────
  describe('Phase 8: Telemetry Monitoring & Weekly Triage (followups_triage)', () => {
    it('holds at Stage 8 when workout logs or check-in reviews are pending', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [mockLiveSession],
        workoutLogs: [],
        weeklyCheckins: [],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.currentStageNumber).toBe(8)
      expect(profile.currentStageId).toBe('followups_triage')
      expect(profile.stages[7].state).toBe('in_progress')
      expect(profile.nextAction.tab).toBe('checkins')
      expect(profile.nextAction.label).toBe('Review Sunday Check-In')
    })

    it('completes Stage 8 when workout logs and weekly check-in feedback exist', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [mockLiveSession],
        workoutLogs: mockWorkoutLogs,
        weeklyCheckins: [mockWeeklyCheckin],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[7].state).toBe('completed')
      expect(profile.currentStageNumber).toBe(9) // Advances to Stage 9
    })
  })

  // ── Phase 9: Lifecycle Governance & Retention ────────────────
  describe('Phase 9: Lifecycle Governance & Long-Term Retention (retention_governance)', () => {
    it('achieves 100% continuum completion when active standing is maintained', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        currentStatus: 'active',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [mockLiveSession],
        workoutLogs: mockWorkoutLogs,
        weeklyCheckins: [mockWeeklyCheckin],
        auditLogsCount: 5,
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.completedStagesCount).toBe(9)
      expect(profile.totalStagesCount).toBe(9)
      expect(profile.overallProgressPercent).toBe(100)
      expect(profile.stages[8].state).toBe('completed')
      expect(profile.nextAction.title).toBe('Continuum Complete: Retention Governance Active')
      expect(profile.nextAction.label).toBe('View Retention & Audit Hub')
      expect(profile.nextAction.tab).toBe('lifecycle')
      expect(profile.nextAction.urgency).toBe('info')
    })

    it('holds Stage 9 in_progress if athlete status is paused or inactive', () => {
      const telemetry: ClientProgressionTelemetry = {
        clientId: baseClientId,
        clientName: 'Marcus Sterling',
        email: 'marcus@example.com',
        currentStatus: 'paused', // Athlete on travel hold
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [mockLiveSession],
        workoutLogs: mockWorkoutLogs,
        weeklyCheckins: [mockWeeklyCheckin],
      }
      const profile = evaluateClientOnboardingProgression(telemetry)

      expect(profile.stages[8].state).toBe('in_progress')
      expect(profile.stages[8].milestones[0].completed).toBe(false) // active standing not true
      expect(profile.overallProgressPercent).toBe(89)
    })
  })

  // ── Continuum Action Href & Tab Integrity ────────────────────
  describe('Universal ActionHref, Anchor & CoachClientTab Integrity', () => {
    it('guarantees all 9 stage actionHrefs use valid recognized CoachClientTab tabs and workspace anchors', () => {
      const fullTelemetry: ClientProgressionTelemetry = {
        clientId: 'athlete-universal',
        clientName: 'Universal Athlete',
        email: 'universal@example.com',
        ...mockCoach,
        packages: mockPackages,
        intakeForm: mockCleanIntake,
        fitnessProfile: mockFitnessProfile,
        assessments: [mockAssessment],
        latestPlan: mockPeriodizedPlan,
        sessions: [mockLiveSession],
        workoutLogs: mockWorkoutLogs,
        weeklyCheckins: [mockWeeklyCheckin],
      }
      const profile = evaluateClientOnboardingProgression(fullTelemetry)

      expect(profile.stages).toHaveLength(9)
      for (const stage of profile.stages) {
        // Must contain valid tab
        expect(CoachClientTabSchema.safeParse(stage.actionTab).success).toBe(true)

        // Must match pattern and end with anchor
        expect(stage.actionHref).toMatch(/^\/coach\/clients\/athlete-universal\?tab=/)
        expect(stage.actionHref).toContain('#workspace-tab-content')

        // Must verify each milestone
        for (const milestone of stage.milestones) {
          if (milestone.actionHref) {
            const hasTabAnchor = milestone.actionHref.includes('#workspace-tab-content')
            const isLiveRoute = milestone.actionHref.includes('/live')
            expect(hasTabAnchor || isLiveRoute).toBe(true)
          }
        }
      }
    })
  })
})
