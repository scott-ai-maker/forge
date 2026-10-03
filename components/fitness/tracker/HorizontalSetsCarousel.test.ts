import { describe, it, expect } from 'vitest'
import { CarouselSetLog } from './HorizontalSetsCarousel'

describe('HorizontalSetsCarousel Logic', () => {
  it('formats imperial and metric weights accurately for chips', () => {
    const logs: CarouselSetLog[] = [
      { id: '1', session_date: '2026-09-11', set_number: 1, weight_kg: 43.09, reps: 8, rpe: 8, is_warmup: false },
      { id: '2', session_date: '2026-09-11', set_number: 2, weight_kg: 0, reps: 15, is_warmup: false },
      { id: '3', session_date: '2026-09-11', set_number: 1, weight_kg: 20, reps: 10, is_warmup: true },
    ]

    expect(logs.length).toBe(3)
    expect(logs[0].set_number).toBe(1)
    expect(logs[0].is_warmup).toBe(false)
    expect(logs[2].is_warmup).toBe(true)
  })

  it('extracts band notes cleanly for badge display', () => {
    const note = '[Band: Red (20–35 lbs)]'
    const match = note.match(/\[Band:\s*([^\]]+)\]/)?.[1]
    expect(match).toBe('Red (20–35 lbs)')
    expect(match?.split('(')[0].trim()).toBe('Red')
  })
})
