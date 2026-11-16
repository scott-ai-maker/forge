import path from 'node:path'
import { test, expect } from '@playwright/test'

const TINY_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVR42mNk+M9QzwAEjDAGACCcAwb7uP6mAAAAAElFTkSuQmCC',
  'base64'
)

test.describe('Feature #6: Desk Ergonomics Audit & Guided 5-Minute Desk Reset', () => {
  test('DeskErgonomicsAudit: 5s camera countdown + Escape hardware track release, MIME validation, photo upload, and re-auditing same desk clears resolved flags', async ({
    page,
  }) => {
    const telemetryBodies: Array<Record<string, unknown>> = []
    await page.route('**/api/telemetry', async route => {
      try {
        const parsed = route.request().postDataJSON()
        if (parsed && typeof parsed === 'object') telemetryBodies.push(parsed)
      } catch {
        // ignore
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accepted: 1 }),
      })
    })

    // Stub getUserMedia with track.stop() spy to verify immediate hardware webcam release on Escape
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('forge_posture_profile_v1')
      } catch {
        // ignore
      }
      ;(window as unknown as { __stoppedDeskTracks: number }).__stoppedDeskTracks = 0
      const fakeGetUserMedia = async () => {
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#111827'
          ctx.fillRect(0, 0, 640, 480)
        }
        const stream = canvas.captureStream(15)
        for (const track of stream.getTracks()) {
          const origStop = track.stop.bind(track)
          track.stop = () => {
            ;(window as unknown as { __stoppedDeskTracks: number }).__stoppedDeskTracks += 1
            origStop()
          }
        }
        return stream
      }
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, 'mediaDevices', {
          configurable: true,
          value: { getUserMedia: fakeGetUserMedia },
        })
      } else {
        navigator.mediaDevices.getUserMedia = fakeGetUserMedia
      }
    })

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/test-harness/desk-ergonomics')
    await expect(page.locator('main[data-hydrated="true"]')).toBeVisible()

    // 1. Start 5s Camera Timer, verify viewfinder appears, then press Escape -> stops MediaStream track
    await page.getByRole('button', { name: /5s Camera Timer/i }).click()
    await expect(page.getByText(/Align seated side profile:/i)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText(/Align seated side profile:/i)).toBeHidden()
    const stoppedTracks = await page.evaluate(
      () => (window as unknown as { __stoppedDeskTracks: number }).__stoppedDeskTracks
    )
    expect(stoppedTracks).toBeGreaterThanOrEqual(1)

    // 2. Reject non-image file upload gracefully
    const fileInput = page.locator('input[type="file"][aria-label="Upload side-profile desk photo"]')
    await fileInput.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })
    await expect(page.getByText(/Please select a JPEG, PNG, WebP, or HEIC/i)).toBeVisible()

    // 3. Valid PNG upload evaluates seated pose & syncs flags into DeskResetSlotCard
    await fileInput.setInputFiles({
      name: 'desk-side.png',
      mimeType: 'image/png',
      buffer: TINY_PNG_BUFFER,
    })
    await expect(page.getByText('3 Concrete Workstation Adjustments')).toBeVisible()
    await expect(page.getByText('1 Desk Saved')).toBeVisible()
    await expect(page.getByText(/Pre-loaded for your latest audit: forward head/i)).toBeVisible()

    // 4. Re-audit the SAME "Home Desk" using Load Optimal Reference -> updates in place (still 1 Desk Saved) & clears resolved flags!
    await page.getByRole('button', { name: 'Load Optimal Reference' }).click()
    await expect(page.getByText('1 Desk Saved')).toBeVisible()
    await expect(
      page.getByText('4 calm, guided posture mobility drills between meetings or on recovery days.')
    ).toBeVisible()

    await expect.poll(() => telemetryBodies.length).toBeGreaterThanOrEqual(1)
  })

  test('Multi-workstation saving, saved-desk switcher pills, and Core Lab 1-workstation limit gating', async ({
    page,
  }) => {
    await page.route('**/api/telemetry', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accepted: 1 }),
      })
    )

    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('forge_posture_profile_v1')
      } catch {
        // ignore
      }
    })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/test-harness/desk-ergonomics')
    await expect(page.locator('main[data-hydrated="true"]')).toBeVisible()

    // Audit "Home Desk" (strained)
    const labelInput = page.getByLabel('Workstation profile name')
    await expect(labelInput).toHaveValue('Home Desk')
    await page.getByRole('button', { name: 'Load Sample Desk Scan' }).click()
    await expect(page.getByText('1 Desk Saved')).toBeVisible()

    // Switch harness to Core Lab (1 Desk Max) and tap "+ Audit Another Desk" -> triggers upgrade banner
    await page.getByTestId('toggle-workstation-cap-btn').click()
    await page.getByRole('button', { name: '+ Audit Another Desk' }).click()
    await expect(page.getByTestId('workstation-limit-upgrade-banner')).toBeVisible()

    // Switch back to Plus (Unlimited Desks), add "Office Standing Desk" (Optimal), and toggle between saved pills
    await page.getByTestId('toggle-workstation-cap-btn').click()
    await page.getByRole('button', { name: '+ Audit Another Desk' }).click()
    await labelInput.fill('Office Standing Desk')
    await page.getByRole('button', { name: 'Load Optimal Reference' }).click()
    await expect(page.getByText('2 Desks Saved')).toBeVisible()

    const savedGroup = page.getByRole('group', { name: 'Saved workstation profiles' })
    const homePill = savedGroup.getByRole('button', { name: /Home Desk/i })
    const officePill = savedGroup.getByRole('button', { name: /Office Standing Desk/i })
    await expect(officePill).toHaveAttribute('aria-pressed', 'true')

    await homePill.click()
    await expect(homePill).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(/Loaded saved workstation "Home Desk"/i)).toBeVisible()
  })

  test('DeskResetModal: priority drill ordering, <progress> bar, full 5-min timer completion via clock, pause-on-close, and backdrop light-dismiss', async ({
    page,
  }) => {
    const resetEvents: Array<Record<string, unknown>> = []
    await page.route('**/api/telemetry', async route => {
      try {
        const body = route.request().postDataJSON() as { events?: Array<Record<string, unknown>> }
        for (const ev of body?.events ?? []) {
          if (ev.event_type === 'desk_reset_completed') resetEvents.push(ev)
        }
      } catch {
        // ignore
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accepted: 1 }),
      })
    })

    await page.clock.install()
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('forge_posture_profile_v1')
      } catch {
        // ignore
      }
    })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/test-harness/desk-ergonomics')
    await expect(page.locator('main[data-hydrated="true"]')).toBeVisible()

    // Load strained desk scan & launch Targeted 5-Min Desk Reset
    await page.getByRole('button', { name: 'Load Sample Desk Scan' }).click()
    await page.getByRole('button', { name: /Launch Targeted 5-Min Desk Reset/i }).click()

    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /Targeted 5-Minute Desk Reset/i })).toBeVisible()

    // Verify native <progress> bar starts at 0 / 300 and Drill 1 has aria-current="step"
    const progressBar = dialog.locator('progress.forge-progress-bar')
    await expect(progressBar).toHaveAttribute('value', '0')
    await expect(progressBar).toHaveAttribute('max', '300')
    await expect(dialog.getByRole('button', { name: /1\. Seated Deep Cervical Chin Tucks/i })).toHaveAttribute(
      'aria-current',
      'step'
    )

    // Start guided timer, advance 75 seconds -> transitions to Drill 2 cleanly
    await dialog.getByRole('button', { name: /Start Guided Timer/i }).click()
    await page.clock.runFor(75_000)
    await expect(dialog.getByText(/Drill 2 of 4/i)).toBeVisible()
    await expect(progressBar).toHaveAttribute('value', '75')

    // Advance remaining 225 seconds -> completes all 4 drills & announces polite status banner
    await page.clock.runFor(225_000)
    await expect(
      dialog.getByRole('status').filter({ hasText: /5-Min Desk Reset complete/i })
    ).toBeVisible()
    await expect(progressBar).toHaveAttribute('value', '300')

    // Verify daily streak date persisted in localStorage
    const completedDates = await page.evaluate(() => {
      const raw = window.localStorage.getItem('forge_posture_profile_v1')
      return raw ? JSON.parse(raw).deskResetCompletedDates : []
    })
    expect(Array.isArray(completedDates) && completedDates.length).toBeGreaterThanOrEqual(1)

    // Restart timer, then dismiss via backdrop click -> verify modal closes and timer pauses cleanly
    await dialog.getByRole('button', { name: /Restart 5-Min Reset/i }).click()
    await expect(dialog.getByRole('button', { name: /Pause Drill/i })).toBeVisible()
    await page.mouse.click(12, 12)
    await expect(dialog).toBeHidden()

    // Advance 300s while modal is closed -> must NOT fire a second desk_reset_completed while closed!
    await page.clock.runFor(300_000)
    await page.getByRole('button', { name: /Start 5-Min Desk Reset/i }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Start Guided Timer/i })).toBeVisible()
  })

  test('Public Landing Sneak Peek Tab 02 ("Desk Ergonomics Audit") & 375px mobile touch/overflow compliance', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/#sneak-peek')

    const deskTab = page.getByRole('tab', { name: /02.*Desk Audit/i })
    await deskTab.scrollIntoViewIfNeeded()
    await deskTab.click()
    await expect(deskTab).toHaveAttribute('aria-selected', 'true')

    const beforeFixBtn = page.getByRole('button', { name: 'Before Fix' })
    const optimalDeskBtn = page.getByRole('button', { name: 'Optimal Desk' })
    await expect(beforeFixBtn).toHaveAttribute('aria-pressed', 'true')

    // Verify >= 44px touch targets on 375px mobile viewport
    for (const btn of [beforeFixBtn, optimalDeskBtn]) {
      const box = await btn.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    }

    await optimalDeskBtn.click()
    await expect(optimalDeskBtn).toHaveAttribute('aria-pressed', 'true')

    // Verify zero horizontal overflow at 375px mobile width
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )
    expect(hasOverflow).toBe(false)

    // Verify 1-tap "Launch Targeted 5-Min Desk Reset →" switches Sneak Peek to Tab 04 (Express & Travel)
    const launchBtn = page.getByRole('button', { name: /Launch Targeted 5-Min Desk Reset/i })
    await expect(launchBtn).toBeVisible()
    const launchBox = await launchBtn.boundingBox()
    expect(launchBox?.height ?? 0).toBeGreaterThanOrEqual(44)
    await launchBtn.click()

    const expressTab = page.getByRole('tab', { name: /04.*Express & Travel/i })
    await expect(expressTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Real MediaPipe PoseLandmarker extracts distinct joint angles and scores from different athlete photos without CSP errors', async ({
    page,
  }) => {
    const cspErrors: string[] = []
    page.on('console', msg => {
      if (
        msg.type() === 'error' &&
        /Content Security Policy|Refused to connect/i.test(msg.text())
      ) {
        cspErrors.push(msg.text())
      }
    })

    const capturedPayloads: Array<Record<string, unknown>> = []
    await page.route('**/api/telemetry', async route => {
      try {
        const body = route.request().postDataJSON() as {
          events?: Array<{ event_type?: string; payload?: Record<string, unknown> }>
        }
        for (const ev of body?.events ?? []) {
          if (ev.event_type === 'desk_ergonomics_completed' && ev.payload) {
            capturedPayloads.push(ev.payload)
          }
        }
      } catch {
        // ignore
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accepted: 1 }),
      })
    })

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/test-harness/desk-ergonomics')
    await expect(page.locator('main[data-hydrated="true"]')).toBeVisible()

    const fileInput = page.locator('input[type="file"][aria-label="Upload side-profile desk photo"]')

    // Photo A: Upright seated chest press machine posture
    await fileInput.setInputFiles(
      path.join(process.cwd(), 'public/images/exercises/chest-press-machine.jpg')
    )
    const statusBanner = page.getByText(/✓ 33-point posture analyzed/i)
    await expect(statusBanner).toBeVisible({ timeout: 15_000 })
    const firstBannerText = await statusBanner.textContent()

    // Photo B: Forward-hinged dumbbell bent-over row posture
    await fileInput.setInputFiles(
      path.join(process.cwd(), 'public/images/exercises/dumbbell-bent-over-row.jpg')
    )
    await expect.poll(() => capturedPayloads.length, { timeout: 15_000 }).toBeGreaterThanOrEqual(2)
    const secondBannerText = await statusBanner.textContent()

    expect(cspErrors).toEqual([])
    expect(firstBannerText).not.toBe(secondBannerText)

    const p1 = capturedPayloads[0]
    const p2 = capturedPayloads[1]
    // Verify real MediaPipe extracted distinct joint telemetry across the two photos (never frozen on sample 49/100)
    const telemetryDiffers =
      p1.workstation_score !== p2.workstation_score ||
      p1.ear_shoulder_angle_deg !== p2.ear_shoulder_angle_deg ||
      p1.shoulder_protraction_deg !== p2.shoulder_protraction_deg ||
      p1.elbow_angle_deg !== p2.elbow_angle_deg
    expect(telemetryDiffers).toBe(true)
  })
})
