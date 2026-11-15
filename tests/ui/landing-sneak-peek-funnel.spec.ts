import { expect, test } from '@playwright/test'

test.describe('Feature #12: Public Landing Showcase, Interactive 4-Tab Sneak Peek & Founding Funnel', () => {
  test('Pre-launch Founding Cohort splash (/?splash=1) enforces validation, mints Founding Pass, and fits 320px viewports cleanly', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', err => pageErrors.push(err.message))

    let waitlistBody: Record<string, unknown> | null = null
    await page.route('**/api/waitlist', async route => {
      waitlistBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/?splash=1')

    // Verify countdown HUD, SFX default muted, and Founding Cohort scarcity badge
    await expect(
      page.getByRole('heading', { name: /Don’t wait for January to repair what November broke/i })
    ).toBeVisible()
    await expect(page.getByText(/12 of 50 Spots Left/i)).toBeVisible()
    const sfxBtn = page.getByRole('button', { name: 'Sound effects' })
    await expect(sfxBtn).toHaveAttribute('aria-pressed', 'false')
    const sfxBox = await sfxBtn.boundingBox()
    expect(sfxBox?.width ?? 0).toBeGreaterThanOrEqual(44)
    expect(sfxBox?.height ?? 0).toBeGreaterThanOrEqual(44)

    // Verify form inputs start with aria-invalid="false" (no premature invalid state)
    const nameInput = page.getByLabel(/Full Name \*/i)
    const emailInput = page.getByLabel(/Email Address \*/i)
    await expect(nameInput).toHaveAttribute('aria-invalid', 'false')
    await expect(emailInput).toHaveAttribute('aria-invalid', 'false')

    // 1. Submit empty form -> focuses Full Name and sets aria-invalid="true" + role="alert"
    const reservationForm = page.locator('form')
    const submitBtn = reservationForm.getByRole('button', {
      name: /Claim Your Founding Member Pass/i,
    })
    await submitBtn.click()
    await expect(reservationForm.getByRole('alert')).toContainText(/Please enter your full name/i)
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true')

    // Typing clears error & resets aria-invalid="false" immediately
    await nameInput.fill('Jordan Rivera')
    await expect(nameInput).toHaveAttribute('aria-invalid', 'false')
    await expect(reservationForm.getByRole('alert')).toHaveCount(0)

    // 2. Submit invalid email -> sets aria-invalid="true" on Email Address
    await emailInput.fill('not-an-email')
    await submitBtn.click()
    await expect(reservationForm.getByRole('alert')).toContainText(
      /Please enter a valid email address/i
    )
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true')

    // Expand optional SMS alert field & complete valid submission
    await emailInput.fill('jordan.rivera@example.com')
    await expect(emailInput).toHaveAttribute('aria-invalid', 'false')
    const smsToggle = page.getByRole('button', { name: /\+ Add SMS launch alert/i })
    await smsToggle.click()
    await page.getByLabel(/Mobile Number/i).fill('+1 413 555 0144')

    await submitBtn.click()

    // Verify minted Founding Member Pass confirmation & payload contract
    await expect(page.getByText(/Founding Reservation Confirmed/i)).toBeVisible()
    await expect(page.getByText(/Welcome to the Founding Cohort, Jordan/i)).toBeVisible()
    await expect(page.getByText(/FORGE-HOLIDAY-2026-\d{4}/)).toBeVisible()
    expect(waitlistBody).toMatchObject({
      email: 'jordan.rivera@example.com',
      firstName: 'Jordan Rivera',
      source: 'holiday_unmasking_drop',
      phone: '+1 413 555 0144',
      profileType: 'posture_joint_health',
    })

    // Verify 5-chapter film scrubber aria-pressed & >= 44px touch targets
    const chapter03 = page.getByRole('button', { name: /03.*20m Express & Hotel Travel/i })
    await chapter03.click()
    await expect(chapter03).toHaveAttribute('aria-pressed', 'true')
    const chapterBox = await chapter03.boundingBox()
    expect(chapterBox?.height ?? 0).toBeGreaterThanOrEqual(44)

    const unmuteBtn = page.getByRole('button', { name: /Unmute showcase video audio/i })
    const unmuteBox = await unmuteBtn.boundingBox()
    expect(unmuteBox?.height ?? 0).toBeGreaterThanOrEqual(44)

    // Narrow 320px horizontal overflow check
    await page.setViewportSize({ width: 320, height: 740 })
    const overflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow320).toBeLessThanOrEqual(1)
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })

  test('Unmasked Landing (/?unmasked=true): Hero LCP priority, Interactive 4-Tab Sneak Peek keyboard & sandbox flow, Pricing, FAQ & Native App Dialog', async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', err => pageErrors.push(err.message))

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/?unmasked=true')

    // 1. Hero LCP image priority & below-the-fold lazy video attributes
    const heroImg = page.locator('.forge-hero-main-img')
    await expect(heroImg).toBeVisible()
    await expect(heroImg).toHaveAttribute('fetchpriority', 'high')

    const showcaseVideo = page.locator('video[aria-label="Forge Athletic ecosystem walkthrough film"]')
    await expect(showcaseVideo).toHaveAttribute('loading', 'lazy')
    await expect(showcaseVideo).toHaveAttribute('width', '1280')
    await expect(showcaseVideo).toHaveAttribute('height', '720')

    // 2. Interactive 4-Tab Sneak Peek (#sneak-peek)
    const sneakSection = page.locator('#sneak-peek')
    const tablist = sneakSection.getByRole('tablist', {
      name: /Interactive Forge Athletic product previews/i,
    })
    await expect(tablist).toHaveAttribute('data-hydrated', 'true')

    const tabs = tablist.getByRole('tab')
    await expect(tabs).toHaveCount(4)
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true')

    // Verify forced-colors-safe ::after underline border on selected tab
    const selectedAfterBorder = await tabs.nth(0).evaluate(el => {
      const style = window.getComputedStyle(el, '::after')
      return style.borderBottomWidth
    })
    expect(parseFloat(selectedAfterBorder)).toBeGreaterThanOrEqual(2)

    // Keyboard roving navigation: ArrowRight -> Tab 02, End -> Tab 04, Home -> Tab 01
    await tabs.nth(0).focus()
    await page.keyboard.press('ArrowRight')
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(sneakSection.getByText(/FORGE LAB \/\/ Desk Ergonomics Audit/i)).toBeVisible()

    await page.keyboard.press('End')
    await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true')
    await expect(sneakSection.getByText(/FORGE LAB \/\/ Express & Travel Engine/i)).toBeVisible()

    // Exercise Tab 04 interactive sandbox controls: 20m Express vs 45m Full Block + Environment + Readiness
    const prescriptionPill = sneakSection.getByTestId('sneak-peek-express-prescription-pill')
    await expect(prescriptionPill).toContainText('2 × 10–12 · 45s Density Rest (~18m Total)')

    const fullBlockBtn = sneakSection.getByRole('button', { name: /45m Full Block/i })
    await fullBlockBtn.click()
    await expect(fullBlockBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(prescriptionPill).toContainText('4 × 8–10 · 90s Rest (~45m Standard)')

    const homeDumbbellsBtn = sneakSection.getByRole('button', { name: /Home Dumbbells/i })
    await homeDumbbellsBtn.click()
    await expect(homeDumbbellsBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(sneakSection.getByText(/Heels-Elevated Goblet Squat/i)).toBeVisible()

    // Verify Readiness preset pills meet >= 44px touch target and update Forge Readiness Index
    const smoothPresetBtn = sneakSection.getByRole('button', { name: /Smooth & Unrestricted/i })
    const presetBox = await smoothPresetBtn.boundingBox()
    expect(presetBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    await smoothPresetBtn.click()
    await expect(smoothPresetBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(sneakSection.getByText(/0s added · Cleared for Set 1/i)).toBeVisible()

    // 3. 3-Tier Founding Rate Lock Pricing Grid (#pricing)
    const pricingSection = page.locator('#pricing')
    await expect(pricingSection.getByText('$19.99', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('$49.00', { exact: true })).toBeVisible()
    await expect(pricingSection.getByText('$199.00', { exact: true })).toBeVisible()
    await expect(pricingSection.locator('a[href="/auth/signup?plan=core_lab"]')).toBeVisible()
    await expect(pricingSection.locator('a[href="/auth/signup?plan=plus"]')).toBeVisible()
    await expect(pricingSection.locator('a[href="/auth/signup?plan=coach_support"]')).toBeVisible()

    // 4. FAQ Accordion (#faq) native <details>/<summary> toggle
    const faqSection = page.locator('#faq')
    const secondFaqDetails = faqSection.locator('details').nth(1)
    await expect(secondFaqDetails).not.toHaveAttribute('open', '')
    await secondFaqDetails.locator('summary').click()
    await expect(secondFaqDetails).toHaveAttribute('open', '')

    // 5. Native <dialog closedby="any"> AppStorePlaceholderModal (#mobile-apps)
    const testFlightGuideBtn = page
      .locator('#mobile-apps')
      .getByRole('button', { name: /TestFlight & PWA Guide/i })
    await testFlightGuideBtn.click()

    const nativeDialog = page.locator('dialog.forge-app-placeholder-dialog')
    await expect(nativeDialog).toBeVisible()
    await expect(nativeDialog).toHaveAttribute('open', '')
    await expect(nativeDialog).toHaveAttribute('closedby', 'any')
    // Ensure body.style.overflow was NOT mutated to 'hidden'
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow)
    expect(bodyOverflow).not.toBe('hidden')

    // Switch platform tab inside native dialog & dismiss with Escape
    await nativeDialog.getByRole('tab', { name: /Web App \(PWA\)/i }).click()
    await expect(
      nativeDialog.getByText(/Progressive Web App: Live & Full In-Gym Capability/i)
    ).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(nativeDialog).toHaveCount(0)

    // 6. Verify 320px narrow mobile responsiveness on unmasked landing + mobile section nav
    await page.setViewportSize({ width: 320, height: 740 })
    await expect(page.getByRole('navigation', { name: /Mobile section navigation/i })).toBeVisible()
    const unmaskedOverflow320 = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(unmaskedOverflow320).toBeLessThanOrEqual(1)
    expect(pageErrors).toEqual([])
  })

  test('Respects prefers-reduced-motion: reduce by pausing showcase videos and renders /preview parity', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 375, height: 812 },
    })
    const page = await context.newPage()

    await page.goto('/preview')
    await expect(page.getByText(/INTERNAL PREVIEW:/i)).toBeVisible()
    await expect(page.getByRole('navigation', { name: /Mobile section navigation/i })).toBeVisible()

    const showcaseVideo = page.locator(
      'video[aria-label="Forge Athletic ecosystem walkthrough film"]'
    )
    await expect
      .poll(() =>
        showcaseVideo.evaluate((v: HTMLVideoElement) => ({
          paused: v.paused,
          hasAutoplay: v.hasAttribute('autoplay'),
        }))
      )
      .toEqual({ paused: true, hasAutoplay: false })

    await context.close()
  })
})
