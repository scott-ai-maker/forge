import { expect, test } from '@playwright/test'

test.describe('Packages, Corporate Architecture & Marketing Feature Suite', () => {
  test('renders packages page with tier comparison and concierge benefits', async ({ page }) => {
    await page.goto('/packages')

    // Header & Crest Badge
    await expect(page.getByText(/Sports Science Memberships & Private Retainers/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Sovereign Advisory Pathways/i })).toBeVisible()

    // Application CTA buttons linking to /apply
    const applyLinks = page.locator('a[href^="/apply"]')
    expect(await applyLinks.count()).toBeGreaterThanOrEqual(1)
  })

  test('renders corporate executive performance advisory and proposal inquiry', async ({ page }) => {
    await page.goto('/corporate')

    // Corporate Headline & Leadership
    await expect(page.getByText(/Institutional Executive Performance/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /ELITE SPORTS SCIENCE & BIOMECHANICS/i })).toBeVisible()

    // Proposal builder route
    await page.goto('/corporate/proposal')
    await expect(page.getByText(/Institutional Boardroom Proposal/i)).toBeVisible()
  })

  test('renders What\'s New changelog and architectural audit dashboard', async ({ page }) => {
    await page.goto('/whats-new')
    await expect(page.getByText(/SEMANTIC RELEASE LOG/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /WHAT'S NEW & SYSTEM RELEASES/i })).toBeVisible()

    await page.goto('/audit')
    await expect(page.getByText(/Gordon Athletic Advisory/i).first()).toBeVisible()
  })

  test('renders waitlist and inquiry capture form', async ({ page }) => {
    await page.goto('/waitlist')
    await expect(page.getByText(/Private Founding Cohort Intake/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Sovereign Physical Architecture/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
