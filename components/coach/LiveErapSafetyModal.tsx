'use client'

import React, { useState, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

export interface ClientErapData {
  clientId: string
  athleteName: string
  athleteEmail: string | null
  athletePhone: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  medicalConditions: string | null
  riskTier?: string
  clearanceStatus?: string
  erap?: {
    workoutLocationSummary?: string
    workoutStreetAddress?: string
    workoutUnitOrGateCode?: string
    workoutCity?: string
    workoutState?: string
    workoutPostalCode?: string
    localEmergencyDispatchPhone?: string
    hasAcceptedVirtualTelehealthConsent?: boolean
    isErapComplete?: boolean
  }
  virtualTelehealthDisclaimer?: string
}

interface LiveErapSafetyModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  athleteName?: string
  initialData?: ClientErapData | null
}

export default function LiveErapSafetyModal({
  isOpen,
  onClose,
  clientId,
  athleteName = 'Athlete',
  initialData,
}: LiveErapSafetyModalProps) {
  const [data, setData] = useState<ClientErapData | null>(initialData || null)
  const [loading, setLoading] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchErapData = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/coach/clients/${clientId}/erap`)
      if (!res.ok) {
        throw new Error(`Failed to load ERAP data (${res.status})`)
      }
      const json: ClientErapData = await res.json()
      setData(json)
    } catch (err) {
      console.warn('[LiveErapSafetyModal] Could not fetch ERAP record:', err)
      setFetchError(err instanceof Error ? err.message : 'Unable to load remote ERAP data')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (isOpen) {
      fetchErapData()
    }
  }, [isOpen, fetchErapData])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const erap = data?.erap
  const resolvedAthleteName = data?.athleteName || athleteName
  const dispatchPhone = erap?.localEmergencyDispatchPhone || '911 (Local PSAP)'
  const _hasLocalDispatch = dispatchPhone && !dispatchPhone.startsWith('911')

  const fullStreet = erap?.workoutStreetAddress
  const fullCityStateZip = [erap?.workoutCity, erap?.workoutState, erap?.workoutPostalCode]
    .filter(Boolean)
    .join(', ')
  const gateCode = erap?.workoutUnitOrGateCode

  const fullAddressString = [
    fullStreet,
    gateCode ? `(${gateCode})` : null,
    fullCityStateZip,
  ]
    .filter(Boolean)
    .join(' · ') || 'Address not on file (Request before session)'

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(fullAddressString)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(dispatchPhone)
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div
      data-testid="live-erap-safety-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="erap-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#090D16',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          borderRadius: 14,
          maxWidth: 780,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 35px rgba(239, 68, 68, 0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.14) 0%, rgba(9, 13, 22, 0) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              <GaaIcon name="shield-alert" size={20} tone="inherit" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#F87171',
                }}
              >
                NASM VCS CLINICAL EMERGENCY REMOTE ACTION PLAN (ERAP)
              </div>
              <h2
                id="erap-modal-title"
                style={{
                  margin: '2px 0 0',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '0.01em',
                }}
              >
                Emergency Response Protocol · {resolvedAthleteName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close ERAP modal"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 6,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <GaaIcon name="close" size={14} tone="inherit" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: 20,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {loading && !data && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
              Loading athlete remote safety profile...
            </div>
          )}

          {fetchError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
                fontSize: 12,
              }}
            >
              ⚠️ {fetchError} — displaying cached intake telemetry.
            </div>
          )}

          {/* Critical Dispatch Callout */}
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(30, 15, 20, 0.6) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#FCA5A5',
                    letterSpacing: '0.08em',
                  }}
                >
                  Local Municipal Emergency Dispatch (Police / EMS)
                </span>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginTop: 2, letterSpacing: '0.02em' }}>
                  {dispatchPhone}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href={`tel:${dispatchPhone.replace(/[^\d+]/g, '')}`}
                  data-testid="erap-dispatch-phone-btn"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    background: '#DC2626',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: 13,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                  }}
                >
                  <GaaIcon name="phone" size={14} tone="inherit" />
                  <span>Call Local Dispatch</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFF',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <GaaIcon name="copy" size={13} tone="inherit" />
                  <span>{copiedPhone ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#E5E7EB', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
              <strong>NASM Protocol Notice:</strong> Dialing 911 directly from your phone connects to <em>your</em> local dispatch, not the athlete&apos;s city. In acute remote events, dial the client&apos;s local municipal dispatch number above so first responders arrive directly at their home.
            </div>
          </div>

          {/* Two-Column Grid: Location & Emergency Contacts */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 14,
            }}
          >
            {/* Physical Workout Location */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF' }}>
                  Remote Physical Workout Location
                </span>
                <button
                  type="button"
                  data-testid="erap-copy-address-btn"
                  onClick={handleCopyAddress}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedAddress ? '#34D399' : '#60A5FA',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                  }}
                >
                  <GaaIcon name="copy" size={11} tone="inherit" />
                  <span>{copiedAddress ? 'Copied to Clipboard!' : 'Copy Address'}</span>
                </button>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>
                {fullStreet || 'Street address not on file'}
              </div>

              {gateCode && (
                <div style={{ fontSize: 12, color: '#FCD34D', fontWeight: 600 }}>
                  Unit / Gate / Access Code: <strong>{gateCode}</strong>
                </div>
              )}

              <div style={{ fontSize: 12, color: '#D1D5DB' }}>
                {fullCityStateZip || 'City, State, Zip missing'}
              </div>

              {!fullStreet && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#FBBF24',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '6px 8px',
                    borderRadius: 4,
                  }}
                >
                  ⚠️ Incomplete location. Request exact workout address from athlete prior to loaded barbell work.
                </div>
              )}
            </div>

            {/* Emergency Contacts & Phone */}
            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#9CA3AF' }}>
                Emergency Contact & Athlete Details
              </span>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Primary Emergency Contact</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                    {data?.emergencyContactName || 'None listed'}
                  </div>
                </div>
                {data?.emergencyContactPhone && (
                  <a
                    href={`tel:${data.emergencyContactPhone}`}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <GaaIcon name="phone" size={11} tone="inherit" />
                    <span>{data.emergencyContactPhone}</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>Athlete Mobile Phone</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>
                    {data?.athletePhone || 'No phone on file'}
                  </div>
                </div>
                {data?.athletePhone && (
                  <a
                    href={`tel:${data.athletePhone}`}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <GaaIcon name="phone" size={11} tone="inherit" />
                    <span>Call Athlete</span>
                  </a>
                )}
              </div>

              {data?.medicalConditions && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#F87171' }}>
                  <strong>Flagged Conditions:</strong> {data.medicalConditions}
                </div>
              )}
            </div>
          </div>

          {/* NASM 4-Step Acute Remote Response Standard */}
          <div
            style={{
              padding: 14,
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#60A5FA', letterSpacing: '0.06em' }}>
              NASM VCS 4-Step Acute Remote Incident Standard
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                <strong style={{ color: '#93C5FD' }}>1. Maintain Live Audio/Video:</strong> Do not disconnect stream. Continue verbal contact with athlete or family.
              </div>
              <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                <strong style={{ color: '#93C5FD' }}>2. Dispatch Local First Responders:</strong> State: &ldquo;I am a remote fitness coach monitoring an athlete experiencing a medical emergency at [Address].&rdquo;
              </div>
              <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                <strong style={{ color: '#93C5FD' }}>3. Notify Emergency Contact:</strong> Dial emergency contact phone while local dispatch units are en route.
              </div>
              <div style={{ fontSize: 11, color: '#E2E8F0', lineHeight: 1.4 }}>
                <strong style={{ color: '#93C5FD' }}>4. Document Complete Log:</strong> Record timestamp, observed symptoms, loaded movement in progress, and dispatch call record.
              </div>
            </div>
          </div>

          {/* Connection Interruption / Immediate Rack Fail-Safe Notice */}
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }}>
              <GaaIcon name="alert-triangle" size={16} tone="inherit" />
            </div>
            <div style={{ fontSize: 11, color: '#FDE68A', lineHeight: 1.5 }}>
              <strong>Video Loss Fail-Safe Protocol:</strong> In accordance with NASM Virtual Coaching guidelines, if WebRTC video or audio latency drops or disconnects during a heavy compound lift, the athlete has agreed to <em>immediately rack all weights safely</em>. Virtual coaches cannot spot from afar.
            </div>
          </div>

          {/* Telehealth Legal Consent Status */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 4,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 11,
              color: '#9CA3AF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: erap?.hasAcceptedVirtualTelehealthConsent ? '#34D399' : '#F59E0B',
                }}
              />
              <span>
                Virtual Telehealth Legal Consent:{' '}
                <strong style={{ color: erap?.hasAcceptedVirtualTelehealthConsent ? '#34D399' : '#F59E0B' }}>
                  {erap?.hasAcceptedVirtualTelehealthConsent ? 'Signed & Verified' : 'Standard Liability Active'}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Return to Live HUD
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
