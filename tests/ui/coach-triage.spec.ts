import { expect, test } from '@playwright/test'

test.describe('Master Coach Daily Triage Cockpit & Executive Memo Feature Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness/coach-triage')
    await page.waitForSelector('[data-hydrated="true"]')
  })

  test('renders cockpit with 4 clinical metric pill cards and correct queue counts', async ({ page }) => {
    await expect(page.getByText('Master Coach Daily Triage Cockpit')).toBeVisible()

    // 4 metric pill cards
    const urgentPill = page.getByRole('button', { name: /Urgent Action/i })
    const sundayPill = page.getByRole('button', { name: /Sunday Triage \/ Fatigue/i })
    const attentionPill = page.getByRole('button', { name: /Attention/i })
    const autonomousPill = page.getByRole('button', { name: /Autonomous \/ Accelerated/i })

    await expect(urgentPill).toBeVisible()
    await expect(sundayPill).toBeVisible()
    await expect(attentionPill).toBeVisible()
    await expect(autonomousPill).toBeVisible()

    // Initial queue shows all 4 clients
    await expect(page.getByText('Active Action Queue (4 of 4 Clients)')).toBeVisible()
    await expect(page.getByText('Julian Sterling')).toBeVisible()
    await expect(page.getByText('Marcus Vance')).toBeVisible()
    await expect(page.getByText('Elena Rostova')).toBeVisible()
    await expect(page.getByText('Devin Booker')).toBeVisible()
  })

  test('filters queue by Sunday Triage & CNS Fatigue priority', async ({ page }) => {
    const sundayPill = page.getByRole('button', { name: /Sunday Triage \/ Fatigue/i })
    await sundayPill.click()

    // Julian (reported pain) and Marcus (1d check-in + 52% readiness) match
    await expect(page.getByText('Julian Sterling')).toBeVisible()
    await expect(page.getByText('Marcus Vance')).toBeVisible()
    // Elena (no pain, 3d ago) is filtered out
    await expect(page.getByText('Elena Rostova')).not.toBeVisible()

    // Toggle back to all
    await sundayPill.click()
    await expect(page.getByText('Elena Rostova')).toBeVisible()
  })

  test('filters queue dynamically by search query across names and reasons', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Search athlete or trigger/i)
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Elena')

    await expect(page.getByText('Elena Rostova')).toBeVisible()
    await expect(page.getByText('Julian Sterling')).not.toBeVisible()
    await expect(page.getByText('Marcus Vance')).not.toBeVisible()

    await searchInput.fill('')
    await expect(page.getByText('Julian Sterling')).toBeVisible()
    await expect(page.getByText('Marcus Vance')).toBeVisible()
  })

  test('interactively launches and operates the 1-Tap Executive Consultant Memo Studio', async ({ page }) => {
    // Find the 1-tap Memo button for Marcus Vance
    const memoBtn = page.getByTitle(/Synthesize & Dispatch Executive Memo for Marcus Vance/i)
    await expect(memoBtn).toBeVisible()
    await memoBtn.click()

    // Verify modal is open
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('heading', { name: /Executive Memo: Marcus Vance/i })).toBeVisible()
    await expect(modal.getByText('Phase 1 Telemetry', { exact: true })).toBeVisible()
    await expect(modal.getByText(/Readiness: 52%/i)).toBeVisible()

    // Verify markdown preview content contains clinical sections
    const textarea = modal.locator('textarea')
    await expect(textarea).toBeVisible()
    const initialText = await textarea.inputValue()
    expect(initialText).toContain('Executive Weekly Briefing')
    expect(initialText).toContain('Performance & Volume Synthesis')
    expect(initialText).toContain('Biomechanical & Recovery Health')
    expect(initialText).toContain('Director of Human Performance: Coach Gordon')

    // Add custom coach directive note
    const customInput = modal.getByPlaceholder(/Dial in 4\/2\/1 tempo on goblet squats/i)
    await customInput.fill('Strictly control eccentric phase on all pressing')
    const updateAiBtn = modal.getByRole('button', { name: /Update AI Memo/i })
    await updateAiBtn.click()

    const updatedText = await textarea.inputValue()
    expect(updatedText).toContain('Strictly control eccentric phase on all pressing')

    // Close modal
    const cancelBtn = modal.getByRole('button', { name: /Cancel/i })
    await cancelBtn.click()
    await expect(modal).not.toBeVisible()
  })

  test('expands clinical telemetry details drill-down on client cards', async ({ page }) => {
    const detailsBtn = page.getByRole('button', { name: /Workload Telemetry & Flags/i }).first()
    await expect(detailsBtn).toBeVisible()
    await detailsBtn.click()

    // Acute & Chronic Workload and Joint Discomfort telemetry
    await expect(page.getByText(/Acute Workload \(7d\)/i)).toBeVisible()
    await expect(page.getByText(/Chronic Workload \(28d\)/i)).toBeVisible()
    await expect(page.getByText(/Joint Discomfort/i)).toBeVisible()
  })

  test('exposes aria-pressed filter states, <search> landmark, 1-click Auto-Triage sync, and non-blocking role="alert" error banner', async ({ page }) => {
    const searchLandmark = page.getByRole('search')
    await expect(searchLandmark).toBeVisible()

    const urgentPill = page.getByRole('button', { name: /Urgent Action/i })
    await expect(urgentPill).toHaveAttribute('aria-pressed', 'false')
    await urgentPill.click()
    await expect(urgentPill).toHaveAttribute('aria-pressed', 'true')
    await urgentPill.click()
    await expect(urgentPill).toHaveAttribute('aria-pressed', 'false')

    // First verify inline role="alert" banner on 500 failure (never blocking window.alert)
    let dialogTriggered = false
    page.on('dialog', () => {
      dialogTriggered = true
    })

    await page.route('**/api/coach/clients/athlete-red-01/periodization/auto-triage', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Simulated database lock during deload insert' }),
      })
    )

    const deloadBtn = page.getByRole('button', { name: /1-Click Restorative Deload/i })
    await deloadBtn.click()

    const errorBanner = page.locator('main [role="alert"]')
    await expect(errorBanner).toBeVisible()
    await expect(errorBanner).toContainText('Simulated database lock during deload insert')
    expect(dialogTriggered).toBe(false)

    await errorBanner.getByRole('button', { name: /Dismiss triage error/i }).click()
    await expect(errorBanner).toHaveCount(0)

    // Now verify 200 success updates row to ✓ Synced with Athlete
    await page.unroute('**/api/coach/clients/athlete-red-01/periodization/auto-triage')
    await page.route('**/api/coach/clients/athlete-red-01/periodization/auto-triage', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, message: '1-Click Restorative Deload Week inserted at Week 1.' }),
      })
    )

    await deloadBtn.click()
    await expect(page.getByText('✓ Synced with Athlete')).toBeVisible()
  })

  test('renders null readiness as em-dash without falsifying 0%, preserves real 0% readiness in Executive Memo, and holds zero overflow at 320px/375px', async ({ page }) => {
    await page.goto('/test-harness/coach-triage?scenario=telemetry-edge')
    await page.waitForSelector('[data-hydrated="true"]')

    // Clara has readinessScore: null -> displays — (never 0%)
    // Evelyn has readinessScore: 0 -> displays 0% and is counted in Sunday Triage / Fatigue (1)
    const sundayPill = page.getByRole('button', { name: /Sunday Triage \/ Fatigue/i })
    await expect(sundayPill).toContainText('1')

    await expect(page.getByText('—')).toBeVisible()
    await expect(page.getByText('0%').first()).toBeVisible()

    // Open Executive Memo for Dr. Evelyn Vance (0% readiness, 0% adherence) -> must show 0%, not 80% fallback
    await page.getByTitle(/Synthesize & Dispatch Executive Memo for Dr\. Evelyn Vance/i).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(/Readiness: 0%/i)).toBeVisible()
    const memoValue = await modal.locator('textarea').inputValue()
    expect(memoValue).toContain('0 sets this week (0% adherence)')
    expect(memoValue).toContain('**0%**')

    // Native <dialog> closes cleanly on Escape
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      const overflowPx = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflowPx, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
})
