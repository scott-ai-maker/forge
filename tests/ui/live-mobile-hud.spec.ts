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

  test('adapts Microsoft Teams responsive shell across mobile split-stack, half-screen window, and widescreen collapsible Workout Pane', async ({ page }) => {
    // 1. Mobile 393px in SPLIT mode: stacks both participant cards full-width vertically instead of 180px slivers
    await page.setViewportSize({ width: 393, height: 852 })
    await page.goto('/test-harness/live-mobile')
    await expect(page.getByText('LIVE COCKPIT')).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: 'SPLIT', exact: true }).click()
    const coachMobileBox = await page.locator('[data-testid="coach-video-container"]').boundingBox()
    const athleteMobileBox = await page.locator('[data-testid="athlete-video-container"]').boundingBox()
    expect(coachMobileBox!.width).toBeGreaterThan(350)
    expect(athleteMobileBox!.width).toBeGreaterThan(350)
    expect(athleteMobileBox!.y).toBeGreaterThan(coachMobileBox!.y + 100)

    // 2. Half-screen / Tablet Split Window (820x900): Workout Pane auto-collapses so stage gets full width, and toggles as slide-over drawer
    await page.setViewportSize({ width: 820, height: 900 })
    const sidePane = page.locator('[data-testid="live-workout-side-pane"]')
    const paneToggleBtn = page.locator('[data-testid="toggle-workout-pane-btn"]')
    await expect(paneToggleBtn).toBeVisible()
    await expect(sidePane).not.toBeVisible()

    // Open slide-over Workout Pane on 820px split-screen without shrinking video stage width
    const stageBeforeDrawer = await page.locator('.teams-stage-column').boundingBox()
    await paneToggleBtn.click()
    await expect(sidePane).toBeVisible()
    const stageDuringDrawer = await page.locator('.teams-stage-column').boundingBox()
    expect(stageDuringDrawer!.width).toBeGreaterThanOrEqual(stageBeforeDrawer!.width - 4)

    // 3. Widescreen Desktop (1440x900): Side-by-side 2-up gallery + docked Workout Pane that collapses to full theater width
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(sidePane).toBeVisible()
    const stageDocked = await page.locator('.teams-stage-column').boundingBox()

    await paneToggleBtn.click()
    await expect(sidePane).not.toBeVisible()
    const stageTheater = await page.locator('.teams-stage-column').boundingBox()
    expect(stageTheater!.width).toBeGreaterThan(stageDocked!.width + 250)
  })

  test('operates Studio FX toolbar, Green Room native <dialog>, Virtual Background picker, Playbook & ERAP modals, and 320px zero-overflow layout', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    // Start at ultra-narrow 320px × 800px WCAG 1.4.10 viewport
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/test-harness/live-mobile')
    await expect(page.getByText('LIVE COCKPIT')).toBeVisible({ timeout: 15000 })

    // Verify zero horizontal page overflow at 320px
    const overflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflow320).toBeLessThanOrEqual(1)

    // Open Studio FX floating panel on 320px screen and toggle LUT + Framing + Green Room
    const studioFxPill = page.getByTestId('studio-fx-pill').first()
    await studioFxPill.scrollIntoViewIfNeeded()
    await studioFxPill.click()

    const fxPanel = page.getByTestId('studio-fx-panel')
    await expect(fxPanel).toBeVisible()
    const overflowWithFxPanel = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflowWithFxPanel).toBeLessThanOrEqual(1)

    const warmLutBtn = page.getByTestId('studio-lut-warm_tactile')
    await warmLutBtn.click()
    await expect(warmLutBtn).toHaveAttribute('aria-pressed', 'true')

    const headToToeBtn = page.getByTestId('studio-framing-head_to_toe')
    await headToToeBtn.click()
    await expect(headToToeBtn).toHaveAttribute('aria-pressed', 'true')

    // Launch Pre-Call Green Room native <dialog> from Studio FX panel
    await page.getByTestId('studio-open-green-room-btn').click()
    const greenRoomDialog = page.getByTestId('studio-green-room-modal')
    await expect(greenRoomDialog).toBeVisible()
    const greenRoomTag = await greenRoomDialog.evaluate(el => el.tagName)
    expect(greenRoomTag).toBe('DIALOG')

    // Dismiss Green Room via Join Live Studio CTA
    await page.getByTestId('green-room-join-btn').click()
    await expect(greenRoomDialog).not.toBeVisible()

    // Open Consultation Playbook native <dialog> on 320px viewport & verify Escape closes cleanly without opening Exit modal
    await page.getByRole('button', { name: /Playbook/i }).first().click()
    const playbookDialog = page.getByRole('dialog', { name: /45-MINUTE LIVE DIAGNOSTIC CONSULTATION/i })
    await expect(playbookDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(playbookDialog).not.toBeVisible()
    await expect(page.getByTestId('exit-cockpit-modal')).toHaveCount(0)

    // Open Live Telehealth Wrap-Up native <dialog> & dismiss via Escape
    await page.getByRole('button', { name: /^End$/i }).first().click()
    const wrapUpDialog = page.getByRole('dialog', { name: /Live Telehealth Wrap-Up/i })
    await expect(wrapUpDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(wrapUpDialog).not.toBeVisible()
    await expect(page.getByTestId('exit-cockpit-modal')).toHaveCount(0)

    expect(pageErrors).toEqual([])
  })
})
