'use client'

import React, { useState, useEffect, useRef } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import { StructuredSoapOutput, SoapNotesMode } from '@/lib/ai-soap-notes'

interface VoiceSoapNotesModalProps {
  isOpen: boolean
  sessionId: string
  clientName?: string
  existingNotes?: string
  onClose: () => void
  onApplyNotes: (formattedNotes: string) => Promise<void>
}

export default function VoiceSoapNotesModal({
  isOpen,
  sessionId,
  clientName = 'Athlete',
  existingNotes = '',
  onClose,
  onApplyNotes,
}: VoiceSoapNotesModalProps) {
  const [rawInput, setRawInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState<SoapNotesMode>('clinical_soap')
  const [soapResult, setSoapResult] = useState<StructuredSoapOutput | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null)

  useEffect(() => {
    if (isOpen && existingNotes && !rawInput) {
      setRawInput(existingNotes)
    }
  }, [isOpen, existingNotes, rawInput])

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  if (!isOpen) return null

  const startVoiceDictation = () => {
    setErrorMessage(null)
    const windowSpeech = window as unknown as {
      SpeechRecognition?: new () => {
        continuous: boolean
        interimResults: boolean
        lang: string
        onstart: () => void
        onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void
        onerror: (event: { error: string }) => void
        onend: () => void
        start: () => void
        stop: () => void
      }
      webkitSpeechRecognition?: new () => {
        continuous: boolean
        interimResults: boolean
        lang: string
        onstart: () => void
        onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void
        onerror: (event: { error: string }) => void
        onend: () => void
        start: () => void
        stop: () => void
      }
    }
    const SpeechRecognition = windowSpeech.SpeechRecognition || windowSpeech.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage('Speech-to-text is not supported in this browser. You can type your notes directly below.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' '
        }
        setRawInput(transcript.trim())
      }

      recognition.onerror = (event: { error: string }) => {
        setIsRecording(false)
        if (event.error !== 'no-speech') {
          setErrorMessage(`Mic error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err: unknown) {
      setIsRecording(false)
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Microphone access failed.')
    }
  }

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsRecording(false)
    }
  }

  const handleSynthesize = async () => {
    if (!rawInput.trim()) {
      setErrorMessage('Please dictate or type session notes before synthesizing.')
      return
    }

    setIsSynthesizing(true)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}/soap-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: rawInput,
          clientName,
          mode,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to synthesize SOAP notes')
      }

      setSoapResult(data.data)
      setActiveTab('preview')
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Synthesis failed. Please try again.')
    } finally {
      setIsSynthesizing(false)
    }
  }

  const handleApplyAndSave = async () => {
    const finalContent = soapResult ? soapResult.formattedNotes : rawInput
    if (!finalContent.trim()) return

    setIsSaving(true)
    try {
      await onApplyNotes(finalContent)
      onClose()
    } catch (err: unknown) {
      const errObj = err as { message?: string }
      setErrorMessage(errObj?.message || 'Failed to save notes')
    } finally {
      setIsSaving(false)
    }
  }

  const quickCues = [
    'Squatted 225x5x3, RPE 8, slight knee valgus set 3',
    'High energy day, completed all core & balance protocols',
    'Reported tight right hip flexor during warmup SMR',
    'Advised adding 5 lbs to bench press next microcycle',
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.84)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100050,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0D1624 0%, #080E16 100%)',
          border: '1.5px solid rgba(197, 160, 89, 0.4)',
          borderRadius: 14,
          width: 'min(720px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'grid',
          gap: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(197, 160, 89, 0.15)',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', top: -15, right: -15, zIndex: 0 }}>
          <GaaMasterWatermarkSeal size={140} opacity={0.06} subtitle="CLINICAL S.O.A.P. RECORD" />
        </div>

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(197, 160, 89, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GaaIcon name="message" size={18} tone="gold" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'Raleway, sans-serif', fontWeight: 800, color: '#FFFFFF' }}>
                AI Voice-to-Clinical S.O.A.P. Notes
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gray)' }}>
                {clientName} · Clinical Sports Science Documentation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gray)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
            }}
            aria-label="Close"
          >
            <GaaIcon name="close" size={16} tone="slate" />
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)' }}>
            Format Mode:
          </span>
          {(['clinical_soap', 'executive_summary', 'action_directives'] as SoapNotesMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="tactile-btn"
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                background: mode === m ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: mode === m ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: mode === m ? 'var(--gold-lt)' : 'var(--gray)',
                fontSize: 11.5,
                fontWeight: mode === m ? 700 : 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Switcher: Dictate/Edit vs Structured S.O.A.P. Preview */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', gap: 12 }}>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            style={{
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'edit' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'edit' ? '#FFFFFF' : 'var(--gray)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            1. Dictate / Raw Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            style={{
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'preview' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'preview' ? '#FFFFFF' : 'var(--gray)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>2. S.O.A.P. Clinical Result</span>
            {soapResult && (
              <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: 'var(--success)', color: '#080E14', fontWeight: 800 }}>
                Synthesized
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Dictate & Edit */}
        {activeTab === 'edit' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceDictation : startVoiceDictation}
                  className="tactile-btn"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: isRecording ? 'rgba(239, 68, 68, 0.25)' : 'rgba(197, 160, 89, 0.15)',
                    border: isRecording ? '1.5px solid #EF4444' : '1px solid var(--gold)',
                    color: isRecording ? '#FCA5A5' : 'var(--gold-lt)',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isRecording ? '0 0 16px rgba(239, 68, 68, 0.4)' : 'none',
                  }}
                >
                  <GaaIcon name={isRecording ? 'stop' : 'mic'} size={14} tone={isRecording ? 'ruby' : 'inherit'} />
                  <span>{isRecording ? 'Stop Recording (Listening...)' : 'Click to Speak Notes'}</span>
                </button>

                {isRecording && (
                  <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, animation: 'pulse 1s infinite' }}>
                    ● Mic Active
                  </span>
                )}
              </div>

              <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                Speak freely: lifts, sets, reps, energy, and joint cues.
              </span>
            </div>

            <textarea
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder="Dictate or type raw session notes here... (e.g. 'Back squats 225x5x3, RPE 8. Left knee caved slightly on rep 4 set 3. Athlete felt strong, energy 8/10. Next time progress to 230 lbs and cue external knee torque.')"
              rows={6}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: '#060B12',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                color: '#FFFFFF',
                fontSize: 13,
                lineHeight: 1.6,
                boxSizing: 'border-box',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'Raleway, sans-serif',
              }}
            />

            {/* Quick Cues Prompts */}
            <div>
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <GaaIcon name="lightbulb" size={11} tone="gold" />
                <span>Quick Context Inserts:</span>
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {quickCues.map((cue, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRawInput(prev => (prev ? `${prev}. ${cue}` : cue))}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 14,
                      color: 'var(--gray)',
                      fontSize: 11,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    + {cue}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: S.O.A.P. Clinical Result */}
        {activeTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {soapResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Visual SOAP Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      S — Subjective
                    </div>
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      {soapResult.subjective}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      O — Objective
                    </div>
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      {soapResult.objective}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(212, 160, 23, 0.06)', border: '1px solid rgba(212, 160, 23, 0.25)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      A — Assessment
                    </div>
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      {soapResult.assessment}
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      P — Plan & Prescription
                    </div>
                    <div style={{ fontSize: 12.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      {soapResult.plan}
                    </div>
                  </div>
                </div>

                {/* Direct Editable Markdown Text Area */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 700, marginBottom: 4 }}>
                    Formatted Notes to Apply to Session Record
                  </label>
                  <textarea
                    value={soapResult.formattedNotes}
                    onChange={e => setSoapResult({ ...soapResult, formattedNotes: e.target.value })}
                    rows={7}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#060B12',
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                      borderRadius: 8,
                      color: '#FFFFFF',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray)' }}>
                <p style={{ margin: 0, fontSize: 13 }}>No clinical notes synthesized yet.</p>
                <p style={{ margin: '6px 0 0', fontSize: 12 }}>Dictate or enter notes on the first tab, then click &quot;Synthesize S.O.A.P. Notes&quot;.</p>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: 6, color: '#FCA5A5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="alert-triangle" size={13} tone="ruby" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 14 }}>
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing || isRecording || !rawInput.trim()}
            className="tactile-btn"
            style={{
              padding: '10px 18px',
              borderRadius: 6,
              background: 'rgba(197, 160, 89, 0.15)',
              border: '1px solid var(--gold)',
              color: 'var(--gold-lt)',
              fontSize: 13,
              fontWeight: 700,
              cursor: isSynthesizing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              opacity: isSynthesizing || !rawInput.trim() ? 0.6 : 1,
            }}
          >
            <GaaIcon name="sparkles" size={15} tone="gold" />
            <span>{isSynthesizing ? 'Synthesizing S.O.A.P. with AI...' : 'Synthesize Clinical S.O.A.P.'}</span>
          </button>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              className="tactile-btn"
              disabled={isSaving}
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyAndSave}
              disabled={isSaving || (!soapResult && !rawInput.trim())}
              className="tactile-btn"
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                border: 'none',
                borderRadius: 6,
                color: '#080E14',
                fontSize: 13,
                fontWeight: 800,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(197, 160, 89, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: isSaving || (!soapResult && !rawInput.trim()) ? 0.6 : 1,
              }}
            >
              <GaaIcon name="check" size={14} style={{ color: '#080E14', stroke: '#080E14' }} />
              <span>{isSaving ? 'Applying & Saving...' : 'Apply to Session & Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

