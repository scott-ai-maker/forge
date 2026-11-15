import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('ExerciseVideoModal & Exercise Card Instruction Hierarchy', () => {
  const modalFilePath = path.resolve(process.cwd(), 'components/fitness/ExerciseVideoModal.tsx')
  const clientFilePath = path.resolve(process.cwd(), 'components/fitness/FitnessTrackerClient.tsx')
  const warmupFilePath = path.resolve(process.cwd(), 'components/fitness/ClinicalKineticWarmupModule.tsx')
  const cooldownFilePath = path.resolve(process.cwd(), 'components/fitness/ClinicalCoolDownModule.tsx')

  it('renders Step-by-Step How-To Instructions directly beneath the video/image before Functional Anatomy in ExerciseVideoModal', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')
    const instructionsIndex = modalContent.indexOf('Step-by-Step How-To Execution Guide')
    const anatomyIndex = modalContent.indexOf('Functional Anatomy & Synergies Matrix')

    expect(instructionsIndex).toBeGreaterThan(0)
    expect(anatomyIndex).toBeGreaterThan(0)
    // Step-by-Step instructions MUST appear before Functional Anatomy & Synergies
    expect(instructionsIndex).toBeLessThan(anatomyIndex)
  })

  it('integrates ExerciseVideoModal for comprehensive technique instructions and video demonstration in FitnessTrackerClient', () => {
    const clientContent = fs.readFileSync(clientFilePath, 'utf-8')
    const modalImportIndex = clientContent.indexOf('components/fitness/ExerciseVideoModal')
    const modalUsageIndex = clientContent.indexOf('<ExerciseVideoModal')

    expect(modalImportIndex).toBeGreaterThan(0)
    expect(modalUsageIndex).toBeGreaterThan(0)
  })

  it('renders How to do this step instructions above inline actions in ClinicalKineticWarmupModule', () => {
    const warmupContent = fs.readFileSync(warmupFilePath, 'utf-8')
    const instructionsIndex = warmupContent.indexOf('How to do this step instructions')
    const actionRowIndex = warmupContent.indexOf('Inline Action Row with Timer, Video Demo & Mark Done')

    expect(instructionsIndex).toBeGreaterThan(0)
    expect(actionRowIndex).toBeGreaterThan(0)
    expect(instructionsIndex).toBeLessThan(actionRowIndex)
  })

  it('renders How to do this step instructions above inline actions in ClinicalCoolDownModule', () => {
    const cooldownContent = fs.readFileSync(cooldownFilePath, 'utf-8')
    const instructionsIndex = cooldownContent.indexOf('How to do this step instructions')
    const actionRowIndex = cooldownContent.indexOf('Inline Action Row with Timer, Demo & Mark Done')

    expect(instructionsIndex).toBeGreaterThan(0)
    expect(actionRowIndex).toBeGreaterThan(0)
    expect(instructionsIndex).toBeLessThan(actionRowIndex)
  })

  it('keeps the AI studio loop notice minimal, scoped to the studio loop player, and anchored in Terms of Service without spamming workout cards', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')
    const clientContent = fs.readFileSync(clientFilePath, 'utf-8')
    const warmupContent = fs.readFileSync(warmupFilePath, 'utf-8')
    const cooldownContent = fs.readFileSync(cooldownFilePath, 'utf-8')
    const supersetFilePath = path.resolve(process.cwd(), 'components/fitness/tracker/SupersetPairCard.tsx')
    const supersetContent = fs.readFileSync(supersetFilePath, 'utf-8')
    const termsFilePath = path.resolve(process.cwd(), 'app/terms/page.tsx')
    const termsContent = fs.readFileSync(termsFilePath, 'utf-8')

    // ExerciseVideoModal retains a single concise 1-line note only on the studio loop tab
    expect(modalContent).toContain('ai-exercise-loop-disclaimer')
    expect(modalContent).toContain("activeMediaTab === 'studio' && card.studioVideoUrl")
    expect(modalContent).toContain('Illustrative AI preview')
    expect(modalContent).not.toContain('Form &amp; Injury Prevention Disclaimer')

    // Terms of Service anchors the contractual AI studio loop disclosure
    expect(termsContent).toContain('studio exercise loops')

    // Workout surfaces are free of repeated per-card / top-of-workout warning banners
    expect(clientContent).not.toContain('workout-ai-loop-disclaimer')
    expect(clientContent).not.toContain('AI Loop Disclaimer')
    expect(supersetContent).not.toContain('AI Loop Disclaimer')
    expect(warmupContent).not.toContain('Form Safety Disclaimer')
    expect(warmupContent).not.toContain('AI Loop Disclaimer')
    expect(cooldownContent).not.toContain('Form Safety Disclaimer')
    expect(cooldownContent).not.toContain('AI Loop Disclaimer')
  })
})

