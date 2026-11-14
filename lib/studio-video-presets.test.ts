import { describe, expect, it } from 'vitest'
import {
  FORGE_DARK_TACTICAL_BACKDROP_URL,
  LOW_LIGHT_LUMINANCE_THRESHOLD,
  LOW_LIGHT_RECOVERY_THRESHOLD,
  PURE_CHROMA_MATTE_HEX,
  STUDIO_BACKGROUND_MODE_LIST,
  STUDIO_BACKGROUND_MODES,
  STUDIO_FRAMING_GUIDES,
  STUDIO_LIGHTING_PRESET_LIST,
  STUDIO_LIGHTING_PRESETS,
  STUDIO_MAX_FRAME_BUDGET_MS,
  STUDIO_MIN_TARGET_FPS,
  buildStudioConstraintFallbackChain,
  buildStudioMediaConstraints,
  computeMeanFrameLuminance,
  evaluateLowLightRoom,
  evaluatePerformanceGuardrail,
  resolveStudioShaderUniforms,
} from './studio-video-presets'

describe('Forge Studio Video Presets, Constraints & Guardrails', () => {
  it('configures 1080p high-bitrate camera constraints and 48kHz voice-isolated audio', () => {
    const hd = buildStudioMediaConstraints('user', 'hd')
    const video = hd.video as MediaTrackConstraints
    const audio = hd.audio as MediaTrackConstraints

    expect(video.width).toEqual({ ideal: 1920, min: 1280 })
    expect(video.height).toEqual({ ideal: 1080, min: 720 })
    expect(video.frameRate).toEqual({ ideal: 30, max: 60 })
    expect(video.facingMode).toBe('user')

    expect(audio.echoCancellation).toBe(true)
    expect(audio.noiseSuppression).toBe(true)
    expect(audio.autoGainControl).toBe(true)
    expect(audio.sampleRate).toBe(48000)
  })

  it('builds a progressive fallback chain and adapts cleanly on cellular bandwidth tiers', () => {
    const sd = buildStudioMediaConstraints('environment', 'sd')
    const sdVideo = sd.video as MediaTrackConstraints
    expect(sdVideo.facingMode).toBe('environment')
    expect((sdVideo.width as ConstrainULongRange).ideal).toBeLessThan(1920)

    const chain = buildStudioConstraintFallbackChain('user', 'hd')
    expect(chain.length).toBeGreaterThanOrEqual(5)
    expect(chain[chain.length - 1]).toEqual({ video: true })
  })

  it('defines all 4 Forge Studio LUT lighting presets with skin-safe parameters', () => {
    expect(STUDIO_LIGHTING_PRESET_LIST.map(p => p.id)).toEqual([
      'studio_natural',
      'warm_tactile',
      'high_contrast_form',
      'raw',
    ])

    const natural = STUDIO_LIGHTING_PRESETS.studio_natural
    expect(natural.sharpenStrength).toBe(0.25)
    expect(natural.vignette).toBe(0.1)
    expect(natural.skinToneProtect).toBe(1.0)

    const raw = STUDIO_LIGHTING_PRESETS.raw
    expect(raw.shadowLift).toBe(0)
    expect(raw.gamma).toBe(1.0)
    expect(raw.sharpenStrength).toBe(0)
    expect(raw.vignette).toBe(0)
  })

  it('boosts shadow lift, midtone gamma, and highlight rolloff when Low-Light Studio Boost is enabled', () => {
    const normal = resolveStudioShaderUniforms('studio_natural', false)
    const boosted = resolveStudioShaderUniforms('studio_natural', true)

    expect(boosted.shadowLift).toBeGreaterThan(normal.shadowLift)
    expect(boosted.gamma).toBeGreaterThan(normal.gamma)
    expect(boosted.highlightRolloff).toBeGreaterThan(normal.highlightRolloff)
    expect(boosted.sharpenStrength).toBeGreaterThanOrEqual(0.25)
  })

  it('computes mean Rec.709 frame luminance and detects low-light rooms (<75) with hysteresis', () => {
    // 4 dark pixels: RGB(40, 45, 50) -> luma ~ 44.3 < 75
    const darkPixels = new Uint8ClampedArray([
      40, 45, 50, 255,
      40, 45, 50, 255,
      40, 45, 50, 255,
      40, 45, 50, 255,
    ])
    const darkLuma = computeMeanFrameLuminance(darkPixels)
    expect(darkLuma).toBeLessThan(LOW_LIGHT_LUMINANCE_THRESHOLD)
    expect(evaluateLowLightRoom(darkLuma, false)).toBe(true)

    // Hysteresis zone (75..83): stays true if previously low-light, false if previously well-lit
    expect(evaluateLowLightRoom(79, true)).toBe(true)
    expect(evaluateLowLightRoom(79, false)).toBe(false)

    // Above recovery threshold (84+): clears low-light warning
    expect(evaluateLowLightRoom(LOW_LIGHT_RECOVERY_THRESHOLD + 4, true)).toBe(false)
  })

  it('defines all 4 Studio Background Modes (14px Bokeh Blur, Forge Dark Tactical Studio, #121417 Pure Chroma, Off)', () => {
    expect(STUDIO_BACKGROUND_MODE_LIST.map(m => m.id)).toEqual([
      'bokeh_blur',
      'forge_dark_studio',
      'pure_chroma',
      'off',
    ])

    expect(STUDIO_BACKGROUND_MODES.bokeh_blur.blurRadiusPx).toBe(14)
    expect(STUDIO_BACKGROUND_MODES.forge_dark_studio.backdropUrl).toBe(
      FORGE_DARK_TACTICAL_BACKDROP_URL
    )
    expect(STUDIO_BACKGROUND_MODES.pure_chroma.matteHex).toBe(PURE_CHROMA_MATTE_HEX)
    expect(PURE_CHROMA_MATTE_HEX).toBe('#121417')
  })

  it('steps segmentation tier down cleanly when frame render time drops below 22fps (>45.45ms)', () => {
    expect(STUDIO_MIN_TARGET_FPS).toBe(22)
    expect(STUDIO_MAX_FRAME_BUDGET_MS).toBeCloseTo(45.45, 1)

    let currentTier: 'high' | 'balanced' | 'eco' = 'high'
    let sustainedSlowFrames = 0
    let sustainedFastFrames = 0

    // Simulate 4 consecutive slow checks at 52ms/frame (~19.2 fps < 22 fps)
    for (let i = 0; i < 4; i += 1) {
      const res = evaluatePerformanceGuardrail({
        emaFrameRenderMs: 52,
        currentTier,
        sustainedSlowFrames,
        sustainedFastFrames,
      })
      currentTier = res.tier
      sustainedSlowFrames = res.sustainedSlowFrames
      sustainedFastFrames = res.sustainedFastFrames
    }

    expect(currentTier).toBe('balanced')

    // Continue dropping below 22fps -> steps down to eco
    for (let i = 0; i < 4; i += 1) {
      const res = evaluatePerformanceGuardrail({
        emaFrameRenderMs: 55,
        currentTier,
        sustainedSlowFrames,
        sustainedFastFrames,
      })
      currentTier = res.tier
      sustainedSlowFrames = res.sustainedSlowFrames
      sustainedFastFrames = res.sustainedFastFrames
    }

    expect(currentTier).toBe('eco')

    // Sustained fast GPU headroom (16ms/frame = 60fps) recovers conservatively
    for (let i = 0; i < 16; i += 1) {
      const res = evaluatePerformanceGuardrail({
        emaFrameRenderMs: 16,
        currentTier,
        sustainedSlowFrames,
        sustainedFastFrames,
      })
      currentTier = res.tier
      sustainedSlowFrames = res.sustainedSlowFrames
      sustainedFastFrames = res.sustainedFastFrames
    }

    expect(currentTier).toBe('balanced')
  })

  it('defines Pre-Call Green Room framing guides for Head-to-Toe and Upper-Body Desk Check', () => {
    expect(STUDIO_FRAMING_GUIDES.head_to_toe.label).toContain('Head-to-Toe')
    expect(STUDIO_FRAMING_GUIDES.upper_body_desk.label).toContain('Upper-Body Desk Check')
  })
})
