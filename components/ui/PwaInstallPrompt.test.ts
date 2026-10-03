import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('PwaInstallPrompt & Modal Stacking Architecture', () => {
  it('verifies PwaInstallPrompt renders at top safe area and suppresses on live routes', () => {
    const promptPath = path.resolve(__dirname, './PwaInstallPrompt.tsx')
    const content = fs.readFileSync(promptPath, 'utf-8')

    // Must be positioned at top safe area on mobile so it never hides bottom buttons
    expect(content).toContain('className="pwa-install-banner"')
    expect(content).toContain('top: \'calc(10px + env(safe-area-inset-top, 0px))\'')
    expect(content).not.toContain('bottom: \'calc(84px')

    // Must suppress on live video and test harnesses
    expect(content).toContain('pathname.includes(\'/live\')')
    expect(content).toContain('pathname.startsWith(\'/test-harness\')')

    // Must enforce 30-day snooze
    expect(content).toContain('gaa_pwa_prompt_dismissed_v2')
    expect(content).toContain('30 * 24 * 60 * 60 * 1000')
  })

  it('guarantees all modal dialogs have zIndex >= 100000 to sit firmly above MobileBottomNav (9999)', () => {
    const modalFiles = [
      'components/fitness/MedicalParqModal.tsx',
      'components/settings/MedicalClearanceStudio.tsx',
      'components/tutorials/InteractiveFeatureTutorialModal.tsx',
      'components/fitness/ExecutiveSupplementTimeline.tsx',
      'components/coach/CoachConsultantMemoModal.tsx',
      'components/coach/ClientDetailClient.tsx',
      'components/fitness/AiBodyCompositionScannerModal.tsx',
      'components/fitness/AskCoachGordonModal.tsx',
      'components/coach/CoachClientStatusModal.tsx',
      'components/coach/CoachScheduleSessionModal.tsx',
      'components/coach/CoachTravelRecalibratorModal.tsx',
      'components/coach/VoiceSoapNotesModal.tsx',
      'components/fitness/ClinicalKineticWarmupModule.tsx',
      'components/fitness/ClinicalCoolDownModule.tsx',
      'components/coach/AiPostureMeshScannerModal.tsx',
      'components/coach/SmartExerciseSwapModal.tsx',
      'components/coach/LiveSlowMoReplayModal.tsx',
      'components/coach/LiveSessionWrapUpModal.tsx',
      'components/ui/WhatsNewModal.tsx',
      'components/fitness/BandResistanceChartModal.tsx',
    ]

    for (const relPath of modalFiles) {
      const fullPath = path.resolve(__dirname, '../../', relPath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      // Extract all zIndex declarations
      const zIndexMatches = [...content.matchAll(/zIndex:\s*([0-9]+)/g)].map(m => Number(m[1]))
      const maxZ = Math.max(...zIndexMatches)
      expect(
        maxZ,
        `Expected ${relPath} to have a modal backdrop zIndex >= 100000 (found ${maxZ})`
      ).toBeGreaterThanOrEqual(100000)
    }
  })

  it('verifies floating workout docks have mobile bottom dock clearance in globals.css', () => {
    const cssPath = path.resolve(__dirname, '../../app/globals.css')
    const cssContent = fs.readFileSync(cssPath, 'utf-8')

    expect(cssContent).toContain('.floating-rest-timer-dock')
    expect(cssContent).toContain('.live-session-sticky-dock')
    expect(cssContent).toContain('bottom: calc(72px + env(safe-area-inset-bottom, 8px)) !important;')
    expect(cssContent).toContain('padding-bottom: calc(140px + env(safe-area-inset-bottom, 16px)) !important;')
  })
})
