'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  generateIcsCalendar,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadIcsFile,
} from '@/lib/calendar-sync'

interface Slot {
  date: string
  time: string
  datetime: string
}

interface Package {
  id: string
  package_name: string
  sessions_remaining: number
}

interface SlotPickerProps {
  packages: Package[]
}

type TimeOfDayFilter = 'all' | 'evening' | 'morning' | 'afternoon'

export default function SlotPicker({ packages }: SlotPickerProps) {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id ?? '')
  const [timeFilter, setTimeFilter] = useState<TimeOfDayFilter>('all')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Booking Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState<{
    slot: Slot
    packageName: string
    sessionId?: string
  } | null>(null)

  // Client local timezone detection
  const clientTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
    } catch {
      return 'America/New_York'
    }
  }, [])

  const isDifferentTz = clientTimeZone !== 'America/New_York'

  useEffect(() => {
    let cancelled = false
    async function fetchSlots() {
      setLoading(true)
      try {
        const res = await fetch('/api/sessions/available?days=28')
        if (res.ok && !cancelled) {
          const data: Slot[] = await res.json()
          setSlots(data)
          if (data.length > 0) {
            setSelectedDate(prev => prev ?? data[0].date)
          }
        }
      } catch {
        // network error handled gracefully
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchSlots()

    return () => {
      cancelled = true
    }
  }, [])

  // Aggregate available dates and open slot counts
  const dateSlotCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const slot of slots) {
      counts[slot.date] = (counts[slot.date] || 0) + 1
    }
    return counts
  }, [slots])

  const availableDates = useMemo(() => {
    return Object.keys(dateSlotCounts).sort()
  }, [dateSlotCounts])

  // Filter slots for currently selected date
  const rawSlotsForDate = useMemo(() => {
    return selectedDate ? slots.filter(s => s.date === selectedDate) : []
  }, [selectedDate, slots])

  // Filter by time of day
  const filteredSlotsForDate = useMemo(() => {
    if (timeFilter === 'all') return rawSlotsForDate
    return rawSlotsForDate.filter(s => {
      const nyHour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          hour12: false,
        }).format(new Date(s.datetime)),
        10
      )
      if (timeFilter === 'evening') return nyHour >= 17 && nyHour < 21
      if (timeFilter === 'morning') return nyHour >= 8 && nyHour < 12
      if (timeFilter === 'afternoon') return nyHour >= 12 && nyHour < 17
      return true
    })
  }, [rawSlotsForDate, timeFilter])

  const selectedPackage = useMemo(() => {
    return packages.find(p => p.id === selectedPackageId) || packages[0]
  }, [packages, selectedPackageId])

  async function handleBook() {
    if (!selectedSlot || !selectedPackageId) return
    setBooking(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageId,
          scheduledAt: selectedSlot.datetime,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setConfirmedBooking({
          slot: selectedSlot,
          packageName: selectedPackage?.package_name || 'Active Package',
          sessionId: data.session?.id,
        })
        // Refresh server router so upcoming sessions stick to the dashboard and live schedule
        router.refresh()
      } else {
        setError(data.error ?? 'Failed to book session. Please try again.')
      }
    } catch {
      setError('A network error occurred while booking. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  function formatDateLabel(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    return {
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    }
  }

  function formatLocalTime(isoString: string): string {
    const d = new Date(isoString)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: clientTimeZone,
    })
  }

  // Quick jump helper to find first matching date
  const handleQuickJump = (type: 'today' | 'tomorrow' | 'weekend' | 'nextWeek') => {
    const now = new Date()
    const nyDateFmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

    if (type === 'today') {
      const todayStr = nyDateFmt.format(now)
      if (availableDates.includes(todayStr)) {
        setSelectedDate(todayStr)
        setSelectedSlot(null)
        return
      }
    }

    if (type === 'tomorrow') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = nyDateFmt.format(tomorrow)
      if (availableDates.includes(tomorrowStr)) {
        setSelectedDate(tomorrowStr)
        setSelectedSlot(null)
        return
      }
    }

    if (type === 'weekend') {
      const weekendMatch = availableDates.find(d => {
        const dateObj = new Date(d + 'T12:00:00')
        const day = dateObj.getDay()
        return day === 0 || day === 6
      })
      if (weekendMatch) {
        setSelectedDate(weekendMatch)
        setSelectedSlot(null)
        return
      }
    }

    if (type === 'nextWeek') {
      const nextWeekDate = new Date(now)
      nextWeekDate.setDate(nextWeekDate.getDate() + 7)
      const targetStr = nyDateFmt.format(nextWeekDate)
      const match = availableDates.find(d => d >= targetStr) || availableDates[availableDates.length - 1]
      if (match) {
        setSelectedDate(match)
        setSelectedSlot(null)
        return
      }
    }

    if (availableDates.length > 0) {
      setSelectedDate(availableDates[0])
      setSelectedSlot(null)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIRMATION VIEW (Mindbody Post-Booking Experience with Live Calendar Sync)
  // ───────────────────────────────────────────────────────────────────────────
  if (confirmedBooking) {
    const { slot, packageName } = confirmedBooking
    const dateDetails = formatDateLabel(slot.date)
    const googleCalUrl = generateGoogleCalendarUrl({
      title: 'Forge Athletic: Live 1-on-1 Studio Session w/ Coach Gordon',
      description: `Live Diagnostic & Movement Screen Session in the Forge Athletic Video Studio.\n\nStudio Room: https://forge-athletic.app/dashboard/live\nCredit Deducted: 1 session from ${packageName}`,
      startTime: slot.datetime,
      durationMins: 60,
      location: 'https://forge-athletic.app/dashboard/live',
    })

    const outlookCalUrl = generateOutlookCalendarUrl({
      title: 'Forge Athletic: Live 1-on-1 Studio Session w/ Coach Gordon',
      description: `Live Diagnostic & Movement Screen Session in the Forge Athletic Video Studio.\n\nStudio Room: https://forge-athletic.app/dashboard/live`,
      startTime: slot.datetime,
      durationMins: 60,
      location: 'https://forge-athletic.app/dashboard/live',
    })

    const handleDownloadIcs = () => {
      const ics = generateIcsCalendar({
        title: 'Forge Athletic: Live 1-on-1 Studio Session w/ Coach Gordon',
        description: `Live Diagnostic & Movement Screen Session in the Forge Athletic Video Studio.\n\nStudio Room: https://forge-athletic.app/dashboard/live\nCredit Deducted: 1 session from ${packageName}`,
        startTime: slot.datetime,
        durationMins: 60,
        location: 'https://forge-athletic.app/dashboard/live',
      })
      downloadIcsFile(`forge-live-session-${slot.date}`, ics)
    }

    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16,22,38,0.98) 0%, rgba(9,15,26,0.98) 100%)',
          border: '1px solid rgba(52,211,153,0.45)',
          borderRadius: 12,
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(52,211,153,0.15)',
            border: '2px solid #34D399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 20px rgba(52,211,153,0.3)',
          }}
        >
          <GaaIcon name="shield-check" size={28} tone="emerald" />
        </div>

        <span
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#34D399',
            fontWeight: 800,
          }}
        >
          Session Booked &amp; Confirmed
        </span>

        <h2
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 24,
            color: '#FFFFFF',
            margin: '8px 0 12px',
            letterSpacing: '0.04em',
          }}
        >
          SYNCED TO YOUR LIVE CALENDAR
        </h2>

        {/* Session Details Box */}
        <div
          style={{
            maxWidth: 520,
            margin: '0 auto 24px',
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212,160,23,0.3)',
            borderRadius: 10,
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-lt)' }}>
              1-on-1 Diagnostic &amp; Movement Screen
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(212,160,23,0.15)',
                color: 'var(--gold-lt)',
                fontWeight: 700,
              }}
            >
              60 Minutes
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontSize: 14 }}>
              <GaaIcon name="calendar" size={16} tone="gold" />
              <span>{dateDetails.full}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontSize: 14 }}>
              <GaaIcon name="clock" size={16} tone="gold" />
              <span>
                {slot.time} ET
                {isDifferentTz && (
                  <span style={{ color: 'var(--gray)', fontSize: 13, marginLeft: 6 }}>
                    ({formatLocalTime(slot.datetime)} local)
                  </span>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontSize: 14 }}>
              <GaaIcon name="video-studio" size={16} tone="gold" />
              <span>Forge Athletic Live Video Studio (Coach Gordon)</span>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12,
              color: 'var(--gray)',
            }}
          >
            Session credit deducted from: <strong style={{ color: '#FFFFFF' }}>{packageName}</strong>
          </div>
        </div>

        {/* Calendar Sync Direct Export Actions */}
        <div style={{ maxWidth: 520, margin: '0 auto 28px', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--gold-lt)',
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Add to your Personal Calendar
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tactile-btn"
              style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="calendar" size={15} tone="gold" />
              <span>Add to Google Calendar</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="tactile-btn"
              style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <GaaIcon name="calendar" size={15} tone="gold" />
              <span>Apple / Outlook (.ics)</span>
            </button>

            <a
              href={outlookCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tactile-btn"
              style={{
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 6,
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Outlook Web</span>
            </a>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/live"
            className="tactile-btn"
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              borderRadius: 6,
              fontFamily: 'var(--font-sans, Raleway), sans-serif',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textDecoration: 'none',
            }}
          >
            Enter Live Studio Room →
          </Link>

          <Link
            href="/dashboard"
            className="sgf-button sgf-button-secondary"
            style={{
              padding: '12px 24px',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Return to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => {
              setConfirmedBooking(null)
              setSelectedSlot(null)
            }}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              color: 'var(--gray)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Book Another Slot
          </button>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)', margin: 0 }}>
          Connecting to Coach Gordon live studio schedule...
        </p>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // NO SLOTS AVAILABLE STATE
  // ───────────────────────────────────────────────────────────────────────────
  if (slots.length === 0) {
    return (
      <div
        style={{
          background: 'var(--navy-mid)',
          border: '1px solid var(--navy-lt)',
          padding: 32,
          textAlign: 'center',
          borderRadius: 8,
        }}
      >
        <GaaIcon name="calendar" size={32} tone="gold" />
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 16, color: '#FFFFFF', margin: '12px 0 6px', fontWeight: 600 }}>
          No open slots currently available in the next 28 days.
        </p>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
          Coach Gordon operating hours: Mon–Fri 5:00 PM – 8:00 PM ET &bull; Weekends 8:00 AM – 2:00 PM ET.<br />
          Please check back or contact Coach Gordon via messages to request an appointment.
        </p>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MAIN MINDBODY SELF-SERVE BOOKING INTERFACE
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Coach Operating Hours & Mindbody Engine Status ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Coach Gordon Active Hours · Real-Time Availability
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold-lt)' }}>
              Mon–Fri: 5:00 PM – 8:00 PM ET &nbsp;|&nbsp; Weekends: 8:00 AM – 2:00 PM ET
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--gray)' }}>
          {isDifferentTz ? `Showing ET & your local time (${clientTimeZone})` : 'All times displayed in Eastern Time (ET)'}
        </div>
      </div>

      {/* ── Package selector (if multiple) ── */}
      {packages.length > 1 && (
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 600,
              fontSize: 11,
              color: 'var(--gray)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Redeem credit from package:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {packages.map(pkg => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackageId(pkg.id)}
                aria-pressed={selectedPackageId === pkg.id}
                style={{
                  background: selectedPackageId === pkg.id ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.03)',
                  border: selectedPackageId === pkg.id ? '1px solid var(--gold)' : '1px solid var(--navy-lt)',
                  borderRadius: 6,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--white)' }}>
                  {pkg.package_name}
                </span>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: 12, color: 'var(--gold-lt)', fontWeight: 700 }}>
                  {pkg.sessions_remaining} {pkg.sessions_remaining === 1 ? 'credit' : 'credits'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Date Carousel / Rail (Mindbody Style) ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontWeight: 600,
              fontSize: 11,
              color: 'var(--gray)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            Select Date · {availableDates.length} Days with Open Slots
          </p>

          {/* Quick jump pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Today', action: () => handleQuickJump('today') },
              { label: 'Tomorrow', action: () => handleQuickJump('tomorrow') },
              { label: 'This Weekend', action: () => handleQuickJump('weekend') },
              { label: 'Next Week', action: () => handleQuickJump('nextWeek') },
            ].map(pill => (
              <button
                key={pill.label}
                type="button"
                onClick={pill.action}
                style={{
                  padding: '3px 8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--white)',
                  cursor: 'pointer',
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal scrollable date rail */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 6,
            scrollbarWidth: 'thin',
          }}
        >
          {availableDates.map(date => {
            const labels = formatDateLabel(date)
            const count = dateSlotCounts[date] || 0
            const isSelected = selectedDate === date

            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date)
                  setSelectedSlot(null)
                }}
                aria-pressed={isSelected}
                style={{
                  flex: '0 0 auto',
                  minWidth: 84,
                  background: isSelected
                    ? 'linear-gradient(135deg, var(--gold) 0%, #B8860B 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '10px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isSelected ? '#0D1B2A' : 'var(--gray)',
                  }}
                >
                  {labels.weekday}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: isSelected ? '#0D1B2A' : '#FFFFFF',
                    margin: '2px 0',
                  }}
                >
                  {labels.monthDay}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: isSelected ? '#0D1B2A' : '#34D399',
                  }}
                >
                  {count} {count === 1 ? 'slot' : 'slots'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Time Slots Grid ── */}
      {selectedDate && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Open Slots for {formatDateLabel(selectedDate).full}
              </span>
            </div>

            {/* Time of Day Tabs */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[
                { id: 'all' as const, label: 'All Times' },
                { id: 'evening' as const, label: 'Evening (5–8pm)' },
                { id: 'morning' as const, label: 'Morning (8am–12pm)' },
                { id: 'afternoon' as const, label: 'Afternoon (12–2pm)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeFilter(tab.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    background: timeFilter === tab.id ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                    color: timeFilter === tab.id ? '#0D1B2A' : 'var(--gray)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredSlotsForDate.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)' }}>
                No open slots match the selected time filter. Try selecting &quot;All Times&quot; above.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8,
              }}
            >
              {filteredSlotsForDate.map(slot => {
                const isSelected = selectedSlot?.datetime === slot.datetime
                const localTimeStr = isDifferentTz ? formatLocalTime(slot.datetime) : null

                return (
                  <button
                    key={slot.datetime}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={isSelected}
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(212,160,23,0.3) 0%, rgba(212,160,23,0.15) 100%)'
                        : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      padding: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(212,160,23,0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontFamily: 'Raleway, sans-serif',
                          fontWeight: 700,
                          fontSize: 15,
                          color: isSelected ? 'var(--gold-lt)' : '#FFFFFF',
                        }}
                      >
                        {slot.time} ET
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: '#34D399',
                          padding: '1px 5px',
                          background: 'rgba(52,211,153,0.15)',
                          borderRadius: 3,
                        }}
                      >
                        Open Slot
                      </span>
                    </div>

                    {localTimeStr && (
                      <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                        {localTimeStr} local
                      </span>
                    )}

                    <span style={{ fontSize: 11, color: isSelected ? '#FFFFFF' : 'var(--gray)', marginTop: 2 }}>
                      Coach Gordon &bull; 60 min
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Booking Confirmation Drawer ── */}
      {selectedSlot && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,22,38,0.98) 0%, rgba(13,27,42,0.95) 100%)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 10,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--gold-lt)',
                  fontWeight: 800,
                }}
              >
                Confirm Appointment &amp; Sync to Calendar
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 18,
                  color: '#FFFFFF',
                  margin: '4px 0 2px',
                  letterSpacing: '0.04em',
                }}
              >
                {formatDateLabel(selectedSlot.date).full} at {selectedSlot.time} ET
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#94A3B8' }}>
                1-on-1 Kinetic Chain Movement Screen &bull; Forge Athletic Live Video Studio
              </p>
            </div>

            <div
              style={{
                padding: '8px 14px',
                background: 'rgba(212,160,23,0.12)',
                borderRadius: 6,
                border: '1px solid rgba(212,160,23,0.3)',
                fontSize: 12,
                color: 'var(--gold-lt)',
                fontWeight: 600,
              }}
            >
              Deducting 1 credit from: <strong style={{ color: '#FFFFFF' }}>{selectedPackage?.package_name}</strong>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255, 61, 87, 0.15)',
                border: '1px solid var(--error)',
                borderRadius: 6,
                color: 'var(--error)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleBook}
              disabled={booking}
              className="tactile-btn"
              style={{
                padding: '14px 28px',
                background: booking
                  ? 'var(--navy-lt)'
                  : 'linear-gradient(135deg, var(--gold) 0%, #B8860B 100%)',
                color: booking ? 'var(--gray)' : '#080E18',
                border: 'none',
                borderRadius: 6,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 13,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: booking ? 'not-allowed' : 'pointer',
                boxShadow: booking ? 'none' : '0 4px 14px rgba(212,160,23,0.35)',
              }}
            >
              {booking ? 'Locking Slot & Syncing...' : 'Confirm & Sync Booking →'}
            </button>

            <button
              type="button"
              onClick={() => setSelectedSlot(null)}
              disabled={booking}
              style={{
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                color: 'var(--gray)',
                fontSize: 13,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
