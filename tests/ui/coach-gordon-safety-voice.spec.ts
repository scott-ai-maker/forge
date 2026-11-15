import { expect, test } from '@playwright/test'

test.describe('Feature #3: Coach Gordon AI Sidekick, Hybrid Voice & Clinical Safety Guardrails', () => {
  test('enforces contextual FAB routing, focus continuity (FAB -> Drawer -> Escape -> FAB), and zero 320px/375px overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 })

    // 1. Contextual suppression: FAB must NOT render on /auth/signup
    await page.goto('/auth/signup')
    await expect(page.getByTestId('global-ask-coach-gordon-fab')).toHaveCount(0)

    // 2. Active training surface: FAB renders with >= 44px touch target & zero horizontal overflow
    await page.goto('/test-harness/fitness-mobile')
    const fab = page.getByTestId('global-ask-coach-gordon-fab')
    await expect(fab).toBeVisible()
    const fabBox = await fab.boundingBox()
    expect(fabBox!.height).toBeGreaterThanOrEqual(44)
    expect(fabBox!.x + fabBox!.width).toBeLessThanOrEqual(320.5)

    // 3. Open drawer -> keyboard focus must move inside drawer (Close button), never stranded on document.body
    await fab.click()
    const drawer = page.getByTestId('coach-gordon-assistant-drawer')
    await expect(drawer).toBeVisible()

    const closeBtn = drawer.getByRole('button', { name: 'Close Coach Gordon drawer' })
    await expect(closeBtn).toBeFocused()

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(hasHorizontalOverflow).toBe(false)

    // 4. Press Escape -> drawer closes and focus returns directly to FAB
    await page.keyboard.press('Escape')
    await expect(drawer).toHaveCount(0)
    await expect(fab).toBeVisible()
    await expect(fab).toBeFocused()
  })

  test('boots strictly Muted with zero unsolicited TTS requests, unlocks on Listen tap, executes 1-tap Express action, and enforces >=44px targets', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const unsolicitedVoiceUrls: string[] = []
    let voiceUnlockedByUser = false

    page.on('request', req => {
      const url = req.url()
      if (url.includes('/api/coach/tts') || url.includes('/api/voice/synthesize')) {
        if (!voiceUnlockedByUser) {
          unsolicitedVoiceUrls.push(url)
        }
      }
    })

    await page.addInitScript(() => {
      window.localStorage.removeItem('forge_coach_audio_mode_v1')
      window.localStorage.removeItem('gaa_sfx_muted')
      window.localStorage.removeItem('forge_posture_profile_v1')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
    })

    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('global-ask-coach-gordon-fab').click()

    const drawer = page.getByTestId('coach-gordon-assistant-drawer')
    await expect(drawer).toBeVisible()

    // Verify strict default-muted state and zero background TTS calls
    const audioGroup = drawer.getByTestId('coach-audio-mode-selector')
    const mutedBtn = audioGroup.getByRole('button', { name: 'Muted' })
    const chimesBtn = audioGroup.getByRole('button', { name: 'Chimes Only' })
    const voiceBtn = audioGroup.getByRole('button', { name: 'Voice + Chimes' })

    await expect(mutedBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'false')
    expect(unsolicitedVoiceUrls).toEqual([])

    for (const btn of [mutedBtn, chimesBtn, voiceBtn]) {
      const box = await btn.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(375.5)
    }

    // Tapping Chimes Only keeps voice synthesis silent
    await chimesBtn.click()
    await expect(chimesBtn).toHaveAttribute('aria-pressed', 'true')
    expect(unsolicitedVoiceUrls).toEqual([])

    // Re-mute, then tap "Listen to Coach Gordon" on Today's Personal Briefing -> auto-unlocks Voice + Chimes
    await mutedBtn.click()
    await expect(mutedBtn).toHaveAttribute('aria-pressed', 'true')
    voiceUnlockedByUser = true
    await drawer.getByTestId('listen-preworkout-briefing-btn').click()
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'true')

    // Tap 1-tap quick prompt: "Shorten today to 15 minutes"
    await drawer.getByRole('button', { name: 'Shorten today to 15 minutes' }).click()

    const citationsCard = drawer.getByTestId('coach-rag-citations')
    await expect(citationsCard).toBeVisible({ timeout: 25_000 })
    await expect(citationsCard).toContainText('Coaching Focus')

    const drawerText = await drawer.innerText()
    expect(drawerText).not.toMatch(/\bRAG\b/)
    expect(drawerText).not.toMatch(/pgvector|BM25/i)
    expect(drawerText).not.toMatch(/\bGAA\b/)

    // Verify >= 44px on recommendedAction & follow-up chips, then execute 1-tap Express Mode action
    const actionBtn = drawer.getByTestId('coach-recommended-action-btn').first()
    await expect(actionBtn).toBeVisible()
    const actionBox = await actionBtn.boundingBox()
    expect(actionBox!.height).toBeGreaterThanOrEqual(44)

    await actionBtn.click()
    await expect(drawer.getByTestId('coach-action-applied-badge')).toContainText(
      '20m Express Mode active'
    )
    await expect(drawer.getByLabel('Active training context')).toContainText('20m Express')
  })

  test('triggers zero-latency clinical pain stop + exercise swap, 911 emergency directive, and safety_flag telemetry', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const safetyTelemetryEvents: Array<Record<string, unknown>> = []

    await page.route('**/api/telemetry', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { events?: Array<Record<string, unknown>> }
        for (const ev of body?.events || []) {
          if (ev.event_type === 'safety_flag') {
            safetyTelemetryEvents.push(ev)
          }
        }
      }
      await route.continue()
    })

    await page.goto('/test-harness/fitness-mobile')
    await page.evaluate(() => {
      ;(window as unknown as { __pausedReasons: string[]; __swaps: string[] }).__pausedReasons = []
      ;(window as unknown as { __pausedReasons: string[]; __swaps: string[] }).__swaps = []
      window.addEventListener('forge-safety-pause-workout', e => {
        ;(window as unknown as { __pausedReasons: string[] }).__pausedReasons.push(
          (e as CustomEvent<{ reason: string }>).detail?.reason || 'paused'
        )
      })
      window.addEventListener('forge-apply-exercise-swap', e => {
        ;(window as unknown as { __swaps: string[] }).__swaps.push(
          (e as CustomEvent<{ newExerciseName: string }>).detail?.newExerciseName || ''
        )
      })
    })

    await page.getByTestId('global-ask-coach-gordon-fab').click()
    const drawer = page.getByTestId('coach-gordon-assistant-drawer')
    const input = drawer.getByPlaceholder(/Ask about form, comfort swaps, equipment, or tempo/i)

    // 1. Acute orthopedic pain -> clinical_stop + workout pause + pain-free regression swap
    await input.fill('I felt a sharp shooting pain in my knee on squats')
    await drawer.getByRole('button', { name: 'Send question to Coach Gordon AI' }).click()

    const safetyCard = drawer.getByTestId('clinical-safety-override-card')
    await expect(safetyCard).toBeVisible({ timeout: 20_000 })
    await expect(safetyCard).toContainText('Clinical Boundary:')

    const swapBtn = safetyCard.getByRole('button', { name: /Switch to/i })
    await expect(swapBtn).toBeVisible()
    const swapBox = await swapBtn.boundingBox()
    expect(swapBox!.height).toBeGreaterThanOrEqual(44)
    await swapBtn.click()
    await expect(safetyCard.getByTestId('safety-swap-applied-badge')).toBeVisible()

    // 2. Systemic medical red flag -> 911 emergency directive
    await input.fill('Now I feel crushing chest pain and dizziness')
    await drawer.getByRole('button', { name: 'Send question to Coach Gordon AI' }).click()
    await expect(safetyCard).toContainText(/911|EMERGENCY/i)

    const { pausedCount, swapCount } = await page.evaluate(() => ({
      pausedCount: (window as unknown as { __pausedReasons: string[] }).__pausedReasons.length,
      swapCount: (window as unknown as { __swaps: string[] }).__swaps.length,
    }))
    expect(pausedCount).toBeGreaterThanOrEqual(2)
    expect(swapCount).toBe(1)

    await expect.poll(() => safetyTelemetryEvents.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(1)
  })

  test('validates Human-Backed Guarantee escalation across Core Lab, Plus, and Coach Support ($199) tiers with telemetry & safe dialog dismissal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 900 })
    const capturedEscalationTelemetry: Array<Record<string, unknown>> = []

    await page.route('**/api/telemetry', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { events?: Array<Record<string, unknown>> }
        for (const ev of body?.events || []) {
          if (ev.event_type === 'escalation_sms' || ev.event_type === 'escalation_email') {
            capturedEscalationTelemetry.push(ev)
          }
        }
      }
      await route.continue()
    })

    // 1. Core Lab ($19.99): 24–48h Direct Email + validation + PII redaction
    await page.addInitScript(() => {
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
    })
    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('global-ask-coach-gordon-fab').click()

    const drawer = page.getByTestId('coach-gordon-assistant-drawer')
    await expect(drawer.getByTestId('drawer-message-real-coach-btn')).toContainText('24–48h Email')
    await drawer.getByTestId('drawer-message-real-coach-btn').click()

    const modal = page.getByTestId('coach-escalation-modal')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Core Lab')
    await expect(modal).toContainText('Auto-Attached Diagnostic Summary (Zero Raw Photos)')

    // Clicking inside modal heading/padding must NOT close the dialog
    await modal.getByRole('heading', { name: 'Message Real Coach Gordon' }).click()
    await expect(modal).toBeVisible()

    // Validation on < 3 chars
    const textarea = modal.locator('textarea')
    await textarea.fill('hi')
    await modal.getByRole('button', { name: /Send Direct Email to Coach Gordon/i }).click()
    await expect(modal.getByRole('alert')).toContainText('at least 3 characters')

    // Valid Core Lab submit with PII email -> scrubs PII in escalation_email telemetry
    await textarea.fill('Checking dumbbell goblet squat depth — my email is athlete@example.com')
    await modal.getByRole('button', { name: /Send Direct Email to Coach Gordon/i }).click()
    await expect(modal).toContainText('Sent to Coach Gordon (24–48h Email Window)')

    await expect
      .poll(() => capturedEscalationTelemetry.some(e => e.event_type === 'escalation_email'), {
        timeout: 10_000,
      })
      .toBe(true)
    const emailEv = capturedEscalationTelemetry.find(e => e.event_type === 'escalation_email')!
    expect(JSON.stringify(emailEv.payload)).not.toContain('athlete@example.com')

    await modal.getByRole('button', { name: 'Done' }).click()
    await expect(modal).toBeHidden()

    // 2. Switch to Plus ($49) -> verify 1d Email badge & fresh empty textarea on reopen
    await page.evaluate(() => {
      window.localStorage.setItem('forge_tier_preview_v1', 'plus')
      window.dispatchEvent(new CustomEvent('forge:tier-preview-change', { detail: 'plus' }))
    })
    await expect(drawer.getByTestId('drawer-message-real-coach-btn')).toContainText('1d Email')
    await drawer.getByTestId('drawer-message-real-coach-btn').click()
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Expected reply within 1 business day')
    await expect(textarea).toHaveValue('')
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()

    // 3. Switch to Coach Support ($199) -> verify 24h SLA Direct SMS + Priority Thread & escalation_sms telemetry
    await page.evaluate(() => {
      window.localStorage.setItem('forge_tier_preview_v1', 'coach_support')
      window.dispatchEvent(
        new CustomEvent('forge:tier-preview-change', { detail: 'coach_support' })
      )
    })
    await expect(drawer.getByTestId('drawer-message-real-coach-btn')).toContainText('SMS + 24h SLA')
    await drawer.getByTestId('drawer-message-real-coach-btn').click()
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('24h SLA · Direct SMS + Priority Thread')

    const sendSmsBtn = modal.getByRole('button', { name: /Send Priority Text \+ 24h Thread/i })
    const smsBtnBox = await sendSmsBtn.boundingBox()
    expect(smsBtnBox!.height).toBeGreaterThanOrEqual(44)

    await textarea.fill('Need a quick hotel band swap for cable face pulls before my 7am flight.')
    await sendSmsBtn.click()

    await expect(modal).toContainText('Sent to Coach Gordon (24h Priority SLA)')
    await expect(modal.getByRole('link', { name: /Open Native SMS Line/i })).toBeVisible()
    await expect(modal.getByRole('link', { name: /Open 24h Priority Thread/i })).toBeVisible()

    await expect
      .poll(() => capturedEscalationTelemetry.some(e => e.event_type === 'escalation_sms'), {
        timeout: 10_000,
      })
      .toBe(true)
  })
})
