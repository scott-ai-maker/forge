import { expect, test, type Page } from '@playwright/test'

declare global {
  interface Window {
    __mockCameraTracks?: Array<{ label: string; readyState: 'live' | 'ended' }>
    __copiedClipboardText?: string
  }
}

async function installMockCameraAndMediaRecorder(page: Page) {
  await page.addInitScript(() => {
    window.__mockCameraTracks = []
    window.__copiedClipboardText = ''

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          window.__copiedClipboardText = text
        },
      },
    })

    const createMockStream = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 48
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#0f172a'
        ctx.fillRect(0, 0, 64, 48)
      }
      const stream = canvas.captureStream(15)
      for (const track of stream.getTracks()) {
        const trackRecord = {
          label: track.label || 'Mock 45deg Camera Track',
          readyState: 'live' as 'live' | 'ended',
        }
        window.__mockCameraTracks!.push(trackRecord)
        const originalStop = track.stop.bind(track)
        track.stop = () => {
          trackRecord.readyState = 'ended'
          originalStop()
        }
      }
      return stream
    }

    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {},
      })
    }
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => createMockStream(),
    })

    class MockMediaRecorder {
      static isTypeSupported(mime: string) {
        return mime === 'video/mp4'
      }
      stream: MediaStream
      mimeType: string
      state: 'inactive' | 'recording' = 'inactive'
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null

      constructor(stream: MediaStream, options?: { mimeType?: string }) {
        this.stream = stream
        this.mimeType = options?.mimeType || 'video/mp4'
      }

      start() {
        this.state = 'recording'
      }

      stop() {
        if (this.state === 'inactive') return
        this.state = 'inactive'
        const fakeBlob = new Blob([new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112])], {
          type: this.mimeType,
        })
        this.ondataavailable?.({ data: fakeBlob })
        this.onstop?.()
      }
    }

    Object.defineProperty(window, 'MediaRecorder', {
      configurable: true,
      value: MockMediaRecorder,
    })

    HTMLMediaElement.prototype.play = async function () {
      return undefined
    }
  })
}

