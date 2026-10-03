'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export type TelestratorTool = 'pen' | 'arrow' | 'circle' | 'protractor'
export type TelestratorColor = '#D4AF37' | '#10B981' | '#EF4444' | '#38BDF8'

export interface Point {
  x: number
  y: number
}

export interface Stroke {
  id: string
  tool: TelestratorTool
  color: TelestratorColor
  lineWidth: number
  points: Point[]
  angleValue?: number
  timestamp: number
}

export function calculateInteriorAngle(p1: Point, vertex: Point, p3: Point): number {
  const v1x = p1.x - vertex.x
  const v1y = p1.y - vertex.y
  const v2x = p3.x - vertex.x
  const v2y = p3.y - vertex.y

  const dot = v1x * v2x + v1y * v2y
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y)
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y)

  if (mag1 === 0 || mag2 === 0) return 0

  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  const radians = Math.acos(cosTheta)
  return Math.round((radians * 180) / Math.PI)
}

export function getAngleClinicalLabel(deg: number): string {
  if (deg >= 85 && deg <= 95) return `${deg}° · Parallel (Optimal)`
  if (deg < 85 && deg >= 60) return `${deg}° · Deep Flexion`
  if (deg < 60) return `${deg}° · Acute Compression`
  if (deg > 95 && deg <= 125) return `${deg}° · Hip Hinge / Catch`
  if (deg >= 170) return `${deg}° · Full Lockout`
  return `${deg}° Angle`
}

interface LiveTelestratorCanvasProps {
  isActive: boolean
  activeTool?: TelestratorTool
  activeColor?: TelestratorColor
  autoFade?: boolean
  onClose?: () => void
}

