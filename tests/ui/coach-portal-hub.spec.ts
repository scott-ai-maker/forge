import { expect, test } from '@playwright/test'

test.describe('Coach Portal Hub: Navigator, 12-Week Periodization Cockpit & Lifecycle Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness/coach-portal-hub')
    await page.waitForSelector('[data-hydrated="true"]')
  })

  test('operates Client Hub <search> filtering, All Hubs disclosure, and aria-current workspace navigation', async ({ page }) => {
    // Active tab link has aria-current="page" inside <nav aria-label="Client hub workspaces">
    const workspaceNav = page.getByRole('navigation', { name: 'Client hub workspaces' })
    await expect(workspaceNav).toBeVisible()
    const activeLink = workspaceNav.getByRole('link', { name: /OPT™ Macrocycle Engine/i })
    await expect(activeLink).toHaveAttribute('aria-current', 'page')

    // Stage 8 Maintenance & Compliance breadcrumb jump link is visible
    await expect(page.getByText(/Maintenance & Compliance: Stage 8/i)).toBeVisible()

    // Hub search input inside <search> filters across all 11 hub workspaces
    const hubSearch = page.getByRole('search').getByRole('searchbox', { name: /Search client hub tools/i })
    await expect(hubSearch).toBeVisible()
    await hubSearch.fill('PAR-Q')

    const matchingLink = page.getByRole('link', { name: /Liability Shield & PAR-Q.*Protocols & Safety/i })
    await expect(matchingLink).toBeVisible()
    await expect(matchingLink).toHaveAttribute('href', /tab=shield/)

    await hubSearch.fill('')
    await expect(hubSearch).toHaveValue('')

    // All Hubs toggle manages aria-expanded and reveals 4-pillar directory
    const allHubsBtn = page.getByRole('button', { name: /All Hubs|Close Directory/i })
    await expect(allHubsBtn).toHaveAttribute('aria-expanded', 'false')
    await allHubsBtn.click()
    await expect(allHubsBtn).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByText('Protocols & Safety')).toBeVisible()
    await expect(page.getByText('Operations & Concierge')).toBeVisible()
    await allHubsBtn.click()
    await expect(allHubsBtn).toHaveAttribute('aria-expanded', 'false')
  })

  test('modulates 12-Week Macrocycle Cockpit with Deload, non-blocking Reset Baseline confirmation, and Save & Sync', async ({ page }) => {
    let browserConfirmFired = false
    page.on('dialog', () => {
      browserConfirmFired = true
    })

    const cockpit = page.getByRole('region', { name: '12-Week Periodization Cockpit' })

    // Week 1 starts pressed; selecting Week 3 updates aria-pressed
    const week1Btn = cockpit.getByRole('button', { name: /\bW1\b/i })
    const week3Btn = cockpit.getByRole('button', { name: /\bW3\b/i })
    await expect(week1Btn).toHaveAttribute('aria-pressed', 'true')
    await week3Btn.click()
    await expect(week3Btn).toHaveAttribute('aria-pressed', 'true')
    await expect(week1Btn).toHaveAttribute('aria-pressed', 'false')

    // 1-click Insert Deload Week adds week (12 -> 13 Weeks)
    await cockpit.getByRole('button', { name: /Insert Deload Week/i }).click()
    await cockpit.getByLabel(/Coach Clinical Memo for Athlete/i).fill('Active recovery week after peak travel block.')
    await cockpit.getByRole('button', { name: 'Confirm Modulation' }).click()

    await expect(cockpit.getByText('13 Weeks')).toBeVisible()
    await expect(cockpit.getByRole('status')).toContainText('Active Restorative Deload inserted at Week 3.')

    // Reset Baseline uses non-blocking inline confirmation (never window.confirm) with Cancel focused first
    await cockpit.getByRole('button', { name: /Reset Baseline/i }).click()
    expect(browserConfirmFired).toBe(false)
    await expect(cockpit.getByText(/Reset Macrocycle to Default 12-Week NASM OPT™ Baseline\?/i)).toBeVisible()
    await expect(cockpit.getByRole('button', { name: 'Cancel' })).toBeFocused()

    await cockpit.getByRole('button', { name: 'Confirm Reset Baseline' }).click()
    await expect(cockpit.getByText('12 Weeks')).toBeVisible()

    // Save & Sync Macrocycle dispatches POST /api/coach/clients/[id]/periodization
    let syncedPlanWeeks = 0
    await page.route('**/api/coach/clients/athlete-marcus-01/periodization', async route => {
      const body = route.request().postDataJSON() as { plan?: { totalWeeks?: number } }
      syncedPlanWeeks = body?.plan?.totalWeeks ?? 0
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, plan: body.plan }),
      })
    })
    // Prevent router.push navigation after 1500ms from leaving harness during assertion
    await cockpit.getByRole('button', { name: /Save & Sync Macrocycle/i }).click()
    await expect(cockpit.getByRole('status')).toContainText('Macrocycle periodization calibrated!')
    expect(syncedPlanWeeks).toBe(12)
  })

  test('operates native <dialog> modals for Waive Live Consultation and Client Status Audit with validation', async ({ page }) => {
    // 1. Waive Live Consultation native <dialog>
    await page.getByRole('button', { name: /Skip Consult \(Client Opted Out\)/i }).click()
    const waiveDialog = page.getByRole('dialog', { name: /WAIVE LIVE CONSULTATION\?/i })
    await expect(waiveDialog).toBeVisible()
    await expect(waiveDialog.getByRole('button', { name: 'Cancel' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(waiveDialog).toBeHidden()

    let waiveCalled = false
    await page.route('**/api/coach/clients/athlete-marcus-01/waive-consult', async route => {
      waiveCalled = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    })

    await page.getByRole('button', { name: /Skip Consult \(Client Opted Out\)/i }).click()
    await expect(waiveDialog).toBeVisible()
    await waiveDialog.getByRole('button', { name: /Confirm & Fast-Track/i }).click()
    await expect(waiveDialog).toBeHidden()
    expect(waiveCalled).toBe(true)

    // 2. Manage Client Status native <dialog> audit validation + PATCH submission
    await page.getByRole('button', { name: 'Manage Client Status' }).click()
    const statusDialog = page.getByRole('dialog', { name: /Manage Client Status: Marcus Vance/i })
    await expect(statusDialog).toBeVisible()

    // Paused is pre-selected for an active client
    const pausedBtn = statusDialog.getByRole('button', { name: /^paused/i })
    await expect(pausedBtn).toHaveAttribute('aria-pressed', 'true')

    // Submitting without reason code triggers accessible role="alert"
    await statusDialog.getByRole('button', { name: /Record Audit & Transition Status/i }).click()
    await expect(statusDialog.getByRole('alert')).toContainText('Please select a structured reason code')

    // Selecting injury_medical_leave (requiresNotes: true) without notes triggers mandatory notes validation
    const reasonSelect = statusDialog.getByLabel(/2\. Structured Audit Reason Code/i)
    await reasonSelect.selectOption('injury_medical_leave')
    await statusDialog.getByRole('button', { name: /Record Audit & Transition Status/i }).click()
    await expect(statusDialog.getByRole('alert')).toContainText('Clinical notes are required')

    // Filling notes and submitting dispatches PATCH /api/coach/clients/[id]/status and closes modal
    let patchedBody: Record<string, unknown> | null = null
    await page.route('**/api/coach/clients/athlete-marcus-01/status', async route => {
      patchedBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    })

    await statusDialog.getByLabel(/3\. Clinical \/ Operational Notes/i).fill('Orthopedic clearance hold for 14 days.')
    await statusDialog.getByRole('button', { name: /Record Audit & Transition Status/i }).click()
    await expect(statusDialog).toBeHidden()
    expect(patchedBody).toMatchObject({
      newStatus: 'paused',
      reasonCode: 'injury_medical_leave',
      reasonNotes: 'Orthopedic clearance hold for 14 days.',
    })
    await expect(page.getByTestId('status-updated-count')).toHaveText('1')
  })

  test('maintains zero horizontal overflow and >= 44px touch targets at 375px and 320px viewports', async ({ page }) => {
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 })
      const overflowPx = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflowPx, `Horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
    }

    const manageBtnBox = await page.getByRole('button', { name: 'Manage Client Status' }).boundingBox()
    expect(manageBtnBox!.height).toBeGreaterThanOrEqual(44)

    const allHubsBox = await page.getByRole('button', { name: /All Hubs/i }).boundingBox()
    expect(allHubsBox!.height).toBeGreaterThanOrEqual(44)
  })
})
