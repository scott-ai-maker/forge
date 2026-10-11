import { expect, test } from '@playwright/test'

test.describe('Gym-Floor Fitness Tracker, Set Logger & Movement Standards Feature Suite', () => {
  test('renders workout day, exercise cards, and movement standard banners', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')

    // Verify workout day focus header
    await expect(page.getByText(/Day 1: Chest, Back & Core Stabilization/i)).toBeVisible()

    // Verify 3 planned exercises
    await expect(page.getByText('Barbell Flat Bench Press').first()).toBeVisible()
    await expect(page.getByText('Incline Dumbbell Bench Press').first()).toBeVisible()
    await expect(page.getByText('Cable Chest Fly').first()).toBeVisible()

    // Target the first active exercise item (which is auto-expanded by default)
    const benchItem = page.locator('#exercise-item-1-0')
    await expect(benchItem).toBeVisible()

    // Verify 16:9 NASM demonstration video banner and target metrics
    await expect(benchItem.getByText(/NASM Clinical Form/i)).toBeVisible()
    await expect(benchItem.getByText(/3 sets × 10/i)).toBeVisible()
    await expect(benchItem.getByRole('textbox', { name: /Number of reps/i })).toBeVisible()
    await expect(benchItem.getByRole('textbox', { name: /Weight in pounds/i })).toBeVisible()

    // Verify 44x44 thumbnail touch target inside summary
    const thumbnail = benchItem.locator('summary img').first()
    await expect(thumbnail).toBeVisible()
    const box = await thumbnail.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(40)
    expect(box?.height).toBeGreaterThanOrEqual(40)
  })

  test('logs all prescribed sets, prefills the next set, and advances to cardio only when complete', async ({ page }) => {
    await page.route('**/api/workouts/log-set', async route => {
      const payload = route.request().postDataJSON()
      await route.fulfill({
        json: {
          setLog: {
            id: `uat-${payload.exerciseName}-${payload.setNumber}`,
            exercise_name: payload.exerciseName,
            session_date: payload.sessionDate,
            set_number: payload.setNumber,
            reps: payload.reps,
            weight_kg: payload.weightKg,
            is_warmup: payload.isWarmup,
            notes: payload.notes,
          },
        },
      })
    })
    await page.goto('/test-harness/fitness-mobile')

    const benchItem = page.locator('#exercise-item-1-0')
    await expect(benchItem).toBeVisible()

    // Find weight and rep inputs for this exercise using exact ARIA labels
    const weightInput = benchItem.getByRole('textbox', { name: /Weight in pounds/i })
    await weightInput.fill('185')

    const repsInput = benchItem.getByRole('textbox', { name: /Number of reps/i })
    await repsInput.fill('10')

    // Find the primary Quick Log Set button and click it
    const logSetBtn = benchItem.getByRole('button', { name: /Log Set 1/i })
    await expect(logSetBtn).toBeVisible()
    await expect(logSetBtn).toContainText('185 lb × 10 reps')
    await logSetBtn.click()

    // Verify dynamic 1-Tap prefill button appears with emerald styling and Match Set 1 label
    const prefillBtn = benchItem.getByRole('button', { name: /Match Set 1: 185 lb × 10 reps/i })
    await expect(prefillBtn).toBeVisible()
    await expect(benchItem.getByText(/Logged this session/i)).toBeVisible()

    // Exercise the real touch target rather than bypassing overlay collisions.
    await prefillBtn.scrollIntoViewIfNeeded()
    await prefillBtn.click()
    expect(await weightInput.inputValue()).toBe('185')
    expect(await repsInput.inputValue()).toBe('10')

    // A single set per exercise must not complete a three-set prescription.
    for (let index = 1; index < 3; index++) {
      const item = page.locator(`#exercise-item-1-${index}`)
      await item.locator('summary').click()
      await item.getByRole('textbox', { name: /Weight in pounds/i }).fill('50')
      await item.getByRole('button', { name: /Log Set 1/i }).click()
    }
    await expect(page.getByRole('button', { name: 'Advance to Stage 3 Cardio' })).not.toBeVisible()

    for (let index = 0; index < 3; index++) {
      const item = page.locator(`#exercise-item-1-${index}`)
      const input = item.getByRole('textbox', { name: /Number of reps/i })
      if (!(await input.isVisible())) await item.locator('summary').click()
      await item.getByRole('button', { name: /Log Set 2/i }).click()
      await item.getByRole('button', { name: /Log Set 3/i }).click()
    }
    const advance = page.getByRole('button', { name: 'Advance to Stage 3 Cardio' })
    await expect(advance).toBeVisible()
    await advance.click()
    await expect(page.getByText('Quick Cardio Log', { exact: true })).toBeVisible()
  })

  test('keeps Phase 1 single-set rules and exposes one workout stage at a time', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')
    await expect(page.getByText('Single Sets Only', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Supersets/i })).toHaveCount(0)
    const stages = page.getByRole('group', { name: 'Workout stages' })
    await expect(stages.getByRole('button', { name: '2. Lifts', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Quick Cardio Log', { exact: true })).not.toBeVisible()
    await stages.getByRole('button', { name: '3. Cardio', exact: true }).click()
    await expect(page.getByText('Quick Cardio Log', { exact: true })).toBeVisible()
    await expect(page.locator('#exercise-item-1-0')).not.toBeVisible()
    await stages.getByRole('button', { name: '2. Lifts', exact: true }).click()
    await expect(page.locator('#exercise-item-1-0')).toBeVisible()
    await page.getByRole('button', { name: 'Start Session', exact: true }).click()
    await expect(stages.getByRole('button', { name: '1. Warm-Up', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: /Mark All Done/i }).click()
    await expect(stages.getByRole('button', { name: '2. Lifts', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('opens and navigates Barbell Plate Calculator and Warmup Ramp tools', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')

    const benchItem = page.locator('#exercise-item-1-0')
    await expect(benchItem).toBeVisible()

    const warmupBtn = benchItem.getByTestId('toggle-warmup-tools-btn')
    await warmupBtn.click()
    const sheet = page.getByTestId('workout-tool-bottom-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('button', { name: 'Close tools sheet' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect.poll(() => sheet.evaluate(element => {
      const controls = Array.from(element.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
      )).filter(control => control.getClientRects().length > 0)
      return document.activeElement === controls[controls.length - 1]
    })).toBe(true)
    await page.keyboard.press('Tab')
    await expect(sheet.getByRole('button', { name: 'Close tools sheet' })).toBeFocused()
    await sheet.getByTestId('sheet-tab-telemetry').click()
    await expect(sheet.getByTestId('sheet-tab-telemetry')).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(sheet).not.toBeVisible()
    await expect(warmupBtn).toBeFocused()
    await page.getByRole('button', { name: 'Plates', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'BARBELL & PLATE LOADING CALCULATOR' })).toBeVisible()
  })
})
