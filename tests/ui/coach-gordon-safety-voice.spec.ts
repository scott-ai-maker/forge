import { expect, test } from '@playwright/test'

test.describe('Coach Gordon AI, Voice Modes, Safety Guardrails & Tier Escalation (375px Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('boots Muted by default, exposes plain-English Coaching Focus (zero RAG jargon), and enforces clinical safety overrides', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('forge_coach_audio_mode_v1')
      window.localStorage.removeItem('gaa_sfx_muted')
      window.localStorage.setItem('forge_tier_preview_v1', 'core_lab')
    })

    await page.goto('/test-harness/fitness-mobile')

    // 1. Open Coach Gordon AI Drawer from floating FAB
    const fab = page.getByTestId('global-ask-coach-gordon-fab')
    await expect(fab).toBeVisible()
    const fabBox = await fab.boundingBox()
    expect(fabBox!.height).toBeGreaterThanOrEqual(44)
    expect(fabBox!.x + fabBox!.width).toBeLessThanOrEqual(375.5)

    await fab.click()
    const drawer = page.getByTestId('coach-gordon-assistant-drawer')
    await expect(drawer).toBeVisible()

    // 2. Verify strict Muted-by-default audio state & 3-mode selector ergonomics
    const audioGroup = drawer.getByTestId('coach-audio-mode-selector')
    await expect(audioGroup).toBeVisible()
    const mutedBtn = audioGroup.getByRole('button', { name: 'Muted' })
    const voiceBtn = audioGroup.getByRole('button', { name: 'Voice + Chimes' })
    const chimesBtn = audioGroup.getByRole('button', { name: 'Chimes Only' })

    await expect(mutedBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'false')

    for (const btn of [mutedBtn, voiceBtn, chimesBtn]) {
      const box = await btn.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(375.5)
    }

    await voiceBtn.click()
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'true')

    // 3. Submit a standard coaching question -> verify Coaching Focus pills & ZERO "RAG" jargon
    const input = drawer.getByPlaceholder(/Ask about form, comfort swaps, equipment, or tempo/i)
    await input.fill('How low should I squat with tight hips?')
    await drawer.getByRole('button', { name: 'Send question to Coach Gordon AI' }).click()

    const citationsCard = drawer.getByTestId('coach-rag-citations')
    await expect(citationsCard).toBeVisible({ timeout: 25_000 })
    await expect(citationsCard).toContainText('Coaching Focus')

    const drawerText = await drawer.innerText()
    expect(drawerText).not.toMatch(/\bRAG\b/)
    expect(drawerText).not.toMatch(/pgvector|BM25/i)

    // 4. Submit an acute red-flag pain message -> verify immediate Clinical Safety Override card
    await input.fill('I felt a sharp shooting pain in my lower back')
    await drawer.getByRole('button', { name: 'Send question to Coach Gordon AI' }).click()

    const safetyCard = drawer.getByTestId('clinical-safety-override-card')
    await expect(safetyCard).toBeVisible({ timeout: 20_000 })
    await expect(safetyCard).toContainText('Clinical Boundary:')

    // 5. Open Core Lab ($19.99) Direct Email Escalation Modal
    await drawer.getByTestId('drawer-message-real-coach-btn').click()
    const escalationModal = page.getByTestId('coach-escalation-modal')
    await expect(escalationModal).toBeVisible()
    await expect(escalationModal).toContainText('Core Lab')
    await expect(escalationModal).toContainText('Direct Email Channel')
    await escalationModal.getByRole('button', { name: 'Close message composer' }).click()
  })

  test('unlocks Direct SMS + 24h Priority SLA channel for Coach Support ($199) members', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('forge_tier_preview_v1', 'coach_support')
    })

    await page.goto('/test-harness/fitness-mobile')
    await page.getByTestId('global-ask-coach-gordon-fab').click()

    const drawer = page.getByTestId('coach-gordon-assistant-drawer')
    await expect(drawer.getByTestId('drawer-message-real-coach-btn')).toContainText('SMS + 24h SLA')

    await drawer.getByTestId('drawer-message-real-coach-btn').click()
    const escalationModal = page.getByTestId('coach-escalation-modal')
    await expect(escalationModal).toBeVisible()
    await expect(escalationModal).toContainText('24h SLA · Direct SMS + Priority Thread')
  })
})
