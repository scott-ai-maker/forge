import { existsSync } from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, test, type Page } from '@playwright/test'

/**
 * Full athlete journey against a real Supabase project:
 * signup -> email confirmation -> login -> onboarding (PAR-Q, consents, vitals)
 * -> every dashboard surface -> messaging with coach -> coach view -> sign out/in -> account deletion.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
 * (loaded from .env.local when present). The service-role key is used only to confirm the email
 * (standing in for the inbox click) and to clean up the throwaway account.
 * Optional: TEST_COACH_EMAIL / TEST_COACH_PASSWORD enable the coach-side phase.
 */

for (const file of ['.env.local']) {
  if (existsSync(file)) process.loadEnvFile(file)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const hasLiveBackend = Boolean(SUPABASE_URL && SERVICE_KEY && !SUPABASE_URL.includes('mock-test-project'))

const COACH_EMAIL = process.env.TEST_COACH_EMAIL ?? ''
const COACH_PASSWORD = process.env.TEST_COACH_PASSWORD ?? ''

const runId = Date.now().toString(36)
const ATHLETE_EMAIL = `e2e.athlete+${runId}@example.com`
const ATHLETE_PASSWORD = `E2eAthlete${runId}!9`
const ATHLETE_NAME = 'Pat E2E Tester'
const MESSAGE_TEXT = `Playwright hello from ${runId}`

let admin: SupabaseClient
let athleteId = ''

async function signInThroughUi(page: Page, email: string, password: string, expectedUrl: RegExp) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(expectedUrl, { timeout: 30_000 })
}

test.describe('Signup form validation (no backend required)', () => {
  test('rejects weak credentials client-side', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.getByText(/create your account to get started/i)).toBeVisible()

    const email = page.locator('#email-input')
    const password = page.locator('#password-input')
    const submit = page.getByRole('button', { name: /create account/i })

    await email.fill('not-an-email')
    await password.fill('short')
    await submit.click({ force: true })
    await expect(page).toHaveURL(/\/auth\/signup/)
    await expect(page.getByText(/valid email|invalid email/i).first()).toBeVisible()
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()

    await password.fill('alllowercase1')
    await password.blur()
    await expect(page.getByText(/uppercase letter/i)).toBeVisible()

    await password.fill('NoNumbersHere')
    await password.blur()
    await expect(page.getByText(/must contain a number/i)).toBeVisible()
  })

  test('login page links to signup and password reset', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('link', { name: /sign up|create/i }).first().click()
    await expect(page).toHaveURL(/\/auth\/signup/)
    await page.goto('/auth/login')
    await page.getByRole('button', { name: /forgot password/i }).click()
    await expect(page.getByRole('button', { name: /send|reset/i }).first()).toBeVisible()
  })
})

