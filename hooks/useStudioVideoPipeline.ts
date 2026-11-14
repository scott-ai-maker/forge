'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyStillCameraConstraints } from '@/lib/camera-still-mode'
import {
  applyCameraBandwidthConstraints,
  type ResolvedBandwidthTier,
} from '@/lib/live-bandwidth-profiles'
import {
  FORGE_DARK_TACTICAL_BACKDROP_URL,
  PURE_CHROMA_MATTE_HEX,
  PURE_CHROMA_MATTE_RGB,
  STUDIO_BACKGROUND_MODES,
  buildStudioConstraintFallbackChain,
  computeMeanFrameLuminance,
  evaluateLowLightRoom,
  evaluatePerformanceGuardrail,
  resolveStudioShaderUniforms,
  type PerformanceGuardrailSample,
  type SegmentationPerformanceTier,
  type StudioBackgroundMode,
  type StudioFramingGuideMode,
  type StudioLightingPresetId,
} from '@/lib/studio-video-presets'

interface MediaPipeMask {
  width?: number
  height?: number
  getAsFloat32Array?: () => Float32Array
  getAsUint8Array?: () => Uint8Array
}

interface ImageSegmenterInstance {
  segmentForVideo: (
    video: HTMLVideoElement,
    now: number,
    cb: (result: {
      confidenceMasks?: MediaPipeMask[]
      categoryMask?: MediaPipeMask
      close?: () => void
    }) => void
  ) => void
  close?: () => void
}

interface StudioWebGLResources {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  vs: WebGLShader
  fs: WebGLShader
  vertexBuffer: WebGLBuffer
  attribPosition: number
  frameTex: WebGLTexture
  bgTex: WebGLTexture
  maskTex: WebGLTexture
  uFrame: WebGLUniformLocation | null
  uBackground: WebGLUniformLocation | null
  uMask: WebGLUniformLocation | null
  uTexelSize: WebGLUniformLocation | null
  uIsMirrored: WebGLUniformLocation | null
  uBgMode: WebGLUniformLocation | null
  uHasBgImage: WebGLUniformLocation | null
  uPureMatteColor: WebGLUniformLocation | null
  uBokehQuality: WebGLUniformLocation | null
  uShadowLift: WebGLUniformLocation | null
  uGamma: WebGLUniformLocation | null
  uHighlightRolloff: WebGLUniformLocation | null
  uSharpenStrength: WebGLUniformLocation | null
  uWarmth: WebGLUniformLocation | null
  uContrast: WebGLUniformLocation | null
  uVignette: WebGLUniformLocation | null
  uSkinToneProtect: WebGLUniformLocation | null
}

export interface UseStudioVideoPipelineOptions {
  /** Whether hardware capture & pipeline processing are enabled (default: true) */
  enabled?: boolean
  /** Initial camera facing mode ('user' default) */
  initialFacingMode?: 'user' | 'environment'
  /** Active adaptive WebRTC bandwidth tier ('hd' default) */
  effectiveTier?: ResolvedBandwidthTier
  /** Default Forge Studio LUT preset ('studio_natural' default) */
  defaultLightingPreset?: StudioLightingPresetId
  /** Default studio background segmentation mode ('bokeh_blur' default) */
  defaultBackgroundMode?: StudioBackgroundMode
  /** Default framing alignment guide ('off' default) */
  defaultFramingGuide?: StudioFramingGuideMode
  /** Optional custom architectural backdrop URL (e.g. from Virtual BG Picker) */
  customBackdropUrl?: string | null
  /** Whether to pause heavy segmentation in extreme battery-saver mode */
  ecoMode?: boolean
}

export interface StudioVideoPipelineController {
  /** Raw hardware getUserMedia stream (unprocessed camera + 48kHz mic) */
  rawStream: MediaStream | null
  /** Processed WebGL2/Canvas2D 30fps video track + 48kHz voice-isolated audio track for WebRTC */
  outputStream: MediaStream | null
  /** Friendly hardware error string if camera/mic permission fails */
  streamError: string | null
  isCameraActive: boolean
  isMicMuted: boolean
  facingMode: 'user' | 'environment'
  isMirrored: boolean
  lightingPreset: StudioLightingPresetId
  backgroundMode: StudioBackgroundMode
  framingGuide: StudioFramingGuideMode
  lowLightBoostEnabled: boolean
  isLowLightDetected: boolean
  meanLuminance: number
  /** Real-time 48kHz voice-isolated microphone input level (0 - 100) */
  micLevel: number
  renderFps: number
  frameRenderMs: number
  guardrailTier: SegmentationPerformanceTier
  isGuardrailActive: boolean
  isSegmentationReady: boolean
  isPipelineRendering: boolean
  captureResolutionLabel: string
  setLightingPreset: (preset: StudioLightingPresetId) => void
  setBackgroundMode: (mode: StudioBackgroundMode) => void
  setFramingGuide: (guide: StudioFramingGuideMode) => void
  setLowLightBoostEnabled: (enabled: boolean) => void
  toggleLowLightBoost: () => void
  toggleCamera: () => void
  toggleMic: () => void
  setMicMuted: (muted: boolean) => void
  flipCamera: () => void
   setFacingMode: (mode: 'user' | 'environment' | ((prev: 'user' | 'environment') => 'user' | 'environment')) => void
  toggleMirror: () => void
  setIsMirrored: (mirrored: boolean) => void
  restartCamera: () => Promise<void>
}

