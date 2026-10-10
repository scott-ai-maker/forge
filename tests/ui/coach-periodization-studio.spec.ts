import { expect, test } from '@playwright/test'

test.describe('Coach Gordon AI Custom Program & Periodization Studio UI Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-harness/coach-periodization')
    await page.waitForSelector('[data-hydrated="true"]')
  })

  test('renders studio header, Gemini 3.8 badge, and client selector dropdown', async ({ page }) => {
    await expect(page.getByText('COACH GORDON AI CUSTOM PROGRAM STUDIO')).toBeVisible()
    await expect(page.getByText('Gemini 3.8 Flash Engine')).toBeVisible()

    const select = page.locator('#coach-studio-client-select')
    await expect(select).toBeVisible()

    // Default to first client (Scott Gordon)
    await expect(select).toHaveValue('athlete-scott')
    await expect(page.getByText('Scott Gordon')).toBeVisible()
  })

  test('switches target athlete and updates periodization context dynamically', async ({ page }) => {
    const select = page.locator('#coach-studio-client-select')
    
    // Switch to Jennifer Miller
    await select.selectOption('athlete-jennifer')
    await expect(page.getByText('Jennifer Miller')).toBeVisible()
    await expect(page.getByText('Runner knee discomfort on deep impact lunges')).toBeVisible()

    // Switch to Sandbox Mode
    await select.selectOption('sandbox-athlete')
    await expect(page.getByText('New Athlete / Template Sandbox')).toBeVisible()
  })

  test('opens and navigates the Coach AI Deep Personalization Drawer', async ({ page }) => {
    // Find and click the Deep Intake Drawer launcher button
    const openIntakeBtn = page.getByRole('button', { name: /Deep Intake/i }).or(page.getByText(/Personalization Drawer/i)).first()
    await expect(openIntakeBtn).toBeVisible()
    await openIntakeBtn.click()

    // Drawer should open with title
    await expect(page.getByText(/Athlete Personalization & Nuance Intake/i)).toBeVisible()

    // Verify key custom nuance intake sections
    await expect(page.getByText(/Movement Superpowers & Strict Exclusions/i)).toBeVisible()
    await expect(page.getByText(/Family & Real-World Functional Demands/i)).toBeVisible()
    await expect(page.getByText(/Nutrition Philosophy/i)).toBeVisible()

    // Verify Precision Nutrition Hand-Portions radio option
    const handPortionOption = page.getByText(/Precision Nutrition Hand-Portion Plate/i)
    await expect(handPortionOption).toBeVisible()

    // Close the drawer
    const closeBtn = page.getByRole('button', { name: /Cancel|Close/i }).first()
    await closeBtn.click()
    await expect(page.getByText(/Athlete Personalization & Nuance Intake/i)).not.toBeVisible()
  })
})
