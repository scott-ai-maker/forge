import { expect, test } from '@playwright/test'
import { buildSynthetic3RepTrajectory } from '../../lib/camera-readiness-engine'

test.describe('30-Second Camera Readiness Check — End-to-End Feature Suite', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('auto-opens via ?startWorkout=1, enforces 5s step-back framing countdown, and releases camera tracks on Esc', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
      ;(window as unknown as { __CAMERA_TRACK_STOP_COUNT__: number }).__CAMERA_TRACK_STOP_COUNT__ = 0

      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            const canvas = document.createElement('canvas')
            canvas.width = 320
            canvas.height = 240
            const stream = canvas.captureStream(15)
            for (const track of stream.getTracks()) {
              const origStop = track.stop.bind(track)
              track.stop = () => {
                ;(
                  window as unknown as { __CAMERA_TRACK_STOP_COUNT__: number }
                ).__CAMERA_TRACK_STOP_COUNT__ += 1
                origStop()
              }
            }
            return stream
          },
        },
      })
    })

    await page.goto('/test-harness/fitness-mobile?startWorkout=1')

    const dialog = page.getByTestId('pre-workout-readiness-dialog')
    await expect(dialog).toBeVisible()

    // URL query param ?startWorkout=1 is cleaned on arrival
    await expect
      .poll(() => new URL(page.url()).searchParams.get('startWorkout'))
      .toBeNull()

    // Ensure leaked dev <select> Simulate Readiness Check is completely gone
    await expect(page.locator('#simulate-readiness-preset')).toHaveCount(0)
    await expect(dialog).not.toContainText('Simulate Readiness Check:')

    // Mobile tap target ergonomics (>= 44px height, within 390px viewport)
    const startBtn = dialog.getByTestId('readiness-start-camera-btn')
    await expect(startBtn).toBeVisible()
    const startBox = await startBtn.boundingBox()
    expect(startBox!.height).toBeGreaterThanOrEqual(44)
    expect(startBox!.x + startBox!.width).toBeLessThanOrEqual(390.5)

    // Lens toggle switches between Front Lens and Rear Lens
    const lensBtn = dialog.getByTestId('readiness-camera-facing-btn')
    await expect(lensBtn).toContainText('Front Lens')
    await lensBtn.click()
    await expect(lensBtn).toContainText('Rear Lens')
    await lensBtn.click()
    await expect(lensBtn).toContainText('Front Lens')

    // Start 30s Camera Check -> enters 5s step-back framing countdown first
    await startBtn.click()
    await expect(dialog.getByTestId('readiness-countdown-overlay')).toBeVisible()
    await expect(dialog.getByTestId('readiness-tracking-badge')).toHaveText('FRAMING')

    // Dismissing dialog via Escape immediately closes modal AND stops hardware camera tracks
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __CAMERA_TRACK_STOP_COUNT__: number })
              .__CAMERA_TRACK_STOP_COUNT__
        )
      )
      .toBeGreaterThanOrEqual(1)
  })

  test('gates Dual-Screen Full Check behind Plus upgrade for Core Lab and unlocks 2-Squat + 1-Slide Dual-Screen for Plus', async ({
    page,
  }) => {
    const dualTrajectory = buildSynthetic3RepTrajectory('dual_screen', 'tight_hips_ankles')

    await page.addInitScript(() => {
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
    })

    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('open-readiness-check-btn').click()

    const dialog = page.getByTestId('pre-workout-readiness-dialog')
    const dualBtn = dialog.getByTestId('readiness-mode-dual-screen')
    await expect(dualBtn).toContainText('PLUS')
    await dualBtn.click()

    // Core Lab triggers TierUpgradeModal and closes readiness dialog
    await expect(dialog).toBeHidden()
    const closeUpgradeBtn = page.getByRole('button', { name: 'Close upgrade modal' })
    await expect(closeUpgradeBtn).toBeVisible()
    await expect(page.getByText('Founding Member Lifetime Rate Lock')).toBeVisible()

    // Activate Plus tier directly via TierUpgradeModal CTA and inject Dual-Screen 3-rep trajectory
    await page.evaluate(frames => {
      ;(window as unknown as { __FORGE_TEST_POSE_STREAM__: unknown }).__FORGE_TEST_POSE_STREAM__ = {
        frames,
        intervalMs: 25,
        skipCountdown: true,
      }
    }, dualTrajectory)
    await page.getByRole('dialog').locator('button.bg-emerald-400').click()
    await expect(closeUpgradeBtn).toBeHidden()

    await page.getByTestId('open-readiness-check-btn').click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('readiness-mode-dual-screen')).not.toContainText('PLUS')
    await dialog.getByTestId('readiness-mode-dual-screen').click()
    await expect(dialog.getByTestId('readiness-mode-dual-screen')).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    await dialog.getByTestId('readiness-start-camera-btn').click()

    const resultCard = dialog.getByTestId('readiness-result-card')
    await expect(resultCard).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByTestId('readiness-source-badge')).toContainText(
      'Live 33-Pt CV · 3/3 Reps'
    )
    await expect(dialog.getByTestId('readiness-check-pill-ankle_df')).toBeVisible()
    await expect(dialog.getByTestId('readiness-check-pill-shoulder_flex')).toBeVisible()
  })

  test('streams 33-point restricted Overhead Squat reps, dynamically enforces 20m Express 90s cap, and runs live warm-up drill timers', async ({
    page,
  }) => {
    const restrictedTrajectory = buildSynthetic3RepTrajectory(
      'overhead_squat',
      'tight_hips_ankles'
    )

    await page.addInitScript(frames => {
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
      ;(window as unknown as { __FORGE_TEST_POSE_STREAM__: unknown }).__FORGE_TEST_POSE_STREAM__ = {
        frames,
        intervalMs: 45,
        skipCountdown: false,
      }
    }, restrictedTrajectory)

    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('open-readiness-check-btn').click()

    const dialog = page.getByTestId('pre-workout-readiness-dialog')
    await dialog.getByTestId('readiness-start-camera-btn').click()

    // Step-back countdown appears first; skip 5s into live 25s CV window
    await expect(dialog.getByTestId('readiness-countdown-overlay')).toBeVisible()
    await dialog.getByTestId('readiness-skip-countdown-btn').click()

    // Live 33-point skeleton segments & joint angles appear in real time
    await expect(dialog.getByTestId('readiness-live-skeleton-segments')).toBeVisible()
    await expect(dialog.getByTestId('readiness-live-angles')).toContainText('Ankle DF')

    // Auto-completes after 3rd rep locks
    const resultCard = dialog.getByTestId('readiness-result-card')
    await expect(resultCard).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByTestId('readiness-source-badge')).toContainText(
      'Live 33-Pt CV · 3/3 Reps'
    )
    const scoreText = await dialog.getByTestId('readiness-score-value').innerText()
    const scoreNum = Number.parseInt(scoreText, 10)
    expect(scoreNum).toBeGreaterThanOrEqual(46)
    expect(scoreNum).toBeLessThan(85)

    await expect(dialog.getByTestId('readiness-injected-drills-preview')).toContainText(
      'Auto-Injecting 3 Corrective Drills (150s)'
    )

    // Apply warm-up -> prepends 3 corrective drills right before Set 1
    await dialog.getByTestId('readiness-apply-begin-btn').click()
    await expect(dialog).toBeHidden()

    const warmupBlock = page.getByTestId('injected-warmup-block')
    await expect(warmupBlock).toBeVisible()
    await expect(page.getByTestId('injected-warmup-duration-badge')).toContainText('150s')
    await expect(warmupBlock.locator('[data-testid^="warmup-drill-card-"]')).toHaveCount(3)

    // Toggle 20m Express Mode ON -> dynamically caps to 2 drills and <= 90s
    const expressToggle = page.getByTestId('readiness-bridge-express-toggle')
    await expressToggle.click()
    await expect(expressToggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('injected-warmup-duration-badge')).toContainText(
      '90s (90s Express Cap)'
    )
    await expect(warmupBlock.locator('[data-testid^="warmup-drill-card-"]')).toHaveCount(2)

    // Toggle 20m Express Mode OFF -> restores all 3 drills (150s) cleanly
    await expressToggle.click()
    await expect(expressToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByTestId('injected-warmup-duration-badge')).toContainText('150s')
    await expect(warmupBlock.locator('[data-testid^="warmup-drill-card-"]')).toHaveCount(3)

    // Re-enable 20m Express Mode (45s per drill) and run the Guided Warm-Up countdown timer
    await expressToggle.click()
    const guidedTimerBtn = page.getByTestId('warmup-guided-timer-btn')
    await expect(guidedTimerBtn).toContainText('Start Guided Warm-Up')
    await guidedTimerBtn.click()
    await expect(guidedTimerBtn).toContainText('Pause Timer (45s)')

    // Verify timer actually ticks down in real time
    await expect(guidedTimerBtn).toContainText(/Pause Timer \((44|43|42)s\)/, { timeout: 3500 })
    await guidedTimerBtn.click()
    await expect(guidedTimerBtn).toContainText('Start Guided Warm-Up')

    // Open drill demonstration modal via thumbnail
    await warmupBlock
      .getByRole('button', { name: /Watch Half-Kneeling Ankle Dorsiflexion Rocks demonstration/i })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')

    // Mark first drill completed manually, then remove injected warm-up block
    const markDoneBtn = warmupBlock
      .getByRole('button', { name: /Mark Half-Kneeling Ankle Dorsiflexion Rocks completed/i })
      .first()
    await markDoneBtn.click()
    await expect(markDoneBtn).toHaveAttribute('aria-pressed', 'true')

    await page.getByTestId('warmup-remove-btn').click()
    await expect(warmupBlock).toHaveCount(0)
  })

  test('clears directly to Set 1 with zero injected drills when 3 live Overhead Squat reps show optimal mobility', async ({
    page,
  }) => {
    const optimalTrajectory = buildSynthetic3RepTrajectory('overhead_squat', 'optimal_mobility')

    await page.addInitScript(frames => {
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
      ;(window as unknown as { __FORGE_TEST_POSE_STREAM__: unknown }).__FORGE_TEST_POSE_STREAM__ = {
        frames,
        intervalMs: 25,
        skipCountdown: true,
      }
    }, optimalTrajectory)

    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('open-readiness-check-btn').click()

    const dialog = page.getByTestId('pre-workout-readiness-dialog')
    await dialog.getByTestId('readiness-start-camera-btn').click()

    const resultCard = dialog.getByTestId('readiness-result-card')
    await expect(resultCard).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByTestId('readiness-source-badge')).toContainText(
      'Live 33-Pt CV · 3/3 Reps'
    )

    const scoreText = await dialog.getByTestId('readiness-score-value').innerText()
    expect(Number.parseInt(scoreText, 10)).toBeGreaterThanOrEqual(89)
    await expect(dialog.getByTestId('readiness-injected-drills-preview')).toHaveCount(0)
    await expect(dialog.getByTestId('readiness-apply-begin-btn')).toContainText(
      'Begin Today’s Workout →'
    )

    await dialog.getByTestId('readiness-apply-begin-btn').click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('injected-warmup-block')).toHaveCount(0)
  })

  test('handles denied camera permission honestly without fake skeleton overlays and supports Quick Mobility Self-Check', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException('Permission denied', 'NotAllowedError')
          },
        },
      })
    })

    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('open-readiness-check-btn').click()

    const dialog = page.getByTestId('pre-workout-readiness-dialog')
    await dialog.getByTestId('readiness-start-camera-btn').click()
    await dialog.getByTestId('readiness-skip-countdown-btn').click()

    // Honest fallback bar appears; zero fabricated skeleton segments are drawn
    await expect(dialog.getByTestId('readiness-camera-fallback-bar')).toBeVisible()
    await expect(dialog.getByTestId('readiness-live-skeleton-segments')).toHaveCount(0)

    // Cancel back to idle and use the crowded-gym Quick Mobility Self-Check disclosure
    await dialog.getByTestId('readiness-cancel-scan-btn').click()
    const disclosure = dialog.getByTestId('readiness-self-check-disclosure')
    await disclosure.locator('summary').click()
    await dialog.getByTestId('readiness-self-check-stiff_upper_back').click()

    await expect(dialog.getByTestId('readiness-result-card')).toBeVisible()
    await expect(dialog.getByTestId('readiness-source-badge')).toHaveText('Mobility Self-Check')
    await expect(dialog.getByTestId('readiness-score-value')).toContainText('76')

    await dialog.getByTestId('readiness-apply-begin-btn').click()
    await expect(page.getByTestId('injected-warmup-block')).toBeVisible()
    await expect(page.getByTestId('injected-warmup-block')).toContainText(
      'Side-Lying Open-Book Thoracic Rotations'
    )
  })
})
