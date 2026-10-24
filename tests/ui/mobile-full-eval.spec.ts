import { expect, test, type Locator, type Page } from '@playwright/test'

const harness = '/test-harness/fitness-mobile'

async function expectMinHeight(locator: Locator, min = 44) {
  const count = await locator.count()
  for (let i = 0; i < count; i++) {
    const item = locator.nth(i)
    if (!(await item.isVisible())) continue
    const box = (await item.boundingBox())!
    expect(box.height, `${await item.innerText().catch(() => '')} height`).toBeGreaterThanOrEqual(min)
  }
}

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

function trackConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('401')) errors.push(message.text())
  })
  return errors
}

for (const width of [320, 375]) {
  test(`Train stages and end workout modal keep 44px targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    const errors = trackConsoleErrors(page)
    await page.goto(harness)
    const stages = page.getByRole('group', { name: 'Workout stages' }).getByRole('button')
    await expect(stages.first()).toBeVisible()
    await expectMinHeight(stages)
    await expectNoOverflow(page)
    await page.getByRole('button', { name: /END WORKOUT/ }).first().click()
    const close = page.getByRole('button', { name: /close/i }).last()
    await expect(close).toBeVisible()
    const box = (await close.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(errors).toEqual([])
  })

  test(`Settings tabs switch in place with one billing tab at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    const errors = trackConsoleErrors(page)
    await page.goto(`${harness}?view=settings`)
    const tabs = page.locator('button[aria-pressed]')
    await expect(tabs.first()).toBeVisible()
    await expect(tabs.filter({ hasText: /Retainer/ })).toHaveCount(1)
    await expectMinHeight(tabs)
    const names = await tabs.allInnerTexts()
    for (const name of names) {
      const label = name.split('\n')[0]
      await tabs.filter({ hasText: label }).first().click()
      await expect(page).toHaveURL(/test-harness\/fitness-mobile/)
      await expect(tabs.filter({ hasText: label }).first()).toHaveAttribute('aria-pressed', 'true')
      await expectNoOverflow(page)
    }
    await tabs.filter({ hasText: 'Alert Preferences' }).first().click()
    await expect(page.getByRole('alert').filter({ hasText: /notification settings/i })).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })
}

for (const route of ['/', '/auth/login', '/auth/signup', '/whats-new', '/credentials', '/apply', '/waitlist']) {
  test(`${route} fits 320px with touch-sized links and buttons`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    const errors = trackConsoleErrors(page)
    await page.goto(route)
    await page.waitForLoadState('networkidle')
    await expectNoOverflow(page)
    await expectMinHeight(page.locator('main button:visible, footer a:visible, header a:visible, .mobile-hamburger-btn:visible'))
    expect(errors).toEqual([])
  })
}
