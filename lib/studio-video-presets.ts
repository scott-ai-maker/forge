/**
 * Forge Athletic — Cinema-Grade Studio Video Presets, Constraints, Luminance & Guardrail Engine
 *
 * Centralizes deterministic configuration and pure math for:
 * 1. High-Bitrate 1080p WebRTC getUserMedia video & 48kHz voice-isolated audio constraints
 * 2. Real-time WebGL2 "Forge Studio LUT" lighting presets & Low-Light Studio Boost
 * 3. Studio-grade background segmentation modes (Bokeh Blur, Forge Dark Tactical Studio, Pure Chroma, Off)
 * 4. Automatic mobile/GPU performance guardrails (<22fps step-down) & Pre-Call Framing Guides
 */

import { BANDWIDTH_PROFILES, type ResolvedBandwidthTier } from './live-bandwidth-profiles'

export type StudioLightingPresetId =
  | 'studio_natural'
  | 'warm_tactile'
  | 'high_contrast_form'
  | 'raw'

export type StudioBackgroundMode =
  | 'bokeh_blur'
  | 'forge_dark_studio'
  | 'pure_chroma'
  | 'off'

export type StudioFramingGuideMode =
  | 'off'
  | 'head_to_toe'
  | 'upper_body_desk'

export type SegmentationPerformanceTier = 'high' | 'balanced' | 'eco'

export interface StudioLightingPresetSpec {
  id: StudioLightingPresetId
  label: string
  shortLabel: string
  description: string
  /** Shadow toe lift (0.0 - 0.45) to reveal joint angles in backlit rooms */
  shadowLift: number
  /** Midtone gamma (>1.0 lifts dark home-gym midtones gently) */
  gamma: number
  /** Highlight rolloff compression (0.0 - 0.35) to prevent window blowout */
  highlightRolloff: number
  /** Unsharp-mask kernel strength (0.25 tuned for posture lines & dumbbells) */
  sharpenStrength: number
  /** Skin-tone safe color temperature shift (-0.15 cool .. +0.15 warm) */
  warmth: number
  /** Micro-contrast S-curve factor (1.0 = neutral) */
  contrast: number
  /** Dark-tactile optical vignette strength (0.10 = 10% subtle edge falloff) */
  vignette: number
  /** Protects warm skin chroma from over-saturation or color cast (0.0 - 1.0) */
  skinToneProtect: number
}

export interface StudioBackgroundModeSpec {
  id: StudioBackgroundMode
  label: string
  shortLabel: string
  description: string
  /** Gaussian / disc optical blur radius in CSS px at 1080p reference */
  blurRadiusPx: number
  /** Optional architectural studio backdrop asset rendered in true optical orientation */
  backdropUrl: string | null
  /** Neutral seamless cyclorama hex color for Pure Chroma mode */
  matteHex: string | null
  matteRgbNormalized: [number, number, number]
}

export interface StudioFramingGuideSpec {
  id: StudioFramingGuideMode
  label: string
  shortLabel: string
  distanceHint: string
  instruction: string
}

export interface ResolvedStudioShaderUniforms {
  shadowLift: number
  gamma: number
  highlightRolloff: number
  sharpenStrength: number
  warmth: number
  contrast: number
  vignette: number
  skinToneProtect: number
}

export interface PerformanceGuardrailSample {
  emaFrameRenderMs: number
  currentTier: SegmentationPerformanceTier
  sustainedSlowFrames: number
  sustainedFastFrames: number
}

export interface PerformanceGuardrailResolution {
  tier: SegmentationPerformanceTier
  /** Minimum interval (ms) between MediaPipe segmentation passes */
  inferenceIntervalMs: number
  /** Downsampled width fed into segmentation / mask upload */
  maskScaleFactor: number
  /** Bokeh tap count multiplier (1.0 = full 2-ring 17-tap, 0.5 = fast 9-tap) */
  bokehQuality: number
  sustainedSlowFrames: number
  sustainedFastFrames: number
  isGuardrailActive: boolean
}

/** Mean Rec.709 luminance threshold (0-255) below which Smart Auto-Light Boost is offered */
export const LOW_LIGHT_LUMINANCE_THRESHOLD = 75

/** Upper luminance threshold for hysteresis so low-light detection never flickers */
export const LOW_LIGHT_RECOVERY_THRESHOLD = 84

/** Minimum acceptable live studio framerate before stepping segmentation resolution down */
export const STUDIO_MIN_TARGET_FPS = 22

/** Frame render time budget corresponding to 22fps (~45.45ms/frame) */
export const STUDIO_MAX_FRAME_BUDGET_MS = 1000 / STUDIO_MIN_TARGET_FPS

