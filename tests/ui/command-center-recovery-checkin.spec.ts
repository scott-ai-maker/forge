import { expect, test } from '@playwright/test'

function utcMondayIso(): string {
  const date = new Date()
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day))
  return date.toISOString().slice(0, 10)
}

const allEntitledFeatures = {
  ai_periodization_roadmap: true,
  ai_form_check_clinician: true,
  ai_macro_architect: true,
  ai_sleep_autonomic_coach: true,
  ai_travel_microcycle_adapter: true,
  ai_dexa_vision_scanner: true,
}

test.describe('Feature #11: Member Command Center, Recovery Gate (ACWR) & Weekly Check-Ins', () => {
  test('Command Center Hero updates Express lift cap, logs Joint Comfort & safety override, and fits 320px/375px viewports with >=44px targets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.route('**/api/telemetry', route => route.fulfill({ json: { ok: true } }))
    await page.route('**/api/safety/flag', route => route.fulfill({ json: { ok: true } }))

    await page.goto('/test-harness/command-center?onboarding=pending&live=1')

    const hero = page.getByRole('region', { name: "Today's Workout" })
    await expect(hero).toBeVisible()
    await expect(hero.getByRole('heading', { name: 'Day 2: Upper Push / Pull Supersets' })).toBeVisible()
    await expect(page.getByTestId('hero-workout-meta')).toHaveText('6 lifts · ~52m')

    // Toggle 20m Express Mode -> caps lifts to 4 and duration to 20m
    const expressBtn = hero.getByRole('button', { name: /20m Express/i })
    await expect(expressBtn).toHaveAttribute('aria-pressed', 'false')
    await expressBtn.click()
    await expect(expressBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('hero-workout-meta')).toHaveText('4 lifts · ~20m')

    // Switch Training Environment Profile
    const envSelect = hero.getByLabel('Training environment profile')
    await envSelect.selectOption('hotel_travel')
    await expect(envSelect).toHaveValue('hotel_travel')

    // Verify 7-Day Volume & Readiness card displays authentic 28-day chronic ACWR
    await expect(page.getByText('7-Day Volume & Readiness')).toBeVisible()
    await expect(page.getByText('1.14')).toBeVisible()

    // Expand Joint Comfort Score strip and trigger low-comfort clinical safety override
    const comfortToggle = page.getByRole('button', { name: /Joint Comfort Score/i })
    await comfortToggle.click()
    await expect(comfortToggle).toHaveAttribute('aria-expanded', 'true')

    const lumbarGroup = page.getByRole('group', { name: 'Lower Back comfort rating 1 to 5' })
    await lumbarGroup.getByRole('button', { name: /^1\s*Stiff$/i }).click()
    await page.getByRole('button', { name: /Save Score/i }).click()

    const safetyCard = page.getByTestId('joint-comfort-safety-override-card')
    await expect(safetyCard).toBeVisible()
    const msgCoachBtn = page.getByTestId('joint-comfort-message-real-coach-btn')
    await expect(msgCoachBtn).toBeVisible()
    expect((await msgCoachBtn.boundingBox())!.height).toBeGreaterThanOrEqual(44)

    // Open and close native <dialog> Desk Ergonomics Camera Audit via Escape
    await page.getByRole('button', { name: /Desk Ergonomics Audit/i }).click()
    const auditDialog = page.getByRole('dialog', { name: 'Desk Ergonomics Camera Audit' })
    await expect(auditDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(auditDialog).not.toBeVisible()

    // Verify zero horizontal overflow and >=44px interactive touch targets at 320px narrow mobile width
    await page.setViewportSize({ width: 320, height: 812 })
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(hasOverflow).toBe(false)

    for (const locator of [
      expressBtn,
      envSelect,
      page.getByTestId('hero-listen-preworkout-briefing-btn'),
      hero.getByRole('link', { name: /Start Workout/i }),
      page.getByRole('link', { name: 'Join →' }),
      page.getByRole('link', { name: 'Start Setup →' }),
      page.getByRole('link', { name: 'Studio →' }),
      page.getByRole('button', { name: '+ICS' }),
    ]) {
      const box = (await locator.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('ClientMembershipStatusBanner renders hold & inactive states cleanly with >=44px action link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/test-harness/command-center?status=paused')

    const banner = page.getByTestId('client-membership-status-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Membership On Temporary Hold')
    await expect(banner).toContainText('Executive travel Sabbatical')

    const messageLink = banner.getByRole('link', { name: /Message Coach Gordon/i })
    await expect(messageLink).toHaveAttribute('href', '/dashboard/messages')
    expect((await messageLink.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  })

  test('Recovery Gate (ReadinessRecoveryTracker) commits uninitialized slider taps, transitions GREEN -> RED gate, and renders 7-day deload schedule', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.route('**/api/account/entitlements', route =>
      route.fulfill({ json: { features: allEntitledFeatures } })
    )

    await page.goto('/test-harness/fitness-mobile?workspace=readiness&tab=gate')
    const lab = page.locator('.fitness-lab-view')
    await expect(lab.getByText('GATE: NO DATA', { exact: true })).toBeVisible()

    // Open Daily check-in inputs disclosure
    await lab.locator('summary').filter({ hasText: 'Daily check-in inputs' }).click()

    // Clicking a slider directly on its resting thumb (value=8) commits 8/10 via onPointerUp
    const sleepQualitySlider = lab.getByRole('slider', { name: 'Sleep quality' })
    const sliderBox = (await sleepQualitySlider.boundingBox())!
    await sleepQualitySlider.click({
      position: {
        x: Math.round(10 + (sliderBox.width - 20) * (7 / 9)),
        y: Math.round(sliderBox.height / 2),
      },
    })
    await expect(lab.getByText('8/10')).toBeVisible()
    await expect(lab.getByText('GATE: YELLOW', { exact: true })).toBeVisible()

    // Adding restorative sleep duration elevates score >= 80 -> GREEN Gate
    await lab.getByRole('slider', { name: 'Sleep duration', exact: true }).fill('8')
    await expect(lab.getByText('GATE: GREEN', { exact: true })).toBeVisible()

    // Drive severe fatigue inputs -> RED Gate & Active Recovery / -50% volume recommendation
    await lab.getByRole('slider', { name: 'Sleep duration', exact: true }).fill('4.5')
    await sleepQualitySlider.fill('2')
    await lab.getByRole('slider', { name: 'Resting heart rate', exact: true }).fill('68')
    await lab.getByRole('slider', { name: 'Soreness level', exact: true }).fill('9')
    await lab.getByRole('slider', { name: 'Stress level', exact: true }).fill('9')

    await expect(lab.getByText('GATE: RED', { exact: true })).toBeVisible()
    await expect(lab.getByRole('heading', { name: /High systemic\/CNS fatigue detected/i })).toBeVisible()

    // Inspect Intra-Workout Throttler adjustments
    await lab.locator('summary').filter({ hasText: 'Suggested workout adjustments' }).click()
    await expect(lab.getByText('60%')).toBeVisible()
    await expect(lab.getByText(/RPE 7/)).toBeVisible()
    await expect(lab.getByText('+60s Extended')).toBeVisible()

    // Switch to Workload (ACWR) tab and Recovery week (7-day Deload Schedule) tab
    const workloadBtn = lab.getByRole('button', { name: /^Workload/ })
    expect((await workloadBtn.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await workloadBtn.click()
    await expect(lab.getByText('Live Acute-to-Chronic Workload Ratio (ACWR)')).toBeVisible()

    const deloadBtn = lab.getByRole('button', { name: 'Recovery week' })
    expect((await deloadBtn.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    await deloadBtn.click()
    const schedule = lab.getByTestId('deload-microcycle-schedule')
    await expect(schedule).toBeVisible()
    await expect(schedule.getByText('Day 1: Upper Kinetic Chain Deload')).toBeVisible()
    await expect(schedule.getByText('Day 7: Pre-Macrocycle Re-Assessment')).toBeVisible()
  })

  test('WeeklyCheckinForm displays coach load adjustment pill, validates upper-bound weight with aria-invalid reset, and saves cleanly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const weekStart = utcMondayIso()
    const existingCheckin = {
      id: 'ci-week-11',
      week_start: weekStart,
      sleep_quality: 4,
      stress_level: 4,
      soreness_level: 3,
      energy_level: 4,
      weight_kg: 82.0,
      notes: 'Tempo control felt locked in.',
      coach_feedback: 'Strong scapular stability this week — add 2.5% to upper pulls.',
      coach_rating_adjustment: 2.5,
    }

    let postedPayload: Record<string, unknown> | null = null
    await page.route('**/api/fitness/checkin', async route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: { checkins: [existingCheckin] } })
      }
      postedPayload = route.request().postDataJSON()
      return route.fulfill({
        json: { ...existingCheckin, ...postedPayload },
      })
    })

    await page.goto('/test-harness/fitness-mobile?workspace=coach')
    const coach = page.locator('.fitness-coach-view')

    await expect(coach.getByText(existingCheckin.coach_feedback)).toBeVisible()
    await expect(coach.getByText('+2.5 Load Increase')).toBeVisible()

    // Reject unrealistic upper-bound weight (> 1100 lb / 500 kg) and set aria-invalid
    const weightInput = coach.getByLabel(/Current Weight/)
    await weightInput.fill('1500')
    await coach.getByRole('button', { name: 'Update check-in' }).click()
    await expect(coach.getByRole('alert')).toContainText('1,100 lb')
    await expect(weightInput).toHaveAttribute('aria-invalid', 'true')

    // Editing immediately clears error & aria-invalid per forms validation timing rules
    await weightInput.fill('182.5')
    await expect(coach.getByRole('alert')).toHaveCount(0)
    await expect(weightInput).not.toHaveAttribute('aria-invalid', 'true')

    // Update rating & submit
    await coach.getByRole('button', { name: 'Excellent sleep quality (Sleep Quality)', exact: true }).click()
    await coach.getByRole('button', { name: 'Update check-in' }).click()
    await expect(coach.getByRole('status')).toContainText('Check-in saved ✓')
    expect(postedPayload).toMatchObject({
      week_start: weekStart,
      sleep_quality: 5,
      weight_kg: 82.78,
    })
  })
})
