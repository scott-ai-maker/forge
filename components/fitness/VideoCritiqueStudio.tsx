'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  analyzeLiftForm,
  LiftType,
  LIFT_METADATA,
  VideoCritiqueAnalysis,
  parseYouTubeVideoUrl,
  YouTubeVideoInfo,
} from '@/lib/video-form-analysis'
import { GaaIcon } from '@/components/ui/GaaIcon'
import TelemetryRingGauge from '@/components/ui/TelemetryRingGauge'
import { selectOnFocus, sanitizeNumericInput, parseNumericInput } from '@/lib/form-input-helpers'
import MovementScreenInstructionsModal from '@/components/fitness/MovementScreenInstructionsModal'
import FormLabRecorder from '@/components/fitness/FormLabRecorder'

const MAX_VIDEO_FILE_BYTES = 100 * 1024 * 1024 // 100 MB

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
  if (
    name.includes('ohsa') ||
    name.includes('overhead_squat') ||
    name.includes('movement_screen') ||
    name.includes('screen')
  ) {
    return 'overhead_squat_assessment'
  }
  if (name.includes('rdl') || (name.includes('deadlift') && name.includes('romanian'))) {
    return 'romanian_deadlift'
  }
  if (name.includes('deadlift')) return 'barbell_deadlift'
  if (name.includes('bench') || name.includes('chest')) return 'barbell_bench_press'
  if (
    name.includes('ohp') ||
    name.includes('overhead') ||
    name.includes('military') ||
    name.includes('shoulder')
  ) {
    return 'overhead_press'
  }
  if (name.includes('row')) return 'barbell_row'
  if (name.includes('single') || name.includes('sls') || name.includes('lunge')) {
    return 'single_leg_squat'
  }
  if (name.includes('squat')) return 'barbell_back_squat'
  return null
}

function getRatingBadgeClasses(rating: VideoCritiqueAnalysis['rating']): string {
  if (rating === 'Mastery') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  }
  if (rating === 'Proficient') {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-300'
  }
  if (rating === 'Needs Recalibration') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  }
  return 'border-rose-500/30 bg-rose-500/10 text-rose-300'
}

