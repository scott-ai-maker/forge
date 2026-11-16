import { expect, test } from '@playwright/test'

// Valid 1x1 PNG buffer for photo upload & DEXA scanner tests
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

test.describe('Feature #16: Secondary Utility & Auxiliary Lab Tools E2E', () => {
  test('AI DEXA-Vision Body Composition Scanner runs compliant & rejected scans inside native <dialog>', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.setViewportSize({ width: 393, height: 852 })
    await page.route('**/api/account/entitlements', route =>
      route.fulfill({
        json: {
          features: {
            nutrition: { active: true, expiresAt: null, usesRemaining: null },
            travel: { active: true, expiresAt: null, usesRemaining: null },
            'video-review': { active: true, expiresAt: null, usesRemaining: null },
          },
        },
      })
    )

    let forceReject = false
    await page.route('**/api/fitness/bodyfat', async route => {
      const payload = route.request().postDataJSON()
      expect(payload.sex).toBe('male')
      expect(payload.heightCm).toBeGreaterThan(100)
      expect(payload.weightKg).toBeGreaterThan(25)

      if (forceReject) {
        return route.fulfill({
          json: {
            isRejected: true,
            rejectionReason: 'Oversized hoodie obscures natural waistline contour.',
            scanResult: {
              estimatedBodyFatPercent: 18,
              confidenceIntervalPercent: 2.5,
              confidenceScore: 0.5,
              classification: 'Average / Healthy',
              leanBodyMassKg: 65.6,
              leanBodyMassLbs: 144.6,
              fatMassKg: 14.4,
              fatMassLbs: 31.7,
              skeletalMuscleMassKg: 36.7,
              skeletalMuscleMassLbs: 80.9,
              ffmi: 20.2,
              normalizedFfmi: 20.2,
              ffmiCategory: 'Above Average',
              cunninghamBmr: 1787,
              katchMcArdleBmr: 1787,
              maintenanceCaloriesTdee: 2770,
              waistToHipRatio: 0.86,
              waistToHeightRatio: 0.47,
              visceralFatRisk: 'Low',
              androidGynoidRatio: 0.88,
              regionalBreakdown: [],
              photoQualityAssessment: {
                overallRating: 'suboptimal',
                framingScore: 70,
                lightingScore: 80,
                multiViewEnhanced: false,
                clothingOcclusionWarning: true,
                postureCompensationDetected: false,
                postureCorrectionNote: 'Neutral',
              },
              isRejected: true,
              rejectionReason: 'Oversized hoodie obscures natural waistline contour.',
              recompositionProjection: {
                targetBodyFatPercent: 12,
                targetFatMassKg: 8.8,
                targetFatMassLbs: 19.4,
                targetWeightKg: 73.4,
                targetWeightLbs: 161.8,
                fatToLoseKg: 5.6,
                fatToLoseLbs: 12.3,
                leanMassChangeKg: -1,
                leanMassChangeLbs: -2.2,
                estimatedWeeksToGoal: 10,
                dailyCaloricTarget: 2270,
                dailyProteinGrams: 144,
                recommendedNasmPhase: 2,
                phaseName: 'Phase 2: Strength Endurance',
                weeklyDeficitOrSurplus: -3500,
                coachingDirectives: [],
              },
              methodDescription: 'DEXA 4C Multi-View AI Spatial Anthropometry',
              coachSummaryNotes: 'Rejected due to non-compliant attire.',
            },
          },
        })
      }

      return route.fulfill({
        json: {
          isRejected: false,
          rejectionReason: null,
          scanResult: {
            estimatedBodyFatPercent: 15.2,
            confidenceIntervalPercent: 1.2,
            confidenceScore: 0.94,
            classification: 'Fitness / Defined',
            leanBodyMassKg: 67.8,
            leanBodyMassLbs: 149.5,
            fatMassKg: 12.2,
            fatMassLbs: 26.9,
            skeletalMuscleMassKg: 38.0,
            skeletalMuscleMassLbs: 83.8,
            ffmi: 20.9,
            normalizedFfmi: 20.9,
            ffmiCategory: 'Above Average',
            cunninghamBmr: 1835,
            katchMcArdleBmr: 1835,
            maintenanceCaloriesTdee: 2844,
            waistToHipRatio: 0.85,
            waistToHeightRatio: 0.46,
            visceralFatRisk: 'Low',
            androidGynoidRatio: 0.87,
            regionalBreakdown: [
              {
                region: 'abdominals_core',
                label: 'Core & Rectus Abdominis',
                estimatedFatPercent: 14.8,
                muscleDefinitionScore: 7.5,
                clinicalObservation: 'Visible upper rectus outline and oblique taper.',
              },
            ],
            photoQualityAssessment: {
              overallRating: 'optimal',
              framingScore: 95,
              lightingScore: 92,
              multiViewEnhanced: false,
              clothingOcclusionWarning: false,
              postureCompensationDetected: false,
              postureCorrectionNote: 'Neutral sagittal posture.',
            },
            recompositionProjection: {
              targetBodyFatPercent: 12,
              targetFatMassKg: 9.1,
              targetFatMassLbs: 20.1,
              targetWeightKg: 75.9,
              targetWeightLbs: 167.3,
              fatToLoseKg: 3.1,
              fatToLoseLbs: 6.8,
              leanMassChangeKg: -1.0,
              leanMassChangeLbs: -2.2,
              estimatedWeeksToGoal: 6,
              dailyCaloricTarget: 2344,
              dailyProteinGrams: 149,
              recommendedNasmPhase: 2,
              phaseName: 'Phase 2: Strength Endurance',
              weeklyDeficitOrSurplus: -3500,
              coachingDirectives: [],
            },
            methodDescription: 'DEXA 4C Multi-View AI Spatial Anthropometry',
            coachSummaryNotes: 'Athletic lean mass distribution.',
          },
        },
      })
    })

    await page.goto('/test-harness/fitness-mobile?workspace=bodycomp&scenario=lab-bodycomp')
    await page.getByRole('button', { name: 'Start body composition scan' }).click()

    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'AI DEXA-Vision Body Composition Estimator' })).toBeVisible()

    // Toggle units and verify aria-pressed + converted biometrics
    const metricBtn = dialog.getByRole('button', { name: 'KG / CM' })
    const imperialBtn = dialog.getByRole('button', { name: 'LBS / IN' })
    await metricBtn.click()
    await expect(metricBtn).toHaveAttribute('aria-pressed', 'true')
    await imperialBtn.click()
    await expect(imperialBtn).toHaveAttribute('aria-pressed', 'true')

    // Attire pre-check blocks scan until confirmed
    await dialog.getByRole('button', { name: /Execute DEXA Multi-Compartment Scan/i }).click()
    await expect(dialog.getByText(/Please confirm that your photo adheres to Forge Athletic Attire Standards/)).toBeVisible()

    // Upload compliant photo, confirm attire, and run rejected scan first to verify guardrail
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'front.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })
    await dialog.getByRole('checkbox', { name: /I confirm this photo complies with Forge Athletic Attire Standards/i }).check()

    forceReject = true
    await dialog.getByRole('button', { name: /Execute DEXA Multi-Compartment Scan/i }).click()
    await expect(dialog.getByText('Scan Rejected — Non-Compliant Attire Detected')).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Cannot Save Rejected Scan/i })).toBeDisabled()

    // Retake & run compliant scan
    await dialog.getByRole('button', { name: 'Retake Photo in Compliant Fitted Attire' }).click()
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'compliant.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })
    forceReject = false
    await dialog.getByRole('button', { name: /Execute DEXA Multi-Compartment Scan/i }).click()
    await expect(dialog.getByText('15.2%', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Fitness / Defined')).toBeVisible()

    // Adjust Target Body Recomposition Trajectory slider
    const targetSlider = dialog.getByRole('slider', { name: 'Target Body Recomposition Trajectory' })
    await expect(targetSlider).toHaveClass(/forge-range-slider/)
    await targetSlider.focus()
    await page.keyboard.press('ArrowRight')

    // Apply & save updates parent Body Fat % readout
    await dialog.getByRole('button', { name: /Apply & Save to Record/i }).click()
    await expect(page.locator('.fitness-lab-stats')).toContainText('15.2%')
    expect(pageErrors).toEqual([])
  })

  test('Progress Photo Timeline enforces attire confirmation and uploads labeled photo cleanly at 320px', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.setViewportSize({ width: 320, height: 800 })
    await page.route('**/api/fitness/personal-records', route => route.fulfill({ json: { records: [] } }))
    await page.route('**/api/fitness/goals', route => route.fulfill({ json: { goals: [] } }))
    await page.route('**/api/fitness/progress-photos', async route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
          json: {
            photo: {
              id: 'uploaded-photo-1',
              photo_url: '/images/exercises/barbell-flat-bench-press.jpg',
              taken_at: '2026-10-15',
              notes: 'Morning fasted front pose',
            },
          },
        })
      }
      return route.fulfill({ json: { photos: [] } })
    })

    await page.goto('/test-harness/fitness-mobile?scenario=progress&workspace=progress')
    const progress = page.locator('.fitness-progress-view')
    await progress.locator('summary').filter({ hasText: 'Progress photos' }).click()

    await progress.getByLabel('Select progress photo').setInputFiles({
      name: 'progress.png',
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })
    await progress.getByLabel('Progress photo notes').fill('Morning fasted front pose')

    // Uncheck attire checkbox -> blocked
    const attireCheckbox = progress.getByRole('checkbox', {
      name: /I confirm this photo meets Forge Athletic Attire Standards/i,
    })
    await attireCheckbox.uncheck()
    await progress.getByRole('button', { name: 'Save Progress Photo' }).click()
    await expect(progress.getByText(/Please verify that your photo complies with Forge Athletic Attire Standards/)).toBeVisible()

    // Re-check attire checkbox -> saves cleanly
    await attireCheckbox.check()
    await progress.getByRole('button', { name: 'Save Progress Photo' }).click()
    await expect(progress.getByText('Progress photo saved.')).toBeVisible()
    await expect(progress.getByText('Morning fasted front pose')).toBeVisible()

    // Verify zero horizontal overflow at 320px
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    expect(pageErrors).toEqual([])
  })

  test('3D Muscle Recovery Heatmap, Sanctuary Mode HUD, Mindful Moment, & Auxiliary Modals work at 320px with zero overflow', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.setViewportSize({ width: 320, height: 800 })
    await page.route('**/api/coach/tts', route =>
      route.fulfill({ status: 204, headers: { 'Cache-Control': 'no-store, max-age=0' } })
    )

    await page.goto('/test-harness/fitness-mobile?view=auxiliary-lab')

    // 1. Sanctuary Mode HUD: Breath Pacer expansion, cadence switch, Coach Memos modal, & Distraction Shield
    await expect(page.getByText('SANCTUARY MODE')).toBeVisible()
    await page.getByRole('button', { name: /Breath Pacer/i }).click()
    const vagalCadenceBtn = page.getByRole('button', { name: '4-2-6 (Vagal Recovery)' })
    await vagalCadenceBtn.click()
    await expect(vagalCadenceBtn).toHaveAttribute('aria-pressed', 'true')

    // Open Coach Memos native <dialog> and verify SanctuaryAudioNotePlayer
    await page.getByTestId('sanctuary-coach-notes-btn').click()
    const memosDialog = page.locator('dialog[open]')
    await expect(memosDialog).toBeVisible()
    await expect(memosDialog.getByText('Coach Gordon · In-Ear Memos')).toBeVisible()
    await expect(memosDialog.getByTestId('audio-note-transcript-drawer')).toBeVisible()
    await memosDialog.getByRole('button', { name: 'Hide Notes' }).click()
    await expect(memosDialog.getByTestId('audio-note-transcript-drawer')).toHaveCount(0)
    await memosDialog.getByRole('button', { name: 'Close Coach Memos' }).click()
    await expect(memosDialog).toHaveCount(0)

    // Simulate Distraction Shield alert modal (closedby="none", dismissed via explicit button)
    await page.getByRole('button', { name: 'Simulate Distraction Shield' }).click()
    const shieldDialog = page.locator('dialog[open]')
    await expect(shieldDialog.getByText('SANCTUARY SHIELD')).toBeVisible()
    await shieldDialog.getByRole('button', { name: /Return to Lift/i }).click()
    await expect(shieldDialog).toHaveCount(0)

    // 2. 3D Muscle Recovery Heatmap: Perspective toggle, keyboard muscle zone buttons, PAR-Q shield, & Time-Lapse slider
    await expect(page.getByRole('heading', { name: 'Muscle recovery map' })).toBeVisible()
    const quadZoneBtn = page.getByRole('group', { name: 'Select anterior muscle zone' }).getByRole('button', { name: /Quadriceps/i })
    await quadZoneBtn.click()
    await expect(quadZoneBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('progress.forge-progress-bar').first()).toBeVisible()

    // Rotate to Posterior perspective and select Hamstrings
    await page.getByRole('button', { name: 'Posterior (Back)' }).click()
    await expect(page.getByRole('button', { name: 'Posterior (Back)' })).toHaveAttribute('aria-pressed', 'true')
    const hamZoneBtn = page.getByRole('group', { name: 'Select posterior muscle zone' }).getByRole('button', { name: /Hamstrings/i })
    await hamZoneBtn.click()
    await expect(hamZoneBtn).toHaveAttribute('aria-pressed', 'true')

    // Expand Recovery simulation & verify PAR-Q Pharmacological Safety Shield + Time-Lapse +24h jump
    await page.locator('summary').filter({ hasText: 'Recovery simulation & advanced inputs' }).click()
    await expect(page.getByText('PAR-Q Pharmacological Safety Shield Active')).toBeVisible()
    await page.getByRole('button', { name: '+24h' }).click()
    await expect(page.getByText('+24 Hours Forward')).toBeVisible()

    // 3. Mindful Moment Modal: Native <dialog>, protocol selection, <progress> bar, and Early Complete
    await page.getByRole('button', { name: 'Open Mindful Moment' }).click()
    const mindfulDialog = page.locator('dialog[open]')
    await expect(mindfulDialog.getByRole('heading', { name: /MINDFUL MOMENT/i })).toBeVisible()
    const boxProtoBtn = mindfulDialog.getByRole('button', { name: /4-4-4-4 Box Breathing/i })
    await boxProtoBtn.click()
    await expect(boxProtoBtn).toHaveAttribute('aria-pressed', 'true')
    await mindfulDialog.getByRole('button', { name: '2 Min' }).click()
    await mindfulDialog.getByRole('button', { name: /BEGIN MINDFUL RESET/i }).click()
    await expect(mindfulDialog.locator('progress.forge-progress-bar')).toBeVisible()
    await mindfulDialog.getByRole('button', { name: /Complete Early & Sync/i }).click()
    await expect(mindfulDialog.getByText('RESTORED', { exact: true })).toBeVisible()
    await mindfulDialog.getByRole('button', { name: /Done & Logged/i }).click()
    await expect(page.getByTestId('mindful-completed-status')).toContainText('Completed box')

    // 4. Coach Sanctuary Voice Studio Modal
    await page.getByRole('button', { name: 'Open Voice Studio' }).click()
    const voiceDialog = page.locator('dialog[open]')
    await expect(voiceDialog.getByRole('heading', { name: 'Sanctuary In-Ear Voice Studio' })).toBeVisible()
    await voiceDialog.getByLabel('Memo Title').fill('UAT Squat Brace Cue')
    await voiceDialog.getByTestId('dispatch-sanctuary-note-btn').click()
    await expect(voiceDialog.getByText('UAT Squat Brace Cue')).toBeVisible({ timeout: 4000 })
    await page.keyboard.press('Escape')
    await expect(voiceDialog).toHaveCount(0)

    // 5. Resistance Band Matrix Modal
    await page.getByRole('button', { name: 'Open Band Matrix' }).click()
    const bandDialog = page.locator('dialog[open]')
    await expect(bandDialog.getByRole('heading', { name: 'Resistance Band Matrix' })).toBeVisible()
    await bandDialog.locator('.band-matrix-mobile-cards').getByRole('button', { name: 'Select' }).first().click()
    await expect(page.getByTestId('selected-band-status')).toContainText('Yellow')

    // 6. Barbell Plate Calculator Modal & Proof of Work Dossier Modal
    await page.getByRole('button', { name: 'Open Plate Calculator' }).click()
    const plateDialog = page.locator('dialog[open]')
    await expect(plateDialog.getByRole('heading', { name: /BARBELL & PLATE LOADING CALCULATOR/i })).toBeVisible()
    await plateDialog.getByRole('button', { name: '+5' }).click()
    await expect(plateDialog.getByLabel('Target Barbell Weight (LBS)')).toHaveValue('230')
    await page.keyboard.press('Escape')
    await expect(plateDialog).toHaveCount(0)

    await page.getByRole('button', { name: 'Open Proof of Work' }).click()
    const powDialog = page.locator('dialog[open]')
    await expect(powDialog.getByTestId('proof-of-work-dossier')).toBeVisible()
    await powDialog.getByRole('button', { name: 'Close dossier modal' }).click()
    await expect(powDialog).toHaveCount(0)

    // Strict 320px reflow check & zero page errors
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    expect(pageErrors).toEqual([])
  })
})
