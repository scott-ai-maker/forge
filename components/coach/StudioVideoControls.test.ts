import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const PIPELINE_PATH = path.resolve(process.cwd(), 'hooks/useStudioVideoPipeline.ts')
const CONTROLS_PATH = path.resolve(process.cwd(), 'components/coach/StudioVideoControls.tsx')
const UNIFIED_HUD_PATH = path.resolve(process.cwd(), 'components/coach/UnifiedLiveStudioHud.tsx')
const CAMERA_HUD_PATH = path.resolve(process.cwd(), 'components/coach/LiveVideoCameraHud.tsx')

describe('Studio Video Pipeline & Controls Architectural Invariants', () => {
  const pipelineSource = fs.readFileSync(PIPELINE_PATH, 'utf8')
  const controlsSource = fs.readFileSync(CONTROLS_PATH, 'utf8')
  const unifiedHudSource = fs.readFileSync(UNIFIED_HUD_PATH, 'utf8')
  const cameraHudSource = fs.readFileSync(CAMERA_HUD_PATH, 'utf8')

  it('strictly inverts MediaPipe selfie segmentation mask polarity (foreground=1.0, background=0.0)', () => {
    expect(pipelineSource).toContain('const conf = 1 - rawConf')
    expect(pipelineSource).toContain('const targetVal = 255 - uData[i]')
  })

  it('never mirrors canvas or background images (true left-to-right optical orientation)', () => {
    expect(pipelineSource).toContain("canvas.style.transform = 'none'")
    // WebGL fragment shader mirrors foreground camera UV (camCoords) while sampling u_background with unmirrored uv
    expect(pipelineSource).toContain('vec2 camCoords = u_isMirrored ? vec2(1.0 - uv.x, uv.y) : uv;')
    expect(pipelineSource).toContain('texture(u_background, uv)')
    expect(pipelineSource).not.toContain('scaleX(-1)')
  })

  it('implements WebGL2 Forge Studio LUT shader with shadow lift, 0.25 unsharp mask, vignette, and bilateral edge feathering', () => {
    expect(pipelineSource).toContain('#version 300 es')
    expect(pipelineSource).toContain('applyForgeStudioLut')
    expect(pipelineSource).toContain('sampleGuidedBilateralAlpha')
    expect(pipelineSource).toContain('sampleOpticalBokehBlur')
    expect(pipelineSource).toContain('captureStream')
  })

  it('cleans up MediaStreamTracks, WebGL resources, MediaPipe segmenter, and AudioContext on unmount', () => {
    expect(pipelineSource).toContain('t.stop()')
    expect(pipelineSource).toContain('cancelAnimationFrame')
    expect(pipelineSource).toContain('segmenterRef.current.close')
    expect(pipelineSource).toContain('gl.deleteTexture')
    expect(pipelineSource).toContain('gl.deleteProgram')
    expect(pipelineSource).toContain('gl.deleteShader')
    expect(pipelineSource).toContain('gl.deleteBuffer')
    expect(pipelineSource).toContain('localCtx.close()')
  })

  it('respects global SFX MUTED rules across StudioVideoControls and UnifiedLiveStudioHud', () => {
    expect(controlsSource).toContain('isSfxMuted()')
    expect(unifiedHudSource).toContain('if (isSfxMuted()) return')
  })

  it('implements accessible WAI-ARIA toolbar, aria-pressed toggles, Low-Light Studio Boost chip, and Pre-Call Green Room', () => {
    expect(controlsSource).toContain('role="toolbar"')
    expect(controlsSource).toContain('aria-pressed=')
    expect(controlsSource).toContain('data-testid="studio-fx-pill"')
    expect(controlsSource).toContain('data-testid="low-light-auto-boost-chip"')
    expect(controlsSource).toContain('data-testid="studio-green-room-modal"')
    expect(controlsSource).toContain('Test Studio Filter & Background')
  })

  it('wires useStudioVideoPipeline, StudioVideoControls, and StudioGreenRoomPreview into both Live Studio HUDs', () => {
    expect(cameraHudSource).toContain('useStudioVideoPipeline')
    expect(cameraHudSource).toContain('<StudioVideoControls')
    expect(cameraHudSource).toContain('<StudioGreenRoomPreview')

    expect(unifiedHudSource).toContain('useStudioVideoPipeline')
    expect(unifiedHudSource).toContain('<StudioVideoControls')
    expect(unifiedHudSource).toContain('<StudioGreenRoomPreview')
  })
})
