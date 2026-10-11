import { expect, test } from '@playwright/test'

const goal = {
  id: 'uat-goal', title: 'Body weight target', category: 'body_composition',
  baseline_value: 90, target_value: 80, current_value: 92, target_unit: 'kg',
  target_date: null, is_achieved: false, notes: null,
}
const record = {
  exerciseName: 'Barbell Flat Bench Press', maxWeightKg: 60, maxWeightReps: 10,
  maxWeightDate: '2026-10-10', maxReps: 12, maxRepsWeight: 50,
  maxRepsDate: '2026-10-09', totalSets: 24, firstLoggedDate: '2026-10-01', latestDate: '2026-10-12',
}

for (const width of [320, 393, 768]) {
  test(`Progress sections and forms fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 })
    await page.route('**/api/fitness/personal-records', route => route.fulfill({ json: { records: [record] } }))
    await page.route('**/api/fitness/goals', route => route.fulfill({ json: { goals: [goal] } }))
    await page.goto('/test-harness/fitness-mobile?scenario=progress&workspace=progress')
    const progress = page.locator('.fitness-progress-view')
    await expect(progress.getByRole('heading', { name: 'Your progress' })).toBeVisible()
    const stats = progress.locator('.fitness-stats-grid > div')
    const firstStat = (await stats.nth(0).boundingBox())!
    const secondStat = (await stats.nth(1).boundingBox())!
    expect(firstStat.y).toBe(secondStat.y)
    await expect(progress.locator('details[open]')).toHaveCount(0)
    await progress.getByRole('combobox', { name: 'View progress trend' }).selectOption('effort')
    await expect(progress.getByRole('img', { name: 'Average effort (RPE)' })).toBeVisible()
    await expect(progress.locator('svg desc')).not.toContainText('10/01:')
    await progress.locator('summary').filter({ hasText: 'Workout history' }).click()
    const history = progress.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Workout history' }) })
    await expect(history.getByText('Workout 12', { exact: true })).toBeVisible()
    await expect(history.getByText('Workout 1', { exact: true })).toHaveCount(0)
    await history.getByRole('button', { name: 'Show more workouts' }).click()
    await expect(history.getByText('Workout 1', { exact: true })).toBeVisible()
    await progress.locator('summary').filter({ hasText: 'Set history' }).click()
    await expect(progress.getByText('30s', { exact: true })).toBeVisible()
    await progress.locator('summary').filter({ hasText: /^Personal records$/ }).click()
    await progress.getByRole('button', { name: /Barbell Flat Bench Press/ }).click()
    await expect(progress.getByText('Heavy Lift PR', { exact: true })).toBeVisible()
    await progress.locator('summary').filter({ hasText: /^Goals$/ }).click()
    await expect(progress.getByText('0% of the way there', { exact: true })).toBeVisible()
    await progress.getByRole('button', { name: /New Goal/ }).click()
    await progress.getByLabel('Title *', { exact: true }).fill('UAT strength target')
    await progress.locator('summary').filter({ hasText: 'Progress photos' }).click()
    await progress.locator('summary').filter({ hasText: 'Training consistency' }).click()
    await expect(progress.getByText('1 planned sessions / week')).toBeVisible()
    for (const control of await progress.locator('input, select, textarea, button, summary').all()) {
      if (!(await control.isVisible())) continue
      const box = (await control.boundingBox())!
      expect(box.x + box.width, (await control.textContent()) ?? '').toBeLessThanOrEqual(width + 0.01)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(Number(box.height.toFixed(3))).toBeGreaterThanOrEqual(44)
    }
    const summary = progress.locator('summary').filter({ hasText: /^Goals$/ })
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(progress.getByRole('button', { name: /Cancel/ })).not.toBeVisible()
    await page.keyboard.press('Space')
    await expect(progress.getByLabel('Title *', { exact: true })).toHaveValue('UAT strength target')
  })
}

test('Progress empty states and failed requests can retry', async ({ page }) => {
  let fail = true
  await page.route('**/api/fitness/personal-records', route => route.fulfill({ status: fail ? 500 : 200, json: { records: [] } }))
  await page.route('**/api/fitness/goals', route => route.fulfill({ status: fail ? 500 : 200, json: { goals: [] } }))
  await page.goto('/test-harness/fitness-mobile?workspace=progress')
  const progress = page.locator('.fitness-progress-view')
  await expect(progress.getByText('No workout data recorded yet.')).toBeVisible()
  await progress.locator('summary').filter({ hasText: /^Personal records$/ }).click()
  await progress.locator('summary').filter({ hasText: /^Goals$/ }).click()
  await expect(progress.getByRole('button', { name: 'Retry goals' })).toBeVisible()
  fail = false
  await progress.getByRole('button', { name: 'Retry goals' }).click()
  await progress.getByRole('button', { name: 'Retry personal records' }).click()
  await expect(progress.getByRole('alert')).toHaveCount(0)
})

test('Failed goal deletion retains data and failed photo upload releases its button', async ({ page }) => {
  await page.route('**/api/fitness/personal-records', route => route.fulfill({ json: { records: [] } }))
  await page.route('**/api/fitness/goals', route => route.fulfill({ json: { goals: [goal] } }))
  await page.route('**/api/fitness/goals/uat-goal', route => route.fulfill({ status: 500, json: { error: 'Unavailable' } }))
  await page.route('**/api/fitness/progress-photos', route => route.abort('failed'))
  await page.goto('/test-harness/fitness-mobile?workspace=progress')
  const progress = page.locator('.fitness-progress-view')
  await progress.locator('summary').filter({ hasText: /^Goals$/ }).click()
  page.on('dialog', dialog => dialog.accept())
  await progress.getByRole('button', { name: 'Delete goal' }).click()
  await expect(progress.getByText('Could not delete goal. Please try again.')).toBeVisible()
  await expect(progress.getByText(goal.title)).toBeVisible()
  await progress.locator('summary').filter({ hasText: 'Progress photos' }).click()
  await progress.getByLabel('Select progress photo').setInputFiles({ name: 'uat.png', mimeType: 'image/png', buffer: Buffer.from('uat') })
  await progress.getByRole('button', { name: 'Save Progress Photo' }).click()
  await expect(progress.getByRole('button', { name: 'Save Progress Photo' })).toBeEnabled()
  await expect(progress.getByText(/Failed to fetch/)).toBeVisible()
})

test('Goals can be created and decreasing targets can be updated', async ({ page }) => {
  let currentGoal = { ...goal }
  await page.route('**/api/fitness/personal-records', route => route.fulfill({ json: { records: [] } }))
  await page.route('**/api/fitness/goals', route => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON()
      return route.fulfill({ json: { goal: { ...goal, id: 'created', ...payload } } })
    }
    return route.fulfill({ json: { goals: [currentGoal] } })
  })
  await page.route('**/api/fitness/goals/uat-goal', route => {
    const payload = route.request().postDataJSON()
    currentGoal = { ...currentGoal, current_value: Number(payload.current_value) }
    return route.fulfill({ json: { goal: currentGoal } })
  })
  await page.goto('/test-harness/fitness-mobile?workspace=progress')
  const progress = page.locator('.fitness-progress-view')
  await progress.locator('summary').filter({ hasText: /^Goals$/ }).click()
  await progress.getByRole('button', { name: 'Log current value' }).click()
  await progress.getByLabel('Current goal value').fill('85')
  await progress.getByRole('button', { name: 'Update', exact: true }).click()
  await expect(progress.getByText('50% of the way there', { exact: true })).toBeVisible()
  await progress.getByRole('button', { name: /New Goal/ }).click()
  await progress.getByLabel('Title *', { exact: true }).fill('Improve endurance')
  await progress.getByRole('button', { name: /Save Goal/ }).click()
  await expect(progress.getByText('Improve endurance', { exact: true })).toBeVisible()
  await expect(progress.getByLabel('Title *', { exact: true })).not.toBeVisible()
})
