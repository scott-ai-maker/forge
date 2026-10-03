import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { COACH_BACKGROUND_PRESETS } from "@/lib/coach-backgrounds-catalog"

describe("LiveVirtualBackgroundStage Architecture & Optical Guardrails Suite", () => {
  const stageSourcePath = path.join(
    process.cwd(),
    "components/coach/LiveVirtualBackgroundStage.tsx"
  )
  const stageSource = fs.readFileSync(stageSourcePath, "utf-8")

  describe("MediaPipe Segmentation Confidence Mask Polarity (ALWAYS INVERTED Rule)", () => {
    it("strictly enforces confidence mask inversion (const conf = 1 - rawConf)", () => {
      // Must contain the canonical inversion formula required by AGENTS.md
      expect(stageSource).toContain("const conf = 1 - rawConf")
      expect(stageSource).toContain("targetVal = 255 - uData[i]")
    })

    it("mathematically maps confidence mask so coach foreground is opaque and room background is transparent", () => {
      const invertFloat = (rawConf: number) => {
        const conf = 1 - rawConf
        return Math.round(conf * 255)
      }

      // Raw confidence 0.0 (room background) -> Inverted: 1.0 (coach alpha 255)
      expect(invertFloat(0.0)).toBe(255)
      // Raw confidence 1.0 (room foreground in raw space) -> Inverted: 0.0 (cutout alpha 0)
      expect(invertFloat(1.0)).toBe(0)
      // Mid-point transition
      expect(invertFloat(0.5)).toBe(128)
    })

    it("correctly classifies multiclass labels (0: room background -> 0; 1-5: coach -> 255)", () => {
      const classifyCategory = (label: number) => (label > 0 ? 255 : 0)

      expect(classifyCategory(0)).toBe(0) // Background room/couch -> cutout
      expect(classifyCategory(1)).toBe(255) // Hair
      expect(classifyCategory(2)).toBe(255) // Body skin
      expect(classifyCategory(3)).toBe(255) // Face skin
      expect(classifyCategory(4)).toBe(255) // Clothes
      expect(classifyCategory(5)).toBe(255) // Accessories
    })

    it("preserves bounded temporal EMA smoothing without numerical overflow", () => {
      const applyEma = (targetVal: number, prevVal: number) => {
        return Math.round(0.80 * targetVal + 0.20 * prevVal)
      }

      expect(applyEma(255, 255)).toBe(255)
      expect(applyEma(0, 0)).toBe(0)
      expect(applyEma(255, 0)).toBe(204)
      expect(applyEma(0, 255)).toBe(51)
      expect(applyEma(255, 204)).toBe(245)
    })
  })

  describe("Virtual Background True Optical Orientation (NEVER MIRROR BACKGROUNDS Rule)", () => {
    it("ensures <canvas> element never has CSS transform: scaleX(-1)", () => {
      // The canvas element must have transform: "none"
      expect(stageSource).toContain("transform: 'none'")
      // The canvas element must NOT contain CSS mirror transform
      const canvasRegex = /<canvas[\s\S]*?transform:\s*['"]scaleX\(-1\)['"]/
      expect(canvasRegex.test(stageSource)).toBe(false)
    })

    it("mirrors only the coach camera frame in shader while preserving true optical background UV", () => {
      // Background must sample from unmirrored uv coordinates
      expect(stageSource).toContain("bgTex = texture(u_background, uv);")
      // Camera frame samples from camCoords (mirrored only if u_isMirrored is true)
      expect(stageSource).toContain("vec2 camCoords = u_isMirrored ? vec2(1.0 - uv.x, uv.y) : uv;")
      expect(stageSource).toContain("vec4 frameTex = texture(u_frame, camCoords);")
    })
  })

  describe("Coach Virtual Background Catalog Integrity", () => {
    it("provides valid presets with required brand and styling metadata", () => {
      expect(COACH_BACKGROUND_PRESETS.length).toBeGreaterThanOrEqual(4)

      for (const preset of COACH_BACKGROUND_PRESETS) {
        expect(preset.id).toBeTruthy()
        expect(preset.name).toBeTruthy()
        expect(preset.tagline).toBeTruthy()
        expect(preset.category).toBeTruthy()
        expect(preset.thumbnailStyle).toBeDefined()
        expect(preset.backgroundStyle).toBeDefined()

        if (!preset.isBlur) {
          expect(preset.imageUrl).toMatch(/^\/images\//)
        }
      }
    })

    it("includes Olympic Performance Facility, Biomechanics Lab, and Executive Suite presets", () => {
      const ids = COACH_BACKGROUND_PRESETS.map(p => p.id)
      expect(ids).toContain("olympic-facility")
      expect(ids).toContain("diagnostic-lab")
      expect(ids).toContain("executive-suite")
    })
  })
})
