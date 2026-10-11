import { expect, test } from '@playwright/test'

function monday() {
  const date = new Date()
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day))
  return date.toISOString().slice(0, 10)
}

const checkin = {
  id: 'coach-uat-checkin', week_start: monday(), sleep_quality: 4,
  stress_level: 3, soreness_level: 5, energy_level: 4, weight_kg: 80,
  notes: 'Training felt good.', coach_feedback: 'Keep the controlled tempo this week.',
  coach_rating_adjustment: null,
}

for (const width of [320, 393, 768]) {
  test(`Coach tab controls and disclosures fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 })
    await page.route('**/api/fitness/checkin', route => route.fulfill({ json: { checkins: [checkin] } }))
    await page.goto('/test-harness/fitness-mobile?workspace=coach')
    const coach = page.locator('.fitness-coach-view')
    await expect(coach.getByRole('heading', { name: 'Your coach' })).toBeVisible()
    await expect(coach.getByRole('heading', { name: 'Weekly Check-In' })).toBeVisible()
    await expect(coach.getByText(checkin.coach_feedback)).toBeVisible()
    await expect(coach.getByRole('group', { name: 'Sleep Quality (1-5)' })).toBeVisible()
    await expect(coach.getByRole('link', { name: 'Message coach' })).toHaveAttribute('href', '/dashboard/messages')
    await expect(coach.getByRole('link', { name: 'Book a session' })).toHaveAttribute('href', '/dashboard/book')
    const health = coach.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Health & training details on file' }) })
    const photos = coach.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Progress photos & body composition' }) })
    await expect(health).not.toHaveAttribute('open', '')
    await expect(photos).not.toHaveAttribute('open', '')
    await health.locator('summary').click()
    await photos.locator('summary').click()
    await expect(coach.getByText('This summary is not medical clearance.', { exact: false })).toBeVisible()
    await expect(coach.getByRole('link', { name: 'Update Health Intake' })).toHaveAttribute('href', '/dashboard/settings')
    for (const control of await coach.locator('button, input, textarea, summary, a').all()) {
      if (!(await control.isVisible())) continue
      const box = (await control.boundingBox())!
      expect(box.x, await control.textContent() ?? '').toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, await control.textContent() ?? '').toBeLessThanOrEqual(width + 0.01)
      expect(box.height, await control.textContent() ?? '').toBeGreaterThanOrEqual(44)
    }
    await coach.getByRole('textbox', { name: 'Progress photo notes' }).fill('Keep this draft')
    await photos.locator('summary').click()
    await photos.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(coach.getByRole('textbox', { name: 'Progress photo notes' })).toHaveValue('Keep this draft')
  })
}

test('Check-in updates retain feedback, validate weight and preserve entries after a network failure', async ({ page }) => {
  let fail = true
  let body: Record<string, unknown> = {}
  await page.route('**/api/fitness/checkin', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { checkins: [checkin] } })
    body = route.request().postDataJSON()
    if (fail) return route.abort('failed')
    return route.fulfill({ json: { ...checkin, ...body } })
  })
  await page.goto('/test-harness/fitness-mobile?workspace=coach')
  const coach = page.locator('.fitness-coach-view')
  await expect(coach.getByLabel(/Current Weight/)).toHaveValue('176.4')
  await coach.getByLabel(/Current Weight/).fill('0')
  await coach.getByRole('button', { name: 'Update check-in' }).click()
  await expect(coach.getByRole('alert')).toContainText('positive weight')
  await coach.getByLabel(/Current Weight/).fill('185')
  await coach.getByLabel(/Notes for your coach/).fill('New update')
  const sleep = coach.getByRole('button', { name: 'Good sleep quality (Sleep Quality)', exact: true })
  await expect(sleep).toHaveAttribute('aria-pressed', 'true')
  await sleep.click()
  await expect(sleep).toHaveAttribute('aria-pressed', 'false')
  await coach.getByRole('button', { name: 'Update check-in' }).click()
  await expect(coach.getByRole('alert')).toBeVisible()
  await expect(coach.getByRole('button', { name: 'Update check-in' })).toBeEnabled()
  await expect(coach.getByLabel(/Notes for your coach/)).toHaveValue('New update')
  expect(body.weight_kg).toBe(83.91)
  expect(body.sleep_quality).toBeNull()
  fail = false
  await coach.getByRole('button', { name: 'Update check-in' }).click()
  await expect(coach.getByRole('status')).toContainText('Check-in saved')
  await expect(coach.getByText(checkin.coach_feedback)).toBeVisible()
})

test('Failed load can retry and metric entries are submitted without conversion', async ({ page }) => {
  let fail = true
  let body: Record<string, unknown> = {}
  await page.route('**/api/fitness/checkin', route => {
    if (route.request().method() === 'GET') return route.fulfill({
      status: fail ? 500 : 200, json: fail ? { error: 'Failed to load check-ins' } : { checkins: [] },
    })
    body = route.request().postDataJSON()
    return route.fulfill({ json: { id: 'new-checkin', ...body } })
  })
  await page.goto('/test-harness/fitness-mobile?workspace=coach&scenario=lab-bodycomp')
  const coach = page.locator('.fitness-coach-view')
  await expect(coach.getByRole('alert')).toContainText('Could not load')
  await expect(coach.getByRole('button', { name: 'Submit check-in' })).toHaveCount(0)
  fail = false
  await coach.getByRole('button', { name: 'Retry check-in' }).click()
  await coach.getByLabel(/Current Weight \(kg\)/).fill('80')
  await coach.getByRole('button', { name: 'Submit check-in' }).click()
  await expect(coach.getByRole('status')).toContainText('Check-in saved')
  expect(body.weight_kg).toBe(80)
  expect(body.notes).toBeNull()
})

test('Signed-out Coach tab shows sign-in guidance without a red issue badge', async ({ page }) => {
  await page.route('**/api/fitness/checkin', route => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }))
  await page.goto('/test-harness/fitness-mobile?workspace=coach')
  await expect(page.locator('.fitness-coach-view').getByRole('alert')).toContainText('Please sign in')
  await expect(page.getByRole('button', { name: 'Open issues overlay' })).toHaveCount(0)
})

for (const failure of ['401', '500', 'invalid-json']) {
  test(`Check-in ${failure} save failure releases controls and retains the draft`, async ({ page }) => {
    await page.route('**/api/fitness/checkin', route => {
      if (route.request().method() === 'GET') return route.fulfill({ json: { checkins: [] } })
      return failure === 'invalid-json'
        ? route.fulfill({ status: 200, contentType: 'application/json', body: 'invalid' })
        : route.fulfill({ status: Number(failure), json: { error: 'Unable to save' } })
    })
    await page.goto('/test-harness/fitness-mobile?workspace=coach')
    const coach = page.locator('.fitness-coach-view')
    await coach.getByLabel(/Notes for your coach/).fill('Keep my draft')
    await coach.getByRole('button', { name: 'Submit check-in' }).click()
    await expect(coach.getByRole('alert')).toBeVisible()
    await expect(coach.getByRole('button', { name: 'Submit check-in' })).toBeEnabled()
    await expect(coach.getByLabel(/Notes for your coach/)).toHaveValue('Keep my draft')
    await expect(coach.getByRole('status')).toHaveCount(0)
    if (failure === '401') {
      await expect(coach.getByRole('alert')).toContainText('Please sign in')
      await expect(page.getByRole('button', { name: 'Open issues overlay' })).toHaveCount(0)
    }
  })
}

test('Coach photo section opens and closes the scanner and preserves a failed upload', async ({ page }) => {
  await page.route('**/api/fitness/checkin', route => route.fulfill({ json: { checkins: [] } }))
  await page.route('**/api/fitness/progress-photos', route => route.fulfill({ status: 500, json: { error: 'Upload failed. Please retry.' } }))
  await page.goto('/test-harness/fitness-mobile?workspace=coach')
  const coach = page.locator('.fitness-coach-view')
  await coach.locator('summary').filter({ hasText: 'Progress photos & body composition' }).click()
  await coach.getByRole('button', { name: /Launch AI DEXA Scanner/ }).click()
  await expect(page.getByRole('heading', { name: 'AI DEXA-Vision Body Composition Estimator' })).toBeVisible()
  await page.getByRole('button', { name: 'Close modal' }).click()
  await expect(page.getByRole('heading', { name: 'AI DEXA-Vision Body Composition Estimator' })).not.toBeVisible()
  await coach.getByLabel('Select progress photo').setInputFiles({
    name: 'uat.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jHOsAAAAASUVORK5CYII=', 'base64'),
  })
  await coach.getByRole('textbox', { name: 'Progress photo notes' }).fill('Photo draft')
  await coach.getByRole('button', { name: 'Save Progress Photo' }).click()
  await expect(coach.getByText('Upload failed. Please retry.')).toBeVisible()
  await expect(coach.getByRole('button', { name: 'Save Progress Photo' })).toBeEnabled()
  await expect(coach.getByRole('textbox', { name: 'Progress photo notes' })).toHaveValue('Photo draft')
})
