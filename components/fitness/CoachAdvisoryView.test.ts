import { describe, it, expect } from 'vitest'
import { parseParqMedicationsAndConditions } from '@/lib/muscle-recovery-telemetry'
import { generateSupplementStack } from '@/lib/supplement-prescriptions'
import type { ClientIntakeData } from './hub-views/CoachAdvisoryView'
import type { HubProfileData } from './hub-views/FitnessLabDiagnosticsView'

describe('CoachAdvisoryView Client Needs & Current Medicines Integration', () => {
  it('correctly parses client medications and flags antihypertensives and diabetes drugs', () => {
    const intake: ClientIntakeData = {
      medications: 'Lisinopril 10mg daily in the morning, Metformin 500mg twice daily with meals',
      medical_conditions: 'Essential hypertension, Type 2 diabetes mellitus',
      surgeries_or_injuries: 'Right shoulder labrum repair (2024)',
      allergies: 'Penicillin, Shellfish',
      parq_any_yes: true,
      parq_answers: {
        takesBloodPressureOrHeartMedication: true,
      },
    }

    const parsed = parseParqMedicationsAndConditions(
      intake.parq_answers as Record<string, unknown>,
      intake.medications,
      intake.medical_conditions
    )

    expect(parsed.hasAnyReportedMedications).toBe(true)
    expect(parsed.takingAntihypertensives).toBe(true)
    expect(parsed.takingDiabetesMedications).toBe(true)
    expect(parsed.detectedMedicationCategories).toContain('Antihypertensives & Cardiovascular')
    expect(parsed.detectedMedicationCategories).toContain('Diabetes Medications & GLP-1')
  })

  it('correctly identifies thyroid medications and flags chrono-separation requirements', () => {
    const intake: ClientIntakeData = {
      medications: 'Levothyroxine 75mcg on empty stomach',
      medical_conditions: 'Hypothyroidism',
      parq_any_yes: false,
    }

    const parsed = parseParqMedicationsAndConditions(
      null,
      intake.medications,
      intake.medical_conditions
    )

    expect(parsed.hasAnyReportedMedications).toBe(true)
    expect(parsed.takingThyroidHormone).toBe(true)
    expect(parsed.detectedMedicationCategories).toContain('Thyroid Hormone Replacement')
  })

  it('aggregates musculoskeletal boundaries from both profile and intake records', () => {
    const profile: HubProfileData = {
      injuries_limitations: 'Lumbar L5-S1 disc herniation, avoids axial loading',
      fitness_goal: 'Hypertrophy & Core Stability',
      training_days_per_week: 4,
    }

    const intake: ClientIntakeData = {
      surgeries_or_injuries: 'Prior ACL reconstruction left knee',
    }

    const combinedBoundaries = [profile.injuries_limitations, intake.surgeries_or_injuries]
      .filter(Boolean)
      .join(' · ')

    expect(combinedBoundaries).toBe(
      'Lumbar L5-S1 disc herniation, avoids axial loading · Prior ACL reconstruction left knee'
    )
  })

  it('handles clients with no reported medications or injuries cleanly', () => {
    const intake: ClientIntakeData = {
      medications: 'None',
      medical_conditions: 'None',
      surgeries_or_injuries: '',
      allergies: '',
      parq_any_yes: false,
    }

    const parsed = parseParqMedicationsAndConditions(
      null,
      intake.medications,
      intake.medical_conditions
    )

    expect(parsed.hasAnyReportedMedications).toBe(false)
    expect(parsed.takingAntihypertensives).toBe(false)
    expect(parsed.takingAnticoagulants).toBe(false)
  })

  it('triggers pharmacological contraindication shields when generating supplement stacks for detected meds', () => {
    // When intake reports blood pressure medications
    const stack = generateSupplementStack({
      goal: 'athletic_power',
      age: 42,
      sex: 'male',
      fitnessLevel: 'intermediate',
      healthConditions: {
        takingAntihypertensives: true,
      },
    })

    // Pre-workout stimulants and high-potassium electrolytes should be suppressed
    expect(stack.drugInteractions.length).toBeGreaterThan(0)
    const bpAlert = stack.drugInteractions.find(i =>
      i.medicationCategory.includes('Antihypertensive')
    )
    expect(bpAlert).toBeDefined()
    expect(bpAlert?.actionDirective).toContain('Suppressed all caffeine anhydrous pre-workouts')
  })
})
