import { expect, test } from '@playwright/test'

test.describe('Launch funnel flow', () => {
  test('interactively completes fit quiz steps and submits application via real DOM inputs', async ({ page }) => {
    let capturedPayload: {
      email?: string
      firstName?: string
      goal?: string
      timeline?: string
      trainingDays?: string
      supportLevel?: string
      primaryObstacle?: string
      coachingHistory?: string
      budgetBand?: string
      readiness?: string
      recommendedTier?: string
    } | null = null

    await page.route('**/api/apply', async route => {
      const req = route.request()
      capturedPayload = req.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.goto('/apply')
    await expect(page).toHaveURL(/\/apply$/)

    // Heading verification
    await expect(page.getByRole('heading', { name: /Biomechanical Profiling|Advisory Tier Alignment/i })).toBeVisible()

    // Step 1: Goal
    await expect(page.getByRole('heading', { name: /What is your primary athletic & physiological objective\?/i })).toBeVisible()
    await page.getByRole('button', { name: /Lean Muscle Hypertrophy/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 2: Timeline
    await expect(page.getByRole('heading', { name: /What is your required transformation timeline\?/i })).toBeVisible()
    await page.getByRole('button', { name: /1–3 months|1-3 months/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 3: Training Days
    await expect(page.getByRole('heading', { name: /How many days per week can you realistically train\?/i })).toBeVisible()
    await page.getByRole('button', { name: /4 days/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 4: Support Level
    await expect(page.getByRole('heading', { name: /Which advisory direction tier best matches your workflow\?/i })).toBeVisible()
    await page.getByRole('button', { name: /Hybrid direction/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 5: Primary Obstacle
    await expect(page.getByRole('heading', { name: /What has been your primary performance bottleneck\?/i })).toBeVisible()
    await page.getByRole('button', { name: /accountability/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 6: Coaching History
    await expect(page.getByRole('heading', { name: /What is your background with professional coaching\?/i })).toBeVisible()
    await page.getByRole('button', { name: /No, seeking first-time/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 7: Budget Band
    await expect(page.getByRole('heading', { name: /What is your intended monthly advisory investment\?/i })).toBeVisible()
    await page.getByRole('button', { name: /Hybrid Concierge/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    // Step 8: Readiness
    await expect(page.getByRole('heading', { name: /When are you prepared to initiate your onboarding\?/i })).toBeVisible()
    await page.getByRole('button', { name: /Within the next 14 days/i }).click()
    await page.getByRole('button', { name: /see recommended tier/i }).click()

    // Recommendation card visible
    await expect(page.getByText(/recommended advisory pathway/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /hybrid concierge/i })).toBeVisible()

    // Fill contact details in DOM inputs
    await page.locator('#apply-first-name').fill('Alexander')
    await page.locator('#apply-email').fill('alexander@example.com')

    // Click authentic submit button
    const submitBtn = page.getByRole('button', { name: /submit application/i })
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // Verify API interception and payload contents
    expect(capturedPayload).toMatchObject({
      email: 'alexander@example.com',
      firstName: 'Alexander',
      goal: 'build_muscle',
      timeline: '1_to_3_months',
      trainingDays: '4',
      supportLevel: 'hybrid_monthly_calls',
      primaryObstacle: 'inconsistent_accountability',
      coachingHistory: 'no_first_time',
      budgetBand: '200_400',
      readiness: 'within_2_weeks',
      recommendedTier: 'hybrid',
    })

    // Verify UI confirmation message
    await expect(page.getByText(/application received/i)).toBeVisible()
  })

  test('supports back step navigation across questions', async ({ page }) => {
    await page.goto('/apply')
    await expect(page.getByRole('heading', { name: /What is your primary athletic & physiological objective\?/i })).toBeVisible()

    await page.getByRole('button', { name: /visceral fat loss|body recomposition/i }).click()
    await page.getByRole('button', { name: /continue/i }).click()

    await expect(page.getByRole('heading', { name: /What is your required transformation timeline\?/i })).toBeVisible()

    // Click Previous Question button
    await page.getByRole('button', { name: /back/i }).click()
    await expect(page.getByRole('heading', { name: /What is your primary athletic & physiological objective\?/i })).toBeVisible()
  })
})
