import { expect, test } from '@playwright/test'

for (const width of [320, 393]) {
  for (const scenario of ['timed', 'band', 'circuit', 'hypertrophy', 'strength', 'power']) {
    test(`${scenario} workout controls fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 })
      await page.goto(`/test-harness/fitness-mobile?scenario=${scenario}`)
      await page.getByRole('button', { name: '2. Lifts', exact: true }).click()
      if (scenario === 'power' || scenario === 'hypertrophy') {
        await page.getByRole('button', { name: /Supersets: OFF/ }).click()
      }
      const card = scenario === 'power' || scenario === 'hypertrophy'
        ? page.getByTestId('superset-pair-card')
        : page.locator('#exercise-item-1-0')
      await expect(card).toBeVisible()
      if (scenario === 'band') {
        await card.locator('summary').filter({ hasText: 'Band color & resistance' }).click()
        await card.getByRole('button', { name: 'Green (~35lb)', exact: true }).click()
        await expect(card.getByRole('textbox', { name: 'Weight in pounds' })).toHaveValue('35')
        await expect(card.getByRole('button', { name: 'Green (~35lb)', exact: true })).toHaveAttribute('aria-pressed', 'true')
      }
      if (scenario !== 'power' && scenario !== 'hypertrophy') {
        await card.locator('summary').filter({ hasText: 'Edit set details' }).click()
      }
      for (const control of await card.locator('input:not([type=checkbox]), button').all()) {
        if (!(await control.isVisible())) continue
        const box = await control.boundingBox()
        expect(box, (await control.getAttribute('aria-label')) ?? '').not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        expect(Number(box!.height.toFixed(3)), (await control.textContent()) ?? '').toBeGreaterThanOrEqual(44)
      }
      if (scenario === 'timed') {
        await expect(card.getByRole('textbox', { name: 'Duration in seconds' })).toHaveValue('30')
        await expect(card).toContainText('30s hold per side')
        await card.getByRole('button', { name: /Start 30s Countdown/ }).click()
        await expect(card.getByRole('button', { name: /Stop Hold/ })).toBeVisible()
        await card.getByRole('button', { name: /Stop Hold/ }).click()
        const foam = page.locator('#exercise-item-1-1')
        await foam.locator('summary').first().click()
        await expect(foam.getByRole('textbox', { name: 'Duration in seconds' })).toHaveValue('45')
        await expect(foam).toContainText('45s SMR roll per side')
        await expect(foam.getByRole('button', { name: /Start 45s Countdown/ })).toBeVisible()
      } else {
        await expect(card.getByRole('textbox', { name: 'Number of reps' })).toHaveValue(
          scenario === 'strength' || scenario === 'power' ? '1' : scenario === 'band' || scenario === 'circuit' ? '12' : '8',
        )
      }
      if (scenario === 'circuit') {
        const unilateral = page.locator('#exercise-item-1-1')
        await unilateral.locator('summary').first().click()
        await expect(unilateral.getByRole('textbox', { name: 'Number of reps' })).toHaveValue('8')
        await expect(unilateral).toContainText('8-10 reps per leg')
      }
    })
  }

  for (const stage of ['warmup', 'cooldown', 'cardio']) {
    test(`${stage} stage controls fit and work at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 })
      await page.goto('/test-harness/fitness-mobile?scenario=timed')
      await page.getByRole('button', { name: stage === 'warmup' ? '1. Warm-Up' : stage === 'cooldown' ? '4. Cool-Down' : '3. Cardio', exact: true }).click()
      const region = stage === 'cardio'
        ? page.locator('form').filter({ has: page.getByRole('textbox', { name: 'Cardio duration in minutes' }) })
        : page.getByRole('region', { name: stage === 'warmup' ? 'Pre-Lift Kinetic Warmup' : 'Post-Workout Clinical Cool-Down', exact: true })
      await expect(region).toBeVisible()
      for (const control of await region.locator('button, input:not([type=checkbox]), select').all()) {
        if (!(await control.isVisible())) continue
        const box = await control.boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        expect(Number(box!.height.toFixed(3)), (await control.textContent()) ?? '').toBeGreaterThanOrEqual(44)
      }
      if (stage !== 'cardio') {
        const item = region.locator('details').first()
        await item.getByRole('button', { name: 'Mark Done', exact: true }).click()
        await expect(item.getByRole('checkbox')).toBeChecked()
      }
    })
  }
}
