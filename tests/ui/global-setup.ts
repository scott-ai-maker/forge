import { chromium, type FullConfig } from '@playwright/test'

const PUBLIC_BROWSER_WARMUP_ROUTES = [
  '/',
  '/apply',
  '/waitlist',
  '/credentials',
  '/whats-new',
  '/packages',
  '/audit',
  '/auth/login',
  '/auth/signup',
  '/test-harness/fitness-mobile',
  '/test-harness/fitness-mobile?workspace=video&scenario=lab-video',
  '/test-harness/fitness-mobile?workspace=roadmap&scenario=lab-roadmap',
  '/test-harness/fitness-mobile?workspace=bodycomp&scenario=lab-bodycomp',
  '/test-harness/fitness-mobile?view=settings&scenario=schedule',
  '/test-harness/live-studio',
  '/test-harness/live-mobile',
  '/test-harness/cardio-studio',
  '/test-harness/coach-periodization',
  '/test-harness/coach-triage',
  '/test-harness/virtual-background',
]

const AUTH_BROWSER_WARMUP_ROUTES = [
  '/api/auth/demo?redirect=/dashboard',
  '/dashboard',
  '/dashboard/onboarding',
  '/dashboard/fitness',
  '/dashboard/book',
  '/dashboard/messages',
  '/dashboard/live',
  '/dashboard/settings',
]

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000'

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    const page = await context.newPage()

    for (const route of PUBLIC_BROWSER_WARMUP_ROUTES) {
      try {
        await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle', timeout: 15_000 })
      } catch {
        // ignore warmup timeout or error
      }
    }

    for (const route of AUTH_BROWSER_WARMUP_ROUTES) {
      try {
        await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle', timeout: 15_000 })
      } catch {
        // ignore warmup timeout or error
      }
    }
  } catch {
    // ignore browser warmup errors
  } finally {
    await browser?.close()
  }
}