test.describe.serial('Full athlete journey (live Supabase)', () => {
  test.skip(!hasLiveBackend, 'Needs a real Supabase project (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)')
  test.setTimeout(120_000)

  test.beforeAll(() => {
    admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  })

  test.afterAll(async () => {
    if (!admin) return
    if (!athleteId) {
      const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
      athleteId = data?.users.find(u => u.email === ATHLETE_EMAIL)?.id ?? ''
    }
    if (athleteId) await admin.auth.admin.deleteUser(athleteId)
  })

  test('1. creates an account from the signup form', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.locator('#email-input').fill(ATHLETE_EMAIL)
    await page.locator('#password-input').fill(ATHLETE_PASSWORD)
    await page.getByRole('button', { name: /create account/i }).click()

    // Either email confirmation is on (message) or a session is issued immediately (redirect).
    await expect
      .poll(async () => (await admin.auth.admin.listUsers({ perPage: 200 })).data?.users.find(u => u.email === ATHLETE_EMAIL)?.id ?? '', {
        timeout: 30_000,
      })
      .not.toBe('')

    const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
    athleteId = data!.users.find(u => u.email === ATHLETE_EMAIL)!.id
  })

  test('2. confirms the email and signs in', async ({ page }) => {
    const { error } = await admin.auth.admin.updateUserById(athleteId, {
      email_confirm: true,
      user_metadata: { full_name: ATHLETE_NAME },
    })
    expect(error).toBeNull()

    // Ensure the profile row exists with a display name for later pages.
    await admin.from('clients').upsert({ id: athleteId, email: ATHLETE_EMAIL, full_name: ATHLETE_NAME, role: 'client' }, { onConflict: 'id' })

    await signInThroughUi(page, ATHLETE_EMAIL, ATHLETE_PASSWORD, /\/dashboard/)
    await expect(page.getByRole('link', { name: /fitness lab/i }).first()).toBeVisible()
    await page.context().storageState({ path: 'test-results/.athlete-state.json' })
  })

  test.describe('authenticated athlete', () => {
    test.use({ storageState: 'test-results/.athlete-state.json' })

    test('3. completes fitness onboarding (PAR-Q, vitals, consents)', async ({ page }) => {
      await page.goto('/dashboard/onboarding')
      await expect(page.getByRole('heading', { name: /fitness setup/i })).toBeVisible()

      // Submitting an empty form surfaces validation rather than saving.
      await page.getByRole('button', { name: /complete setup/i }).click()
      await expect(page.getByText(/PAR-Q|Height and weight|Emergency contact/i).first()).toBeVisible()

      for (let q = 1; q <= 7; q++) await page.locator(`#parqQ${q}-no`).check()

      const field = (label: string) => page.locator('div', { has: page.locator(`label:text-is("${label}")`) }).last().locator('input,select,textarea').first()

      await field('Height (cm)').fill('178')
      await field('Weight (kg)').fill('82')
      await field('Waist (cm)').fill('88')
      await field('Neck (cm)').fill('38')
      await field('Primary Goal').selectOption({ index: 1 })
      await field('Experience Level').selectOption({ index: 1 })
      await field('Workout Location').selectOption('gym')
      await field('Emergency Contact Name').fill('Sam Tester')
      await field('Emergency Contact Phone').fill('555-010-0100')
      await field('Electronic Signature (Full Legal Name)').fill(ATHLETE_NAME)

      for (const id of ['liability', 'informed', 'privacy', 'coaching', 'emergency']) {
        await page.locator(`#legal-consent-${id}`).check()
      }

      const draft = page.getByRole('button', { name: /save draft/i })
      await draft.click()
      await expect(page.getByText(/draft saved|saved/i).first()).toBeVisible()

      await page.getByRole('button', { name: /complete setup/i }).click()
      await expect(page).toHaveURL(/\/dashboard\/fitness/, { timeout: 30_000 })

      const { data } = await admin.from('fitness_profiles').select('onboarding_completed_at').eq('user_id', athleteId).maybeSingle()
      expect(data?.onboarding_completed_at).toBeTruthy()
    })

    test('4. Fitness Lab renders for the new athlete', async ({ page }) => {
      await page.goto('/dashboard/fitness')
      await expect(page.getByRole('heading', { name: /fitness lab/i })).toBeVisible()
      await expect(page.getByText(/not generated|phase \d/i).first()).toBeVisible()

      // If a coach-assigned plan exists, log a set end-to-end.
      const logSet = page.getByRole('button', { name: /log set/i }).first()
      if (await logSet.isVisible().catch(() => false)) {
        await page.getByRole('textbox', { name: /number of reps/i }).first().fill('10')
        await page.getByRole('textbox', { name: /weight in/i }).first().fill('135')
        await logSet.click()
        await expect(page.getByText(/logged this session/i).first()).toBeVisible()
      }
    })

    test('5. visits every dashboard surface', async ({ page }) => {
      const surfaces: Array<[string, RegExp]> = [
        ['/dashboard', /dashboard/],
        ['/dashboard/dossier', /dossier/],
        ['/dashboard/book', /schedule master consultation/i],
        ['/dashboard/messages', /private concierge line/i],
        ['/dashboard/live', /live/i],
        ['/dashboard/settings', /settings|baseline|wearables/i],
      ]
      for (const [path, marker] of surfaces) {
        const errors: string[] = []
        page.on('pageerror', e => errors.push(e.message))
        const res = await page.goto(path)
        expect(res?.status(), path).toBeLessThan(400)
        await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')))
        await expect(page.locator('body')).toContainText(marker)
        expect(errors, `${path} threw page errors`).toEqual([])
        page.removeAllListeners('pageerror')
      }
    })

    test('6. settings tabs and persisted onboarding data', async ({ page }) => {
      await page.goto('/dashboard/settings?tab=fitness')
      await expect(page.getByText(/baseline & vitals/i).first()).toBeVisible()
      for (const tab of ['medical', 'profile', 'security', 'notifications', 'billing']) {
        await page.goto(`/dashboard/settings?tab=${tab}`)
        await expect(page.locator('main')).toBeVisible()
      }

      await page.goto('/dashboard/onboarding')
      await expect(page.getByRole('button', { name: /update profile/i })).toBeVisible()
      await expect(page.locator('input[value="178"]')).toBeVisible()
    })

    test('7. books a consultation slot picker loads', async ({ page }) => {
      await page.goto('/dashboard/book')
      await expect(page.getByRole('heading', { name: /schedule master consultation/i })).toBeVisible()
      await expect(page.locator('main button').first()).toBeVisible()
    })

    test('8. athlete messages the coach', async ({ page }) => {
      test.skip(!COACH_EMAIL, 'Set TEST_COACH_EMAIL to exercise messaging')
      const { data: coach } = await admin.from('clients').select('id').eq('email', COACH_EMAIL).eq('role', 'coach').maybeSingle()
      test.skip(!coach, 'Coach profile not found in database')
      await admin.from('clients').update({ designated_coach_id: coach!.id }).eq('id', athleteId)

      await page.goto('/dashboard/messages')
      const box = page.getByPlaceholder(/message master coach gordon/i)
      await box.fill(MESSAGE_TEXT)
      await page.getByRole('button', { name: /^send$/i }).click()
      await expect(page.getByText(MESSAGE_TEXT).first()).toBeVisible()

      await page.reload()
      await expect(page.getByText(MESSAGE_TEXT).first()).toBeVisible()
    })
  })

  test('9. coach sees the new athlete and the message', async ({ browser }) => {
    test.skip(!COACH_EMAIL || !COACH_PASSWORD, 'Set TEST_COACH_EMAIL and TEST_COACH_PASSWORD for the coach phase')
    const context = await browser.newContext()
    const page = await context.newPage()
    await signInThroughUi(page, COACH_EMAIL, COACH_PASSWORD, /\/coach/)

    await page.goto(`/coach/clients/${athleteId}`)
    await expect(page.locator('body')).toContainText(ATHLETE_NAME)

    await page.goto(`/coach/clients/${athleteId}/messages`)
    await expect(page.getByText(MESSAGE_TEXT).first()).toBeVisible()

    await page.goto(`/coach/clients/${athleteId}/dossier`)
    await expect(page.locator('main')).toBeVisible()
    await context.close()
  })

  test('10. signs out, is locked out, signs back in', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await signInThroughUi(page, ATHLETE_EMAIL, ATHLETE_PASSWORD, /\/dashboard/)

    await page.getByRole('button', { name: /sign out/i }).first().click()
    await expect(page).toHaveURL(/\/(auth\/login)?$/, { timeout: 15_000 })

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/auth/login')
    await page.getByPlaceholder('you@example.com').fill(ATHLETE_EMAIL)
    await page.getByPlaceholder('••••••••').fill('WrongPassword1!')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText(/invalid|incorrect|credentials/i).first()).toBeVisible()

    await signInThroughUi(page, ATHLETE_EMAIL, ATHLETE_PASSWORD, /\/dashboard/)
    await context.close()
  })

  test('11. deleting the account removes access', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await signInThroughUi(page, ATHLETE_EMAIL, ATHLETE_PASSWORD, /\/dashboard/)

    const status = await page.evaluate(async () => (await fetch('/api/account/delete', { method: 'DELETE' })).status)
    expect(status).toBeLessThan(300)
    await context.close()

    const { data } = await admin.auth.admin.getUserById(athleteId)
    expect(data?.user).toBeFalsy()
    athleteId = ''
  })
})