/** Default architectural Forge Dark Tactical Studio backdrop (true optical orientation) */
export const FORGE_DARK_TACTICAL_BACKDROP_URL =
  '/images/backgrounds/coach-hypertrophy-muscular-architecture.jpg'

/** Pure Chroma neutral dark charcoal seamless matte (#121417) */
export const PURE_CHROMA_MATTE_HEX = '#121417'
export const PURE_CHROMA_MATTE_RGB: [number, number, number] = [
  0x12 / 255,
  0x14 / 255,
  0x17 / 255,
]

export const STUDIO_LIGHTING_PRESETS: Record<StudioLightingPresetId, StudioLightingPresetSpec> = {
  studio_natural: {
    id: 'studio_natural',
    label: 'Studio Natural',
    shortLabel: 'Natural',
    description: 'Balanced shadow lift, 0.25 crisp posture sharpening & skin-safe neutral grade',
    shadowLift: 0.16,
    gamma: 1.12,
    highlightRolloff: 0.10,
    sharpenStrength: 0.25,
    warmth: 0.02,
    contrast: 1.04,
    vignette: 0.10,
    skinToneProtect: 1.0,
  },
  warm_tactile: {
    id: 'warm_tactile',
    label: 'Warm Tactile',
    shortLabel: 'Warm',
    description: 'Architectural boutique tungsten warmth with soft shadow recovery & 10% vignette',
    shadowLift: 0.18,
    gamma: 1.14,
    highlightRolloff: 0.12,
    sharpenStrength: 0.25,
    warmth: 0.075,
    contrast: 1.05,
    vignette: 0.10,
    skinToneProtect: 1.0,
  },
  high_contrast_form: {
    id: 'high_contrast_form',
    label: 'High-Contrast Form',
    shortLabel: 'Form Contrast',
    description: 'Enhanced joint-angle micro-contrast & landmark edge clarity for movement screens',
    shadowLift: 0.14,
    gamma: 1.08,
    highlightRolloff: 0.14,
    sharpenStrength: 0.32,
    warmth: 0.0,
    contrast: 1.15,
    vignette: 0.10,
    skinToneProtect: 0.9,
  },
  raw: {
    id: 'raw',
    label: 'Raw / Unfiltered',
    shortLabel: 'Raw',
    description: 'Unmodified sensor color & native contrast without studio LUT grading',
    shadowLift: 0.0,
    gamma: 1.0,
    highlightRolloff: 0.0,
    sharpenStrength: 0.0,
    warmth: 0.0,
    contrast: 1.0,
    vignette: 0.0,
    skinToneProtect: 0.0,
  },
}

export const STUDIO_LIGHTING_PRESET_LIST: StudioLightingPresetSpec[] = [
  STUDIO_LIGHTING_PRESETS.studio_natural,
  STUDIO_LIGHTING_PRESETS.warm_tactile,
  STUDIO_LIGHTING_PRESETS.high_contrast_form,
  STUDIO_LIGHTING_PRESETS.raw,
]

export const STUDIO_BACKGROUND_MODES: Record<StudioBackgroundMode, StudioBackgroundModeSpec> = {
  bokeh_blur: {
    id: 'bokeh_blur',
    label: 'Studio Bokeh Blur',
    shortLabel: 'Bokeh Blur',
    description: '14px optical depth-of-field blur with guided bilateral edge feathering',
    blurRadiusPx: 14,
    backdropUrl: null,
    matteHex: null,
    matteRgbNormalized: PURE_CHROMA_MATTE_RGB,
  },
  forge_dark_studio: {
    id: 'forge_dark_studio',
    label: 'Forge Dark Tactical Studio',
    shortLabel: 'Forge Studio',
    description: 'Dark architectural Forge Athletic performance studio backdrop',
    blurRadiusPx: 0,
    backdropUrl: FORGE_DARK_TACTICAL_BACKDROP_URL,
    matteHex: '#0B0E14',
    matteRgbNormalized: [11 / 255, 14 / 255, 20 / 255],
  },
  pure_chroma: {
    id: 'pure_chroma',
    label: 'Pure Chroma / Clean Matte',
    shortLabel: 'Pure Matte',
    description: 'Seamless dark charcoal #121417 backdrop for clinical NASM form analysis',
    blurRadiusPx: 0,
    backdropUrl: null,
    matteHex: PURE_CHROMA_MATTE_HEX,
    matteRgbNormalized: PURE_CHROMA_MATTE_RGB,
  },
  off: {
    id: 'off',
    label: 'Off (Original Room)',
    shortLabel: 'Original Room',
    description: 'Shows your physical training space with zero segmentation overhead',
    blurRadiusPx: 0,
    backdropUrl: null,
    matteHex: null,
    matteRgbNormalized: PURE_CHROMA_MATTE_RGB,
  },
}