export default function VideoCritiqueStudio({
  initialLift,
  initialCritique,
  meterUsage = false,
  onUsageConsumed,
  onUsageBlocked,
}: VideoCritiqueStudioProps) {
  const youtubeInputId = useId()
  const liftSelectId = useId()
  const loadInputId = useId()
  const repsInputId = useId()
  const notesTextareaId = useId()

  const [selectedLift, setSelectedLift] = useState<LiftType>(initialLift ?? 'barbell_back_squat')
  const [loadLbs, setLoadLbs] = useState<string>(
    initialLift === 'overhead_squat_assessment' ? '0' : '275'
  )
  const [showScreenInstructionsModal, setShowScreenInstructionsModal] = useState<boolean>(false)
  const [repsCount, setRepsCount] = useState<string>('5')
  const [selectedFaults, setSelectedFaults] = useState<string[]>([])
  const [clientNotes, setClientNotes] = useState<string>('')
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [activeInputTab, setActiveInputTab] = useState<
    'video_upload' | 'youtube_link' | 'manual_diagnostic'
  >('video_upload')

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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [scanProgress, setScanProgress] = useState<{
    step: number
    totalSteps: number
    label: string
    percent: number
  } | null>(null)

  const [usageError, setUsageError] = useState<string | null>(null)
  const [critique, setCritique] = useState<VideoCritiqueAnalysis | null>(initialCritique ?? null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null)
  const uploadedBlobUrlRef = useRef<string | null>(null)
  const scanTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearScanTimers = useCallback(() => {
    scanTimersRef.current.forEach(t => clearTimeout(t))
    scanTimersRef.current = []
  }, [])

  const revokeActiveBlobUrl = useCallback(() => {
    if (uploadedBlobUrlRef.current) {
      URL.revokeObjectURL(uploadedBlobUrlRef.current)
      uploadedBlobUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearScanTimers()
      revokeActiveBlobUrl()
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [clearScanTimers, revokeActiveBlobUrl])

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

  const runBiomechanicalScan = async (
    lift: LiftType,
    fileNameOrUrlHint?: string,
    sourceType: 'file' | 'youtube' | 'direct' = 'file',
    overrideFaults?: string[]
  ) => {
    const faultsToAnalyze = overrideFaults ?? selectedFaults
    const numericLoad = loadLbs !== '' ? parseNumericInput(loadLbs, 0) : undefined
    const numericReps = parseNumericInput(repsCount, 5)
    const resolvedVideoRef =
      fileNameOrUrlHint ||
      videoFileName ||
      (activeYouTubeInfo ? `https://youtu.be/${activeYouTubeInfo.videoId}` : '') ||
      youtubeUrlInput.trim()

    if (meterUsage && !resolvedVideoRef) {
      setUsageError('Upload a lift video clip or attach a valid video link before running a Technique Video Review.')
      return
    }

    if (meterUsage) {
      try {
        const res = await fetch('/api/fitness/video-critique', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lift_type: lift,
            load_lbs: numericLoad,
            reps_count: numericReps,
            video_file_name: resolvedVideoRef,
            observed_deviations: faultsToAnalyze,
            notes: clientNotes || undefined,
          }),
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

    clearScanTimers()
    setAnalyzing(true)
    setScanProgress({
      step: 1,
      totalSteps: 2,
      label: 'Preparing NASM OPT™ technique checklist & queuing clip details...',
      percent: 50,
    })

    scanTimersRef.current.push(
      setTimeout(() => {
        setScanProgress({
          step: 2,
          totalSteps: 2,
          label: 'Building self-reported checkpoint cues & corrective warm-up notes...',
          percent: 100,
        })
      }, 200),
      setTimeout(() => {
        const result = analyzeLiftForm({
          liftType: lift,
          loadLbs: lift === 'overhead_squat_assessment' && numericLoad === 275 ? 0 : numericLoad,
          repsCount: numericReps,
          observedDeviations: faultsToAnalyze,
          clientNotes:
            clientNotes || (resolvedVideoRef ? `Footage attached: ${resolvedVideoRef}` : undefined),
          videoUrl:
            resolvedVideoRef &&
            (resolvedVideoRef.startsWith('http') || Boolean(parseYouTubeVideoUrl(resolvedVideoRef)))
              ? resolvedVideoRef
              : undefined,
          videoSourceType: sourceType,
        })
        setCritique(result)
        setAnalyzing(false)
        setScanProgress(null)
      }, 350)
    )
  }

  const handleVideoFileSelect = (file: File) => {
    if (!file) return

    const isVideo =
      file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name)
    if (!isVideo) {
      setUploadError(
        'Unsupported file format. Please upload an MP4, MOV, WebM, or M4V video clip.'
      )
      return
    }
    if (file.size > MAX_VIDEO_FILE_BYTES) {
      setUploadError(
        'Video exceeds the 100 MB limit. Trim your clip to 3–5 working reps and try again.'
      )
      return
    }

    setUploadError(null)
    revokeActiveBlobUrl()
    const url = URL.createObjectURL(file)
    uploadedBlobUrlRef.current = url
    setUploadedVideoFile(file)
    setUploadedVideoUrl(url)
    setVideoFileName(file.name)
    setVideoFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB')

    const inferred = inferLiftTypeFromFileName(file.name)
    const targetLift = inferred ?? selectedLift
    if (inferred) {
      setSelectedLift(inferred)
      if (inferred === 'overhead_squat_assessment' && loadLbs === '275') {
        setLoadLbs('0')
      }
    }

    void runBiomechanicalScan(targetLift, file.name, 'file')
  }

  const handleLoadSampleVideo = (
    sampleUrl: string,
    fileName: string,
    lift: LiftType,
    faults: string[]
  ) => {
    setUploadError(null)
    revokeActiveBlobUrl()
    setUploadedVideoUrl(sampleUrl)
    setUploadedVideoFile(null)
    setVideoFileName(fileName)
    setVideoFileSize('Sample MP4')
    setSelectedLift(lift)
    setSelectedFaults(faults)

    void runBiomechanicalScan(lift, fileName, 'file', faults)
  }

  const handleLoadYouTubeUrl = (urlToLoad?: string, overrideLift?: LiftType) => {
    const raw = urlToLoad ?? youtubeUrlInput
    if (!raw.trim()) {
      setYoutubeError('Please enter a YouTube video URL or Shorts link.')
      return
    }
    const info = parseYouTubeVideoUrl(raw)
    if (!info) {
      setYoutubeError(
        'Invalid YouTube URL. Please provide a standard watch link, youtu.be shortlink, or YouTube Shorts link.'
      )
      return
    }
    setYoutubeError(null)
    setActiveYouTubeInfo(info)
    setYoutubeUrlInput(info.watchUrl)

    void runBiomechanicalScan(overrideLift ?? selectedLift, info.watchUrl, 'youtube')
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
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      copyTimerRef.current = setTimeout(() => setCopiedShareLink(false), 2500)
    }
  }

  const handleManualRunAnalysis = () => {
    if (activeInputTab === 'youtube_link' && activeYouTubeInfo) {
      void runBiomechanicalScan(selectedLift, activeYouTubeInfo.watchUrl, 'youtube')
    } else {
      void runBiomechanicalScan(selectedLift, videoFileName ?? undefined, uploadedVideoUrl ? 'file' : 'direct')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleVideoFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    if (videoPlayerRef.current) {
      videoPlayerRef.current.playbackRate = speed
    }
  }

  const handleRemoveUploadedVideo = () => {
    revokeActiveBlobUrl()
    setUploadedVideoFile(null)
    setUploadedVideoUrl(null)
    setVideoFileName(null)
    setVideoFileSize(null)
    setUploadError(null)
    setPlaybackSpeed(1.0)
  }

  const attachedFootageSummary =
    videoFileName ?? (activeYouTubeInfo ? `YouTube (${activeYouTubeInfo.videoId})` : null)

  return (
    <div style={{ display: 'grid', gap: 20, minWidth: 0 }}>
      {/* Studio Header Toolbar */}
      <div className="forge-surface-card rounded-2xl p-4 sm:p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                NASM Biomechanical Diagnostic · OPT™ Corrective Continuum
              </span>
              <span className="text-xs font-medium text-zinc-400">
                Kinetic Chain &amp; Corrective Engine
              </span>
            </div>
            <h2
              className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl"
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              }}
            >
              Kinetic Form Diagnostics &amp; Correctives Studio
            </h2>
            {usageError && (
              <p role="alert" style={{ margin: '8px 0 0', color: 'var(--error)', fontSize: 13 }}>
                {usageError}
              </p>
            )}
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
          Upload lift footage or screen kinetic joint deviations to diagnose movement compensations, map overactive/underactive muscle imbalances, and prescribe 4-phase NASM corrective protocols.
        </p>
      </div>

      {/* Monthly Form Lab Credit Meter & Coach Review Submission */}
      <FormLabRecorder
        selectedLiftLabel={LIFT_METADATA[selectedLift]?.name || 'Primary Compound Lift'}
        attachedVideoLabel={attachedFootageSummary}
        onVideoCaptured={file => handleVideoFileSelect(file)}
      />

      {/* Input Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={activeInputTab === 'video_upload'}
          onClick={() => setActiveInputTab('video_upload')}
          className={`forge-tactile-press inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-xl border px-4 py-2 text-left text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
            activeInputTab === 'video_upload'
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
              : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/15 hover:bg-[#1D212A]'
          }`}
        >
          <GaaIcon name="video-studio" size={14} tone={activeInputTab === 'video_upload' ? 'emerald' : 'slate'} /> Video Footage Upload &amp; Dropzone
        </button>

        <button
          type="button"
          aria-pressed={activeInputTab === 'youtube_link'}
          onClick={() => setActiveInputTab('youtube_link')}
          className={`forge-tactile-press inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-xl border px-4 py-2 text-left text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
            activeInputTab === 'youtube_link'
              ? 'border-rose-500/35 bg-rose-500/10 text-rose-300'
              : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/15 hover:bg-[#1D212A]'
          }`}
        >
          <span className="font-black text-rose-400" aria-hidden="true">▶</span> Share YouTube Video
        </button>

        <button
          type="button"
          aria-pressed={activeInputTab === 'manual_diagnostic'}
          onClick={() => setActiveInputTab('manual_diagnostic')}
          className={`forge-tactile-press inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-xl border px-4 py-2 text-left text-xs font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
            activeInputTab === 'manual_diagnostic'
              ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
              : 'border-white/10 bg-[#181B22] text-zinc-300 hover:border-white/15 hover:bg-[#1D212A]'
          }`}
        >
          <GaaIcon name="gear" size={14} tone={activeInputTab === 'manual_diagnostic' ? 'gold' : 'slate'} /> Biomechanical Fault Screener
        </button>
      </div>

      {/* Mode 1: Video File Upload & Dropzone */}
      {activeInputTab === 'video_upload' && (
        <div className="glass-card" style={{ padding: '20px 16px', display: 'grid', gap: 16, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: '#38BDF8', letterSpacing: '0.03em' }}>
              Lift Video Footage Analyzer
            </h3>
            {uploadedVideoFile && (
              <button
                type="button"
                onClick={handleRemoveUploadedVideo}
                style={{
                  minHeight: 44,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#F87171',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                ✕ Remove Video
              </button>
            )}
          </div>

          {uploadError && (
            <div
              role="alert"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="alert-triangle" size={14} tone="ruby" />
              <span>{uploadError}</span>
            </div>
          )}

          {!uploadedVideoUrl ? (
            <div
              onDragOver={e => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed #38BDF8' : '2px dashed rgba(255,255,255,0.2)',
                background: isDragging ? 'rgba(56,189,248,0.08)' : 'rgba(8,14,24,0.6)',
                borderRadius: 8,
                padding: '28px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                data-testid="video-critique-file-input"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                onChange={e => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) {
                    handleVideoFileSelect(file)
                  }
                }}
                hidden
              />
              <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                <GaaIcon name="video-studio" size={36} tone="cyan" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 }}>
                Drag &amp; Drop Workout Video Clip Here
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 14 }}>
                Supports MP4, MOV, WebM (up to 100MB) — squat, deadlift, bench, overhead press, RDL
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="tactile-btn"
                style={{
                  minHeight: 44,
                  background: 'rgba(56,189,248,0.2)',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  fontSize: 12.5,
                  fontWeight: 800,
                  padding: '10px 18px',
                  borderRadius: 6,
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
                  onClick={e => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/squat_good_form.mp4', 'squat_good_form.mp4', 'barbell_back_squat', [])
                  }}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    color: 'var(--success)',
                    fontSize: 11.5,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✓ Good Squat (Textbook)
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/squat_knee_valgus_fault.mp4', 'squat_knee_valgus_fault.mp4', 'barbell_back_squat', ['knee_valgus', 'excessive_forward_lean'])
                  }}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#F87171',
                    fontSize: 11.5,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Poor Squat (Valgus Fault)
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/deadlift_good_form.mp4', 'deadlift_good_form.mp4', 'barbell_deadlift', [])
                  }}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(52,211,153,0.12)',
                    border: '1px solid rgba(52,211,153,0.3)',
                    color: 'var(--success)',
                    fontSize: 11.5,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ✓ Good Deadlift (Textbook)
                </button>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleLoadSampleVideo('/samples/deadlift_lumbar_rounding_fault.mp4', 'deadlift_lumbar_rounding_fault.mp4', 'barbell_deadlift', ['lumbar_rounding'])
                  }}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#F87171',
                    fontSize: 11.5,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ Poor Deadlift (Spinal Flexion)
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
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
                  playsInline
                  style={{ width: '100%', maxHeight: 380, objectFit: 'contain' }}
                />

                {/* Video Info Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    maxWidth: 'calc(100% - 140px)',
                    background: 'rgba(8,14,24,0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: '#E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, wordBreak: 'break-all' }}>
                    <GaaIcon name="folder" size={12} tone="cyan" /> {videoFileName}
                  </span>
                  <span style={{ color: 'var(--gray)' }}>({videoFileSize})</span>
                </div>

                {/* Clear Video Button */}
                <button
                  type="button"
                  onClick={handleRemoveUploadedVideo}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    minHeight: 44,
                    background: 'rgba(239,68,68,0.28)',
                    border: '1px solid rgba(239,68,68,0.55)',
                    color: '#F87171',
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  ✕ Clear Video
                </button>
              </div>

              {/* Playback Controls & Rescan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)' }}>Playback Speed:</span>
                  {[1.0, 0.5, 0.25].map(spd => (
                    <button
                      key={spd}
                      type="button"
                      aria-pressed={playbackSpeed === spd}
                      onClick={() => handleSpeedChange(spd)}
                      style={{
                        minHeight: 44,
                        minWidth: 44,
                        background: playbackSpeed === spd ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)',
                        border: playbackSpeed === spd ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.15)',
                        color: playbackSpeed === spd ? '#38BDF8' : '#CBD5E1',
                        fontSize: 11.5,
                        fontWeight: 800,
                        padding: '8px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void runBiomechanicalScan(selectedLift, videoFileName ?? undefined)}
                  disabled={analyzing}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    padding: '10px 18px',
                    background: '#38BDF8',
                    border: 'none',
                    color: '#0A0E18',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    borderRadius: 6,
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#38BDF8' }}>
                  {scanProgress.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                  Step {scanProgress.step}/{scanProgress.totalSteps} ({scanProgress.percent}%)
                </span>
              </div>
              <progress
                className="forge-progress-bar"
                value={scanProgress.percent}
                max={100}
                aria-label="Biomechanical scan progress"
                style={{ '--progress-bar-fill': '#38BDF8' } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      )}

      {/* Mode 2: YouTube Video Link */}
      {activeInputTab === 'youtube_link' && (
        <div className="glass-card" style={{ padding: '20px 16px', display: 'grid', gap: 16, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                Share &amp; Analyze YouTube Lift Video
              </h3>
            </div>
            {activeYouTubeInfo && (
              <button
                type="button"
                onClick={handleClearYouTubeVideo}
                style={{
                  minHeight: 44,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#F87171',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: 6,
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
            <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
              <div>
                <label
                  htmlFor={youtubeInputId}
                  style={{
                    display: 'block',
                    fontSize: 11,
                    color: 'var(--gray)',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                  }}
                >
                  YouTube Video or Shorts URL
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <input
                      id={youtubeInputId}
                      name="youtubeUrl"
                      type="url"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={youtubeUrlInput}
                      onChange={e => {
                        setYoutubeUrlInput(e.target.value)
                        if (youtubeError) setYoutubeError(null)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          handleLoadYouTubeUrl()
                        }
                      }}
                      placeholder="e.g. https://youtu.be/... or https://www.youtube.com/shorts/..."
                      aria-invalid={youtubeError ? true : undefined}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        padding: '10px 14px',
                        background: 'rgba(8,14,20,0.7)',
                        border: youtubeError ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--white)',
                        fontSize: 16,
                        borderRadius: 6,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadYouTubeUrl()}
                    className="tactile-btn"
                    style={{
                      minHeight: 44,
                      padding: '10px 20px',
                      background: '#EF4444',
                      border: 'none',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-sans, Raleway), sans-serif',
                      fontSize: 12.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="video-studio" size={14} tone="white" /> Load Video
                  </button>
                </div>
              </div>

              {youtubeError && (
                <div
                  role="alert"
                  style={{ color: 'var(--error)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <GaaIcon name="alert-triangle" size={13} tone="ruby" />
                  <span>{youtubeError}</span>
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
                    handleLoadYouTubeUrl(url, 'barbell_back_squat')
                  }}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 11.5,
                    borderRadius: 6,
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
                    handleLoadYouTubeUrl(url, 'barbell_deadlift')
                  }}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 11.5,
                    borderRadius: 6,
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
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 11.5,
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  📱 YouTube Shorts Sample
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14, minWidth: 0 }}>
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
                      minHeight: 44,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '8px 10px',
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#F87171' }}>
                  {scanProgress.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                  Step {scanProgress.step}/{scanProgress.totalSteps} ({scanProgress.percent}%)
                </span>
              </div>
              <progress
                className="forge-progress-bar"
                value={scanProgress.percent}
                max={100}
                aria-label="YouTube biomechanical scan progress"
                style={{ '--progress-bar-fill': '#EF4444' } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      )}

      {/* Lift Submission & Parameter Controls */}
      <div className="glass-card" style={{ padding: '20px 16px', display: 'grid', gap: 16, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: 'var(--gold-lt)', letterSpacing: '0.03em' }}>
            Lift Parameters &amp; Biomechanical Screening
          </h3>
          {selectedLift === 'overhead_squat_assessment' && (
            <button
              type="button"
              onClick={() => setShowScreenInstructionsModal(true)}
              className="tactile-btn"
              style={{
                minHeight: 44,
                maxWidth: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 14px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                color: 'var(--gold-lt)',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                cursor: 'pointer',
                textAlign: 'left',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 220px' }}>
              <span style={{ fontSize: 18 }} aria-hidden="true">📋</span>
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
                minHeight: 44,
                maxWidth: '100%',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--gold-lt)',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                padding: '10px 14px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Camera Setup &amp; Technique Guide →
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
          <div>
            <label
              htmlFor={liftSelectId}
              style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', fontWeight: 600 }}
            >
              Compound Exercise
            </label>
            <select
              id={liftSelectId}
              name="selectedLift"
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
                minHeight: 44,
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--white)',
                fontSize: 16,
                borderRadius: 6,
                boxSizing: 'border-box',
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
            <label
              htmlFor={loadInputId}
              style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', fontWeight: 600 }}
            >
              Working Load (lbs)
            </label>
            <input
              id={loadInputId}
              name="loadLbs"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              onFocus={selectOnFocus}
              value={loadLbs}
              onChange={e => setLoadLbs(sanitizeNumericInput(e.target.value))}
              placeholder="e.g. 275"
              style={{
                width: '100%',
                minHeight: 44,
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--white)',
                fontSize: 16,
                borderRadius: 6,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor={repsInputId}
              style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.08em', fontWeight: 600 }}
            >
              Reps Observed
            </label>
            <input
              id={repsInputId}
              name="repsCount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              onFocus={selectOnFocus}
              value={repsCount}
              onChange={e => setRepsCount(sanitizeNumericInput(e.target.value))}
              placeholder="5"
              style={{
                width: '100%',
                minHeight: 44,
                padding: '9px 12px',
                background: 'rgba(8,14,20,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--white)',
                fontSize: 16,
                borderRadius: 6,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Observed Kinetic Checkpoints / Deviations */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.08em', fontWeight: 600 }}>
            Biomechanical Checkpoints to Screen
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(COMMON_FAULTS_BY_LIFT[selectedLift] ?? []).map(fault => {
              const active = selectedFaults.includes(fault.id)
              return (
                <button
                  key={fault.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleFault(fault.id)}
                  className="tactile-btn"
                  style={{
                    minHeight: 44,
                    maxWidth: '100%',
                    padding: '10px 14px',
                    background: active ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.04)',
                    border: active ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.1)',
                    color: active ? 'var(--white)' : 'var(--gray)',
                    fontSize: 12,
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    textAlign: 'left',
                  }}
                >
                  {active ? <GaaIcon name="alert-triangle" size={12} tone="ruby" /> : <span aria-hidden="true">+</span>}
                  <span>{fault.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor={notesTextareaId}
            style={{ display: 'block', fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.08em', fontWeight: 600 }}
          >
            Biomechanical Notes &amp; Joint Sensations (Optional)
          </label>
          <textarea
            id={notesTextareaId}
            name="clientNotes"
            maxLength={1000}
            value={clientNotes}
            onChange={e => setClientNotes(e.target.value)}
            placeholder="e.g. Felt minor pinch in right anterior hip capsule on reps 4 and 5."
            rows={2}
            style={{
              width: '100%',
              minHeight: 56,
              padding: '10px 12px',
              background: 'rgba(8,14,20,0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--white)',
              fontSize: 16,
              borderRadius: 6,
              resize: 'vertical',
              boxSizing: 'border-box',
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
              minHeight: 44,
              maxWidth: '100%',
              padding: '12px 22px',
              background: 'var(--gold)',
              border: 'none',
              color: 'var(--navy)',
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 12.5,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
              borderRadius: 6,
              cursor: analyzing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="lightning" size={16} tone="dark" />
            <span>
              {analyzing
                ? 'Running Biomechanical Scan...'
                : activeInputTab === 'youtube_link' && activeYouTubeInfo
                  ? 'Critique YouTube Lift Video'
                  : 'Run Biomechanical Diagnostics'}
            </span>
          </button>
        </div>
      </div>

      {/* Analysis Output Diagnostic Report */}
      {critique && (
        <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
          {/* Scorecard Hero */}
          <div
            className="forge-surface-card rounded-2xl p-4 sm:p-6"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div className="flex items-center gap-4">
              <TelemetryRingGauge
                score={critique.overallFormScore}
                max={100}
                size={68}
                strokeWidth={5}
                showMax
                tone={
                  critique.overallFormScore >= 85
                    ? 'emerald'
                    : critique.overallFormScore >= 70
                      ? 'amber'
                      : 'coral'
                }
                label={`Technical Execution Score ${critique.overallFormScore} out of 100`}
              />
              <div>
                <div className="forge-eyebrow-micro">
                  Technical Execution Score
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 tabular-nums">
                  <span className="font-mono text-3xl font-extrabold leading-none text-white sm:text-4xl">
                    {critique.overallFormScore}
                    <span className="text-base font-medium text-zinc-400">/100</span>
                  </span>
                  <span
                    data-testid="critique-rating-badge"
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] ${getRatingBadgeClasses(
                      critique.rating
                    )}`}
                  >
                    {critique.rating}
                  </span>
                </div>
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
                      minHeight: 44,
                      padding: '8px 10px',
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
                  minHeight: 44,
                  maxWidth: '100%',
                  padding: '10px 16px',
                  background: copiedShareLink ? 'rgba(52,211,153,0.2)' : 'rgba(197,160,89,0.15)',
                  border: `1px solid ${copiedShareLink ? 'var(--success)' : 'var(--gold)'}`,
                  color: copiedShareLink ? 'var(--success)' : 'var(--gold-lt)',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <GaaIcon name={copiedShareLink ? 'check' : 'share'} size={14} tone={copiedShareLink ? 'emerald' : 'gold'} />
                <span>{copiedShareLink ? 'Critique & Video Link Copied!' : 'Share Critique & Video Link'}</span>
              </button>
            </div>
          </div>

          {/* Kinetic Checkpoint Breakdown */}
          <div className="glass-card" style={{ padding: '20px 16px', minWidth: 0 }}>
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
          <div className="glass-card" style={{ padding: '20px 16px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                NASM OPT™ Prescribed Protocol
              </span>
              <span style={{ color: 'var(--white)', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, letterSpacing: '0.03em' }}>
                4-Phase Corrective Continuum
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
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
