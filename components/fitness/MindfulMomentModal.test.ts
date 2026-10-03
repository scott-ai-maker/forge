import { describe, it, expect } from 'vitest'
import { MINDFUL_PROTOCOLS, type MindfulProtocolId } from '@/components/fitness/MindfulMomentModal'

describe('MindfulMomentModal & Nervous System Protocols', () => {
  it('defines 4 core clinical autonomic protocols with valid phase durations', () => {
    const protocols: MindfulProtocolId[] = ['4-7-8', 'box', '5-5', 'stillness']
    expect(Object.keys(MINDFUL_PROTOCOLS)).toEqual(expect.arrayContaining(protocols))

    protocols.forEach(id => {
      const proto = MINDFUL_PROTOCOLS[id]
      expect(proto.name).toBeTruthy()
      expect(proto.defaultDurationMinutes).toBeGreaterThan(0)
      expect(proto.phases.length).toBeGreaterThanOrEqual(1)

      const totalPhaseDuration = proto.phases.reduce((acc, p) => acc + p.duration, 0)
      expect(totalPhaseDuration).toBeGreaterThan(0)
    })
  })

  it('4-7-8 protocol strictly follows 4s Inhale, 7s Hold, 8s Exhale vagal ratio (19s cycle)', () => {
    const p478 = MINDFUL_PROTOCOLS['4-7-8']
    expect(p478.phases).toHaveLength(3)
    expect(p478.phases[0]).toMatchObject({ type: 'inhale', duration: 4 })
    expect(p478.phases[1]).toMatchObject({ type: 'hold-in', duration: 7 })
    expect(p478.phases[2]).toMatchObject({ type: 'exhale', duration: 8 })

    const cycleSec = p478.phases.reduce((acc, p) => acc + p.duration, 0)
    expect(cycleSec).toBe(19)
  })

  it('4-4-4-4 Box breathing balances all 4 phases symmetrically (16s cycle)', () => {
    const box = MINDFUL_PROTOCOLS['box']
    expect(box.phases).toHaveLength(4)
    expect(box.phases.every(p => p.duration === 4)).toBe(true)
    const types = box.phases.map(p => p.type)
    expect(types).toEqual(['inhale', 'hold-in', 'exhale', 'hold-out'])
  })

  it('5-5 Coherent breathing targets 6 breaths/min (10s cycle) for HRV peak', () => {
    const coherent = MINDFUL_PROTOCOLS['5-5']
    expect(coherent.phases).toHaveLength(2)
    expect(coherent.phases[0]).toMatchObject({ type: 'inhale', duration: 5 })
    expect(coherent.phases[1]).toMatchObject({ type: 'exhale', duration: 5 })

    const cycleSec = coherent.phases.reduce((acc, p) => acc + p.duration, 0)
    expect(cycleSec).toBe(10)
    const breathsPerMin = 60 / cycleSec
    expect(breathsPerMin).toBe(6)
  })
})

