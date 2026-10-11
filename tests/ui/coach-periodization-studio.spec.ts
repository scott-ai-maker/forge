import { expect, test, type Page } from '@playwright/test'

const MOCK_PLAN = {
  planTitle: 'Jennifer Phase 1',
  primaryGoal: 'fat_loss',
  nasmOptPhase: 1,
  phaseName: 'Stabilization Endurance',
  totalWeeks: 4,
  sessionsPerWeek: 3,
  ragSourcesCited: ['NASM'],
  strengthCardioBlendSummary: { strengthPercentage: 60, cardioPercentage: 40, rationale: 'Blend' },
  periodizationWeeklyMemos: ['Week 1'],
  clinicalRationale: 'Phase 1 stability focus.',
  coachPersonalNote: 'Jennifer, I built this program around you — not a template.',
  workouts: [
    {
      day: 1,
      dayName: 'Day 1',
      focus: 'Lower stability',
      nasmOptPhase: 1,
      phaseName: 'Stabilization Endurance',
      estimatedDurationMins: 45,
      exercises: [
        {
          block: 'resistance',
          name: 'Step Up',
          sets: '3',
          reps: '12',
          tempo: '4/2/1',
          rest: '60s',
          coachingCues: ['Knee over toes'],
          nasmClinicalSource: 'NASM',
          contraindicationReplacedFrom: 'Jump Lunge',
          whyForYou: 'Swapped in instead of Jump Lunge to protect your knee.',
        },
      ],
    },
  ],
}

async function openIntake(page: Page) {
  await page.getByRole('button', { name: 'Start personal intake' }).first().click()
}

test.describe('Coach Program Builder (OPT periodization studio)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness/coach-periodization')
    await page.waitForSelector('[data-hydrated="true"]')
    await page.waitForLoadState('networkidle')
  })

  test('renders a coach-led header and the athlete profile card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: "Scott's program" })).toBeVisible()
    await expect(page.getByText(/Built by Coach Gordon/)).toBeVisible()

    const select = page.locator('#coach-studio-client-select')
    await expect(select).toHaveValue('athlete-scott')

    const profile = page.getByRole('region', { name: "Who you're building for" })
    await expect(profile).toBeVisible()
    await expect(profile.getByText('Scott Gordon')).toBeVisible()
    await expect(profile.getByText('Arms Fall Forward')).toBeVisible()
    await expect(profile.getByText(/Lower back stiffness/)).toBeVisible()
  })

  test('does not auto-open the intake and switches athlete context', async ({ page }) => {
    await expect(page.getByRole('dialog')).toHaveCount(0)

    const select = page.locator('#coach-studio-client-select')
    await select.selectOption('athlete-jennifer')
    await expect(page.getByRole('heading', { name: "Jennifer's program" })).toBeVisible()
    await expect(page.getByRole('region', { name: "Who you're building for" }).getByText('Knee Valgus')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await select.selectOption('sandbox-athlete')
    await expect(select).toHaveValue('sandbox-athlete')
    await expect(page.getByRole('heading', { name: 'Build a reusable template' })).toBeVisible()
  })

  test('opens the intake as a centered modal and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openIntake(page)

    const dialog = page.getByRole('dialog', { name: /Deep Personalization Intake/i })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Movement Superpowers/i).first()).toBeVisible()
    await expect(dialog.getByText(/Real-World Functional Demands/i)).toBeVisible()
    await expect(dialog.getByText(/Precision Nutrition Hand-Portion/i)).toBeVisible()

    const panel = await page.locator('.coach-intake-panel').boundingBox()
    expect(panel).not.toBeNull()
    const leftGap = panel!.x
    const rightGap = 1280 - (panel!.x + panel!.width)
    expect(Math.abs(leftGap - rightGap)).toBeLessThan(4)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('intake fills the screen on phones without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openIntake(page)
    const panel = await page.locator('.coach-intake-panel').boundingBox()
    expect(panel!.width).toBe(390)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
  })

  test('drafted program carries a personal note and per-exercise reasons for the athlete', async ({ page }) => {
    await page.route('**/api/coach/ai-architect', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ plan: MOCK_PLAN }) })
    )
    await page.locator('#coach-studio-client-select').selectOption('athlete-jennifer')
    await openIntake(page)
    await page.getByRole('button', { name: "Draft Jennifer's program with AI" }).click()

    const note = page.locator('#coach-personal-note')
    await expect(note).toHaveValue(/Jennifer, I built this program around you/)
    await expect(page.locator('[id^="why-"]').first()).toHaveValue(/protect your knee/)
    await expect(page.getByText("Why this is in Jennifer's plan").first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Approve & send to Jennifer' }).first()).toBeVisible()
  })
})
