'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  generateIcsCalendar,
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '@/lib/calendar-sync'

export interface CoachScheduledSession {
  id: string
  clientId: string
  clientName: string
  clientEmail?: string
  scheduledAt: string
  status?: string | null
  durationMins?: number | null
}

interface CoachLiveScheduleAgendaProps {
  sessions: CoachScheduledSession[]
}

function formatSessionDateEt(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  })
}

function formatSessionTimeEt(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  })
}

function getCountdownLabel(isoString: string): string {
  const diffMs = new Date(isoString).getTime() - Date.now()
  if (diffMs < 0) return 'In Progress / Overdue'
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 60) return `In ${diffMins}m`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `In ${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  return `In ${diffDays}d`
}

export default function CoachLiveScheduleAgenda({ sessions }: CoachLiveScheduleAgendaProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadIcs = (session: CoachScheduledSession) => {
    setDownloadingId(session.id)
    try {
      const ics = generateIcsCalendar({
        title: `Forge Athletic: Live 1-on-1 Studio Session w/ ${session.clientName}`,
        description: `Live Diagnostic & Movement Screen Session with athlete ${session.clientName}.\nStudio Room: https://forge-athletic.app/coach/clients/${session.clientId}/live`,
        startTime: session.scheduledAt,
        durationMins: session.durationMins || 60,
        location: `https://forge-athletic.app/coach/clients/${session.clientId}/live`,
      })
      downloadIcsFile(`coach-session-${session.clientName.toLowerCase().replace(/\s+/g, '-')}`, ics)
    } finally {
      setTimeout(() => setDownloadingId(null), 1000)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(13,27,42,0.95) 0%, rgba(9,15,26,0.98) 100%)',
        border: '1px solid rgba(212,160,23,0.3)',
        borderRadius: 10,
        padding: '20px 22px',
        marginBottom: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header with Operating Hours */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          paddingBottom: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="calendar" size={18} tone="gold" />
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 17,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '0.04em',
                fontWeight: 700,
              }}
            >
              COACH GORDON LIVE CALENDAR &amp; STUDIO SCHEDULE
            </h2>
            <span
              style={{
                padding: '2px 8px',
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.4)',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 800,
                color: '#34D399',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Forge Session Engine Live
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#94A3B8', fontFamily: 'Raleway, sans-serif' }}>
            Athletes self-serve live bookings. Only unbooked slots within active hours are shown available.
          </p>
        </div>

        {/* Operating Hours Badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="moon" size={14} tone="gold" />
            <span style={{ fontSize: 11.5, color: '#FFFFFF', fontWeight: 600 }}>
              M–F: <span style={{ color: 'var(--gold-lt)', fontWeight: 700 }}>5:00 PM – 8:00 PM ET</span>
            </span>
          </div>

          <div
            style={{
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="sun" size={14} tone="gold" />
            <span style={{ fontSize: 11.5, color: '#FFFFFF', fontWeight: 600 }}>
              Weekends: <span style={{ color: 'var(--gold-lt)', fontWeight: 700 }}>8:00 AM – 2:00 PM ET</span>
            </span>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div style={{ marginTop: 16 }}>
        {sessions.length === 0 ? (
          <div
            style={{
              padding: '24px 20px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 8,
              border: '1px dashed rgba(255,255,255,0.12)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', fontFamily: 'Raleway, sans-serif' }}>
              No upcoming 1-on-1 sessions booked on your live calendar. All open evening and weekend slots are published for self-service athlete bookings.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {sessions.map(session => {
              const dateEt = formatSessionDateEt(session.scheduledAt)
              const timeEt = formatSessionTimeEt(session.scheduledAt)
              const countdown = getCountdownLabel(session.scheduledAt)
              const googleCalUrl = generateGoogleCalendarUrl({
                title: `Forge Athletic: Live 1-on-1 Studio w/ ${session.clientName}`,
                description: `Live Diagnostic & Movement Screen Session with athlete ${session.clientName}.\nStudio Room: https://forge-athletic.app/coach/clients/${session.clientId}/live`,
                startTime: session.scheduledAt,
                durationMins: session.durationMins || 60,
                location: `https://forge-athletic.app/coach/clients/${session.clientId}/live`,
              })

              return (
                <div
                  key={session.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(212,160,23,0.25)',
                    borderRadius: 8,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span
                        suppressHydrationWarning
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--gold-lt)',
                        }}
                      >
                        {countdown}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(52,211,153,0.15)',
                          color: '#34D399',
                          fontWeight: 700,
                        }}
                      >
                        Confirmed Slot
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                      {session.clientName}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gold-lt)', fontWeight: 600 }}>
                      <GaaIcon name="clock" size={13} tone="gold" />
                      <span suppressHydrationWarning>{dateEt} at {timeEt} ET</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link
                      href={`/coach/clients/${session.clientId}/live`}
                      className="tactile-btn"
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <GaaIcon name="video-studio" size={12} tone="white" />
                      <span>Launch Studio</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDownloadIcs(session)}
                      disabled={downloadingId === session.id}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 4,
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Download .ics file for Apple / Outlook Calendar"
                    >
                      <GaaIcon name="calendar" size={11} tone="gold" />
                      <span>{downloadingId === session.id ? 'Exporting...' : 'Apple/Outlook (.ics)'}</span>
                    </button>

                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 4,
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Add to Google Calendar"
                    >
                      <span>Google Cal</span>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
