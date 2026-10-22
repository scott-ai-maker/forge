import { test, expect } from "@playwright/test"

test.describe("Mobile iPhone Exercise Image Layout Suite", () => {
  test.describe("iPhone 15 Pro Viewport (393x852)", () => {
    test.use({
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    })

    test("renders compact accessible form previews and opens the full demonstration on demand", async ({ page }) => {
      await page.goto("/test-harness/fitness-mobile")
      await page.getByRole('button', { name: '2. Lifts', exact: true }).click()

      // 1. Verify collapsed summary row displays thumbnail image on mobile
      const benchItem = page.locator("#exercise-item-1-0")
      await expect(benchItem).toBeVisible({ timeout: 15000 })

      const summary = benchItem.locator("summary").first()
      await expect(summary).toBeVisible()

      // The 44x44 thumbnail inside summary
      const summaryImg = summary.locator("img")
      await expect(summaryImg).toBeVisible()
      await expect(summaryImg).toHaveAttribute("alt", "Barbell Flat Bench Press")

      const imgBox = await summaryImg.boundingBox()
      expect(imgBox).not.toBeNull()
      expect(imgBox!.width).toBeGreaterThanOrEqual(40)
      expect(imgBox!.height).toBeGreaterThanOrEqual(40)

      // The header thumbnail opens the full demonstration without a second preview.
      const banner = benchItem.getByRole("button", { name: "Watch form demonstration for Barbell Flat Bench Press" })
      await expect(banner).toBeVisible()

      const bannerImg = banner.locator("img")
      await expect(bannerImg).toBeVisible()
      await expect(bannerImg).toHaveAttribute("alt", "Barbell Flat Bench Press")

      const bannerBox = await banner.boundingBox()
      expect(bannerBox).not.toBeNull()
      expect(bannerBox!.width).toBeGreaterThanOrEqual(44)
      expect(bannerBox!.height).toBeGreaterThanOrEqual(44)

      // 3. Open NASM Video & Form Modal by tapping the demonstration banner
      await banner.click()
      await page.waitForTimeout(300)

      const modalHeading = page.getByRole("heading", { name: "Barbell Flat Bench Press" })
      await expect(modalHeading).toBeVisible()

      // Verify modal hero renders verified form photo
      const formPhotoTab = page.getByRole("button", { name: "Verified Form Photo" })
      const videoDemoTab = page.getByRole("button", { name: "Video Demonstration", exact: true })
      await expect(formPhotoTab).toBeVisible()
      await expect(videoDemoTab).toBeVisible()

      // Switch to video tab
      await videoDemoTab.click()
      await page.waitForTimeout(300)
      const iframe = page.locator("iframe[title*='Official NASM Exercise Video']")
      await expect(iframe).toBeVisible()

      // Switch back to photo tab
      await formPhotoTab.click()
      await page.waitForTimeout(300)
      const modalImg = page.locator("img[alt='Barbell Flat Bench Press']").last()
      await expect(modalImg).toBeVisible()

      // Close modal
      const closeBtn = page.getByRole("button", { name: "✕" })
      await closeBtn.click()
      await page.waitForTimeout(200)
      await expect(modalHeading).not.toBeVisible()

      // 4. Test expanding exercise 2 (Incline Dumbbell Bench Press)
      const inclineItem = page.locator("#exercise-item-1-1")
      await expect(inclineItem).toBeVisible()
      const inclineSummary = inclineItem.locator("summary").first()
      await inclineSummary.click()
      await page.waitForTimeout(300)

      const inclineBanner = inclineItem.getByRole("button", { name: "Watch form demonstration for Incline Dumbbell Bench Press" })
      await expect(inclineBanner).toBeVisible()
      const inclineBannerImg = inclineBanner.locator("img")
      await expect(inclineBannerImg).toBeVisible()
      await expect(inclineBannerImg).toHaveAttribute("alt", "Incline Dumbbell Bench Press")
    })
  })

  test.describe("iPhone SE Viewport (375x667)", () => {
    test.use({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    })

    test("renders compact 44x44 thumbnails without horizontal overflow on iPhone SE", async ({ page }) => {
      await page.goto("/test-harness/fitness-mobile")
      await page.getByRole('button', { name: '2. Lifts', exact: true }).click()

      const benchItem = page.locator("#exercise-item-1-0")
      await expect(benchItem).toBeVisible({ timeout: 15000 })

      // Summary thumbnail is visible
      const summaryImg = benchItem.locator("summary img")
      await expect(summaryImg).toBeVisible()

      // Verify exercise row and container stay strictly within viewport
      const benchBox = await benchItem.boundingBox()
      expect(benchBox).not.toBeNull()
      expect(benchBox!.width).toBeLessThanOrEqual(375)

      const reps = benchItem.getByRole("textbox", { name: "Number of reps" })
      const weight = benchItem.getByRole("textbox", { name: "Weight in pounds" })
      const repsBox = await reps.boundingBox()
      const weightBox = await weight.boundingBox()
      expect(repsBox).not.toBeNull()
      expect(weightBox).not.toBeNull()
      expect(Math.abs(repsBox!.y - weightBox!.y)).toBeLessThan(2)
      expect(repsBox!.width).toBeGreaterThanOrEqual(50)
      expect(weightBox!.width).toBeGreaterThanOrEqual(50)
      const increment = await benchItem.getByRole("button", { name: "Increase weight" }).boundingBox()
      expect(increment?.width).toBeGreaterThanOrEqual(34)
      expect(increment?.height).toBeGreaterThanOrEqual(44)
      await weight.fill("95")
      await reps.fill("8")
      await expect(benchItem.getByRole("button", { name: "Log set & start rest", exact: true })).toBeVisible()
      await expect(weight).toHaveValue("95")
      await expect(reps).toHaveValue("8")
    })
  })
})
