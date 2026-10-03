'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AudioMessagePlayer from '@/components/messages/AudioMessagePlayer'
import VoiceNoteRecorder from '@/components/messages/VoiceNoteRecorder'
import GaaIcon from '@/components/ui/GaaIcon'
import { createClient } from '@/lib/supabase-browser'
import { triggerHaptic } from '@/lib/offline-sync-queue'

interface Message {
  id: string
  client_id: string
  coach_id: string
  sender_id: string
  message_body: string
  created_at: string
  read_at?: string | null
  is_deleted?: boolean
  deleted_at?: string | null
}

interface MessageThreadClientProps {
  currentUserId: string
  role: 'client' | 'coach'
  clientId?: string
  recipientName?: string
  recipientAvatar?: string | null
  recipientRoleTitle?: string
}

function parseVoiceNote(body: string): { isVoice: boolean; duration: number; src: string } {
  if (!body || typeof body !== 'string') return { isVoice: false, duration: 0, src: '' }
  const cleanBody = body.startsWith('[retracted]:') ? body.replace(/^\[retracted\]:/, '') : body
  const match = cleanBody.match(/^\[voice-note\]:(\d+(?:\.\d+)?):([\s\S]+)$/)
  if (match) {
    const duration = Math.round(Number(match[1])) || 0
    const src = match[2].trim()
    return { isVoice: true, duration, src }
  }
  return { isVoice: false, duration: 0, src: '' }
}

