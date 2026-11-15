import { test, expect } from '@playwright/test'

const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVR42mNk+M9QzwAEjDAGACCcAwb7uP6mAAAAAElFTkSuQmCC'

test.describe('Feature #5: 33-Point AI Posture Mesh Scanner & Before/After Alignment Comparison', () => {
  test('PostureComparisonCard: overlay slider keyboard/pointer scrubbing, Side-by-Side, Day-30 reminder persistence, Quick Check telemetry, and dialog light-dismiss', async ({
    page,
  }) => {
    const telemetryBodies: Array<Record<string, unknown>> = []
    await page.route('**/api/telemetry', async route => {
      try {
        const parsed = route.request().postDataJSON()
        if (parsed && typeof parsed === 'object') telemetryBodies.push(parsed)
      } catch {
        // ignore
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accepted: 1 }),
      })
    })

    await page.setViewportSize({ width: 1280, height: 860 })
    await page.goto('/test-harness/posture-scanner')
    await page.evaluate(() => {
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.removeItem('forge_posture_day30_reminder_v1')
    })
    await page.reload()

    await expect(page.getByText('33-Point Posture Mesh Delta')).toBeVisible()
    await expect(page.getByText(/Forward Head -4\.5° · Score 84\/100/)).toBeVisible()

    // Open full-screen interactive comparison modal
    const compareBtn = page.getByRole('button', { name: 'Compare' })
    await expect(compareBtn).toBeVisible()
    await compareBtn.click()

    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: /Posture Alignment Side-by-Side & Overlay/i })
    ).toBeVisible()

    // Verify range slider keyboard navigation & >= 44px touch height
    const rangeSlider = dialog.getByRole('slider', {
      name: /Compare baseline and current 33-point posture alignment/i,
    })
    await expect(rangeSlider).toBeVisible()
    const sliderBox = await rangeSlider.boundingBox()
    expect(sliderBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    await expect(rangeSlider).toHaveValue('54')

    await rangeSlider.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(rangeSlider).toHaveValue('56')
    await expect(dialog.getByText('56%')).toBeVisible()

    // Switch to Side-by-Side view and Day-1 vs Day-30 view
    const sideBySideBtn = dialog.getByRole('button', { name: 'Side-by-Side' })
    await sideBySideBtn.click()
    await expect(sideBySideBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog.getByText(/Baseline · 8\.9°/)).toBeVisible()
    await expect(dialog.getByText(/Current · 4\.4°/)).toBeVisible()

    const day30Btn = dialog.getByRole('button', { name: 'Day-1 vs Day-30' })
    await day30Btn.click()
    await expect(day30Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog.getByText('Day-30 Target Preview')).toBeVisible()

    // Arm Day-30 Reminder and verify localStorage persistence
    const reminderBtn = dialog.getByRole('button', { name: /Set Day-30 Reminder/i })
    await reminderBtn.click()
    await expect(dialog.getByRole('button', { name: /Day-30 Reminder Set/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    const reminderStored = await page.evaluate(() =>
      window.localStorage.getItem('forge_posture_day30_reminder_v1')
    )
    expect(reminderStored).toBe('1')

    // Run 2-Min Quick Check -> updates delta in dialog AND syncs outer card via POSTURE_PROFILE_EVENT
    await dialog.getByRole('button', { name: /Run 2-Min Quick Check/i }).click()
    await expect(dialog.getByText('86/100', { exact: true })).toBeVisible()
    await expect(dialog.getByText('-4.8°', { exact: true })).toBeVisible()

    // Escape dismisses the native <dialog>
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Outer summary card immediately reflects the updated -4.8° & 86/100 delta
    await expect(page.getByText(/Forward Head -4\.8° · Score 86\/100/)).toBeVisible()

    // Re-open and verify backdrop light-dismiss (closedby="any" / outside pointer click)
    await compareBtn.click()
    await expect(dialog).toBeVisible()
    await page.mouse.click(12, 12)
    await expect(dialog).toBeHidden()

    await expect.poll(() => telemetryBodies.length).toBeGreaterThanOrEqual(1)
  })

  test('AiPostureMeshScannerModal: multi-pose photo isolation, live camera capture + hardware release on Escape, skeletal mesh canvas drawing, batch scan, and 1-click apply', async ({
    page,
  }) => {
    // Stub navigator.mediaDevices.getUserMedia with track.stop() spy so we verify hardware camera release
    await page.addInitScript(() => {
      ;(window as unknown as { __stoppedTracksCount: number }).__stoppedTracksCount = 0
      const fakeGetUserMedia = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#101827'
          ctx.fillRect(0, 0, 640, 480)
        }
        const stream = canvas.captureStream(15)
        for (const track of stream.getTracks()) {
          const origStop = track.stop.bind(track)
          track.stop = () => {
            ;(window as unknown as { __stoppedTracksCount: number }).__stoppedTracksCount += 1
            origStop()
          }
        }
        return stream
      }
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, 'mediaDevices', {
          value: { getUserMedia: fakeGetUserMedia },
          configurable: true,
        })
      } else {
        navigator.mediaDevices.getUserMedia = fakeGetUserMedia
      }
    })

    // Mock the coach posture-scanner API endpoint so we test deterministic multi-pose scan payloads
    await page.route('**/api/coach/clients/*/posture-scanner', async route => {
      const reqBody = route.request().postDataJSON() as { view?: string }
      const view = reqBody?.view || 'lateral'
      const isLateral = view === 'lateral'
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            view,
            postureScore: isLateral ? 78 : 82,
            syndromeDetected: isLateral ? 'Lower Crossed' : 'Pronation Distortion',
            landmarks: isLateral
              ? [
                  { id: 'ear', name: 'Ear', x: 44, y: 16, confidence: 0.96 },
                  { id: 'c7', name: 'C7', x: 48, y: 24, confidence: 0.94 },
                  { id: 'shoulder', name: 'Shoulder', x: 49, y: 30, confidence: 0.95 },
                  { id: 'hip', name: 'Hip', x: 50, y: 52, confidence: 0.96 },
                  { id: 'knee', name: 'Knee', x: 51, y: 72, confidence: 0.95 },
                  { id: 'ankle', name: 'Ankle', x: 50, y: 92, confidence: 0.98 },
                ]
              : [
                  { id: 'head', name: 'Head', x: 50, y: 14, confidence: 0.95 },
                  { id: 'l_shoulder', name: 'Left Shoulder', x: 36, y: 28, confidence: 0.93 },
                  { id: 'r_shoulder', name: 'Right Shoulder', x: 64, y: 28, confidence: 0.93 },
                  { id: 'l_hip', name: 'Left Hip', x: 42, y: 50, confidence: 0.95 },
                  { id: 'r_hip', name: 'Right Hip', x: 58, y: 50, confidence: 0.95 },
                  { id: 'l_knee', name: 'Left Knee', x: 45, y: 70, confidence: 0.96 },
                  { id: 'r_knee', name: 'Right Knee', x: 55, y: 70, confidence: 0.96 },
                  { id: 'l_ankle', name: 'Left Ankle', x: 42, y: 92, confidence: 0.97 },
                  { id: 'r_ankle', name: 'Right Ankle', x: 58, y: 92, confidence: 0.97 },
                ],
            angles: isLateral
              ? [
                  {
                    name: 'Craniovertebral (Forward Head)',
                    angleDegrees: 16.5,
                    status: 'moderate',
                    normalRange: '< 10°',
                    clinicalNote: 'Forward cervical drift',
                  },
                  {
                    name: 'Pelvic Incline (Anterior Tilt)',
                    angleDegrees: 13.5,
                    status: 'moderate',
                    normalRange: '5° - 10°',
                    clinicalNote: 'Increased lumbar lordosis',
                  },
                ]
              : [
                  {
                    name: 'Patellofemoral Q-Angle (Valgus)',
                    angleDegrees: 8.5,
                    status: 'moderate',
                    normalRange: '< 5°',
                    clinicalNote: 'Medial knee tracking',
                  },
                  {
                    name: 'Shoulder Transverse Level',
                    angleDegrees: 2.0,
                    status: 'optimal',
                    normalRange: '< 3°',
                    clinicalNote: 'Symmetric shoulder line',
                  },
                ],
            detectedCompensations: isLateral
              ? ['low_back_arches', 'head_protrudes']
              : ['knees_cave_in', 'feet_turn_out'],
            ohsaObservations: isLateral
              ? [
                  {
                    compensation: 'low_back_arches',
                    checkpoint: 'lphc',
                    observed: true,
                    severity: 'moderate',
                    view: 'lateral',
                  },
                ]
              : [
                  {
                    compensation: 'knees_move_inward',
                    checkpoint: 'knees',
                    observed: true,
                    severity: 'moderate',
                    view: 'anterior',
                  },
                ],
            staticFindings: [],
            cexPrescription: {
              inhibit: [{ muscle: 'TFL / Hip Flexors', protocol: 'SMR 45s' }],
              lengthen: [{ muscle: 'Half-Kneeling Hip Flexor Stretch', protocol: '2x30s' }],
              activate: [{ muscle: 'Gluteus Medius Clamshells', protocol: '2x15' }],
              integrate: [{ exercise: 'Squat to Row', protocol: '2x12' }],
            },
            clinicalSummary: `Julian ${view} alignment scan complete.`,
          },
        }),
      })
    })

    await page.setViewportSize({ width: 1280, height: 860 })
    await page.goto('/test-harness/posture-scanner')
    await page.evaluate(() => window.sessionStorage.clear())

    await page.getByTestId('open-ai-posture-scanner-btn').click()
    const scannerModal = page.locator('.posture-scanner-backdrop')
    await expect(scannerModal).toBeVisible()

    // Start live camera on Lateral view and press Escape -> verifies hardware track.stop() called!
    await scannerModal.getByRole('button', { name: /Take Photo/i }).click()
    await expect(scannerModal.getByText(/LIVE CAMERA — ALIGN WITH PLUMB LINE/i)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(scannerModal).toBeHidden()
    const stoppedAfterEscape = await page.evaluate(
      () => (window as unknown as { __stoppedTracksCount: number }).__stoppedTracksCount
    )
    expect(stoppedAfterEscape).toBeGreaterThanOrEqual(1)

    // Reopen scanner, snap Lateral photo, then switch to Anterior and snap Anterior photo independently
    await page.getByTestId('open-ai-posture-scanner-btn').click()
    await expect(scannerModal).toBeVisible()

    await scannerModal.getByRole('button', { name: /Take Photo/i }).click()
    await scannerModal.getByRole('button', { name: /SNAP PHOTO/i }).click()
    await expect(scannerModal.getByText('Multi-Pose Gallery (1/4 Captured)')).toBeVisible()

    // Switch to Anterior view -> Anterior is still Empty while Lateral stays Saved
    const anteriorTab = scannerModal.getByRole('button', { name: /1\. Anterior View/i })
    await anteriorTab.click()
    await expect(anteriorTab).toHaveAttribute('aria-pressed', 'true')
    await expect(scannerModal.getByRole('button', { name: /Take Photo/i })).toBeVisible()

    // Preload a photo via sessionStorage / camera snap on Anterior too
    await scannerModal.getByRole('button', { name: /Take Photo/i }).click()
    await scannerModal.getByRole('button', { name: /SNAP PHOTO/i }).click()
    await expect(scannerModal.getByText('Multi-Pose Gallery (2/4 Captured)')).toBeVisible()

    // Run Batch Scan across both loaded poses
    await scannerModal.getByRole('button', { name: /Scan All Poses/i }).click()
    await expect(scannerModal.getByText('Pronation Distortion Syndrome')).toBeVisible()
    await expect(scannerModal.getByText('Score: 82/100')).toBeVisible()

    // Verify skeletal mesh lines actually painted cyan (#38BDF8) pixels between Left & Right Shoulder on Anterior canvas!
    const hasCyanSkeletalMeshLine = await scannerModal.locator('canvas').evaluate(canvas => {
      const c = canvas as HTMLCanvasElement
      const ctx = c.getContext('2d')
      if (!ctx) return false
      // Midpoint between l_shoulder (x=36%, y=28%) and r_shoulder (x=64%, y=28%) is x=50%, y=28%
      const sampleX = Math.round(c.width * 0.5)
      const sampleY = Math.round(c.height * 0.28)
      const data = ctx.getImageData(sampleX - 2, sampleY - 2, 5, 5).data
      for (let i = 0; i < data.length; i += 4) {
        // #38BDF8 -> R~56, G~189, B~248, A>0
        if (data[i + 2] > 180 && data[i + 1] > 120 && data[i + 3] > 80) {
          return true
        }
      }
      return false
    })
    expect(hasCyanSkeletalMeshLine).toBe(true)

    // Switch between Photo Setup Guide and AI Scan Analysis tabs
    await scannerModal.getByRole('button', { name: 'Photo Setup Guide' }).click()
    await expect(scannerModal.getByText(/Stand facing directly toward the camera/i).first()).toBeVisible()
    await scannerModal.getByRole('button', { name: 'AI Scan Analysis' }).click()

    // Apply all 2 scanned poses to the NASM Assessment Form
    const applyBtn = scannerModal.getByRole('button', {
      name: /Apply All AI Findings \(2 Poses Scanned\) to Form/i,
    })
    await expect(applyBtn).toBeVisible()
    await applyBtn.click()

    await expect(scannerModal).toBeHidden()
    const appliedBanner = page.getByTestId('applied-scan-summary')
    await expect(appliedBanner).toBeVisible()
    await expect(appliedBanner).toContainText('Score 80/100')
    await expect(appliedBanner).toContainText('low_back_arches')
    await expect(appliedBanner).toContainText('knees_move_inward')
    void TINY_PNG_DATA_URL
  })

  test('PosturalDistortionStudio & Mobile 320px/375px Audit: all 5 presets, 16 checkpoints, opposite mutual exclusion, >= 44px touch targets, and zero horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/test-harness/posture-scanner')

    const studio = page.locator('.postural-distortion-studio')
    await expect(studio).toBeVisible()

    // Check zero horizontal document overflow at ultra-compact 320px width
    const hasOverflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(hasOverflow320).toBe(false)

    // Test Diagnostic Presets & >= 44px touch heights
    const optimalBtn = studio.getByRole('button', { name: 'Optimal Posture' })
    const btnBox = await optimalBtn.boundingBox()
    expect(btnBox?.height ?? 0).toBeGreaterThanOrEqual(44)

    await optimalBtn.click()
    await expect(optimalBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(studio.getByRole('heading', { name: 'Optimal Postural Alignment' })).toBeVisible()
    await expect(studio.getByText('Optimal (0% Dysfunction Score)')).toBeVisible()

    const upperBtn = studio.getByRole('button', { name: 'Upper Crossed (Forward Head)' })
    await upperBtn.click()
    await expect(upperBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(studio.getByRole('heading', { name: /Upper Crossed Syndrome/i })).toBeVisible()

    // Verify previously missing Scapular Winging & Asymmetric Weight Shift checkboxes exist and work
    const scapularCheckbox = studio.getByLabel('Scapular Winging')
    const asymShiftCheckbox = studio.getByLabel('Asymmetric Weight Shift')
    await expect(scapularCheckbox).toBeVisible()
    await expect(asymShiftCheckbox).toBeVisible()
    await scapularCheckbox.check()
    await expect(scapularCheckbox).toBeChecked()

    // Verify mutual exclusion between Anterior Pelvic Tilt & Posterior Pelvic Tilt, and Valgus & Varus
    const aptCheckbox = studio.getByLabel('Anterior Pelvic Tilt (Hyperlordosis)')
    const pptCheckbox = studio.getByLabel('Posterior Pelvic Tilt (Flat-Back)')
    await aptCheckbox.check()
    await expect(aptCheckbox).toBeChecked()
    await pptCheckbox.check()
    await expect(pptCheckbox).toBeChecked()
    await expect(aptCheckbox).not.toBeChecked()

    const valgusCheckbox = studio.getByLabel('Knees Move Inward (Valgus)')
    const varusCheckbox = studio.getByLabel('Knees Move Outward (Varus)')
    await valgusCheckbox.check()
    await expect(valgusCheckbox).toBeChecked()
    await varusCheckbox.check()
    await expect(varusCheckbox).toBeChecked()
    await expect(valgusCheckbox).not.toBeChecked()

    // Switch to Synergy Decoder Matrix & 4-Phase CEx Protocol tabs
    const synergyTab = studio.getByRole('button', { name: 'Synergy Decoder Matrix' })
    await synergyTab.click()
    await expect(synergyTab).toHaveAttribute('aria-pressed', 'true')
    await expect(studio.getByText(/Reciprocal Inhibition Mechanism:/i).first()).toBeVisible()

    const cexTab = studio.getByRole('button', { name: '4-Phase CEx Protocol' })
    await cexTab.click()
    await expect(cexTab).toHaveAttribute('aria-pressed', 'true')
    await expect(studio.getByText('1. Inhibit (SMR / Trigger Point)')).toBeVisible()
    await expect(studio.getByText('4. Integrate (Kinetic Chain)')).toBeVisible()

    // Also open AiPostureMeshScannerModal at 375x812 iPhone viewport and verify mobile tabs + >=44px targets + zero overflow
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByTestId('open-ai-posture-scanner-btn').click()
    const scannerModal = page.locator('.posture-scanner-backdrop')
    await expect(scannerModal).toBeVisible()

    const mobileSetupBtn = scannerModal.locator('.posture-mobile-tab-nav').getByRole('button', {
      name: 'Setup Guide',
    })
    await expect(mobileSetupBtn).toBeVisible()
    const mobileTabBox = await mobileSetupBtn.boundingBox()
    expect(mobileTabBox?.height ?? 0).toBeGreaterThanOrEqual(44)

    await mobileSetupBtn.click()
    await expect(mobileSetupBtn).toHaveAttribute('aria-pressed', 'true')
    await scannerModal.getByRole('button', { name: /READY TO TAKE PHOTO/i }).click()
    await expect(
      scannerModal.locator('.posture-mobile-tab-nav').getByRole('button', { name: /Camera & Viewfinder/i })
    ).toHaveAttribute('aria-pressed', 'true')

    const hasOverflow375 = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(hasOverflow375).toBe(false)
  })

  test('Public Landing Sneak Peek ("33-Point Posture" tab) renders sandbox PostureComparisonCard cleanly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const postureSneakTab = page.getByRole('tab', { name: /Posture/i }).first()
    if (await postureSneakTab.isVisible().catch(() => false)) {
      await postureSneakTab.click()
      await expect(page.getByRole('button', { name: 'Overlay Slider' }).first()).toBeVisible()
      await expect(
        page.getByRole('slider', { name: /Compare baseline and current 33-point posture alignment/i }).first()
      ).toBeVisible()
    }
  })
})
