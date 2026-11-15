import { test, expect } from '@playwright/test'

test.describe('Feature #10: Unified Cross-Platform Telemetry Queue & Offline Sync Engine', () => {
  test('queues workout sets + telemetry offline, updates OfflineTelemetryBadge in real time, and reconciles on reconnect', async ({
    page,
    context,
  }) => {
    const syncedSets: Array<Record<string, unknown>> = []
    const syncedTelemetryEvents: Array<Record<string, unknown>> = []

    await page.route('**/api/workouts/log-set**', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as Record<string, unknown>
        syncedSets.push(body)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Cache-Control': 'no-store, max-age=0' },
          body: JSON.stringify({
            success: true,
            setLog: {
              id: `srv_set_${syncedSets.length}`,
              exercise_name: body.exerciseName,
              reps: body.reps,
            },
          }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ setLogs: [] }),
      })
    })

    await page.route('**/api/telemetry**', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as { events?: Array<Record<string, unknown>> }
        const events = body.events ?? []
        syncedTelemetryEvents.push(...events)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Cache-Control': 'no-store, max-age=0' },
          body: JSON.stringify({
            ok: true,
            accepted: events.length,
            inserted: events.length,
            deduplicatedCount: 0,
            storageMode: 'supabase',
          }),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, rehydration: null }),
      })
    })

    await page.goto('/test-harness/telemetry-offline', { waitUntil: 'load' })
    await expect(page.getByTestId('telemetry-offline-harness')).toHaveAttribute(
      'data-hydrated',
      'true',
      { timeout: 10000 }
    )

    // Enter basement gym offline mode
    await context.setOffline(true)
    const badge = page.getByTestId('offline-telemetry-badge')
    await expect(badge).toBeVisible()
    await expect(badge).toContainText('Offline')

    // Log 2 sets + 1 joint comfort telemetry envelope while offline
    await page.getByTestId('harness-enqueue-set-btn').click()
    await page.getByTestId('harness-enqueue-set-btn').click()
    await page.getByTestId('harness-track-telemetry-btn').click()

    // Badge and useOfflineSyncManager hook update immediately without waiting 5s poll
    await expect(badge).toContainText('Offline · 3 Queued')
    await expect(page.getByTestId('harness-total-depth')).toHaveText('3')
    await expect(page.getByTestId('harness-hook-set-count')).toContainText('2 (2 stored)')

    // Restore network connection -> automatic reconnect drains both queues and shows synced confirmation
    await context.setOffline(false)

    await expect.poll(() => syncedSets.length, { timeout: 8000 }).toBe(2)
    await expect.poll(() => syncedTelemetryEvents.length, { timeout: 8000 }).toBeGreaterThanOrEqual(1)
    await expect(page.getByTestId('harness-total-depth')).toHaveText('0')
    await expect(page.getByTestId('harness-reconciled-sets')).toContainText('srv_set_1')
    await expect(badge).toContainText('Telemetry Synced')
  })

  test('surfaces Sync Retry feedback in OfflineTelemetryBadge on transient 503 failure, recovers on Sync Now, and purges on sign-out', async ({
    page,
    context,
  }) => {
    let failServer = true

    await page.route('**/api/workouts/log-set**', async route => {
      if (route.request().method() === 'POST') {
        if (failServer) {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Gateway timeout' }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            setLog: { id: 'srv_recovered_1', exercise_name: 'Trap Bar Deadlift', reps: 8 },
          }),
        })
        return
      }
      await route.fulfill({ status: 200, body: JSON.stringify({ setLogs: [] }) })
    })

    await page.route('**/api/telemetry**', async route => {
      if (route.request().method() === 'POST' && failServer) {
        await route.fulfill({ status: 503, body: JSON.stringify({ error: 'Unavailable' }) })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, accepted: 1, storageMode: 'supabase' }),
      })
    })

    await page.goto('/test-harness/telemetry-offline', { waitUntil: 'load' })
    await expect(page.getByTestId('telemetry-offline-harness')).toHaveAttribute(
      'data-hydrated',
      'true',
      { timeout: 10000 }
    )

    // Queue a set while offline, then reconnect while server returns 503
    await context.setOffline(true)
    await page.getByTestId('harness-enqueue-set-btn').click()
    await expect(page.getByTestId('offline-telemetry-badge')).toContainText('Offline · 1 Queued')

    await context.setOffline(false)

    const syncNowBtn = page.getByRole('button', { name: 'Sync Now' })
    // Wait for auto-reconnect attempt to finish or click Sync Now explicitly to trigger manual retry state
    await expect(syncNowBtn).toBeVisible({ timeout: 5000 })
    const box = await syncNowBtn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)

    await syncNowBtn.click()
    await expect(page.getByTestId('offline-telemetry-badge')).toContainText('Sync Retry · 1 Unsynced')

    // Restore server health and click Sync Now -> drains cleanly
    failServer = false
    await syncNowBtn.click()
    await expect(page.getByTestId('harness-total-depth')).toHaveText('0')
    await expect(page.getByTestId('offline-telemetry-badge')).toContainText('Telemetry Synced')

    // Queue offline items again and verify shared-device sign-out purges both queues immediately
    await context.setOffline(true)
    await page.getByTestId('harness-enqueue-set-btn').click()
    await page.getByTestId('harness-track-telemetry-btn').click()
    await expect(page.getByTestId('harness-total-depth')).toHaveText('2')

    await page.getByTestId('harness-signout-purge-btn').click()
    await expect(page.getByTestId('harness-total-depth')).toHaveText('0')
    await expect(page.getByTestId('harness-hook-set-count')).toContainText('0 (0 stored)')
    await context.setOffline(false)
  })

  test('opens TelemetryDiagnosticsDrawer via ?debug=telemetry as native modal <dialog closedby="any">, verifies round-trip ping & alert role, and cleans URL on Escape', async ({
    page,
  }) => {
    const receivedEventIds = new Set<string>()
    let forceVerifyFailure = false

    await page.route('**/api/telemetry**', async route => {
      const reqUrl = new URL(route.request().url())
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON() as {
          events?: Array<{ event_id?: string }>
        }
        for (const ev of body.events ?? []) {
          if (ev.event_id) receivedEventIds.add(ev.event_id)
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            accepted: (body.events ?? []).length,
            storageMode: 'supabase',
          }),
        })
        return
      }

      const verifyId = reqUrl.searchParams.get('verifyEventId')
      if (verifyId) {
        if (forceVerifyFailure) {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ ok: false, verified: false, error: 'Database offline' }),
          })
          return
        }
        const verified = receivedEventIds.has(verifyId)
        await route.fulfill({
          status: verified ? 200 : 404,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: verified,
            verified,
            eventId: verifyId,
            storageMode: 'supabase',
            receivedAt: new Date().toISOString(),
          }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, rehydration: null }),
      })
    })

    await page.goto('/test-harness/telemetry-offline?debug=telemetry', {
      waitUntil: 'domcontentloaded',
    })

    const dialog = page.locator('dialog.forge-telemetry-drawer')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('closedby', 'any')
    await expect(
      dialog.getByRole('heading', { name: /System & Telemetry Diagnostics/i })
    ).toBeVisible()

    // Close button meets >= 44x44px touch target requirement
    const closeBtn = dialog.getByRole('button', { name: 'Close System Diagnostics' })
    const closeBox = await closeBtn.boundingBox()
    expect(closeBox).not.toBeNull()
    expect(closeBox!.width).toBeGreaterThanOrEqual(44)
    expect(closeBox!.height).toBeGreaterThanOrEqual(44)

    // Clicking padding inside the dialog content box does NOT prematurely dismiss the modal
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox).not.toBeNull()
    await page.mouse.click(dialogBox!.x + 8, dialogBox!.y + 8)
    await expect(dialog).toBeVisible()

    // Send Test Telemetry Ping -> Verified Round-Trip (role="status")
    const pingBtn = dialog.getByTestId('send-telemetry-ping-btn')
    await pingBtn.click()
    const pingResult = dialog.getByTestId('telemetry-ping-result')
    await expect(pingResult).toBeVisible()
    await expect(pingResult).toHaveAttribute('role', 'status')
    await expect(pingResult).toContainText('Verified Round-Trip')

    // Simulate backend verification failure -> switches to role="alert"
    forceVerifyFailure = true
    await pingBtn.click()
    await expect(pingResult).toHaveAttribute('role', 'alert')
    await expect(pingResult).toContainText('Verification Failed')

    // Escape dismisses native modal and strips ?debug=telemetry from URL
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).not.toHaveURL(/debug=telemetry/)
  })

  test('validates /offline.html standalone PWA fallback, reduced-motion opt-in, CSP-clean button wiring, and 320px/375px zero horizontal overflow', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 740 })
      await page.goto('/offline.html', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('heading', { name: /Forge Athletic Offline Cache/i })
      ).toBeVisible()

      const reconnectBtn = page.locator('#reconnect-btn')
      await expect(reconnectBtn).toBeVisible()
      await expect(reconnectBtn).toHaveAttribute('type', 'button')
      // Verify inline onclick was removed for strict CSP compliance
      expect(await reconnectBtn.getAttribute('onclick')).toBeNull()

      const btnBox = await reconnectBtn.boundingBox()
      expect(btnBox).not.toBeNull()
      expect(btnBox!.height).toBeGreaterThanOrEqual(44)

      // Under prefers-reduced-motion: reduce, .pulse-dot has no running infinite animation
      const pulseAnimName = await page
        .locator('.pulse-dot')
        .evaluate(el => getComputedStyle(el).animationName)
      expect(pulseAnimName).toBe('none')

      // Zero horizontal overflow on /offline.html
      const offlineOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
      expect(offlineOverflow).toBe(true)

      // Zero horizontal overflow on /test-harness/telemetry-offline?debug=telemetry
      await page.goto('/test-harness/telemetry-offline?debug=telemetry', {
        waitUntil: 'domcontentloaded',
      })
      await expect(page.locator('dialog.forge-telemetry-drawer')).toBeVisible()
      const harnessOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
      expect(harnessOverflow).toBe(true)
    }
  })
})
