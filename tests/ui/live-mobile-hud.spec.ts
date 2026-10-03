import { test, expect } from '@playwright/test'

test.use({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--enable-gpu',
    ],
  },
})

test.describe('Mobile 1:1 Live Coaching Studio HUD Responsive Suite', () => {
  test('renders full-width broadcast stage, stacked set logger, and view mode tabs on iPhone', async ({ page }) => {
    await page.goto('/test-harness/live-mobile')

    // Wait for the Live HUD to mount
    await expect(page.getByText('LIVE COCKPIT')).toBeVisible({ timeout: 15000 })

    // Verify 3 mobile view mode buttons are present
    const studioTab = page.getByRole('button', { name: 'Studio (Both)' })
    const videoTab = page.getByRole('button', { name: 'Full Video' })
    const workoutTab = page.getByRole('button', { name: 'Workout', exact: true })

    await expect(studioTab).toBeVisible()
    await expect(videoTab).toBeVisible()
    await expect(workoutTab).toBeVisible()

    // Verify Coach Video & Athlete Video containers are rendered and full width
    const athleteContainer = page.locator('[data-testid="athlete-video-container"]')
    await expect(athleteContainer).toBeVisible()

    const athleteBox = await athleteContainer.boundingBox()
    expect(athleteBox).not.toBeNull()
    expect(athleteBox!.width).toBeGreaterThan(350)

    // Capture screenshot of default Studio (Both) view
    await page.screenshot({ path: 'test-results/mobile-live-studio-both.png' })

    // Scroll down in Studio (Both) mode to verify Set Logger is easily reached
    await page.evaluate(() => window.scrollTo(0, 450))
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'test-results/mobile-live-studio-both-scrolled.png' })

    // Switch to Full Video mode
    await page.evaluate(() => window.scrollTo(0, 0))
    await videoTab.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'test-results/mobile-live-studio-video.png' })

    // Switch to Workout mode
    await workoutTab.click()
    await page.waitForTimeout(300)
    await expect(page.getByRole('button', { name: /LOG SET/i })).toBeVisible()
    await page.screenshot({ path: 'test-results/mobile-live-studio-workout.png' })
  })
})
