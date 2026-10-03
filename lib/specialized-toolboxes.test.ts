import { describe, expect, it } from 'vitest'
import {
  getToolboxById,
  getAllToolboxes,
} from './specialized-toolboxes'

describe('specialized-toolboxes', () => {
  it('contains 5 turnkey specialized toolboxes', () => {
    const all = getAllToolboxes()
    expect(all.length).toBe(5)
    expect(all.some(t => t.id === 'desk_worker_posture')).toBe(true)
    expect(all.some(t => t.id === 'knee_bulletproofing')).toBe(true)
    expect(all.some(t => t.id === 'lumbar_sparing_core')).toBe(true)
  })

  it('retrieves lumbar sparing core protocol with McGill Big 3 drills', () => {
    const tb = getToolboxById('lumbar_sparing_core')
    expect(tb.title).toContain('Lumbar Sparing')
    expect(tb.keyDrills.length).toBe(3)
    expect(tb.keyDrills[0].name).toContain('McGill')
  })

  it('retrieves desk worker posture protocol with chin tucks and thoracic extension', () => {
    const tb = getToolboxById('desk_worker_posture')
    expect(tb.title).toContain('Desk Worker')
    expect(tb.nasmOptFocus).toContain('Pectoralis Major')
  })
})
