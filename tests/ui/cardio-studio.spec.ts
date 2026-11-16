import { expect, test } from "@playwright/test"

test.describe("AI Voice Cardio Studio & In-Ear Biomechanical Coaching Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/test-harness/cardio-studio")
    await page.waitForSelector('[data-hydrated="true"]')
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
    await expect(page.getByText("Workout time", { exact: true })).toBeVisible()
    await expect(page.getByText("Calories burned", { exact: true })).toBeVisible()
    await expect(page.getByText(/Breathing consistency: \d+%/i)).toBeVisible()

    // Click Flow to Cool-Down
    const coolDownBtn = page.getByRole("button", { name: /Flow to Cool-Down/i })
    await expect(coolDownBtn).toBeVisible()
    await coolDownBtn.click()

    // Verify harness feedback received the callback
    await expect(page.getByTestId("cooldown-flow-feedback")).toBeVisible()
  })
})

test.describe("Cardio Stage Studio, Web Bluetooth GATT & Apple Watch Companion Bridge (?scenario=suite)", () => {
  test("verifies Tanaka HRmax/HRR sliders, Beta-Blocker RPE mode, Rockport/YMCA screens, and CardioLogForm submission with null optional fields", async ({ page }) => {
    let capturedPayload = null as Record<string, unknown> | null
    await page.route("**/api/fitness/cardio", async (route) => {
      capturedPayload = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: { "Cache-Control": "no-store, max-age=0" },
        body: JSON.stringify({
          id: "cardio-log-14",
          session_date: capturedPayload.session_date,
          activity_type: capturedPayload.activity_type,
          duration_mins: capturedPayload.duration_mins,
          distance_km: capturedPayload.distance_km,
          avg_heart_rate: capturedPayload.avg_heart_rate,
          calories: capturedPayload.calories,
          perceived_effort: capturedPayload.perceived_effort,
          notes: capturedPayload.notes,
        }),
      })
    })

    await page.goto("/test-harness/cardio-studio?scenario=suite")
    await page.waitForSelector('[data-hydrated="true"]')

    // Expand Stage Studio & VO2max disclosure
    const studioToggle = page.getByRole("button", { name: /Stage Studio & VO2max/i })
    await expect(studioToggle).toHaveAttribute("aria-expanded", "false")
    await studioToggle.click()
    await expect(studioToggle).toHaveAttribute("aria-expanded", "true")

    // Verify Tanaka HRmax for default age 35 (208 - 0.7 * 35 = 183.5 -> 184 BPM) & HRR (184 - 60 = 124 BPM)
    await expect(page.getByText("184").first()).toBeVisible()
    await expect(page.getByText("124").first()).toBeVisible()

    // Adjust Athlete Age slider to 40 -> Tanaka HRmax = 208 - 28 = 180 BPM, HRR = 120 BPM
    const ageSlider = page.getByLabel("Athlete Age:")
    await ageSlider.fill("40")
    await expect(ageSlider).toHaveAttribute("aria-valuetext", "40 years")
    await expect(page.getByText("180").first()).toBeVisible()
    await expect(page.getByText("120").first()).toBeVisible()

    // Toggle Beta-Blocker / BP Medication Mode and verify clinical guidance status alert
    const medCheckbox = page.getByLabel(/Beta-Blocker \/ BP Medication Mode/i)
    await expect(medCheckbox).not.toBeChecked()
    await medCheckbox.check()
    await expect(medCheckbox).toBeChecked()
    await expect(page.getByText(/Pharmacological Heart Rate Alert/i)).toBeVisible()

    // Test Rockport 1-Mile Walk Test VO2max screen
    await page.getByRole("button", { name: "Rockport 1-Mile Test" }).click()
    await page.getByLabel(/Time to Complete \(Minutes\)/i).fill("13.5")
    await page.getByLabel(/Finish Heart Rate \(BPM\)/i).fill("132")
    await page.getByRole("button", { name: "Calculate VO2 Max" }).click()
    await expect(page.getByText("mL/kg/min", { exact: true })).toBeVisible()
    await expect(page.getByText(/Rating:/i)).toBeVisible()

    // Test YMCA 3-Min Step Test screen
    await page.getByRole("button", { name: "YMCA 3-Min Step Test" }).click()
    await page.getByLabel(/1-Minute Recovery Heart Rate/i).fill("92")
    await page.getByRole("button", { name: "Evaluate Recovery Rating" }).click()
    await expect(page.getByText(/Autonomic Recovery Pulse Rating/i)).toBeVisible()
    await expect(page.getByText(/Recommended Starting Protocol: Stage/i)).toBeVisible()

    // Return to 3-Stage Protocols, select Stage 2, and load into Cardio Log Draft
    await page.getByRole("button", { name: "3-Stage Protocols" }).click()
    await page.getByRole("button", { name: /Stage 2: VT1 Intervals/i }).click()
    await page.getByRole("button", { name: /Load into Cardio Log Draft/i }).click()

    // Verify CardioLogForm opened with pre-populated duration and optional fields left empty
    const durationInput = page.getByLabel(/Duration \(min\)/i)
    await expect(durationInput).toBeVisible()
    await page.getByLabel(/Perceived Exertion \(RPE 1-10\)/i).fill("7")
    await page.getByRole("button", { name: /Log Cardio Session/i }).click()

    expect(capturedPayload).not.toBeNull()
    expect(capturedPayload?.distance_km).toBeNull()
    expect(capturedPayload?.avg_heart_rate).toBeNull()
    expect(capturedPayload?.calories).toBeNull()
    expect(capturedPayload?.perceived_effort).toBe(7)
    await expect(page.getByText(/No cardio sessions logged yet/i)).not.toBeVisible()
  })

  test("streams mocked Web Bluetooth GATT 8-bit, truncated, and 16-bit heart_rate_measurement packets and cleans up on disconnect", async ({ page }) => {
    await page.addInitScript(() => {
      const listeners: Array<(ev: unknown) => void> = []
      let disconnectCount = 0
      let stopNotificationsCount = 0

      ;(window as unknown as Record<string, unknown>).__btTelemetryTest = {
        emitPacket(bytes: number[]) {
          const buffer = new Uint8Array(bytes).buffer
          const dv = new DataView(buffer)
          for (const fn of listeners) {
            fn({ target: { value: dv } })
          }
        },
        getStats() {
          return { disconnectCount, stopNotificationsCount, listenerCount: listeners.length }
        },
      }

      const characteristic = {
        async startNotifications() {},
        async stopNotifications() {
          stopNotificationsCount += 1
        },
        addEventListener(type: string, cb: (ev: unknown) => void) {
          if (type === "characteristicvaluechanged") listeners.push(cb)
        },
        removeEventListener(type: string, cb: (ev: unknown) => void) {
          if (type === "characteristicvaluechanged") {
            const idx = listeners.indexOf(cb)
            if (idx >= 0) listeners.splice(idx, 1)
          }
        },
      }

      Object.defineProperty(navigator, "bluetooth", {
        configurable: true,
        value: {
          async requestDevice() {
            return {
              name: "Polar H10 Strap",
              gatt: {
                connected: true,
                async connect() {
                  return {
                    async getPrimaryService() {
                      return {
                        async getCharacteristic() {
                          return characteristic
                        },
                      }
                    },
                  }
                },
                disconnect() {
                  disconnectCount += 1
                },
              },
              addEventListener() {},
              removeEventListener() {},
            }
          },
        },
      })
    })

    const pageErrors: string[] = []
    page.on("pageerror", (err) => pageErrors.push(err.message))

    await page.goto("/test-harness/cardio-studio?scenario=suite")
    await page.waitForSelector('[data-hydrated="true"]')

    const pairBtn = page.getByRole("button", { name: /Pair HR Sensor/i })
    await expect(pairBtn).toBeEnabled()
    await pairBtn.click()

    await expect(page.getByRole("heading", { name: "Polar H10 Strap" })).toBeVisible()

    // 1) 8-bit BPM packet: flags=0x00, bpm=148
    await page.evaluate(() => {
      ;(window as unknown as { __btTelemetryTest: { emitPacket: (b: number[]) => void } }).__btTelemetryTest.emitPacket([0x00, 148])
    })
    await expect(page.getByText("148", { exact: true })).toBeVisible()

    // 2) Truncated 16-bit packet (flags=0x01 claims 16-bit uint16 at byteOffset 1, but only 2 bytes total -> must be safely ignored without RangeError!)
    await page.evaluate(() => {
      ;(window as unknown as { __btTelemetryTest: { emitPacket: (b: number[]) => void } }).__btTelemetryTest.emitPacket([0x01, 0x90])
    })
    expect(pageErrors).toEqual([])
    await expect(page.getByText("148", { exact: true })).toBeVisible()

    // 3) Valid 16-bit little-endian BPM packet: flags=0x01, uint16=164 ([0x01, 164, 0x00])
    await page.evaluate(() => {
      ;(window as unknown as { __btTelemetryTest: { emitPacket: (b: number[]) => void } }).__btTelemetryTest.emitPacket([0x01, 164, 0x00])
    })
    await expect(page.getByText("164", { exact: true })).toBeVisible()

    // Sync stats (avg of 148 and 164 = 156 BPM, max = 164 BPM)
    await page.getByRole("button", { name: /Fill Stats \(156 BPM\)/i }).click()
    await expect(page.getByTestId("bt-synced-stats-banner")).toContainText("Avg 156 BPM · Max 164 BPM")

    // Disconnect and verify GATT listener + connection cleanup
    await page.getByRole("button", { name: "Disconnect", exact: true }).click()
    const cleanupStats = await page.evaluate(() => {
      return (window as unknown as {
        __btTelemetryTest: { getStats: () => { disconnectCount: number; stopNotificationsCount: number; listenerCount: number } }
      }).__btTelemetryTest.getStats()
    })
    expect(cleanupStats.disconnectCount).toBe(1)
    expect(cleanupStats.stopNotificationsCount).toBe(1)
    expect(cleanupStats.listenerCount).toBe(0)
  })

  test("validates Apple Watch native modal <dialog>, Option B superset 1A -> 1B 0s transition, Cardio tab protocol, Escape close & focus return", async ({ page }) => {
    await page.goto("/test-harness/cardio-studio?scenario=suite")
    await page.waitForSelector('[data-hydrated="true"]')

    const launchBtn = page.getByRole("button", { name: "Launch Apple Watch Simulator" })
    await launchBtn.focus()
    await launchBtn.click()

    const watchDialog = page.locator("dialog.apple-watch-sim-dialog")
    await expect(watchDialog).toBeVisible()
    await expect(watchDialog).toHaveAttribute("open", "")
    await expect(watchDialog).toHaveAttribute("closedby", "any")

    // Verify station 1A Barbell Bench Press is active
    await expect(watchDialog.getByText("Barbell Bench Press")).toBeVisible()
    await watchDialog.getByRole("button", { name: /LOG SET 1 OF 3/i }).click()

    // Option B Confirm & Edit: bump weight +5 (185 -> 190) and confirm 1A -> 1B
    await watchDialog.getByRole("button", { name: "+5", exact: true }).click()
    await watchDialog.getByRole("button", { name: /CONFIRM → 1B NEXT/i }).click()

    // Verify harness received logged set and watch immediately transitioned to 1B Bent-Over Barbell Row
    await expect(page.getByTestId("watch-set-logged-banner")).toContainText("Barbell Bench Press · Set #1 · 10 reps @ 190 lbs")
    await expect(watchDialog.getByText("Bent-Over Barbell Row", { exact: true })).toBeVisible()

    // Switch to 3. Cardio tab and verify cardioProtocol renders alongside simulated HR slider
    await watchDialog.getByRole("button", { name: "3. Cardio" }).click()
    await expect(watchDialog.getByText("Zone 2 Aerobic Engine (20m)")).toBeVisible()

    const watchHrSlider = watchDialog.getByLabel("Simulate Optical Heart Rate:")
    await watchHrSlider.fill("168")
    await expect(watchHrSlider).toHaveAttribute("aria-valuetext", "168 BPM")
    await expect(watchDialog.getByText(/Zone 3 · Peak Anaerobic/i)).toBeVisible()

    // Press Escape to dismiss native modal <dialog> and verify focus returns to invoker button
    await page.keyboard.press("Escape")
    await expect(watchDialog).not.toBeVisible()
    await expect(launchBtn).toBeFocused()
  })

  test("validates CoachCardioPrescriber, ActiveRestCardioPacerTray neutral-grip guardrail, and 320px zero-overflow mobile layout", async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })
    page.on("pageerror", (err) => pageErrors.push(err.message))

    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto("/test-harness/cardio-studio?scenario=suite")
    await page.waitForSelector('[data-hydrated="true"]')

    // ActiveRestCardioPacerTray tabs & Hammer Curl neutral grip guardrail
    const mobilityTab = page.getByRole("button", { name: /Active Mobility/i })
    await mobilityTab.click()
    await expect(mobilityTab).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByText(/Brachioradialis|Wrist|Forearm/i).first()).toBeVisible()

    // CoachCardioPrescriber pattern + duration + memo + Save Prescription status
    const hiitPatternBtn = page.getByRole("button", { name: /HIIT 1:2 Threshold Intervals/i })
    await hiitPatternBtn.click()
    await expect(hiitPatternBtn).toHaveAttribute("aria-pressed", "true")

    await page.getByLabel(/Personalized Coach Directive \/ Memo/i).fill("Hold crisp nasal recovery between surges.")
    const saveRxBtn = page.getByRole("button", { name: /Save Prescription/i })
    await saveRxBtn.click()
    await expect(page.getByText("Saved to athlete plan")).toBeVisible()

    // Open Stage Studio on 320px viewport to verify zero horizontal overflow with expanded controls
    await page.getByRole("button", { name: /Stage Studio & VO2max/i }).click()

    const overflowMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    expect(overflowMetrics.scrollWidth).toBeLessThanOrEqual(overflowMetrics.innerWidth)

    // Verify >= 44px touch targets on primary interactive buttons
    for (const btn of [
      page.getByRole("button", { name: "Launch Apple Watch Simulator" }),
      page.getByRole("button", { name: /Stage Studio & VO2max/i }),
      page.getByRole("button", { name: /Log Cardio/i }).first(),
      mobilityTab,
    ]) {
      const box = await btn.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }

    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})
