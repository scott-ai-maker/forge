import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  IOS_STILL_CAMERA_STEPS,
  ANDROID_STILL_CAMERA_STEPS,
  NASM_VIRTUAL_ASSESSMENT_CHECKLIST,
} from '@/lib/camera-still-mode'

describe('MovementScreenInstructionsModal & Client Movement Screen Protocol', () => {
  const modalFilePath = path.resolve(
    process.cwd(),
    'components/fitness/MovementScreenInstructionsModal.tsx'
  )
  const nasmSummaryFilePath = path.resolve(
    process.cwd(),
    'components/fitness/NasmAssessmentSummary.tsx'
  )
  const videoStudioFilePath = path.resolve(
    process.cwd(),
    'components/fitness/VideoCritiqueStudio.tsx'
  )

  it('verifies camera-still-mode instructions and checklist for virtual screens', () => {
    expect(IOS_STILL_CAMERA_STEPS.length).toBeGreaterThan(0)
    expect(ANDROID_STILL_CAMERA_STEPS.length).toBeGreaterThan(0)
    expect(NASM_VIRTUAL_ASSESSMENT_CHECKLIST.length).toBe(5)

    // Verify brand compliance in camera mode instructions
    const iosText = JSON.stringify(IOS_STILL_CAMERA_STEPS)
    expect(iosText).not.toContain('GAA')
    expect(iosText).not.toContain('Gordon Athletic')
    expect(iosText).toContain('Forge Athletic')

    const androidText = JSON.stringify(ANDROID_STILL_CAMERA_STEPS)
    expect(androidText).not.toContain('GAA')
    expect(androidText).not.toContain('Gordon Athletic')
  })

  it('exports MovementScreenInstructionsModal and MovementScreenGuideCard', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')
    expect(modalContent).toContain('export default function MovementScreenInstructionsModal')
    expect(modalContent).toContain('export function MovementScreenGuideCard')
  })

  it('contains comprehensive NASM Overhead Squat Assessment (OHSA) angle protocols', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')

    // Anterior Checkpoints
    expect(modalContent).toContain('Angle 1: Anterior (Front Facing)')
    expect(modalContent).toContain('Feet Flatten (Pronation)')
    expect(modalContent).toContain('Knees Cave Inward (Valgus)')

    // Lateral Checkpoints
    expect(modalContent).toContain('Angle 2: Lateral (Side Profile)')
    expect(modalContent).toContain('Excessive Forward Lean')
    expect(modalContent).toContain('Arms Fall Forward')

    // Posterior Checkpoints
    expect(modalContent).toContain('Angle 3: Posterior (Back Facing)')
    expect(modalContent).toContain('Heels Rise')
    expect(modalContent).toContain('Asymmetrical Weight Shift')

    // 5 Reps & 4/2/1 Tempo
    expect(modalContent).toContain('5 Repetitions')
    expect(modalContent).toContain('4/2/1')
  })

  it('includes secondary dynamic screens (Single-Leg Squat, Push/Pull)', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')

    expect(modalContent).toContain('Single-Leg Squat Assessment (SLS)')
    expect(modalContent).toContain('Pushing &amp; Pulling Dynamic Assessments')
    expect(modalContent).toContain('standing chest press')
    expect(modalContent).toContain('standing row')
    expect(modalContent).toContain('Secondary Dynamic Screens')
  })

  it('enforces Forge Athletic athlete wardrobe standard (shirts on at all times)', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')

    // Verify wardrobe rule is clearly communicated to athletes
    expect(modalContent).toContain('Male athletes must keep shirts on at all times')
    expect(modalContent).toContain('Forge Athletic Clinical Attire &amp; Acceptance Standard')
  })

  it('enforces Forge Athletic brand identity (never GAA or Gordon Athletic Advisory)', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')

    expect(modalContent).not.toContain('GAA')
    expect(modalContent).not.toContain('Gordon Athletic Advisory')
    expect(modalContent).not.toContain('Gordon Athletic')
    expect(modalContent).toContain('Forge Athletic')
  })

  it('enforces HIPAA (1996) privacy notice and secure storage for client assessment videos', () => {
    const modalContent = fs.readFileSync(modalFilePath, 'utf-8')

    expect(modalContent).toContain('HIPAA')
    expect(modalContent).toContain('AES-256')
    expect(modalContent).toContain('TLS 1.3')
    expect(modalContent).toContain('Row-Level Security')
  })

  it('integrates MovementScreenGuideCard and MovementScreenInstructionsModal into NasmAssessmentSummary', () => {
    const summaryContent = fs.readFileSync(nasmSummaryFilePath, 'utf-8')

    expect(summaryContent).toContain('MovementScreenInstructionsModal')
    expect(summaryContent).toContain('MovementScreenGuideCard')
    expect(summaryContent).toContain('Protocol &amp; Instructions')
    expect(summaryContent).toContain('onLaunchVideoUpload')
  })

  it('integrates MovementScreenInstructionsModal and OHSA guidance into VideoCritiqueStudio', () => {
    const studioContent = fs.readFileSync(videoStudioFilePath, 'utf-8')

    expect(studioContent).toContain('MovementScreenInstructionsModal')
    expect(studioContent).toContain('overhead_squat_assessment')
    expect(studioContent).toContain('Movement Screen Protocol & Checklist')
    expect(studioContent).toContain('NASM OHSA Protocol Active')
  })
})
