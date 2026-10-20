import { expect, test } from '@playwright/test'

test.describe('Mobile superset workout', () => {
  for (const width of [320, 375, 768]) {
    test(`keeps both exercises and load controls visible at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 })
      await page.goto('/test-harness/fitness-mobile?scenario=superset')
      await page.getByRole('button', { name: '2. Lifts', exact: true }).click()
      await page.getByRole('button', { name: /Supersets: OFF/ }).click()
      const card = page.getByTestId('superset-pair-card')
      await expect(card).toBeVisible()
      const exerciseA = card.getByRole('button', { name: /Exercise A.*Dumbbell Romanian Deadlift/ })
      const exerciseB = card.getByRole('button', { name: /Exercise B.*Single-Leg Romanian Deadlift/ })
      await expect(exerciseA).toBeVisible()
      await expect(exerciseB).toBeVisible()
      await expect(exerciseA).toHaveAttribute('aria-pressed', 'true')
      await expect(card.getByRole('textbox', { name: 'Number of reps' })).toHaveValue('8')
      await exerciseB.click()
      await expect(exerciseB).toHaveAttribute('aria-pressed', 'true')
      await expect(card.getByRole('textbox', { name: 'Number of reps' })).toHaveValue('12')

      const cardBox = await card.boundingBox()
      expect(cardBox).not.toBeNull()
      expect(cardBox!.x + cardBox!.width).toBeLessThanOrEqual(width)
      expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
      for (const control of await card.locator('input, button').all()) {
        if (!(await control.isVisible())) continue
        const box = await control.boundingBox()
        expect(box).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(cardBox!.x)
        expect(box!.x + box!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width)
        expect(box!.height).toBeGreaterThanOrEqual(44)
        if (await control.getAttribute('aria-label') === 'Weight in pounds') {
          expect(box!.width).toBeGreaterThanOrEqual(100)
        }
      }
      await card.getByRole('textbox', { name: 'Weight in pounds' }).fill('25')
      await card.getByRole('button', { name: 'Increase weight', exact: true }).click()
      await expect(card.getByRole('textbox', { name: 'Weight in pounds' })).toHaveValue('30')
      await exerciseA.click()
      await expect(card.getByRole('textbox', { name: 'Weight in pounds' })).toHaveValue('')
    })
  }

  test('logs alternating exercise rounds without merging rep ranges', async ({ page }) => {
    const payloads: Record<string, unknown>[] = []
    await page.route('**/api/workouts/log-set', async route => {
      const payload = route.request().postDataJSON()
      payloads.push(payload)
      await route.fulfill({ json: { setLog: {
        id: `uat-${payload.exerciseName}-${payload.setNumber}`,
        exercise_name: payload.exerciseName,
        session_date: payload.sessionDate,
        set_number: payload.setNumber,
        reps: payload.reps,
        weight_kg: payload.weightKg,
        notes: payload.notes,
      } } })
    })
    await page.setViewportSize({ width: 375, height: 850 })
    await page.goto('/test-harness/fitness-mobile?scenario=superset')
    await page.getByRole('button', { name: '2. Lifts', exact: true }).click()
    await page.getByRole('button', { name: /Supersets: OFF/ }).click()
    const card = page.getByTestId('superset-pair-card')
    const log = card.getByRole('button', { name: 'Log set & start rest', exact: true })
    await log.click()
    await expect(card.getByRole('alert')).toBeVisible()
    expect(payloads).toHaveLength(0)
    await card.getByRole('textbox', { name: 'Weight in pounds' }).fill('50')
    await card.getByRole('textbox', { name: 'Reps in reserve (0-6)' }).fill('3')
    await expect(card.getByRole('textbox', { name: 'Rate of perceived exertion (1-10)' })).toHaveCount(0)
    await log.click()
    await expect(card.getByRole('button', { name: /Exercise B.*Single-Leg/ })).toHaveAttribute('aria-pressed', 'true')
    await card.getByRole('textbox', { name: 'Weight in pounds' }).fill('25')
    await log.click()
    await expect(card.getByRole('button', { name: /^Set 2:/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(card.getByRole('textbox', { name: 'Weight in pounds' })).toHaveValue('50')
    await expect(card.getByRole('textbox', { name: 'Reps in reserve (0-6)' })).toHaveValue('')
    await log.click()
    await log.click()
    await expect(page.getByRole('button', { name: 'Advance to Stage 3 Cardio' })).toBeVisible()
    expect(payloads.map(payload => [payload.exerciseName, payload.reps, payload.setNumber])).toEqual([
      ['Dumbbell Romanian Deadlift', 8, 1],
      ['Single-Leg Romanian Deadlift', 12, 1],
      ['Dumbbell Romanian Deadlift', 8, 2],
      ['Single-Leg Romanian Deadlift', 12, 2],
    ])
    expect(payloads[0]).toMatchObject({ rpe: 7, rir: 3 })
  })
})