function getDateDividerLabel(dateString: string): string {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return 'Earlier'
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'long' })
  }
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatTime(dateString: string): string {
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function MessageThreadClient({
  currentUserId,
  role,
  clientId,
  recipientName,
  recipientAvatar,
  recipientRoleTitle,
}: MessageThreadClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [retractingId, setRetractingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [showAuditMode, setShowAuditMode] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Auto-scroll and scroll anchoring states
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const hasInitiallyScrolledRef = useRef(false)
  const [showJumpToBottom, setShowJumpToBottom] = useState(false)
  const [unreadIncomingCount, setUnreadIncomingCount] = useState(0)

  const query = useMemo(() => {
    if (role === 'coach' && clientId) return `?clientId=${encodeURIComponent(clientId)}`
    return ''
  }, [role, clientId])

  const markThreadRead = useCallback(async () => {
    try {
      await fetch(`/api/messages${query}`, { method: 'PATCH' })
    } catch {}
  }, [query])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' })
    }
    setShowJumpToBottom(false)
    setUnreadIncomingCount(0)
  }, [])

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
    const isFar = distanceFromBottom > 120
    setShowJumpToBottom(isFar)
    if (!isFar) {
      setUnreadIncomingCount(0)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/messages${query}`)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus(payload.error ?? 'Failed to load messages')
        return
      }
      setMessages(payload.messages ?? [])
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  // Initial scroll to bottom & mark as read
  useEffect(() => {
    if (messages.length > 0 && !hasInitiallyScrolledRef.current) {
      hasInitiallyScrolledRef.current = true
      setTimeout(() => scrollToBottom('instant'), 60)
      void markThreadRead()
    }
  }, [messages.length, scrollToBottom, markThreadRead])

  // Real-Time Message Synchronization via Supabase Realtime
  useEffect(() => {
    const activeClientId = role === 'coach' ? clientId : currentUserId
    if (!activeClientId) return

    let isMounted = true
    const supabase = createClient()

    const channel = supabase
      .channel(`thread:${activeClientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_client_messages',
          filter: `client_id=eq.${activeClientId}`,
        },
        payload => {
          if (!isMounted) return

          if (payload.eventType === 'INSERT') {
            const raw = payload.new as Message
            setMessages(prev => {
              // If message already exists in thread, do not duplicate
              if (prev.some(m => m.id === raw.id)) return prev

              // Reconcile and replace optimistic temporary messages
              const withoutOptimistic = prev.filter(
                m => !m.id.startsWith('temp_') || m.message_body !== raw.message_body
              )
              return [...withoutOptimistic, raw]
            })

            // If incoming message is from the other party
            if (raw.sender_id !== currentUserId) {
              triggerHaptic('tap')
              if (showJumpToBottom) {
                setUnreadIncomingCount(c => c + 1)
              } else {
                setTimeout(() => scrollToBottom('smooth'), 50)
                void markThreadRead()
              }
            } else {
              setTimeout(() => scrollToBottom('smooth'), 50)
            }

            // If incoming message contains a voice note, re-fetch to resolve fresh signed CDN URLs
            if (raw.message_body?.startsWith('[voice-note]:')) {
              void loadMessages()
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Message
            const isRetracted = updated.message_body?.startsWith('[retracted]:')
            setMessages(prev =>
              prev.map(m =>
                m.id === updated.id
                  ? {
                      ...m,
                      ...updated,
                      is_deleted: isRetracted,
                      deleted_at: isRetracted ? updated.created_at : null,
                    }
                  : m
              )
            )
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string })?.id
            if (oldId) {
              setMessages(prev => prev.filter(m => m.id !== oldId))
            }
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      void supabase.removeChannel(channel)
    }
  }, [role, clientId, currentUserId, loadMessages, markThreadRead, scrollToBottom, showJumpToBottom])

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      triggerHaptic('tap')
      setCopiedMessageId(id)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch {}
  }

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    triggerHaptic('tap')
    setStatus(null)
    const optimisticId = `temp_msg_${Date.now()}`
    const optimisticMessage: Message = {
      id: optimisticId,
      client_id: role === 'coach' ? (clientId ?? '') : currentUserId,
      coach_id: role === 'coach' ? currentUserId : '',
      sender_id: currentUserId,
      message_body: trimmed,
      created_at: new Date().toISOString(),
      is_deleted: false,
    }

    setMessages(prev => [...prev, optimisticMessage])
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = '46px'
    }
    setTimeout(() => scrollToBottom('smooth'), 40)

    const body = role === 'coach' ? { message: trimmed, clientId } : { message: trimmed }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus(payload.error ?? 'Failed to send message')
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        return
      }

      if (payload.message) {
        setMessages(prev => prev.map(m => (m.id === optimisticId ? payload.message : m)))
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to send message')
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
    }
  }

  async function handleSendVoiceNote(audioDataUrl: string, durationSec: number) {
    triggerHaptic('tap')
    setStatus(null)
    const voicePayload = `[voice-note]:${durationSec}:${audioDataUrl}`
    const optimisticId = `temp_voice_${Date.now()}`
    const optimisticMessage: Message = {
      id: optimisticId,
      client_id: role === 'coach' ? (clientId ?? '') : currentUserId,
      coach_id: role === 'coach' ? currentUserId : '',
      sender_id: currentUserId,
      message_body: voicePayload,
      created_at: new Date().toISOString(),
      is_deleted: false,
    }

    setMessages(prev => [...prev, optimisticMessage])
    setShowVoiceRecorder(false)
    setTimeout(() => scrollToBottom('smooth'), 40)

    const body = role === 'coach' ? { message: voicePayload, clientId } : { message: voicePayload }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus(payload.error ?? 'Failed to send voice note')
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        return
      }

      if (payload.message) {
        setMessages(prev => prev.map(m => (m.id === optimisticId ? payload.message : m)))
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to send voice note')
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
    }
  }

  async function handleRetractMessage(messageId: string) {
    setRetractingId(messageId)
    triggerHaptic('tap')
    // Optimistically mark as retracted so it vanishes immediately from view
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, is_deleted: true, deleted_at: new Date().toISOString() } : m))
    )

    try {
      const res = await fetch(`/api/messages?messageId=${encodeURIComponent(messageId)}`, {
        method: 'DELETE',
      })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus(payload.error ?? 'Failed to remove message')
        void loadMessages()
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to remove message')
      void loadMessages()
    } finally {
      setRetractingId(null)
    }
  }

  async function handleClearAllMessages() {
    if (!confirm('Clear all messages in this thread? (All text and audio will be removed from active view and securely preserved in database audit records)')) {
      return
    }

    triggerHaptic('heavy')
    setClearingAll(true)
    setMessages(prev => prev.map(m => ({ ...m, is_deleted: true, deleted_at: new Date().toISOString() })))

    try {
      const deleteUrl = role === 'coach' && clientId
        ? `/api/messages?clearAll=true&clientId=${encodeURIComponent(clientId)}`
        : '/api/messages?clearAll=true'

      const res = await fetch(deleteUrl, {
        method: 'DELETE',
      })
      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus(payload.error ?? 'Failed to clear thread')
        void loadMessages()
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to clear thread')
      void loadMessages()
    } finally {
      setClearingAll(false)
    }
  }

  // Filter messages for active display
  const baseMessages = showAuditMode ? messages : messages.filter(m => !m.is_deleted)
  const displayedMessages = searchQuery.trim()
    ? baseMessages.filter(m => m.message_body.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseMessages

  // Group messages by calendar date with clustering
  const groupedDates: { dateLabel: string; items: Message[] }[] = []
  displayedMessages.forEach(msg => {
    const dateLabel = getDateDividerLabel(msg.created_at)
    const existing = groupedDates.find(g => g.dateLabel === dateLabel)
    if (existing) {
      existing.items.push(msg)
    } else {
      groupedDates.push({ dateLabel, items: [msg] })
    }
  })

  const quickPrompts = [
    { label: '📹 Video critique request', text: 'Hey Coach, I just uploaded a lift for technical critique on form and bar path.' },
    { label: '🥗 Macro targets check', text: 'Hey Coach, checking in on my protein and carb calibrations for this week.' },
    { label: '⚡ Exercise swap', text: 'Hey Coach, my gym is missing this apparatus—what swap do you recommend for today?' },
    { label: '🩹 Soreness & deload', text: 'Hey Coach, feeling lingering fatigue from yesterday—should I deload today or proceed as programmed?' },
  ]

  const handleApplyQuickPrompt = (promptText: string) => {
    triggerHaptic('tap')
    setMessage(promptText)
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(140, Math.max(46, textareaRef.current.scrollHeight))}px`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(140, Math.max(46, textareaRef.current.scrollHeight))}px`
    }
  }

  const partnerDisplayName = role === 'coach' ? (recipientName || 'Athlete') : 'Master Coach Gordon'
  const partnerRoleLabel = role === 'coach' ? (recipientRoleTitle || 'Private Client') : 'CSCS · Olympic Specialist · Lead Concierge'

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── Executive Thread Header Console ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 24, 38, 0.95) 0%, rgba(10, 16, 26, 0.98) 100%)',
          border: '1px solid rgba(197, 160, 89, 0.35)',
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar / Crest */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              overflow: 'hidden',
              position: 'relative',
              border: '1.5px solid rgba(197, 160, 89, 0.6)',
              background: '#080E14',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(197, 160, 89, 0.25)',
            }}
          >
            {role === 'client' ? (
              <Image
                src="/images/coach-gordon-shield-logo.jpg"
                alt="Coach Gordon Seal"
                fill
                sizes="44px"
                style={{ objectFit: 'cover' }}
              />
            ) : recipientAvatar ? (
              <Image
                src={recipientAvatar}
                alt={partnerDisplayName}
                fill
                sizes="44px"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #162232 0%, #0E1724 100%)',
                  color: 'var(--gold-lt)',
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {partnerDisplayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 16, letterSpacing: '0.04em', fontWeight: 700, color: '#F8FAFC' }}>
                {partnerDisplayName}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34D399',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34D399' }} />
                <span>Active Line</span>
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{partnerRoleLabel}</span>
              <span>·</span>
              <span style={{ color: 'var(--gold-lt)' }}>Response &lt; 12h</span>
            </div>
          </div>
        </div>

        {/* Console Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap')
              setIsSearchOpen(v => !v)
              if (isSearchOpen) setSearchQuery('')
            }}
            style={{
              background: isSearchOpen ? 'rgba(197, 160, 89, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isSearchOpen ? '1px solid rgba(197, 160, 89, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isSearchOpen ? 'var(--gold-lt)' : 'var(--gray)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
            title="Search conversation"
          >
            <GaaIcon name="search" size={13} tone="inherit" />
            <span>{isSearchOpen ? 'Close Search' : 'Search'}</span>
          </button>

          {/* Coach Audit Mode */}
          {role === 'coach' && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap')
                setShowAuditMode(v => !v)
              }}
              style={{
                background: showAuditMode ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: showAuditMode ? '1px solid rgba(197, 160, 89, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: showAuditMode ? 'var(--gold-lt)' : 'var(--gray)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <GaaIcon name={showAuditMode ? 'eye' : 'shield-check'} size={13} tone={showAuditMode ? 'gold' : 'slate'} />
              <span>{showAuditMode ? 'Audit Mode On' : 'Audit Mode'}</span>
            </button>
          )}

          {/* Clear Thread Action */}
          {messages.some(m => !m.is_deleted) && (
            <button
              type="button"
              onClick={() => void handleClearAllMessages()}
              disabled={clearingAll}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                color: '#F87171',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
              title="Clear all messages in thread (preserved in DB audit log)"
            >
              <GaaIcon name="trash" size={12} tone="inherit" />
              <span>{clearingAll ? 'Clearing...' : 'Clear'}</span>
            </button>
          )}

          <span
            style={{
              fontSize: 11,
              color: 'var(--gray)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {displayedMessages.length} {displayedMessages.length === 1 ? 'Message' : 'Messages'}
          </span>
        </div>
      </div>

      {/* Search Input Filter (if open) */}
      {isSearchOpen && (
        <div style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter messages in this conversation..."
            style={{
              width: '100%',
              background: 'rgba(14, 23, 36, 0.95)',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              borderRadius: 8,
              padding: '8px 14px',
              color: '#F8FAFC',
              fontSize: 13,
              fontFamily: 'Raleway, sans-serif',
              outline: 'none',
            }}
            autoFocus
          />
        </div>
      )}

      {/* ── Scrollable Message Viewport (Full-Height Responsive) ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          border: '1px solid var(--navy-lt)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(197, 160, 89, 0.05) 0%, transparent 65%), #0A111A',
          borderRadius: 14,
          height: 'clamp(520px, 64vh, 760px)',
          overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {loading && displayedMessages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <GaaIcon name="hourglass" size={24} tone="gold" />
            <p style={{ margin: 0, color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', fontSize: 13 }}>
              Loading concierge thread...
            </p>
          </div>
        )}

        {/* Empty State Welcome Card */}
        {!loading && displayedMessages.length === 0 && (
          <div
            style={{
              margin: 'auto',
              maxWidth: 480,
              textAlign: 'center',
              padding: '32px 24px',
              background: 'linear-gradient(135deg, rgba(16, 26, 40, 0.95) 0%, rgba(8, 14, 24, 0.98) 100%)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              borderRadius: 14,
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
                overflow: 'hidden',
                position: 'relative',
                border: '2px solid rgba(197, 160, 89, 0.6)',
                boxShadow: '0 0 16px rgba(197, 160, 89, 0.3)',
              }}
            >
              <Image
                src="/images/coach-gordon-shield-logo.jpg"
                alt="Coach Gordon Shield"
                fill
                sizes="60px"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, letterSpacing: '0.04em', color: '#F8FAFC', margin: '0 0 4px 0' }}>
                PRIVATE ADVISORY CHANNEL OPEN
              </h3>
              <p style={{ color: 'var(--gray)', fontFamily: 'Raleway, sans-serif', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                {role === 'coach'
                  ? 'Initiate private guidance, send technical exercise cues, or record a personalized voice memo for your athlete.'
                  : 'Direct encrypted line with Master Coach Gordon for form critique, exercise swaps, deload advice, and nutrition adjustments.'}
              </p>
            </div>

            {/* Quick Starters in Empty State */}
            <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: 'var(--gold-lt)' }}>
                Tap a prompt to start conversation:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyQuickPrompt(p.text)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(197,160,89,0.3)',
                      color: '#F8FAFC',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Clusters by Date */}
        {groupedDates.map(group => (
          <div key={group.dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Date Divider Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
              <span
                style={{
                  background: 'rgba(14, 23, 36, 0.85)',
                  border: '1px solid rgba(197, 160, 89, 0.25)',
                  color: 'var(--gold-lt)',
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '3px 12px',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {group.dateLabel}
              </span>
            </div>

            {/* Messages in this Date */}
            {group.items.map((msg, idx) => {
              const mine = msg.sender_id === currentUserId
              const voice = parseVoiceNote(msg.message_body)
              const isRetracted = Boolean(msg.is_deleted)

              const prevMsg = group.items[idx - 1]
              const nextMsg = group.items[idx + 1]

              const prevTime = prevMsg ? new Date(prevMsg.created_at).getTime() : 0
              const currTime = new Date(msg.created_at).getTime()
              const nextTime = nextMsg ? new Date(nextMsg.created_at).getTime() : 0

              const isFirstInCluster = !prevMsg || prevMsg.sender_id !== msg.sender_id || (currTime - prevTime > 300000)
              const isLastInCluster = !nextMsg || nextMsg.sender_id !== msg.sender_id || (nextTime - currTime > 300000)

              // Tailored corner radii for continuous conversational flow
              let borderRadius = '16px'
              if (mine) {
                if (isFirstInCluster && isLastInCluster) borderRadius = '18px 18px 4px 18px'
                else if (isFirstInCluster) borderRadius = '18px 18px 6px 18px'
                else if (isLastInCluster) borderRadius = '18px 6px 4px 18px'
                else borderRadius = '18px 6px 6px 18px'
              } else {
                if (isFirstInCluster && isLastInCluster) borderRadius = '18px 18px 18px 4px'
                else if (isFirstInCluster) borderRadius = '18px 18px 18px 6px'
                else if (isLastInCluster) borderRadius = '6px 18px 18px 4px'
                else borderRadius = '6px 18px 18px 6px'
              }

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: mine ? 'flex-end' : 'flex-start',
                    gap: 3,
                    marginTop: isFirstInCluster ? 6 : 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: 8,
                      maxWidth: '85%',
                      flexDirection: mine ? 'row-reverse' : 'row',
                    }}
                  >
                    {/* Incoming Avatar on first in cluster */}
                    {!mine && (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          overflow: 'hidden',
                          position: 'relative',
                          border: '1px solid rgba(197, 160, 89, 0.5)',
                          flexShrink: 0,
                          visibility: isLastInCluster ? 'visible' : 'hidden',
                          background: '#080E14',
                        }}
                      >
                        {role === 'client' ? (
                          <Image
                            src="/images/coach-gordon-shield-logo.jpg"
                            alt="Coach Gordon"
                            fill
                            sizes="32px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : recipientAvatar ? (
                          <Image
                            src={recipientAvatar}
                            alt={partnerDisplayName}
                            fill
                            sizes="32px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#162232',
                              color: 'var(--gold-lt)',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            {partnerDisplayName.slice(0, 1)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bubble Card */}
                    <div
                      style={{
                        background: isRetracted
                          ? 'rgba(15, 23, 42, 0.45)'
                          : mine
                          ? 'linear-gradient(135deg, #1A2A3F 0%, #111D2D 100%)'
                          : 'linear-gradient(135deg, rgba(20, 32, 48, 0.95) 0%, rgba(12, 20, 32, 0.98) 100%)',
                        color: isRetracted ? '#94A3B8' : '#F8FAFC',
                        border: isRetracted
                          ? '1px dashed rgba(148, 163, 184, 0.3)'
                          : mine
                          ? '1px solid rgba(197, 160, 89, 0.38)'
                          : '1px solid rgba(197, 160, 89, 0.22)',
                        borderRadius,
                        padding: voice.isVoice ? '8px 10px' : '10px 14px',
                        boxShadow: mine
                          ? '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
                          : '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
                        position: 'relative',
                        wordBreak: 'break-word',
                      }}
                    >
                      {/* Sender Name header on first incoming message */}
                      {!mine && isFirstInCluster && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-lt)', letterSpacing: '0.02em' }}>
                            {partnerDisplayName}
                          </span>
                          {role === 'client' && (
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: 'var(--gold)',
                                color: '#080E14',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyItems: 'center',
                                justifyContent: 'center',
                                fontSize: 8,
                                fontWeight: 900,
                              }}
                              title="Certified Advisory Master Coach"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                      )}

                      {/* Retracted / Audit State */}
                      {isRetracted && showAuditMode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <GaaIcon name="shield" size={12} tone="gold" />
                            <span>Audit Log (Retracted Message)</span>
                          </span>
                          {voice.isVoice ? (
                            <AudioMessagePlayer audioSrc={voice.src} durationSeconds={voice.duration} isSender={mine} />
                          ) : (
                            <p style={{ margin: 0, fontFamily: 'Raleway, sans-serif', fontSize: 13, color: '#CBD5E1' }}>
                              {msg.message_body.replace(/^\[retracted\]:/, '')}
                            </p>
                          )}
                        </div>
                      ) : voice.isVoice ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                            <span
                              style={{
                                fontSize: 10,
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontWeight: 800,
                                color: 'var(--gold-lt)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <GaaIcon name="mic" size={12} tone="gold" />
                              <span>Voice Note</span>
                            </span>

                            {/* Actions on audio */}
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {(mine || role === 'coach') && !msg.id.startsWith('temp_') && (
                                <button
                                  type="button"
                                  onClick={() => void handleRetractMessage(msg.id)}
                                  disabled={retractingId === msg.id}
                                  title="Remove audio memo (preserved in DB audit log)"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--gray)',
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    opacity: 0.7,
                                  }}
                                >
                                  <GaaIcon name="trash" size={12} tone="inherit" />
                                </button>
                              )}
                            </div>
                          </div>

                          <AudioMessagePlayer audioSrc={voice.src} durationSeconds={voice.duration} isSender={mine} />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <p style={{ margin: 0, fontFamily: 'Raleway, sans-serif', fontSize: 14.5, lineHeight: 1.5, color: '#F8FAFC' }}>
                            {msg.message_body}
                          </p>

                          {/* Action Toolbar on text message */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center', marginTop: 2 }}>
                            <button
                              type="button"
                              onClick={() => void handleCopyText(msg.id, msg.message_body)}
                              title="Copy message"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--gray)',
                                cursor: 'pointer',
                                fontSize: 10,
                                padding: '1px 3px',
                                opacity: 0.65,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <GaaIcon name="copy" size={11} tone="inherit" />
                              {copiedMessageId === msg.id && <span>Copied</span>}
                            </button>

                            {(mine || role === 'coach') && !msg.id.startsWith('temp_') && (
                              <button
                                type="button"
                                onClick={() => void handleRetractMessage(msg.id)}
                                disabled={retractingId === msg.id}
                                title="Remove message (preserved in DB audit log)"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--gray)',
                                  cursor: 'pointer',
                                  fontSize: 10,
                                  padding: '1px 3px',
                                  opacity: 0.65,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                <GaaIcon name="trash" size={11} tone="inherit" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bubble Status Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                          gap: 6,
                          marginTop: 4,
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: 'var(--gray)',
                          opacity: 0.75,
                        }}
                      >
                        <span>{formatTime(msg.created_at)}</span>
                        {mine && (
                          <span>
                            {msg.id.startsWith('temp_') ? (
                              <span style={{ fontStyle: 'italic' }}>Sending...</span>
                            ) : msg.read_at ? (
                              <span style={{ fontWeight: 800, color: 'var(--gold-lt)' }} title={`Read by ${partnerDisplayName}`}>
                                ✓✓
                              </span>
                            ) : (
                              <span style={{ color: 'var(--gray)' }} title="Delivered">✓</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Scroll to Bottom Anchor Sentinel */}
        <div ref={messagesEndRef} style={{ height: 1 }} />

        {/* Floating "Jump to Latest" Button */}
        {showJumpToBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            style={{
              position: 'sticky',
              bottom: 12,
              alignSelf: 'center',
              background: 'linear-gradient(135deg, #C5A059 0%, #AA820A 100%)',
              color: '#080E14',
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              zIndex: 10,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <span>↓ {unreadIncomingCount > 0 ? `${unreadIncomingCount} New Message${unreadIncomingCount > 1 ? 's' : ''}` : 'Latest Messages'}</span>
          </button>
        )}
      </div>

      {/* ── Docked Audio Recorder or Unified Expanding Composer ── */}
      {showVoiceRecorder ? (
        <VoiceNoteRecorder
          onSend={handleSendVoiceNote}
          onCancel={() => setShowVoiceRecorder(false)}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Quick Starter / Topic Suggestion Chips */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyQuickPrompt(p.text)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(197, 160, 89, 0.22)',
                  color: 'var(--gold-lt)',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Composer Capsule */}
          <form
            onSubmit={sendMessage}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 26, 40, 0.98) 0%, rgba(10, 18, 28, 0.98) 100%)',
              border: '1px solid rgba(197, 160, 89, 0.4)',
              borderRadius: 14,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={role === 'coach' ? 'Message athlete (Enter to send, Shift+Enter for new line)...' : 'Message Master Coach Gordon (Enter to send, Shift+Enter for new line)...'}
              rows={1}
              style={{
                width: '100%',
                minHeight: 46,
                maxHeight: 140,
                background: 'transparent',
                border: 'none',
                color: '#F8FAFC',
                fontFamily: 'Raleway, sans-serif',
                fontSize: 14.5,
                lineHeight: 1.45,
                outline: 'none',
                resize: 'none',
                padding: '4px 0',
              }}
            />

            {/* Composer Action Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Voice Note Record Launcher */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap')
                    setShowVoiceRecorder(true)
                  }}
                  className="tactile-btn"
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(197, 160, 89, 0.12)',
                    border: '1px solid rgba(197, 160, 89, 0.35)',
                    color: 'var(--gold-lt)',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name="mic" size={13} tone="gold" />
                  <span>Voice Note</span>
                </button>

                {/* Video Critique Studio Shortcut */}
                <Link
                  href="/dashboard/fitness?workspace=video"
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F8FAFC',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <GaaIcon name="video-studio" size={13} tone="gold" />
                  <span>Video Studio</span>
                </Link>

                {message.length > 1400 && (
                  <span style={{ fontSize: 11, color: message.length > 1900 ? '#EF4444' : 'var(--gray)', fontFamily: 'monospace' }}>
                    {message.length}/2000
                  </span>
                )}
              </div>

              {/* Send Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {message.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessage('')
                      if (textareaRef.current) textareaRef.current.style.height = '46px'
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--gray)',
                      fontSize: 11.5,
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    Clear
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="tactile-btn"
                  style={{
                    border: 'none',
                    background: message.trim()
                      ? 'linear-gradient(135deg, #C5A059 0%, #AA820A 100%)'
                      : 'rgba(255, 255, 255, 0.08)',
                    color: message.trim() ? '#080E14' : 'rgba(255,255,255,0.3)',
                    padding: '8px 18px',
                    fontFamily: 'var(--font-sans, Raleway), sans-serif',
                    letterSpacing: '0.08em',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    borderRadius: 8,
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: message.trim() ? '0 4px 14px rgba(197, 160, 89, 0.4)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Send</span>
                  <GaaIcon name="rocket" size={13} tone="inherit" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {status && <p style={{ margin: 0, color: 'var(--error)', fontSize: 13 }}>{status}</p>}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
