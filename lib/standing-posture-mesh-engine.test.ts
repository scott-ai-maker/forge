import { describe, expect, it } from 'vitest'
import { evaluateStandingPostureFromMediaPipe } from '@/lib/standing-posture-mesh-engine'

describe('Standing 33-Point Posture Mesh Engine', () => {
  it('scores optimal upright standing higher than mild drift and severe kyphotic slouch across aspect ratios', () => {
    const makeStanding = (opts: { earX: number; shX: number; hipX: number; kneeX: number; ankleX: number }, w: number, h: number) => {
      const arr = Array.from({ length: 33 }, () => ({ x: 0.5, y: 1.2, visibility: 0.05 }))
      arr[0] = { x: (opts.earX + 45) / w, y: 155 / h, visibility: 0.99 }
      arr[8] = { x: opts.earX / w, y: 150 / h, visibility: 0.98 }
      arr[12] = { x: opts.shX / w, y: 290 / h, visibility: 0.98 }
      arr[14] = { x: opts.shX / w, y: 450 / h, visibility: 0.95 }
      arr[16] = { x: (opts.shX + 10) / w, y: 590 / h, visibility: 0.95 }
      arr[24] = { x: opts.hipX / w, y: 560 / h, visibility: 0.98 }
      arr[26] = { x: opts.kneeX / w, y: 780 / h, visibility: 0.97 }
      arr[28] = { x: opts.ankleX / w, y: 990 / h, visibility: 0.97 }
      arr[32] = { x: (opts.ankleX + 75) / w, y: 1010 / h, visibility: 0.95 }
      return arr
    }

    const upright = evaluateStandingPostureFromMediaPipe(
      makeStanding({ earX: 520, shX: 500, hipX: 498, kneeX: 500, ankleX: 495 }, 1200, 1200),
      { imageWidth: 1200, imageHeight: 1200 }
    )!
    const mild = evaluateStandingPostureFromMediaPipe(
      makeStanding({ earX: 558, shX: 502, hipX: 496, kneeX: 500, ankleX: 495 }, 1200, 1200),
      { imageWidth: 1200, imageHeight: 1200 }
    )!
    const slouched = evaluateStandingPostureFromMediaPipe(
      makeStanding({ earX: 615, shX: 530, hipX: 492, kneeX: 520, ankleX: 492 }, 1200, 1200),
      { imageWidth: 1200, imageHeight: 1200 }
    )!

    expect(upright.strainFlag).toBe('optimal')
    expect(upright.score).toBeGreaterThanOrEqual(92)

    expect(mild.strainFlag).toBe('amber')
    expect(mild.score).toBeLessThan(upright.score)
    expect(mild.score).toBeGreaterThan(slouched.score)

    expect(slouched.strainFlag).toBe('coral')
    expect(slouched.score).toBeLessThan(60)

    // Verify aspect-ratio invariance (1600x1200 vs 900x1200)
    const uprightPortrait = evaluateStandingPostureFromMediaPipe(
      makeStanding({ earX: 520, shX: 500, hipX: 498, kneeX: 500, ankleX: 495 }, 900, 1200),
      { imageWidth: 900, imageHeight: 1200 }
    )!
    expect(uprightPortrait.score).toBe(upright.score)
    expect(uprightPortrait.cvaDeg).toBe(upright.cvaDeg)
  })
})
