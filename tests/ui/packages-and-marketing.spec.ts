import { expect, test } from '@playwright/test'

test.describe('Packages, Corporate Architecture & Marketing Feature Suite', () => {
  test('renders Forge Athletic memberships with current pricing', async ({ page }) => {
    await page.goto('/packages')

    await expect(page.getByText(/NASM VCS Certified Offerings/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /Train with a plan that fits your life/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Core' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Plus' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Coach Support' })).toBeVisible()
    await expect(page.getByText('$36.75')).toBeVisible()
    await expect(page.getByText('$74.25')).toBeVisible()
    await expect(page.getByText('$224.25')).toBeVisible()
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
