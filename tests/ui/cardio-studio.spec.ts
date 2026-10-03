import { expect, test } from "@playwright/test"

test.describe("AI Voice Cardio Studio & In-Ear Biomechanical Coaching Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test-harness/cardio-studio")
    await page.waitForSelector("[data-hydrated=\"true\"]")
  })

  test("renders pre-session studio with protocol selection, duration pills, and equipment modalities", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Coach Gordon Cardio Studio" })
    await expect(dialog).toBeVisible()

    // 6 Science-based cardio protocols
    await expect(page.getByRole("button", { name: /Zone 2 Aerobic Engine/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /HIIT 1:2 Threshold Intervals/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /The Ascending & Descending Ladder/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Threshold Cruise & Over-Unders/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Tabata & Micro-Burst/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /Parasympathetic Recovery/i })).toBeVisible()

    // Switch protocol to Tabata Micro-Bursts
    const tabataBtn = page.getByRole("button", { name: /Tabata & Micro-Burst/i })
    await tabataBtn.click()
    await expect(page.getByText(/Tabata/i).first()).toBeVisible()

    // Switch protocol to HIIT and test duration selection
    const hiitBtn = page.getByRole("button", { name: /HIIT 1:2 Threshold Intervals/i })
    await hiitBtn.click()

    // Test duration pill click (10m)
    const tenMinPill = page.getByRole("button", { name: "10m", exact: true })
    if (await tenMinPill.isVisible()) {
      await tenMinPill.click()
      await expect(page.getByRole("button", { name: /START COACH GORDON CARDIO \(10 MIN\)/i })).toBeVisible()
    }
  })

  test("toggles biomechanical form directives and outdoor GPS distance units", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Coach Gordon Cardio Studio" })
    await expect(dialog).toBeVisible()

    // Toggle Biomechanical Form Guide
    const formGuideToggle = page.getByRole("button", { name: /View Form Directives/i })
    await expect(formGuideToggle).toBeVisible()
    await formGuideToggle.click()
    await expect(page.getByText(/Coach Gordon Form Focus:/i)).toBeVisible()
    await expect(page.getByText(/Common Flaw to Avoid:/i)).toBeVisible()

    const hideGuideToggle = page.getByRole("button", { name: /Hide Form Directives/i })
    await hideGuideToggle.click()
    await expect(page.getByText(/Common Flaw to Avoid:/i)).not.toBeVisible()

    // Toggle Distance Units: KM and MI
    const kmBtn = page.getByRole("button", { name: "KM", exact: true })
    if (await kmBtn.isVisible()) {
      await kmBtn.click()
      const miBtn = page.getByRole("button", { name: "MI", exact: true })
      await miBtn.click()
    }
  })

  test("launches active workout HUD, validates timers, breathing pacer, and transport controls", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Coach Gordon Cardio Studio" })
    await expect(dialog).toBeVisible()

    // Start workout
    const startBtn = page.getByRole("button", { name: /START COACH GORDON CARDIO/i })
    await expect(startBtn).toBeVisible()
    await startBtn.click()

    // Live HUD active workout display
    await expect(page.getByText(/Interval Remaining/i)).toBeVisible()
    await expect(page.getByText(/RPE \d+ \/ 10/i)).toBeVisible()

    // Locomotor-Respiratory Coupling Breathing Pacer
    await expect(page.getByText(/Target Respiratory Cadence/i)).toBeVisible()
    await expect(page.getByText(/BREATHE IN|EXHALE/i).first()).toBeVisible()

    // Test Transport Controls: Pause and Resume
    const pauseBtn = page.getByRole("button", { name: "Pause Workout" })
    await expect(pauseBtn).toBeVisible()
    await pauseBtn.click()

    const resumeBtn = page.getByRole("button", { name: "Resume Workout" })
    await expect(resumeBtn).toBeVisible()
    await resumeBtn.click()

    // Test Spontaneous "Need A Push" Swift Kick Button
    const pushBtn = page.getByRole("button", { name: /Need a Push/i })
    await expect(pushBtn).toBeVisible()
    await pushBtn.click()
  })

  test("activates and unlocks OLED Pocket Touch Shield", async ({ page }) => {
    // Start workout
    const startBtn = page.getByRole("button", { name: /START COACH GORDON CARDIO/i })
    await startBtn.click()

    // Activate Pocket Lock Screen
    const pocketLockBtn = page.getByRole("button", { name: /Lock Screen for Pocket/i })
    await expect(pocketLockBtn).toBeVisible()
    await pocketLockBtn.click()

    // Verify OLED Pocket Touch Shield region is active
    const shield = page.getByRole("region", { name: "In-Pocket Touch Shield Active" })
    await expect(shield).toBeVisible()
    await expect(page.getByText("In-Pocket Touch Shield")).toBeVisible()

    // Double-click to unlock
    await shield.click()
    await shield.click()

    // Verify returned to standard live HUD
    await expect(shield).not.toBeVisible()
    await expect(page.getByText(/Interval Remaining/i)).toBeVisible()
  })

  test("skips intervals into Executive Cardio Debrief and flows into cool-down", async ({ page }) => {
    // Start workout
    const startBtn = page.getByRole("button", { name: /START COACH GORDON CARDIO/i })
    await startBtn.click()

    // Skip all intervals to trigger Executive Debrief
    const skipBtn = page.getByTitle(/Skip to Next Interval|Finish Workout & View Debrief/i)
    await expect(skipBtn).toBeVisible()

    // Click skip until Executive Debrief is displayed (maximum 10 clicks)
    for (let i = 0; i < 10; i++) {
      if (await page.getByText(/SESSION ACCOMPLISHED/i).isVisible()) break
      await skipBtn.click()
      await page.waitForTimeout(100)
    }

    // Verify Executive Debrief metrics
    await expect(page.getByText(/SESSION ACCOMPLISHED/i)).toBeVisible()
    await expect(page.getByText(/Active Duration/i)).toBeVisible()
    await expect(page.getByText(/Total Metabolic Burn/i)).toBeVisible()
    await expect(page.getByText(/Respiratory Compliance/i)).toBeVisible()

    // Click Flow to Cool-Down
    const coolDownBtn = page.getByRole("button", { name: /Flow to Cool-Down/i })
    await expect(coolDownBtn).toBeVisible()
    await coolDownBtn.click()

    // Verify harness feedback received the callback
    await expect(page.getByTestId("cooldown-flow-feedback")).toBeVisible()
  })
})
