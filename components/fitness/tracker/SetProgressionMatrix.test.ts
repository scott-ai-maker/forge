import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import SetProgressionMatrix from './SetProgressionMatrix'

describe('Compact set progression', () => {
  it('excludes warm-up and other-session sets and preserves sparse working-set numbers', () => {
    const markup = renderToStaticMarkup(createElement(SetProgressionMatrix, {
      targetSets: 3,
      sessionDate: '2026-10-10',
      currentSetNumber: 2,
      units: 'metric',
      loggedSets: [
        { set_number: 1, session_date: '2026-10-10', is_warmup: true, reps: 10 },
        { set_number: 3, session_date: '2026-10-10', weight_kg: 50, reps: 8 },
        { set_number: 2, session_date: '2026-10-09', weight_kg: 45, reps: 8 },
      ],
      onSelectSet: vi.fn(),
      onAddSet: vi.fn(),
    }))
    expect(markup).toContain('1/3 completed')
    expect(markup).toContain('Set 1: not logged')
    expect(markup).toContain('Set 2: not logged')
    expect(markup).toContain('Set 3: 50 kg × 8')
    expect(markup).not.toContain('Set 4:')
  })

  it('keeps an added set selectable beyond the prescription', () => {
    const markup = renderToStaticMarkup(createElement(SetProgressionMatrix, {
      targetSets: 3,
      sessionDate: '2026-10-10',
      currentSetNumber: 4,
      units: 'metric',
      loggedSets: [],
      onSelectSet: vi.fn(),
      onAddSet: vi.fn(),
    }))
    expect(markup).toContain('Set 4: not logged')
    expect(markup).toContain('aria-pressed="true"')
  })
})
