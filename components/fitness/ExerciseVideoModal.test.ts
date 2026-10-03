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

  it('renders Numbered Step-by-Step Technique Instructions above Badges and Video Button in FitnessTrackerClient', () => {
    const clientContent = fs.readFileSync(clientFilePath, 'utf-8')
    const stepInstructionsIndex = clientContent.indexOf('Numbered Step-by-Step Technique Instructions')
    const badgesIndex = clientContent.indexOf('Badges and Video Button')

    expect(stepInstructionsIndex).toBeGreaterThan(0)
    expect(badgesIndex).toBeGreaterThan(0)
    // Step instructions MUST appear directly beneath the media banner and before badges/buttons
    expect(stepInstructionsIndex).toBeLessThan(badgesIndex)
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
})