export const STUDIO_BACKGROUND_MODE_LIST: StudioBackgroundModeSpec[] = [
  STUDIO_BACKGROUND_MODES.bokeh_blur,
  STUDIO_BACKGROUND_MODES.forge_dark_studio,
  STUDIO_BACKGROUND_MODES.pure_chroma,
  STUDIO_BACKGROUND_MODES.off,
]

export const STUDIO_FRAMING_GUIDES: Record<StudioFramingGuideMode, StudioFramingGuideSpec> = {
  off: {
    id: 'off',
    label: 'Framing Off',
    shortLabel: 'Off',
    distanceHint: 'Free framing',
    instruction: 'Framing guides hidden.',
  },
  head_to_toe: {
    id: 'head_to_toe',
    label: 'Head-to-Toe Full Body',
    shortLabel: 'Head-to-Toe',
    distanceHint: '6–8 ft back · Waist height',
    instruction: 'Step back 6–8 ft so overhead reach and both ankles fit cleanly inside the alignment zone.',
  },
  upper_body_desk: {
    id: 'upper_body_desk',
    label: 'Upper-Body Desk Check',
    shortLabel: 'Upper-Body Desk',
    distanceHint: '2–3 ft · Eye level',
    instruction: 'Center eyes along the upper sightline with both shoulders framed clearly for briefing & check-ins.',
  },
}

export const STUDIO_FRAMING_GUIDE_LIST: StudioFramingGuideSpec[] = [
  STUDIO_FRAMING_GUIDES.off,
  STUDIO_FRAMING_GUIDES.head_to_toe,
  STUDIO_FRAMING_GUIDES.upper_body_desk,
]

/**
 * Builds high-bitrate 1080p video + 48kHz voice-isolated audio getUserMedia constraints.
 * Adapts gracefully when operating in cellular / low-bandwidth tiers.
 */
export function buildStudioMediaConstraints(
  facingMode: 'user' | 'environment' = 'user',
  effectiveTier: ResolvedBandwidthTier = 'hd'
): MediaStreamConstraints {
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
    channelCount: 1,
  }

  if (effectiveTier === 'hd') {
    return {
      video: {
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, max: 60 },
        facingMode,
      },
      audio: audioConstraints,
    }
  }

  const tierSpec = BANDWIDTH_PROFILES[effectiveTier]
  return {
    video: {
      width: { ideal: tierSpec.cameraWidthIdeal, min: 320 },
      height: { ideal: tierSpec.cameraHeightIdeal, min: 180 },
      frameRate: { ideal: tierSpec.cameraFrameRateIdeal, max: Math.max(15, tierSpec.maxFramerate) },
      facingMode,
    },
    audio: audioConstraints,
  }
}

/**
 * Ordered progressive fallback chain for getUserMedia so 1080p capable cameras capture
 * full HD while 720p laptop webcams, virtual test cameras, or mic-less devices never reject.
 */
export function buildStudioConstraintFallbackChain(
  facingMode: 'user' | 'environment' = 'user',
  effectiveTier: ResolvedBandwidthTier = 'hd'
): MediaStreamConstraints[] {
  const primary = buildStudioMediaConstraints(facingMode, effectiveTier)
  const isolatedAudio: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000,
  }

  return [
    primary,
    {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 },
        facingMode,
      },
      audio: isolatedAudio,
    },
    {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode,
      },
      audio: isolatedAudio,
    },
    {
      video: true,
      audio: true,
    },
    {
      video: true,
    },
  ]
}

/**
 * Resolves real-time WebGL shader uniforms for the selected Forge Studio LUT preset
 * combined with optional 1-tap Low-Light Studio Boost.
 */
export function resolveStudioShaderUniforms(
  presetId: StudioLightingPresetId,
  lowLightBoostEnabled: boolean
): ResolvedStudioShaderUniforms {
  const base = STUDIO_LIGHTING_PRESETS[presetId] ?? STUDIO_LIGHTING_PRESETS.studio_natural
  if (!lowLightBoostEnabled) {
    return {
      shadowLift: base.shadowLift,
      gamma: base.gamma,
      highlightRolloff: base.highlightRolloff,
      sharpenStrength: base.sharpenStrength,
      warmth: base.warmth,
      contrast: base.contrast,
      vignette: base.vignette,
      skinToneProtect: base.skinToneProtect,
    }
  }

  return {
    shadowLift: Math.min(0.46, base.shadowLift + 0.22),
    gamma: Math.min(1.42, base.gamma + 0.18),
    highlightRolloff: Math.max(0.18, base.highlightRolloff + 0.08),
    sharpenStrength: Math.max(0.25, base.sharpenStrength),
    warmth: presetId === 'raw' ? 0.015 : base.warmth,
    contrast: Math.max(1.05, base.contrast),
    vignette: presetId === 'raw' ? 0.06 : base.vignette,
    skinToneProtect: Math.max(0.85, base.skinToneProtect),
  }
}

