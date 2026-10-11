import { expect, test, type Page } from '@playwright/test'

const harness = '/test-harness/fitness-mobile'

const viewports = [
  { width: 768, height: 1024, touch: true, minTarget: 44 },
  { width: 1024, height: 1366, touch: true, minTarget: 44 },
  { width: 1440, height: 900, touch: false, minTarget: 24 },
]

const routes = [
  `${harness}?workspace=train`,
  `${harness}?workspace=progress&scenario=progress`,
  `${harness}?workspace=lab`,
  `${harness}?workspace=coach`,
  `${harness}?view=settings`,
  '/',
  '/auth/login',
  '/apply',
  '/waitlist',
  '/credentials',
  '/whats-new',
]

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

async function smallTargets(page: Page, min: number) {
  return page.evaluate(min => {
    const visible = (el: Element) => {
      const style = getComputedStyle(el)
      const box = el.getBoundingClientRect()
      return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0 && !el.closest('.sr-only,[aria-hidden="true"]')
    }
    // WCAG 2.5.8 exempts links that sit inline within a sentence or list item.
    const inlineSentenceLink = (el: Element) => el.tagName === 'A' && getComputedStyle(el).display === 'inline' && !!el.closest('p,li')
    const exemptInput = (el: Element) => ['checkbox', 'radio', 'range'].includes((el as HTMLInputElement).type)
    return Array.from(document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab]'))
      .filter(el => visible(el) && !inlineSentenceLink(el) && !exemptInput(el))
      .filter(el => {
        const box = el.getBoundingClientRect()
        return box.width < min - 0.5 || box.height < min - 0.5
      })
      .map(el => {
        const box = el.getBoundingClientRect()
        const label = (el.getAttribute('aria-label') || (el as HTMLElement).innerText || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40)
        return `${label} ${Math.round(box.width)}x${Math.round(box.height)}`
      })
  }, min)
}

for (const vp of viewports) {
  test.describe(`${vp.width}px ${vp.touch ? 'touch tablet' : 'desktop'}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.touch })

    for (const route of routes) {
      test(`${route} fits the viewport with ${vp.minTarget}px targets`, async ({ page }) => {
        await page.goto(route)
        await page.waitForLoadState('networkidle').catch(() => {})
        await page.waitForTimeout(800)
        await expectNoOverflow(page)
        expect(await smallTargets(page, vp.minTarget)).toEqual([])
      })
    }

    test('every Settings tab is visible without horizontal scrolling', async ({ page }) => {
      await page.goto(`${harness}?view=settings`)
      const tabs = page.getByRole('group', { name: 'Settings sections' }).locator('button[aria-pressed]')
      await expect(tabs.first()).toBeVisible()
      const count = await tabs.count()
      expect(count).toBeGreaterThan(5)
      for (let i = 0; i < count; i++) {
        const box = (await tabs.nth(i).boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width)
      }
    })

    test("What's New copy keeps a readable line length", async ({ page }) => {
      await page.goto('/whats-new')
      const widest = await page.evaluate(() =>
        Math.max(
          ...Array.from(document.querySelectorAll('p, li'))
            .filter(el => (el as HTMLElement).innerText.length >= 200)
            .map(el => {
            const fontSize = parseFloat(getComputedStyle(el).fontSize)
            return el.getBoundingClientRect().width / (fontSize * 0.5)
          }),
        ),
      )
      expect(widest).toBeLessThanOrEqual(110)
    })
  })
}
