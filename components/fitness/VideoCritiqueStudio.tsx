'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  analyzeLiftForm,
  LiftType,
  LIFT_METADATA,
  VideoCritiqueAnalysis,
  parseYouTubeVideoUrl,
  YouTubeVideoInfo,
} from '@/lib/video-form-analysis'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'
import MovementScreenInstructionsModal from '@/components/fitness/MovementScreenInstructionsModal'

export interface VideoCritiqueStudioProps {
  initialLift?: LiftType
  initialCritique?: VideoCritiqueAnalysis | null
  // When true each scan spends one use from the Technique Video Review Pack
  meterUsage?: boolean
  onUsageConsumed?: () => void
  onUsageBlocked?: () => void
}

const COMMON_FAULTS_BY_LIFT: Record<LiftType, { id: string; label: string }[]> = {
  overhead_squat_assessment: [
    { id: 'knee_valgus', label: 'Knees Caving Inward (Valgus)' },
    { id: 'feet_flatten_turn_out', label: 'Feet Flatten / Turn Out' },
    { id: 'excessive_forward_lean', label: 'Excessive Forward Lean' },
    { id: 'low_back_arches', label: 'Low Back Arches (Anterior Pelvic Tilt)' },
    { id: 'arms_fall_forward', label: 'Arms Fall Forward past Ears' },
  ],
  barbell_back_squat: [
    { id: 'knee_valgus', label: 'Knees Caving In (Valgus)' },
    { id: 'excessive_forward_lean', label: 'Excessive Forward Lean' },
    { id: 'cut_high', label: 'Cut Depth High (Above Parallel)' },
  ],
  barbell_deadlift: [
    { id: 'lumbar_rounding', label: 'Lumbar Rounding (Spine Flexion)' },
    { id: 'hips_shooting_up', label: 'Hips Rising Too Early' },
    { id: 'hyperextension_lockout', label: 'Over-Arching Lower Back at Lockout' },
  ],
  barbell_bench_press: [
    { id: 'flared_elbows', label: 'Elbows Flared 90° (Shoulder Impingement)' },
    { id: 'butt_off_bench', label: 'Glutes Off Bench' },
  ],
  overhead_press: [
    { id: 'lumbar_hyperextension', label: 'Lumbar Extension under Press' },
  ],
  single_leg_squat: [
    { id: 'knee_valgus', label: 'Knee Valgus / Trendelenburg Drop' },
  ],
  barbell_row: [
    { id: 'excessive_forward_lean', label: 'Torso Jerking / Loss of Angle' },
  ],
  romanian_deadlift: [
    { id: 'lumbar_rounding', label: 'Lumbar Rounding at Bottom Hinge' },
  ],
}

export function inferLiftTypeFromFileName(fileName: string): LiftType | null {
  const name = fileName.toLowerCase()
  if (name.includes('ohsa') || name.includes('overhead_squat') || name.includes('movement_screen') || name.includes('screen')) return 'overhead_squat_assessment'
  if (name.includes('rdl') || (name.includes('deadlift') && name.includes('romanian'))) return 'romanian_deadlift'
  if (name.includes('deadlift')) return 'barbell_deadlift'
  if (name.includes('bench') || name.includes('chest')) return 'barbell_bench_press'
  if (name.includes('ohp') || name.includes('overhead') || name.includes('military') || name.includes('shoulder')) return 'overhead_press'
  if (name.includes('row')) return 'barbell_row'
  if (name.includes('single') || name.includes('sls') || name.includes('lunge')) return 'single_leg_squat'
  if (name.includes('squat')) return 'barbell_back_squat'
  return null
}

