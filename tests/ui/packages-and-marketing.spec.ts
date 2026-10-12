import { expect, test } from '@playwright/test'

test.describe('Packages, Corporate Architecture & Marketing Feature Suite', () => {
  test('renders Forge Athletic memberships with current pricing', async ({ page }) => {
    await page.goto('/packages')

    await expect(page.getByText(/Forge Athletic memberships/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Train with a plan that fits your life/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Core' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Plus' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Coach Support' })).toBeVisible()
    await expect(page.getByText('$19.99')).toBeVisible()
    await expect(page.getByText('$149/year')).toBeVisible()
    await expect(page.getByText('$49/month')).toBeVisible()
    await expect(page.getByText('$199/month')).toBeVisible()
  })

  test('renders corporate executive performance advisory and proposal inquiry', async ({ page }) => {
    await page.goto('/corporate')

    // Corporate Headline & Leadership
    await expect(page.getByText(/Wellness for teams/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /PRACTICAL TRAINING AND WELLNESS SUPPORT FOR TEAMS/i })).toBeVisible()

    // Proposal builder route
    await page.goto('/corporate/proposal')
    await expect(page.getByText(/Team Wellness Proposal/i).first()).toBeVisible()
  })

  test('renders What\'s New changelog and architectural audit dashboard', async ({ page }) => {
    await page.goto('/whats-new')
    await expect(page.getByText(/SEMANTIC RELEASE LOG/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /WHAT'S NEW & SYSTEM RELEASES/i })).toBeVisible()

    await page.goto('/audit')
    await expect(page.getByText(/Forge Athletic/i).first()).toBeVisible()
  })

  test('renders Forge Athletic early access inquiry form', async ({ page }) => {
    await page.goto('/waitlist')
    await expect(page.getByText(/Forge Athletic · Early Access Membership Updates/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Built From The Ground Up/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })
})