const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = vec2((a_position.x + 1.0) * 0.5, 1.0 - (a_position.y + 1.0) * 0.5);
}
`

/**
 * Real-Time WebGL2 Cinema Lighting ("Forge Studio LUT") + Guided Bilateral Segmentation Shader
 *
 * Architectural Invariants:
 * - True Optical Orientation: Background textures (`u_background`) ALWAYS sample unmirrored `uv`
 *   so Forge Athletic typography and architectural geometry never reverse.
 * - Foreground Mirroring: Only camera & segmentation coordinates (`camCoords`) mirror when `u_isMirrored` is true.
 * - Inverted MediaPipe Mask Polarity: Mask arrives in `[0..1]` where `1.0` = foreground subject, `0.0` = background.
 */
const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_frame;
uniform sampler2D u_background;
uniform sampler2D u_mask;
uniform vec2 u_texelSize;

uniform bool u_isMirrored;
uniform int u_bgMode; // 0 = off, 1 = bokeh_blur, 2 = forge_dark_studio, 3 = pure_chroma
uniform bool u_hasBgImage;
uniform vec3 u_pureMatteColor;
uniform float u_bokehQuality;

// Forge Studio LUT Uniforms
uniform float u_shadowLift;
uniform float u_gamma;
uniform float u_highlightRolloff;
uniform float u_sharpenStrength;
uniform float u_warmth;
uniform float u_contrast;
uniform float u_vignette;
uniform float u_skinToneProtect;

float luma709(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// 3x3 Unsharp-Mask Kernel tuned for posture lines, joint contours & dumbbells without skin noise
vec3 sampleSharpenedCamera(vec2 uv) {
  vec3 center = texture(u_frame, uv).rgb;
  if (u_sharpenStrength <= 0.001) {
    return center;
  }
  vec2 tx = u_texelSize;
  vec3 north = texture(u_frame, clamp(uv + vec2(0.0, -tx.y), 0.001, 0.999)).rgb;
  vec3 south = texture(u_frame, clamp(uv + vec2(0.0, tx.y), 0.001, 0.999)).rgb;
  vec3 east  = texture(u_frame, clamp(uv + vec2(tx.x, 0.0), 0.001, 0.999)).rgb;
  vec3 west  = texture(u_frame, clamp(uv + vec2(-tx.x, 0.0), 0.001, 0.999)).rgb;
  vec3 blurCross = 0.25 * (north + south + east + west);
  vec3 detail = center - blurCross;

  // Attenuate sharpening slightly in deep noisy shadows so sensor grain stays clean
  float lum = luma709(center);
  float noiseGate = smoothstep(0.05, 0.22, lum);
  return clamp(center + detail * (u_sharpenStrength * 1.65 * noiseGate), 0.0, 1.0);
}

// Forge Studio LUT: Adaptive Shadow Lift, Exposure Recovery, Skin-Tone Safe Balance & 10% Vignette
vec3 applyForgeStudioLut(vec3 rgb, vec2 screenUv) {
  vec3 c = rgb;

  // 1. Adaptive Shadow Lift & Gamma Exposure Recovery (reveals joint angles in backlit rooms)
  float lum = luma709(c);
  if (u_shadowLift > 0.001) {
    float shadowWeight = pow(clamp(1.0 - lum, 0.0, 1.0), 2.1);
    c += c * (u_shadowLift * 0.85 * shadowWeight) + vec3(u_shadowLift * 0.14 * shadowWeight);
  }
  if (abs(u_gamma - 1.0) > 0.001) {
    c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / max(0.5, u_gamma)));
  }

  // 2. Highlight Rolloff (protects bright gym windows & overhead LEDs from clipping)
  if (u_highlightRolloff > 0.001) {
    vec3 softClip = 1.0 - exp(-c * (1.0 + u_highlightRolloff * 1.4));
    float hiMask = smoothstep(0.62, 0.98, luma709(c));
    c = mix(c, softClip / (1.0 - exp(-(1.0 + u_highlightRolloff * 1.4))), hiMask * u_highlightRolloff * 1.8);
  }

  // 3. Subtle S-Curve Micro-Contrast around mid-gray (0.46)
  if (abs(u_contrast - 1.0) > 0.001) {
    c = clamp((c - 0.46) * u_contrast + 0.46, 0.0, 1.0);
  }

  // 4. Skin-Tone Safe Color Balance (protects warm flesh chroma from orange/green shift)
  if (abs(u_warmth) > 0.001) {
    float skinLikelihood = clamp(
      smoothstep(0.02, 0.14, c.r - c.g) *
      smoothstep(0.01, 0.18, c.g - c.b) *
      (1.0 - smoothstep(0.85, 1.0, max(c.r, max(c.g, c.b)))),
      0.0,
      1.0
    );
    float wbScale = 1.0 - (skinLikelihood * 0.55 * u_skinToneProtect);
    float shift = u_warmth * wbScale;
    c.r = clamp(c.r + shift * 0.65, 0.0, 1.0);
    c.g = clamp(c.g + shift * 0.12, 0.0, 1.0);
    c.b = clamp(c.b - shift * 0.68, 0.0, 1.0);
  }

  // 5. Gentle Dark-Tactile Vignette (10% default matching Forge Athletic studio aesthetic)
  if (u_vignette > 0.001) {
    vec2 centered = screenUv - vec2(0.5, 0.48);
    float distSq = dot(centered * vec2(1.12, 0.94), centered * vec2(1.12, 0.94));
    float vig = 1.0 - clamp(distSq * 2.15, 0.0, 1.0) * u_vignette;
    c *= vig;
  }

  return clamp(c, 0.0, 1.0);
}

// 14px Equivalent Multi-Ring Optical Disc / Gaussian Bokeh Blur
vec3 sampleOpticalBokehBlur(vec2 camUv) {
  // Radius scaled to ~14px at 1080p (14 / 1920 ≈ 0.0073, 14 / 1080 ≈ 0.013)
  vec2 rOuter = vec2(0.0085, 0.0145) * clamp(0.65 + 0.35 * u_bokehQuality, 0.5, 1.0);
  vec2 rInner = rOuter * 0.48;

  vec3 acc = texture(u_frame, camUv).rgb * 0.14;
  float totalWeight = 0.14;

  // Inner 8-tap Gaussian ring
  for (int i = 0; i < 8; i++) {
    float angle = float(i) * 0.78539816;
    vec2 offset = vec2(cos(angle), sin(angle)) * rInner;
    acc += texture(u_frame, clamp(camUv + offset, 0.002, 0.998)).rgb * 0.065;
    totalWeight += 0.065;
  }

  // Outer 8-tap Golden-Angle rotated optical bokeh ring (skipped only in ultra-eco fallback)
  if (u_bokehQuality >= 0.6) {
    for (int j = 0; j < 8; j++) {
      float angle = float(j) * 0.78539816 + 0.39269908;
      vec2 offset = vec2(cos(angle), sin(angle)) * rOuter;
      acc += texture(u_frame, clamp(camUv + offset, 0.002, 0.998)).rgb * 0.0425;
      totalWeight += 0.0425;
    }
  }

  return acc / totalWeight;
}

// Camera-Guided Joint Bilateral Edge Feathering (eliminates halos around moving arms, kettlebells & hair)
float sampleGuidedBilateralAlpha(vec2 camCoords, vec3 centerRgb) {
  float centerMask = texture(u_mask, camCoords).r;
  float centerLuma = luma709(centerRgb);

  vec2 stepUv = vec2(0.0026, 0.0042);
  float sumAlpha = centerMask * 1.8;
  float sumWeight = 1.8;

  vec2 dirs[8] = vec2[8](
    vec2( 1.0,  0.0),
    vec2(-1.0,  0.0),
    vec2( 0.0,  1.0),
    vec2( 0.0, -1.0),
    vec2( 0.707,  0.707),
    vec2(-0.707,  0.707),
    vec2( 0.707, -0.707),
    vec2(-0.707, -0.707)
  );

  for (int i = 0; i < 8; i++) {
    vec2 sampleUv = clamp(camCoords + dirs[i] * stepUv, 0.001, 0.999);
    float m = texture(u_mask, sampleUv).r;
    vec3 rgb = texture(u_frame, sampleUv).rgb;
    float dl = abs(luma709(rgb) - centerLuma);
    float dc = length(rgb - centerRgb);
    // Photometric edge-stopping weight snaps mask tightly to physical limb/hair silhouette
    float rangeW = exp(-(dl * dl) / 0.011 - (dc * dc) / 0.032);
    float spatialW = (i < 4) ? 1.0 : 0.72;
    float w = spatialW * (0.12 + 0.88 * rangeW);
    sumAlpha += m * w;
    sumWeight += w;
  }

  float guided = sumAlpha / sumWeight;
  // Crisp anti-halo matte ramp: rejects background bleed < 0.24 while keeping fine hair strands smooth
  return smoothstep(0.24, 0.79, guided);
}

void main() {
  vec2 uv = v_texCoord;
  // Foreground subject coordinates respect mirror intuition; background coordinates NEVER mirror
  vec2 camCoords = u_isMirrored ? vec2(1.0 - uv.x, uv.y) : uv;

  vec3 sharpCam = sampleSharpenedCamera(camCoords);
  vec3 gradedForeground = applyForgeStudioLut(sharpCam, uv);

  // Mode 0: Off (Original Room with Forge Studio LUT lighting)
  if (u_bgMode == 0) {
    outColor = vec4(gradedForeground, 1.0);
    return;
  }

  float alpha = sampleGuidedBilateralAlpha(camCoords, sharpCam);

  vec3 bgRgb;
  if (u_bgMode == 1) {
    // Mode 1: Studio Bokeh Blur (14px optical blur with gently dimmed ambient studio depth)
    vec3 blurredRoom = sampleOpticalBokehBlur(camCoords);
    bgRgb = applyForgeStudioLut(blurredRoom * 0.94, uv);
  } else if (u_bgMode == 2) {
    // Mode 2: Forge Dark Tactical Studio (TRUE OPTICAL ORIENTATION — unmirrored uv!)
    if (u_hasBgImage) {
      vec3 studioTex = texture(u_background, uv).rgb;
      // Subtle architectural depth vignette on backdrop
      vec2 d = uv - vec2(0.5);
      float bgVig = 1.0 - clamp(dot(d, d) * 0.55, 0.0, 0.25);
      bgRgb = studioTex * bgVig;
    } else {
      bgRgb = u_pureMatteColor;
    }
  } else {
    // Mode 3: Pure Chroma / Clean Matte (#121417 neutral dark charcoal cyclorama)
    vec2 d = uv - vec2(0.5, 0.45);
    float subtleStudioFalloff = 1.0 - clamp(dot(d, d) * 0.28, 0.0, 0.12);
    bgRgb = u_pureMatteColor * subtleStudioFalloff;
  }

  // Edge Halo Despill: suppress room-wall fringe on semi-transparent boundary pixels
  float boundaryBand = alpha * (1.0 - alpha) * 4.0;
  vec3 despilledFg = mix(gradedForeground, gradedForeground * 0.90 + bgRgb * 0.10, boundaryBand * 0.42);

  vec3 finalRgb = mix(bgRgb, despilledFg, alpha);
  outColor = vec4(finalRgb, 1.0);
}
`

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createLinearTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
  const tex = gl.createTexture()
  if (!tex) return null
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  return tex
}