export default function LiveTelestratorCanvas({
  isActive,
  activeTool = 'pen',
  activeColor = '#D4AF37',
  autoFade = false,
}: LiveTelestratorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [protractorPoints, setProtractorPoints] = useState<Point[]>([])
  const isDrawingRef = useRef(false)

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const now = Date.now()

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes

    for (const stroke of allStrokes) {
      let alpha = 1
      if (autoFade) {
        const age = now - stroke.timestamp
        if (age > 4000) continue
        if (age > 2500) {
          alpha = Math.max(0, 1 - (age - 2500) / 1500)
        }
      }

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = stroke.color
      ctx.fillStyle = stroke.color
      ctx.lineWidth = stroke.lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (stroke.tool === 'pen' && stroke.points.length > 0) {
        ctx.beginPath()
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
        }
        ctx.stroke()
      } else if (stroke.tool === 'arrow' && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        const headLength = 16
        const dx = end.x - start.x
        const dy = end.y - start.y
        const angle = Math.atan2(dy, dx)

        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(end.x, end.y)
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()
      } else if (stroke.tool === 'circle' && stroke.points.length >= 2) {
        const start = stroke.points[0]
        const end = stroke.points[stroke.points.length - 1]
        const rx = Math.abs(end.x - start.x) / 2
        const ry = Math.abs(end.y - start.y) / 2
        const cx = Math.min(start.x, end.x) + rx
        const cy = Math.min(start.y, end.y) + ry

        ctx.beginPath()
        ctx.ellipse(cx, cy, Math.max(rx, 4), Math.max(ry, 4), 0, 0, Math.PI * 2)
        ctx.stroke()
      } else if (stroke.tool === 'protractor' && stroke.points.length === 3) {
        const [p1, vertex, p3] = stroke.points
        const deg = stroke.angleValue ?? calculateInteriorAngle(p1, vertex, p3)
        const statusLabel = getAngleClinicalLabel(deg)

        // Draw ray 1 with clean precision line
        ctx.beginPath()
        ctx.moveTo(vertex.x, vertex.y)
        ctx.lineTo(p1.x, p1.y)
        ctx.stroke()

        // Draw ray 2 with clean precision line
        ctx.beginPath()
        ctx.moveTo(vertex.x, vertex.y)
        ctx.lineTo(p3.x, p3.y)
        ctx.stroke()

        // Draw Dynamic Swept Angle Arc at Joint Vertex
        const ang1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x)
        const ang2 = Math.atan2(p3.y - vertex.y, p3.x - vertex.x)
        const arcRadius = 28

        ctx.save()
        ctx.beginPath()
        ctx.arc(vertex.x, vertex.y, arcRadius, Math.min(ang1, ang2), Math.max(ang1, ang2))
        ctx.strokeStyle = stroke.color
        ctx.lineWidth = 2
        ctx.stroke()

        // Arc highlight fill
        ctx.globalAlpha = 0.2 * alpha
        ctx.fillStyle = stroke.color
        ctx.lineTo(vertex.x, vertex.y)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Draw vertex dual-ring reticle dot
        ctx.beginPath()
        ctx.arc(vertex.x, vertex.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = stroke.color
        ctx.fill()
        ctx.beginPath()
        ctx.arc(vertex.x, vertex.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()

        // Draw Luxury Obsidian HUD Badge for Angle & Clinical Status
        ctx.save()
        ctx.font = 'bold 11px monospace, sans-serif'
        const badgePaddingH = 8
        const textWidth = ctx.measureText(statusLabel).width
        const badgeWidth = textWidth + badgePaddingH * 2 + 10
        const badgeHeight = 22
        const badgeX = vertex.x + 16
        const badgeY = vertex.y - 12

        // Badge Backdrop
        ctx.fillStyle = 'rgba(8, 14, 24, 0.95)'
        ctx.beginPath()
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX, badgeY - badgeHeight + 6, badgeWidth, badgeHeight, 5)
        } else {
          ctx.rect(badgeX, badgeY - badgeHeight + 6, badgeWidth, badgeHeight)
        }
        ctx.fill()

        // Badge Hairline Border
        ctx.strokeStyle = 'rgba(212, 160, 23, 0.6)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Status Indicator Dot
        ctx.beginPath()
        ctx.arc(badgeX + 9, badgeY - 5, 3, 0, Math.PI * 2)
        ctx.fillStyle = deg >= 85 && deg <= 95 ? '#34D399' : stroke.color
        ctx.fill()

        // Badge Text
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(statusLabel, badgeX + 16, badgeY - 1)
        ctx.restore()
      }

      ctx.restore()
    }

    // Draw active protractor preview points
    if (activeTool === 'protractor' && protractorPoints.length > 0) {
      ctx.save()
      ctx.fillStyle = '#D4AF37'
      for (let i = 0; i < protractorPoints.length; i++) {
        const pt = protractorPoints[i]
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(`P${i + 1}`, pt.x + 8, pt.y - 4)
      }
      ctx.restore()
    }
  }, [strokes, currentStroke, autoFade, activeTool, protractorPoints])

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas || !canvas.parentElement) return
      canvas.width = canvas.parentElement.clientWidth
      canvas.height = canvas.parentElement.clientHeight
      redrawCanvas()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [redrawCanvas])

  // Eco Animation Frame Loop for Auto-Fade: ONLY runs when active strokes exist
  useEffect(() => {
    if (!autoFade || strokes.length === 0) return
    let animId: number
    const loop = () => {
      const now = Date.now()
      const remainingStrokes = strokes.filter(s => now - s.timestamp <= 4000)
      if (remainingStrokes.length !== strokes.length) {
        setStrokes(remainingStrokes)
      }
      redrawCanvas()
      if (remainingStrokes.length > 0) {
        animId = requestAnimationFrame(loop)
      }
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [autoFade, strokes, redrawCanvas])

  useEffect(() => {
    redrawCanvas()
  }, [strokes, currentStroke, redrawCanvas])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isActive) return
    const pt = getCanvasCoords(e)

    if (activeTool === 'protractor') {
      const nextPoints = [...protractorPoints, pt]
      if (nextPoints.length === 3) {
        const [p1, vertex, p3] = nextPoints
        const angle = calculateInteriorAngle(p1, vertex, p3)
        const newStroke: Stroke = {
          id: String(Date.now()),
          tool: 'protractor',
          color: activeColor,
          lineWidth: 3,
          points: nextPoints,
          angleValue: angle,
          timestamp: Date.now(),
        }
        setStrokes(prev => [...prev, newStroke])
        setProtractorPoints([])
      } else {
        setProtractorPoints(nextPoints)
      }
      return
    }

    isDrawingRef.current = true
    const newStroke: Stroke = {
      id: String(Date.now()),
      tool: activeTool,
      color: activeColor,
      lineWidth: activeTool === 'pen' ? 3 : 4,
      points: [pt],
      timestamp: Date.now(),
    }
    setCurrentStroke(newStroke)
  }

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isActive || !isDrawingRef.current || !currentStroke) return
    const pt = getCanvasCoords(e)

    if (activeTool === 'pen') {
      setCurrentStroke(prev => (prev ? { ...prev, points: [...prev.points, pt] } : null))
    } else {
      setCurrentStroke(prev => (prev ? { ...prev, points: [prev.points[0], pt] } : null))
    }
  }

  const handlePointerUp = () => {
    if (!isActive || !isDrawingRef.current || !currentStroke) return
    isDrawingRef.current = false
    setStrokes(prev => [...prev, currentStroke])
    setCurrentStroke(null)
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: isActive ? 20 : 5,
        cursor: isActive ? 'crosshair' : 'default',
        pointerEvents: isActive ? 'auto' : 'none',
        touchAction: 'none',
      }}
    />
  )
}
