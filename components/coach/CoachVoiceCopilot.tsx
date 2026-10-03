'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { parseVoiceCoachCommand, ParsedVoiceCommand } from '@/lib/coach-voice-copilot'

interface CoachVoiceCopilotProps {
  onCommand: (command: ParsedVoiceCommand) => void
  isEnabled?: boolean
}

// Web Speech API interface definitions
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
      isFinal: boolean
    }
    length: number
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export default function CoachVoiceCopilot({ onCommand, isEnabled = true }: CoachVoiceCopilotProps) {
  const [isListening, setIsListening] = useState(false)
  const [lastTranscript, setLastTranscript] = useState<string>('')
  const [lastActionFeedback, setLastActionFeedback] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isEnabledRef = useRef(isEnabled)
  const onCommandRef = useRef(onCommand)

  useEffect(() => {
    onCommandRef.current = onCommand
  }, [onCommand])

  useEffect(() => {
    isEnabledRef.current = isEnabled
    if (!isEnabled && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore
      }
      setIsListening(false)
    } else if (isEnabled && recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        // Ignore
      }
    }
  }, [isEnabled, isListening])

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    const results = event.results
    if (!results || results.length === 0) return

    const lastResult = results[results.length - 1]
    const transcript = lastResult[0]?.transcript?.trim() ?? ''
    if (!transcript) return

    setLastTranscript(transcript)

    if (lastResult.isFinal) {
      const parsed = parseVoiceCoachCommand(transcript)
      if (parsed.type !== 'UNKNOWN') {
        if (parsed.type === 'LOG_SET') {
          setLastActionFeedback(`Logged: ${parsed.weightLbs ?? 0} lbs × ${parsed.reps ?? 0} reps`)
        } else if (parsed.type === 'START_REST') {
          setLastActionFeedback(`Rest started: ${parsed.restSeconds}s`)
        } else if (parsed.type === 'SPOKEN_CUE') {
          setLastActionFeedback(`Cue: "${parsed.cueText}"`)
        } else {
          setLastActionFeedback(`Action: ${parsed.type.replace('_', ' ')}`)
        }
        onCommandRef.current?.(parsed)
        setTimeout(() => setLastActionFeedback(null), 4000)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }

    const SpeechClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition

    if (!SpeechClass) {
      setSupported(false)
      return
    }

    try {
      const recognition = new SpeechClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = handleResult

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        if (isEnabledRef.current) {
          try {
            recognition.start()
            setIsListening(true)
          } catch {
            setIsListening(false)
          }
        } else {
          setIsListening(false)
        }
      }

      recognitionRef.current = recognition
      if (isEnabledRef.current) {
        try {
          recognition.start()
          setIsListening(true)
        } catch {
          // Ignore
        }
      }
    } catch {
      setSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // Ignore
        }
      }
    }
  }, [handleResult])

  if (!supported || !isEnabled) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(10,16,28,0.92)',
        border: '1px solid rgba(212,160,23,0.4)',
        borderRadius: 20,
        padding: '6px 14px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: isListening ? '#10B981' : '#F59E0B',
            boxShadow: isListening ? '0 0 8px #10B981' : 'none',
            animation: isListening ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)', fontWeight: 800 }}>
          Voice Co-Pilot
        </span>
      </div>

      {lastActionFeedback ? (
        <span style={{ fontSize: 12, color: '#34D399', fontWeight: 700, animation: 'fadeIn 0.3s' }}>
          {lastActionFeedback}
        </span>
      ) : lastTranscript ? (
        <span style={{ fontSize: 11.5, color: '#FFFFFF', opacity: 0.85, fontStyle: 'italic', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          &ldquo;{lastTranscript}&rdquo;
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--gray)' }}>
          Listening for &ldquo;Log 225 for 8&rdquo; or &ldquo;Rest 90s&rdquo;...
        </span>
      )}
    </div>
  )
}
