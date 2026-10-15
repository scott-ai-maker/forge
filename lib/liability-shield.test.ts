import { describe, expect, it } from 'vitest'
import {
  evaluateMedicalParq,
  checkExerciseContraindications,
  CONTRAINDICATION_RULES,
} from './liability-shield'

describe('liability-shield', () => {
  it('clears low-risk client with 0 flagged items for full Phase 5 power training', () => {
    const res = evaluateMedicalParq({
      hasHeartCondition: false,
      experiencesChestPain: false,
      experiencesDizzinessOrSyncope: false,
      hasBoneOrJointProblem: false,
      takesBloodPressureOrHeartMedication: false,
      hasChronicSpinalOrDiscCondition: false,
      hasRecentSurgeryOrInjury: false,
    })

    expect(res.clearanceStatus).toBe('cleared_unrestricted')
    expect(res.riskTier).toBe('Low Risk')
    expect(res.maxAllowedOptPhase).toBe(5)
    expect(res.flaggedQuestionsCount).toBe(0)
    expect(res.virtualTelehealthDisclaimer).toContain('NASM VIRTUAL COACHING & REMOTE TELEHEALTH AGREEMENT')
    expect(res.virtualTelehealthDisclaimer).toContain('cannot physically spot')
    expect(res.legalDisclaimer).toContain('AI DIGITAL COACHING & AUTOMATED PERFORMANCE GUIDANCE')
    expect(res.legalDisclaimer).toContain('Forge Athletic Performance LLC or Coach Scott Gordon')
    expect(res.erapRecord?.isErapComplete).toBe(false)
  })

  it('evaluates complete ERAP record when workout address and local dispatch phone are provided', () => {
    const res = evaluateMedicalParq({
      hasHeartCondition: false,
      experiencesChestPain: false,
      experiencesDizzinessOrSyncope: false,
      hasBoneOrJointProblem: false,
      takesBloodPressureOrHeartMedication: false,
      hasChronicSpinalOrDiscCondition: false,
      hasRecentSurgeryOrInjury: false,
      workoutStreetAddress: '742 Evergreen Terrace',
      workoutUnitOrGateCode: 'Gate #402',
      workoutCity: 'Springfield',
      workoutState: 'OR',
      workoutPostalCode: '97477',
      localEmergencyDispatchPhone: '541-555-0911',
    })

    expect(res.erapRecord?.isErapComplete).toBe(true)
    expect(res.erapRecord?.workoutLocationSummary).toContain('742 Evergreen Terrace (Gate #402), Springfield, OR 97477')
    expect(res.erapRecord?.localEmergencyDispatchPhone).toBe('541-555-0911')
  })

  it('triggers physician clearance required and locks Phase 4/5 for chest pain or dizziness', () => {
    const res = evaluateMedicalParq({
      hasHeartCondition: false,
      experiencesChestPain: true,
      experiencesDizzinessOrSyncope: true,
      hasBoneOrJointProblem: false,
      takesBloodPressureOrHeartMedication: false,
      hasChronicSpinalOrDiscCondition: false,
      hasRecentSurgeryOrInjury: false,
    })

    expect(res.clearanceStatus).toBe('physician_clearance_required')
    expect(res.riskTier).toContain('High Risk')
    expect(res.maxAllowedOptPhase).toBe(1)
    expect(res.contraindicationTags).toContain('cardiovascular_hypertension')
  })

  it('flags knee patellofemoral contraindicated exercises and prescribes safe closed-chain substitutions', () => {
    const check = checkExerciseContraindications('Seated Leg Extension', ['knee_patellofemoral'])

    expect(check.isContraindicated).toBe(true)
    expect(check.replacement).toContain('Spanish Squats')
    expect(check.rationale).toContain('patellar shear')
  })

  it('flags lumbar disc herniation contraindicated exercises (Jefferson Curls) and prescribes McGill Big 3', () => {
    const check = checkExerciseContraindications('Jefferson Curls', ['lumbar_disc_condition'])

    expect(check.isContraindicated).toBe(true)
    expect(check.replacement).toContain('McGill Big 3')
  })

  it('contains contraindication rules for knees, lumbar spine, shoulders, and cardiovascular health', () => {
    expect(Object.keys(CONTRAINDICATION_RULES).length).toBeGreaterThanOrEqual(16)
  })

  it('flags tennis elbow and prescribes neutral hammer curl with zero twisting', () => {
    const check = checkExerciseContraindications('Reverse Barbell Curl', ['tennis_elbow'])
    expect(check.isContraindicated).toBe(true)
    expect(check.replacement).toContain('Dumbbell Hammer Curl')
    expect(check.coachingCue?.toLowerCase()).toContain('neutral hammer grip')
    expect(check.coachingCue?.toLowerCase()).toContain('zero twisting or supination')
  })

  it('flags runner knee and prescribes Spanish Squats with closed kinetic chain', () => {
    const check = checkExerciseContraindications('Seated Leg Extension', ['runners_knee'])
    expect(check.isContraindicated).toBe(true)
    expect(check.replacement).toContain('Spanish Squats')
  })
})

