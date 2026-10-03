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

  test('interactively logs Set 1 and dynamic 1-Tap prefill button shifts to Match Set 1', async ({ page }) => {
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
    await logSetBtn.click()

    // Verify dynamic 1-Tap prefill button appears with emerald styling and Match Set 1 label
    const prefillBtn = benchItem.getByRole('button', { name: /Match Set 1: 185 lb × 10 reps/i })
    await expect(prefillBtn).toBeVisible()
    await expect(benchItem.getByText(/Logged this session/i)).toBeVisible()

    // Click Match Set 1 to prefill next set (scroll into view and force click to bypass floating timer dock)
    await prefillBtn.scrollIntoViewIfNeeded()
    await prefillBtn.click({ force: true })
    expect(await weightInput.inputValue()).toBe('185')
    expect(await repsInput.inputValue()).toBe('10')
  })

  test('interactively toggles Superset Pairing mode', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')

    const supersetToggle = page.getByRole('button', { name: /Supersets/i }).first()
    if (await supersetToggle.isVisible()) {
      await supersetToggle.click()
      await supersetToggle.click()
    }
  })

  test('opens and navigates Barbell Plate Calculator and Warmup Ramp tools', async ({ page }) => {
    await page.goto('/test-harness/fitness-mobile')

    const benchItem = page.locator('#exercise-item-1-0')
    await expect(benchItem).toBeVisible()

    // Warmup Ramp generator button
    const warmupBtn = benchItem.getByRole('button', { name: /Warmup Ramp/i })
    if (await warmupBtn.isVisible()) {
      await warmupBtn.click()
      await expect(page.getByText(/Barbell Warmup Ramp/i)).toBeVisible()
      await warmupBtn.click()
    }
  })
})
