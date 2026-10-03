'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import {
  BodyCompositionScanResult,
  ScanViewType,
} from '@/lib/ai-body-composition-engine'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'

// Client-side image normalizer and compressor (max 1280px, clean image/jpeg)
async function processAndCompressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => {
      resolve('')
    }
    reader.onload = () => {
      const img = document.createElement('img')
      img.onerror = () => {
        resolve(reader.result as string)
      }
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
            resolve(reader.result as string)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL('image/jpeg', 0.85)
          resolve(compressed)
        } catch {
          resolve(reader.result as string)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

interface AiBodyCompositionScannerModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string
  clientName?: string
  initialSex?: 'male' | 'female' | 'other'
  initialHeightCm?: number
  initialWeightKg?: number
  initialAge?: number
  initialWaistCm?: number
  initialNeckCm?: number
  initialHipCm?: number
  onApplyScan?: (scanResult: BodyCompositionScanResult) => void
  isCoachView?: boolean
  initialPhotoFront?: string | null
  initialPhotoSide?: string | null
  initialPhotoBack?: string | null
}

export default function AiBodyCompositionScannerModal({
  isOpen,
  onClose,
  clientId,
  clientName = 'Athlete',
  initialSex = 'male',
  initialHeightCm = 178,
  initialWeightKg = 80,
  initialAge = 32,
  initialWaistCm,
  initialNeckCm,
  initialHipCm,
  onApplyScan,
  isCoachView = false,
  initialPhotoFront,
  initialPhotoSide,
  initialPhotoBack,
}: AiBodyCompositionScannerModalProps) {
  // Biometric state
  const [sex, setSex] = useState<'male' | 'female' | 'other'>(initialSex)
  const [heightCm, setHeightCm] = useState<string>(initialHeightCm ? String(initialHeightCm) : '178')
  const [weightKg, setWeightKg] = useState<string>(initialWeightKg ? String(initialWeightKg) : '80')
  const [age, setAge] = useState<string>(initialAge ? String(initialAge) : '32')
  const [waistCm, setWaistCm] = useState<string>(initialWaistCm ? String(initialWaistCm) : '')
  const [neckCm, setNeckCm] = useState<string>(initialNeckCm ? String(initialNeckCm) : '')
  const [hipCm, setHipCm] = useState<string>(initialHipCm ? String(initialHipCm) : '')

  // Unit display
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial')

  // Multi-view image state
  const [activeTab, setActiveTab] = useState<ScanViewType>('anterior')
  const [anteriorPhoto, setAnteriorPhoto] = useState<string | null>(null)
  const [lateralPhoto, setLateralPhoto] = useState<string | null>(null)
  const [posteriorPhoto, setPosteriorPhoto] = useState<string | null>(null)

  // Scanner state
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanResult, setScanResult] = useState<BodyCompositionScanResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [targetBfSlider, setTargetBfSlider] = useState<number>(12)
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [showCircumferenceInputs, setShowCircumferenceInputs] = useState<boolean>(false)

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Sync initial props
  useEffect(() => {
    if (initialSex) setSex(initialSex)
    if (initialHeightCm) setHeightCm(String(initialHeightCm))
    if (initialWeightKg) setWeightKg(String(initialWeightKg))
    if (initialAge) setAge(String(initialAge))
  }, [initialSex, initialHeightCm, initialWeightKg, initialAge])

  // Sync initial captured photos from live studio session or safe session storage
  useEffect(() => {
    if (isOpen) {
      if (initialPhotoFront) {
        setAnteriorPhoto(initialPhotoFront)
      }
      if (initialPhotoSide) {
        setLateralPhoto(initialPhotoSide)
      }
      if (initialPhotoBack) {
        setPosteriorPhoto(initialPhotoBack)
      }

      // Fallback to session storage if props are not passed
      if (!initialPhotoFront && !initialPhotoSide && !initialPhotoBack && typeof window !== 'undefined' && clientId) {
        try {
          const stored = sessionStorage.getItem(`gaa_body_comp_photos_${clientId}`) || sessionStorage.getItem(`gaa_assessment_frames_${clientId}`)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (parsed.anterior) setAnteriorPhoto(parsed.anterior)
            if (parsed.lateral) setLateralPhoto(parsed.lateral)
            if (parsed.posterior) setPosteriorPhoto(parsed.posterior)
          }
        } catch {
          // quota fallback
        }
      }
    }
  }, [initialPhotoFront, initialPhotoSide, initialPhotoBack, isOpen, clientId])

  // Stop camera when closing
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      stopCamera()
    }
  }, [isOpen, stopCamera])

  // Start live webcam capture
  const startCamera = async () => {
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraActive(true)
    } catch {
      setErrorMessage('Could not access camera. Please check permissions or upload a photo.')
    }
  }

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.9)

    if (activeTab === 'anterior') setAnteriorPhoto(base64)
    else if (activeTab === 'lateral') setLateralPhoto(base64)
    else if (activeTab === 'posterior') setPosteriorPhoto(base64)

    stopCamera()
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await processAndCompressImageFile(file)
      if (base64) {
        if (activeTab === 'anterior') setAnteriorPhoto(base64)
        else if (activeTab === 'lateral') setLateralPhoto(base64)
        else if (activeTab === 'posterior') setPosteriorPhoto(base64)
      }
    } catch {
      setErrorMessage('Could not process image file. Please try another photo.')
    }
  }

  // Trigger Deep Scan
  const handleScan = async () => {
    setIsScanning(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const endpoint = isCoachView && clientId
        ? `/api/coach/clients/${clientId}/body-composition`
        : '/api/fitness/bodyfat'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sex,
          heightCm: parseNumericInput(heightCm, 178),
          weightKg: parseNumericInput(weightKg, 80),
          age: parseNumericInput(age, 32),
          waistCm: waistCm ? parseNumericInput(waistCm, 0) : undefined,
          neckCm: neckCm ? parseNumericInput(neckCm, 0) : undefined,
          hipCm: hipCm ? parseNumericInput(hipCm, 0) : undefined,
          anteriorPhotoBase64: anteriorPhoto || undefined,
          lateralPhotoBase64: lateralPhoto || undefined,
          posteriorPhotoBase64: posteriorPhoto || undefined,
          photoDataUrl: anteriorPhoto || undefined,
          clientName,
          targetBodyFatPercent: targetBfSlider,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze body composition.')
      }

      const result: BodyCompositionScanResult = data.scanResult || data.data || data.analysis?.scan_result
      setScanResult(result)
      if (result?.recompositionProjection?.targetBodyFatPercent) {
        setTargetBfSlider(result.recompositionProjection.targetBodyFatPercent)
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Biomechanical DEXA scan failed.')
    } finally {
      setIsScanning(false)
    }
  }

  // Apply & Save Scan
  const handleApply = () => {
    if (!scanResult) return
    onApplyScan?.(scanResult)
    setSaveSuccess(true)
    setTimeout(() => {
      onClose()
    }, 1200)
  }

  if (!isOpen) return null

  const currentDisplayPhoto =
    activeTab === 'anterior'
      ? anteriorPhoto
      : activeTab === 'lateral'
      ? lateralPhoto
      : posteriorPhoto

  const totalPhotosCount = [anteriorPhoto, lateralPhoto, posteriorPhoto].filter(Boolean).length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8px, 2vw, 24px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0D1B2A 0%, #060B14 100%)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 1140,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 50px rgba(56, 189, 248, 0.12)',
          overflow: 'hidden',
          color: '#FFFFFF',
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.4)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: 'rgba(212, 160, 23, 0.12)',
                border: '1px solid rgba(212, 160, 23, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GaaIcon name="dna" tone="gold" size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontSize: 22,
                    letterSpacing: '0.04em',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  AI DEXA-Vision Body Composition Estimator
                </h2>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #D4A017 0%, #F59E0B 100%)',
                    color: '#080E14',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 10,
                    letterSpacing: '0.06em',
                  }}
                >
                  4C GOLD STANDARD
                </span>
              </div>
              <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: 12 }}>
                Spatial Multi-View Anthropometry · 7-Zone Computer Vision · Cunningham LBM Engine
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Metric/Imperial Switcher */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setUnits('imperial')}
                style={{
                  background: units === 'imperial' ? '#D4A017' : 'transparent',
                  color: units === 'imperial' ? '#080E14' : '#94A3B8',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                LBS / IN
              </button>
              <button
                type="button"
                onClick={() => setUnits('metric')}
                style={{
                  background: units === 'metric' ? '#D4A017' : 'transparent',
                  color: units === 'metric' ? '#080E14' : '#94A3B8',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                KG / CM
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Close modal"
            >
              <GaaIcon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* ── MODAL CONTENT GRID ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
            gap: 20,
            padding: 20,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* ── LEFT COLUMN: VIEWFINDER STAGE & BIOMETRIC CONTROLS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* View Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                background: 'rgba(0,0,0,0.4)',
                padding: 4,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {[
                { id: 'anterior' as const, label: 'Front View', icon: 'user' as GaaIconName, hasPhoto: Boolean(anteriorPhoto) },
                { id: 'lateral' as const, label: 'Profile / Side', icon: 'grid' as GaaIconName, hasPhoto: Boolean(lateralPhoto) },
                { id: 'posterior' as const, label: 'Rear / Back', icon: 'rotate-ccw' as GaaIconName, hasPhoto: Boolean(posteriorPhoto) },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    stopCamera()
                    setActiveTab(tab.id)
                  }}
                  style={{
                    background: activeTab === tab.id
                      ? 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.08) 100%)'
                      : 'transparent',
                    border: activeTab === tab.id ? '1px solid #D4A017' : '1px solid transparent',
                    borderRadius: 6,
                    padding: '8px 6px',
                    color: activeTab === tab.id ? '#D4A017' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name={tab.icon} tone={activeTab === tab.id ? 'gold' : 'slate'} size={13} />
                  <span>{tab.label}</span>
                  {tab.hasPhoto && (
                    <span style={{ color: '#10B981', fontSize: 11, fontWeight: 900 }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Viewfinder Display Box */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 320,
                background: 'radial-gradient(ellipse at center, rgba(13, 27, 42, 0.8) 0%, rgba(3, 7, 18, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCameraActive ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={capturePhoto}
                      style={{
                        background: '#D4A017',
                        color: '#080E14',
                        border: 'none',
                        borderRadius: 20,
                        padding: '8px 18px',
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 4px 15px rgba(212,160,23,0.4)',
                      }}
                    >
                      <GaaIcon name="camera" size={14} />
                      Capture Frame
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      style={{
                        background: 'rgba(0,0,0,0.6)',
                        color: '#FFF',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 20,
                        padding: '8px 14px',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : currentDisplayPhoto ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    src={currentDisplayPhoto}
                    alt={`${activeTab} view`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'contain' }}
                  />

                  {/* Scanning Animation Sweep */}
                  {isScanning && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(56,189,248,0.25) 50%, #38BDF8 52%, transparent 54%)',
                        backgroundSize: '100% 200%',
                        animation: 'scanPulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Clear / Retake Button */}
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'anterior') setAnteriorPhoto(null)
                        else if (activeTab === 'lateral') setLateralPhoto(null)
                        else if (activeTab === 'posterior') setPosteriorPhoto(null)
                        setScanResult(null)
                      }}
                      style={{
                        background: 'rgba(0,0,0,0.7)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#FFF',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 10,
                        cursor: 'pointer',
                      }}
                    >
                      Retake
                    </button>
                  </div>

                  {/* Multi-angle indicator tag */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(0,0,0,0.75)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      color: 'var(--gold-lt)',
                    }}
                  >
                    {activeTab === 'anterior' ? 'Frontal Plane' : (activeTab === 'lateral' ? 'Sagittal Profile' : 'Posterior Plane')} · Loaded
                  </div>
                </div>
              ) : (
                /* Empty / Pose Guide */
                <div style={{ textAlign: 'center', padding: 20, maxWidth: 380 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(212, 160, 23, 0.08)',
                      border: '1px solid rgba(212, 160, 23, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}
                  >
                    <GaaIcon name="camera" tone="gold" size={22} />
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, letterSpacing: '0.04em' }}>
                    {activeTab === 'anterior' ? '1. Frontal View Pose' : (activeTab === 'lateral' ? '2. Sagittal Profile Pose' : '3. Posterior View Pose')}
                  </h4>
                  <p style={{ margin: '0 0 10px', color: '#94A3B8', fontSize: 11.5, lineHeight: 1.4 }}>
                    {activeTab === 'anterior'
                      ? 'Stand upright, feet shoulder-width, arms abducted ~15° from torso to isolate waist contour.'
                      : (activeTab === 'lateral'
                      ? 'Turn 90° to the side, natural standing posture to isolate sagittal depth and pelvic tilt.'
                      : 'Back facing camera, arms slightly abducted to expose latissimus & scapular definition.')}
                  </p>
                  <div
                    style={{
                      background: 'rgba(212, 160, 23, 0.08)',
                      border: '1px solid rgba(212, 160, 23, 0.25)',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 10.5,
                      color: 'var(--gold-lt)',
                      marginBottom: 12,
                      lineHeight: 1.35,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GaaIcon name="shirt" size={13} tone="gold" />
                      <span><strong>Attire Guide:</strong> Fitted athletic wear (sports bra/shorts) yields max optical precision (±1.0%). Clothed photos work seamlessly via 3D silhouette modeling.</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={startCamera}
                      style={{
                        background: 'linear-gradient(135deg, #D4A017 0%, #F59E0B 100%)',
                        color: '#080E14',
                        border: 'none',
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <GaaIcon name="camera" size={13} />
                      Live Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: '#FFF',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 6,
                        padding: '7px 12px',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <GaaIcon name="upload" size={13} />
                      Upload Photo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Multi-angle completion status tracker */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                fontSize: 11.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: totalPhotosCount === 3 ? '#10B981' : 'var(--gold-lt)', fontWeight: 700 }}>
                  {totalPhotosCount === 3 ? '✓ 3D Multi-View Ready (±1.0% precision)' : `${totalPhotosCount}/3 Angles Loaded`}
                </span>
              </div>
              <span style={{ color: '#94A3B8', fontSize: 10.5 }}>
                {totalPhotosCount >= 1 ? 'Single-view minimum satisfied' : 'Add at least 1 photo'}
              </span>
            </div>

            {/* Biometrics Form */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              <div>
                <label style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 3, fontWeight: 700 }}>Sex</label>
                <select
                  value={sex}
                  onChange={e => setSex(e.target.value as 'male' | 'female' | 'other')}
                  style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '6px 4px', fontSize: 12 }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 3, fontWeight: 700 }}>
                  Height ({units === 'imperial' ? 'in' : 'cm'})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={units === 'imperial' ? (heightCm ? String(Math.round(Number(heightCm) / 2.54)) : '') : heightCm}
                  onChange={e => {
                    const sanitized = sanitizeNumericInput(e.target.value)
                    if (!sanitized) {
                      setHeightCm('')
                    } else {
                      setHeightCm(units === 'imperial' ? String(Math.round(Number(sanitized) * 2.54)) : sanitized)
                    }
                  }}
                  style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '6px 8px', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 3, fontWeight: 700 }}>
                  Weight ({units === 'imperial' ? 'lbs' : 'kg'})
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={units === 'imperial' ? (weightKg ? String(Math.round(Number(weightKg) * 2.20462)) : '') : weightKg}
                  onChange={e => {
                    const sanitized = sanitizeNumericInput(e.target.value)
                    if (!sanitized) {
                      setWeightKg('')
                    } else {
                      setWeightKg(units === 'imperial' ? String(Math.round(Number(sanitized) / 2.20462)) : sanitized)
                    }
                  }}
                  style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '6px 8px', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', display: 'block', marginBottom: 3, fontWeight: 700 }}>Age</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  onFocus={selectOnFocus}
                  value={age}
                  onChange={e => setAge(sanitizeNumericInput(e.target.value))}
                  style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, padding: '6px 8px', fontSize: 12 }}
                />
              </div>
            </div>

            {/* Optional Circumference Fine-Tuning Drawer */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 12px' }}>
              <button
                type="button"
                onClick={() => setShowCircumferenceInputs(prev => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--gold-lt)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{showCircumferenceInputs ? '▲ Hide' : '▼ Optional:'} Manual Circumferences (US Navy Hybrid Calibration)</span>
              </button>

              {showCircumferenceInputs && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, color: '#94A3B8' }}>Waist ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      onFocus={selectOnFocus}
                      placeholder={units === 'imperial' ? '33' : '84'}
                      value={waistCm ? (units === 'imperial' ? String(Math.round(Number(waistCm) / 2.54)) : waistCm) : ''}
                      onChange={e => {
                        const sanitized = sanitizeNumericInput(e.target.value)
                        if (!sanitized) setWaistCm('')
                        else setWaistCm(units === 'imperial' ? String(Math.round(Number(sanitized) * 2.54)) : sanitized)
                      }}
                      style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '5px 6px', fontSize: 11 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: '#94A3B8' }}>Neck ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      onFocus={selectOnFocus}
                      placeholder={units === 'imperial' ? '15.5' : '39'}
                      value={neckCm ? (units === 'imperial' ? String(Math.round(Number(neckCm) / 2.54)) : neckCm) : ''}
                      onChange={e => {
                        const sanitized = sanitizeNumericInput(e.target.value)
                        if (!sanitized) setNeckCm('')
                        else setNeckCm(units === 'imperial' ? String(Math.round(Number(sanitized) * 2.54)) : sanitized)
                      }}
                      style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '5px 6px', fontSize: 11 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: '#94A3B8' }}>Hips ({units === 'imperial' ? 'in' : 'cm'})</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      onFocus={selectOnFocus}
                      placeholder={units === 'imperial' ? '38' : '96'}
                      value={hipCm ? (units === 'imperial' ? String(Math.round(Number(hipCm) / 2.54)) : hipCm) : ''}
                      onChange={e => {
                        const sanitized = sanitizeNumericInput(e.target.value)
                        if (!sanitized) setHipCm('')
                        else setHipCm(units === 'imperial' ? String(Math.round(Number(sanitized) * 2.54)) : sanitized)
                      }}
                      style={{ width: '100%', background: 'var(--navy)', color: '#FFF', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '5px 6px', fontSize: 11 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scan Trigger CTA Button */}
            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning}
              style={{
                background: 'linear-gradient(135deg, #D4A017 0%, #F59E0B 100%)',
                color: '#080E14',
                border: 'none',
                borderRadius: 8,
                padding: '12px 18px',
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                opacity: isScanning ? 0.75 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 20px rgba(212, 160, 23, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {isScanning ? (
                <>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      border: '2px solid #080E14',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  <span>Computing Multi-Compartment 4C Model...</span>
                </>
              ) : (
                <>
                  <GaaIcon name="dna" size={18} />
                  <span>Execute DEXA Multi-Compartment Scan</span>
                </>
              )}
            </button>

            {errorMessage && (
              <div style={{ color: 'var(--error)', fontSize: 12, background: 'rgba(239,68,68,0.1)', padding: 8, borderRadius: 5, border: '1px solid var(--error)' }}>
                {errorMessage}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: RESULTS & RECOMPOSITION COCKPIT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {scanResult ? (
              <>
                {/* 1. Hero DEXA Results Banner */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(13,27,42,0.95) 100%)',
                    border: '1px solid rgba(212,160,23,0.4)',
                    borderRadius: 10,
                    padding: '16px 18px',
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--gold-lt)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 800 }}>
                      DEXA-Calibrated Body Fat
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                      <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 40, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>
                        {scanResult.estimatedBodyFatPercent}%
                      </span>
                      <span style={{ color: '#38BDF8', fontSize: 13, fontWeight: 700 }}>
                        ±{scanResult.confidenceIntervalPercent}%
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 2 }}>
                      {scanResult.classification}
                    </div>
                  </div>

                  {/* Lean Body Mass */}
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Lean Body Mass</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {units === 'imperial' ? `${scanResult.leanBodyMassLbs} lbs` : `${scanResult.leanBodyMassKg} kg`}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>
                      SMM: {units === 'imperial' ? `${scanResult.skeletalMuscleMassLbs} lbs` : `${scanResult.skeletalMuscleMassKg} kg`}
                    </div>
                  </div>

                  {/* FFMI */}
                  <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>FFMI (Muscularity)</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                      {scanResult.ffmi}
                    </div>
                    <div style={{ fontSize: 10, color: '#93C5FD' }}>
                      {scanResult.ffmiCategory}
                    </div>
                  </div>
                </div>

                {/* Clothing Occlusion Notice */}
                {scanResult.photoQualityAssessment.clothingOcclusionWarning && (
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 11,
                      color: '#BAE6FD',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      lineHeight: 1.35,
                    }}
                  >
                    <GaaIcon name="shirt" size={16} tone="cyan" />
                    <div>
                      <strong>Clothed Scan Detected:</strong> Body composition evaluated using 3D silhouette contour and anthropometric formulas. For maximum optical subcutaneous definition scoring (±1.0%), fitted athletic wear or sports bra/shorts is recommended.
                    </div>
                  </div>
                )}

                {/* 2. Visual Lean Mass vs Fat Mass Bar */}
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                      Lean Mass: {units === 'imperial' ? `${scanResult.leanBodyMassLbs} lbs` : `${scanResult.leanBodyMassKg} kg`} ({Math.round(100 - scanResult.estimatedBodyFatPercent)}%)
                    </span>
                    <span style={{ color: '#D4A017', fontWeight: 700 }}>
                      Fat Mass: {units === 'imperial' ? `${scanResult.fatMassLbs} lbs` : `${scanResult.fatMassKg} kg`} ({scanResult.estimatedBodyFatPercent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 10, borderRadius: 5, background: '#D4A017', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${100 - scanResult.estimatedBodyFatPercent}%`, height: '100%', background: '#38BDF8' }} />
                  </div>
                </div>

                {/* 3. Four Core Metric Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Cunningham BMR</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>
                      {scanResult.cunninghamBmr} <span style={{ fontSize: 12 }}>kcal</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: '#94A3B8' }}>TDEE: ~{scanResult.maintenanceCaloriesTdee} kcal</div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Visceral Adiposity</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: scanResult.visceralFatRisk === 'Low' ? '#10B981' : '#F59E0B', marginTop: 2 }}>
                      {scanResult.visceralFatRisk} Risk
                    </div>
                    <div style={{ fontSize: 9.5, color: '#94A3B8' }}>WHR: {scanResult.waistToHipRatio}</div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Confidence Score</div>
                    <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                      {Math.round(scanResult.confidenceScore * 100)}%
                    </div>
                    <div style={{ fontSize: 9.5, color: '#94A3B8' }}>
                      {scanResult.photoQualityAssessment.multiViewEnhanced ? '3D Multi-View' : 'Frontal Calibrated'}
                    </div>
                  </div>
                </div>

                {/* 4. 7-Zone Regional Distribution Breakdown */}
                <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 14, letterSpacing: '0.04em', marginBottom: 8, color: '#D4A017' }}>
                    7-Zone Regional Adiposity &amp; Definition Analysis
                  </div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {scanResult.regionalBreakdown.map(region => (
                      <div key={region.region} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{region.label}</span>
                          <span style={{ color: '#38BDF8', fontWeight: 600 }}>
                            {region.estimatedFatPercent}% Fat · Definition: {region.muscleDefinitionScore}/10
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                          {region.clinicalObservation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Interactive Body Recomposition Target Planner */}
                <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 14, letterSpacing: '0.04em', color: '#38BDF8' }}>
                      Target Body Recomposition Trajectory
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#D4A017' }}>
                      Target: {targetBfSlider}% Body Fat
                    </div>
                  </div>

                  <input
                    type="range"
                    min={sex === 'male' ? 8 : 14}
                    max={sex === 'male' ? 24 : 32}
                    step={0.5}
                    value={targetBfSlider}
                    onChange={e => setTargetBfSlider(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#38BDF8', marginBottom: 8 }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 8 }}>
                    <div style={{ background: 'var(--navy)', padding: '6px 8px', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Target Weight</div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#FFF' }}>
                        {units === 'imperial' ? `${scanResult.recompositionProjection.targetWeightLbs} lbs` : `${scanResult.recompositionProjection.targetWeightKg} kg`}
                      </div>
                    </div>
                    <div style={{ background: 'var(--navy)', padding: '6px 8px', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Fat to Shift</div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#D4A017' }}>
                        {units === 'imperial' ? `${scanResult.recompositionProjection.fatToLoseLbs} lbs` : `${scanResult.recompositionProjection.fatToLoseKg} kg`}
                      </div>
                    </div>
                    <div style={{ background: 'var(--navy)', padding: '6px 8px', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Timeline</div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#38BDF8' }}>
                        ~{scanResult.recompositionProjection.estimatedWeeksToGoal} Wks
                      </div>
                    </div>
                    <div style={{ background: 'var(--navy)', padding: '6px 8px', borderRadius: 4, textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>Daily Protein</div>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#10B981' }}>
                        {scanResult.recompositionProjection.dailyProteinGrams}g
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 10.5, color: '#94A3B8', lineHeight: 1.4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="sparkles" size={12} tone="amber" />
                    <span>
                      <strong>Prescription:</strong> {scanResult.recompositionProjection.phaseName}. Caloric target:{' '}
                      <strong style={{ color: '#FFF' }}>{scanResult.recompositionProjection.dailyCaloricTarget} kcal/day</strong>.
                    </span>
                  </div>
                </div>

                {/* 6. Save & Apply Button */}
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={handleApply}
                    style={{
                      flex: 1,
                      background: saveSuccess ? '#10B981' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 16px',
                      fontFamily: 'var(--font-sans, Raleway), sans-serif',
                      fontSize: 13,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    }}
                  >
                    <GaaIcon name="check" size={16} />
                    <span>{saveSuccess ? 'Saved to Profile & Progress Ledger!' : 'Apply & Save to Record'}</span>
                  </button>
                </div>
              </>
            ) : (
              /* Idle Placeholder */
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  height: '100%',
                  minHeight: 380,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                  }}
                >
                  <GaaIcon name="dna" tone="cyan" size={26} />
                </div>
                <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  Awaiting Spatial Biometric Scan
                </h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: 12.5, maxWidth: 340, lineHeight: 1.5 }}>
                  Capture or upload athlete photo(s) on the left and click <strong>Execute DEXA Multi-Compartment Scan</strong> to generate full 4C metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
