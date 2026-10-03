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
    expect(initialText).toContain('Director of Human Performance: Scott Gordon')

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
})
