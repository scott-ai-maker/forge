'use client'

import { useEffect, useRef, useState } from 'react'
import { CoachBackgroundPreset } from '@/lib/coach-backgrounds-catalog'
import { GaaIcon } from '@/components/ui/GaaIcon'

interface LiveVirtualBackgroundStageProps {
  stream: MediaStream | null
  isActive: boolean
  isMirrored?: boolean
  selectedBackground: CoachBackgroundPreset | null
  coachName?: string
  onOpenPicker?: () => void
}

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
    cb: (result: { confidenceMasks?: MediaPipeMask[]; categoryMask?: MediaPipeMask; close?: () => void }) => void
  ) => void
  close?: () => void
}

export default function LiveVirtualBackgroundStage({
  stream,
  isActive,
  isMirrored = true,
  selectedBackground,
  coachName = 'Coach Scott Gordon',
  onOpenPicker,
}: LiveVirtualBackgroundStageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const segmenterRef = useRef<ImageSegmenterInstance | null>(null)
  const [isAiReady, setIsAiReady] = useState(false)
  const isVirtualActive = Boolean(selectedBackground)

  // Attach stream to video tag
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  // Preload background image
  useEffect(() => {
    if (selectedBackground?.imageUrl && !selectedBackground.isBlur) {
      const img = new Image()
      img.src = selectedBackground.imageUrl
      img.onload = () => {
        bgImageRef.current = img
      }
    } else {
      bgImageRef.current = null
    }
  }, [selectedBackground])

  // Initialize MediaPipe Tasks-Vision ImageSegmenter with Multiclass Model
  useEffect(() => {
    let isCancelled = false

    async function initSegmenter() {
      try {
        if (typeof window === 'undefined') return
        const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision')
        if (isCancelled) return

        const wasmPath = '/wasm'
        const vision = await FilesetResolver.forVisionTasks(wasmPath)
        if (isCancelled) return

        let segmenter: ImageSegmenterInstance
        try {
          segmenter = (await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/selfie_multiclass_256x256.tflite',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: true,
            outputConfidenceMasks: false,
          })) as unknown as ImageSegmenterInstance
        } catch (gpuErr) {
          console.warn('MediaPipe GPU segmenter failed, falling back to CPU delegate:', gpuErr)
          segmenter = (await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/models/selfie_multiclass_256x256.tflite',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            outputCategoryMask: true,
            outputConfidenceMasks: false,
          })) as unknown as ImageSegmenterInstance
        }

        if (isCancelled) {
          segmenter.close?.()
          return
        }

        segmenterRef.current = segmenter
        setIsAiReady(true)
      } catch (err) {
        console.warn('MediaPipe segmenter initialization failed:', err)
      }
    }

    void initSegmenter()

    return () => {
      isCancelled = true
      if (segmenterRef.current) {
        try {
          segmenterRef.current.close?.()
        } catch {}
      }
    }
  }, [])


  // WebGL2 Industry-Standard GPU Shader Engine (Zoom / LiveKit Architecture)
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const glProgramRef = useRef<{
    program: WebGLProgram
    attribPosition: number
    uFrame: WebGLUniformLocation | null
    uBackground: WebGLUniformLocation | null
    uMask: WebGLUniformLocation | null
    uIsMirrored: WebGLUniformLocation | null
    uIsBlur: WebGLUniformLocation | null
    uHasBgImage: WebGLUniformLocation | null
    frameTex: WebGLTexture | null
    bgTex: WebGLTexture | null
    maskTex: WebGLTexture | null
    vertexBuffer: WebGLBuffer | null
  } | null>(null)
  const maskBufferRef = useRef<Uint8Array | null>(null)
  const prevMaskBufferRef = useRef<Uint8Array | null>(null)

  // Initialize WebGL2 Program and GPU Textures
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl2', {
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    })
    if (!gl) {
      console.warn('WebGL2 not supported, falling back to 2D canvas')
      return
    }
    glRef.current = gl

    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_texCoords;
      void main() {
        v_texCoords = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoords;
      uniform sampler2D u_frame;
      uniform sampler2D u_background;
      uniform sampler2D u_mask;
      uniform bool u_isMirrored;
      uniform bool u_isBlur;
      uniform bool u_hasBgImage;
      out vec4 fragColor;

      void main() {
        vec2 uv = vec2(v_texCoords.x, 1.0 - v_texCoords.y);
        vec2 camCoords = u_isMirrored ? vec2(1.0 - uv.x, uv.y) : uv;
        vec4 frameTex = texture(u_frame, camCoords);

        // 3x3 Multi-Tap Stencil across neural field (256x256)
        vec2 texel = 2.2 / vec2(textureSize(u_mask, 0));

        float c  = texture(u_mask, camCoords).r;
        float l  = texture(u_mask, camCoords - vec2(texel.x, 0.0)).r;
        float r  = texture(u_mask, camCoords + vec2(texel.x, 0.0)).r;
        float t  = texture(u_mask, camCoords - vec2(0.0, texel.y)).r;
        float b  = texture(u_mask, camCoords + vec2(0.0, texel.y)).r;
        float tl = texture(u_mask, camCoords + vec2(-texel.x, -texel.y)).r;
        float tr = texture(u_mask, camCoords + vec2( texel.x, -texel.y)).r;
        float bl = texture(u_mask, camCoords + vec2(-texel.x,  texel.y)).r;
        float br = texture(u_mask, camCoords + vec2( texel.x,  texel.y)).r;

        // 1. 9-Tap Binomial Gaussian Smoothing:
        // Converts 256x256 discrete neural network grid blocks into a silky continuous optical gradient
        float smoothed = (tl + 2.0*t + tr + 2.0*l + 4.0*c + 2.0*r + bl + 2.0*b + br) / 16.0;

        // 2. Gentle Optical Choke (15%):
        // Gently hugs the hairline and shoulders flush without eroding clothing or torso
        float minNeighbor = min(min(min(l, r), min(t, b)), min(min(tl, tr), min(bl, br)));
        float maskVal = mix(smoothed, min(smoothed, minNeighbor), 0.15);

        // 3. Screen-Space Derivative Anti-Aliasing (Industry Standard centered at [0.42, 0.58]):
        // Background noise (< 0.42) is 100% cutout. Full body & torso (>= 0.58) are 100% solid camera frame.
        float grad = length(vec2(dFdx(maskVal), dFdy(maskVal)));
        float edgeSoftness = 1.5;
        float lowBound = 0.42 - grad * edgeSoftness;
        float highBound = 0.58 + grad * edgeSoftness;
        float alpha = smoothstep(lowBound, highBound, maskVal);

        vec4 bgTex;
        if (u_isBlur) {
          vec2 blurTexel = 1.0 / vec2(textureSize(u_frame, 0));
          vec4 sum = vec4(0.0);
          sum += texture(u_frame, camCoords + vec2(-4.0, -4.0) * blurTexel) * 0.08;
          sum += texture(u_frame, camCoords + vec2( 0.0, -5.0) * blurTexel) * 0.12;
          sum += texture(u_frame, camCoords + vec2( 4.0, -4.0) * blurTexel) * 0.08;
          sum += texture(u_frame, camCoords + vec2(-5.0,  0.0) * blurTexel) * 0.12;
          sum += texture(u_frame, camCoords) * 0.20;
          sum += texture(u_frame, camCoords + vec2( 5.0,  0.0) * blurTexel) * 0.12;
          sum += texture(u_frame, camCoords + vec2(-4.0,  4.0) * blurTexel) * 0.08;
          sum += texture(u_frame, camCoords + vec2( 0.0,  5.0) * blurTexel) * 0.12;
          sum += texture(u_frame, camCoords + vec2( 4.0,  4.0) * blurTexel) * 0.08;
          bgTex = sum * vec4(0.96, 0.98, 1.04, 1.0);
        } else if (u_hasBgImage) {
          bgTex = texture(u_background, uv);
        } else {
          bgTex = mix(vec4(0.055, 0.086, 0.157, 1.0), vec4(0.02, 0.03, 0.067, 1.0), uv.y);
        }

        fragColor = mix(bgTex, vec4(frameTex.rgb, 1.0), alpha);
      }
    `

    const vs = gl.createShader(gl.VERTEX_SHADER)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    if (!vs || !fs) return

    gl.shaderSource(vs, vsSource)
    gl.compileShader(vs)
    gl.shaderSource(fs, fsSource)
    gl.compileShader(fs)

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    const attribPosition = gl.getAttribLocation(program, 'a_position')
    const uFrame = gl.getUniformLocation(program, 'u_frame')
    const uBackground = gl.getUniformLocation(program, 'u_background')
    const uMask = gl.getUniformLocation(program, 'u_mask')
    const uIsMirrored = gl.getUniformLocation(program, 'u_isMirrored')
    const uIsBlur = gl.getUniformLocation(program, 'u_isBlur')
    const uHasBgImage = gl.getUniformLocation(program, 'u_hasBgImage')

    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const createTex = () => {
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      return tex
    }

    glProgramRef.current = {
      program,
      attribPosition,
      uFrame,
      uBackground,
      uMask,
      uIsMirrored,
      uIsBlur,
      uHasBgImage,
      frameTex: createTex(),
      bgTex: createTex(),
      maskTex: createTex(),
      vertexBuffer,
    }

    return () => {
      if (gl) {
        if (vs) gl.deleteShader(vs)
        if (fs) gl.deleteShader(fs)
        if (program) gl.deleteProgram(program)
        if (vertexBuffer) gl.deleteBuffer(vertexBuffer)
      }
    }
  }, [])

  // Real-Time 60 FPS WebGL2 Render Loop
  useEffect(() => {
    if (!isVirtualActive || !isActive) return

    let animationId: number
    let lastTime = -1

    const render = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const segmenter = segmenterRef.current
      const gl = glRef.current
      const gpuProg = glProgramRef.current

      if (video && video.readyState >= 2 && video.videoWidth > 0 && canvas && gl && gpuProg) {
        const w = video.videoWidth
        const h = video.videoHeight

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
          gl.viewport(0, 0, w, h)
        }

        const now = performance.now()
        if (segmenter && isAiReady && now > lastTime) {
          try {
            segmenter.segmentForVideo(video, now, (result) => {
              const mask = (result.confidenceMasks && result.confidenceMasks.length > 0)
                ? result.confidenceMasks[0]
                : result.categoryMask
              if (!mask) {
                result.close?.()
                return
              }

              const maskW = mask.width || 256
              const maskH = mask.height || 256
              const totalMask = maskW * maskH

              if (!maskBufferRef.current || maskBufferRef.current.length !== totalMask) {
                maskBufferRef.current = new Uint8Array(totalMask)
              }
              const maskBytes = maskBufferRef.current

              let prevMask = prevMaskBufferRef.current
              if (!prevMask || prevMask.length !== totalMask) {
                prevMask = new Uint8Array(totalMask)
                prevMaskBufferRef.current = prevMask
              }

              if (result.categoryMask && typeof result.categoryMask.getAsUint8Array === 'function') {
                const uData = result.categoryMask.getAsUint8Array()
                for (let i = 0; i < totalMask; i++) {
                  // Multiclass Labels:
                  // 0: background (couch, chair, room, gym, wall) -> cutout
                  // 1: hair, 2: body-skin, 3: face-skin, 4: clothes, 5: others/accessories -> coach foreground
                  const targetVal = uData[i] > 0 ? 255 : 0
                  // Temporal EMA (80% current, 20% previous) eliminates single-frame edge flicker
                  const smoothedVal = Math.round(0.80 * targetVal + 0.20 * prevMask[i])
                  maskBytes[i] = smoothedVal
                  prevMask[i] = smoothedVal
                }
              } else if (result.confidenceMasks && result.confidenceMasks.length > 0) {
                const confMask = result.confidenceMasks[0]
                if (typeof confMask.getAsUint8Array === 'function') {
                  const uData = confMask.getAsUint8Array()
                  for (let i = 0; i < totalMask; i++) {
                    // MUST ALWAYS BE INVERTED per architecture rule: coach foreground is 255 (retained), room is 0 (cutout)
                    const targetVal = 255 - uData[i]
                    const smoothedVal = Math.round(0.80 * targetVal + 0.20 * prevMask[i])
                    maskBytes[i] = smoothedVal
                    prevMask[i] = smoothedVal
                  }
                } else if (typeof confMask.getAsFloat32Array === 'function') {
                  const fData = confMask.getAsFloat32Array()
                  for (let i = 0; i < totalMask; i++) {
                    // MUST ALWAYS BE INVERTED per architecture rule: const conf = 1 - rawConf
                    const rawConf = fData[i] ?? 0
                    const conf = 1 - rawConf
                    const targetVal = Math.round(conf * 255)
                    const smoothedVal = Math.round(0.80 * targetVal + 0.20 * prevMask[i])
                    maskBytes[i] = smoothedVal
                    prevMask[i] = smoothedVal
                  }
                }
              } else {
                result.close?.()
                return
              }

              gl.useProgram(gpuProg.program)

              // Upload Camera Video Frame (Texture Unit 0)
              gl.activeTexture(gl.TEXTURE0)
              gl.bindTexture(gl.TEXTURE_2D, gpuProg.frameTex)
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
              gl.uniform1i(gpuProg.uFrame, 0)

              // Upload Virtual Background Image (Texture Unit 1)
              const isBlur = selectedBackground?.isBlur || selectedBackground?.id === 'studio-blur'
              let hasBgImage = false
              if (!isBlur && bgImageRef.current && bgImageRef.current.complete) {
                gl.activeTexture(gl.TEXTURE1)
                gl.bindTexture(gl.TEXTURE_2D, gpuProg.bgTex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImageRef.current)
                gl.uniform1i(gpuProg.uBackground, 1)
                hasBgImage = true
              }

              // Upload Segmentation Mask Texture (Texture Unit 2 - R8 Single Channel)
              // Explicitly set unpack alignment to 1 byte to prevent scanline padding comb artifacts
              gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
              gl.activeTexture(gl.TEXTURE2)
              gl.bindTexture(gl.TEXTURE_2D, gpuProg.maskTex)
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, maskW, maskH, 0, gl.RED, gl.UNSIGNED_BYTE, maskBytes)
              gl.uniform1i(gpuProg.uMask, 2)

              // Set Shader Uniforms
              gl.uniform1i(gpuProg.uIsMirrored, isMirrored ? 1 : 0)
              gl.uniform1i(gpuProg.uIsBlur, isBlur ? 1 : 0)
              gl.uniform1i(gpuProg.uHasBgImage, hasBgImage ? 1 : 0)

              // Draw Full-Screen Quad
              gl.bindBuffer(gl.ARRAY_BUFFER, gpuProg.vertexBuffer)
              gl.enableVertexAttribArray(gpuProg.attribPosition)
              gl.vertexAttribPointer(gpuProg.attribPosition, 2, gl.FLOAT, false, 0, 0)

              gl.drawArrays(gl.TRIANGLES, 0, 6)

              result.close?.()
            })
            lastTime = now
          } catch {
            // Frame drop
          }
        }
      }

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [isVirtualActive, isActive, isAiReady, selectedBackground, isMirrored])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#04070E',
      }}
    >
      {/* 
        Hardware Video Element:
        - Visible when virtual background is OFF
        - Hidden via opacity when AI background is ON (so it keeps decoding frames at full speed)
      */}
      <video
        ref={videoRef}
        data-testid="live-virtual-background-video"
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isMirrored ? 'scaleX(-1)' : 'none',
          opacity: isVirtualActive && isAiReady ? 0 : 1,
          zIndex: 1,
        }}
      />

      {/* AI Zoom-Style Segmented Canvas */}
      {isVirtualActive && (
        <canvas
          ref={canvasRef}
          data-testid="live-virtual-background-canvas"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'none',
            opacity: isAiReady ? 1 : 0,
            zIndex: 2,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {!isActive && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: '#080C16', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <GaaIcon name="video-studio" size={36} tone="slate" />
          <span style={{ fontSize: 13, color: 'var(--gray)', marginTop: 6 }}>Camera Off</span>
        </div>
      )}

      {/* Top Left Feed Label */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          background: 'rgba(0,0,0,0.75)',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10.5,
          fontWeight: 700,
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, background: '#10B981', display: 'inline-block' }} />
        <span>{coachName}</span>
      </div>

      {/* Virtual Background Indicator Pill */}
      {selectedBackground && (
        <button
          type="button"
          onClick={onOpenPicker}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(212,160,23,0.4)',
            color: 'var(--gold-lt)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10.5,
            fontWeight: 800,
            cursor: 'pointer',
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <GaaIcon name="sparkles" size={11} tone="gold" />
          <span>{selectedBackground.name} {!isAiReady ? '(Initializing...)' : ''}</span>
        </button>
      )}

      {/* Branded Logo Watermark Overlay on Bottom Right of Video Feed */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          pointerEvents: 'none',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(4,7,14,0.85)',
          border: '1px solid rgba(212,160,23,0.4)',
          borderRadius: 8,
          padding: '4px 10px 4px 6px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.85)',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundImage: "url('/images/logo-mark-source.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid rgba(212,160,23,0.5)',
            boxShadow: '0 0 10px rgba(212,160,23,0.4)',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--gold-lt)',
              lineHeight: 1,
            }}
          >
            FORGE ATHLETIC
          </span>
          <span
            style={{
              fontSize: 8.5,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              marginTop: 1,
            }}
          >
            Private Performance Lab
          </span>
        </div>
      </div>
    </div>
  )
}
