# Forge Athletic

Forge Athletic is a sports-science training platform built on adaptive NASM OPT™ periodization, movement screening, performance telemetry, and coaching workflows.

The current public memberships are Core ($19.99/month or $149/year, with a seven-day free trial), Plus ($49/month), and Coach Support ($199/month). The Core trial is provisioned in Stripe Checkout.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

The interface uses Barlow Condensed for headings and Inter for body text through `next/font`.

## Testing

The client Progress tab starts with training totals and one selectable volume, sets, or effort trend.
Personal records, goals, consistency, workout/set history, and photos/body composition are
expandable sections. History starts with the latest 10 entries and offers "Show more" without
discarding older records. Totals cover all loaded history; timed exercise seconds are included
in the recorded reps/seconds total. Effort charts omit dates with no recorded RPE.
Goals support increasing and decreasing targets and retain records when a save/delete fails.
Use `tests/ui/progress-mobile.spec.ts` for focused mobile, keyboard, and failure-state checks.

Fitness Lab uses a compact in-app selector for all ten tools, with a bounded scrollable list,
keyboard-accessible buttons, and Escape to dismiss. Technical explanations, daily check-in
inputs, nutrition inputs, phase summaries, and performance tools are expandable. Mobile controls
have 44px touch targets. Body-composition summaries require real profile measurements and an
estimate; missing measurements are not substituted. Sleep examples are explicitly identified,
and the recovery map labels model estimates and collapses exploratory simulation inputs.
Exploratory check-in/nutrition adjustments are not presented as saved changes.
Access-check and roadmap failures offer retries. Travel previews use the current program's first
workout day. Add-on access checks run only for gated tools; expired sessions show sign-in guidance.
Run `tests/ui/fitness-lab-mobile.spec.ts` for focused Lab UAT.

The client Coach tab puts messaging, booking, and the weekly check-in first. Health/intake
details and progress photos are collapsed by default; closing photo details preserves drafts.
Check-in failures offer retry without enabling a blank form that could overwrite existing entries.
Save failures retain entries and release the submit control. Blank optional values remain null.
Use `tests/ui/coach-mobile.spec.ts` for mobile layout, keyboard, units, and request-failure checks.

Run the whitebox test suite with:

```bash
npm test
```

Use watch mode during development with:

```bash
npm run test:watch
```

The current whitebox coverage focuses on:

- RBAC helper behavior in `lib/authz.ts`
- Coach assignment decision logic in `lib/coach-assignments.ts`
- Workout planning and body-fat calculation logic in `lib/fitness.ts`
- Route-level RBAC and error mapping in `app/api/coach/clients/[id]/assignment/route.ts`
- Route-level messaging authorization and validation in `app/api/messages/route.ts`

For authenticated manual smoke coverage, use:

- `docs/authenticated-smoke-checklist.md`
- `docs/launch-funnel-assets.md`

For scripted authenticated smoke coverage, run:

```bash
SMOKE_COACH_PASSWORD='...' \
SMOKE_ASSIGNED_CLIENT_PASSWORD='...' \
SMOKE_UNASSIGNED_CLIENT_PASSWORD='...' \
npm run smoke:auth
```

## Marketing Emails

Apply and waitlist submissions support three email automations:

- lead confirmation email
- internal notification email
- 5-email launch sequence queue kickoff

Required environment variables:

- `RESEND_API_KEY`
- `MARKETING_FROM_EMAIL`
- `MARKETING_CRON_SECRET`

Recommended environment variables:

- `MARKETING_INTERNAL_NOTIFY_EMAIL` (where you receive new lead alerts)
- `MARKETING_REPLY_TO_EMAIL`
- `MARKETING_BASE_URL` (for email links, defaults to `http://127.0.0.1:3000`)
- `MARKETING_SEQUENCE_ENABLED=0` (disable sequence queue if needed)

Dispatch pending sequence emails manually:

```bash
npm run emails:dispatch
```

Production best practice:

- call `POST /api/marketing/dispatch` on a schedule (for example every 15 minutes)
- include header `x-marketing-cron-secret: $MARKETING_CRON_SECRET`

## UI Automation

This project uses Playwright for browser-level UI automation tests.

Run headless UI tests with:

```bash
npm run test:ui
```

Run headed UI tests with:

```bash
npm run test:ui:headed
```

Debug one test interactively with:

