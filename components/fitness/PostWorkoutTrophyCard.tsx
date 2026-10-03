'use client'

import React, { useRef, useState } from 'react'
import GaaMasterWatermarkSeal from '@/components/ui/GaaMasterWatermarkSeal'
import { GaaIcon, GaaIconName } from '@/components/ui/GaaIcon'

export interface PostWorkoutTrophyData {
  dayNumber: number
  focus: string
  durationMinutes: number
  totalVolumeLbs: number
  totalSets: number
  totalReps: number
  cardioModality?: string | null
  cardioMinutes?: number | null
  avgRpe?: number | null
  athleteName?: string | null
  completedDate?: string
}

export function getTonnageEquivalence(lbs: number): { title: string; icon: string; iconName: GaaIconName; description: string } {
  if (lbs < 4000) {
    return {
      title: 'Grand Concert Piano',
      icon: '✦',
      iconName: 'sparkles',
      description: 'You moved the weight of a full concert grand piano today.',
    }
  } else if (lbs < 8500) {
    return {
      title: 'Cadillac Escalade ESV',
      icon: '✦',
      iconName: 'gem',
      description: 'You pressed and pulled the equivalent of a luxury armored SUV.',
    }
  } else if (lbs < 18000) {
    return {
      title: '2 African Bull Rhinos',
      icon: '✦',
      iconName: 'flame',
      description: 'Pure kinetic power: the combined mass of two adult rhinos.',
    }
  } else if (lbs < 35000) {
    return {
      title: 'Armored Tactical Vehicle',
      icon: '✦',
      iconName: 'shield',
      description: 'Uncompromising output: equivalent to an armored SWAT vehicle.',
    }
  } else if (lbs < 60000) {
    return {
      title: 'Boeing 737 Jet Engine',
      icon: '✦',
      iconName: 'rocket',
      description: 'Aeronautical-grade tonnage: moving an entire commercial jet turbine.',
    }
  } else {
    return {
      title: 'Blue Whale Calf',
      icon: '✦',
      iconName: 'trophy',
      description: 'Titan-tier volume: total work capacity rivaling marine giants.',
    }
  }
}