function mapBackgroundModeToInt(mode: StudioBackgroundMode): number {
  switch (mode) {
    case 'off':
      return 0
    case 'bokeh_blur':
      return 1
    case 'forge_dark_studio':
      return 2
    case 'pure_chroma':
      return 3
    default:
      return 1
  }
}

export function useStudioVideoPipeline(
  options: UseStudioVideoPipelineOptions = {}
): StudioVideoPipelineController {
  const {
    enabled = true,
    initialFacingMode = 'user',
    effectiveTier = 'hd',
    defaultLightingPreset = 'studio_natural',
    defaultBackgroundMode = 'bokeh_blur',
    defaultFramingGuide = 'off',
    customBackdropUrl = null,
    ecoMode = false,
  } = options

  const [rawStream, setRawStream] = useState<MediaStream | null>(null)
  const [outputStream, setOutputStream] = useState<MediaStream | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [facingMode, setFacingModeState] = useState<'user' | 'environment'>(initialFacingMode)
  const [mirrorOverride, setMirrorOverride] = useState<boolean | null>(null)

  const [lightingPreset, setLightingPreset] =
    useState<StudioLightingPresetId>(defaultLightingPreset)
  const [backgroundMode, setBackgroundMode] =
    useState<StudioBackgroundMode>(defaultBackgroundMode)
  const [framingGuide, setFramingGuide] =
    useState<StudioFramingGuideMode>(defaultFramingGuide)
  const [lowLightBoostEnabled, setLowLightBoostEnabled] = useState(false)
  const [isLowLightDetected, setIsLowLightDetected] = useState(false)
  const [meanLuminance, setMeanLuminance] = useState(128)
  const [micLevel, setMicLevel] = useState(0)

  const [renderFps, setRenderFps] = useState(30)
  const [frameRenderMs, setFrameRenderMs] = useState(8)
  const [guardrailTier, setGuardrailTier] = useState<SegmentationPerformanceTier>('high')
  const [isSegmentationReady, setIsSegmentationReady] = useState(false)
  const [isPipelineRendering, setIsPipelineRendering] = useState(false)
  const [captureResolutionLabel, setCaptureResolutionLabel] = useState('1080p HD')

  const isMirrored = mirrorOverride !== null ? mirrorOverride : facingMode === 'user'

  // Mutable refs for zero-rebind render loop
  const rawStreamRef = useRef<MediaStream | null>(null)
  const capturedCanvasStreamRef = useRef<MediaStream | null>(null)
  const outputStreamRef = useRef<MediaStream | null>(null)
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lumaCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fallbackBlurCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const glResRef = useRef<StudioWebGLResources | null>(null)
  const isGlLostRef = useRef(false)
  const segmenterRef = useRef<ImageSegmenterInstance | null>(null)
  const isSegmentingRef = useRef(false)
  const lastInferenceAtRef = useRef(0)
  const maskBufferRef = useRef<Uint8Array | null>(null)
  const prevMaskBufferRef = useRef<Uint8Array | null>(null)
  const maskDimensionsRef = useRef<{ width: number; height: number }>({ width: 256, height: 256 })
  const hasValidMaskRef = useRef(false)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const bgImageUploadedSrcRef = useRef<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)

  const effectiveTierRef = useRef<ResolvedBandwidthTier>(effectiveTier)
  effectiveTierRef.current = effectiveTier
  const isMirroredRef = useRef(isMirrored)
  isMirroredRef.current = isMirrored
  const lightingPresetRef = useRef(lightingPreset)
  lightingPresetRef.current = lightingPreset
  const backgroundModeRef = useRef(backgroundMode)
  backgroundModeRef.current = backgroundMode
  const lowLightBoostRef = useRef(lowLightBoostEnabled)
  lowLightBoostRef.current = lowLightBoostEnabled
  const isLowLightDetectedRef = useRef(isLowLightDetected)
  isLowLightDetectedRef.current = isLowLightDetected
  const isMicMutedRef = useRef(isMicMuted)
  isMicMutedRef.current = isMicMuted
  const isCameraActiveRef = useRef(isCameraActive)
  isCameraActiveRef.current = isCameraActive
  const ecoModeRef = useRef(ecoMode)
  ecoModeRef.current = ecoMode

  const guardrailStateRef = useRef<PerformanceGuardrailSample>({
    emaFrameRenderMs: 12,
    currentTier: 'high',
    sustainedSlowFrames: 0,
    sustainedFastFrames: 0,
  })
  const inferenceIntervalRef = useRef(33)
  const bokehQualityRef = useRef(1.0)

  // Resolve active backdrop image URL (custom picker override or Forge Dark Tactical Studio default)
  const resolvedBackdropUrl = useMemo(() => {
    if (customBackdropUrl) return customBackdropUrl
    if (backgroundMode === 'forge_dark_studio') {
      return STUDIO_BACKGROUND_MODES.forge_dark_studio.backdropUrl || FORGE_DARK_TACTICAL_BACKDROP_URL
    }
    return null
  }, [customBackdropUrl, backgroundMode])

  // Preload architectural studio backdrop texture with brand typography in true optical orientation
  useEffect(() => {
    if (typeof window === 'undefined' || !resolvedBackdropUrl) {
      bgImageRef.current = null
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      // Composite crisp Forge Athletic studio architectural watermark onto an offscreen canvas
      // so the backdrop texture carries subtle dark-tactical brand polish in true left-to-right orientation
      try {
        const composed = document.createElement('canvas')
        composed.width = 1280
        composed.height = 720
        const cctx = composed.getContext('2d')
        if (cctx) {
          const imgRatio = img.width / Math.max(1, img.height)
          const targetRatio = 1280 / 720
          let sx = 0
          let sy = 0
          let sw = img.width
          let sh = img.height
          if (imgRatio > targetRatio) {
            sw = img.height * targetRatio
            sx = (img.width - sw) * 0.5
          } else {
            sh = img.width / targetRatio
            sy = (img.height - sh) * 0.5
          }
          cctx.drawImage(img, sx, sy, sw, sh, 0, 0, 1280, 720)
          // Architectural dark studio scrim so foreground subject pops with zero clutter
          const grad = cctx.createLinearGradient(0, 0, 0, 720)
          grad.addColorStop(0, 'rgba(8, 11, 16, 0.36)')
          grad.addColorStop(0.5, 'rgba(10, 14, 20, 0.24)')
          grad.addColorStop(1, 'rgba(6, 9, 14, 0.54)')
          cctx.fillStyle = grad
          cctx.fillRect(0, 0, 1280, 720)

          // Subtle architectural wall plaque (top-left, true optical orientation)
          cctx.fillStyle = 'rgba(10, 14, 20, 0.62)'
          cctx.strokeStyle = 'rgba(197, 160, 89, 0.32)'
          cctx.lineWidth = 1
          cctx.beginPath()
          cctx.roundRect(28, 24, 214, 42, 6)
          cctx.fill()
          cctx.stroke()

          cctx.fillStyle = '#D4AF37'
          cctx.font = '700 11px Cinzel, Georgia, serif'
          cctx.fillText('FORGE ATHLETIC', 42, 43)
          cctx.fillStyle = 'rgba(226, 232, 240, 0.72)'
          cctx.font = '600 9.5px Raleway, system-ui, sans-serif'
          cctx.fillText('LIVE BIOMECHANICS STUDIO', 42, 57)

          const finalImg = new Image()
          finalImg.onload = () => {
            if (!cancelled) {
              bgImageRef.current = finalImg
              bgImageUploadedSrcRef.current = null
            }
          }
          finalImg.src = composed.toDataURL('image/jpeg', 0.9)
          return
        }
      } catch {
        // Fallback to raw image if canvas composition is restricted
      }
      bgImageRef.current = img
      bgImageUploadedSrcRef.current = null
    }
    img.src = resolvedBackdropUrl

    return () => {
      cancelled = true
    }
  }, [resolvedBackdropUrl])

  // Lazy-initialize MediaPipe Selfie Segmenter (GPU delegate @ 30fps with automatic CPU fallback)
  const shouldRunSegmentation = enabled && backgroundMode !== 'off' && !ecoMode
  useEffect(() => {
    if (!shouldRunSegmentation || typeof window === 'undefined') return
    if (segmenterRef.current) return

    let cancelled = false
    async function initMediaPipeSegmenter() {
      try {
        const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
        if (cancelled) return

        const vision = await FilesetResolver.forVisionTasks('/wasm')
        if (cancelled) return

        let segmenter: ImageSegmenterInstance
        try {
          segmenter = (await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/selfie_multiclass_256x256.tflite',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
          })) as unknown as ImageSegmenterInstance
        } catch {
          segmenter = (await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/selfie_multiclass_256x256.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: false,
            outputConfidenceMasks: true,
          })) as unknown as ImageSegmenterInstance
        }

        if (cancelled) {
          segmenter.close?.()
          return
        }

        segmenterRef.current = segmenter
        setIsSegmentationReady(true)
      } catch (err) {
        console.warn('Forge Studio MediaPipe segmentation init skipped:', err)
      }
    }

    void initMediaPipeSegmenter()

    return () => {
      cancelled = true
    }
  }, [shouldRunSegmentation])

  // Close MediaPipe segmenter cleanly on final hook unmount
  useEffect(() => {
    return () => {
      if (segmenterRef.current) {
        try {
          segmenterRef.current.close?.()
        } catch {}
        segmenterRef.current = null
      }
    }
  }, [])

  // Setup internal source <video>, processing <canvas>, and WebGL2 shader pipeline
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return

    const sourceVideo = document.createElement('video')
    sourceVideo.autoplay = true
    sourceVideo.playsInline = true
    sourceVideo.muted = true
    sourceVideoRef.current = sourceVideo

    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    canvas.style.transform = 'none' // STRICT: Never mirror canvas via CSS
    processingCanvasRef.current = canvas

    const lumaCanvas = document.createElement('canvas')
    lumaCanvas.width = 32
    lumaCanvas.height = 18
    lumaCanvasRef.current = lumaCanvas

    const handleContextLost = (e: Event) => {
      e.preventDefault()
      isGlLostRef.current = true
    }
    const handleContextRestored = () => {
      isGlLostRef.current = false
    }
    canvas.addEventListener('webglcontextlost', handleContextLost, false)
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false)

    // Attempt WebGL2 shader initialization (falls back cleanly to 2D canvas if unavailable)
    let glRes: StudioWebGLResources | null = null
    try {
      const gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
      })

      if (gl) {
        const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
        const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
        const program = gl.createProgram()
        if (vs && fs && program) {
          gl.attachShader(program, vs)
          gl.attachShader(program, fs)
          gl.linkProgram(program)

          if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const vertices = new Float32Array([
              -1.0, -1.0,
               1.0, -1.0,
              -1.0,  1.0,
              -1.0,  1.0,
               1.0, -1.0,
               1.0,  1.0,
            ])
            const vertexBuffer = gl.createBuffer()
            const frameTex = createLinearTexture(gl)
            const bgTex = createLinearTexture(gl)
            const maskTex = createLinearTexture(gl)

            if (vertexBuffer && frameTex && bgTex && maskTex) {
              gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
              gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

              // Initialize default 1x1 opaque foreground mask so pass-through works immediately
              gl.bindTexture(gl.TEXTURE_2D, maskTex)
              gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
              gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.R8,
                1,
                1,
                0,
                gl.RED,
                gl.UNSIGNED_BYTE,
                new Uint8Array([255])
              )

              glRes = {
                gl,
                program,
                vs,
                fs,
                vertexBuffer,
                attribPosition: gl.getAttribLocation(program, 'a_position'),
                frameTex,
                bgTex,
                maskTex,
                uFrame: gl.getUniformLocation(program, 'u_frame'),
                uBackground: gl.getUniformLocation(program, 'u_background'),
                uMask: gl.getUniformLocation(program, 'u_mask'),
                uTexelSize: gl.getUniformLocation(program, 'u_texelSize'),
                uIsMirrored: gl.getUniformLocation(program, 'u_isMirrored'),
                uBgMode: gl.getUniformLocation(program, 'u_bgMode'),
                uHasBgImage: gl.getUniformLocation(program, 'u_hasBgImage'),
                uPureMatteColor: gl.getUniformLocation(program, 'u_pureMatteColor'),
                uBokehQuality: gl.getUniformLocation(program, 'u_bokehQuality'),
                uShadowLift: gl.getUniformLocation(program, 'u_shadowLift'),
                uGamma: gl.getUniformLocation(program, 'u_gamma'),
                uHighlightRolloff: gl.getUniformLocation(program, 'u_highlightRolloff'),
                uSharpenStrength: gl.getUniformLocation(program, 'u_sharpenStrength'),
                uWarmth: gl.getUniformLocation(program, 'u_warmth'),
                uContrast: gl.getUniformLocation(program, 'u_contrast'),
                uVignette: gl.getUniformLocation(program, 'u_vignette'),
                uSkinToneProtect: gl.getUniformLocation(program, 'u_skinToneProtect'),
              }
              glResRef.current = glRes
            }
          }
        }
      }
    } catch {
      // Headless / JSDOM / non-WebGL2 environment — 2D fallback handles rendering
    }

    let animFrameId: number | null = null
    let isDisposed = false
    let lastLuminanceSampleAt = 0
    let lastTelemetryCommitAt = 0
    let renderedFramesSinceCommit = 0
    let commitWindowStartAt = performance.now()

    const renderFrame = () => {
      if (isDisposed) return
      const frameStart = performance.now()
      const video = sourceVideoRef.current
      const targetCanvas = processingCanvasRef.current

      if (
        video &&
        targetCanvas &&
        isCameraActiveRef.current &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        // Match processing canvas dimensions to live camera resolution (capped at 1920x1080)
        const targetW = Math.min(1920, video.videoWidth)
        const targetH = Math.min(1080, video.videoHeight)
        if (targetCanvas.width !== targetW || targetCanvas.height !== targetH) {
          targetCanvas.width = targetW
          targetCanvas.height = targetH
        }

        // 1. Periodic Smart Auto-Light Luminance Check (~every 650ms on tiny 32x18 buffer)
        if (frameStart - lastLuminanceSampleAt > 650 && lumaCanvasRef.current) {
          lastLuminanceSampleAt = frameStart
          try {
            const lctx = lumaCanvasRef.current.getContext('2d', { willReadFrequently: true })
            if (lctx) {
              lctx.drawImage(video, 0, 0, 32, 18)
              const imgData = lctx.getImageData(0, 0, 32, 18)
              const meanY = computeMeanFrameLuminance(imgData.data)
              const lowLight = evaluateLowLightRoom(meanY, isLowLightDetectedRef.current)
              isLowLightDetectedRef.current = lowLight
              setMeanLuminance(meanY)
              setIsLowLightDetected(lowLight)
            }
          } catch {
            // Ignore tainted/unavailable canvas readbacks in unit mocks
          }
        }

        // 2. Run MediaPipe Selfie Segmentation when background effect is active
        const activeBgMode = backgroundModeRef.current
        const seg = segmenterRef.current
        if (
          activeBgMode !== 'off' &&
          !ecoModeRef.current &&
          seg &&
          !isSegmentingRef.current &&
          frameStart - lastInferenceAtRef.current >= inferenceIntervalRef.current
        ) {
          isSegmentingRef.current = true
          lastInferenceAtRef.current = frameStart
          try {
            seg.segmentForVideo(video, frameStart, result => {
              try {
                const confMask = result?.confidenceMasks?.[0]
                if (confMask) {
                  const mW = confMask.width || 256
                  const mH = confMask.height || 256
                  const len = mW * mH
                  if (!maskBufferRef.current || maskBufferRef.current.length !== len) {
                    maskBufferRef.current = new Uint8Array(len)
                    prevMaskBufferRef.current = new Uint8Array(len)
                  }
                  const outBuf = maskBufferRef.current
                  const prevBuf = prevMaskBufferRef.current!
                  const hasPrev = hasValidMaskRef.current

                  if (typeof confMask.getAsFloat32Array === 'function') {
                    const fData = confMask.getAsFloat32Array()
                    for (let i = 0; i < len; i++) {
                      // STRICT ARCHITECTURE RULE: ALWAYS INVERT MediaPipe confidence mask
                      // Foreground person = 1.0 (255 opaque), physical room = 0.0 (0 transparent)
                      const rawConf = fData[i]
                      const conf = 1 - rawConf
                      const targetVal = Math.max(0, Math.min(255, Math.round(conf * 255)))
                      if (hasPrev) {
                        const prevVal = prevBuf[i]
                        const delta = Math.abs(targetVal - prevVal)
                        // Motion-adaptive temporal smoothing: rock-steady when still, zero lag during fast lifts
                        const alpha = delta < 30 ? 0.38 : delta < 85 ? 0.68 : 0.90
                        const smoothed = Math.round(prevVal + alpha * (targetVal - prevVal))
                        outBuf[i] = smoothed
                        prevBuf[i] = smoothed
                      } else {
                        outBuf[i] = targetVal
                        prevBuf[i] = targetVal
                      }
                    }
                  } else if (typeof confMask.getAsUint8Array === 'function') {
                    const uData = confMask.getAsUint8Array()
                    for (let i = 0; i < len; i++) {
                      const targetVal = 255 - uData[i]
                      if (hasPrev) {
                        const prevVal = prevBuf[i]
                        const delta = Math.abs(targetVal - prevVal)
                        const alpha = delta < 30 ? 0.38 : delta < 85 ? 0.68 : 0.90
                        const smoothed = Math.round(prevVal + alpha * (targetVal - prevVal))
                        outBuf[i] = smoothed
                        prevBuf[i] = smoothed
                      } else {
                        outBuf[i] = targetVal
                        prevBuf[i] = targetVal
                      }
                    }
                  }

                  maskDimensionsRef.current = { width: mW, height: mH }
                  hasValidMaskRef.current = true
                }
              } finally {
                try {
                  result?.close?.()
                } catch {}
                isSegmentingRef.current = false
              }
            })
          } catch {
            isSegmentingRef.current = false
          }
        }

        // 3. Render Cinema Pipeline via WebGL2 (or 2D Canvas fallback)
        const uniforms = resolveStudioShaderUniforms(
          lightingPresetRef.current,
          lowLightBoostRef.current
        )
        const effectiveBgMode: StudioBackgroundMode =
          customBackdropUrl && activeBgMode === 'off' ? 'forge_dark_studio' : activeBgMode

        const activeGl = glResRef.current
        if (activeGl && !isGlLostRef.current) {
          const { gl } = activeGl
          gl.viewport(0, 0, targetCanvas.width, targetCanvas.height)
          gl.useProgram(activeGl.program)

          gl.bindBuffer(gl.ARRAY_BUFFER, activeGl.vertexBuffer)
          gl.enableVertexAttribArray(activeGl.attribPosition)
          gl.vertexAttribPointer(activeGl.attribPosition, 2, gl.FLOAT, false, 0, 0)

          // Texture 0: Live camera frame
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, activeGl.frameTex)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
          gl.uniform1i(activeGl.uFrame, 0)

          // Texture 1: Architectural backdrop (uploaded only when image source changes)
          gl.activeTexture(gl.TEXTURE1)
          gl.bindTexture(gl.TEXTURE_2D, activeGl.bgTex)
          const bgImg = bgImageRef.current
          const hasBgImg = Boolean(bgImg && bgImg.complete && bgImg.naturalWidth > 0)
          if (hasBgImg && bgImg && bgImageUploadedSrcRef.current !== bgImg.src) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImg)
            bgImageUploadedSrcRef.current = bgImg.src
          }
          gl.uniform1i(activeGl.uBackground, 1)

          // Texture 2: Inverted & temporally smoothed segmentation mask
          gl.activeTexture(gl.TEXTURE2)
          gl.bindTexture(gl.TEXTURE_2D, activeGl.maskTex)
          if (hasValidMaskRef.current && maskBufferRef.current) {
            const { width: mW, height: mH } = maskDimensionsRef.current
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.R8,
              mW,
              mH,
              0,
              gl.RED,
              gl.UNSIGNED_BYTE,
              maskBufferRef.current
            )
          }
          gl.uniform1i(activeGl.uMask, 2)

          const shaderBgMode =
            effectiveBgMode !== 'off' && !hasValidMaskRef.current
              ? 0
              : mapBackgroundModeToInt(effectiveBgMode)

          gl.uniform2f(
            activeGl.uTexelSize,
            1.0 / Math.max(1, targetCanvas.width),
            1.0 / Math.max(1, targetCanvas.height)
          )
          gl.uniform1i(activeGl.uIsMirrored, isMirroredRef.current ? 1 : 0)
          gl.uniform1i(activeGl.uBgMode, shaderBgMode)
          gl.uniform1i(activeGl.uHasBgImage, hasBgImg ? 1 : 0)
          gl.uniform3f(
            activeGl.uPureMatteColor,
            PURE_CHROMA_MATTE_RGB[0],
            PURE_CHROMA_MATTE_RGB[1],
            PURE_CHROMA_MATTE_RGB[2]
          )
          gl.uniform1f(activeGl.uBokehQuality, bokehQualityRef.current)

          // Forge Studio LUT uniforms
          gl.uniform1f(activeGl.uShadowLift, uniforms.shadowLift)
          gl.uniform1f(activeGl.uGamma, uniforms.gamma)
          gl.uniform1f(activeGl.uHighlightRolloff, uniforms.highlightRolloff)
          gl.uniform1f(activeGl.uSharpenStrength, uniforms.sharpenStrength)
          gl.uniform1f(activeGl.uWarmth, uniforms.warmth)
          gl.uniform1f(activeGl.uContrast, uniforms.contrast)
          gl.uniform1f(activeGl.uVignette, uniforms.vignette)
          gl.uniform1f(activeGl.uSkinToneProtect, uniforms.skinToneProtect)

          gl.drawArrays(gl.TRIANGLES, 0, 6)
          setIsPipelineRendering(true)
        } else {
          // Canvas2D Graceful Fallback (when WebGL2 is disabled or context lost)
          if (!fallbackBlurCanvasRef.current) {
            fallbackBlurCanvasRef.current = document.createElement('canvas')
          }
          const ctx2d = targetCanvas.getContext('2d')
          if (ctx2d) {
            const w = targetCanvas.width
            const h = targetCanvas.height
            ctx2d.save()
            const brightnessPct = Math.round((1 + uniforms.shadowLift * 0.45) * 100)
            const contrastPct = Math.round(uniforms.contrast * 100)
            ctx2d.filter = `brightness(${brightnessPct}%) contrast(${contrastPct}%)`

            if (effectiveBgMode === 'pure_chroma') {
              ctx2d.fillStyle = PURE_CHROMA_MATTE_HEX
              ctx2d.fillRect(0, 0, w, h)
            }

            if (isMirroredRef.current) {
              ctx2d.translate(w, 0)
              ctx2d.scale(-1, 1)
            }
            ctx2d.drawImage(video, 0, 0, w, h)
            ctx2d.restore()
            setIsPipelineRendering(true)
          }
        }

        // 4. Performance Guardrail (<22fps automatic step-down)
        const elapsedMs = Math.max(0.5, performance.now() - frameStart)
        const prevEma = guardrailStateRef.current.emaFrameRenderMs
        const nextEma = prevEma * 0.85 + elapsedMs * 0.15
        guardrailStateRef.current.emaFrameRenderMs = nextEma
        renderedFramesSinceCommit += 1

        if (frameStart - lastTelemetryCommitAt >= 900) {
          const windowSec = Math.max(0.1, (frameStart - commitWindowStartAt) / 1000)
          const measuredFps = Math.min(60, Math.max(1, Math.round(renderedFramesSinceCommit / windowSec)))
          renderedFramesSinceCommit = 0
          commitWindowStartAt = frameStart
          lastTelemetryCommitAt = frameStart

          // Feed either slow render frame budget or measured FPS drop (<22fps) into guardrail
          const effectiveFrameMs = Math.max(nextEma, 1000 / Math.max(1, measuredFps))
          const resolution = evaluatePerformanceGuardrail({
            ...guardrailStateRef.current,
            emaFrameRenderMs: effectiveFrameMs,
          })
          guardrailStateRef.current = {
            emaFrameRenderMs: nextEma,
            currentTier: resolution.tier,
            sustainedSlowFrames: resolution.sustainedSlowFrames,
            sustainedFastFrames: resolution.sustainedFastFrames,
          }
          inferenceIntervalRef.current = resolution.inferenceIntervalMs
          bokehQualityRef.current = resolution.bokehQuality
          setGuardrailTier(resolution.tier)
          setRenderFps(measuredFps)
          setFrameRenderMs(Math.round(nextEma * 10) / 10)
        }
      }

      animFrameId = window.requestAnimationFrame(renderFrame)
    }

    animFrameId = window.requestAnimationFrame(renderFrame)

    return () => {
      isDisposed = true
      if (animFrameId !== null) {
        window.cancelAnimationFrame(animFrameId)
      }
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)

      if (glRes) {
        try {
          const { gl } = glRes
          gl.deleteTexture(glRes.frameTex)
          gl.deleteTexture(glRes.bgTex)
          gl.deleteTexture(glRes.maskTex)
          gl.deleteBuffer(glRes.vertexBuffer)
          gl.deleteShader(glRes.vs)
          gl.deleteShader(glRes.fs)
          gl.deleteProgram(glRes.program)
        } catch {}
      }
      glResRef.current = null

      if (sourceVideoRef.current) {
        sourceVideoRef.current.pause()
        sourceVideoRef.current.srcObject = null
        sourceVideoRef.current = null
      }
      processingCanvasRef.current = null
      lumaCanvasRef.current = null
      fallbackBlurCanvasRef.current = null
    }
  }, [enabled, customBackdropUrl])

  // Real-time 48kHz Voice Isolation Mic Level Meter (0..100, disconnected from destination so zero feedback)
  useEffect(() => {
    if (!enabled || !rawStream || typeof window === 'undefined') {
      setMicLevel(0)
      return
    }

    const audioTracks = rawStream.getAudioTracks()
    if (audioTracks.length === 0) {
      setMicLevel(0)
      return
    }

    let meterTimer: ReturnType<typeof setInterval> | null = null
    let localCtx: AudioContext | null = null
    let sourceNode: MediaStreamAudioSourceNode | null = null
    let analyser: AnalyserNode | null = null

    try {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioContextCtor) {
        localCtx = new AudioContextCtor()
        audioCtxRef.current = localCtx
        analyser = localCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.72
        sourceNode = localCtx.createMediaStreamSource(rawStream)
        // Connect ONLY to analyser (NEVER to localCtx.destination) so mic never echoes locally
        sourceNode.connect(analyser)
        analyserRef.current = analyser
        audioSourceNodeRef.current = sourceNode

        const timeData = new Uint8Array(analyser.fftSize)
        meterTimer = setInterval(() => {
          if (isMicMutedRef.current || !analyser) {
            setMicLevel(0)
            return
          }
          if (localCtx && localCtx.state === 'suspended') {
            void localCtx.resume().catch(() => {})
          }
          analyser.getByteTimeDomainData(timeData)
          let sumSq = 0
          for (let i = 0; i < timeData.length; i++) {
            const norm = (timeData[i] - 128) / 128
            sumSq += norm * norm
          }
          const rms = Math.sqrt(sumSq / timeData.length)
          // Map typical speech RMS (0.01 .. 0.28) cleanly to 0..100 VU scale
          const level = rms < 0.008 ? 0 : Math.min(100, Math.round(Math.pow(rms * 3.6, 0.75) * 100))
          setMicLevel(level)
        }, 110)
      }
    } catch {
      // Web Audio unavailable in headless / test environment
    }

    return () => {
      if (meterTimer) clearInterval(meterTimer)
      try {
        sourceNode?.disconnect()
      } catch {}
      try {
        analyser?.disconnect()
      } catch {}
      if (localCtx && localCtx.state !== 'closed') {
        void localCtx.close().catch(() => {})
      }
      audioCtxRef.current = null
      analyserRef.current = null
      audioSourceNodeRef.current = null
    }
  }, [enabled, rawStream])

  const stopAllManagedStreams = useCallback(() => {
    if (capturedCanvasStreamRef.current) {
      capturedCanvasStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop()
        } catch {}
      })
      capturedCanvasStreamRef.current = null
    }
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach(t => {
        try {
          t.stop()
        } catch {}
      })
      rawStreamRef.current = null
    }
    outputStreamRef.current = null
  }, [])

  // Hardware 1080p Camera + 48kHz Voice-Isolated Audio Acquisition & Processed Stream Assembly
  const startCamera = useCallback(async () => {
    if (!enabled) return
    try {
      setStreamError(null)
      stopAllManagedStreams()

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStreamError('Camera access not supported on this device.')
        setIsCameraActive(false)
        return
      }

      const fallbackChain = buildStudioConstraintFallbackChain(
        facingMode,
        effectiveTierRef.current
      )

      let acquiredStream: MediaStream | null = null
      let lastErr: unknown = null
      for (const constraints of fallbackChain) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraints)
          if (acquiredStream) break
        } catch (err) {
          lastErr = err
        }
      }

      if (!acquiredStream) {
        throw lastErr ?? new Error('Unable to acquire camera stream')
      }

      rawStreamRef.current = acquiredStream
      setRawStream(acquiredStream)

      // Respect existing mic mute state across camera flips
      acquiredStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicMutedRef.current
      })

      // Lock 1.0x unzoomed wide field-of-view (Still Camera standard)
      const hwVideoTrack = acquiredStream.getVideoTracks()[0]
      if (hwVideoTrack) {
        void applyStillCameraConstraints(hwVideoTrack)
        const settings = typeof hwVideoTrack.getSettings === 'function' ? hwVideoTrack.getSettings() : undefined
        const w = settings?.width ?? 1920
        const h = settings?.height ?? 1080
        if (h >= 1000 || w >= 1800) {
          setCaptureResolutionLabel('1080p HD')
        } else if (h >= 700 || w >= 1200) {
          setCaptureResolutionLabel('720p HD')
        } else {
          setCaptureResolutionLabel(`${w}×${h}`)
        }
      }

      if (sourceVideoRef.current) {
        sourceVideoRef.current.srcObject = acquiredStream
        void sourceVideoRef.current.play().catch(() => {})
      }

      // Build outgoing WebRTC MediaStream from canvas.captureStream(30) + raw 48kHz isolated audio track
      let finalOutStream: MediaStream = acquiredStream
      const canvas = processingCanvasRef.current
      const canCaptureCanvas =
        canvas &&
        typeof canvas.captureStream === 'function' &&
        typeof MediaStream !== 'undefined'

      if (canCaptureCanvas && canvas) {
        try {
          const canvasStream = canvas.captureStream(30)
          const canvasVideoTracks = canvasStream.getVideoTracks()
          if (canvasVideoTracks.length > 0) {
            capturedCanvasStreamRef.current = canvasStream
            // Hint encoder to preserve sharp anatomical detail & text during exercise motion
            const processedTrack = canvasVideoTracks[0] as MediaStreamTrack & { contentHint?: string }
            try {
              if ('contentHint' in processedTrack) {
                processedTrack.contentHint = 'motion'
              }
            } catch {}
            finalOutStream = new MediaStream([
              ...canvasVideoTracks,
              ...acquiredStream.getAudioTracks(),
            ])
          }
        } catch {
          finalOutStream = acquiredStream
        }
      }

      outputStreamRef.current = finalOutStream
      setOutputStream(finalOutStream)
      setIsCameraActive(true)
    } catch {
      setStreamError('Camera / Microphone permission pending or unavailable.')
      setIsCameraActive(false)
    }
  }, [enabled, facingMode, stopAllManagedStreams])

  // Start hardware pipeline on mount / facingMode change, and clean up every track on unmount
  useEffect(() => {
    if (!enabled) return
    void startCamera()
    return () => {
      stopAllManagedStreams()
    }
  }, [enabled, startCamera, stopAllManagedStreams])

  // Dynamically adapt raw camera constraints when network bandwidth tier changes mid-call
  useEffect(() => {
    if (rawStreamRef.current) {
      void applyCameraBandwidthConstraints(rawStreamRef.current, effectiveTier)
    }
  }, [effectiveTier])

  const toggleCamera = useCallback(() => {
    const rawTracks = rawStreamRef.current?.getVideoTracks() ?? []
    const outTracks = outputStreamRef.current?.getVideoTracks() ?? []
    if (rawTracks.length === 0 && outTracks.length === 0) return

    const nextActive = !isCameraActiveRef.current
    rawTracks.forEach(t => {
      t.enabled = nextActive
    })
    outTracks.forEach(t => {
      t.enabled = nextActive
    })
    isCameraActiveRef.current = nextActive
    setIsCameraActive(nextActive)
  }, [])

  const setMicMuted = useCallback((muted: boolean) => {
    const audioTracks = rawStreamRef.current?.getAudioTracks() ?? []
    audioTracks.forEach(t => {
      t.enabled = !muted
    })
    const outAudioTracks = outputStreamRef.current?.getAudioTracks() ?? []
    outAudioTracks.forEach(t => {
      t.enabled = !muted
    })
    isMicMutedRef.current = muted
    setIsMicMuted(muted)
    if (muted) setMicLevel(0)
  }, [])

  const toggleMic = useCallback(() => {
    setMicMuted(!isMicMutedRef.current)
  }, [setMicMuted])

  const setFacingMode = useCallback(
    (
      next:
        | 'user'
        | 'environment'
        | ((prev: 'user' | 'environment') => 'user' | 'environment')
    ) => {
      setFacingModeState(prev => {
        const resolved = typeof next === 'function' ? next(prev) : next
        // Reset manual mirror override when flipping physical front/rear cameras
        setMirrorOverride(null)
        return resolved
      })
    },
    []
  )

  const flipCamera = useCallback(() => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }, [setFacingMode])

  const toggleMirror = useCallback(() => {
    setMirrorOverride(prev => {
      const current = prev !== null ? prev : facingMode === 'user'
      return !current
    })
  }, [facingMode])

  const setIsMirrored = useCallback((mirrored: boolean) => {
    setMirrorOverride(mirrored)
  }, [])

  const toggleLowLightBoost = useCallback(() => {
    setLowLightBoostEnabled(prev => !prev)
  }, [])

  return {
    rawStream,
    outputStream,
    streamError,
    isCameraActive,
    isMicMuted,
    facingMode,
    isMirrored,
    lightingPreset,
    backgroundMode,
    framingGuide,
    lowLightBoostEnabled,
    isLowLightDetected,
    meanLuminance,
    micLevel,
    renderFps,
    frameRenderMs,
    guardrailTier,
    isGuardrailActive: guardrailTier !== 'high',
    isSegmentationReady,
    isPipelineRendering,
    captureResolutionLabel,
    setLightingPreset,
    setBackgroundMode,
    setFramingGuide,
    setLowLightBoostEnabled,
    toggleLowLightBoost,
    toggleCamera,
    toggleMic,
    setMicMuted,
    flipCamera,
    setFacingMode,
    toggleMirror,
    setIsMirrored,
    restartCamera: startCamera,
  }
}
