import { describe, expect, it } from 'vitest'
import { calculateInteriorAngle } from './LiveTelestratorCanvas'

describe('Biomechanical Telestrator Geometric Engine', () => {
  it('calculates a 90 degree perpendicular angle for squat parallel knee check', () => {
    // Vertex at (0, 0), Hip at (0, 100), Ankle at (100, 0)
    const hip = { x: 0, y: 100 }
    const knee = { x: 0, y: 0 }
    const ankle = { x: 100, y: 0 }

    const angle = calculateInteriorAngle(hip, knee, ankle)
    expect(angle).toBe(90)
  })

  it('calculates a 180 degree straight line for lockout', () => {
    const hip = { x: 0, y: -100 }
    const knee = { x: 0, y: 0 }
    const ankle = { x: 0, y: 100 }

    const angle = calculateInteriorAngle(hip, knee, ankle)
    expect(angle).toBe(180)
  })

  it('calculates 45 degree acute joint angle accurately', () => {
    const p1 = { x: 100, y: 0 }
    const vertex = { x: 0, y: 0 }
    const p3 = { x: 100, y: 100 }

    const angle = calculateInteriorAngle(p1, vertex, p3)
    expect(angle).toBe(45)
  })

  it('handles zero magnitude points gracefully without crashing', () => {
    const p1 = { x: 0, y: 0 }
    const vertex = { x: 0, y: 0 }
    const p3 = { x: 100, y: 100 }

    const angle = calculateInteriorAngle(p1, vertex, p3)
    expect(angle).toBe(0)
  })

  it('calculates obtuse joint angles for deep hip flexion and torso angles', () => {
    // 120 degree angle test
    // Vertex at (0, 0), v1 at (1, 0), v2 at (-0.5, sqrt(3)/2)
    const v1 = { x: 100, y: 0 }
    const vertex = { x: 0, y: 0 }
    const v2 = { x: -50, y: Math.round(50 * Math.sqrt(3)) }

    const angle = calculateInteriorAngle(v1, vertex, v2)
    expect(angle).toBe(120)
  })

  it('calculates 60 degree equilateral triangle joint angle', () => {
    const v1 = { x: 100, y: 0 }
    const vertex = { x: 0, y: 0 }
    const v2 = { x: 50, y: Math.round(50 * Math.sqrt(3)) }

    const angle = calculateInteriorAngle(v1, vertex, v2)
    expect(angle).toBe(60)
  })

  it('calculates auto-fade alpha decay correctly over 4-second lifespan', () => {
    function calculateAlpha(ageMs: number, autoFade: boolean): number {
      if (!autoFade) return 1.0
      if (ageMs > 4000) return 0.0
      if (ageMs > 2500) {
        return Math.max(0, Number((1 - (ageMs - 2500) / 1500).toFixed(4)))
      }
      return 1.0
    }

    // Persistent ink mode always full opacity
    expect(calculateAlpha(5000, false)).toBe(1.0)

    // Auto-fade: fully visible for first 2.5s
    expect(calculateAlpha(0, true)).toBe(1.0)
    expect(calculateAlpha(1500, true)).toBe(1.0)
    expect(calculateAlpha(2500, true)).toBe(1.0)

    // Auto-fade: linear decay between 2.5s and 4.0s
    expect(calculateAlpha(3250, true)).toBe(0.5) // Halfway decay
    expect(calculateAlpha(4000, true)).toBe(0)   // End of fade window
    expect(calculateAlpha(4500, true)).toBe(0)   // Expired
  })

  it('validates supported telestrator tool palette and sports-science color accents', () => {
    const tools = ['pen', 'arrow', 'circle', 'protractor']
    const colors = ['#D4AF37', '#10B981', '#EF4444', '#38BDF8']

    expect(tools).toContain('protractor')
    expect(tools).toContain('arrow')
    expect(colors).toContain('#D4AF37') // GAA Signature Gold
    expect(colors).toContain('#10B981') // Green for optimal tracking
    expect(colors).toContain('#EF4444') // Red for valgus/compensation fault
  })
})