export default function PostWorkoutTrophyCard({
  data,
  onClose,
}: {
  data: PostWorkoutTrophyData
  onClose?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [downloading, setDownloading] = useState(false)

  const equivalence = getTonnageEquivalence(data.totalVolumeLbs)

  const handleExportPng = async () => {
    setDownloading(true)
    try {
      const canvas = canvasRef.current || document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1350 // 4:5 Instagram / Story Luxury Aspect Ratio
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 1. Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350)
      bgGrad.addColorStop(0, '#060A10')
      bgGrad.addColorStop(0.5, '#0E1724')
      bgGrad.addColorStop(1, '#04070B')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1080, 1350)

      // 2. Gold Border Framing
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.4)'
      ctx.lineWidth = 4
      ctx.strokeRect(36, 36, 1080 - 72, 1350 - 72)

      ctx.strokeStyle = 'rgba(212, 160, 23, 0.8)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(48, 48, 1080 - 96, 1350 - 96)

      // Corner Accents
      const cornerSize = 28
      ctx.fillStyle = '#D4A017'
      ctx.fillRect(44, 44, cornerSize, 4)
      ctx.fillRect(44, 44, 4, cornerSize)
      ctx.fillRect(1080 - 44 - cornerSize, 44, cornerSize, 4)
      ctx.fillRect(1080 - 48, 44, 4, cornerSize)
      ctx.fillRect(44, 1350 - 48, cornerSize, 4)
      ctx.fillRect(44, 1350 - 44 - cornerSize, 4, cornerSize)
      ctx.fillRect(1080 - 44 - cornerSize, 1350 - 48, cornerSize, 4)
      ctx.fillRect(1080 - 48, 1350 - 44 - cornerSize, 4, cornerSize)

      // 3. Brand Header
      ctx.fillStyle = '#C5A059'
      ctx.font = '700 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.letterSpacing = '6px'
      ctx.fillText('GORDON ATHLETIC ADVISORY', 540, 130)

      ctx.fillStyle = '#94A3B8'
      ctx.font = '400 16px sans-serif'
      ctx.fillText('HUMAN PERFORMANCE & CLINICAL TELEMETRY', 540, 165)

      // Horizontal Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.beginPath()
      ctx.moveTo(140, 195)
      ctx.lineTo(940, 195)
      ctx.stroke()

      // 4. Session Title
      ctx.fillStyle = '#34D399'
      ctx.font = '800 20px sans-serif'
      ctx.fillText(`● DAY ${data.dayNumber} SESSION CONCLUDED`, 540, 245)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 52px sans-serif'
      ctx.fillText((data.focus || 'Performance Training').toUpperCase(), 540, 310)

      // 5. Hero Tonnage Number
      ctx.fillStyle = 'rgba(212, 160, 23, 0.12)'
      ctx.fillRect(120, 365, 840, 300)
      ctx.strokeStyle = 'rgba(212, 160, 23, 0.5)'
      ctx.strokeRect(120, 365, 840, 300)

      ctx.fillStyle = '#E5D0A1'
      ctx.font = '900 108px sans-serif'
      ctx.fillText(`${data.totalVolumeLbs.toLocaleString()} LBS`, 540, 495)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '700 22px sans-serif'
      ctx.fillText('TOTAL KINETIC VOLUME MOVED', 540, 550)

      ctx.fillStyle = '#34D399'
      ctx.font = '600 20px sans-serif'
      ctx.fillText(`EQUIVALENT: ${equivalence.title.toUpperCase()}`, 540, 605)

      // 6. Metrics 4-Column Grid
      const colY = 720
      const boxW = 195
      const boxH = 140
      const gap = 20
      const startX = 120

      const stats = [
        { label: 'DURATION', val: `${data.durationMinutes}m`, sub: 'Active Clock' },
        { label: 'WORKING SETS', val: `${data.totalSets}`, sub: `${data.totalReps} Total Reps` },
        { label: 'CARDIO', val: data.cardioMinutes ? `${data.cardioMinutes}m` : '15m', sub: data.cardioModality || 'Incline Walk' },
        { label: 'RPE EXERTION', val: `${data.avgRpe || 8.0}`, sub: 'Optimal Drive' },
      ]

      stats.forEach((st, i) => {
        const x = startX + i * (boxW + gap)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
        ctx.fillRect(x, colY, boxW, boxH)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.strokeRect(x, colY, boxW, boxH)

        ctx.fillStyle = '#94A3B8'
        ctx.font = '800 13px sans-serif'
        ctx.fillText(st.label, x + boxW / 2, colY + 36)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '900 36px sans-serif'
        ctx.fillText(st.val, x + boxW / 2, colY + 82)

        ctx.fillStyle = '#C5A059'
        ctx.font = '600 13px sans-serif'
        ctx.fillText(st.sub, x + boxW / 2, colY + 115)
      })

      // 7. Equivalence Callout Box
      ctx.fillStyle = 'rgba(14, 23, 36, 0.9)'
      ctx.fillRect(120, 900, 840, 160)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)'
      ctx.strokeRect(120, 900, 840, 160)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '600 24px sans-serif'
      ctx.fillText(`"${equivalence.description}"`, 540, 970)

      ctx.fillStyle = '#94A3B8'
      ctx.font = '400 16px sans-serif'
      ctx.fillText(`Verified by GAA Telemetry Engine · ${new Date().toLocaleDateString()}`, 540, 1015)

      // 8. Footer Credential
      ctx.fillStyle = '#C5A059'
      ctx.font = '800 18px sans-serif'
      ctx.fillText('SCOTT GORDON · NASM MASTER PERFORMANCE DIRECTOR', 540, 1220)

      ctx.fillStyle = '#64748B'
      ctx.font = '400 14px sans-serif'
      ctx.fillText('SCOTTGORDONFITNESS.COM · APPLE HEALTHKIT VERIFIED', 540, 1255)

      // Download
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `GAA-Day${data.dayNumber}-Trophy-Card.png`
      link.href = dataUrl
      link.click()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(8,14,20,0.98) 0%, rgba(14,23,36,0.98) 100%)',
        border: '2px solid rgba(212,160,23,0.6)',
        borderRadius: 14,
        padding: '24px 22px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(212,160,23,0.2)',
        maxWidth: 520,
        width: '100%',
        margin: '0 auto',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, zIndex: 0 }}>
        <GaaMasterWatermarkSeal size={160} opacity={0.07} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <GaaIcon name="trophy" size={12} tone="gold" />
            <span>Session Recap &amp; Trophy Card</span>
          </span>
          <h3 style={{ margin: '2px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 20, fontWeight: 700, letterSpacing: '0.04em', color: '#FFFFFF' }}>
            Day {data.dayNumber}: {data.focus}
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--gray)', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Hero Tonnage Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.18) 0%, rgba(16,185,129,0.1) 100%)',
          border: '1px solid rgba(212,160,23,0.45)',
          borderRadius: 10,
          padding: '18px 16px',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-lt)', fontWeight: 800 }}>
          Total Kinetic Tonnage Moved
        </div>
        <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 44, fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1, margin: '6px 0 4px', letterSpacing: '0.02em' }}>
          {data.totalVolumeLbs.toLocaleString()} <span style={{ fontSize: 22, fontFamily: 'var(--font-sans, Raleway), sans-serif', fontWeight: 600 }}>LBS</span>
        </div>
        <div style={{ fontSize: 13, color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <GaaIcon name={equivalence.iconName} size={14} tone="emerald" />
          <span>Equivalent: {equivalence.title}</span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--gray)', fontStyle: 'italic' }}>
          &quot;{equivalence.description}&quot;
        </p>
      </div>

      {/* 4 Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>Duration</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0' }}>
            {data.durationMinutes} MINS
          </div>
          <div style={{ fontSize: 10, color: 'var(--gold)' }}>Active Gym Clock</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>Working Sets</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: '2px 0 0' }}>
            {data.totalSets} SETS
          </div>
          <div style={{ fontSize: 10, color: 'var(--gold)' }}>{data.totalReps} Total Reps</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>Cardio Protocol</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 20, fontWeight: 700, color: '#38BDF8', margin: '2px 0 0' }}>
            {data.cardioMinutes || 15} MINS
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.cardioModality || 'Incline Walking'}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 800 }}>Exertion RPE</div>
          <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 22, fontWeight: 700, color: '#34D399', margin: '2px 0 0' }}>
            {data.avgRpe || 8.0} / 10
          </div>
          <div style={{ fontSize: 10, color: 'var(--gray)' }}>Optimal Overload</div>
        </div>
      </div>

      {/* Hidden Render Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Action Export Button */}
      <button
        type="button"
        onClick={handleExportPng}
        disabled={downloading}
        className="tactile-btn"
        style={{
          width: '100%',
          padding: '12px 18px',
          background: 'linear-gradient(135deg, #D4A017 0%, #AA820A 100%)',
          border: '1px solid var(--gold)',
          borderRadius: 8,
          color: '#080E14',
          fontFamily: 'var(--font-sans, Raleway), sans-serif',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: downloading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 18px rgba(212,160,23,0.4)',
        }}
      >
        <GaaIcon name="camera" size={18} tone="dark" />
        <span>{downloading ? 'GENERATING HIGH-RES PNG...' : 'SAVE TROPHY CARD / INSTAGRAM STORY'}</span>
      </button>
    </div>
  )
}

