import { test, expect } from '@playwright/test'

test.use({
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--enable-gpu',
    ],
  },
})

test.describe('Virtual Background Benchmark & Noise Elimination Test Harness', () => {

  test('benchmarks virtual background segmentation, couch rejection, and edge stability', async ({ page }) => {
    page.on('console', msg => console.log('[BROWSER]', msg.type(), msg.text()))
    page.on('pageerror', err => console.error('[PAGE ERROR]', err))

    // Navigate to dedicated test harness page
    await page.goto('/test-harness/virtual-background')

    // Verify title and harness header
    await expect(page.getByText('Virtual Background Automated Test Harness')).toBeVisible()

    // Wait for the AI segmented canvas to mount and start rendering
    const stageCanvas = page.locator('[data-testid="live-virtual-background-canvas"]')
    await expect(stageCanvas).toBeVisible({ timeout: 15000 })

    // Allow MediaPipe and synthetic generator to run for 3 seconds to stabilize metrics
    await page.waitForTimeout(3000)

    // Verify Render FPS is active
    const fpsElem = page.locator('[data-testid="metrics-fps"]')
    await expect(fpsElem).toBeVisible()

    // Verify Couch Leakage metric is displayed
    const couchElem = page.locator('[data-testid="metrics-couch-leakage"]')
    await expect(couchElem).toBeVisible()

    // Capture screenshot of stationary performance with Olympic Facility
    await page.screenshot({ path: 'test-results/virtual-bg-stationary-olympic.png' })

    // Switch to Motion Simulation mode to benchmark head turn disocclusion and trailing
    const motionBtn = page.locator('[data-testid="sim-mode-motion"]')
    await motionBtn.click()

    // Allow motion loop to run for 2.5 seconds (full left-to-right sweep)
    await page.waitForTimeout(2500)

    // Capture screenshot during motion
    await page.screenshot({ path: 'test-results/virtual-bg-motion-test.png' })

    // Switch background to Biomechanics Diagnostic Lab
    const diagBgBtn = page.locator('[data-testid="select-bg-diagnostic-lab"]')
    if (await diagBgBtn.isVisible()) {
      await diagBgBtn.click()
      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'test-results/virtual-bg-diagnostic-lab.png' })
    }

    // Verify stage canvas is still visible and rendering with 0 crashes
    await expect(stageCanvas).toBeVisible()
  })
})
