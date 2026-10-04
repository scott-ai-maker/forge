import { existsSync } from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, test, type Page } from '@playwright/test'

/**
 * Full coach journey against a real Supabase project:
 * login -> triage dashboard -> invite link -> athlete roster -> client hub (every tab)
 * -> messaging (coach <-> athlete) -> live studio launcher -> operations settings -> sign out.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_COACH_EMAIL and
 * TEST_COACH_PASSWORD (loaded from .env.local when present). The service-role key seeds a
 * throwaway athlete assigned to the coach and deletes it afterwards.
 */

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const COACH_EMAIL = process.env.TEST_COACH_EMAIL ?? ''
const COACH_PASSWORD = process.env.TEST_COACH_PASSWORD ?? ''
const hasLiveBackend = Boolean(
  SUPABASE_URL && SERVICE_KEY && COACH_EMAIL && COACH_PASSWORD && !SUPABASE_URL.includes('mock-test-project'),
)

const runId = Date.now().toString(36)
const ATHLETE_EMAIL = `e2e.coachview+${runId}@example.com`
const ATHLETE_PASSWORD = `E2eAthlete${runId}!9`
const ATHLETE_NAME = `Casey Coachview ${runId}`
const COACH_MESSAGE = `Coach note ${runId}`
const ATHLETE_REPLY = `Athlete reply ${runId}`

const CLIENT_TABS = [
  'overview',
  'program',
  'periodization',
  'assessment',
  'shield',
  'prescriptions',
  'sessions',
  'checkins',
  'dossier',
  'commerce',
  'lifecycle',
]

let admin: SupabaseClient
let coachId = ''
let athleteId = ''

async function signIn(page: Page, email: string, password: string, expectedUrl: RegExp) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(expectedUrl, { timeout: 30_000 })
}

test.describe('Coach access control (no backend required)', () => {
  test('coach routes redirect anonymous visitors to login', async ({ page }) => {
    for (const path of ['/coach', '/coach/settings', '/coach/clients/00000000-0000-4000-8000-000000000000']) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  })
})

