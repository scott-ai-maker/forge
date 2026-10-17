'use client'

import React, { useState, useEffect, useRef } from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import { UniversalVoiceRecorder } from '@/lib/wav-audio-recorder'
import {
  SanctuaryAudioNote,
  SanctuaryAudioCategory,
  createCoachAudioNote,
  saveSanctuaryAudioNote,
  getStoredSanctuaryAudioNotes,
  deleteSanctuaryAudioNote,
} from '@/lib/sanctuary-audio-notes-engine'

export interface CoachSanctuaryAudioNoteModalProps {
  isOpen: boolean
  onClose: () => void
  initialExerciseName?: string
  initialClientName?: string
  initialClientId?: string
}

export default function CoachSanctuaryAudioNoteModal({
  isOpen,
  onClose,
  initialExerciseName,
  initialClientName,
  initialClientId,
}: CoachSanctuaryAudioNoteModalProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'library'>('record')

  // Recording State
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordedDataUrl, setRecordedDataUrl] = useState<string | null>(null)
  const [recordedDuration, setRecordedDuration] = useState(0)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState(
    initialExerciseName ? `${initialExerciseName}: Biomechanical Cue` : 'Coach Scott: Focus Cue'
  )
  const [category, setCategory] = useState<SanctuaryAudioCategory>('movement_cue')
  const [exerciseScope, setExerciseScope] = useState(initialExerciseName || '')
  const [clientScope, setClientScope] = useState(initialClientId || 'all')
  const [transcript, setTranscript] = useState('')
  const [priority, setPriority] = useState<'high' | 'normal'>('high')
  const [savedSuccessMessage, setSavedSuccessMessage] = useState(false)

  // Audio Playback Preview State
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  // Recorders
  const recorderRef = useRef<UniversalVoiceRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Library State
  const [libraryNotes, setLibraryNotes] = useState<SanctuaryAudioNote[]>([])

  useEffect(() => {
    if (isOpen) {
      setLibraryNotes(getStoredSanctuaryAudioNotes())
      setSavedSuccessMessage(false)
      setRecordingError(null)
    }
  }, [isOpen])

  // Stop recording on unmount or close
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
      }
    }
  }, [])

  if (!isOpen) return null

  const handleStartRecording = async () => {
    try {
      setRecordingError(null)
      setRecordedDataUrl(null)
      setRecordSeconds(0)

      const recorder = new UniversalVoiceRecorder()
      recorderRef.current = recorder

      await recorder.start()
      setIsRecording(true)

      const startTime = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setRecordSeconds(elapsed)

        // Hard cap at 60 seconds
        if (elapsed >= 60) {
          void handleStopRecording()
        }
      }, 500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setRecordingError(msg)
      setIsRecording(false)
    }
  }

  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      const result = await recorderRef.current.stop()
      setRecordedDataUrl(result.dataUrl)
      setRecordedDuration(result.durationSec)
      setIsRecording(false)

      // Auto-generate transcript placeholder if empty
      if (!transcript) {
        setTranscript(
          `Coach Scott Gordon audio memo for ${exerciseScope || 'training session'}. Maximize mechanical tension, keep hands on the bar, and eliminate gym distractions.`
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to finalize audio recording'
      setRecordingError(msg)
      setIsRecording(false)
    }
  }

  const handleCancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
    setRecordSeconds(0)
    setRecordedDataUrl(null)
  }

  const handleTogglePreview = () => {
    if (!recordedDataUrl) return

    if (isPreviewPlaying && previewAudioRef.current) {
      previewAudioRef.current.pause()
      setIsPreviewPlaying(false)
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(recordedDataUrl)
        previewAudioRef.current.onended = () => setIsPreviewPlaying(false)
      } else {
        previewAudioRef.current.src = recordedDataUrl
      }
      void previewAudioRef.current.play()
      setIsPreviewPlaying(true)
    }
  }

  const handleSaveAndDispatch = () => {
    if (!title.trim()) {
      setRecordingError('Please enter a note title.')
      return
    }

    const note = createCoachAudioNote({
      title: title.trim(),
      transcript: transcript.trim() || 'Coach Scott Gordon voice instruction.',
      category,
      durationSeconds: recordedDuration || Math.max(15, recordSeconds) || 30,
      exerciseScope: exerciseScope.trim() || undefined,
      clientScope: clientScope === 'all' ? 'all' : clientScope,
      audioDataUrl: recordedDataUrl || undefined,
      priority,
    })

    const updated = saveSanctuaryAudioNote(note)
    setLibraryNotes(updated)
    setSavedSuccessMessage(true)

    // Reset draft after 1.5s
    setTimeout(() => {
      setSavedSuccessMessage(false)
      setActiveTab('library')
    }, 1200)
  }

  const handleDeleteNote = (noteId: string) => {
    deleteSanctuaryAudioNote(noteId)
    setLibraryNotes(getStoredSanctuaryAudioNotes())
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-audio-notes-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          background: 'linear-gradient(180deg, #0F172A 0%, #080E18 100%)',
          border: '1.5px solid rgba(212, 175, 55, 0.5)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(212, 175, 55, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#FFFFFF',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#0A0E18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              SG
            </div>
            <div>
              <h3
                id="coach-audio-notes-title"
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                }}
              >
                Sanctuary In-Ear Voice Studio
              </h3>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gold, #D4AF37)',
                  fontFamily: 'var(--font-telemetry)',
                  letterSpacing: '0.04em',
                }}
              >
                Coach Scott Gordon · Zero-Distraction Audio Memos (Max 60s)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Voice Studio"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
            }}
          >
            <ForgeIcon name="close" size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.15)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === 'record' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'record' ? '2px solid #D4AF37' : '2px solid transparent',
              color: activeTab === 'record' ? 'var(--gold-lt, #F3E5AB)' : '#94A3B8',
              fontWeight: 700,
              fontSize: 12,
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <ForgeIcon name="mic" size={13} />
            <span>Record New Memo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === 'library' ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'library' ? '2px solid #D4AF37' : '2px solid transparent',
              color: activeTab === 'library' ? 'var(--gold-lt, #F3E5AB)' : '#94A3B8',
              fontWeight: 700,
              fontSize: 12,
              fontFamily: 'var(--font-heading)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <ForgeIcon name="headphones" size={13} />
            <span>Dispatched Library ({libraryNotes.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {activeTab === 'record' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Error Notice */}
              {recordingError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#FCA5A5',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ForgeIcon name="alert-triangle" size={14} />
                  <span>{recordingError}</span>
                </div>
              )}

              {/* Success Notice */}
              {savedSuccessMessage && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    color: '#6EE7B7',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <ForgeIcon name="check" size={16} />
                  <span>Audio Memo dispatched directly to athlete rest dock!</span>
                </div>
              )}

              {/* ── RECORDING CONSOLE ── */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: isRecording ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 12,
                  boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.25)' : 'none',
                }}
              >
                {/* Timer Display */}
                <div
                  style={{
                    fontFamily: 'var(--font-telemetry)',
                    fontSize: 32,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: isRecording ? '#EF4444' : recordedDataUrl ? '#34D399' : '#CBD5E1',
                  }}
                >
                  {isRecording
                    ? `0:${String(recordSeconds).padStart(2, '0')} / 0:60`
                    : recordedDataUrl
                    ? `0:${String(recordedDuration).padStart(2, '0')} Recorded`
                    : '0:00 / 0:60'}
                </div>

                <div style={{ fontSize: 11, color: '#94A3B8' }}>
                  {isRecording
                    ? 'Recording live PCM WAV audio... Speak clearly into your microphone.'
                    : recordedDataUrl
                    ? 'Voice memo ready. Review preview or re-record below.'
                    : 'Tap Record to capture up to 60 seconds of focused coaching guidance.'}
                </div>

                {/* Record Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  {!isRecording ? (
                    <button
                      type="button"
                      data-testid="start-record-btn"
                      onClick={handleStartRecording}
                      className="tactile-btn"
                      style={{
                        background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                        border: '1px solid #EF4444',
                        color: '#FFFFFF',
                        padding: '10px 20px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      <ForgeIcon name="mic" size={14} />
                      <span>{recordedDataUrl ? 'Re-Record Voice' : 'Start Recording'}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        data-testid="stop-record-btn"
                        onClick={handleStopRecording}
                        className="tactile-btn"
                        style={{
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          border: '1px solid #10B981',
                          color: '#0A0E18',
                          padding: '10px 20px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: 'var(--font-heading)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <ForgeIcon name="check" size={14} />
                        <span>Stop & Save Audio</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelRecording}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#94A3B8',
                          padding: '10px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Preview Playback Button */}
                  {recordedDataUrl && !isRecording && (
                    <button
                      type="button"
                      data-testid="preview-record-btn"
                      onClick={handleTogglePreview}
                      style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid #D4AF37',
                        color: 'var(--gold-lt)',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <ForgeIcon name={isPreviewPlaying ? 'pause' : 'play'} size={12} />
                      <span>{isPreviewPlaying ? 'Pause Preview' : 'Play Preview'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── METADATA & DISPATCH CONFIG ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Note Title */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Memo Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Squat Wedge & 360° Brace"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as SanctuaryAudioCategory)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#0B132B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="movement_cue">Biomechanical Movement Cue</option>
                    <option value="cns_recovery">CNS Vagal Down-Regulation</option>
                    <option value="mental_focus">Sanctuary Mental Fortitude</option>
                    <option value="workout_briefing">Coach Session Briefing</option>
                    <option value="personal_feedback">Personal Voice Memo</option>
                  </select>
                </div>

                {/* Target Exercise Scope */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Movement Scope (Optional)
                  </label>
                  <input
                    type="text"
                    value={exerciseScope}
                    onChange={e => setExerciseScope(e.target.value)}
                    placeholder="e.g. Barbell Back Squat"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Target Athlete Scope */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Athlete Target
                  </label>
                  <select
                    value={clientScope}
                    onChange={e => setClientScope(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#0B132B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="all">All Forge Athletes</option>
                    {initialClientId && (
                      <option value={initialClientId}>
                        {initialClientName || 'Designated Client'}
                      </option>
                    )}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Dispatch Priority
                  </label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as 'high' | 'normal')}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#0B132B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="high">High Priority (Immediate Next Rest)</option>
                    <option value="normal">Standard Queue</option>
                  </select>
                </div>

                {/* Transcript */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94A3B8',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-telemetry)',
                    }}
                  >
                    Transcript / In-Ear Script
                  </label>
                  <textarea
                    rows={3}
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="Enter transcript or guidance text for athlete..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: 12,
                      lineHeight: 1.4,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              {/* Primary Dispatch Action */}
              <button
                type="button"
                data-testid="dispatch-sanctuary-note-btn"
                onClick={handleSaveAndDispatch}
                className="tactile-btn"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                  border: '1px solid #D4AF37',
                  color: '#0A0E18',
                  padding: '12px 20px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)',
                }}
              >
                <ForgeIcon name="headphones" size={14} />
                <span>Dispatch To Athlete Rest Dock</span>
              </button>
            </div>
          )}

          {activeTab === 'library' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  fontFamily: 'var(--font-telemetry)',
                  marginBottom: 4,
                }}
              >
                Active sanctuary voice memos available to athletes in rest intervals:
              </div>

              {libraryNotes.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {item.title}
                      </span>
                      {item.exerciseScope && (
                        <span
                          style={{
                            fontSize: 9.5,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: 'rgba(212, 175, 55, 0.15)',
                            color: 'var(--gold-lt)',
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                          }}
                        >
                          {item.exerciseScope}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 9.5,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38BDF8',
                        }}
                      >
                        {item.durationSeconds}s
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: '#CBD5E1',
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{item.transcript}&rdquo;
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(item.id)}
                      aria-label={`Delete memo ${item.title}`}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#F87171',
                        padding: '6px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ForgeIcon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
