'use client'

import { useEffect, useRef, useState } from 'react'
import LiveVirtualBackgroundStage from '@/components/coach/LiveVirtualBackgroundStage'
import { COACH_BACKGROUND_PRESETS, CoachBackgroundPreset } from '@/lib/coach-backgrounds-catalog'

export default function VirtualBackgroundHarnessPage() {
  const [selectedBg, setSelectedBg] = useState<CoachBackgroundPreset | null>(COACH_BACKGROUND_PRESETS[0] ?? null)
  const [simMode, setSimMode] = useState<'stationary' | 'motion' | 'camera'>('stationary')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [couchLeakage, setCouchLeakage] = useState<number>(0)
  const [edgeJitter, setEdgeJitter] = useState<number>(0)
  const [fps, setFps] = useState<number>(0)

  const simCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef = useRef<number | null>(null)
  const frameCountRef = useRef<number>(0)
  const lastFpsTimeRef = useRef<number>(performance.now())
  const prevEdgePixelsRef = useRef<Uint8ClampedArray | null>(null)
  const readbackCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Set up Synthetic Video Generator or Real Camera
  useEffect(() => {
    let activeStream: MediaStream | null = null

    if (simMode === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          activeStream = s
          setStream(s)
        })
        .catch((err) => {
          console.warn('Camera access error in harness:', err)
          setSimMode('stationary')
        })
      return () => {
        if (activeStream) {
          activeStream.getTracks().forEach((t) => t.stop())
        }
      }
    }

    // Synthetic Coach Simulator on Canvas
    const simCanvas = document.createElement('canvas')
    simCanvas.width = 1280
    simCanvas.height = 720
    simCanvasRef.current = simCanvas
    const ctx = simCanvas.getContext('2d')
    if (!ctx) return

    const startTime = performance.now()

    // Preload Coach Gordon portrait for realistic multiclass segmentation benchmarking
    const coachImg = new Image()
    coachImg.src = '/images/coach-portrait.jpg'

    const drawSimFrame = () => {
      const now = performance.now()
      const t = (now - startTime) / 1000

      // Head position (stationary breathing or moving left-right)
      let headXOffset = 0
      if (simMode === 'motion') {
        // Sweeping head turn: moves left and right by 90px every 2.4s
        headXOffset = Math.sin(t * 2.6) * 90
      } else {
        // Subtle natural sub-pixel breathing micro-motion
        headXOffset = Math.sin(t * 1.2) * 1.5
      }

      // 1. Physical Room Wall Background (warm gray wall)
      const wallGrad = ctx.createLinearGradient(0, 0, 1280, 720)
      wallGrad.addColorStop(0, '#7A7A78')
      wallGrad.addColorStop(1, '#5C5C5A')
      ctx.fillStyle = wallGrad
      ctx.fillRect(0, 0, 1280, 720)

      // 2. Physical Couch (Dark textured charcoal sofa behind and beside the subject)
      // Left and right couch armrests & back cushions
      ctx.fillStyle = '#2A2D34'
      ctx.beginPath()
      // Couch backrest extending behind head and shoulders
      ctx.roundRect(140, 360, 1000, 360, [40, 40, 0, 0])
      ctx.fill()

      // Left couch bolster/cushion
      ctx.fillStyle = '#21242B'
      ctx.beginPath()
      ctx.roundRect(120, 420, 260, 300, 30)
      ctx.fill()

      // Right couch bolster/cushion
      ctx.beginPath()
      ctx.roundRect(900, 420, 260, 300, 30)
      ctx.fill()

      // 3. Human Coach Subject (Real Coach Scott Gordon Portrait)
      const centerX = 640 + headXOffset
      if (coachImg.complete && coachImg.naturalWidth > 0) {
        const aspect = coachImg.naturalWidth / coachImg.naturalHeight
        const drawH = 680
        const drawW = drawH * aspect
        ctx.drawImage(coachImg, centerX - drawW / 2, 720 - drawH + 20, drawW, drawH)
      } else {
        // Torso & Shoulders fallback
        const centerY = 310
        ctx.fillStyle = '#0F1A2E'
        ctx.beginPath()
        ctx.moveTo(centerX - 180, 720)
        ctx.quadraticCurveTo(centerX - 170, 520, centerX - 80, 450)
        ctx.quadraticCurveTo(centerX, 430, centerX + 80, 450)
        ctx.quadraticCurveTo(centerX + 170, 520, centerX + 180, 720)
        ctx.closePath()
        ctx.fill()

        // Neck & Head
        ctx.fillStyle = '#D69E7B'
        ctx.beginPath()
        ctx.rect(centerX - 35, centerY + 80, 70, 65)
        ctx.fill()

        ctx.beginPath()
        ctx.ellipse(centerX, centerY, 70, 95, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(drawSimFrame)
    }

    drawSimFrame()

    // Capture canvas stream at 30 FPS
    try {
      const simStream = simCanvas.captureStream(30)
      setStream(simStream)
    } catch (err) {
      console.warn('captureStream error in harness:', err)
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [simMode])

  // Real-time quality evaluation loop: measures couch leakage & edge jitter variance
  useEffect(() => {
    const interval = setInterval(() => {
      const stageCanvas = document.querySelector('[data-testid="live-virtual-background-canvas"]') as HTMLCanvasElement | null
      if (!stageCanvas || stageCanvas.width === 0 || stageCanvas.height === 0) return

      let readback = readbackCanvasRef.current
      if (!readback) {
        readback = document.createElement('canvas')
        readbackCanvasRef.current = readback
      }
      if (readback.width !== stageCanvas.width || readback.height !== stageCanvas.height) {
        readback.width = stageCanvas.width
        readback.height = stageCanvas.height
      }
      const ctx = readback.getContext('2d')
      if (!ctx) return
      ctx.drawImage(stageCanvas, 0, 0)

      // Measure FPS
      frameCountRef.current += 1
      const now = performance.now()
      const elapsed = now - lastFpsTimeRef.current
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed))
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }

      try {
        // 1. Test Couch Leakage:
        // Sample known couch region (left bolster area: x: 160, y: 500)
        // In the virtual composite, this region should NOT contain original couch color #21242B (R ~ 33, G ~ 36, B ~ 43)
        const couchSample = ctx.getImageData(160, 500, 40, 40)
        let leakCount = 0
        const data = couchSample.data
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          if (Math.abs(r - 33) < 15 && Math.abs(g - 36) < 15 && Math.abs(b - 43) < 15) {
            leakCount++
          }
        }
        const totalSample = data.length / 4
        const leakRatio = (leakCount / totalSample) * 100
        setCouchLeakage(Math.round(leakRatio * 10) / 10)

        // 2. Test Edge Jitter Variance:
        // Sample boundary strip along right side of head (x: 700..720, y: 280..320)
        const edgeSample = ctx.getImageData(700, 280, 20, 40)
        if (prevEdgePixelsRef.current && simMode === 'stationary') {
          let diffSum = 0
          const cur = edgeSample.data
          const prev = prevEdgePixelsRef.current
          for (let i = 0; i < cur.length; i += 4) {
            const d = Math.abs((cur[i] ?? 0) - (prev[i] ?? 0))
            diffSum += d
          }
          const avgDiff = diffSum / (cur.length / 4)
          setEdgeJitter(Math.round(avgDiff * 10) / 10)
        }
        prevEdgePixelsRef.current = new Uint8ClampedArray(edgeSample.data)
      } catch {
        // Cross-origin or readback protection
      }
    }, 200)

    return () => clearInterval(interval)
  }, [simMode])

  return (
    <div style={{ minHeight: '100vh', background: '#070B14', color: '#F8FAFC', padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '0.02em', color: '#D4AF37' }}>
            Virtual Background Automated Test Harness
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94A3B8' }}>
            Benchmarking MediaPipe segmentation, couch boundary rejection, and edge jitter variance.
          </p>
        </div>

        {/* Live Metrics HUD */}
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ background: '#0D1527', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Couch Leakage</div>
            <div
              data-testid="metrics-couch-leakage"
              style={{ fontSize: 20, fontWeight: 800, color: couchLeakage === 0 ? '#10B981' : '#EF4444' }}
            >
              {couchLeakage}%
            </div>
          </div>

          <div style={{ background: '#0D1527', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Edge Jitter (Var)</div>
            <div
              data-testid="metrics-edge-jitter"
              style={{ fontSize: 20, fontWeight: 800, color: edgeJitter < 3.0 ? '#10B981' : '#F59E0B' }}
            >
              {edgeJitter}
            </div>
          </div>

          <div style={{ background: '#0D1527', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Render FPS</div>
            <div
              data-testid="metrics-fps"
              style={{ fontSize: 20, fontWeight: 800, color: fps >= 24 ? '#10B981' : '#F59E0B' }}
            >
              {fps}
            </div>
          </div>
        </div>
      </div>

      {/* Controls Strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>Simulation Mode:</span>
        <button
          data-testid="sim-mode-stationary"
          onClick={() => setSimMode('stationary')}
          style={{
            background: simMode === 'stationary' ? '#D4AF37' : '#1E293B',
            color: simMode === 'stationary' ? '#000' : '#FFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Stationary on Couch
        </button>

        <button
          data-testid="sim-mode-motion"
          onClick={() => setSimMode('motion')}
          style={{
            background: simMode === 'motion' ? '#D4AF37' : '#1E293B',
            color: simMode === 'motion' ? '#000' : '#FFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Head Turn Motion (Lag Test)
        </button>

        <button
          data-testid="sim-mode-camera"
          onClick={() => setSimMode('camera')}
          style={{
            background: simMode === 'camera' ? '#D4AF37' : '#1E293B',
            color: simMode === 'camera' ? '#000' : '#FFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Use Real WebCam
        </button>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

        <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>Background:</span>
        {COACH_BACKGROUND_PRESETS.slice(0, 3).map((bg) => (
          <button
            key={bg.id}
            data-testid={`select-bg-${bg.id}`}
            onClick={() => setSelectedBg(bg)}
            style={{
              background: selectedBg?.id === bg.id ? 'rgba(212,175,55,0.2)' : '#1E293B',
              border: selectedBg?.id === bg.id ? '1px solid #D4AF37' : '1px solid transparent',
              color: '#FFF',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {bg.name}
          </button>
        ))}
      </div>

      {/* Main Video Viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 960,
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <LiveVirtualBackgroundStage
          stream={stream}
          isActive={true}
          isMirrored={false}
          selectedBackground={selectedBg}
          coachName="Coach Scott Gordon"
        />
      </div>

      {/* Quality Standards Summary */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ background: '#0D1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#D4AF37' }}>1. Couch Rejection Check</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            Target: <strong>0% Leakage</strong>. Ensures couches and chairs adjacent to the coach do not bleed into the background replacement.
          </p>
        </div>

        <div style={{ background: '#0D1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#D4AF37' }}>2. Edge Jitter Stability</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            Target: <strong>Variance &lt; 3.0</strong>. Measures the boundary pixels across stationary frames to eliminate static camera grain and pixel fizzing.
          </p>
        </div>

        <div style={{ background: '#0D1527', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px 0', color: '#D4AF37' }}>3. Zero-Lag Disocclusion</h3>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
            Target: <strong>Instant Cutoff</strong>. When the head pivots, newly exposed background pixels immediately transition with 0 ghost trailing.
          </p>
        </div>
      </div>
    </div>
  )
}