test.describe.serial('Coach journey (live Supabase)', () => {
  test.skip(!hasLiveBackend, 'Needs live Supabase + TEST_COACH_EMAIL/TEST_COACH_PASSWORD in .env.local')
  test.setTimeout(120_000)

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

    const { data: coach } = await admin.from('clients').select('id').eq('email', COACH_EMAIL).eq('role', 'coach').maybeSingle()
    if (!coach) throw new Error(`No coach profile for ${COACH_EMAIL}; run npm run user:test first`)
    coachId = coach.id

    const { data, error } = await admin.auth.admin.createUser({
      email: ATHLETE_EMAIL,
      password: ATHLETE_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ATHLETE_NAME },
    })
    if (error || !data.user) throw new Error(`Could not seed athlete: ${error?.message}`)
    athleteId = data.user.id

    await admin.from('clients').upsert(
      { id: athleteId, email: ATHLETE_EMAIL, full_name: ATHLETE_NAME, role: 'client', designated_coach_id: coachId },
      { onConflict: 'id' },
    )
  })

  test.afterAll(async () => {
    if (admin && athleteId) await admin.auth.admin.deleteUser(athleteId)
  })

  test('1. coach signs in and lands on the coach dashboard', async ({ page }) => {
    await signIn(page, COACH_EMAIL, COACH_PASSWORD, /\/coach/)
    await expect(page.getByRole('heading', { name: /coach dashboard/i })).toBeVisible()
    await page.context().storageState({ path: 'test-results/.coach-state.json' })
  })

  test.describe('authenticated coach', () => {
    test.use({ storageState: 'test-results/.coach-state.json' })

    test('2. dashboard sections and invite link', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', e => errors.push(e.message))
      await page.goto('/coach')

      await expect(page.locator('#assigned-clients')).toBeAttached()
      await expect(page.getByRole('button', { name: /copy/i }).first()).toBeVisible()
      expect(errors).toEqual([])

      // The invite link a coach shares must resolve to a signup page bound to this coach.
      await page.goto(`/auth/signup?coach=${coachId}`)
      await expect(page.getByText(/you are signing up with/i)).toBeVisible()
    })

    test('3. assigned athlete appears in the roster and opens the client hub', async ({ page }) => {
      await page.goto('/coach')
      const row = page.getByRole('link', { name: ATHLETE_NAME }).first()
      await expect(row).toBeVisible({ timeout: 20_000 })
      await row.click()
      await expect(page).toHaveURL(new RegExp(`/coach/clients/${athleteId}`))
      await expect(page.locator('body')).toContainText(ATHLETE_NAME)
    })

    test('4. every client hub tab renders without errors', async ({ page }) => {
      for (const tab of CLIENT_TABS) {
        const errors: string[] = []
        const onError = (e: Error) => errors.push(e.message)
        page.on('pageerror', onError)
        const res = await page.goto(`/coach/clients/${athleteId}?tab=${tab}`)
        expect(res?.status(), tab).toBeLessThan(400)
        await expect(page).toHaveURL(/\/coach\/clients\//)
        await expect(page.locator('body')).toContainText(ATHLETE_NAME)
        expect(errors, `tab ${tab} threw page errors`).toEqual([])
        page.off('pageerror', onError)
      }
    })

    test('5. coach messages the athlete', async ({ page }) => {
      await page.goto(`/coach/clients/${athleteId}/messages`)
      await expect(page.getByRole('heading', { name: ATHLETE_NAME })).toBeVisible()

      await page.getByPlaceholder(/message athlete/i).fill(COACH_MESSAGE)
      await page.getByRole('button', { name: /^send$/i }).click()
      await expect(page.getByText(COACH_MESSAGE).first()).toBeVisible()

      await page.reload()
      await expect(page.getByText(COACH_MESSAGE).first()).toBeVisible()
    })

    test('6. coach dossier and live studio pages load', async ({ page }) => {
      for (const path of [`/coach/clients/${athleteId}/dossier`, `/coach/clients/${athleteId}/live`]) {
        const res = await page.goto(path)
        expect(res?.status(), path).toBeLessThan(400)
        await expect(page.locator('body')).toContainText(/\S+/)
        await expect(page).toHaveURL(new RegExp(path))
      }
    })

    test('7. operations settings load', async ({ page }) => {
      await page.goto('/coach/settings')
      await expect(page).toHaveURL(/\/coach\/settings/)
      await expect(page.getByRole('heading').first()).toBeVisible()
    })
  })

  test('8. athlete sees the coach message and replies; coach sees the reply', async ({ browser }) => {
    const athleteCtx = await browser.newContext()
    const athlete = await athleteCtx.newPage()
    await signIn(athlete, ATHLETE_EMAIL, ATHLETE_PASSWORD, /\/dashboard/)
    await athlete.goto('/dashboard/messages')
    await expect(athlete.getByText(COACH_MESSAGE).first()).toBeVisible({ timeout: 20_000 })
    await athlete.getByPlaceholder(/message master coach gordon/i).fill(ATHLETE_REPLY)
    await athlete.getByRole('button', { name: /^send$/i }).click()
    await expect(athlete.getByText(ATHLETE_REPLY).first()).toBeVisible()
    await athleteCtx.close()

    const coachCtx = await browser.newContext({ storageState: 'test-results/.coach-state.json' })
    const coach = await coachCtx.newPage()
    await coach.goto(`/coach/clients/${athleteId}/messages`)
    await expect(coach.getByText(ATHLETE_REPLY).first()).toBeVisible({ timeout: 20_000 })
    await coachCtx.close()
  })

  test('9. coach cannot be impersonated: athlete is blocked from coach area', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await signIn(page, ATHLETE_EMAIL, ATHLETE_PASSWORD, /\/dashboard/)
    await page.goto('/coach')
    await expect(page).not.toHaveURL(/\/coach$/)
    await ctx.close()
  })

  test('10. coach signs out and is locked out', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await signIn(page, COACH_EMAIL, COACH_PASSWORD, /\/coach/)
    await page.getByRole('button', { name: /sign out/i }).first().click()
    await page.goto('/coach')
    await expect(page).toHaveURL(/\/auth\/login/)
    await ctx.close()
  })
})
