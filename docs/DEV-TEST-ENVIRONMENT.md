# Development & Testing Environment Guide

This guide describes how to configure, run, and verify the development and testing environments for the **Gordon Athletic Advisory (GAA)** application.

---

## 1. Quick Start & Preflight Verification

Run the automated diagnostic check to ensure all environment variables, test runners, and browser engines are ready:

```bash
npm run test:env
```

To run all automated quality checks (type checking, linting, and unit test suite):

```bash
npm run test:all
```

---

## 2. Environment Configurations

The application supports dual-mode environment management:

| File | Purpose | When Used |
|------|---------|-----------|
| `.env.local` | Live local development with real Supabase credentials, Stripe test keys, and Gemini AI. | `npm run dev`, `npm run build`, `npm run start` |
| `.env.test` | Deterministic mock configuration for automated test runs without external network dependencies. | Vitest unit/integration tests, CI/CD runners |
| `.env.example` | Template documenting all environment variables and secrets. | New machine onboarding |

### Key Dev & Test Feature Flags

- **`ENABLE_DEMO_LOGIN=true`**:
  Enables the `/api/auth/demo` endpoint. Navigating to this endpoint automatically provisions or signs in a VIP Demo Athlete session with pre-populated Phase 2 NASM OPT workout plans and fitness profile.
- **`NEXT_PUBLIC_ALLOW_ANON_PREVIEW=true`**:
  Allows bypassing auth guards during local UI mockups and component previews.

---

## 3. Unit & Integration Testing (Vitest)

The application uses **Vitest** for fast unit and integration testing.

- **Run all tests once**:
  ```bash
  npm test
  ```
- **Run tests in interactive watch mode**:
  ```bash
  npm run test:watch
  ```
- **Run a specific test file**:
  ```bash
  npx vitest run components/coach/LiveVideoCameraHud.test.ts
  ```

Global test defaults are configured in `tests/setup.ts` and loaded by `vitest.config.ts`, ensuring deterministic mocks for Supabase, rate limiters, and server APIs.

---

## 4. UI & End-to-End Testing (Playwright)

The application uses **Playwright** to test full user journeys, the marketing funnel, and the 1:1 Live Telehealth Coaching HUD.

- **List available tests**:
  ```bash
  npx playwright test --list
  ```
- **Run all E2E tests headless**:
  ```bash
  npm run test:ui
  ```
- **Run E2E tests headed (visible browser)**:
  ```bash
  npm run test:ui:headed
  ```
- **Run interactive Playwright debugger**:
  ```bash
  npm run test:ui:debug
  ```
- **Run a single test spec**:
  ```bash
  npx playwright test tests/ui/live-coaching-hud.spec.ts
  ```

### Playwright WebServer Auto-Start

`playwright.config.ts` automatically launches `npm run dev` with `ENABLE_DEMO_LOGIN=true` and `NEXT_PUBLIC_ALLOW_ANON_PREVIEW=true` if a dev server is not already running on port 3000.

---

## 5. Dev Test Users & All-Features Provisioning
You can provision or re-synchronize a fully unlocked test user anytime:

```bash
SMOKE_COACH_PASSWORD='...' \
SMOKE_ASSIGNED_CLIENT_PASSWORD='...' \
SMOKE_UNASSIGNED_CLIENT_PASSWORD='...' \
npm run smoke:auth
```

See `docs/authenticated-smoke-checklist.md` for full test account and verification checklists.

---

## 7. Common Troubleshooting

If you see missing variable warnings, run `npm run test:env` to verify `.env.local` or `.env.test`. Both files should define `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.

### Playwright Browser Binaries Missing
If Playwright reports missing browser engines, install them via:
```bash
npx playwright install
```

### Port 3000 Already in Use
If another Next.js instance is occupying port 3000, you can identify and terminate it:
```bash
lsof -i :3000
kill -9 <PID>
```

