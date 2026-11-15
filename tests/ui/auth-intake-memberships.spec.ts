import { expect, test } from '@playwright/test'

test.describe('Feature #1 — Auth, HIPAA-Grade Intake (PAR-Q+) & 3-Tier Founding Memberships', () => {
  test('1. /auth/login validates email/password, toggles password visibility accessibly, renders Coach surface, and handles reset flow', async ({
    page,
  }) => {
    await page.route('**/api/auth/password-reset', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.sgf-auth-form-shell[data-hydrated="true"]')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Athlete Login/i })).toBeVisible()

    // Submit empty form -> email validation fires and routes focus to #email-input
    await page.getByRole('button', { name: /^Sign In$/i }).click()
    const emailInput = page.locator('#email-input')
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('#email-error')).toContainText('Email is required')
    await expect(emailInput).toBeFocused()

    // Invalid email on blur, cleared immediately on valid input
    await emailInput.fill('not-an-email')
    await emailInput.blur()
    await expect(page.locator('#email-error')).toContainText('Enter a valid email address')
    await emailInput.fill('athlete@forge-athletic.app')
    await expect(page.locator('#email-error')).toHaveCount(0)

    // Accessible Show/Hide password toggle updates input type and aria-pressed
    const passwordInput = page.locator('#password-input')
    await passwordInput.fill('ForgePass99')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    const toggleBtn = page.getByRole('button', { name: 'Show password' })
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')
    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    const hideBtn = page.getByRole('button', { name: 'Hide password' })
    await expect(hideBtn).toHaveAttribute('aria-pressed', 'true')
    await hideBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Forgot password flow
    await page.getByRole('button', { name: /Forgot password\?/i }).click()
    await page.getByRole('button', { name: /Send Reset Link/i }).click()
    await expect(page.getByText(/Check your email — we sent a reset link/i)).toBeVisible()
    await page.getByRole('button', { name: /Back to Sign In/i }).click()
    await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeVisible()

    // Coach Console login surface (?next=/coach)
    await page.goto('/auth/login?next=/coach', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Coach Login/i })).toBeVisible()
    await expect(page.getByText(/Coach Access/i).first()).toBeVisible()
  })

  test('2. /auth/signup?plan=plus|core_lab|coach_support preserves Founding Rate Lock tier and enforces password + 18+ biometric consent', async ({
    page,
  }) => {
    await page.goto('/auth/signup?plan=plus', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.sgf-auth-form-shell[data-hydrated="true"]')).toBeVisible()

    const planBanner = page.getByTestId('selected-founding-plan-banner')
    await expect(planBanner).toBeVisible()
    await expect(planBanner).toContainText('Founding Member Rate Lock')
    await expect(planBanner).toContainText('Selected Plan: Plus')
    await expect(planBanner).toContainText('$49.00')
    await expect(planBanner).toContainText('$69.00')

    // Verify localStorage tier selection persisted
    const storedTier = await page.evaluate(() => window.localStorage.getItem('forge_tier_preview_v1'))
    expect(storedTier).toBe('plus')

    // Password complexity enforcement
    const emailInput = page.locator('#email-input')
    const passwordInput = page.locator('#password-input')
    await emailInput.fill('newmember@forge-athletic.app')

    await passwordInput.fill('short')
    await page.getByRole('button', { name: /Create Account/i }).click()
    await expect(page.locator('#password-error')).toContainText('at least 8 characters')

    await passwordInput.fill('lowercaseonly')
    await page.getByRole('button', { name: /Create Account/i }).click()
    await expect(page.locator('#password-error')).toContainText('uppercase letter')

    await passwordInput.fill('NoNumbersHere')
    await page.getByRole('button', { name: /Create Account/i }).click()
    await expect(page.locator('#password-error')).toContainText('contain a number')

    // Valid password satisfied, but 18+ legal & biometric consent unchecked -> blocks both Email Signup & OAuth
    await passwordInput.fill('StrongForge9')
    await expect(page.getByText('✓ Password meets requirements')).toBeVisible()

    await page.getByRole('button', { name: /Continue with Google/i }).click()
    await expect(page.locator('#legal-consent-error')).toContainText('confirm you are 18+')
    await expect(page.locator('#legal-consent-checkbox')).toBeFocused()

    // Also verify Core Lab ($19.99) and Coach Support ($199.00) plan banners
    await page.goto('/auth/signup?plan=core_lab', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('selected-founding-plan-banner')).toContainText('Selected Plan: Core Lab')
    await expect(page.getByTestId('selected-founding-plan-banner')).toContainText('$19.99')

    await page.goto('/auth/signup?plan=coach_support', { waitUntil: 'domcontentloaded' })
    await expect(page.getByTestId('selected-founding-plan-banner')).toContainText('Selected Plan: Coach Support')
    await expect(page.getByTestId('selected-founding-plan-banner')).toContainText('$199.00')
  })

  test('3. /auth/callback blocks protocol-relative and backslash open-redirect attacks', async ({ request }) => {
    for (const maliciousNext of ['//evil.example.com', '/\\evil.example.com', 'https://evil.example.com']) {
      const res = await request.get(`/auth/callback?next=${encodeURIComponent(maliciousNext)}`, {
        maxRedirects: 0,
      })
      expect([302, 307]).toContain(res.status())
      const location = res.headers()['location'] ?? ''
      const parsed = new URL(location, 'http://127.0.0.1:3000')
      expect(['127.0.0.1', 'localhost']).toContain(parsed.hostname)
      expect(parsed.pathname).toBe('/dashboard')
    }
  })

  test('4. HIPAA-Grade PAR-Q+ native <dialog> supports keyboard screening, dynamic OPT phase caps, Esc close, and ESIGN signature submission', async ({
    page,
  }) => {
    let savedParqPayload: Record<string, unknown> | null = null

    await page.addInitScript(() => {
      window.localStorage.removeItem('gaa_parq_answers')
    })

    await page.route('**/api/account/parq', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            answers: {
              hasHeartCondition: false,
              experiencesChestPain: false,
              experiencesDizzinessOrSyncope: false,
              hasBoneOrJointProblem: false,
              takesBloodPressureOrHeartMedication: false,
              hasChronicSpinalOrDiscCondition: false,
              hasRecentSurgeryOrInjury: false,
              reportedConditionsNotes: '',
              signedWaiverName: '',
            },
          }),
        })
        return
      }
      savedParqPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
    })

    await page.goto('/test-harness/fitness-mobile?view=settings', { waitUntil: 'domcontentloaded' })
    const medicalTabBtn = page.getByRole('button', { name: /PAR-Q\+ & Medical/i })
    await expect(medicalTabBtn).toBeEnabled()
    await medicalTabBtn.click()
    await expect(page.getByRole('heading', { name: /NASM PAR-Q\+ & Medical Clearance Status/i })).toBeVisible()

    // Open PAR-Q+ native modal <dialog>
    await page.getByRole('button', { name: /Retake \/ Update PAR-Q\+/i }).click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: /Physical Activity Readiness & Liability Acknowledgment/i })
    ).toBeVisible()

    // Escape key dismisses native <dialog> and synchronizes parent state cleanly
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)

    // Re-open and verify keyboard Space toggle + live risk tier transitions
    await page.getByRole('button', { name: /Retake \/ Update PAR-Q\+/i }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('status')).toContainText('Phase 5 Max')

    // Toggle moderate orthopedic flag via keyboard Space
    const jointCheckbox = dialog.locator('#parq-check-hasBoneOrJointProblem')
    await jointCheckbox.focus()
    await page.keyboard.press('Space')
    await expect(jointCheckbox).toBeChecked()
    await expect(dialog.getByRole('status')).toContainText('Cleared with customized orthopedic modifications')

    // Toggle high-risk cardiovascular flag -> restricts to Phase 1 Max + Physician Clearance Required
    const heartCheckbox = dialog.locator('#parq-check-hasHeartCondition')
    await heartCheckbox.focus()
    await page.keyboard.press('Space')
    await expect(heartCheckbox).toBeChecked()
    await expect(dialog.getByRole('status')).toContainText('Phase 1 Max')
    await expect(dialog.getByRole('status')).toContainText('Physician consultation required')

    // Complete Medical Screening button stays disabled until ESIGN waiver + typed full legal signature are provided
    const completeBtn = dialog.getByRole('button', { name: /Complete Medical Screening/i })
    await expect(completeBtn).toBeDisabled()

    await dialog.getByLabel(/Orthopedic History & Injury Specifics/i).fill('Mild right knee patellar tracking note')
    await dialog.locator('#parq-waiver-checkbox').check()
    await expect(completeBtn).toBeDisabled()

    await dialog.locator('#parq-legal-signature').fill('Jordan Vance')
    await expect(completeBtn).toBeEnabled()
    await completeBtn.click()

    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page.getByText(/PAR-Q\+ Medical Screening updated/i)).toBeVisible()
    expect(savedParqPayload).toMatchObject({
      hasHeartCondition: true,
      hasBoneOrJointProblem: true,
      reportedConditionsNotes: 'Mild right knee patellar tracking note',
      signedWaiverName: 'Jordan Vance',
      consentLiabilityWaiver: true,
      consentInformedConsent: true,
      consentPrivacyPractices: true,
    })
  })

  test('5. Landing Founding Pricing CTAs link to /auth/signup?plan=... and /api/stripe/checkout enforces auth + CSRF', async ({
    page,
    request,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('link', { name: /Lock In \$19\.99\/mo Core Lab/i })).toHaveAttribute(
      'href',
      '/auth/signup?plan=core_lab'
    )
    await expect(page.getByRole('link', { name: /Lock In \$49\.00\/mo Plus/i })).toHaveAttribute(
      'href',
      '/auth/signup?plan=plus'
    )
    await expect(page.getByRole('link', { name: /Claim 1 of 25 Coach Support Spots/i })).toHaveAttribute(
      'href',
      '/auth/signup?plan=coach_support'
    )

    // Cross-origin CSRF attempt against /api/stripe/checkout is rejected with 403
    const csrfBlocked = await request.post('/api/stripe/checkout', {
      headers: {
        Origin: 'https://malicious.example.com',
        'Content-Type': 'application/json',
      },
      data: { tierId: 'plus' },
    })
    expect([401, 403]).toContain(csrfBlocked.status())
  })
})