test.describe('Feature #8: Form Lab Video Recorder & Asynchronous Coach Critique Studio', () => {
  test('FormLabRecorder captures a 45° clip with Safari MP4 fallback, releases camera tracks, flushes telemetry, and enforces tier credits', async ({
    page,
  }) => {
    await installMockCameraAndMediaRecorder(page)

    const telemetryEvents: Array<Record<string, unknown>> = []
    await page.route('**/api/telemetry', async route => {
      const postData = route.request().postDataJSON()
      if (Array.isArray(postData?.events)) {
        telemetryEvents.push(...postData.events)
      }
      await route.fulfill({ status: 200, json: { ok: true } })
    })

    await page.goto('/test-harness/form-lab')
    await expect(page.locator('[data-testid="form-lab-harness"][data-hydrated="true"]')).toBeAttached({
      timeout: 25_000,
    })

    // Ensure Core Lab clean state
    await page.getByRole('button', { name: 'Set Tier: core_lab' }).click()
    await page.getByRole('button', { name: 'Reset Form Lab Credits' }).click()
    await expect(page.getByTestId('form-lab-credits-badge')).toContainText('1 of 1 Credits Remaining')

    // Zero passive camera activation on page load
    const initialTracks = await page.evaluate(() => window.__mockCameraTracks?.length ?? 0)
    expect(initialTracks).toBe(0)

    // Open 45° live camera recorder, record a clip, and stop
    await page.getByRole('button', { name: 'Record 45° Set' }).click()
    await expect(page.getByTestId('form-lab-camera-drawer')).toBeVisible()
    await page.getByRole('button', { name: 'Start Recording' }).click()
    await expect(page.getByText(/REC 0:00 \/ 0:30/)).toBeVisible()
    await page.getByRole('button', { name: 'Stop & Save Clip' }).click()

    // Clip attaches with Safari-negotiated .mp4 extension and physical camera tracks are ended immediately
    await expect(page.getByTestId('form-lab-attached-clip')).toContainText(
      'form_lab_barbell_back_squat_45deg.mp4'
    )
    const trackStatesAfterStop = await page.evaluate(() =>
      (window.__mockCameraTracks ?? []).map(t => t.readyState)
    )
    expect(trackStatesAfterStop.length).toBeGreaterThan(0)
    expect(trackStatesAfterStop.every(s => s === 'ended')).toBe(true)

    // Add note and submit clip under Core Lab (1 -> 0 credits)
    await page
      .getByLabel('Form Lab Coaching Note (Optional)')
      .fill('Slight hip shift coming out of the hole on rep 4')
    await page.getByRole('button', { name: /Submit Clip to Form Lab \(1 Left\)/i }).click()

    await expect(page.getByRole('status')).toContainText(
      'Form Lab clip queued for Coach Gordon telestrator review (0 credits left).'
    )
    await expect(page.getByTestId('form-lab-credits-badge')).toContainText('0 of 1 Credits Remaining')
    await expect(page.getByText('Telestrator Queue')).toBeVisible()

    // Immediate telemetry flush verification
    await expect
      .poll(() => telemetryEvents.some(e => e.event_type === 'form_lab_uploaded'))
      .toBe(true)

    // Credit depletion opens native <dialog> TierUpgradeModal recommending Plus ($49/mo)
    await page.getByRole('button', { name: /Unlock More Reviews in Plus/i }).click()
    const upgradeDialog = page.locator('dialog[open]')
    await expect(upgradeDialog).toBeVisible()
    await expect(upgradeDialog).toContainText('$49.00')
    await page.keyboard.press('Escape')
    await expect(upgradeDialog).toHaveCount(0)

    // Coach Support tier grants 8 monthly credits and 24h Priority Queue SLA
    await page.getByRole('button', { name: 'Set Tier: coach_support' }).click()
    await expect(page.getByTestId('form-lab-credits-badge')).toContainText('8 of 8 Credits Remaining')
    await page.getByRole('button', { name: /Submit Clip to Form Lab \(8 Left\)/i }).click()
    await expect(page.getByText('24h Priority Queue')).toBeVisible()
  })

  test('VideoCritiqueStudio validates uploads, renders native <progress>, evaluates newly wired bench/deadlift faults, and embeds YouTube Shorts privately', async ({
    page,
  }) => {
    await installMockCameraAndMediaRecorder(page)
    await page.goto('/test-harness/form-lab')
    await expect(page.locator('[data-testid="form-lab-harness"][data-hydrated="true"]')).toBeAttached({
      timeout: 25_000,
    })

    const fileInput = page.getByTestId('video-critique-file-input')

    // Rejects non-video file cleanly with role="alert"
    await fileInput.setInputFiles({
      name: 'workout_notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a video'),
    })
    await expect(page.getByTestId('form-lab-harness').getByRole('alert')).toContainText(
      'Unsupported file format'
    )

    // Valid video upload auto-infers Romanian Deadlift & shows native <progress>
    await fileInput.setInputFiles({
      name: 'romanian_deadlift_tempo.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from([0, 0, 0, 24, 102, 116, 121, 112]),
    })
    await expect(page.getByLabel('Compound Exercise')).toHaveValue('romanian_deadlift')
    await expect(page.locator('progress.forge-progress-bar')).toBeVisible()
    await expect(page.getByTestId('critique-rating-badge')).toHaveText('Mastery', {
      timeout: 5_000,
    })

    // Select Barbell Bench Press + toggle Glutes Off Bench -> 85/100 Proficient (sky badge, not red)
    await page.getByLabel('Compound Exercise').selectOption('barbell_bench_press')
    const glutesBtn = page.getByRole('button', { name: /Glutes Off Bench/i })
    await glutesBtn.click()
    await expect(glutesBtn).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Run Biomechanical Diagnostics' }).click()

    await expect(page.getByTestId('critique-rating-badge')).toHaveText('Proficient', {
      timeout: 5_000,
    })
    await expect(page.getByText('Pelvic & Leg-Drive Contact')).toBeVisible()

    // Switch to YouTube mode & load Shorts URL -> privacy-enhanced youtube-nocookie.com iframe + clipboard share
    await page.getByRole('button', { name: /Share YouTube Video/i }).click()
    await page
      .getByLabel('YouTube Video or Shorts URL')
      .fill('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    await page.getByRole('button', { name: 'Load Video' }).click()

    const ytIframe = page.locator('iframe[title="Client YouTube Lift Video"]')
    await expect(ytIframe).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    )
    await expect(page.getByText(/YouTube Verified Footage \(dQw4w9WgXcQ\)/)).toBeVisible({
      timeout: 5_000,
    })

    await page.getByRole('button', { name: 'Share Critique & Video Link' }).click()
    const copied = await page.evaluate(() => window.__copiedClipboardText ?? '')
    expect(copied).toContain('Forge Athletic Biomechanical Form Critique')
    expect(copied).not.toContain('GAA')
    expect(copied).not.toContain('Gordon Athletic')
  })

  test('OHSA protocol dialog, in-workout LiveVideoFormCaptureModal (<dialog closedby="any">), and Coach Telestrator canvas work end-to-end', async ({
    page,
  }) => {
    await installMockCameraAndMediaRecorder(page)
    await page.goto('/test-harness/form-lab')
    await expect(page.locator('[data-testid="form-lab-harness"][data-hydrated="true"]')).toBeAttached({
      timeout: 25_000,
    })

    // Selecting OHSA zeroes Working Load (lbs) and surfaces Movement Screen Protocol modal
    await page.getByLabel('Compound Exercise').selectOption('overhead_squat_assessment')
    await expect(page.getByLabel('Working Load (lbs)')).toHaveValue('0')

    await page.getByRole('button', { name: /Movement Screen Protocol & Checklist/i }).click()
    const ohsaDialog = page.getByTestId('movement-screen-instructions-modal')
    await expect(ohsaDialog).toHaveAttribute('open', '')
    await expect(ohsaDialog).toContainText('Male athletes must keep shirts on at all times')
    await page.getByRole('button', { name: /4\. Submit & Next Steps/i }).click()
    await expect(ohsaDialog).toContainText('TLS 1.3')
    await expect(ohsaDialog).toContainText('AES-256')
    await page.keyboard.press('Escape')
    await expect(ohsaDialog).not.toHaveAttribute('open', '')

    // In-workout LiveVideoFormCaptureModal opens as native <dialog>, captures Dumbbell RDL, stops tracks, saves notes
    await page.getByRole('button', { name: 'Open In-Workout Form Cam (Dumbbell RDL)' }).click()
    const formCamDialog = page.getByTestId('live-video-form-capture-dialog')
    await expect(formCamDialog).toHaveAttribute('open', '')

    await formCamDialog.getByRole('button', { name: 'Record 10s Set Clip' }).click()
    await formCamDialog.getByRole('button', { name: 'Stop & Analyze Form' }).click()
    await expect(formCamDialog.getByText(/Form Score: 100\/100/)).toBeVisible()

    // Physical camera tracks released as soon as clip capture stops
    const liveTracksRemaining = await page.evaluate(
      () => (window.__mockCameraTracks ?? []).filter(t => t.readyState === 'live').length
    )
    expect(liveTracksRemaining).toBe(0)

    await formCamDialog.getByRole('button', { name: 'Save Cues to Set Notes & Return' }).click()
    await expect(formCamDialog).not.toHaveAttribute('open', '')
    await expect(page.getByTestId('saved-set-notes')).toContainText('[Form Score: 100/100]')

    // Coach Telestrator 3-Point Angle markup draws cleanly onto canvas
    await page.getByRole('button', { name: '3-Pt Angle' }).click()
    const stage = page.getByTestId('harness-telestrator-stage')
    const box = (await stage.boundingBox())!
    await page.mouse.click(box.x + 80, box.y + 60)
    await page.mouse.click(box.x + 120, box.y + 140)
    await page.mouse.click(box.x + 200, box.y + 140)
    const nonTransparentPixels = await stage.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return 0
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let count = 0
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) count++
      }
      return count
    })
    expect(nonTransparentPixels).toBeGreaterThan(20)
  })

  test('fits cleanly with >= 44px touch targets and zero horizontal overflow at 320px and 375px viewports (including unlocked Fitness Lab Video tool)', async ({
    page,
  }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 812 })
      await page.goto('/test-harness/form-lab')
      await expect(
        page.locator('[data-testid="form-lab-harness"][data-hydrated="true"]')
      ).toBeAttached({ timeout: 25_000 })

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
      expect(overflow, `page overflow at ${width}px`).toBeLessThanOrEqual(0)

      const harness = page.getByTestId('form-lab-harness')
      for (const control of await harness
        .locator('button, input, select, textarea, summary, a')
        .all()) {
        if (!(await control.isVisible())) continue
        const box = (await control.boundingBox())!
        const label = ((await control.textContent()) || (await control.getAttribute('aria-label')) || '').trim()
        expect(box.x, `left bound (${label}) at ${width}px`).toBeGreaterThanOrEqual(0)
        expect(
          box.x + box.width,
          `right bound (${label}) at ${width}px`
        ).toBeLessThanOrEqual(width + 0.5)
        expect(
          Number(box.height.toFixed(2)),
          `touch target height (${label}) at ${width}px`
        ).toBeGreaterThanOrEqual(44)
      }
    }

    // Also verify unlocked Video tool inside Fitness Lab at 320px
    await page.setViewportSize({ width: 320, height: 850 })
    await page.route('**/api/account/entitlements', route =>
      route.fulfill({
        json: {
          features: {
            nutrition: { active: true, expiresAt: null, usesRemaining: null },
            travel: { active: true, expiresAt: null, usesRemaining: null },
            'video-review': { active: true, expiresAt: null, usesRemaining: 3 },
          },
        },
      })
    )
    await page.goto('/test-harness/fitness-mobile?workspace=video')
    const lab = page.locator('.fitness-lab-view')
    await expect(
      lab.getByRole('heading', { name: 'Kinetic Form Diagnostics & Correctives Studio' })
    ).toBeVisible({ timeout: 25_000 })

    for (const control of await lab.locator('button, input, select, textarea, summary, a').all()) {
      if (!(await control.isVisible())) continue
      const box = (await control.boundingBox())!
      const label = ((await control.textContent()) || '').trim()
      expect(box.x, label).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, label).toBeLessThanOrEqual(320.5)
      expect(Number(box.height.toFixed(2)), label).toBeGreaterThanOrEqual(44)
    }
  })
})
