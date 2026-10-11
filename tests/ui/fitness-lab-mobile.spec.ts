import { expect, test, type Locator } from '@playwright/test'
import { generate12WeekMacrocycle } from '../../lib/periodization-roadmap'

const tools = ['readiness', 'bodycomp', 'roadmap', 'nutrition', 'travel', 'assessment', 'sleep', 'performance', 'calculator', 'video']
const features = {
  nutrition: { active: true, expiresAt: null, usesRemaining: null },
  travel: { active: true, expiresAt: null, usesRemaining: null },
  'video-review': { active: false, expiresAt: null, usesRemaining: 0 },
}

async function chooseTool(lab: Locator, tool: string) {
  const picker = lab.getByRole('button', { name: /^Choose a tool:/ })
  await picker.click()
  await lab.getByRole('group', { name: 'Fitness Lab tools' }).locator(`button[data-tool="${tool}"]`).click()
  await expect(picker).toHaveAttribute('aria-expanded', 'false')
}

async function expectControlsToFit(lab: Locator, width: number) {
  for (const control of await lab.locator('button, input, select, textarea, summary, a').all()) {
    if (!(await control.isVisible())) continue
    const box = (await control.boundingBox())!
    expect(box.x, await control.textContent() ?? '').toBeGreaterThanOrEqual(0)
    expect(box.x + box.width, await control.textContent() ?? '').toBeLessThanOrEqual(width + 0.01)
    expect(Number(box.height.toFixed(3)), await control.textContent() ?? '').toBeGreaterThanOrEqual(44)
  }
}

