'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import GaaIcon from '@/components/ui/GaaIcon'

interface Slot {
  date: string
  time: string
  datetime: string
}

interface PackageItem {
  id: string
  package_name: string
  sessions_remaining: number
  sessions_total?: number
}

interface CoachScheduleSessionModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  packages?: PackageItem[]
  onSuccess?: () => void
}

export default function CoachScheduleSessionModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  packages = [],
  onSuccess,
}: CoachScheduleSessionModalProps) {
  const router = useRouter()
  const activePackages = useMemo(
    () => packages.filter(p => (p.sessions_remaining ?? 0) > 0),
    [packages]
  )

  const [mode, setMode] = useState<'calendar' | 'custom'>('calendar')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  // Custom date/time fields
  const [customDate, setCustomDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [customTime, setCustomTime] = useState('10:00')

  // Selected package or comp
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [isComp, setIsComp] = useState(false)

  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSlots([])
      setSelectedDate(null)
      setSelectedSlot(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoadingSlots(true)
    setError(null)

    if (activePackages.length > 0) {
      setSelectedPackageId(activePackages[0].id)
      setIsComp(false)
    } else {
      setSelectedPackageId('')
      setIsComp(true)
    }

    async function load() {
      try {
        const res = await fetch('/api/sessions/available')
        if (res.ok && !cancelled) {
          const data: Slot[] = await res.json()
          setSlots(data)
          if (data.length > 0) {
            setSelectedDate(data[0].date)
          }
        }
      } catch {
        // network error handled gracefully
      } finally {
        if (!cancelled) {
          setLoadingSlots(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isOpen])

  if (!isOpen) return null

  const availableDates = [...new Set(slots.map(s => s.date))]
  const slotsForDate = selectedDate ? slots.filter(s => s.date === selectedDate) : []

  function formatDateLabel(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    let scheduledAt: string | null = null

    if (mode === 'calendar') {
      if (!selectedSlot) {
        setError('Please select an available time slot.')
        return
      }
      scheduledAt = selectedSlot.datetime
    } else {
      if (!customDate || !customTime) {
        setError('Please specify both date and time.')
        return
      }
      const parsed = new Date(`${customDate}T${customTime}:00`)
      if (Number.isNaN(parsed.getTime())) {
        setError('Invalid custom date or time.')
        return
      }
      if (parsed.getTime() <= Date.now()) {
        setError('Scheduled appointment must be in the future.')
        return
      }
      scheduledAt = parsed.toISOString()
    }

    setBooking(true)

    try {
      const payload: {
        clientId: string
        scheduledAt: string
        packageId?: string
      } = {
        clientId,
        scheduledAt,
      }

      if (!isComp && selectedPackageId) {
        payload.packageId = selectedPackageId
      }

      const res = await fetch('/api/sessions/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to schedule session.')
        setBooking(false)
        return
      }

      onSuccess?.()
      router.refresh()
      onClose()
    } catch {
      setError('An unexpected error occurred while booking.')
      setBooking(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100050,
        background: 'rgba(4, 7, 14, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0e1726 0%, #080d16 100%)',
          border: '1px solid rgba(212, 160, 23, 0.4)',
          borderRadius: 12,
          maxWidth: 640,
          width: '100%',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 160, 23, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(212, 160, 23, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(212, 160, 23, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GaaIcon name="calendar" size={18} tone="gold" />
            </div>
            <div>
              <h2
                id="schedule-modal-title"
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--white)',
                  letterSpacing: '0.04em',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                SCHEDULE 1:1 CONSULTATION
              </h2>
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                Athlete: <strong style={{ color: 'var(--gold-lt)' }}>{clientName}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={booking}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--gray)',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleBook} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255, 61, 87, 0.15)',
                border: '1px solid var(--error)',
                borderRadius: 6,
                color: 'var(--error)',
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          )}

          {/* Credit & Package Assignment */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--navy-lt)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800, marginBottom: 8 }}>
              Credit Allocation &amp; Package
            </div>

            {activePackages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    id="pkg-retainer"
                    name="creditMode"
                    checked={!isComp}
                    onChange={() => setIsComp(false)}
                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  <label htmlFor="pkg-retainer" style={{ fontSize: 13, color: 'var(--white)', cursor: 'pointer', fontWeight: 600 }}>
                    Deduct from client&apos;s active package:
                  </label>
                </div>

                {!isComp && (
                  <select
                    value={selectedPackageId}
                    onChange={e => setSelectedPackageId(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      background: 'var(--navy)',
                      border: '1px solid var(--navy-lt)',
                      borderRadius: 6,
                      color: 'var(--white)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  >
                    {activePackages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.package_name} ({pkg.sessions_remaining} remaining)
                      </option>
                    ))}
                  </select>
                )}

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    type="radio"
                    id="pkg-comp"
                    name="creditMode"
                    checked={isComp}
                    onChange={() => setIsComp(true)}
                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  <label htmlFor="pkg-comp" style={{ fontSize: 13, color: 'var(--gray)', cursor: 'pointer' }}>
                    Grant as Complimentary / Coach Comp session (0 credits deducted)
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: 'var(--white)', marginBottom: 6 }}>
                  Client has <strong style={{ color: 'var(--error)' }}>0 active session credits</strong>.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="auto-comp"
                    checked={isComp}
                    onChange={e => setIsComp(e.target.checked)}
                    style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  <label htmlFor="auto-comp" style={{ fontSize: 12.5, color: 'var(--gold-lt)', cursor: 'pointer', fontWeight: 600 }}>
                    Auto-grant complimentary session credit for this booking
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Mode Selector (Available Slots vs Custom Date/Time) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', fontWeight: 800 }}>
                Select Appointment Slot
              </span>
              <div style={{ display: 'flex', background: 'var(--navy)', borderRadius: 6, padding: 2, border: '1px solid var(--navy-lt)' }}>
                <button
                  type="button"
                  onClick={() => setMode('calendar')}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: mode === 'calendar' ? 'var(--gold)' : 'transparent',
                    color: mode === 'calendar' ? '#080E14' : 'var(--gray)',
                  }}
                >
                  Standard Slots
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  style={{
                    padding: '4px 10px',
                    fontSize: 11,
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: mode === 'custom' ? 'var(--gold)' : 'transparent',
                    color: mode === 'custom' ? '#080E14' : 'var(--gray)',
                  }}
                >
                  Custom Time
                </button>
              </div>
            </div>

            {mode === 'calendar' ? (
              loadingSlots ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--gray)', fontSize: 13 }}>
                  Loading available consultation slots...
                </div>
              ) : slots.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--navy)', border: '1px solid var(--navy-lt)', borderRadius: 6, color: 'var(--gray)', fontSize: 13 }}>
                  No open slots found in the next 14 days. Switch to &quot;Custom Time&quot; to override.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Date selection bar */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(68px, 1fr))',
                      gap: 4,
                      background: 'rgba(255,255,255,0.03)',
                      padding: 4,
                      borderRadius: 6,
                    }}
                  >
                    {availableDates.slice(0, 7).map(date => {
                      const isSelected = selectedDate === date
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedSlot(null)
                          }}
                          style={{
                            padding: '8px 4px',
                            background: isSelected ? 'var(--gold)' : 'var(--navy)',
                            color: isSelected ? '#080E14' : 'var(--white)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--gold)' : 'var(--navy-lt)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        >
                          {formatDateLabel(date)}
                        </button>
                      )
                    })}
                  </div>

                  {/* Time slots for selected date */}
                  {selectedDate && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                        gap: 6,
                        maxHeight: 180,
                        overflowY: 'auto',
                        padding: '4px 0',
                      }}
                    >
                      {slotsForDate.map(slot => {
                        const isSelected = selectedSlot?.datetime === slot.datetime
                        return (
                          <button
                            key={slot.datetime}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '8px 6px',
                              background: isSelected ? 'var(--gold)' : 'var(--navy)',
                              color: isSelected ? '#080E14' : 'var(--white)',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--gold)' : 'var(--navy-lt)',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {slot.time}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {selectedSlot && (
                    <div style={{ padding: '10px 14px', background: 'rgba(212,160,23,0.1)', border: '1px solid var(--gold)', borderRadius: 6, fontSize: 13, color: 'var(--gold-lt)' }}>
                      ✓ Selected: <strong>{formatDateLabel(selectedSlot.date)} at {selectedSlot.time} ET</strong> (60-minute session)
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Custom Date / Time Input */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={e => setCustomDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--navy)',
                      border: '1px solid var(--navy-lt)',
                      borderRadius: 6,
                      color: 'var(--white)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--gray)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--navy)',
                      border: '1px solid var(--navy-lt)',
                      borderRadius: 6,
                      color: 'var(--white)',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={booking}
              style={{
                padding: '9px 16px',
                background: 'transparent',
                border: '1px solid var(--navy-lt)',
                borderRadius: 4,
                color: 'var(--gray)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={booking}
              style={{
                padding: '9px 22px',
                background: booking ? 'var(--navy-lt)' : 'var(--gold)',
                color: booking ? 'var(--gray)' : '#080E14',
                border: 'none',
                borderRadius: 4,
                fontFamily: 'var(--font-sans, Raleway), sans-serif',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: booking ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {booking ? 'Scheduling...' : 'Confirm Consultation Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

