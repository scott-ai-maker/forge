import { expect, test } from '@playwright/test'

test.describe('Gym-Floor Fitness Tracker, Set Logger & Movement Standards Feature Suite', () => {
  test('briefing memo starts collapsed and toggles with touch and keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 850 })
    await page.goto('/test-harness/fitness-mobile')
    const memo = page.getByRole('group', { name: 'Coach Gordon briefing memo', exact: true })
    const summary = memo.locator('summary')
    const text = memo.getByText('Follow the prescribed tempo and prioritize controlled movement throughout your training session.', { exact: true })
    await expect(summary).toBeVisible()
    await expect(text).not.toBeVisible()
    expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await summary.click()
    await expect(text).toBeVisible()
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(text).not.toBeVisible()
    await page.keyboard.press('Space')
    await expect(text).toBeVisible()
  })

  test('failed saves retain a pending set and successful retry reconciles it', async ({ page }) => {
    let fail = true
    await page.route('**/api/workouts/log-set', async route => {
      const payload = route.request().postDataJSON()
      if (fail) {
        await route.fulfill({ status: 500, json: { error: 'Simulated save failure' } })
      } else {
        await route.fulfill({ json: { setLog: {
          id: 'uat-retried', exercise_name: payload.exerciseName,
          session_date: payload.sessionDate, set_number: payload.setNumber,
          reps: payload.reps, weight_kg: payload.weightKg, notes: payload.notes,
        } } })
      }
    })
    await page.goto('/test-harness/fitness-mobile')
    const card = page.locator('#exercise-item-1-0')
    await card.getByRole('textbox', { name: 'Weight in pounds' }).fill('95')
    await card.getByRole('button', { name: 'Log set & start rest', exact: true }).click()
    await expect(card.getByRole('button', { name: /Set 1:.*saved on device, sync pending/ })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Active Rest Timer' })).toHaveCount(1)
    await expect(card.getByText('Rest Timer', { exact: true })).toHaveCount(0)
    fail = false
    await page.getByRole('button', { name: 'Sync Now', exact: true }).click()
    await expect(card.getByRole('button', { name: /Set 1:.*saved to account/ })).toBeVisible()
    await expect(card.getByRole('button', { name: /Set 1:.*sync pending/ })).toHaveCount(0)
    await expect(card.getByText('1/3 completed', { exact: true })).toBeVisible()
  })

  test('requires an explicit load and accepts intentional bodyweight without duplicate progress', async ({ page }) => {
    const payloads: Record<string, unknown>[] = []
    await page.route('**/api/workouts/log-set', async route => {
      const payload = route.request().postDataJSON()
      payloads.push(payload)
      await route.fulfill({ json: { setLog: {
        id: 'uat-bodyweight',
        exercise_name: payload.exerciseName,
        session_date: payload.sessionDate,
        set_number: payload.setNumber,
        reps: payload.reps,
        is_warmup: payload.isWarmup,
        notes: payload.notes,
      } } })
    })
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/test-harness/fitness-mobile')
    const card = page.locator('#exercise-item-1-0')
    const weight = card.getByRole('textbox', { name: /Weight in pounds/i })
    const log = card.getByRole('button', { name: 'Log set & start rest', exact: true })
    await expect(weight).toHaveValue('')
    await expect(weight).toHaveAttribute('placeholder', '—')
    await expect(card.getByText('0 = no added load')).toBeVisible()
    await expect(card.getByText('0/3 completed', { exact: true })).toHaveCount(1)
    await expect(card.getByText('0/3 sets', { exact: true })).toHaveCount(0)
    await log.click()
    expect(await weight.evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true)
    expect(payloads).toHaveLength(0)
    await weight.fill('.')
    await log.click()
    expect(await weight.evaluate(input => (input as HTMLInputElement).validity.patternMismatch)).toBe(true)
    expect(payloads).toHaveLength(0)
    await weight.fill('0')
    await log.click()
    await expect(card.getByText('1/3 completed', { exact: true })).toBeVisible()
    expect(payloads).toHaveLength(1)
  })

  test('renders workout day, exercise cards, and movement standard banners', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')

    // Verify workout day focus header
    await expect(page.getByText(/Day 1: Chest, Back & Core Stabilization/i)).toBeVisible()

    // Verify 3 planned exercises
    await expect(page.getByText('Barbell Flat Bench Press').first()).toBeVisible()
    await expect(page.getByText('Incline Dumbbell Bench Press').first()).toBeVisible()
    await expect(page.getByText('Cable Chest Fly').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Schedule', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Plates', exact: true })).toHaveCount(0)
    await expect(page.getByTestId('workout-program-header').getByRole('button', { name: 'Coach', exact: true })).toHaveCount(0)

    // Target the first active exercise item (which is auto-expanded by default)
    const benchItem = page.locator('#exercise-item-1-0')
    await expect(benchItem).toBeVisible()

    // Verify 16:9 NASM demonstration video banner and target metrics
    await expect(benchItem.getByRole('button', { name: /Watch form demonstration/i })).toBeVisible()
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
    const logSetBtn = benchItem.getByRole('button', { name: 'Log set & start rest', exact: true })
    await expect(logSetBtn).toBeVisible()
    await expect(weightInput).toHaveValue('185')
    await expect(repsInput).toHaveValue('10')
    await logSetBtn.click()

    // Matching current values need no duplicate restore row.
    const prefillBtn = benchItem.getByRole('button', { name: /Match Set 1: 185 lb × 10 reps/i })
    await expect(prefillBtn).toHaveCount(0)
    await weightInput.fill('180')
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
      await item.locator('summary').first().click()
      await item.getByRole('textbox', { name: /Weight in pounds/i }).fill('50')
      await item.getByRole('button', { name: 'Log set & start rest', exact: true }).click()
    }
    await expect(page.getByRole('button', { name: 'Advance to Stage 3 Cardio' })).not.toBeVisible()

    for (let index = 0; index < 3; index++) {
      const item = page.locator(`#exercise-item-1-${index}`)
      const input = item.getByRole('textbox', { name: /Number of reps/i })
      if (!(await input.isVisible())) await item.locator('summary').first().click()
      await expect(item.getByRole('button', { name: /^Set 2:/ })).toHaveAttribute('aria-pressed', 'true')
      await item.getByRole('button', { name: 'Log set & start rest', exact: true }).click()
      await expect(item.getByRole('button', { name: /^Set 3:/ })).toHaveAttribute('aria-pressed', 'true')
      await item.getByRole('button', { name: 'Log set & start rest', exact: true }).click()
    }
    const advance = page.getByRole('button', { name: 'Advance to Stage 3 Cardio' })
    await expect(advance).toBeVisible()
    await advance.click()
    await expect(page.getByText('Quick Cardio Log', { exact: true })).toBeVisible()
  })

  test('keeps Phase 1 single-set rules and exposes one workout stage at a time', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')
    await expect(page.getByText('Single Sets Only', { exact: true })).toBeVisible()
    await expect(page.locator('.in-workout-jump-rail')).toHaveCount(0)
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

  test('coach notes sit before stages in a compact keyboard-accessible disclosure', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/test-harness/fitness-mobile')
    const notes = page.getByTestId('workout-coach-notes')
    const summary = notes.locator('summary')
    await expect(summary).toHaveText('Coach notes')
    await expect(notes).not.toHaveAttribute('open', '')
    const notesBox = await notes.boundingBox()
    const stagesBox = await page.getByRole('group', { name: 'Workout stages' }).boundingBox()
    expect(notesBox && stagesBox && notesBox.y + notesBox.height <= stagesBox.y).toBe(true)
    expect(notesBox?.height).toBeLessThanOrEqual(64)
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(notes).toHaveAttribute('open', '')
    await expect(notes.getByRole('list')).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(notes).not.toHaveAttribute('open', '')
  })

  test('mobile exercise cards expose exertion without a metronome or tools drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/test-harness/fitness-mobile')
    const card = page.locator('#exercise-item-1-0')
    await expect(card.getByTestId('exercise-set-details')).toBeVisible()
    const compactBox = await card.boundingBox()
    expect(compactBox?.height).toBeLessThanOrEqual(560)
    await expect(card.locator('[aria-label="Plate Loading and Weight Presets"]')).toHaveCount(0)
    const warmup = card.getByRole('checkbox', { name: 'Mark as warm-up set' })
    const warmupBox = await warmup.boundingBox()
    expect(warmupBox?.width).toBe(16)
    expect(warmupBox?.height).toBe(16)
    await warmup.check()
    await expect(warmup).toBeChecked()
    await warmup.uncheck()
    const lastButton = card.locator('form button').last()
    await expect(lastButton).toHaveAttribute('type', 'submit')
    await expect(lastButton).toHaveText('Log set & start rest')
    await expect(page.getByTestId('workout-tool-bottom-sheet')).toHaveCount(0)
    await expect(card.getByTestId('unified-exercise-tool-strip')).toHaveCount(0)
    await expect(card.getByRole('textbox', { name: 'Rate of perceived exertion (1-10)' })).toBeVisible()
    await expect(card.getByRole('textbox', { name: 'Reps in reserve (0-6)' })).toBeVisible()
    await expect(card.getByRole('textbox', { name: 'Rate of perceived exertion (1-10)' })).toHaveValue('')
    await expect(card.getByRole('textbox', { name: 'Reps in reserve (0-6)' })).toHaveValue('')
    const rpeBox = await card.getByRole('textbox', { name: 'Rate of perceived exertion (1-10)' }).boundingBox()
    const rirBox = await card.getByRole('textbox', { name: 'Reps in reserve (0-6)' }).boundingBox()
    expect(rpeBox && rirBox && Math.abs(rpeBox.y - rirBox.y) <= 1).toBe(true)
    await expect(card.getByRole('textbox', { name: 'Set number', exact: true })).not.toBeVisible()
    await card.locator('summary').filter({ hasText: 'Edit set details' }).click()
    await expect(card.getByRole('textbox', { name: 'Set number', exact: true })).toBeVisible()
    await card.getByRole('textbox', { name: 'Set number', exact: true }).fill('2')
    await expect(card.getByRole('textbox', { name: 'Set number', exact: true })).toHaveValue('2')
    await card.locator('summary').filter({ hasText: 'Edit set details' }).click()
    await card.getByRole('button', { name: /Set 1: not logged/ }).click()
    await expect(card.getByRole('button', { name: /^Set 1:/ })).toHaveAttribute('aria-pressed', 'true')
    await card.getByRole('button', { name: '+ Add Set', exact: true }).click()
    await expect(card.getByRole('button', { name: /^Set 4:/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(card.getByRole('button', { name: /Metronome|Start Tempo/i })).toHaveCount(0)
    await expect(card.getByText(/Bar Velocity|VBT Active|Kinetic Power/i)).toHaveCount(0)
  })

  test('inline RPE and RIR are saved with the set without workout utility buttons', async ({ page }) => {
    await page.route('**/api/workouts/log-set', route => {
      const payload = route.request().postDataJSON()
      return route.fulfill({ json: { setLog: {
        id: 'uat-exertion',
        exercise_name: payload.exerciseName,
        session_date: payload.sessionDate,
        set_number: payload.setNumber,
        reps: payload.reps,
        weight_kg: payload.weightKg,
        rpe: payload.rpe,
        rir: payload.rir,
        is_warmup: payload.isWarmup,
        notes: payload.notes,
      } } })
    })
    await page.goto('/test-harness/fitness-mobile')
    const benchItem = page.locator('#exercise-item-1-0')
    await expect(benchItem).toBeVisible()
    await benchItem.getByRole('textbox', { name: /Weight in pounds/i }).fill('95')
    await benchItem.getByRole('textbox', { name: 'Rate of perceived exertion (1-10)' }).fill('8')
    await benchItem.getByRole('textbox', { name: 'Reps in reserve (0-6)' }).fill('2')
    await benchItem.locator('summary').filter({ hasText: 'Edit set details' }).click()
    await benchItem.getByRole('textbox', { name: /Movement tempo/ }).fill('2/0/2')
    await benchItem.getByRole('textbox', { name: 'Rest time in seconds' }).fill('75')
    await benchItem.locator('summary').filter({ hasText: 'Edit set details' }).click()
    await benchItem.locator('summary').filter({ hasText: 'Add note' }).click()
    await benchItem.getByPlaceholder('Form cues, band tension, or notes').fill('Controlled reps')
    await benchItem.locator('summary').filter({ hasText: 'Add note' }).click()
    const request = page.waitForRequest('**/api/workouts/log-set')
    await benchItem.getByRole('button', { name: 'Log set & start rest', exact: true }).click()
    const payload = (await request).postDataJSON()
    expect(payload).toMatchObject({ rpe: 8, rir: 2, tempo: '2/0/2', restSeconds: 75 })
    expect(payload.notes).toContain('Controlled reps')
    await benchItem.locator('summary').filter({ hasText: /View history/ }).click()
    await expect(benchItem.getByTestId('horizontal-sets-carousel')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Plates', exact: true })).toHaveCount(0)
  })

  test('settings exposes the program schedule and selected workout days open in training', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/test-harness/fitness-mobile?view=settings&scenario=schedule')
    await expect(page.getByRole('button', { name: 'Workout Schedule', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Workout Schedule', exact: true })).toBeVisible()
    const scheduledWorkout = page.getByRole('button', { name: /Day 2: Schedule navigation check/ })
    await expect(scheduledWorkout).toBeVisible()
    // Intercept navigation rather than requiring a live authenticated client.
    const navigation = page.waitForRequest(request => new URL(request.url()).pathname === '/dashboard/fitness')
    await page.route('**/dashboard/fitness?*', route => route.abort())
    await scheduledWorkout.click()
    const destination = new URL((await navigation).url())
    expect(destination.searchParams.get('workspace')).toBe('train')
    expect(destination.searchParams.get('day')).toBe('2')
  })

  test('a schedule deep link opens the requested workout day', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile?scenario=schedule&workspace=train&day=2')
    await expect(page.getByText('Day 2: Schedule navigation check', { exact: true })).toBeVisible()
    await expect(page.locator('#exercise-item-2-0')).toBeVisible()
  })
})
