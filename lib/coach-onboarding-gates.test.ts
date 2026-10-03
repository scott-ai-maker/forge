import { describe, it, expect } from 'vitest'
import {
  evaluateClientOnboardingProgression,
  parseParqAnswers,
  type ClientProgressionTelemetry,
} from './coach-onboarding-progression'
import { loadClientOnboardingGates } from './coach-onboarding-gates-storage'

describe('Coach Onboarding Authorization Gates Engine', () => {
  const baseTelemetry: ClientProgressionTelemetry = {
    clientId: 'athlete-gate-1',
    clientName: 'Alex Mercer',
    email: 'alex@example.com',
    designatedCoachId: 'coach-1',
    packages: [{ id: 'p-1', sessions_remaining: 10, sessions_total: 10 }],
    intakeForm: {
      parq_answers: { hasHeartCondition: false },
      consent_signature_name: 'Alex Mercer',
      consent_signed_at: '2026-09-01T12:00:00Z',
    },
    fitnessProfile: {
      height_cm: 180,
      weight_kg: 80,
      fitness_goal: 'hypertrophy',
      equipment_access: ['gym'],
      training_days_per_week: 4,
    },
    assessments: [
      { id: 'asm-1', assessment_date: '2026-09-02', ohsa_findings: ['feet_turn_out'] },
    ],
    latestPlan: {
      id: 'plan-1',
      name: 'Hypertrophy Block',
      nasm_opt_phase: 2,
      plan_json: {
        periodizationPlan: { weeks: 12 },
        workouts: [{ day: 1, name: 'Leg Day' }],
      },
    },
    sessions: [
      { id: 'sess-1', status: 'completed', scheduled_at: '2026-09-03', notes: 'Great form' },
    ],
  }

  it('locks Stage 2 when Stage 1 is not authorized by a coach, even if data exists', () => {
    const telemetry: ClientProgressionTelemetry = {
      ...baseTelemetry,
      enforceGates: true,
      gates: {},
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.currentStageNumber).toBe(1)
    expect(result.stages[0].gate.status).toBe('awaiting_authorization')
    expect(result.stages[0].gate.canAuthorize).toBe(true)

    // Stage 2 is locked behind Stage 1
    expect(result.stages[1].gate.status).toBe('locked')
    expect(result.stages[1].gate.canAuthorize).toBe(false)
    expect(result.stages[1].state).toBe('pending')
    expect(result.stages[1].gate.blockerReason).toContain('Stage 1 (Intake & Claim) must be authorized')
  })

  it('unlocks Stage 2 when Stage 1 is authorized by a coach', () => {
    const telemetry: ClientProgressionTelemetry = {
      ...baseTelemetry,
      enforceGates: true,
      gates: {
        1: {
          status: 'authorized',
          authorizedBy: 'coach-1',
          authorizedAt: '2026-09-01T10:00:00Z',
          notes: 'Lead claimed & package assigned',
        },
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[0].gate.status).toBe('authorized')
    expect(result.stages[0].state).toBe('completed')

    // Stage 2 is now unlocked and awaiting authorization
    expect(result.currentStageNumber).toBe(2)
    expect(result.stages[1].gate.status).toBe('awaiting_authorization')
    expect(result.stages[1].gate.canAuthorize).toBe(true)
    expect(result.stages[1].state).toBe('in_progress')

    // Stage 3 remains locked behind Stage 2
    expect(result.stages[2].gate.status).toBe('locked')
    expect(result.stages[2].state).toBe('pending')
  })

  it('blocks Stage 2 if client flagged cardiovascular risk on PAR-Q without physician clearance', () => {
    const telemetry: ClientProgressionTelemetry = {
      ...baseTelemetry,
      intakeForm: {
        parq_answers: { hasHeartCondition: true },
        consent_signature_name: 'Alex Mercer',
        consent_signed_at: '2026-09-01T12:00:00Z',
      },
      enforceGates: true,
      gates: {
        1: { status: 'authorized', authorizedBy: 'coach-1' },
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.currentStageNumber).toBe(2)
    expect(result.stages[1].gate.status).toBe('blocked')
    expect(result.stages[1].gate.canAuthorize).toBe(false)
    expect(result.stages[1].state).toBe('blocked')
    expect(result.isBlockedByMedicalClearance).toBe(true)
    expect(result.stages[1].gate.blockerReason).toContain('Physician Medical Clearance Required')

    // Stage 3 is blocked by Stage 2
    expect(result.stages[2].gate.status).toBe('blocked')
  })

  it('progresses step-by-step through all 7 gates sequentially', () => {
    // Authorize Stages 1, 2, 3
    const telemetry: ClientProgressionTelemetry = {
      ...baseTelemetry,
      enforceGates: true,
      gates: {
        1: { status: 'authorized', authorizedBy: 'coach-1' },
        2: { status: 'authorized', authorizedBy: 'coach-1' },
        3: { status: 'authorized', authorizedBy: 'coach-1' },
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.stages[0].state).toBe('completed')
    expect(result.stages[1].state).toBe('completed')
    expect(result.stages[2].state).toBe('completed')

    // Stage 4 is current
    expect(result.currentStageNumber).toBe(4)
    expect(result.stages[3].gate.status).toBe('awaiting_authorization')
    expect(result.stages[4].gate.status).toBe('locked')
    expect(result.stages[5].gate.status).toBe('locked')
    expect(result.stages[6].gate.status).toBe('locked')
    expect(result.isFullyOnboarded).toBe(false)
  })

  it('authorizing Stage 7 graduates the athlete to Maintenance & Compliance', () => {
    const telemetry: ClientProgressionTelemetry = {
      ...baseTelemetry,
      enforceGates: true,
      gates: {
        1: { status: 'authorized', authorizedBy: 'coach-1' },
        2: { status: 'authorized', authorizedBy: 'coach-1' },
        3: { status: 'authorized', authorizedBy: 'coach-1' },
        4: { status: 'authorized', authorizedBy: 'coach-1' },
        5: { status: 'authorized', authorizedBy: 'coach-1' },
        6: { status: 'authorized', authorizedBy: 'coach-1' },
        7: { status: 'authorized', authorizedBy: 'coach-1', notes: 'Kickoff delivered with SOAP notes' },
      },
    }

    const result = evaluateClientOnboardingProgression(telemetry)

    expect(result.completedOnboardingCount).toBe(7)
    expect(result.onboardingProgressPercent).toBe(100)
    expect(result.isFullyOnboarded).toBe(true)
    expect(result.isOnboardingComplete).toBe(true)
    expect(result.allGatesAuthorized).toBe(true)

    // Stage 8 (Weekly Follow-Ups) is now unlocked
    expect(result.currentStageNumber).toBe(8)
    expect(result.stages[7].gate.status).toBe('awaiting_authorization')
    expect(result.stages[7].state).toBe('in_progress')
  })

  it('normalizes PAR-Q answers correctly for both q1..q7 format and named format', () => {
    // Scenario 1: q1..q7 format from OnboardingForm
    const qForm = {
      q1: false,
      q2: false,
      q3: false,
      q4: false,
      q5: false,
      q6: false,
      q7: false,
    }
    const parsed1 = parseParqAnswers(qForm, {
      medical_conditions: 'None',
      consent_signature_name: 'Scott Gordon',
      consent_signed_at: '2026-09-07T22:39:56Z',
    })
    expect(parsed1.hasHeartCondition).toBe(false)
    expect(parsed1.experiencesChestPain).toBe(false)
    expect(parsed1.experiencesDizzinessOrSyncope).toBe(false)
    expect(parsed1.hasBoneOrJointProblem).toBe(false)
    expect(parsed1.takesBloodPressureOrHeartMedication).toBe(false)
    expect(parsed1.hasChronicSpinalOrDiscCondition).toBe(false)
    expect(parsed1.hasRecentSurgeryOrInjury).toBe(false)
    expect(parsed1.signedWaiverName).toBe('Scott Gordon')

    // Scenario 2: Legacy script aliases (e.g. boneOrJointProblem, chestPainPhysicalActivity)
    const scriptForm = {
      hasHeartCondition: false,
      chestPainPhysicalActivity: true,
      boneOrJointProblem: true,
      bloodPressureMedication: false,
    }
    const parsed2 = parseParqAnswers(scriptForm)
    expect(parsed2.experiencesChestPain).toBe(true)
    expect(parsed2.hasBoneOrJointProblem).toBe(true)
    expect(parsed2.takesBloodPressureOrHeartMedication).toBe(false)
  })

  it('reconstructs gate authorization map from client_lifecycle_audit_logs when primary table is unavailable', async () => {
    // Mock admin client where coach_onboarding_gates errors with missing table
    const mockAdmin: any = {
      from: (table: string) => {
        if (table === 'coach_onboarding_gates') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({
                  data: null,
                  error: { code: 'PGRST205', message: "Could not find table 'public.coach_onboarding_gates'" },
                }),
              }),
            }),
          }
        }
        if (table === 'client_lifecycle_audit_logs') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => Promise.resolve({
                    data: [
                      {
                        action: 'onboarding_gate_authorized',
                        actor_id: 'coach-123',
                        effective_date: '2026-09-07T22:40:44Z',
                        reason_notes: 'Coach authorized Stage 1 (intake_claim)',
                        metadata: { stageNumber: 1, stageId: 'intake_claim', authorizedAt: '2026-09-07T22:40:44Z' },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        return {}
      },
    }

    const gates = await loadClientOnboardingGates(mockAdmin, 'client-test-id')
    expect(gates[1]).toBeDefined()
    expect(gates[1].status).toBe('authorized')
    expect(gates[1].authorizedBy).toBe('coach-123')
    expect(gates[1].notes).toBe('Coach authorized Stage 1 (intake_claim)')

    // Verify feeding this into evaluateClientOnboardingProgression unlocks Stage 2!
    const result = evaluateClientOnboardingProgression({
      ...baseTelemetry,
      enforceGates: true,
      gates,
    })
    expect(result.stages[0].gate.status).toBe('authorized')
    expect(result.stages[0].state).toBe('completed')
    expect(result.currentStageNumber).toBe(2)
    expect(result.stages[1].gate.status).toBe('awaiting_authorization')
    expect(result.stages[1].gate.canAuthorize).toBe(true)
  })
})

