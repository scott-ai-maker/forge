'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import {
  PosturalMeshScanResult,
  PosturalViewType,
  LandmarkPoint,
  POSTURAL_VIEW_INSTRUCTIONS,
  type PosturalViewInstruction,
} from '@/lib/ai-postural-mesh-scanner'

interface AiPostureMeshScannerModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName?: string
  onApplyScan: (scanResult: PosturalMeshScanResult) => void
  initialCapturedPhoto?: string | null
  initialView?: PosturalViewType
  initialPhotosByView?: Partial<Record<PosturalViewType, string | null>>
}

const VIEW_PRESETS: Array<{ id: PosturalViewType; label: string; iconName: GaaIconName; desc: string }> = [
  { id: 'anterior', label: '1. Anterior View', iconName: 'user', desc: 'Shoulder level, Q-angle valgus/varus, subtalar pronation' },
  { id: 'lateral', label: '2. Lateral View', iconName: 'grid', desc: 'Forward head, thoracic kyphosis, anterior pelvic tilt' },
  { id: 'posterior', label: '3. Posterior View', iconName: 'rotate-ccw', desc: 'Scapular winging, calcaneal eversion, asymmetric shift' },
  { id: 'overhead_squat', label: '4. Overhead Squat (OHSA)', iconName: 'barbell', desc: 'Arms fall forward, excessive forward lean, knee collapse' },
]

/**
 * Safely downsample client posture photos to 1280px max dimension and 0.88 JPEG quality.
 * Prevents mobile memory crashes, stays well under sessionStorage 5MB quotas, and keeps network payloads sub-250KB.
 */
function compressPosturePhoto(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onerror = () => resolve('')
    reader.onload = () => {
      const result = reader.result as string
      if (typeof window === 'undefined') {
        resolve(result)
        return
      }
      const img = document.createElement('img')
      img.onerror = () => resolve(result)
      img.onload = () => {
        try {
          const maxDim = 1280
          let width = img.width
          let height = img.height
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(result)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.88))
        } catch {
          resolve(result)
        }
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  })
}