export default function VideoCritiqueStudio({ initialLift, initialCritique, meterUsage = false, onUsageConsumed, onUsageBlocked }: VideoCritiqueStudioProps) {
  const [selectedLift, setSelectedLift] = useState<LiftType>(initialLift ?? 'barbell_back_squat')
  const [loadLbs, setLoadLbs] = useState<string>(initialLift === 'overhead_squat_assessment' ? '0' : '275')
  const [showScreenInstructionsModal, setShowScreenInstructionsModal] = useState<boolean>(false)
  const [repsCount, setRepsCount] = useState<string>('5')
  const [selectedFaults, setSelectedFaults] = useState<string[]>([])
  const [clientNotes, setClientNotes] = useState<string>('')
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [activeInputTab, setActiveInputTab] = useState<'video_upload' | 'youtube_link' | 'manual_diagnostic'>('video_upload')

  // YouTube Link & Player State
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>('')
  const [activeYouTubeInfo, setActiveYouTubeInfo] = useState<YouTubeVideoInfo | null>(null)
  const [youtubeError, setYoutubeError] = useState<string | null>(null)
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false)

  // Video File Upload & Playback State
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [videoFileName, setVideoFileName] = useState<string | null>(null)
  const [videoFileSize, setVideoFileSize] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [scanProgress, setScanProgress] = useState<{ step: number; totalSteps: number; label: string; percent: number } | null>(null)

  const [usageError, setUsageError] = useState<string | null>(null)
  const [critique, setCritique] = useState<VideoCritiqueAnalysis | null>(
    initialCritique ?? analyzeLiftForm({ liftType: initialLift ?? 'barbell_back_squat', loadLbs: 275, repsCount: 5 })
  )

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null)

  // Sync initial props if bridge opens modal with new lift/critique
  useEffect(() => {
    if (initialLift) {
      setSelectedLift(initialLift)
    }
    if (initialCritique) {
      setCritique(initialCritique)
    }
  }, [initialLift, initialCritique])

  const toggleFault = (faultId: string) => {
    setSelectedFaults(prev =>
      prev.includes(faultId) ? prev.filter(f => f !== faultId) : [...prev, faultId]
    )
  }

  const handleVideoFileSelect = (file: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setUploadedVideoFile(file)
    setUploadedVideoUrl(url)
    setVideoFileName(file.name)
    setVideoFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB')

    // Smart auto-detection of lift from filename
    const inferred = inferLiftTypeFromFileName(file.name)
    const targetLift = inferred ?? selectedLift
    if (inferred) {
      setSelectedLift(inferred)
    }

    runBiomechanicalScan(targetLift, file.name, 'file')
  }

  const handleLoadSampleVideo = (
    sampleUrl: string,
    fileName: string,
    lift: LiftType,
    faults: string[]
  ) => {
    setUploadedVideoUrl(sampleUrl)
    setUploadedVideoFile(null)
    setVideoFileName(fileName)
    setVideoFileSize('Sample MP4')
    setSelectedLift(lift)
    setSelectedFaults(faults)

    runBiomechanicalScan(lift, fileName, 'file')
  }

  const handleLoadYouTubeUrl = (urlToLoad?: string) => {
    const raw = urlToLoad ?? youtubeUrlInput
    if (!raw.trim()) {
      setYoutubeError('Please enter a YouTube video URL or Shorts link.')
      return
    }
    const info = parseYouTubeVideoUrl(raw)
    if (!info) {
      setYoutubeError('Invalid YouTube URL. Please provide a standard watch link, youtu.be shortlink, or YouTube Shorts link.')
      return
    }
    setYoutubeError(null)
    setActiveYouTubeInfo(info)
    setYoutubeUrlInput(info.watchUrl)

    // Trigger analysis with YouTube source
    runBiomechanicalScan(selectedLift, info.watchUrl, 'youtube')
  }

  const handleClearYouTubeVideo = () => {
    setActiveYouTubeInfo(null)
    setYoutubeUrlInput('')
    setYoutubeError(null)
  }

  const handleShareCritique = async () => {
    if (!critique) return
    const videoLine = critique.videoUrl ? `\nVideo Footage: ${critique.videoUrl}` : ''
    const shareText = `🏋️ Forge Athletic Biomechanical Form Critique\nLift: ${critique.liftName} (${critique.loadLbs ? `${critique.loadLbs} lbs x ` : ''}${critique.repsObserved} reps)\nForm Score: ${critique.overallFormScore}/100 · ${critique.rating}${videoLine}\n\nMaster Coach Summary: ${critique.masterCoachSummary}`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Forge Athletic - ${critique.liftName} Form Critique`,
          text: shareText,
          url: critique.videoUrl || window.location.href,
        })
        return
      } catch {
        // Fall back to clipboard if user dismissed native share dialog
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      setCopiedShareLink(true)
      setTimeout(() => setCopiedShareLink(false), 2500)
    }
  }

  const runBiomechanicalScan = async (
    lift: LiftType,
    fileNameOrUrlHint?: string,
    sourceType: 'file' | 'youtube' | 'direct' = 'file'
  ) => {
    if (meterUsage) {
      try {
        const res = await fetch('/api/fitness/video-critique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lift_type: lift }),
        })
        if (!res.ok) {
          if (res.status === 402) onUsageBlocked?.()
          const data = await res.json().catch(() => null)
          setUsageError(data?.error ?? 'Could not start the analysis. Please try again.')
          return
        }
        setUsageError(null)
        onUsageConsumed?.()
      } catch {
        setUsageError('Could not start the analysis. Please try again.')
        return
      }
    }

    setAnalyzing(true)
    const scanLabel = sourceType === 'youtube'
      ? 'Connecting to YouTube kinematic video stream & parsing joint anchors...'
      : 'Extracting 60fps kinetic frame vectors & joint anchors...'

    setScanProgress({ step: 1, totalSteps: 4, label: scanLabel, percent: 25 })

    setTimeout(() => {
      setScanProgress({ step: 2, totalSteps: 4, label: 'Scanning spinal alignment & lumbar curvature...', percent: 50 })
    }, 300)

    setTimeout(() => {
      setScanProgress({ step: 3, totalSteps: 4, label: 'Evaluating knee frontal tracking & bar velocity...', percent: 75 })
    }, 600)

    setTimeout(() => {
      setScanProgress({ step: 4, totalSteps: 4, label: 'Synthesizing NASM 4-Phase OPT™ Corrective Continuum...', percent: 100 })
    }, 900)

    setTimeout(() => {
      const result = analyzeLiftForm({
        liftType: lift,
        loadLbs: loadLbs ? parseNumericInput(loadLbs, 0) : undefined,
        repsCount: parseNumericInput(repsCount, 5),
        observedDeviations: selectedFaults,
        clientNotes: clientNotes || (fileNameOrUrlHint ? `Footage analyzed: ${fileNameOrUrlHint}` : undefined),
        videoUrl: fileNameOrUrlHint && (fileNameOrUrlHint.startsWith('http') || parseYouTubeVideoUrl(fileNameOrUrlHint)) ? fileNameOrUrlHint : undefined,
        videoSourceType: sourceType,
      })
      setCritique(result)
      setAnalyzing(false)
      setScanProgress(null)
    }, 1200)
  }

  const handleManualRunAnalysis = () => {
    if (activeInputTab === 'youtube_link' && activeYouTubeInfo) {
      runBiomechanicalScan(selectedLift, activeYouTubeInfo.watchUrl, 'youtube')
    } else {
      runBiomechanicalScan(selectedLift)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name)) {
        handleVideoFileSelect(file)
      }
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = speed
    }
  }

  const handleRemoveUploadedVideo = () => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl)
    }
    setUploadedVideoFile(null)
    setUploadedVideoUrl(null)
    setVideoFileName(null)
    setVideoFileSize(null)
    setPlaybackSpeed(1.0)
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Studio Header Toolbar */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  padding: '4px 10px',
                  background: 'rgba(56,189,248,0.15)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56,189,248,0.4)',
                }}
              >
                NASM Biomechanical Diagnostic · OPT™ Corrective Continuum
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                Kinetic Chain & Corrective Engine
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 24,
                letterSpacing: '0.03em',
                margin: '8px 0 0',
                color: 'var(--white)',
              }}
            >
              Kinetic Form Diagnostics & Correctives Studio
            </h2>
            {usageError && (
              <p role="alert" style={{ margin: '8px 0 0', color: 'var(--error)', fontSize: 13 }}>{usageError}</p>
            )}
          </div>
        </div>
        <p style={{ margin: '8px 0 0', color: 'var(--gray)', fontSize: 14, lineHeight: 1.6, maxWidth: 840 }}>
          Upload lift footage or screen kinetic joint deviations to diagnose movement compensations, map overactive/underactive muscle imbalances, and prescribe 4-phase NASM corrective protocols.
        </p>
      </div>

      {/* Input Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveInputTab('video_upload')}
          className="tactile-btn"
          style={{
            padding: '8px 16px',
            background: activeInputTab === 'video_upload' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.04)',
            border: activeInputTab === 'video_upload' ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
            color: activeInputTab === 'video_upload' ? '#38BDF8' : 'var(--gray)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="video-studio" size={14} tone={activeInputTab === 'video_upload' ? 'cyan' : 'slate'} /> Video Footage Upload & Dropzone
        </button>

        <button
          type="button"
          onClick={() => setActiveInputTab('youtube_link')}
          className="tactile-btn"
          style={{
            padding: '8px 16px',
            background: activeInputTab === 'youtube_link' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)',
            border: activeInputTab === 'youtube_link' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)',
            color: activeInputTab === 'youtube_link' ? '#F87171' : 'var(--gray)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ color: '#EF4444', fontWeight: 900 }}>▶</span> Share YouTube Video
        </button>

        <button
          type="button"
          onClick={() => setActiveInputTab('manual_diagnostic')}
          className="tactile-btn"
          style={{
            padding: '8px 16px',
            background: activeInputTab === 'manual_diagnostic' ? 'rgba(197,160,89,0.2)' : 'rgba(255,255,255,0.04)',
            border: activeInputTab === 'manual_diagnostic' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
            color: activeInputTab === 'manual_diagnostic' ? 'var(--gold-lt)' : 'var(--gray)',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <GaaIcon name="gear" size={14} tone={activeInputTab === 'manual_diagnostic' ? 'gold' : 'slate'} /> Biomechanical Fault Screener
        </button>
      </div>

      {/* Mode 1: Video File Upload & Dropzone */}
      {activeInputTab === 'video_upload' && (
        <div className="glass-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: '#38BDF8', letterSpacing: '0.03em' }}>
              Lift Video Footage Analyzer
            </h3>
            {uploadedVideoFile && (
              <button
                type="button"
                onClick={handleRemoveUploadedVideo}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#F87171',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                ✕ Remove Video
              </button>
            )}
          </div>

          {!uploadedVideoUrl ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed #38BDF8' : '2px dashed rgba(255,255,255,0.2)',
                background: isDragging ? 'rgba(56,189,248,0.08)' : 'rgba(8,14,24,0.6)',
                borderRadius: 8,
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleVideoFileSelect(e.target.files[0])
                  }
                }}
                style={{ display: 'none' }}
              />
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                <GaaIcon name="video-studio" size={36} tone="cyan" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                Drag & Drop Workout Video Clip Here
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12 }}>
                Supports MP4, MOV, WebM (up to 100MB) — squat, deadlift, bench, overhead press, RDL
              </div>
              <button
                type="button"
                className="tactile-btn"
                style={{
                  background: 'rgba(56,189,248,0.2)',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '8px 18px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Browse Video File
              </button>

              {/* Quick Sample Video Loaders */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                  Quick Samples:
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/squat_good_form.mp4', 'squat_good_form.mp4', 'barbell_back_squat', [])
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    color: 'var(--success)',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✓ Good Squat (Textbook)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/squat_knee_valgus_fault.mp4', 'squat_knee_valgus_fault.mp4', 'barbell_back_squat', ['knee_valgus', 'excessive_forward_lean'])
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#F87171',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Poor Squat (Valgus Fault)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/deadlift_good_form.mp4', 'deadlift_good_form.mp4', 'barbell_deadlift', [])
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    color: 'var(--success)',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✓ Good Deadlift (Textbook)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/deadlift_lumbar_rounding_fault.mp4', 'deadlift_lumbar_rounding_fault.mp4', 'barbell_deadlift', ['lumbar_rounding'])
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#F87171',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Poor Deadlift (Spinal Flexion)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {/* Video Player Preview */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: 400,
                  background: '#000000',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(56,189,248,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <video
                  ref={videoPlayerRef}
                  src={uploadedVideoUrl}
                  controls
                  loop
                  style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }}
                />

                {/* Video Info Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(8,14,24,0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <GaaIcon name="folder" size={12} tone="cyan" /> {videoFileName}
                  </span>
                  <span style={{ color: 'var(--gray)' }}>({videoFileSize})</span>
                </div>

                {/* Clear Video Button */}
                <button
                  type="button"
                  onClick={() => {
                    setUploadedVideoUrl(null)
                    setUploadedVideoFile(null)
                    setVideoFileName(null)
                    setVideoFileSize(null)
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(239,68,68,0.25)',
                    border: '1px solid rgba(239,68,68,0.5)',
                    color: '#F87171',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Clear Video
                </button>
              </div>

              {/* Playback Controls & Rescan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)' }}>Playback Speed:</span>
                  {[1.0, 0.5, 0.25].map(spd => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => handleSpeedChange(spd)}
                      style={{
                        background: playbackSpeed === spd ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)',
                        border: playbackSpeed === spd ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.15)',
                        color: playbackSpeed === spd ? '#38BDF8' : '#CBD5E1',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => runBiomechanicalScan(selectedLift, videoFileName ?? undefined)}
                  disabled={analyzing}
                  className="tactile-btn"
                  style={{
                    padding: '8px 18px',
                    background: '#38BDF8',
                    border: 'none',
                    color: '#0A0E18',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    cursor: analyzing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="lightning" size={14} tone="dark" />
                  {analyzing ? 'Scanning Frame Telemetry...' : 'Re-Scan Video Kinetics'}
                </button>
              </div>
            </div>
          )}

          {/* Scanning Progress Bar Indicator */}
          {scanProgress && (
            <div style={{ background: 'rgba(8,14,24,0.85)', border: '1px solid #38BDF8', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#38BDF8' }}>
                  {scanProgress.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF' }}>
                  Step {scanProgress.step}/{scanProgress.totalSteps} ({scanProgress.percent}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${scanProgress.percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38BDF8 0%, #60A5FA 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: YouTube Video Link */}
      {activeInputTab === 'youtube_link' && (
        <div className="glass-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  background: 'rgba(239,68,68,0.18)',
                  border: '1px solid rgba(239,68,68,0.45)',
                  color: '#F87171',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.06em',
                }}
              >
                ▶ YOUTUBE
              </span>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: '#F87171', letterSpacing: '0.03em' }}>
                Share & Analyze YouTube Lift Video
              </h3>
            </div>
            {activeYouTubeInfo && (
              <button
                type="button"
                onClick={handleClearYouTubeVideo}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#F87171',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                ✕ Clear Video
              </button>
            )}
          </div>

          <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
            Paste a link to any public or unlisted YouTube video or vertical YouTube Shorts. Forge Athletic embeds your footage in a privacy-preserving player and extracts kinetic barbell tracking vectors.
          </p>

          {!activeYouTubeInfo ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 320px', position: 'relative' }}>
                  <input
                    type="url"
                    value={youtubeUrlInput}
                    onChange={e => {
                      setYoutubeUrlInput(e.target.value)
                      if (youtubeError) setYoutubeError(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleLoadYouTubeUrl()
                      }
                    }}
                    placeholder="e.g. https://youtu.be/... or https://www.youtube.com/shorts/..."
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: 'rgba(8,14,20,0.7)',
                      border: youtubeError ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.15)',
                      color: 'var(--white)',
                      fontSize: 13.5,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadYouTubeUrl()}
                  className="tactile-btn"
                  style={{
                    padding: '11px 20px',
                    background: '#EF4444',
                    border: 'none',
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontSize: 12.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderRadius: 4,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <GaaIcon name="video-studio" size={14} tone="white" /> Load Video
                </button>
              </div>

              {youtubeError && (
                <div style={{ color: 'var(--error)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GaaIcon name="alert-triangle" size={13} tone="ruby" />
                  {youtubeError}
                </div>
              )}

              {/* Sample Quick-Load Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                  Quick Samples:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://www.youtube.com/watch?v=bEv6CCg2BC8'
                    setYoutubeUrlInput(url)
                    setSelectedLift('barbell_back_squat')
                    handleLoadYouTubeUrl(url)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  🏋️ Barbell Squat Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://www.youtube.com/watch?v=op9kVnSso6Q'
                    setYoutubeUrlInput(url)
                    setSelectedLift('barbell_deadlift')
                    handleLoadYouTubeUrl(url)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Deadlift Pull Sample
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ'
                    setYoutubeUrlInput(url)
                    handleLoadYouTubeUrl(url)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  📱 YouTube Shorts Sample
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {/* YouTube Player Container */}
              <div
                style={{
                  background: '#000000',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  maxWidth: activeYouTubeInfo.isShort ? 360 : 760,
                  margin: activeYouTubeInfo.isShort ? '0 auto' : undefined,
                  width: '100%',
                }}
              >
                <div style={{ position: 'relative', width: '100%', paddingTop: activeYouTubeInfo.isShort ? '177.77%' : '56.25%' }}>
                  <iframe
                    src={activeYouTubeInfo.embedUrl}
                    title="Client YouTube Lift Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                </div>
              </div>

              {/* YouTube Video Info Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>
                    YouTube ID: <code style={{ color: '#F87171' }}>{activeYouTubeInfo.videoId}</code>
                  </span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--gray)',
                    }}
                  >
                    {activeYouTubeInfo.isShort ? '📱 YouTube Shorts (9:16)' : '🖥️ Standard 16:9'}
                  </span>
                  {activeYouTubeInfo.startTime != null && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: 'rgba(56,189,248,0.15)',
                        color: '#38BDF8',
                      }}
                    >
                      Start: {activeYouTubeInfo.startTime}s
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={activeYouTubeInfo.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#38BDF8',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Open on YouTube ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Scanning Progress Bar Indicator */}
          {scanProgress && (
            <div style={{ background: 'rgba(8,14,24,0.85)', border: '1px solid #EF4444', borderRadius: 6, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#F87171' }}>
                  {scanProgress.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF' }}>
                  Step {scanProgress.step}/{scanProgress.totalSteps} ({scanProgress.percent}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${scanProgress.percent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lift Submission & Parameter Controls */}
      <div className="glass-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: 'var(--gold-lt)', letterSpacing: '0.03em' }}>
            Lift Parameters & Biomechanical Screening
          </h3>
          {selectedLift === 'overhead_squat_assessment' && (
            <button
              type="button"
              onClick={() => setShowScreenInstructionsModal(true)}
              className="tactile-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: 'var(--gold-lt)',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              <GaaIcon name="movement-screen" size={13} tone="gold" />
              Movement Screen Protocol & Checklist
            </button>
          )}
        </div>

        {selectedLift === 'overhead_squat_assessment' && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 6,
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <div style={{ fontSize: 12, color: 'var(--white)', lineHeight: 1.45 }}>
                <strong>NASM OHSA Protocol Active:</strong> 5 reps anterior (front), 5 reps lateral (side), 5 reps posterior (back). 4/2/1 tempo, bodyweight (0 lbs) with arms overhead.<br />
                <span style={{ color: '#FCD34D', fontSize: 11.5 }}>
                  <strong>Attire Acceptance Standard:</strong> Fitted athletic shorts (knees visible), fitted top, and barefoot/flat socks required. Submissions recorded in baggy sweatpants, hoodies, or thick-soled running shoes will be rejected.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowScreenInstructionsModal(true)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--gold-lt)',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Camera Setup &amp; Technique Guide →
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', fontWeight: 600 }}>
              Compound Exercise
            </label>
            <select
              value={selectedLift}
              onChange={e => {
                const nextLift = e.target.value as LiftType
                setSelectedLift(nextLift)
                setSelectedFaults([])
                if (nextLift === 'overhead_squat_assessment' && (loadLbs === '275' || loadLbs === '')) {
                  setLoadLbs('0')
                } else if (selectedLift === 'overhead_squat_assessment' && loadLbs === '0') {
                  setLoadLbs('275')
                }
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--white)',
                fontSize: 14,
              }}
            >
              {Object.entries(LIFT_METADATA).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', fontWeight: 600 }}>
              Working Load (lbs)
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              onFocus={selectOnFocus}
              value={loadLbs}
              onChange={e => setLoadLbs(sanitizeNumericInput(e.target.value))}
              placeholder="e.g. 275"
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--white)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', fontWeight: 600 }}>
              Reps Observed
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              onFocus={selectOnFocus}
              value={repsCount}
              onChange={e => setRepsCount(sanitizeNumericInput(e.target.value))}
              placeholder="5"
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--white)',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        {/* Observed Kinetic Checkpoints / Deviations */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em', fontWeight: 600 }}>
            Biomechanical Checkpoints to Screen
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(COMMON_FAULTS_BY_LIFT[selectedLift] ?? []).map(fault => {
              const active = selectedFaults.includes(fault.id)
              return (
                <button
                  key={fault.id}
                  type="button"
                  onClick={() => toggleFault(fault.id)}
                  className="tactile-btn"
                  style={{
                    padding: '8px 14px',
                    background: active ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.1)',
                    color: active ? 'var(--white)' : 'var(--gray)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {active ? <GaaIcon name="alert-triangle" size={12} tone="ruby" /> : <span>+</span>}
                  {fault.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em', fontWeight: 600 }}>
            Biomechanical Notes & Joint Sensations (Optional)
          </label>
          <textarea
            value={clientNotes}
            onChange={e => setClientNotes(e.target.value)}
            placeholder="e.g. Felt minor pinch in right anterior hip capsule on reps 4 and 5."
            rows={2}
            style={{
              width: '100%',
              padding: '9px 12px',
              background: 'rgba(8,14,20,0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--white)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={handleManualRunAnalysis}
            disabled={analyzing}
            className="tactile-btn"
            style={{
              padding: '12px 26px',
              background: 'var(--gold)',
              border: 'none',
              color: 'var(--navy)',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: analyzing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="lightning" size={16} tone="dark" />
            {analyzing
              ? 'Running Biomechanical Scan...'
              : activeInputTab === 'youtube_link' && activeYouTubeInfo
                ? 'Critique YouTube Lift Video'
                : 'Run Biomechanical Diagnostics'}
          </button>
        </div>
      </div>

      {/* Analysis Output Diagnostic Report */}
      {critique && (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* Scorecard Hero */}
          <div
            className="glass-card-gold"
            style={{
              padding: '24px 28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Technical Execution Score
              </div>
              <div className="tabular-nums" style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 44, fontWeight: 700, color: 'var(--white)', lineHeight: 1 }}>
                  {critique.overallFormScore}
                  <span style={{ fontSize: 22, color: 'var(--gold)' }}>/100</span>
                </span>
                <span
                  style={{
                    padding: '4px 10px',
                    background: critique.rating === 'Mastery' ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)',
                    border: `1px solid ${critique.rating === 'Mastery' ? 'var(--success)' : 'var(--error)'}`,
                    color: critique.rating === 'Mastery' ? 'var(--success)' : 'var(--error)',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {critique.rating}
                </span>
              </div>
            </div>

            <div style={{ maxWidth: 460 }}>
              <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Master Coach Biomechanical Verdict
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--white)', fontSize: 14, lineHeight: 1.5 }}>
                {critique.masterCoachSummary}
              </p>
            </div>

            {/* Video Source & Share Action Strip */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                marginTop: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {critique.videoSourceType === 'youtube' && critique.youtubeVideoId && (
                  <span
                    style={{
                      background: 'rgba(239,68,68,0.18)',
                      border: '1px solid rgba(239,68,68,0.45)',
                      color: '#F87171',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    ▶ YouTube Verified Footage ({critique.youtubeVideoId})
                  </span>
                )}
                {critique.videoUrl && (
                  <a
                    href={critique.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#38BDF8',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    View Original Footage ↗
                  </a>
                )}
                {critique.loadLbs != null && (
                  <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                    Working Load: <strong style={{ color: 'var(--white)' }}>{critique.loadLbs} lbs</strong>
                  </span>
                )}
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                  Observed: <strong style={{ color: 'var(--white)' }}>{critique.repsObserved} reps</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleShareCritique}
                className="tactile-btn"
                style={{
                  padding: '8px 16px',
                  background: copiedShareLink ? 'rgba(52,211,153,0.2)' : 'rgba(197,160,89,0.15)',
                  border: `1px solid ${copiedShareLink ? 'var(--success)' : 'var(--gold)'}`,
                  color: copiedShareLink ? 'var(--success)' : 'var(--gold-lt)',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <GaaIcon name={copiedShareLink ? 'check' : 'share'} size={14} tone={copiedShareLink ? 'emerald' : 'gold'} />
                {copiedShareLink ? 'Critique & Video Link Copied!' : 'Share Critique & Video Link'}
              </button>
            </div>
          </div>

          {/* Kinetic Checkpoint Breakdown */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h4 style={{ margin: '0 0 16px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: 'var(--white)', letterSpacing: '0.03em' }}>
              Kinetic Joint Alignment Checkpoints
            </h4>
            <div style={{ display: 'grid', gap: 12 }}>
              {critique.checkpoints.map((cp, i) => {
                const isOptimal = cp.status === 'optimal'
                return (
                  <div
                    key={i}
                    style={{
                      padding: 16,
                      background: 'rgba(8,14,20,0.6)',
                      border: `1px solid ${isOptimal ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.4)'}`,
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--white)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {isOptimal ? (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
                        ) : (
                          <GaaIcon name="alert-triangle" size={13} tone="ruby" />
                        )}
                        {cp.name}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: isOptimal ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {cp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
                      {cp.observation}
                    </p>
                    <div style={{ fontSize: 13, color: 'var(--gold-lt)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <GaaIcon name="chevron-right" size={12} tone="gold" /> {cp.prescribedCue}
                    </div>

                    {cp.impairedMuscles && (
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, fontSize: 12 }}>
                        <div style={{ color: '#ff8787' }}>
                          <strong>Overactive (Inhibit):</strong> {cp.impairedMuscles.overactive.join(', ')}
                        </div>
                        <div style={{ color: '#69db7c' }}>
                          <strong>Underactive (Activate):</strong> {cp.impairedMuscles.underactive.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4-Phase Corrective Exercise Continuum */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                NASM OPT™ Prescribed Protocol
              </span>
              <span style={{ color: 'var(--white)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, letterSpacing: '0.03em' }}>
                4-Phase Corrective Continuum
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  1. Inhibit (SMR)
                </div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--gray)', fontSize: 12, lineHeight: 1.6 }}>
                  {critique.prescribedCorrectiveContinuum.inhibit.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  2. Lengthen (Static)
                </div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--gray)', fontSize: 12, lineHeight: 1.6 }}>
                  {critique.prescribedCorrectiveContinuum.lengthen.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  3. Activate (Isolated)
                </div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--gray)', fontSize: 12, lineHeight: 1.6 }}>
                  {critique.prescribedCorrectiveContinuum.activate.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: 'rgba(8,14,20,0.6)', padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  4. Integrate (Dynamic)
                </div>
                <ul style={{ margin: '8px 0 0', paddingLeft: 16, color: 'var(--gray)', fontSize: 12, lineHeight: 1.6 }}>
                  {critique.prescribedCorrectiveContinuum.integrate.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <MovementScreenInstructionsModal
        isOpen={showScreenInstructionsModal}
        onClose={() => setShowScreenInstructionsModal(false)}
      />
    </div>
  )
}
