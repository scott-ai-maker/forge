import { expect, test } from '@playwright/test'

test.describe('Feature #2 — Daily Workout Player, Smart Swap & 5-Phase NASM OPT™ Engine', () => {
  test('mid-set "Joint Feels Pinchy / Uncomfortable" swaps active lift in-place while keeping card open and safety alert mounted', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.route('**/api/telemetry/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    )

    await page.goto('/test-harness/fitness-mobile?scenario=strength', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '2. Lifts', exact: true }).click()

    const firstCard = page.locator('#exercise-item-1-0')
    await expect(firstCard).toBeVisible()
    await expect(firstCard).toContainText('Barbell Back Squat')
    await expect(firstCard.locator('details').first()).toHaveAttribute('open', '')

    // Tap "Joint Feels Pinchy / Uncomfortable"
    await firstCard.getByTestId('in-set-joint-pinchy-btn').click()

    // Regression guard: active exercise accordion MUST stay open and keep InSetCoachAdaptationsBar mounted
    await expect(firstCard.locator('details').first()).toHaveAttribute('open', '')
    const safetyAlert = firstCard.getByTestId('in-set-safety-override-card')
    await expect(safetyAlert).toBeVisible()
    await expect(safetyAlert).toHaveAttribute('role', 'alert')
    await expect(firstCard.getByTestId('in-set-message-real-coach-btn')).toBeVisible()

    // Active lift title in summary must be replaced by a pain-free regression
    const summaryTitle = await firstCard.locator('summary').first().textContent()
    expect(summaryTitle).not.toContain('Barbell Back Squat')
  })

  test('SmartExerciseSwapModal opens as native <dialog>, filters by joint discomfort, dismisses via Escape, and applies substitution', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto('/test-harness/fitness-mobile?scenario=hypertrophy', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '2. Lifts', exact: true }).click()

    const firstCard = page.locator('#exercise-item-1-0')
    await expect(firstCard).toContainText('Barbell Bench Press')

    await firstCard.locator('summary').filter({ hasText: 'Edit set details' }).click()
    await firstCard.getByRole('button', { name: 'Swap for Joint Relief' }).click()

    const swapDialog = page.getByTestId('smart-exercise-swap-modal')
    await expect(swapDialog).toBeVisible()
    await expect(swapDialog).toHaveAttribute('open', '')

    const allOptionsBtn = swapDialog.getByRole('button', { name: 'All Options' })
    const shoulderBtn = swapDialog.getByRole('button', { name: 'Shoulder / Rotator Cuff' })
    const kneeBtn = swapDialog.getByRole('button', { name: 'Knee / Patellar Relief' })
    // Auto-populated from athlete orthopedic intake ("Mild right shoulder impingement...")
    await expect(shoulderBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(allOptionsBtn).toHaveAttribute('aria-pressed', 'false')

    const shoulderBox = await shoulderBtn.boundingBox()
    expect(shoulderBox!.height).toBeGreaterThanOrEqual(44)

    await kneeBtn.click()
    await expect(kneeBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(shoulderBtn).toHaveAttribute('aria-pressed', 'false')

    await allOptionsBtn.click()
    await expect(allOptionsBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(kneeBtn).toHaveAttribute('aria-pressed', 'false')

    // Native <dialog> Escape dismissal
    await page.keyboard.press('Escape')
    await expect(swapDialog).toBeHidden()

    // Re-open and apply substitution
    await firstCard.getByRole('button', { name: 'Swap for Joint Relief' }).click()
    await expect(swapDialog).toBeVisible()
    const firstSubName = await swapDialog
      .getByTestId('swap-option-card-0')
      .locator('div')
      .nth(2)
      .textContent()

    await swapDialog.getByRole('button', { name: /Select substitution/i }).first().click()
    await expect(swapDialog).toBeHidden()

    // Active card stays open on the newly substituted exercise
    await expect(firstCard.locator('details').first()).toHaveAttribute('open', '')
    if (firstSubName?.trim()) {
      await expect(firstCard.locator('summary').first()).toContainText(firstSubName.trim())
    }
  })

  test('SkipExerciseModal opens as native <dialog> and forwards fatigue reason + coach notes to /api/fitness/skip-exercise', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    let capturedSkipBody: Record<string, unknown> | null = null
    await page.route('**/api/fitness/skip-exercise', async route => {
      capturedSkipBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'skip-e2e-1',
          exercise_name: capturedSkipBody?.exercise_name,
          reason: 'other',
          notes: `[Excessive Fatigue / Overload] ${String(capturedSkipBody?.notes ?? '')}`,
        }),
      })
    })

    await page.goto('/test-harness/fitness-mobile?scenario=strength', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '2. Lifts', exact: true }).click()

    const firstCard = page.locator('#exercise-item-1-0')
    await firstCard.locator('summary').filter({ hasText: 'Edit set details' }).click()
    await firstCard.getByRole('button', { name: 'Skip Exercise' }).click()

    const skipDialog = page.getByTestId('skip-exercise-modal')
    await expect(skipDialog).toBeVisible()
    await expect(skipDialog).toHaveAttribute('open', '')

    await skipDialog.getByLabel('Primary Skip Reason').selectOption('fatigue')
    await skipDialog.getByLabel('Coach Notes & Context').fill('Legs taxed after overnight red-eye flight')
    await skipDialog.getByRole('button', { name: 'Log Skip' }).click()

    await expect(skipDialog).toBeHidden()
    expect(capturedSkipBody).toMatchObject({
      exercise_name: 'Barbell Back Squat',
      reason: 'fatigue',
      notes: 'Legs taxed after overnight red-eye flight',
    })
  })

  test('Phase 01 Stabilization "Too Easy / Too Hard" enforces 4-2-1-1 eccentric/isometric tempo and +5% load cap', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto('/test-harness/fitness-mobile?scenario=band', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: '2. Lifts', exact: true }).click()

    const firstCard = page.locator('#exercise-item-1-0')
    await firstCard.getByRole('textbox', { name: 'Weight in pounds' }).fill('40')

    await firstCard.getByTestId('in-set-too-easy-hard-btn').click()
    await expect(firstCard.getByTestId('in-set-difficulty-picker')).toBeVisible()
    await firstCard.getByTestId('in-set-choice-too-easy').click()

    const rationale = firstCard.getByTestId('in-set-adaptation-rationale-card')
    await expect(rationale).toBeVisible()
    await expect(rationale).toContainText('4-2-1-1')
    // 40 lb * 1.05 = 42.5 lb (rounded to 2.5 lb step)
    await expect(firstCard.getByRole('textbox', { name: 'Weight in pounds' })).toHaveValue('42.5')
  })

  test('OptPhaseRoadmap switches interactively across Phases 01–05 with accurate NASM OPT™ prescriptions', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const tablist = page.getByRole('tablist', { name: 'Interactive Forge Athletic product previews' })
    await expect(tablist).toHaveAttribute('data-hydrated', 'true')

    const optTab = tablist.getByRole('tab', { name: /5-Phase NASM OPT/i })
    await optTab.scrollIntoViewIfNeeded()
    await optTab.click()
    await expect(optTab).toHaveAttribute('aria-selected', 'true')

    const phase1Btn = page.getByRole('button', { name: /PHASE 01.*Stabilization/i })
    const phase2Btn = page.getByRole('button', { name: /PHASE 02.*Strength Endurance/i })
    const phase4Btn = page.getByRole('button', { name: /PHASE 04.*Max Strength/i })
    const phase5Btn = page.getByRole('button', { name: /PHASE 05.*Power/i })

    await expect(phase2Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('PHASE 02 · Lean Muscle Work Capacity & Superset Stamina')).toBeVisible()

    await phase1Btn.click()
    await expect(phase1Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(phase2Btn).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('PHASE 01 · Bulletproof Joints, Core Bracing & Alignment')).toBeVisible()

    await phase4Btn.click()
    await expect(phase4Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('PHASE 04 · Peak Force Output & Dense Neural Strength')).toBeVisible()
    await expect(page.getByText('4–6 Sets · 1–5 Reps · 3–5m Rest')).toBeVisible()

    await phase5Btn.click()
    await expect(phase5Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('PHASE 05 · Athletic Speed, Elasticity & Force-Velocity')).toBeVisible()
  })
})