/**
 * Computes mean Rec.709 perceptual luminance (0-255) from an RGBA8 pixel buffer.
 */
export function computeMeanFrameLuminance(rgbaPixels: Uint8ClampedArray | Uint8Array): number {
  if (!rgbaPixels || rgbaPixels.length < 4) return 128

  let sum = 0
  let count = 0
  for (let i = 0; i + 2 < rgbaPixels.length; i += 4) {
    const r = rgbaPixels[i]
    const g = rgbaPixels[i + 1]
    const b = rgbaPixels[i + 2]
    sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
    count += 1
  }

  if (count === 0) return 128
  return Math.round((sum / count) * 10) / 10
}

/**
 * Evaluates low-light room detection (< 75 luminance) with hysteresis to avoid badge chatter.
 */
export function evaluateLowLightRoom(
  meanLuminance: number,
  previouslyLowLight = false
): boolean {
  if (!Number.isFinite(meanLuminance)) return previouslyLowLight
  if (previouslyLowLight) {
    return meanLuminance < LOW_LIGHT_RECOVERY_THRESHOLD
  }
  return meanLuminance < LOW_LIGHT_LUMINANCE_THRESHOLD
}

/**
 * Automatic Performance Guardrail:
 * Monitors rolling ms/frame and steps segmentation cadence/resolution down cleanly
 * when a low-power mobile device drops below 22fps (>45.45ms/frame) so live WebRTC
 * coaching audio and video never stutter.
 */
export function evaluatePerformanceGuardrail(
  sample: PerformanceGuardrailSample
): PerformanceGuardrailResolution {
  const { emaFrameRenderMs, currentTier } = sample
  let { sustainedSlowFrames, sustainedFastFrames } = sample

  const isBelow22Fps = emaFrameRenderMs > STUDIO_MAX_FRAME_BUDGET_MS
  const isComfortablyFast = emaFrameRenderMs < 26.0 // > ~38fps headroom

  if (isBelow22Fps) {
    sustainedSlowFrames += 1
    sustainedFastFrames = 0
  } else if (isComfortablyFast) {
    sustainedFastFrames += 1
    sustainedSlowFrames = Math.max(0, sustainedSlowFrames - 1)
  } else {
    sustainedSlowFrames = Math.max(0, sustainedSlowFrames - 1)
    sustainedFastFrames = Math.max(0, sustainedFastFrames - 1)
  }

  let nextTier: SegmentationPerformanceTier = currentTier

  // Step down after 4 consecutive slow checks (<22fps)
  if (sustainedSlowFrames >= 4) {
    if (currentTier === 'high') {
      nextTier = 'balanced'
      sustainedSlowFrames = 0
    } else if (currentTier === 'balanced') {
      nextTier = 'eco'
      sustainedSlowFrames = 0
    }
  } else if (sustainedFastFrames >= 16) {
    // Recover conservatively only when sustained GPU headroom returns
    if (currentTier === 'eco') {
      nextTier = 'balanced'
      sustainedFastFrames = 0
    } else if (currentTier === 'balanced') {
      nextTier = 'high'
      sustainedFastFrames = 0
    }
  }

  const tierSpecs: Record<
    SegmentationPerformanceTier,
    { inferenceIntervalMs: number; maskScaleFactor: number; bokehQuality: number }
  > = {
    high: { inferenceIntervalMs: 33, maskScaleFactor: 1.0, bokehQuality: 1.0 },
    balanced: { inferenceIntervalMs: 50, maskScaleFactor: 0.75, bokehQuality: 0.75 },
    eco: { inferenceIntervalMs: 68, maskScaleFactor: 0.56, bokehQuality: 0.5 },
  }

  const spec = tierSpecs[nextTier]
  return {
    tier: nextTier,
    inferenceIntervalMs: spec.inferenceIntervalMs,
    maskScaleFactor: spec.maskScaleFactor,
    bokehQuality: spec.bokehQuality,
    sustainedSlowFrames,
    sustainedFastFrames,
    isGuardrailActive: nextTier !== 'high',
  }
}
