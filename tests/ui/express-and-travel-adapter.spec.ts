import { expect, test } from '@playwright/test'

test.describe('Feature #7 — 20-Minute Express Mode & Environment / Hotel Travel Adapter', () => {
  test('1. Toggles 20m Express Mode & Environment Profile with real-time workout compression, bodyweight/hotel swaps, and telemetry sync', async ({
    page,
  }) => {
    const telemetryPayloads: Record<string, unknown>[] = []
    await page.route('**/api/telemetry', async route => {
      try {
        const body = route.request().postDataJSON()
        if (body) telemetryPayloads.push(body as Record<string, unknown>)
      } catch {
        // Ignore non-JSON
      }
      await route.fulfill({ status: 200, json: { ok: true } })
    })

    await page.goto('/test-harness/express-travel', { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator('[data-testid="express-travel-harness"][data-hydrated="true"]')
    ).toBeVisible({ timeout: 25_000 })

    // Initial baseline: 6 resistance lifts at 4 sets / 90s rest in Home Gym
    const exerciseRows = page.locator('[data-testid^="harness-exercise-row-"]')
    await expect(exerciseRows).toHaveCount(6)
    await expect(exerciseRows.nth(0)).toContainText('Barbell Back Squat')
    await expect(exerciseRows.nth(0)).toContainText('4 sets × 8-10 · Rest 90s')

    // Toggle 20m Express ON -> compresses to top 4 primary lifts, max 2 sets, <=45s rest
    const expressBtn = page.getByTestId('readiness-bridge-express-toggle')
    await expect(expressBtn).toHaveAttribute('aria-pressed', 'false')
    await expressBtn.click()
    await expect(expressBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(expressBtn).toContainText('20m Express Active')

    await expect(exerciseRows).toHaveCount(4)
    await expect(exerciseRows.nth(0)).toContainText('2 sets × 8-10 · Rest 45s')

    // Switch Environment Profile to Hotel Travel -> substitutes Barbell Back Squat with DB Goblet Squat
    const envSelect = page.getByTestId('readiness-bridge-environment-select')
    await envSelect.selectOption('hotel_travel')
    await expect(exerciseRows.nth(0)).toContainText('DB Goblet Squat (Pause in Hole)')
    await expect(exerciseRows.nth(0)).toContainText('2 sets × 12-15 · Rest 45s')

    // Switch Environment Profile to Bodyweight -> zero-equipment calisthenics substitution
    await envSelect.selectOption('bodyweight_only')
    await expect(exerciseRows.nth(0)).toContainText('Bodyweight Rear-Foot-Elevated Split Squat')
    await expect(exerciseRows.nth(0)).toContainText('2 sets × 12-15/leg · Rest 45s')

    // Toggle 20m Express OFF -> restores all 6 exercises while retaining Bodyweight substitutions
    await expressBtn.click()
    await expect(expressBtn).toHaveAttribute('aria-pressed', 'false')
    await expect(exerciseRows).toHaveCount(6)
    await expect(exerciseRows.nth(0)).toContainText('Bodyweight Rear-Foot-Elevated Split Squat')
    await expect(exerciseRows.nth(0)).toContainText('4 sets × 12-15/leg · Rest 90s')

    // Verify client telemetry sync emitted session_preference_sync events
    await expect
      .poll(() => telemetryPayloads.length, { timeout: 5000 })
      .toBeGreaterThanOrEqual(1)
  })

  test('2. Enforces Multi-Day Travel Pass upgrade gate only on true consecutive-day travel swaps (never on stale historical trips)', async ({
    page,
  }) => {
    await page.goto('/test-harness/express-travel', { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator('[data-testid="express-travel-harness"][data-hydrated="true"]')
    ).toBeVisible({ timeout: 25_000 })

    // Ensure tier is core_lab (Single-Day Swap only)
    const tierBtn = page.getByTestId('harness-tier-toggle')
    if (!(await tierBtn.innerText()).includes('core_lab')) {
      await tierBtn.click()
    }
    await expect(tierBtn).toContainText('core_lab')

    // 1. Seed stale historical consecutive dates (months ago) -> selecting Hotel Travel today MUST NOT trigger modal
    await page.getByTestId('harness-seed-stale-swaps').click()
    const envSelect = page.getByTestId('readiness-bridge-environment-select')
    await envSelect.selectOption('hotel_travel')
    await expect(page.getByTestId('tier-upgrade-modal')).not.toBeVisible()

    // 2. Seed yesterday's swap -> selecting Hotel Travel today MUST trigger consecutive_travel_swaps TierUpgradeModal
    await page.getByTestId('harness-seed-yesterday-swap').click()
    await envSelect.selectOption('hotel_travel')

    const upgradeDialog = page.getByTestId('tier-upgrade-modal')
    await expect(upgradeDialog).toBeVisible()
    await expect(upgradeDialog).toContainText('Multi-Day Travel Pass')
    await expect(upgradeDialog).toContainText('$49')

    // Upgrade to Plus directly in modal -> unlocks Multi-Day Travel Pass
    await upgradeDialog.getByRole('button', { name: /Unlock Multi-Day Travel Pass/i }).click()
    await expect(upgradeDialog).not.toBeVisible()
    await expect(tierBtn).toContainText('plus')
  })

  test('3. Adapts multi-day workouts in ExecutiveTravelAdapterStudio and recalibrates via native <dialog> CoachTravelRecalibratorModal', async ({
    page,
  }) => {
    const coachRecalibratePayloads: Array<{ scenario?: string; customNotes?: string }> = []
    await page.route('**/api/coach/clients/client-demo-007/travel-recalibrate', async route => {
      coachRecalibratePayloads.push(
        route.request().postDataJSON() as { scenario?: string; customNotes?: string }
      )
      await route.fulfill({
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
        json: {
          ok: true,
          message: 'Recalibrated',
          plan: { id: 'plan-travel-1', name: 'Phase 2 [Travel: Hotel Cables & Cardio]' },
        },
      })
    })

    await page.goto('/test-harness/express-travel', { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator('[data-testid="express-travel-harness"][data-hydrated="true"]')
    ).toBeVisible({ timeout: 25_000 })

    // Switch preview to Day 2 in ExecutiveTravelAdapterStudio
    await page.getByTestId('travel-studio-day-2').click()
    await expect(page.getByTestId('travel-preview-item-0')).toContainText(
      'Flat DB Chest Press with 2s Stretch Pause'
    )
    await expect(page.getByTestId('travel-preview-item-0')).toContainText(
      'Adapted from: Barbell Bench Press'
    )

    // Switch scenarios across Cables -> Room Bands -> apply to All Workout Days
    await page.getByTestId('travel-scenario-hotel_cables_cardio').click()
    await expect(page.getByTestId('travel-preview-item-0')).toContainText(
      'Standing Dual-Cable Chest Press'
    )

    await page.getByTestId('travel-scenario-hotel_room_bands').click()
    await expect(page.getByTestId('travel-preview-item-0')).toContainText(
      'Banded Deficit Push-ups (Hands on hotel luggage/books)'
    )

    await page.getByTestId('travel-studio-scope-all').click()
    await page.getByTestId('travel-studio-deploy-btn').click()
    await expect(page.getByTestId('travel-studio-deployed-status')).toContainText(
      'Applied Hotel Room Bands & Calisthenics to all 2 workout days.'
    )

    // Verify Day 2 in live session card received the deployed adaptation
    await page.getByTestId('harness-active-day-2').click()
    await expect(page.getByTestId('harness-exercise-row-0')).toContainText(
      'Banded Deficit Push-ups (Hands on hotel luggage/books)'
    )

    // Open CoachTravelRecalibratorModal -> verify native <dialog open>, label/input, API POST, and light-dismiss
    await page.getByTestId('harness-open-coach-modal').click()
    const coachDialog = page.getByTestId('coach-travel-recalibrator-dialog')
    await expect(coachDialog).toBeVisible()
    await expect(coachDialog).toHaveAttribute('open', '')

    await page.getByTestId('coach-travel-scenario-hotel_cables_cardio').click()
    const noteInput = coachDialog.getByLabel(/Optional Coach Directive to Athlete/i)
    await noteInput.fill('Use dual cable stack in hotel fitness center and keep 3-1-1 tempo.')
    await page.getByTestId('coach-travel-deploy-btn').click()

    await expect
      .poll(() => coachRecalibratePayloads[0]?.scenario, { timeout: 5000 })
      .toBe('hotel_cables_cardio')
    expect(coachRecalibratePayloads[0]?.customNotes).toContain('dual cable stack')
    await expect(coachDialog).not.toBeVisible({ timeout: 5000 })

    // Re-open and verify Escape dismissal on native <dialog>
    await page.getByTestId('harness-open-coach-modal').click()
    await expect(coachDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(coachDialog).not.toBeVisible()
  })

  test('4. Public Landing Sneak Peek Tab 04 (Express & Travel Engine) & 375px mobile overflow / 44px touch-target audit', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const tablist = page.locator('[role="tablist"][data-hydrated="true"]')
    await expect(tablist).toBeAttached({ timeout: 25_000 })
    await tablist.scrollIntoViewIfNeeded()
    await expect(tablist).toBeVisible()

    const tab04 = page.getByRole('tab', { name: /Express & Travel/i })
    await tab04.scrollIntoViewIfNeeded()
    await tab04.click()
    await expect(tab04).toHaveAttribute('aria-selected', 'true')

    const prescriptionPill = page.getByTestId('sneak-peek-express-prescription-pill')
    await expect(prescriptionPill).toContainText('2 × 10–12 · 45s Density Rest (~18m Total)')

    // Switch to 45m Full Block -> updates prescription readout
    await page.getByRole('button', { name: '45m Full Block' }).click()
    await expect(prescriptionPill).toContainText('4 × 8–10 · 90s Rest (~45m Standard)')

    // Switch Environment to Bodyweight -> updates movement pair readout
    const bodyweightBtn = page.getByRole('button', { name: 'Bodyweight' })
    await bodyweightBtn.click()
    await expect(bodyweightBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(
      page.getByText(/Bodyweight Rear-Foot-Elevated Split Squat/i)
    ).toBeVisible()

    // Audit 375px horizontal overflow and >=44px touch targets on both / and /test-harness/express-travel
    const landingOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(landingOverflow).toBe(false)

    const bwBox = await bodyweightBtn.boundingBox()
    expect(bwBox?.height ?? 0).toBeGreaterThanOrEqual(44)

    await page.goto('/test-harness/express-travel', { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator('[data-testid="express-travel-harness"][data-hydrated="true"]')
    ).toBeVisible({ timeout: 25_000 })

    const harnessOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(harnessOverflow).toBe(false)

    for (const testId of [
      'open-readiness-check-btn',
      'readiness-bridge-express-toggle',
      'readiness-bridge-environment-select',
      'travel-studio-deploy-btn',
      'travel-scenario-hotel_dumbbells_only',
    ]) {
      const box = await page.getByTestId(testId).boundingBox()
      expect(box?.height ?? 0, `${testId} height >= 44px`).toBeGreaterThanOrEqual(44)
    }
  })
})
