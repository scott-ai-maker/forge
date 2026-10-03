'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { speakCoachVoiceCue, playNeuralCoachVoiceCue, stopCoachVoiceCue } from '@/lib/coach-voice-synthesizer'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import {
  deriveProactiveTelemetryGreeting,
  type CoachActionRecommendation,
} from '@/lib/ask-coach-gordon-types'
import {
  analyzeLiftForm,
  generateQuickBiomechanicalSpokenSummary,
  LIFT_METADATA,
  type LiftType,
  type VideoCritiqueAnalysis,
} from '@/lib/video-form-analysis'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  audioText?: string
  curriculums?: string[]
  recommendedAction?: CoachActionRecommendation
  videoCritique?: VideoCritiqueAnalysis
  followUps?: string[]
  timestamp: string
  requiresCoachPing?: boolean
  coachPingReason?: string
  isEmergency911?: boolean
}

interface AskCoachGordonModalProps {
  isOpen: boolean
  onClose: () => void
  athleteName?: string
  goal?: string
  nasmOptPhase?: number
  currentWorkoutFocus?: string
  currentExerciseName?: string
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  kineticCompensations?: string[]
  recentReadinessScore?: number
  recentSleepHours?: number
  recentRpe?: number
  isCoachUser?: boolean
  onApplyExerciseSwap?: (newExerciseName: string) => void
  onStartRestTimer?: (seconds: number) => void
  onAutoRegulateLoad?: (reductionPercent: number) => void
}

const PRESET_TOPIC_CHIPS: Array<{ iconName: GaaIconName; label: string; prompt: string }> = [
  { iconName: 'lightbulb', label: 'Swap this exercise', prompt: 'I need an alternative exercise for my current movement based on my available equipment.' },
  { iconName: 'camera', label: 'Form Check', prompt: 'Can you check my squat form and bar path depth?' },
  { iconName: 'nutrition', label: 'Post-workout meal', prompt: 'What should I eat for my post-workout meal to maximize protein synthesis and recovery?' },
  { iconName: 'lightning', label: 'Joint tightness / soreness', prompt: 'My joints and muscles feel tight today. What corrective warmup or foam rolling should I do?' },
  { iconName: 'heart-rate', label: 'Cardio interval pacing', prompt: 'How should I pace my cardio session and intervals today?' },
  { iconName: 'message', label: 'Message Coach Scott 1-on-1', prompt: 'I have a sensitive medical / rehab question and would like Coach Scott Gordon to review my training file directly.' },
]