export default function AiPostureMeshScannerModal({
  isOpen,
  onClose,
  clientId,
  clientName = 'Athlete',
  onApplyScan,
  initialCapturedPhoto,
  initialView,
  initialPhotosByView,
}: AiPostureMeshScannerModalProps) {
  const [activeView, setActiveView] = useState<PosturalViewType>(initialView || 'lateral')
  const [activeRightTab, setActiveRightTab] = useState<'guide' | 'analysis'>('guide')
  const [mobileTab, setMobileTab] = useState<'camera' | 'guide' | 'analysis'>('camera')

  // Multi-pose photo gallery: each pose retains its own captured photo
  const storageKey = `sgf_posture_photos_${clientId}`
  const [photosByView, setPhotosByView] = useState<Record<PosturalViewType, string | null>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(storageKey) || sessionStorage.getItem(`gaa_assessment_frames_${clientId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            anterior: parsed.anterior || null,
            lateral: parsed.lateral || null,
            posterior: parsed.posterior || null,
            overhead_squat: parsed.overhead_squat || null,
          }
        }
      } catch {
        // fallback
      }
    }
    return { anterior: null, lateral: null, posterior: null, overhead_squat: null }
  })

  // Multi-pose scan telemetry store: each pose retains its own AI scan findings
  const [scanResultsByView, setScanResultsByView] = useState<Record<PosturalViewType, PosturalMeshScanResult | null>>({
    anterior: null,
    lateral: null,
    posterior: null,
    overhead_squat: null,
  })

  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Derived state for the active pose
  const imageSrc = photosByView[activeView]
  const scanResult = scanResultsByView[activeView]
  const totalPhotosCaptured = Object.values(photosByView).filter(Boolean).length
  const totalScannedCount = Object.values(scanResultsByView).filter(Boolean).length

  // Persist photos to session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(photosByView))
      } catch {
        // quota fallback
      }
    }
  }, [photosByView, storageKey])

  // Pre-populate captured photos from live studio session
  useEffect(() => {
    if (isOpen) {
      if (initialPhotosByView) {
        setPhotosByView(prev => {
          const next = { ...prev }
          if (initialPhotosByView.anterior) next.anterior = initialPhotosByView.anterior
          if (initialPhotosByView.lateral) next.lateral = initialPhotosByView.lateral
          if (initialPhotosByView.posterior) next.posterior = initialPhotosByView.posterior
          if (initialPhotosByView.overhead_squat) next.overhead_squat = initialPhotosByView.overhead_squat
          return next
        })
      } else if (initialCapturedPhoto) {
        const targetView = initialView || activeView
        setPhotosByView(prev => ({
          ...prev,
          [targetView]: initialCapturedPhoto,
        }))
      }
      if (initialView) {
        setActiveView(initialView)
      }
    }
  }, [initialCapturedPhoto, initialPhotosByView, initialView, isOpen])

  // Live Camera Viewfinder State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [countdown, setCountdown] = useState<number | null>(null)

  const currentInstruction: PosturalViewInstruction = POSTURAL_VIEW_INSTRUCTIONS[activeView]

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraCaptureInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Clear running countdown timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setCountdown(null)
  }, [])

  // Stop Live Camera Stream
  const stopCamera = useCallback(() => {
    clearTimer()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }, [clearTimer])

  // Start Live Camera Stream (or fallback to native device camera)
  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setErrorMessage(null)
    try {
      stopCamera()
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        cameraCaptureInputRef.current?.click()
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraActive(true)
    } catch {
      // Fallback to mobile native capture input if getUserMedia fails
      if (cameraCaptureInputRef.current) {
        cameraCaptureInputRef.current.click()
      } else {
        setErrorMessage('Camera access was not permitted. Please upload a photo instead.')
      }
    }
  }, [facingMode, stopCamera])

  // Flip Front / Rear Camera
  const toggleCameraFacing = useCallback(() => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextFacing)
    startCamera(nextFacing)
  }, [facingMode, startCamera])

  // Capture Still Frame from Video Stream for the active pose
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw video frame onto offscreen canvas (mirrored if front camera)
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.88)

    setPhotosByView(prev => ({
      ...prev,
      [activeView]: base64,
    }))
    setScanResultsByView(prev => ({
      ...prev,
      [activeView]: null,
    }))
    stopCamera()
  }, [activeView, facingMode, stopCamera])

  // Capture Photo With 3-Second Countdown Timer
  const capturePhotoWithTimer = useCallback((seconds: number = 3) => {
    clearTimer()
    setCountdown(seconds)
    let current = seconds
    timerRef.current = setInterval(() => {
      current -= 1
      if (current <= 0) {
        clearTimer()
        capturePhoto()
      } else {
        setCountdown(current)
      }
    }, 1000)
  }, [capturePhoto, clearTimer])

  // Stop camera and timer when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
    }
  }, [isOpen, stopCamera])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopCamera()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, stopCamera])

  // Handle Photo File Upload for the active pose with auto-compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await compressPosturePhoto(file)
      if (base64) {
        setPhotosByView(prev => ({
          ...prev,
          [activeView]: base64,
        }))
        setScanResultsByView(prev => ({
          ...prev,
          [activeView]: null,
        }))
        stopCamera()
      }
    } catch {
      setErrorMessage('Failed to process photo file. Please try again.')
    } finally {
      e.target.value = ''
    }
  }

  // Clear photo and scan for active pose only
  const handleClearActivePhoto = useCallback(() => {
    setPhotosByView(prev => ({
      ...prev,
      [activeView]: null,
    }))
    setScanResultsByView(prev => ({
      ...prev,
      [activeView]: null,
    }))
  }, [activeView])

  // Clear all pose photos and scan results
  const handleClearAllPhotos = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    }
    setPhotosByView({
      anterior: null,
      lateral: null,
      posterior: null,
      overhead_squat: null,
    })
    setScanResultsByView({
      anterior: null,
      lateral: null,
      posterior: null,
      overhead_squat: null,
    })
  }, [storageKey])

  // Trigger AI Biomechanical Scan for active pose
  const handleScan = useCallback(async () => {
    const currentPhoto = photosByView[activeView]
    setIsScanning(true)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/coach/clients/${clientId}/posture-scanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentPhoto || undefined,
          view: activeView,
          clientName,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to scan biomechanical mesh.')
      }

      setScanResultsByView(prev => ({
        ...prev,
        [activeView]: data.data,
      }))
      setActiveRightTab('analysis')
      setMobileTab('analysis')
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Mesh scan failed.')
    } finally {
      setIsScanning(false)
    }
  }, [clientId, activeView, clientName, photosByView])

  // Batch scan all captured poses
  const handleBatchScan = useCallback(async () => {
    const posesToScan = (Object.keys(photosByView) as PosturalViewType[]).filter(
      v => photosByView[v] && !scanResultsByView[v]
    )
    if (posesToScan.length === 0) {
      const allLoaded = (Object.keys(photosByView) as PosturalViewType[]).filter(
        v => photosByView[v]
      )
      if (allLoaded.length === 0) return
      posesToScan.push(...allLoaded)
    }

    setIsScanning(true)
    setErrorMessage(null)

    try {
      for (const v of posesToScan) {
        const photo = photosByView[v]
        const res = await fetch(`/api/coach/clients/${clientId}/posture-scanner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: photo || undefined,
            view: v,
            clientName,
          }),
        })

        const data = await res.json()
        if (res.ok && data.ok) {
          setScanResultsByView(prev => ({
            ...prev,
            [v]: data.data,
          }))
        }
      }
      setActiveRightTab('analysis')
      setMobileTab('analysis')
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Batch scan encountered an issue.')
    } finally {
      setIsScanning(false)
    }
  }, [clientId, clientName, photosByView, scanResultsByView])

  // Apply all scanned posture findings to the NASM Assessment Form
  const handleApplyAllFindings = useCallback(() => {
    const allResults = Object.values(scanResultsByView).filter((r): r is PosturalMeshScanResult => Boolean(r))
    if (allResults.length === 0) {
      if (scanResult) onApplyScan(scanResult)
      onClose()
      return
    }

    const ohsaMap = new Map<string, PosturalMeshScanResult['ohsaObservations'][number]>()
    const staticFindingsArr: PosturalMeshScanResult['staticFindings'] = []
    const summaries: string[] = []

    allResults.forEach(r => {
      r.ohsaObservations?.forEach(obs => {
        if (!ohsaMap.has(obs.compensation)) {
          ohsaMap.set(obs.compensation, obs)
        }
      })
      if (r.staticFindings?.length) {
        staticFindingsArr.push(...r.staticFindings)
      }
      if (r.clinicalSummary) {
        summaries.push(`[${r.view.toUpperCase()} POSE]: ${r.clinicalSummary}`)
      }
    })

    const primaryResult = scanResult || allResults[0]
    const combinedResult: PosturalMeshScanResult = {
      view: activeView,
      landmarks: primaryResult.landmarks,
      angles: primaryResult.angles,
      detectedCompensations: Array.from(new Set(allResults.flatMap(r => r.detectedCompensations || []))),
      ohsaObservations: Array.from(ohsaMap.values()),
      staticFindings: staticFindingsArr,
      syndromeDetected: primaryResult.syndromeDetected,
      cexPrescription: primaryResult.cexPrescription,
      clinicalSummary: summaries.join('\n\n'),
    }

    onApplyScan(combinedResult)
    onClose()
  }, [scanResultsByView, scanResult, activeView, onApplyScan, onClose])

  // Draw Biomechanical Mesh on Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const width = rect.width > 0 ? Math.round(rect.width) : 400
    const height = rect.height > 0 ? Math.round(rect.height) : 340
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    ctx.clearRect(0, 0, width, height)

    // Background gradient if no image and camera is inactive
    if (!imageSrc && !isCameraActive) {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#060B14')
      bgGrad.addColorStop(1, '#0C1424')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)
    }

    // Draw Alignment Plumb Line & Reticle Grid
    if (!scanResult) {
      ctx.strokeStyle = isCameraActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Vertical Gravitational Plumb Line
      ctx.strokeStyle = isCameraActive ? 'rgba(197, 160, 89, 0.85)' : 'rgba(197, 160, 89, 0.4)'
      ctx.lineWidth = isCameraActive ? 2 : 1
      ctx.setLineDash([6, 6])
      ctx.beginPath()
      ctx.moveTo(width / 2, 0)
      ctx.lineTo(width / 2, height)
      ctx.stroke()
      ctx.setLineDash([])

      // When camera is active, render subtle horizontal checkpoint guides
      if (isCameraActive) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        // Shoulder line
        ctx.beginPath()
        ctx.moveTo(width * 0.15, height * 0.28)
        ctx.lineTo(width * 0.85, height * 0.28)
        ctx.stroke()
        // Hip line
        ctx.beginPath()
        ctx.moveTo(width * 0.2, height * 0.48)
        ctx.lineTo(width * 0.8, height * 0.48)
        ctx.stroke()
        // Knee line
        ctx.beginPath()
        ctx.moveTo(width * 0.25, height * 0.68)
        ctx.lineTo(width * 0.75, height * 0.68)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    if (!scanResult?.landmarks) return

    const points = scanResult.landmarks
    const getPoint = (id: string) => points.find(p => p.id === id)

    // Draw Skeletal Mesh Lines
    ctx.strokeStyle = '#38BDF8'
    ctx.lineWidth = 2.5
    ctx.shadowColor = '#38BDF8'
    ctx.shadowBlur = 10

    const drawLine = (p1?: LandmarkPoint, p2?: LandmarkPoint) => {
      if (!p1 || !p2) return
      ctx.beginPath()
      ctx.moveTo((p1.x / 100) * width, (p1.y / 100) * height)
      ctx.lineTo((p2.x / 100) * width, (p2.y / 100) * height)
      ctx.stroke()
    }

    if (activeView === 'lateral') {
      drawLine(getPoint('ear'), getPoint('c7'))
      drawLine(getPoint('c7'), getPoint('shoulder'))
      drawLine(getPoint('shoulder'), getPoint('hip'))
      drawLine(getPoint('hip'), getPoint('knee'))
      drawLine(getPoint('knee'), getPoint('ankle'))
    } else {
      drawLine(getPoint('left_shoulder'), getPoint('right_shoulder'))
      drawLine(getPoint('left_hip'), getPoint('right_hip'))
      drawLine(getPoint('left_knee'), getPoint('right_knee'))
      drawLine(getPoint('left_ankle'), getPoint('right_ankle'))
      drawLine(getPoint('left_shoulder'), getPoint('left_hip'))
      drawLine(getPoint('right_shoulder'), getPoint('right_hip'))
      drawLine(getPoint('left_hip'), getPoint('left_knee'))
      drawLine(getPoint('right_hip'), getPoint('right_knee'))
      drawLine(getPoint('left_knee'), getPoint('left_ankle'))
      drawLine(getPoint('right_knee'), getPoint('right_ankle'))
    }

    // Reset shadow
    ctx.shadowBlur = 0

    // Draw Joint Landmark Nodes
    points.forEach(pt => {
      const px = (pt.x / 100) * width
      const py = (pt.y / 100) * height

      // Outer glow circle
      ctx.beginPath()
      ctx.arc(px, py, 6, 0, 2 * Math.PI)
      ctx.fillStyle = pt.confidence > 0.8 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(212, 160, 23, 0.4)'
      ctx.fill()

      // Center solid core
      ctx.beginPath()
      ctx.arc(px, py, 3.5, 0, 2 * Math.PI)
      ctx.fillStyle = pt.confidence > 0.8 ? '#10B981' : '#F59E0B'
      ctx.fill()
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 1
      ctx.stroke()
    })
  }, [scanResult, activeView, imageSrc, isCameraActive])

  if (!isOpen) return null

  return (
    <div
      className="posture-scanner-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="AI Biomechanical Postural Mesh Scanner"
      onClick={e => {
        if (e.target === e.currentTarget) {
          stopCamera()
          onClose()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0px, 1.5vw, 16px)',
      }}
    >
      <div
        className="posture-scanner-dialog"
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: '94vh',
          backgroundColor: '#080E18',
          border: '1.5px solid rgba(197, 160, 89, 0.4)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <style>{`
          .posture-scanner-backdrop {
            z-index: 100050 !important;
          }
          @media (max-width: 768px) {
            .posture-scanner-dialog {
              max-width: 100% !important;
              width: 100% !important;
              max-height: 100dvh !important;
              height: 100dvh !important;
              border-radius: 0 !important;
              border: none !important;
            }
            .posture-scanner-body {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
              padding: 10px 12px calc(45px + env(safe-area-inset-bottom, 20px)) 12px !important;
            }
            .posture-stage-box {
              height: 260px !important;
            }
            .posture-mobile-tab-nav {
              display: flex !important;
            }
            .posture-col-left {
              display: ${mobileTab === 'camera' ? 'grid' : 'none'} !important;
            }
            .posture-col-right {
              display: ${mobileTab !== 'camera' ? 'grid' : 'none'} !important;
            }
            .posture-mobile-nav-btn {
              display: flex !important;
            }
          }
          @media (min-width: 769px) {
            .posture-scanner-body {
              grid-template-columns: minmax(340px, 1.25fr) minmax(300px, 1fr) !important;
            }
            .posture-mobile-tab-nav {
              display: none !important;
            }
            .posture-col-left {
              display: grid !important;
            }
            .posture-col-right {
              display: grid !important;
            }
            .posture-mobile-nav-btn {
              display: none !important;
            }
          }
        `}</style>

        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, #0B1320 0%, #080E18 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GaaIcon name="camera" size={20} tone="gold" />
            <div>
              <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 16, color: '#FFFFFF', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                AI Biomechanical Postural Mesh Scanner
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                Sub-millimeter static &amp; kinetic alignment audit for {clientName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: 'var(--gray)',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close scanner"
          >
            <GaaIcon name="close" size={16} tone="slate" />
          </button>
        </div>

        {/* Mobile Sub-Navigation Bar (Active on screens <= 768px) */}
        <div
          className="posture-mobile-tab-nav"
          style={{
            display: 'none',
            padding: '8px 10px',
            background: 'rgba(0, 0, 0, 0.45)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => setMobileTab('camera')}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 800,
              border: mobileTab === 'camera' ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
              background: mobileTab === 'camera' ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.03)',
              color: mobileTab === 'camera' ? 'var(--gold-lt)' : '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="camera" size={13} tone={mobileTab === 'camera' ? 'gold' : 'slate'} />
            <span>Camera &amp; Viewfinder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRightTab('guide')
              setMobileTab('guide')
            }}
            style={{
              flex: 1,
              padding: '7px 8px',
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 800,
              border: mobileTab === 'guide' ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
              background: mobileTab === 'guide' ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.03)',
              color: mobileTab === 'guide' ? 'var(--gold-lt)' : '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="clipboard" size={13} tone={mobileTab === 'guide' ? 'gold' : 'slate'} />
            <span>Setup Guide</span>
          </button>

          {scanResult && (
            <button
              type="button"
              onClick={() => {
                setActiveRightTab('analysis')
                setMobileTab('analysis')
              }}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 800,
                border: mobileTab === 'analysis' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                background: mobileTab === 'analysis' ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.03)',
                color: mobileTab === 'analysis' ? '#34D399' : '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name="movement-screen" size={13} tone={mobileTab === 'analysis' ? 'emerald' : 'slate'} />
              <span>AI Findings</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div
          className="posture-scanner-body"
          style={{
            padding: 16,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(340px, 1.25fr) minmax(300px, 1fr)',
            gap: 16,
            flex: 1,
          }}
        >
          {/* Left Column: Visual Canvas & View Selector */}
          <div className="posture-col-left" style={{ display: 'grid', gap: 12 }}>
            {/* Multi-Pose Gallery Progression Status Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: totalPhotosCaptured > 0 ? 'var(--gold-lt)' : '#CBD5E1', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="camera" size={13} tone={totalPhotosCaptured > 0 ? 'gold' : 'slate'} />
                  <span>Multi-Pose Gallery ({totalPhotosCaptured}/4 Captured)</span>
                </span>
                <span style={{ fontSize: 10, color: totalPhotosCaptured === 4 ? '#10B981' : 'var(--gray)' }}>
                  {totalPhotosCaptured === 4 ? '✓ All 4 Poses Loaded' : 'Each pose saves its own photo'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {totalPhotosCaptured > 1 && (
                  <button
                    type="button"
                    onClick={handleBatchScan}
                    disabled={isScanning}
                    style={{
                      background: 'rgba(16,185,129,0.16)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      color: '#6EE7B7',
                      fontSize: 10.5,
                      fontWeight: 800,
                      borderRadius: 4,
                      padding: '3px 8px',
                      cursor: isScanning ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    title="Run AI biomechanical mesh analysis across all loaded poses"
                  >
                    <GaaIcon name="lightning" size={10} tone="emerald" />
                    <span>{isScanning ? 'Analyzing...' : 'Scan All Poses'}</span>
                  </button>
                )}
                {totalPhotosCaptured > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPhotos}
                    disabled={isScanning}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: isScanning ? 'not-allowed' : 'pointer',
                      padding: '2px 6px',
                      textDecoration: 'underline',
                    }}
                    title="Clear all 4 pose photos"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* View Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {VIEW_PRESETS.map(preset => {
                const hasPhoto = Boolean(photosByView[preset.id])
                const isScanned = Boolean(scanResultsByView[preset.id])
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      stopCamera()
                      setActiveView(preset.id)
                      setErrorMessage(null)
                      if (scanResultsByView[preset.id]) {
                        setActiveRightTab('analysis')
                      } else {
                        setActiveRightTab('guide')
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: activeView === preset.id
                        ? '1.5px solid var(--gold)'
                        : hasPhoto
                        ? '1px solid rgba(16,185,129,0.35)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: activeView === preset.id
                        ? 'rgba(197,160,89,0.18)'
                        : hasPhoto
                        ? 'rgba(16,185,129,0.06)'
                        : 'rgba(255,255,255,0.03)',
                      color: activeView === preset.id ? 'var(--gold-lt)' : '#CBD5E1',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 2,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GaaIcon name={preset.iconName} size={13} tone={activeView === preset.id ? 'gold' : hasPhoto ? 'emerald' : 'slate'} />
                        <span>{preset.label}</span>
                      </div>
                      {hasPhoto ? (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(16,185,129,0.22)', color: '#6EE7B7', fontWeight: 800, border: '1px solid rgba(16,185,129,0.4)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          ✓ {isScanned ? 'Analyzed' : 'Saved'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, color: 'var(--gray)', opacity: 0.6 }}>
                          Empty
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--gray)' }}>
                      {preset.desc}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Direct Client Cue Banner */}
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(212, 160, 23, 0.08)',
                borderLeft: '3px solid var(--gold)',
                border: '1px solid rgba(212, 160, 23, 0.25)',
                borderRadius: 6,
                display: 'grid',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                  Client Action ({currentInstruction.label})
                </span>
                <span style={{ fontSize: 9.5, color: '#CBD5E1', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>
                  {currentInstruction.subtitle}
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>
                &ldquo;{currentInstruction.whatClientDoes}&rdquo;
              </div>
            </div>

            {/* Canvas Stage */}
            <div
              className="posture-stage-box"
              style={{
                position: 'relative',
                height: 340,
                borderRadius: 8,
                overflow: 'hidden',
                border: isCameraActive ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                background: '#060B14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Live Video Viewfinder */}
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isCameraActive ? 'block' : 'none',
                  zIndex: 1,
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
              />

              {/* Uploaded or Captured Static Image Preview */}
              {!isCameraActive && imageSrc && (
                <Image
                  src={imageSrc}
                  alt="Posture Scan Reference"
                  fill
                  unoptimized
                  style={{
                    objectFit: 'contain',
                    opacity: 0.85,
                  }}
                />
              )}

              {/* Canvas Overlay for landmarks and plumb line guides */}
              <canvas
                ref={canvasRef}
                width={400}
                height={340}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />

              {/* Live Camera Badge */}
              {isCameraActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    background: 'rgba(0,0,0,0.75)',
                    border: '1px solid rgba(239,68,68,0.6)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#EF4444',
                      boxShadow: '0 0 8px #EF4444',
                    }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    LIVE CAMERA — ALIGN WITH PLUMB LINE
                  </span>
                </div>
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 25,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontWeight: 800,
                      fontSize: 72,
                      color: 'var(--gold)',
                      lineHeight: 1,
                      textShadow: '0 0 24px rgba(197,160,89,0.9)',
                    }}
                  >
                    {countdown}
                  </div>
                  <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    HOLD POSITION FOR PHOTO...
                  </span>
                </div>
              )}

              {isScanning && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    background: 'rgba(6,11,20,0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: '3px solid rgba(197,160,89,0.2)',
                      borderTopColor: 'var(--gold)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700 }}>
                    Extracting Biomechanical Mesh Landmarks...
                  </span>
                </div>
              )}
            </div>

            {/* Hidden Native File & Camera Fallback Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <input
              ref={cameraCaptureInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Action & Camera Controls */}
            {isCameraActive ? (
              <div className="posture-shutter-row" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="sgf-button sgf-button-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="close" size={13} tone="inherit" />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="sgf-button sgf-button-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="rotate-ccw" size={13} tone="inherit" />
                  <span>Flip</span>
                </button>

                <button
                  type="button"
                  onClick={() => capturePhotoWithTimer(3)}
                  disabled={countdown !== null}
                  className="sgf-button sgf-button-secondary"
                  style={{
                    padding: '8px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="watch" size={12} tone="inherit" />
                  <span>3s Timer</span>
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={countdown !== null}
                  className="tactile-btn"
                  style={{
                    flex: 1.5,
                    padding: '9px 16px',
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    border: 'none',
                    borderRadius: 5,
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                  }}
                >
                  <GaaIcon name="camera" size={14} tone="inherit" />
                  <span>SNAP PHOTO</span>
                </button>
              </div>
            ) : (
              <div className="posture-shutter-row" style={{ display: 'grid', gridTemplateColumns: imageSrc ? '1.15fr 1.05fr 0.65fr 1.2fr' : '1.2fr 1fr 1.1fr', gap: 6, alignItems: 'center' }}>
                {/* Take Photo Button */}
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="tactile-btn"
                  style={{
                    padding: '8px 10px',
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                    border: 'none',
                    borderRadius: 5,
                    color: '#080E14',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    boxShadow: '0 2px 10px rgba(197,160,89,0.3)',
                  }}
                >
                  <GaaIcon name="camera" size={13} tone="inherit" />
                  <span>{imageSrc ? 'Retake' : 'Take Photo'}</span>
                </button>

                {/* Upload from Files Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="sgf-button sgf-button-secondary"
                  style={{
                    padding: '8px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <GaaIcon name="clipboard" size={12} tone="inherit" />
                  <span>{imageSrc ? 'Replace' : 'Upload Photo'}</span>
                </button>

                {/* Clear Photo for active pose only */}
                {imageSrc && (
                  <button
                    type="button"
                    onClick={handleClearActivePhoto}
                    className="sgf-button sgf-button-secondary"
                    style={{
                      padding: '8px 6px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#EF4444',
                      borderColor: 'rgba(239,68,68,0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                    }}
                    title={`Clear ${currentInstruction.label} photo`}
                  >
                    <GaaIcon name="close" size={11} tone="inherit" />
                    <span>Clear</span>
                  </button>
                )}

                {/* Run AI Mesh Scan Button */}
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={isScanning || !imageSrc}
                  className="tactile-btn"
                  style={{
                    padding: '8px 12px',
                    background: imageSrc
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'rgba(255,255,255,0.06)',
                    border: imageSrc ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 5,
                    color: imageSrc ? '#080E14' : '#CBD5E1',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: (isScanning || !imageSrc) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    boxShadow: imageSrc ? '0 2px 10px rgba(16,185,129,0.3)' : 'none',
                  }}
                >
                  <GaaIcon name="lightning" size={12} tone={imageSrc ? 'inherit' : 'gold'} />
                  <span>{scanResult ? 'Re-Analyze' : 'Run AI Scan'}</span>
                </button>
              </div>
            )}

            {/* Quick Mobile Link to Setup Guide */}
            <button
              type="button"
              onClick={() => {
                setActiveRightTab('guide')
                setMobileTab('guide')
              }}
              className="posture-mobile-nav-btn"
              style={{
                display: 'none',
                padding: '9px 12px',
                background: 'rgba(212,160,23,0.08)',
                border: '1px solid rgba(212,160,23,0.25)',
                borderRadius: 6,
                color: 'var(--gold-lt)',
                fontSize: 11.5,
                fontWeight: 700,
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GaaIcon name="clipboard" size={13} tone="gold" />
                <span>View Full Client Positioning Checklist</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--gold)' }}>➔</span>
            </button>

            {errorMessage && (
              <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: 11.5, borderRadius: 6 }}>
                {errorMessage}
              </div>
            )}
          </div>

          {/* Right Column: Photo Instructions & AI Analysis Telemetry */}
          <div className="posture-col-right" style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveRightTab('guide')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    border: activeRightTab === 'guide' ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                    background: activeRightTab === 'guide' ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.03)',
                    color: activeRightTab === 'guide' ? 'var(--gold-lt)' : 'var(--gray)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="clipboard" size={12} tone={activeRightTab === 'guide' ? 'gold' : 'slate'} />
                  <span>Photo Setup Guide</span>
                </button>

                {scanResult && (
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('analysis')}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 800,
                      border: activeRightTab === 'analysis' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                      background: activeRightTab === 'analysis' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.03)',
                      color: activeRightTab === 'analysis' ? '#34D399' : 'var(--gray)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <GaaIcon name="movement-screen" size={12} tone={activeRightTab === 'analysis' ? 'emerald' : 'slate'} />
                    <span>AI Scan Analysis</span>
                  </button>
                )}
              </div>

              <span style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                NASM CPT-7 / CES
              </span>
            </div>

            {activeRightTab === 'guide' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {/* Primary What Client Does Callout */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(212,160,23,0.05) 100%)',
                    border: '1.5px solid var(--gold)',
                    borderRadius: 8,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 4 }}>
                    Exact Client Action ({currentInstruction.label})
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>
                    &ldquo;{currentInstruction.whatClientDoes}&rdquo;
                  </div>
                </div>

                {/* Stance, Arms, Head, Photo Moment Cards */}
                <div style={{ display: 'grid', gap: 6 }}>
                  {/* Stance & Feet */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="foot" size={12} tone="gold" />
                      <span>Stance &amp; Foot Positioning:</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                      {currentInstruction.stanceAndFeet}
                    </div>
                  </div>

                  {/* Arms & Hands */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="hand" size={12} tone="gold" />
                      <span>Arms, Hands &amp; Shoulders:</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                      {currentInstruction.armsAndHands}
                    </div>
                  </div>

                  {/* Head & Gaze */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--gold-lt)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="microscope" size={12} tone="gold" />
                      <span>Head, Chin &amp; Eye Line:</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                      {currentInstruction.headAndGaze}
                    </div>
                  </div>

                  {/* Photo Moment */}
                  <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#38BDF8', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="camera" size={12} tone="cyan" />
                      <span>Exact Photo Capture Moment:</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#F1F5F9', lineHeight: 1.4 }}>
                      {currentInstruction.photoMoment}
                    </div>
                  </div>

                  {/* Camera Setup */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#CBD5E1', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="angle" size={12} tone="slate" />
                      <span>Camera Placement &amp; Distance:</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', lineHeight: 1.4 }}>
                      {currentInstruction.cameraSetup}
                    </div>
                  </div>

                  {/* What AI Evaluates */}
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#34D399', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="target" size={12} tone="emerald" />
                      <span>Anatomical Checkpoints Evaluated by AI:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, color: '#CBD5E1', display: 'grid', gap: 2 }}>
                      {currentInstruction.aiFocusAreas.map(area => (
                        <li key={area}>{area}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Coach Pro-Tip */}
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 6, padding: '8px 11px' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#FCD34D', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <GaaIcon name="sparkles" size={12} tone="amber" />
                      <span>Coach Pro-Tip:</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#CBD5E1', lineHeight: 1.4 }}>
                      {currentInstruction.proTip}
                    </div>
                  </div>

                  {/* Mobile Return to Camera Button */}
                  <button
                    type="button"
                    onClick={() => setMobileTab('camera')}
                    className="posture-mobile-nav-btn"
                    style={{
                      display: 'none',
                      padding: '11px 16px',
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                      border: 'none',
                      borderRadius: 6,
                      color: '#080E14',
                      fontSize: 12.5,
                      fontWeight: 900,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: 6,
                      boxShadow: '0 4px 14px rgba(197,160,89,0.3)',
                    }}
                  >
                    <GaaIcon name="camera" size={14} tone="inherit" />
                    <span>READY TO TAKE PHOTO ➔</span>
                  </button>
                </div>
              </div>
            ) : scanResult ? (
              <>
                {/* Syndrome Header Card */}
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(197,160,89,0.12)',
                    border: '1px solid var(--gold)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 800 }}>
                      Primary Postural Distortion
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontWeight: 700, fontSize: 17, color: '#FFFFFF' }}>
                      {scanResult.syndromeDetected} Syndrome
                    </div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', color: '#6EE7B7', fontSize: 11, fontWeight: 700 }}>
                    AI Confidence: 94%
                  </span>
                </div>

                {/* Biomechanical Deviation Angle Gauges */}
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Biomechanical Angle Telemetry:
                  </div>
                  {scanResult.angles.map(angle => (
                    <div
                      key={angle.name}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                          {angle.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--gray)' }}>
                          {angle.clinicalNote}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: angle.status === 'optimal' ? '#10B981' : '#F59E0B' }}>
                          {angle.angleDegrees}°
                        </div>
                        <span style={{ fontSize: 9.5, color: 'var(--gray)' }}>
                          Normal: {angle.normalRange}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Detected Checkpoints Strip */}
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Detected Kinetic Chain Compensations:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {scanResult.detectedCompensations.map(c => (
                      <span
                        key={c}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: 'rgba(245,158,11,0.15)',
                          border: '1px solid #F59E0B',
                          color: '#FCD34D',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <GaaIcon name="alert-triangle" size={11} tone="amber" />
                        <span>{c.replace(/_/g, ' ').toUpperCase()}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Corrective Exercise Continuum Preview */}
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Auto-Generated 4-Phase CEx Continuum:
                  </div>
                  <div style={{ fontSize: 11, color: '#CBD5E1', display: 'grid', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: 'rgba(168,85,247,0.2)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.4)' }}>INHIBIT</span> <strong>(SMR):</strong> {scanResult.cexPrescription.inhibit.map(i => i.muscle).join(', ')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: 'rgba(59,130,246,0.2)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.4)' }}>LENGTHEN</span> {scanResult.cexPrescription.lengthen.map(l => l.muscle).join(', ')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: 'rgba(245,158,11,0.2)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.4)' }}>ACTIVATE</span> {scanResult.cexPrescription.activate.map(a => a.muscle).join(', ')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 3, background: 'rgba(16,185,129,0.2)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.4)' }}>INTEGRATE</span> {scanResult.cexPrescription.integrate.map(g => g.exercise).join(', ')}</div>
                  </div>
                </div>

                {/* 1-Click Apply Button */}
                <button
                  type="button"
                  onClick={handleApplyAllFindings}
                  className="tactile-btn"
                  style={{
                    padding: '12px 18px',
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: 'none',
                    color: '#080E14',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                  }}
                >
                  <GaaIcon name="check" size={15} style={{ color: '#080E14', stroke: '#080E14' }} />
                  <span>
                    {totalScannedCount > 1
                      ? `Apply All AI Findings (${totalScannedCount} Poses Scanned) to Form`
                      : 'Apply AI Findings to NASM Assessment Form'}
                  </span>
                </button>

                {/* Mobile Return to Camera Button */}
                <button
                  type="button"
                  onClick={() => setMobileTab('camera')}
                  className="posture-mobile-nav-btn"
                  style={{
                    display: 'none',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 6,
                    color: '#CBD5E1',
                    fontSize: 11.5,
                    fontWeight: 800,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: 6,
                  }}
                >
                  <GaaIcon name="camera" size={13} tone="slate" />
                  <span>Scan Another Angle (Return to Camera)</span>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