for (const width of [320, 393, 768]) {
  for (const tool of tools) {
    test(`${tool} lab tool fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 })
      await page.route('**/api/account/entitlements', route => route.fulfill({ json: { features } }))
      await page.goto('/test-harness/fitness-mobile?workspace=readiness')
      const lab = page.locator('.fitness-lab-view')
      const picker = lab.getByRole('button', { name: /^Choose a tool:/ })
      await picker.click()
      const options = lab.getByRole('group', { name: 'Fitness Lab tools' })
      await expect(options.getByRole('button')).toHaveCount(10)
      const menuBox = (await options.boundingBox())!
      const appBox = (await lab.boundingBox())!
      expect(menuBox.x).toBeGreaterThanOrEqual(appBox.x)
      expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(appBox.x + appBox.width + 0.01)
      expect(menuBox.height).toBeLessThanOrEqual(320)
      await expectControlsToFit(lab, width)
      await options.locator(`button[data-tool="${tool}"]`).click()
      await expect(picker).toHaveAttribute('aria-expanded', 'false')
      await expect(page).toHaveURL(new RegExp(`workspace=${tool}`))
      await expect(lab.getByRole('heading', { name: 'Fitness Lab', exact: true })).toBeVisible()
      if (tool === 'bodycomp') {
        await expect(lab.getByText(/No measurements are assumed/)).toBeVisible()
        await expect(lab.locator('.fitness-lab-stats')).toHaveCount(0)
        await lab.locator('summary').filter({ hasText: 'How these estimates work' }).click()
      } else if (tool === 'readiness') {
        await expect(lab.getByRole('heading', { name: /Muscle recovery map/ })).toBeVisible()
        await lab.getByRole('button', { name: 'Posterior (Back)' }).click()
        await expect(lab.getByRole('button', { name: 'Posterior (Back)' })).toHaveAttribute('aria-pressed', 'true')
        await expectControlsToFit(lab, width)
        await lab.getByRole('button', { name: 'Anterior (Front)' }).click()
        await expect(lab.getByRole('button', { name: 'Anterior (Front)' })).toHaveAttribute('aria-pressed', 'true')
        await lab.locator('summary').filter({ hasText: 'Recovery simulation & advanced inputs' }).click()
        await lab.getByRole('button', { name: '+24h', exact: true }).click()
        await expect(lab.getByRole('slider', { name: 'Recovery simulation hours ahead' })).toHaveValue('24')
        await expectControlsToFit(lab, width)
        await lab.getByRole('button', { name: /Daily check-in/ }).click()
        await lab.locator('summary').filter({ hasText: 'Daily check-in inputs' }).click()
        await expect(lab.getByRole('slider', { name: 'Sleep duration' })).toBeVisible()
        await expectControlsToFit(lab, width)
        for (const tab of ['Workload', 'Recovery week']) {
          await lab.getByRole('button', { name: tab, exact: true }).click()
          await expect(lab.getByRole('button', { name: tab, exact: true })).toHaveAttribute('aria-pressed', 'true')
          await expectControlsToFit(lab, width)
        }
      } else if (tool === 'calculator') {
        await lab.locator('summary').filter({ hasText: 'Training loads by phase' }).click()
      } else if (tool === 'nutrition') {
        await lab.locator('summary').filter({ hasText: 'Nutrition inputs' }).click()
      } else if (tool === 'performance') {
        await lab.locator('summary').filter({ hasText: 'Power training' }).click()
        await lab.locator('summary').filter({ hasText: 'Performance tests' }).click()
      } else if (tool === 'sleep') {
        await expect(lab.getByText(/Example sleep data/)).toBeVisible()
        await lab.getByRole('button', { name: 'Explore adjustments' }).click()
      } else if (tool === 'travel') {
        await expect(lab.getByRole('button', { name: 'Use this travel workout' })).toBeEnabled()
      }
      await expectControlsToFit(lab, width)
      await chooseTool(lab, tool === 'calculator' ? 'bodycomp' : 'calculator')
      await expect(page).toHaveURL(new RegExp(`workspace=${tool === 'calculator' ? 'bodycomp' : 'calculator'}`))
    })
  }
}

test('Lab access failures offer retry without showing a purchase prompt', async ({ page }) => {
  let fail = true
  await page.route('**/api/account/entitlements', route => route.fulfill({ status: fail ? 500 : 200, json: { features } }))
  await page.goto('/test-harness/fitness-mobile?workspace=nutrition')
  const lab = page.locator('.fitness-lab-view')
  await expect(lab.getByRole('alert')).toContainText('Could not check access')
  fail = false
  await lab.getByRole('button', { name: 'Retry access check' }).click()
  await expect(lab.locator('summary').filter({ hasText: 'Nutrition inputs' })).toBeVisible()
  await expect(lab.getByRole('alert')).toHaveCount(0)
})

test('In-app tool picker supports keyboard selection, Escape and focus dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 600 })
  await page.goto('/test-harness/fitness-mobile?workspace=readiness')
  const lab = page.locator('.fitness-lab-view')
  const picker = lab.getByRole('button', { name: /^Choose a tool:/ })
  const options = lab.getByRole('group', { name: 'Fitness Lab tools' })
  await picker.focus()
  await page.keyboard.press('Enter')
  await expect(picker).toHaveAttribute('aria-expanded', 'true')
  expect((await options.boundingBox())!.height).toBeLessThanOrEqual(240)
  await page.keyboard.press('Tab')
  await expect(options.locator('button[data-tool="readiness"]')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(options).not.toBeVisible()
  await expect(picker).toBeFocused()
  await page.keyboard.press('Space')
  await options.locator('button[data-tool="calculator"]').focus()
  await page.keyboard.press('Enter')
  await expect(picker).toContainText('Fitness calculators')
  await expect(picker).toBeFocused()
  await expect(options).not.toBeVisible()
  await picker.click()
  await expect(options.locator('button[data-tool="calculator"]')).toHaveAttribute('aria-pressed', 'true')
  await lab.getByRole('button', { name: /1RM & OPT/ }).focus()
  await expect(options).not.toBeVisible()
})

test('Ungated Lab tools skip access requests and expired sessions show sign-in guidance', async ({ page }) => {
  let accessRequests = 0
  const consoleErrors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await page.route('**/api/account/entitlements', route => {
    accessRequests += 1
    return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
  })
  await page.goto('/test-harness/fitness-mobile?workspace=readiness')
  const lab = page.locator('.fitness-lab-view')
  await expect(lab.getByRole('heading', { name: 'Muscle recovery map' })).toBeVisible()
  await chooseTool(lab, 'calculator')
  await expect(lab.getByRole('button', { name: /1RM & OPT/ })).toBeVisible()
  expect(accessRequests).toBe(0)
  await chooseTool(lab, 'nutrition')
  await expect(lab.getByRole('alert')).toContainText('Please sign in')
  expect(accessRequests).toBeGreaterThan(0)
  expect(consoleErrors.filter(message => message.includes('Add-on access check failed'))).toEqual([])
  await expect(lab.getByRole('button', { name: 'Retry access check' })).toBeVisible()
})

test('Recovery check-in disclosures retain input values with keyboard toggling', async ({ page }) => {
  await page.route('**/api/account/entitlements', route => route.fulfill({ json: { features } }))
  await page.goto('/test-harness/fitness-mobile?workspace=readiness&tab=gate')
  const lab = page.locator('.fitness-lab-view')
  const summary = lab.locator('summary').filter({ hasText: 'Daily check-in inputs' })
  await summary.focus()
  await page.keyboard.press('Enter')
  const slider = lab.getByRole('slider', { name: 'Sleep duration' })
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('7.6')
  await summary.focus()
  await page.keyboard.press('Space')
  await expect(slider).not.toBeVisible()
  await page.keyboard.press('Enter')
  await expect(slider).toHaveValue('7.6')
})

test('Calculator tabs retain values and travel uses the actual workout', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 })
  await page.route('**/api/account/entitlements', route => route.fulfill({ json: { features } }))
  await page.goto('/test-harness/fitness-mobile?workspace=calculator')
  const lab = page.locator('.fitness-lab-view')
  await lab.getByRole('slider', { name: 'Reps completed' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(lab.getByRole('slider', { name: 'Reps completed' })).toHaveValue('6')
  await lab.getByRole('button', { name: /Cardio &/ }).click()
  await lab.getByRole('button', { name: 'Rockport 1-Mile' }).click()
  await lab.getByLabel('One-mile walk time in minutes').fill('15')
  await lab.getByLabel('One-mile walk time in minutes').fill('')
  await expect(lab.getByText('Enter positive values in every test field to see your estimate.')).toBeVisible()
  await expect(lab.getByText('Estimated VO₂ Max', { exact: true })).toHaveCount(0)
  await lab.getByLabel('One-mile walk time in minutes').fill('15')
  await expect(lab.getByText('Estimated VO₂ Max', { exact: true })).toBeVisible()
  await lab.getByRole('button', { name: /Body Comp &/ }).click()
  await lab.getByLabel('Waist circumference in inches').fill('34')
  await lab.getByLabel('Hip circumference in inches').fill('0')
  await expect(lab.getByText('Enter positive waist and hip measurements to see your ratio.')).toBeVisible()
  await lab.getByLabel('Hip circumference in inches').fill('39')
  for (const control of await lab.locator('input, select, button').all()) {
    if (!(await control.isVisible())) continue
    const box = (await control.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    expect(Number(box.height.toFixed(3))).toBeGreaterThanOrEqual(44)
  }
  await lab.getByRole('button', { name: /1RM & OPT/ }).click()
  await expect(lab.getByRole('slider', { name: 'Reps completed' })).toHaveValue('6')
  await chooseTool(lab, 'travel')
  await expect(lab.getByText('3 Movements Recalibrated')).toBeVisible()
  await lab.getByRole('button', { name: 'Use this travel workout' }).click()
  await expect(lab.getByText(/Applied .* to your first workout day/)).toBeVisible()
})

test('Body composition shows measured metric values and opens its scanner', async ({ page }) => {
  await page.route('**/api/account/entitlements', route => route.fulfill({ json: { features } }))
  await page.goto('/test-harness/fitness-mobile?workspace=bodycomp&scenario=lab-bodycomp')
  const lab = page.locator('.fitness-lab-view')
  const stats = lab.locator('.fitness-lab-stats')
  await expect(stats).toContainText('20%')
  await expect(stats).toContainText('64 kg')
  await expect(stats).toContainText('16 kg fat')
  await lab.getByRole('button', { name: 'Start body composition scan' }).click()
  await expect(page.getByRole('heading', { name: 'AI DEXA-Vision Body Composition Estimator' })).toBeVisible()
  await page.getByRole('button', { name: 'Close modal' }).click()
  await expect(page.getByRole('heading', { name: 'AI DEXA-Vision Body Composition Estimator' })).not.toBeVisible()
})

for (const tool of ['roadmap', 'video', 'nutrition', 'travel']) {
  test(`${tool} signed-out state shows guidance without a dev issue badge`, async ({ page }) => {
    await page.route('**/api/account/entitlements', route => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }))
    await page.route('**/api/fitness/periodization', route => route.fulfill({ status: 401, json: { error: 'Unauthorized' } }))
    await page.goto(`/test-harness/fitness-mobile?workspace=${tool}`)
    await expect(page.locator('.fitness-lab-view').getByRole('alert')).toContainText('Please sign in')
    await expect(page.getByRole('button', { name: 'Open issues overlay' })).toHaveCount(0)
  })
}

test('Roadmap failure is explicit and retry restores the real plan', async ({ page }) => {
  let fail = true
  await page.route('**/api/account/entitlements', route => route.fulfill({ json: { features } }))
  await page.route('**/api/fitness/periodization', route => route.fulfill({
    status: fail ? 500 : 200,
    json: { ok: !fail, plan: generate12WeekMacrocycle(2, 'Athletic Hypertrophy'), completedWorkoutsCount: 4 },
  }))
  await page.goto('/test-harness/fitness-mobile?workspace=roadmap')
  const lab = page.locator('.fitness-lab-view')
  await expect(lab.getByRole('alert')).toContainText('Could not load your roadmap')
  fail = false
  await lab.getByRole('button', { name: 'Retry roadmap' }).click()
  await expect(lab.getByRole('alert')).toHaveCount(0)
  await expect(lab.getByText('4 sessions logged')).toBeVisible()
  await lab.locator('summary').filter({ hasText: 'Training phase overview' }).click()
  await expect(lab.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Training phase overview' }) })).toHaveAttribute('open', '')
})