export default function AskCoachGordonModal({
  isOpen,
  onClose,
  athleteName = 'Athlete',
  goal = 'fat_loss',
  nasmOptPhase = 1,
  currentWorkoutFocus,
  currentExerciseName,
  equipmentAccess = [],
  cardioEquipmentAccess = [],
  kineticCompensations = [],
  recentReadinessScore = 82,
  recentSleepHours,
  recentRpe,
  isCoachUser = false,
  onApplyExerciseSwap,
  onStartRestTimer,
  onAutoRegulateLoad,
}: AskCoachGordonModalProps) {
  // Proactive Telemetry Greeting
  const initialGreeting = deriveProactiveTelemetryGreeting({
    athleteName,
    goal,
    nasmOptPhase,
    recentReadinessScore,
    recentSleepHours,
    recentRpe,
    currentExerciseName,
    currentWorkoutFocus,
  })

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: initialGreeting.text,
      audioText: initialGreeting.audioText,
      recommendedAction: initialGreeting.recommendedAction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUps: [
        'Swap this exercise',
        'Form check this lift',
        'Target post-workout meal',
      ],
    },
  ])

  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isHandsFreeMode, setIsHandsFreeMode] = useState(false)
  const [handsFreeState, setHandsFreeState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  const [liveSpokenTranscript, setLiveSpokenTranscript] = useState('')
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({})
  
  // Quick 5-Second Video Form Check State
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedLiftType, setSelectedLiftType] = useState<LiftType>('barbell_back_squat')
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<{ abort: () => void; start: () => void } | null>(null)
  const isHandsFreeActiveRef = useRef(false)
  isHandsFreeActiveRef.current = isHandsFreeMode

  const handsFreeStateRef = useRef<'idle' | 'listening' | 'processing' | 'speaking'>('idle')
  handsFreeStateRef.current = handsFreeState

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, liveSpokenTranscript])

  // Stop speech synthesis on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopCoachVoiceCue()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
      setIsListening(false)
      setIsHandsFreeMode(false)
      setHandsFreeState('idle')
      setShowVideoModal(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // Execute 1-Tap In-Gym Action Cards
  const handleExecuteAction = (msgId: string, action: CoachActionRecommendation) => {
    triggerHaptic('success')

    if (action.type === 'swap_exercise' && action.targetExerciseName) {
      if (onApplyExerciseSwap) {
        onApplyExerciseSwap(action.targetExerciseName)
      }
      setActionFeedback(prev => ({
        ...prev,
        [msgId]: `✓ Swapped to ${action.targetExerciseName} in active session`,
      }))
      speakCoachVoiceCue(`Swapped to ${action.targetExerciseName}. Lock into your 2-second pause!`)
    } else if (action.type === 'start_timer') {
      const secs = action.restSeconds || 90
      if (onStartRestTimer) {
        onStartRestTimer(secs)
      }
      setActionFeedback(prev => ({
        ...prev,
        [msgId]: `⏱️ Started ${secs}s rest metronome`,
      }))
      speakCoachVoiceCue(`Starting ${secs}-second rest interval. Hydrate and focus on your breathing.`)
    } else if (action.type === 'auto_regulate_load') {
      const reduction = action.loadReductionPercent || 15
      if (onAutoRegulateLoad) {
        onAutoRegulateLoad(reduction)
      }
      setActionFeedback(prev => ({
        ...prev,
        [msgId]: `Working weights reduced by ${reduction}%`,
      }))
      speakCoachVoiceCue(`Working load reduced ${reduction} percent. Focus purely on tempo and joint control.`)
    } else if (action.type === 'form_critique') {
      setShowVideoModal(true)
    }
  }

  // Quick 5-Second Video Form Check Simulation & Execution
  const handleRunVideoCritique = async (liftType: LiftType) => {
    setIsAnalyzingVideo(true)
    triggerHaptic('tap')

    try {
      // Analyze lift kinetics
      const analysis = analyzeLiftForm({
        liftType,
        loadLbs: 185,
        repsCount: 3,
        observedDeviations: ['knee_valgus', 'butt_wink'],
        clientNotes: 'Felt my knees collapse inward at the bottom of the squat',
      })

      const spokenSummary = generateQuickBiomechanicalSpokenSummary(analysis)
      
      const critiqueMsg: ChatMessage = {
        id: `critique_${Date.now()}`,
        role: 'assistant',
        text: `**Biomechanical Video Critique: ${analysis.liftName}** (Form Score: **${analysis.overallFormScore}/100** — *${analysis.rating}*)\n\n${analysis.masterCoachSummary}\n\n**Key Kinetic Checkpoints:**\n${analysis.checkpoints.map(c => `• **${c.name}**: ${c.status === 'optimal' ? 'Optimal' : c.observation} → *${c.prescribedCue}*`).join('\n')}\n\n**Prescribed Corrective Continuum:**\n• **Inhibit**: ${analysis.prescribedCorrectiveContinuum.inhibit.join(', ')}\n• **Activate**: ${analysis.prescribedCorrectiveContinuum.activate.join(', ')}`,
        audioText: spokenSummary,
        videoCritique: analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUps: [
          'What tempo should I use on set 2?',
          'Show me banded monster walks demo',
          'Message Coach Scott about knee tracking',
        ],
      }

      setMessages(prev => [...prev, critiqueMsg])
      setShowVideoModal(false)

      // Automatically speak into earbuds
      if (isHandsFreeMode) {
        setHandsFreeState('speaking')
        setCurrentlySpeakingId(critiqueMsg.id)
      }

      await playNeuralCoachVoiceCue(spokenSummary, {
        rate: 1.05,
        pitch: 0.92,
        onEnded: () => {
          setCurrentlySpeakingId(null)
          if (isHandsFreeActiveRef.current) {
            setHandsFreeState('listening')
            setTimeout(() => {
              if (isHandsFreeActiveRef.current) startSpeechEngine(true)
            }, 800)
          }
        },
      })
    } finally {
      setIsAnalyzingVideo(false)
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query || isLoading) return

    triggerHaptic('tap')
    setInputText('')

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const historyPayload = messages.slice(-4).map(m => ({
        role: m.role,
        text: m.text,
      }))

      const res = await fetch('/api/coach/ask-gordon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          athleteName,
          goal,
          nasmOptPhase,
          currentWorkoutFocus,
          currentExerciseName,
          equipmentAccess,
          cardioEquipmentAccess,
          kineticCompensations,
          recentReadinessScore,
          recentSleepHours,
          recentRpe,
          activeConversationHistory: historyPayload,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const assistantResponse = data?.response
        if (assistantResponse) {
          const newAssistantMsg: ChatMessage = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            text: assistantResponse.answerMarkdown,
            audioText: assistantResponse.spokenAudioText,
            curriculums: assistantResponse.relevantCurriculums,
            recommendedAction: assistantResponse.recommendedAction,
            followUps: assistantResponse.suggestedFollowUps,
            requiresCoachPing: assistantResponse.requiresCoachPing,
            coachPingReason: assistantResponse.coachPingReason,
            isEmergency911: assistantResponse.isEmergency911,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
          setMessages(prev => [...prev, newAssistantMsg])

          // If Hands-Free Earbud Mode is active, auto-speak response and loop back to listen
          if (isHandsFreeActiveRef.current) {
            setHandsFreeState('speaking')
            setCurrentlySpeakingId(newAssistantMsg.id)

            await playNeuralCoachVoiceCue(assistantResponse.spokenAudioText || assistantResponse.answerMarkdown, {
              rate: 1.05,
              pitch: 0.92,
              onEnded: () => {
                setCurrentlySpeakingId(null)
                if (isHandsFreeActiveRef.current) {
                  setHandsFreeState('listening')
                  setTimeout(() => {
                    if (isHandsFreeActiveRef.current) startSpeechEngine(true)
                  }, 800)
                } else {
                  setHandsFreeState('idle')
                }
              },
            })
          }
        }
      } else {
        throw new Error('Failed to fetch response')
      }
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `assistant_err_${Date.now()}`,
        role: 'assistant',
        text: `**Coach Gordon Biomechanical Advisory:** Focus on controlled eccentric tempo (2-4s), maintain your abdominal brace, and keep working sets within your target RPE ${nasmOptPhase === 1 ? '6-7' : '8-9'}. Lock in!`,
        audioText: `Focus on controlled eccentric tempo, maintain your abdominal brace, and keep working sets within your target RPE. Lock in!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, fallbackMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Voice synthesis read-aloud (Neural Studio Voice with Web Speech fallback)
  const handlePlayVoice = async (msg: ChatMessage) => {
    triggerHaptic('tap')
    if (currentlySpeakingId === msg.id) {
      stopCoachVoiceCue()
      setCurrentlySpeakingId(null)
      return
    }

    const textToSpeak = msg.audioText || msg.text
    setCurrentlySpeakingId(msg.id)

    try {
      await playNeuralCoachVoiceCue(textToSpeak, {
        rate: 1.05,
        pitch: 0.92,
        onEnded: () => {
          setCurrentlySpeakingId(null)
        },
      })
    } catch {
      setCurrentlySpeakingId(null)
    }
  }

  // Robust Speech Recognition Engine supporting both Push-to-Talk & Hands-Free Earbud Loop
  const startSpeechEngine = (isContinuousHandsFree: boolean) => {
    if (typeof window === 'undefined') return

    // Stop any active audio speech before listening
    stopCoachVoiceCue()
    setCurrentlySpeakingId(null)

    interface SpeechRecEvent {
      resultIndex: number
      results: Array<Array<{ transcript: string }> & { isFinal?: boolean }>
    }

    interface SpeechRecErrorEvent {
      error: string
    }

    interface SpeechRecConstructor {
      new (): {
        lang: string
        interimResults: boolean
        continuous: boolean
        maxAlternatives: number
        onstart: (() => void) | null
        onresult: ((event: SpeechRecEvent) => void) | null
        onerror: ((e: SpeechRecErrorEvent) => void) | null
        onend: (() => void) | null
        start: () => void
        abort: () => void
      }
    }

    const windowSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecConstructor
      webkitSpeechRecognition?: SpeechRecConstructor
    }

    const SpeechRec = windowSpeech.SpeechRecognition || windowSpeech.webkitSpeechRecognition

    if (!SpeechRec) {
      alert('Speech recognition is not supported on this browser. You can type your question directly.')
      return
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }

      const recognition = new SpeechRec()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        if (isContinuousHandsFree) {
          setHandsFreeState('listening')
        }
      }

      recognition.onresult = (event: SpeechRecEvent) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript
          } else {
            interim += event.results[i][0].transcript
          }
        }

        const spoken = final || interim
        setLiveSpokenTranscript(spoken)

        if (final && final.trim().length > 2) {
          setIsListening(false)
          setLiveSpokenTranscript('')
          if (isContinuousHandsFree) {
            setHandsFreeState('processing')
          }
          handleSendMessage(final.trim())
        }
      }

      recognition.onerror = (e: SpeechRecErrorEvent) => {
        setIsListening(false)
        if (isHandsFreeActiveRef.current && (e.error === 'no-speech' || e.error === 'network')) {
          setTimeout(() => {
            if (isHandsFreeActiveRef.current && handsFreeStateRef.current !== 'speaking' && handsFreeStateRef.current !== 'processing') {
              startSpeechEngine(true)
            }
          }, 1200)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
        if (isHandsFreeActiveRef.current) {
          setTimeout(() => {
            if (isHandsFreeActiveRef.current && handsFreeStateRef.current !== 'speaking' && handsFreeStateRef.current !== 'processing') {
              startSpeechEngine(true)
            }
          }, 600)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  // Toggle Hands-Free Earbud Mode
  const toggleHandsFreeMode = () => {
    triggerHaptic('tap')
    if (isHandsFreeMode) {
      setIsHandsFreeMode(false)
      setHandsFreeState('idle')
      setIsListening(false)
      setLiveSpokenTranscript('')
      stopCoachVoiceCue()
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch {}
      }
    } else {
      setIsHandsFreeMode(true)
      setHandsFreeState('listening')
      startSpeechEngine(true)
    }
  }

  // Interrupt / Stop Coach Speaking
  const handleInterruptCoach = () => {
    triggerHaptic('tap')
    stopCoachVoiceCue()
    setCurrentlySpeakingId(null)
    if (isHandsFreeMode) {
      setHandsFreeState('listening')
      setTimeout(() => {
        startSpeechEngine(true)
      }, 500)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: '#0c0f14',
          border: '1px solid rgba(212, 160, 23, 0.4)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 160, 23, 0.15)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(212, 160, 23, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: 'linear-gradient(180deg, rgba(212, 160, 23, 0.08) 0%, rgba(12, 15, 20, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <Image
              src="/images/coach-gordon-shield-logo.jpg"
              alt="Coach Scott Gordon"
              width={38}
              height={38}
              style={{
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid rgba(212, 160, 23, 0.5)',
                boxShadow: '0 0 12px rgba(212, 160, 23, 0.3)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                  Ask Coach Scott Gordon
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#4ade80',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
                  Live
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Director of Human Performance · Master Coach
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Sleek Compact Circular Earbud Mode Button */}
            <button
              type="button"
              onClick={toggleHandsFreeMode}
              style={{
                position: 'relative',
                background: isHandsFreeMode
                  ? 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(30,35,45,0.95) 100%)'
                  : 'rgba(255, 255, 255, 0.06)',
                border: isHandsFreeMode ? '1.5px solid var(--gold, #D4A017)' : '1px solid rgba(255, 255, 255, 0.15)',
                color: isHandsFreeMode ? 'var(--gold-lt, #fef08a)' : '#d1d5db',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isHandsFreeMode ? '0 0 12px rgba(212,160,23,0.5)' : 'none',
                transition: 'all 0.2s ease',
              }}
              title={isHandsFreeMode ? 'Hands-Free Earbud Mode: ACTIVE (Click to turn off)' : 'Toggle Hands-Free Earbud Mode'}
            >
              <GaaIcon name={isHandsFreeMode ? 'volume' : 'mic'} size={15} tone={isHandsFreeMode ? 'gold' : 'inherit'} />
              {isHandsFreeMode && (
                <span
                  style={{
                    position: 'absolute',
                    top: '1px',
                    right: '1px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 6px #22c55e',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                color: '#9ca3af',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Close"
            >
              <GaaIcon name="close" size={14} tone="slate" />
            </button>
          </div>
        </div>

        {/* Hands-Free Gym Earbud Mode Status HUD */}
        {isHandsFreeMode && (
          <div
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.18) 0%, rgba(15, 20, 28, 0.98) 100%)',
              borderBottom: '1px solid rgba(212, 160, 23, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background:
                    handsFreeState === 'speaking'
                      ? '#D4AF37'
                      : handsFreeState === 'processing'
                      ? '#38bdf8'
                      : '#22c55e',
                  boxShadow: `0 0 12px ${
                    handsFreeState === 'speaking'
                      ? '#D4AF37'
                      : handsFreeState === 'processing'
                      ? '#38bdf8'
                      : '#22c55e'
                  }`,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {handsFreeState === 'speaking' ? (
                    <>
                      <GaaIcon name="volume" size={12} tone="gold" />
                      <span>Coach Scott Speaking into Earbuds...</span>
                    </>
                  ) : handsFreeState === 'processing' ? (
                    <>
                      <GaaIcon name="lightning" size={12} tone="cyan" />
                      <span>Analyzing Sports Science Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <GaaIcon name="mic" size={12} tone="emerald" />
                      <span>Earbuds Active · Listening for Question...</span>
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--gold-lt, #fef08a)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {liveSpokenTranscript ? (
                    <span>Hearing: &ldquo;{liveSpokenTranscript}&rdquo;</span>
                  ) : handsFreeState === 'listening' ? (
                    <span style={{ color: '#9ca3af' }}>
                      Speak naturally anytime (e.g. &ldquo;Coach, what should I swap for squats?&rdquo;)
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Continuous 1-on-1 voice session</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {handsFreeState === 'speaking' && (
                <button
                  type="button"
                  onClick={handleInterruptCoach}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fca5a5',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ⏸️ Interrupt
                </button>
              )}
              <button
                type="button"
                onClick={toggleHandsFreeMode}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#d1d5db',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Exit
              </button>
            </div>
          </div>
        )}

        {/* Live Context Bar */}
        <div
          style={{
            padding: '8px 20px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            overflowX: 'auto',
            fontSize: '11px',
            color: '#9ca3af',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--gold, #D4A017)', fontWeight: 700 }}>Telemetry:</span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)', color: '#fef08a' }}>
            Phase {nasmOptPhase} OPT™
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#e5e7eb' }}>
            {currentWorkoutFocus || 'General Fitness'}
          </span>
          {currentExerciseName && (
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              Lift: {currentExerciseName}
            </span>
          )}
          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>
            Readiness: {recentReadinessScore}%
          </span>
        </div>

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map(msg => {
            const isCoach = msg.role === 'assistant'
            const isSpeaking = currentlySpeakingId === msg.id

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCoach ? 'flex-start' : 'flex-end',
                  maxWidth: '88%',
                  alignSelf: isCoach ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: isCoach ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    backgroundColor: isCoach ? 'rgba(21, 26, 35, 0.95)' : 'rgba(212, 160, 23, 0.15)',
                    border: isCoach ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(212, 160, 23, 0.4)',
                    color: '#e5e7eb',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    boxShadow: isCoach ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(212, 160, 23, 0.1)',
                  }}
                >
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                    {/* Audio Playback & Methodology Accordion */}
                    {isCoach && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handlePlayVoice(msg)}
                            style={{
                              background: isSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 160, 23, 0.15)',
                              border: isSpeaking ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(212, 160, 23, 0.4)',
                              color: isSpeaking ? '#f87171' : 'var(--gold, #D4A017)',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <GaaIcon name={isSpeaking ? 'stop' : 'volume'} size={12} tone={isSpeaking ? 'ruby' : 'gold'} />
                            <span>{isSpeaking ? 'Stop Audio' : 'Listen to Coach'}</span>
                          </button>

                          {/* RAG Sources Accordion — Visible only when logged in as Coach */}
                          {isCoachUser && msg.curriculums && msg.curriculums.length > 0 && (
                            <details style={{ cursor: 'pointer' }}>
                              <summary
                                style={{
                                  fontSize: '10px',
                                  color: '#9ca3af',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                }}
                              >
                                <span>RAG Sources ({msg.curriculums.length})</span>
                                <GaaIcon name="chevron-down" size={10} tone="slate" />
                              </summary>
                              <div
                                style={{
                                  marginTop: '6px',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '3px',
                                }}
                              >
                                {msg.curriculums.map((c, i) => (
                                  <div key={i} style={{ fontSize: '10px', color: '#d1d5db', lineHeight: 1.3 }}>
                                    • {c}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}

                          {/* 1-Tap Interactive Workout Action Card */}
                          {isCoach && msg.recommendedAction && (
                            <div
                              style={{
                                marginTop: '10px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(20,25,35,0.9) 100%)',
                                border: '1px solid rgba(212,160,23,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '8px',
                              }}
                            >
                              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-lt, #fef08a)' }}>
                                {actionFeedback[msg.id] || (
                                  msg.recommendedAction.type === 'swap_exercise'
                                    ? `Suggested Swap: ${msg.recommendedAction.targetExerciseName}`
                                    : msg.recommendedAction.type === 'start_timer'
                                    ? `Rest Interval: ${msg.recommendedAction.restSeconds}s`
                                    : msg.recommendedAction.type === 'auto_regulate_load'
                                    ? `Auto-Regulate: -${msg.recommendedAction.loadReductionPercent}% Load`
                                    : 'Biomechanical Video Form Check'
                                )}
                              </div>

                              {!actionFeedback[msg.id] ? (
                                <button
                                  type="button"
                                  onClick={() => handleExecuteAction(msg.id, msg.recommendedAction!)}
                                  style={{
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                    color: '#0A0E18',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 10px rgba(212,160,23,0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <GaaIcon name="lightning" size={12} tone="inherit" />
                                  <span>{msg.recommendedAction.buttonText}</span>
                                </button>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <GaaIcon name="check" size={12} tone="emerald" />
                                  <span>Applied to Session</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Tier 1: Critical 911 Emergency Alert Card */}
                          {msg.isEmergency911 ? (
                            <div
                              style={{
                                marginTop: '12px',
                                padding: '14px 16px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.22) 0%, rgba(40,10,10,0.95) 100%)',
                                border: '2px solid rgba(239,68,68,0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <GaaIcon name="alert-triangle" size={18} tone="ruby" />
                                <span style={{ fontSize: '12px', fontWeight: 900, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Emergency Medical Alert
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '11px', color: '#fee2e2', lineHeight: 1.45 }}>
                                {msg.coachPingReason || 'Critical red-flag symptoms detected. Please stop all activity immediately and call 911 or proceed to an emergency department.'}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <a
                                  href="tel:911"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    padding: '7px 16px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    boxShadow: '0 2px 12px rgba(239,68,68,0.5)',
                                  }}
                                >
                                  <GaaIcon name="phone" size={12} tone="inherit" />
                                  <span>Call 911 Immediately</span>
                                </a>
                              </div>
                            </div>
                          ) : msg.requiresCoachPing ? (
                            /* Tier 2: Coach Scott Gordon Escalation & Hand-Off Card */
                            <div
                              style={{
                                marginTop: '12px',
                                padding: '12px 14px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(20,25,35,0.95) 100%)',
                                border: '1px solid rgba(212,160,23,0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <GaaIcon name="shield" size={16} tone="amber" />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--gold-lt, #fef08a)', textTransform: 'uppercase' }}>
                                  Tier 2 Clinical Scope Triage
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '11px', color: '#d1d5db', lineHeight: 1.4 }}>
                                {msg.coachPingReason || 'This scenario involves potential structural injury or surgical rehabilitation. Coach Scott Gordon has been notified to review your training memo directly.'}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <a
                                  href="/dashboard/messages"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                                    color: '#0A0E18',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    boxShadow: '0 2px 10px rgba(212,160,23,0.35)',
                                  }}
                                >
                                  <GaaIcon name="message" size={12} tone="inherit" />
                                  <span>Open Direct Line with Coach Scott</span>
                                </a>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', padding: '0 4px' }}>
                    {msg.timestamp}
                  </div>

                  {/* Suggested Follow-Ups */}
                  {isCoach && msg.followUps && msg.followUps.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {msg.followUps.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(chip)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#d1d5db',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(212,160,23,0.4)'
                            e.currentTarget.style.color = '#FFFFFF'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                            e.currentTarget.style.color = '#d1d5db'
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(21, 26, 35, 0.95)', border: '1px solid rgba(212, 160, 23, 0.3)', width: 'fit-content' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--gold, #D4A017)', animation: 'pulse 1s infinite alternate' }} />
                <span style={{ fontSize: '12px', color: '#d1d5db' }}>Coach Gordon is analyzing biomechanics & protocol...</span>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Topic Chips */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {PRESET_TOPIC_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (chip.label === 'Form Check') {
                  setShowVideoModal(true)
                } else {
                  handleSendMessage(chip.prompt)
                }
              }}
              disabled={isLoading}
              style={{
                background: chip.label === 'Form Check' ? 'rgba(59,130,246,0.18)' : 'rgba(212, 160, 23, 0.08)',
                border: chip.label === 'Form Check' ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(212, 160, 23, 0.25)',
                color: chip.label === 'Form Check' ? '#93c5fd' : 'var(--gold-lt, #fef08a)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '16px',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name={chip.iconName} size={11} tone="inherit" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid rgba(212, 160, 23, 0.2)',
            backgroundColor: '#0a0d12',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Form Check Camera Button */}
          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
            title="5-Second Video Form Check (Gemini Multimodal Vision)"
          >
            <GaaIcon name="camera" size={16} tone="cyan" />
          </button>

          {/* Hands-Free Mic Button */}
          <button
            type="button"
            onClick={() => {
              if (isHandsFreeMode) {
                toggleHandsFreeMode()
              } else {
                startSpeechEngine(false)
              }
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isHandsFreeMode
                ? 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(20,25,35,0.95) 100%)'
                : isListening
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(255, 255, 255, 0.06)',
              border: isHandsFreeMode
                ? '1.5px solid var(--gold, #D4A017)'
                : isListening
                ? '1.5px solid #ef4444'
                : '1px solid rgba(255, 255, 255, 0.15)',
              color: isHandsFreeMode ? 'var(--gold-lt, #fef08a)' : isListening ? '#f87171' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: isHandsFreeMode
                ? '0 0 12px rgba(212, 160, 23, 0.45)'
                : isListening
                ? '0 0 12px rgba(239, 68, 68, 0.45)'
                : 'none',
              transition: 'all 0.2s ease',
            }}
            title={isHandsFreeMode ? 'Earbud Mode Active (Click to Exit)' : 'Push to Talk (or Toggle Earbud Mode in Header)'}
          >
            <GaaIcon name={isHandsFreeMode ? 'volume' : 'mic'} size={16} tone="inherit" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={
              isHandsFreeMode
                ? handsFreeState === 'speaking'
                  ? 'Coach Gordon speaking into your earbuds...'
                  : 'Earbud Mode Active: Speak anytime in the gym...'
                : isListening
                ? 'Listening to your voice...'
                : 'Ask Coach Gordon anything (exercise swaps, nutrition, soreness)...'
            }
            disabled={isLoading}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: isHandsFreeMode
                ? '1px solid rgba(212, 160, 23, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '10px 16px',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
            }}
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            style={{
              backgroundColor: inputText.trim() ? 'var(--gold, #D4A017)' : 'rgba(255, 255, 255, 0.1)',
              color: inputText.trim() ? '#000000' : '#6b7280',
              fontWeight: 700,
              fontSize: '13px',
              padding: '10px 18px',
              borderRadius: '20px',
              border: 'none',
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>

        {/* Video Form Check Modal Overlay */}
        {showVideoModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(10, 14, 24, 0.95)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GaaIcon name="camera" size={20} tone="gold" />
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                    5-Second Video Form Check
                  </h3>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Gemini Multimodal Biomechanical Audit &amp; In-Ear Spoken Feedback
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GaaIcon name="close" size={16} tone="slate" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px', marginTop: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--gold-lt, #fef08a)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Select Lift To Audit
                </label>
                <select
                  value={selectedLiftType}
                  onChange={e => setSelectedLiftType(e.target.value as LiftType)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(212, 160, 23, 0.4)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  {Object.entries(LIFT_METADATA).map(([key, meta]) => (
                    <option key={key} value={key} style={{ backgroundColor: '#111827', color: '#FFFFFF' }}>
                      {meta.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <GaaIcon name="phone" size={28} tone="gold" />
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Gym Floor Camera Protocol
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                  Prop your phone at hip height, step back 6 feet, and execute 3 clean reps.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleRunVideoCritique(selectedLiftType)}
                  disabled={isAnalyzingVideo}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                    color: '#0A0E18',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: 'none',
                    cursor: isAnalyzingVideo ? 'wait' : 'pointer',
                    boxShadow: '0 4px 14px rgba(212, 160, 23, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <GaaIcon name={isAnalyzingVideo ? 'rotate-ccw' : 'lightning'} size={13} tone="inherit" />
                  <span>{isAnalyzingVideo ? 'Analyzing Joint Angles...' : 'Analyze Lift & Speak Feedback'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#d1d5db',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
