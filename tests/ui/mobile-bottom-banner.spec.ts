import { test, expect } from '@playwright/test'

test.describe('Mobile Viewport Bottom Banner & Button Clearance Suite', () => {
  test.describe('iPhone 15 Pro Viewport (393x852)', () => {
    test.use({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    })

    test('PWA install prompt on phone renders at the top safe area and never obstructs bottom buttons', async ({ page }) => {
      await page.goto('/')

      // Clear dismissal state to ensure install banner triggers
      await page.evaluate(() => {
        window.localStorage.removeItem('gaa_pwa_prompt_dismissed_v2')
        window.localStorage.removeItem('gaa_pwa_prompt_dismissed_v1')
      })

      await page.reload()

      // The iOS prompt appears after a 2500ms delay in PwaInstallPrompt.tsx
      const banner = page.locator('aside.pwa-install-banner')
      await expect(banner).toBeVisible({ timeout: 6000 })

      // Verify the banner is positioned at the top of the viewport (NOT at the bottom)
      const box = await banner.boundingBox()
      expect(box).not.toBeNull()
      // Top bounding box should be near the top (< 120px from top)
      expect(box!.y).toBeLessThan(120)

      // Verify bottom area of screen (y > 700) is clear of the install banner
      expect(box!.y + box!.height).toBeLessThan(200)

      // Test dismissal
      const dismissBtn = banner.getByRole('button', { name: /dismiss install prompt/i })
      await expect(dismissBtn).toBeVisible()
      await dismissBtn.click()
      await expect(banner).not.toBeVisible()

      // Reload and verify 30-day snooze persists dismissal
      await page.reload()
      await page.waitForTimeout(3000)
      await expect(banner).not.toBeVisible()
    })

    test('intake apply flow on phone keeps bottom navigation buttons fully clickable', async ({ page }) => {
      await page.goto('/apply')
      await expect(page).toHaveURL(/\/apply$/)

      // Verify initial question
      await expect(page.getByRole('heading', { name: /What is your primary athletic & physiological objective\?/i })).toBeVisible()

      // Select an option
      const choiceBtn = page.getByRole('button', { name: /Lean Muscle Hypertrophy/i })
      await choiceBtn.click()

      // Bottom "Continue →" button must be visible, in viewport, and enabled
      const continueBtn = page.getByRole('button', { name: /continue/i })
      await expect(continueBtn).toBeVisible()
      await expect(continueBtn).toBeEnabled()

      // Verify continueBtn bounding box is within bottom thumb zone
      const btnBox = await continueBtn.boundingBox()
      expect(btnBox).not.toBeNull()
      expect(btnBox!.y + btnBox!.height).toBeLessThan(852)

      // Click Continue and verify advance to next step
      await continueBtn.click()
      await expect(page.getByRole('heading', { name: /What is your required transformation timeline\?/i })).toBeVisible()

      // Verify "← Back" button is also unobstructed and clickable
      const backBtn = page.getByRole('button', { name: /back/i })
      await expect(backBtn).toBeVisible()
      await backBtn.click()
      await expect(page.getByRole('heading', { name: /What is your primary athletic & physiological objective\?/i })).toBeVisible()
    })

    test('login page on phone displays sign-in controls without bottom obstruction', async ({ page }) => {
      await page.goto('/auth/login')
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

      const submitBtn = page.getByRole('button', { name: /sign in/i })
      const btnBox = await submitBtn.boundingBox()
      expect(btnBox).not.toBeNull()

      // Ensure button is fully within visible viewport
      expect(btnBox!.y + btnBox!.height).toBeLessThan(852)
      await expect(submitBtn).toBeEnabled()
    })
  })

  test.describe('iPhone SE Compact Viewport (375x667)', () => {
    test.use({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    })

    test('compact phone viewport maintains modal and bottom clearance', async ({ page }) => {
      await page.goto('/apply')
      await expect(page).toHaveURL(/\/apply$/)

      const continueBtn = page.getByRole('button', { name: /continue/i })
      await continueBtn.scrollIntoViewIfNeeded()
      await expect(continueBtn).toBeVisible()
      await expect(continueBtn).toBeInViewport()
    })
  })
})
