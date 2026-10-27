'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GaaIcon from '@/components/ui/GaaIcon'
import { createClient } from '@/lib/supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { type Team, generateCoachDefaultTeams } from '@/lib/teams'

export interface AssignedClientLauncherItem {
  id: string
  fullName: string
  email: string
  sessionsRemaining?: number
}

interface LiveRoomPresence {
  role?: string
  userId?: string
  [key: string]: unknown
}

interface CoachLiveSessionLauncherProps {
  assignedClients: AssignedClientLauncherItem[]
  teams?: Team[]
}

export default function CoachLiveSessionLauncher({ assignedClients, teams }: CoachLiveSessionLauncherProps) {
  const router = useRouter()
  const [studioMode, setStudioMode] = useState<'individual' | 'team'>('individual')

  // 1:1 State
  const [selectedClientId, setSelectedClientId] = useState<string>(
    assignedClients.length > 0 ? assignedClients[0].id : ''
  )
  const [waitingClients, setWaitingClients] = useState<Record<string, boolean>>({})
  const [isRinging, setIsRinging] = useState(false)
  const [ringFeedback, setRingFeedback] = useState<string | null>(null)

  // Team State
  const availableTeams = teams && teams.length > 0 ? teams : generateCoachDefaultTeams('coach-gordon', assignedClients)
  const [selectedTeamId, setSelectedTeamId] = useState<string>(availableTeams[0]?.id || '')
  const [waitingTeamMembers, setWaitingTeamMembers] = useState<Record<string, boolean>>({})
  const [isRingingTeam, setIsRingingTeam] = useState(false)
  const [teamRingFeedback, setTeamRingFeedback] = useState<string | null>(null)

  // Real-Time Presence Monitor: detect athletes waiting in 1:1 studio lobbies
  useEffect(() => {
    if (assignedClients.length === 0) return
    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    assignedClients.forEach(client => {
      const channel = supabase.channel(`webrtc:live-${client.id}`)
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState()
          let hasAthlete = false
          for (const key of Object.keys(presenceState)) {
            const list = presenceState[key] as LiveRoomPresence[]
            if (list.some(p => p.role === 'athlete')) {
              hasAthlete = true
              break
            }
          }
          setWaitingClients(prev => ({ ...prev, [client.id]: hasAthlete }))
        })
        .on('presence', { event: 'join' }, ({ newPresences }: { newPresences?: LiveRoomPresence[] }) => {
          if (newPresences?.some(p => p.role === 'athlete')) {
            setWaitingClients(prev => ({ ...prev, [client.id]: true }))
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences?: LiveRoomPresence[] }) => {
          if (leftPresences?.some(p => p.role === 'athlete')) {
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

  // Real-Time Presence Monitor for Selected Team Studio Lobby
  useEffect(() => {
    if (!selectedTeamId) return
    const supabase = createClient()
    const channel = supabase.channel(`webrtc:team-${selectedTeamId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const waitingMap: Record<string, boolean> = {}
        for (const key of Object.keys(presenceState)) {
          const list = presenceState[key] as LiveRoomPresence[]
          for (const p of list) {
            if (p.role === 'athlete') {
              waitingMap[(p.userId as string) || key] = true
            }
          }
        }
        setWaitingTeamMembers(waitingMap)
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences?: LiveRoomPresence[] }) => {
        if (newPresences) {
          setWaitingTeamMembers(prev => {
            const next = { ...prev }
            for (const p of newPresences) {
              if (p.role === 'athlete') {
                next[(p.userId as string) || 'athlete'] = true
              }
            }
            return next
          })
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences?: LiveRoomPresence[] }) => {
        if (leftPresences) {
          setWaitingTeamMembers(prev => {
            const next = { ...prev }
            for (const p of leftPresences) {
              if (p.userId) {
                delete next[p.userId as string]
              }
            }
            return next
          })
        }
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [selectedTeamId])

  const selectedClient = assignedClients.find(c => c.id === selectedClientId)
  const selectedTeam = availableTeams.find(t => t.id === selectedTeamId) || availableTeams[0]

  const handleLaunchIndividual = () => {
    if (!selectedClientId) return
    router.push(`/coach/clients/${selectedClientId}/live`)
  }

  const handleLaunchTeam = () => {
    if (!selectedTeamId) return
    router.push(`/coach/teams/${selectedTeamId}/live`)
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

  const handleRingTeam = async () => {
    if (!selectedTeamId) return
    try {
      setIsRingingTeam(true)
      setTeamRingFeedback(null)
      const res = await fetch(`/api/coach/teams/${selectedTeamId}/live-session-start`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setTeamRingFeedback(`✓ Live Squad Alert Sent to all members of ${selectedTeam?.name}!`)
      } else {
        setTeamRingFeedback(data.error || 'Failed to dispatch squad alert')
      }
    } catch {
      setTeamRingFeedback('Network error while dispatching squad alert')
    } finally {
      setIsRingingTeam(false)
      setTimeout(() => setTeamRingFeedback(null), 5000)
    }
  }

  const waitingTeamMemberCount = Object.keys(waitingTeamMembers).length

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

      {/* Header and Mode Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundImage: "url('/images/brand/forge-crest-mark.png')",
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#060A14',
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
                LIVE VIDEO STUDIO &amp; KINETIC MOVEMENT SCREEN
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
                WebRTC Mesh HD
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
              Forge Athletic Telehealth Studio
            </h2>
          </div>
        </div>

        {/* 1:1 vs Team Studio Mode Switcher */}
        <div
          data-testid="studio-mode-toggle"
          style={{
            display: 'inline-flex',
            background: 'rgba(7,12,22,0.85)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 6,
            padding: 3,
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setStudioMode('individual')}
            data-testid="mode-individual-btn"
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: studioMode === 'individual' ? '1px solid var(--gold)' : 'none',
              background: studioMode === 'individual' ? 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(212,160,23,0.12) 100%)' : 'transparent',
              color: studioMode === 'individual' ? 'var(--gold-lt)' : 'var(--gray)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="user" size={12} tone={studioMode === 'individual' ? 'gold' : 'slate'} />
            <span>1:1 Athlete</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('team')}
            data-testid="mode-team-btn"
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: studioMode === 'team' ? '1px solid var(--gold)' : 'none',
              background: studioMode === 'team' ? 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(212,160,23,0.12) 100%)' : 'transparent',
              color: studioMode === 'team' ? 'var(--gold-lt)' : 'var(--gray)',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <GaaIcon name="award" size={12} tone={studioMode === 'team' ? 'gold' : 'slate'} />
            <span>Team &amp; Squad</span>
            <span
              style={{
                background: '#10B981',
                color: '#060A14',
                fontSize: 9,
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: 10,
              }}
            >
              MULTI-PEER
            </span>
          </button>
        </div>
      </div>

      {/* ── Mode 1: 1:1 Live Video Studio ── */}
      {studioMode === 'individual' && (
        <div>
          {ringFeedback && (
            <div
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {ringFeedback}
            </div>
          )}

          <p style={{ color: 'var(--gray)', fontSize: 13, margin: '0 0 16px', maxWidth: 880, lineHeight: 1.5 }}>
            Directly coach real-time biomechanics, execute kinetic assessments (OHSA, single-leg squats), guide NASM tempo cadences, and record set performance logs for an individual athlete.
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
              No assigned athletes currently found. Select an athlete from the unassigned intake list to assign them to your roster.
            </div>
          ) : (
            <div>
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

                {/* Launch Action */}
                <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleLaunchIndividual}
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
                    <span>{isRinging ? 'Dispatching...' : 'Ring Athlete & Dispatch Link'}</span>
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
        </div>
      )}

      {/* ── Mode 2: Team & Squad Live Video Studio ── */}
      {studioMode === 'team' && (
        <div data-testid="team-studio-panel">
          {teamRingFeedback && (
            <div
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid #10B981',
                color: '#34D399',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              {teamRingFeedback}
            </div>
          )}

          <p style={{ color: 'var(--gray)', fontSize: 13, margin: '0 0 16px', maxWidth: 880, lineHeight: 1.5 }}>
            Host live multi-athlete squad coaching sessions with synchronized circuit interval timers, team-wide tempo metronomes, 1-click &quot;Mute All&quot;, and interactive athlete spotlighting for biomechanical breakdowns.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: '1 1 340px', minWidth: 280 }}>
              <label
                htmlFor="coach-live-team-select"
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
                Select Team / Squad to Train:
              </label>
              <select
                id="coach-live-team-select"
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#070C16',
                  border: waitingTeamMemberCount > 0 ? '1.5px solid #10B981' : '1.5px solid var(--gold)',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: waitingTeamMemberCount > 0 ? '0 0 14px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.5)',
                }}
              >
                {availableTeams.map(team => {
                  return (
                    <option key={team.id} value={team.id} style={{ background: '#0B1220', color: '#FFF' }}>
                      {team.name} ({team.members.length} Athletes) · {team.sportOrFocus}
                    </option>
                  )
                })}
              </select>

              {waitingTeamMemberCount > 0 && (
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
                  <span>{waitingTeamMemberCount} team athlete(s) currently waiting in the studio lobby!</span>
                </div>
              )}
            </div>

            {/* Launch Team Studio Actions */}
            <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleLaunchTeam}
                disabled={!selectedTeamId}
                data-testid="launch-team-studio-btn"
                className="tactile-btn"
                style={{
                  background: waitingTeamMemberCount > 0
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, var(--gold) 0%, var(--gold-lt) 100%)',
                  color: waitingTeamMemberCount > 0 ? '#FFFFFF' : '#080E14',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '11px 22px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: waitingTeamMemberCount > 0
                    ? '0 4px 20px rgba(16,185,129,0.55)'
                    : '0 4px 16px rgba(212,160,23,0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                <GaaIcon
                  name="video-studio"
                  size={16}
                  style={{
                    color: waitingTeamMemberCount > 0 ? '#FFFFFF' : '#080E14',
                    stroke: waitingTeamMemberCount > 0 ? '#FFFFFF' : '#080E14',
                  }}
                />
                <span>
                  {waitingTeamMemberCount > 0
                    ? `Join ${selectedTeam?.name} in Studio Lobby (${waitingTeamMemberCount} Waiting) →`
                    : `Enter Team Studio with ${selectedTeam?.name} (${selectedTeam?.members.length} Athletes) →`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRingTeam}
                disabled={!selectedTeamId || isRingingTeam}
                data-testid="ring-team-btn"
                style={{
                  background: 'rgba(212,160,23,0.12)',
                  border: '1px solid rgba(212,160,23,0.4)',
                  color: 'var(--gold-lt)',
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '11px 16px',
                  borderRadius: 6,
                  cursor: !isRingingTeam ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <GaaIcon name={isRingingTeam ? 'volume' : 'phone'} size={14} tone="gold" />
                <span>{isRingingTeam ? 'Alerting Team...' : 'Ring Squad (Alert All Members)'}</span>
              </button>
            </div>
          </div>

          {/* Team Roster Preview Cards */}
          {selectedTeam && selectedTeam.members.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                  Active Squad Roster ({selectedTeam.members.length} Athletes):
                </span>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                  {selectedTeam.description}
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 10,
                }}
              >
                {selectedTeam.members.map(member => {
                  const isWaiting = Boolean(waitingTeamMembers[member.clientId])
                  return (
                    <div
                      key={member.id}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: isWaiting ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 6,
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: isWaiting ? '#10B981' : '#6B7280',
                            boxShadow: isWaiting ? '0 0 8px #10B981' : 'none',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.fullName}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--gray)' }}>
                            {member.role === 'captain' ? '★ Squad Captain' : 'Squad Athlete'}
                          </div>
                        </div>
                      </div>
                      {isWaiting && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: '#34D399', background: 'rgba(16,185,129,0.15)', padding: '2px 5px', borderRadius: 3 }}>
                          IN LOBBY
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
