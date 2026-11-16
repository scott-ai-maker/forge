import { expect, test, type Locator } from '@playwright/test'

const ENTITLEMENTS_PAYLOAD = {
  features: {
    nutrition: { active: true, expiresAt: null, usesRemaining: null },
    travel: { active: true, expiresAt: null, usesRemaining: null },
    'video-review': { active: true, expiresAt: null, usesRemaining: 3 },
  },
}

async function expectControlsFitAndMeet44px(root: Locator, viewportWidth: number) {
  for (const control of await root.locator('button, input, select, textarea, summary, a').all()) {
    if (!(await control.isVisible())) continue
    const box = (await control.boundingBox())!
    const label = ((await control.getAttribute('aria-label')) || (await control.textContent()) || '').trim()
    expect(box.x, `left bound for "${label}"`).toBeGreaterThanOrEqual(-0.05)
    expect(box.x + box.width, `right bound for "${label}"`).toBeLessThanOrEqual(viewportWidth + 0.5)
    expect(Number(box.height.toFixed(2)), `min 44px height for "${label}"`).toBeGreaterThanOrEqual(44)
  }
}

test.describe('Feature #13: Metabolic Nutrition Protocol & Periodized Macro Targets', () => {
  test('OPT Macros & BMR syncs initial optPhase, unlocks saved program targets on custom input exploration, and restores saved targets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.route('**/api/account/entitlements', route => route.fulfill({ json: ENTITLEMENTS_PAYLOAD }))

    await page.goto('/test-harness/fitness-mobile?scenario=nutrition-saved')
    const lab = page.locator('.fitness-lab-view')

    // Saved program targets section displays initial program targets (2,350 kcal / 190g P / 245g C / 68g F)
    const savedSection = lab.getByRole('region', { name: 'Saved program nutrition targets' })
    await expect(savedSection).toBeVisible()
    await expect(savedSection).toContainText('2,350 kcal / day')
    await expect(savedSection).toContainText('Protein 190g · Carbs 245g · Fat 68g')
    await expect(savedSection.getByRole('button', { name: 'Reset to saved targets' })).toHaveCount(0)

    // Phase 3 (from nasm_opt_phase: 3) is active by default
    const phase3Btn = lab.getByRole('button', { name: /Phase 3: Hypertrophy/i })
    await expect(phase3Btn).toHaveAttribute('aria-pressed', 'true')

    // Native semantic <progress> bars render for protein, carbs, fats, hydration, and electrolytes
    await expect(lab.locator('progress.forge-progress-bar')).toHaveCount(5)

    // Open nutrition inputs & energy breakdown disclosure and adjust Primary Goal
    await lab.locator('summary').filter({ hasText: 'Nutrition inputs & energy breakdown' }).click()
    const goalSelect = lab.getByLabel('Primary Goal:')
    await expect(goalSelect).toBeVisible()
    await goalSelect.selectOption('fat_loss')

    // Exploring custom inputs unlocks live recalculation and reveals "Reset to saved targets"
    const resetBtn = savedSection.getByRole('button', { name: 'Reset to saved targets' })
    await expect(resetBtn).toBeVisible()
    await expect(lab.getByText('158g', { exact: true })).toBeVisible()

    // Resetting restores the exact saved program targets and hides the reset button
    await resetBtn.click()
    await expect(resetBtn).toHaveCount(0)
    await expect(lab.getByText('190g', { exact: true })).toBeVisible()

    // Switch NASM OPT Phase to Phase 5: Power and Executive Dining Playbook tabs
    const phase5Btn = lab.getByRole('button', { name: /Phase 5: Power/i })
    await phase5Btn.click()
    await expect(phase5Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(phase3Btn).toHaveAttribute('aria-pressed', 'false')

    const travelDiningBtn = lab.getByRole('button', { name: 'Meals while traveling' })
    await travelDiningBtn.click()
    await expect(travelDiningBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(lab.getByText(/Airport|Flight|Hydration/i).first()).toBeVisible()
  })

  test('Hand Portions (PN1) switches goal allocations and Chrono-Nutrition & Supplements enforces safety shields, 1-tap adherence, and native <dialog>', async ({
    page,
  }) => {
    const adherencePosts: Array<Record<string, unknown>> = []
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.route('**/api/account/entitlements', route => route.fulfill({ json: ENTITLEMENTS_PAYLOAD }))
    await page.route('**/api/fitness/supplements', async route => {
      if (route.request().method() === 'POST') {
        adherencePosts.push(JSON.parse(route.request().postData() || '{}'))
        return route.fulfill({
          status: 200,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
          json: { ok: true },
        })
      }
      return route.continue()
    })

    await page.goto('/test-harness/fitness-mobile?workspace=nutrition')
    const lab = page.locator('.fitness-lab-view')

    // 1. Switch to Hand Portions (PN1) mode
    const handPortionsModeBtn = lab.getByRole('button', { name: /Hand Portions \(PN1\)/i })
    await handPortionsModeBtn.click()
    await expect(handPortionsModeBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(lab.getByText(/Massachusetts Non-Medical Nutrition Safe Harbor/i)).toBeVisible()

    // Switch goal inside PN1 Hand Portions from Muscle Gain -> Fat Loss
    const fatLossGoalBtn = lab
      .getByRole('group', { name: 'Hand portion nutrition goals' })
      .getByRole('button', { name: 'Fat Loss' })
    await fatLossGoalBtn.click()
    await expect(fatLossGoalBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(lab.getByText('Total Daily: 4 Cupped Hands', { exact: false })).toBeVisible()

    // 2. Switch to Chrono-Nutrition & Supplements mode
    const supplementsModeBtn = lab.getByRole('button', { name: /Chrono-Nutrition & Supplements/i })
    await supplementsModeBtn.click()
    await expect(supplementsModeBtn).toHaveAttribute('aria-pressed', 'true')

    // Automatic Health Profile sync from intake ("Lisinopril 10mg") activates Blood Pressure shield
    await expect(lab.getByText('Synced from Forge Athletic Health Profile:')).toBeVisible()
    const bpCheckbox = lab.getByRole('checkbox', { name: /Blood Pressure:/i })
    await expect(bpCheckbox).toBeChecked()
    await expect(lab.getByText(/Medication Safety Precautions/i)).toBeVisible()

    // Toggling Thyroid Hormone adds mandatory 4-hour chrono-separation timing window
    const thyroidCheckbox = lab.getByRole('checkbox', { name: /Thyroid Hormone:/i })
    await thyroidCheckbox.check()
    await expect(lab.getByText(/Mandatory Chrono-Separation Timing Windows/i)).toBeVisible()

    // Filter pills toggle aria-pressed cleanly
    const filterGroup = lab.getByRole('group', { name: 'Supplement routine tier and timing filters' })
    const dailyCoreFilter = filterGroup.getByRole('button', { name: /Daily Core/i })
    await dailyCoreFilter.click()
    await expect(dailyCoreFilter).toHaveAttribute('aria-pressed', 'true')

    // 1-tap adherence logging updates Today's progress + native <progress> bar and dispatches POST
    const adherenceSummary = lab.getByTestId('supplement-adherence-summary')
    await expect(adherenceSummary).toContainText('0 /')

    const firstDoseToggle = lab.getByRole('button', { name: /^Log dose for /i }).first()
    await firstDoseToggle.click()
    await expect(adherenceSummary).toContainText('1 /')
    expect(adherencePosts.length).toBe(1)
    expect(adherencePosts[0]?.completed).toBe(true)

    // Science Mechanism opens native top-layer <dialog> via showModal(), dismisses on Escape, and restores focus
    const scienceBtn = lab.getByRole('button', { name: /Science Mechanism/i }).first()
    await scienceBtn.click()
    const dialog = lab.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Biological Mechanism:')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(scienceBtn).toBeFocused()
  })

  test('CoachSupplementPrescriber hydrates athlete intake, updates live chrono preview, and publishes Concierge guide', async ({
    page,
  }) => {
    let postedBody: Record<string, unknown> | null = null

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.route('**/api/coach/clients/athlete-marcus-01/supplements', async route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
          json: {
            ok: true,
            athlete: { full_name: 'Marcus Vance', email: 'marcus@example.com' },
            profile: { primary_goal: 'athletic_power', age: 42, sex: 'male', training_experience: 'advanced_athlete' },
            intake: {
              parq_answers: {},
              medications: 'Levothyroxine 50mcg daily',
              medical_conditions: 'Hypothyroidism',
            },
            stack: { prescribedItems: [] },
          },
        })
      }
      postedBody = JSON.parse(route.request().postData() || '{}')
      return route.fulfill({
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
        json: { ok: true, conciergeNotified: true, stack: { prescribedItems: [] } },
      })
    })

    await page.goto('/test-harness/coach-portal-hub?tab=prescriptions')
    const section = page.getByRole('region', { name: 'Supplements & Gear Prescriptions' })
    await expect(section.getByRole('heading', { name: 'Configure Supplement Guide: Marcus Vance' })).toBeVisible()

    // Hydrated from GET /api/coach/clients/athlete-marcus-01/supplements
    await expect(section.getByLabel('Goal', { exact: true })).toHaveValue('athletic_power')
    await expect(section.getByRole('textbox', { name: 'Age', exact: true })).toHaveValue('42')
    await expect(section.getByRole('checkbox', { name: /Thyroid \(Levothyroxine\)/i })).toBeChecked()

    // Live ExecutiveSupplementTimeline preview updates immediately when Goal changes
    await expect(section.getByText('ATHLETIC POWER', { exact: true })).toBeVisible()
    await section.getByLabel('Goal', { exact: true }).selectOption('fat_loss')
    await expect(section.getByText('FAT LOSS', { exact: true })).toBeVisible()

    // Coach preview disables athlete 1-tap dose logging buttons
    await expect(section.getByRole('button', { name: /coach preview/i }).first()).toBeDisabled()

    // Enter custom coach directive and publish
    await section
      .getByLabel(/Coach Special Directives/i)
      .fill('Take Creatine Monohydrate with post-training carbohydrates.')
    await section.getByRole('button', { name: /Publish Guide & Concierge Update/i }).click()

    await expect(section.getByRole('status')).toContainText(
      "Precision Sports Science Supplement Guide successfully published to Marcus Vance's client portal"
    )
    expect(postedBody).toMatchObject({
      goal: 'fat_loss',
      age: 42,
      sex: 'male',
      customCoachNote: 'Take Creatine Monohydrate with post-training carbohydrates.',
    })
  })

  test('320px narrow mobile viewport renders all 3 nutrition modes with zero horizontal overflow and >=44px touch targets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 850 })
    await page.route('**/api/account/entitlements', route => route.fulfill({ json: ENTITLEMENTS_PAYLOAD }))

    await page.goto('/test-harness/fitness-mobile?scenario=nutrition-saved')
    const lab = page.locator('.fitness-lab-view')

    // Mode 1: OPT Macros & BMR (with open disclosure)
    await lab.locator('summary').filter({ hasText: 'Nutrition inputs & energy breakdown' }).click()
    await expectControlsFitAndMeet44px(lab, 320)
    let hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasOverflow).toBe(false)

    // Mode 2: Hand Portions (PN1)
    await lab.getByRole('button', { name: /Hand Portions \(PN1\)/i }).click()
    await expectControlsFitAndMeet44px(lab, 320)
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasOverflow).toBe(false)

    // Mode 3: Chrono-Nutrition & Supplements
    await lab.getByRole('button', { name: /Chrono-Nutrition & Supplements/i }).click()
    await expectControlsFitAndMeet44px(lab, 320)
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasOverflow).toBe(false)
  })
})
