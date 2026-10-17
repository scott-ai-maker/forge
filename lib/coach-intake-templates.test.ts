import { describe, expect, it } from 'vitest'
import {
  INTAKE_CLIENT_TEMPLATES,
  INTAKE_TEMPLATE_CATEGORIES,
  getIntakeTemplateById,
  getIntakeTemplatesByCategory,
} from './coach-intake-templates'

describe('Coach Intake Templates Library', () => {
  it('contains at least 10 high-quality diverse templates', () => {
    expect(INTAKE_CLIENT_TEMPLATES.length).toBeGreaterThanOrEqual(10)
  })

  it('covers all 5 NASM OPT phases across the template library', () => {
    const phases = new Set(INTAKE_CLIENT_TEMPLATES.map(t => t.nasmOptPhase))
    expect(phases.has(1)).toBe(true)
    expect(phases.has(2)).toBe(true)
    expect(phases.has(3)).toBe(true)
    expect(phases.has(4)).toBe(true)
    expect(phases.has(5)).toBe(true)
  })

  it('covers beginner, intermediate, and advanced fitness levels', () => {
    const levels = new Set(INTAKE_CLIENT_TEMPLATES.map(t => t.fitnessLevel))
    expect(levels.has('beginner')).toBe(true)
    expect(levels.has('intermediate')).toBe(true)
    expect(levels.has('advanced')).toBe(true)
  })

  it('ensures each template has valid, complete form data', () => {
    for (const t of INTAKE_CLIENT_TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.description).toBeTruthy()
      expect(t.formData.goal).toBeTruthy()
      expect(t.formData.targetNasmPhase).toBe(t.nasmOptPhase)
      expect(t.formData.trainingDaysPerWeek).toBeGreaterThanOrEqual(2)
      expect(t.formData.trainingDaysPerWeek).toBeLessThanOrEqual(6)
      expect(Array.isArray(t.formData.equipmentAccess)).toBe(true)
      expect(t.formData.equipmentAccess.length).toBeGreaterThan(0)
      expect(Array.isArray(t.formData.movementSuperpowers)).toBe(true)
      expect(Array.isArray(t.formData.strictExclusions)).toBe(true)
      expect(t.formData.lifestyleRhythm.sessionDurationMins).toBeGreaterThanOrEqual(20)
      expect(t.formData.coachGuidanceNotes).toBeTruthy()
      expect(t.formData.dualCardioSplit.sweatyFinisherModality).toBeTruthy()
    }
  })

  it('resolves templates by id correctly', () => {
    const exec = getIntakeTemplateById('executive_desk_reversal')
    expect(exec).toBeDefined()
    expect(exec?.category).toBe('desk_executive')
    expect(exec?.fitnessLevel).toBe('intermediate')

    const senior = getIntakeTemplateById('active_aging_longevity')
    expect(senior).toBeDefined()
    expect(senior?.category).toBe('joint_longevity')
    expect(senior?.fitnessLevel).toBe('beginner')

    const nonExistent = getIntakeTemplateById('non_existent_id')
    expect(nonExistent).toBeUndefined()
  })

  it('filters templates by category correctly', () => {
    const all = getIntakeTemplatesByCategory('all')
    expect(all.length).toBe(INTAKE_CLIENT_TEMPLATES.length)

    const desk = getIntakeTemplatesByCategory('desk_executive')
    expect(desk.length).toBeGreaterThan(0)
    expect(desk.every(t => t.category === 'desk_executive')).toBe(true)

    const joint = getIntakeTemplatesByCategory('joint_longevity')
    expect(joint.length).toBeGreaterThan(0)
    expect(joint.every(t => t.category === 'joint_longevity')).toBe(true)
  })

  it('validates template categories metadata', () => {
    expect(INTAKE_TEMPLATE_CATEGORIES.length).toBeGreaterThanOrEqual(8)
    for (const cat of INTAKE_TEMPLATE_CATEGORIES) {
      expect(cat.id).toBeTruthy()
      expect(cat.label).toBeTruthy()
      expect(cat.description).toBeTruthy()
    }
  })
})
