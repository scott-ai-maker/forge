'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GaaIcon from '@/components/ui/GaaIcon'
import { createClient } from '@/lib/supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface AssignedClientLauncherItem {
  id: string
  fullName: string
  email: string
  sessionsRemaining?: number
}

interface CoachLiveSessionLauncherProps {
  assignedClients: AssignedClientLauncherItem[]
}

export default function CoachLiveSessionLauncher({ assignedClients }: CoachLiveSessionLauncherProps) {
  const router = useRouter()
  const [selectedClientId, setSelectedClientId] = useState<string>(
    assignedClients.length > 0 ? assignedClients[0].id : ''
  )
  const [waitingClients, setWaitingClients] = useState<Record<string, boolean>>({})
  const [isRinging, setIsRinging] = useState(false)
  const [ringFeedback, setRingFeedback] = useState<string | null>(null)

  // Real-Time Presence Monitor: detect athletes waiting in their studio lobbies
  useEffect(() => {
    if (assignedClients.length === 0) return
    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    // Monitor live room channels for assigned clients
    assignedClients.forEach(client => {
      const channel = supabase.channel(`webrtc:live-${client.id}`)
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState()
          let hasAthlete = false
          for (const key of Object.keys(presenceState)) {
            const list = presenceState[key] as any[]
            if (list.some(p => p.role === 'athlete')) {
              hasAthlete = true
              break
            }
          }
          setWaitingClients(prev => ({ ...prev, [client.id]: hasAthlete }))
        })
        .on('presence', { event: 'join' }, ({ newPresences }: any) => {
          if (newPresences?.some((p: any) => p.role === 'athlete')) {
            setWaitingClients(prev => ({ ...prev, [client.id]: true }))
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
          if (leftPresences?.some((p: any) => p.role === 'athlete')) {
            setWaitingClients(prev => ({ ...prev, [client.id]: false }))
          }
        })
        .subscribe()

      channels.push(channel)
    })

    return () => {
      channels.forEach(ch => void supabase.removeChannel(ch))
    }
  }, [assignedClients])

  const selectedClient = assignedClients.find(c => c.id === selectedClientId)

  const handleLaunch = () => {
    if (!selectedClientId) return
    router.push(`/coach/clients/${selectedClientId}/live`)
  }

  const handleRingAthlete = async () => {
    if (!selectedClientId) return
    try {
      setIsRinging(true)
      setRingFeedback(null)
      const res = await fetch(`/api/coach/clients/${selectedClientId}/live-session-start`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setRingFeedback(`✓ Live Session Alert & Link Sent to ${selectedClient?.fullName || 'Athlete'}!`)
      } else {
        setRingFeedback(data.error || 'Failed to dispatch alert')
      }
    } catch {
      setRingFeedback('Network error while dispatching alert')
    } finally {
      setIsRinging(false)
      setTimeout(() => setRingFeedback(null), 5000)
    }
  }

  return (
    <section
      id="live-studio"
      style={{
        background: 'linear-gradient(135deg, rgba(14,24,42,0.98) 0%, rgba(9,15,28,0.98) 100%)',
        border: '1px solid rgba(212,160,23,0.45)',
        borderRadius: 10,
        padding: '20px 24px',
        marginBottom: 28,
        boxShadow: '0 8px 30px rgba(0,0,0,0.45), 0 0 15px rgba(212,160,23,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Brand Accent Corner Glow */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundImage: "url('/images/gaa-brand-crest.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1.5px solid var(--gold)',
              boxShadow: '0 0 12px rgba(212,160,23,0.4)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#34D399',
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                    animation: 'pulse 2s infinite',
                  }}
                />
                1:1 LIVE VIDEO STUDIO &amp; MOVEMENT SCREEN
              </span>
              <span
                style={{
                  background: 'rgba(212,160,23,0.15)',
                  border: '1px solid rgba(212,160,23,0.3)',
                  color: 'var(--gold-lt)',
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 4,
                }}
              >
                WebRTC HD
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 20,
                letterSpacing: '0.04em',
                margin: '4px 0 0',
                color: 'var(--white)',
              }}
            >
              Train or Assess Athlete Live
            </h2>
          </div>
        </div>

        {ringFeedback && (
          <div
            style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid #10B981',
              color: '#34D399',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {ringFeedback}
          </div>
        )}
      </div>

      <p style={{ color: 'var(--gray)', fontSize: 13, margin: '0 0 18px', maxWidth: 880, lineHeight: 1.5 }}>
        Select an athlete below to launch their private 1:1 Live Coaching Studio. Directly coach real-time biomechanics, execute kinetic assessments (OHSA, single-leg squats), guide NASM tempo cadences, and record set performance logs.
      </p>

      {assignedClients.length === 0 ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '16px 20px',
            color: 'var(--gray)',
            fontSize: 13,
          }}
        >
          No assigned athletes currently found. Select an athlete from the <strong>Unassigned Intake</strong> tab below to assign them to your roster, then launch your live training session here.
        </div>
      ) : (
        <div>
          {/* Main Selection & Action Row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <label
                htmlFor="coach-live-client-select"
                style={{
                  display: 'block',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--gold-lt)',
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Select Athlete to Train Live:
              </label>
              <select
                id="coach-live-client-select"
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#070C16',
                  border: selectedClientId && waitingClients[selectedClientId] ? '1.5px solid #10B981' : '1.5px solid var(--gold)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: selectedClientId && waitingClients[selectedClientId] ? '0 0 14px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {assignedClients.map(client => {
                  const isWaiting = Boolean(waitingClients[client.id])
                  return (
                    <option key={client.id} value={client.id} style={{ background: '#0B1220', color: isWaiting ? '#34D399' : '#FFF' }}>
                      {isWaiting ? '🟢 [IN LOBBY NOW] ' : ''}{client.fullName} ({client.email}) — {client.sessionsRemaining ?? 0} sessions remaining
                    </option>
                  )
                })}
              </select>

              {Boolean(selectedClientId && waitingClients[selectedClientId]) && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(52, 211, 153, 0.45)',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#34D399',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'pulse 2s infinite' }} />
                  <span>{selectedClient?.fullName || 'Athlete'} is currently waiting in the studio lobby!</span>
                </div>
              )}
            </div>

            {/* Launch Primary Button */}
            <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleLaunch}
                disabled={!selectedClientId}
                className="tactile-btn"
                style={{
                  background: selectedClientId
                    ? waitingClients[selectedClientId]
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: selectedClientId ? (waitingClients[selectedClientId] ? '#FFFFFF' : '#080E14') : 'var(--gray)',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '11px 22px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: selectedClientId ? 'pointer' : 'not-allowed',
                  boxShadow: selectedClientId
                    ? waitingClients[selectedClientId]
                      ? '0 4px 20px rgba(16,185,129,0.55)'
                      : '0 4px 16px rgba(212,160,23,0.45)'
                    : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                <GaaIcon
                  name="camera"
                  size={16}
                  style={{
                    color: waitingClients[selectedClientId] ? '#FFFFFF' : '#080E14',
                    stroke: waitingClients[selectedClientId] ? '#FFFFFF' : '#080E14',
                  }}
                />
                <span>
                  {waitingClients[selectedClientId]
                    ? `Join ${selectedClient?.fullName.split(' ')[0] || 'Athlete'} in Lobby Now →`
                    : `Start 1:1 Live Session ${selectedClient ? `with ${selectedClient.fullName.split(' ')[0]}` : ''} →`}
                </span>
              </button>

              {/* Ring / Send Alert Action */}
              <button
                type="button"
                onClick={handleRingAthlete}
                disabled={!selectedClientId || isRinging}
                style={{
                  background: 'rgba(212,160,23,0.12)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '11px 16px',
                  borderRadius: 6,
                  cursor: selectedClientId && !isRinging ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <GaaIcon name={isRinging ? 'volume' : 'phone'} size={14} tone="gold" />
                <span>{isRinging ? 'Dispatching...' : 'Ring Athlete & Dispatch Room Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Athlete Launch Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Quick Roster Pick:
            </span>
            {assignedClients.slice(0, 6).map(client => {
              const isSelected = client.id === selectedClientId
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClientId(client.id)}
                  style={{
                    padding: '5px 12px',
                    background: isSelected ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.06)',
                    border: isSelected ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.12)',
                    color: isSelected ? 'var(--gold-lt)' : 'var(--white)',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <GaaIcon name="video-studio" size={11} tone={isSelected ? 'gold' : 'slate'} />
                  <span>{client.fullName}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