```bash
npm run test:ui:debug
```

Notes:

- By default, Playwright targets `http://127.0.0.1:3000`.
- Override the target URL with `PLAYWRIGHT_BASE_URL`.
- The config reuses an existing local dev server when available.

### Client workout acceptance checks

Run the focused workout, mobile layout, and cardio checks against the Forge development server:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/ui/fitness-tracker.spec.ts tests/ui/mobile-image-layout.spec.ts tests/ui/cardio-studio.spec.ts --workers=1
```

The training screen shows lifts by default. Starting a session opens warm-up; completing
warm-up returns to lifts. Stage controls keep cardio and cool-down available without
rendering every stage at once. Form previews open full demonstrations on demand, and
set details and RPE/RIR are available directly on exercise
cards. Exercise tools no longer open a bottom drawer. The former Form, Warm-up ramp,
Science, Intensity, and 1RM panels, cadence metronome, and bar-velocity controls are removed from this
flow; full exercise demonstrations and workout-level stages remain available.
Clients enter weight directly without preset pills. Log Set is the final action
on each exercise card, and the compact warm-up checkbox retains a tappable label.
The header thumbnail opens the demonstration. Set selection uses compact numbered
controls; date, set-number, tempo, and rest overrides stay under Edit set details.
Notes, exercise options, and logged-set history expand inline when needed, while
RPE/RIR and the current prescription remain visible.
Exercise cards provide navigation without a separate jump rail. Phase-aware
superset controls and automatic exercise progression remain available.
Weight fields start empty rather than suggesting an arbitrary load; clients must
enter their weight or explicitly enter 0 for bodyweight / no added load.
The final action reads "Log set & start rest", and expanded cards show a single
set-progress summary without repeating it in the exercise header.
The workout toolbar no longer includes Schedule, Plates, or Coach shortcuts.
The current program calendar is available under Settings > Workout Schedule;
selecting a session opens that workout day in Training. Exercise guidance and
cardio coaching remain available.
Set controls distinguish saving, saved, and sync-pending records. Offline retries
retain each optimistic record's ID so successful sync replaces it rather than
leaving a pending duplicate. Optional RPE/RIR start blank for each new working set.
The bottom rest timer is the sole rest-timer control, and Match Set appears only
when the current weight or reps differ from the previous set.
Coach notes appear in a compact collapsed row immediately below the workout title,
before stage navigation. Duration and tip-count badges are removed from the row;
the full briefing remains available on expansion.
Superset cards stack their exercise selectors on narrow mobile screens and constrain
reps/weight controls to their columns. Rep-range defaults use the lower bound
(8-10 starts at 8), not concatenated digits. Superset acceptance checks cover
320px, 375px, and tablet widths plus alternating round logging.
Workout-variety acceptance checks also cover timed holds/SMR, resistance bands,
circuit-labelled exercises, unilateral rep prescriptions, Phases 3–5, and
warm-up/cool-down/cardio controls at 320px and 393px. Timed summaries retain
per-side/per-leg instructions; band selection is a collapsed optional control,
and warm-up completion works from either the checkbox or Mark Done button.
Exercises without media use the current Forge Athletic logo at the legacy
fallback image URL, keeping previously saved program links valid.
The program briefing memo starts collapsed and can be expanded or collapsed
by touch or keyboard without hiding or truncating its full text.
Training opens on Step 1: Warm-Up; completing the warm-up advances to Step 2:
Lifts. Athletes can still select another stage manually.

These checks use test harnesses, not real client accounts. The complete resistance
flow uses mocked set-save responses and verifies all prescribed working sets are
complete before offering cardio. Live authenticated persistence and native device
features still require testing with a dedicated test client.

## Homepage Launch Mode

The homepage supports a launch switch controlled by one environment variable:

- `NEXT_PUBLIC_PRELAUNCH_WAITLIST_MODE`

Behavior:

- unset or `1`: homepage runs prelaunch waitlist funnel mode
- `0`: homepage switches to live sales mode (application-first)

This lets you flip from launch capture to full sales messaging without code changes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

The production domain is `https://forge-athletic.app`. Set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL`, and `APP_BASE_URL` to this origin in the Vercel project environment variables. Set `EMAIL_LINK_BASE_URL` to the same origin for password-reset and marketing-email links. Keep local `.env.local` URL values pointed at localhost for local development.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
