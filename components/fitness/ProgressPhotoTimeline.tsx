'use client'

import { useState } from 'react'
import Image from 'next/image'
import GaaIcon from '@/components/ui/GaaIcon'
import AiBodyCompositionScannerModal from './AiBodyCompositionScannerModal'
import { BodyCompositionScanResult } from '@/lib/ai-body-composition-engine'

interface ProgressPhoto {
  id: string
  photo_url: string
  taken_at: string
  notes?: string | null
  created_at?: string | null
}

interface ProgressPhotoTimelineProps {
  initialPhotos: ProgressPhoto[]
  canUpload?: boolean
  title?: string
  subtitle?: string
  bodyFatInputs?: {
    sex?: 'male' | 'female' | 'other'
    heightCm?: number
    weightKg?: number
    waistCm?: number
    neckCm?: number
    hipCm?: number
    age?: number
  }
  onEstimatedBodyfat?: (value: number) => void
  estimatedBodyfat?: string | null
  clientId?: string
  clientName?: string
  isCoachView?: boolean
}

export default function ProgressPhotoTimeline({
  initialPhotos,
  canUpload = false,
  title = 'Progress Photos & Body Composition',
  subtitle = 'Track visual physique evolution and calculate ultra-accurate DEXA-calibrated body composition metrics over time.',
  bodyFatInputs,
  onEstimatedBodyfat,
  estimatedBodyfat,
  clientId,
  clientName,
  isCoachView = false,
}: ProgressPhotoTimelineProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [estimating, setEstimating] = useState(false)
  const [bodyFatStatus, setBodyFatStatus] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [latestScanResult, setLatestScanResult] = useState<BodyCompositionScanResult | null>(null)
  const [form, setForm] = useState({ takenAt: new Date().toISOString().slice(0, 10), notes: '', file: null as File | null })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.file) {
      setStatus('Select a photo first.')
      return
    }

    setUploading(true)
    setStatus(null)

    const body = new FormData()
    body.append('photo', form.file)
    body.append('taken_at', form.takenAt)
    body.append('notes', form.notes)

    const res = await fetch('/api/fitness/progress-photos', {
      method: 'POST',
      body,
    })

    const payload = await res.json()
    setUploading(false)

    if (!res.ok) {
      setStatus(payload.error ?? 'Could not upload progress photo')
      return
    }

    setPhotos(prev => [payload.photo as ProgressPhoto, ...prev])
    setForm({ takenAt: new Date().toISOString().slice(0, 10), notes: '', file: null })
    setStatus('Progress photo saved.')
  }

  async function handleEstimateBodyFat() {
    if (!bodyFatInputs) return

    setEstimating(true)
    setBodyFatStatus(null)

    let photoDataUrl: string | undefined
    if (form.file) {
      photoDataUrl = await fileToDataUrl(form.file)
    }

    const res = await fetch('/api/fitness/bodyfat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sex: bodyFatInputs.sex,
        heightCm: bodyFatInputs.heightCm,
        weightKg: bodyFatInputs.weightKg,
        waistCm: bodyFatInputs.waistCm,
        neckCm: bodyFatInputs.neckCm,
        hipCm: bodyFatInputs.hipCm,
        age: bodyFatInputs.age,
        photoDataUrl,
      }),
    })

    const payload = await res.json()
    setEstimating(false)

    if (!res.ok) {
      setBodyFatStatus(payload.error ?? 'Could not estimate body fat')
      return
    }

    const estimated = Number(payload.analysis?.estimated_bodyfat_percent)
    const scanRes = payload.scanResult as BodyCompositionScanResult | undefined

    if (scanRes) {
      setLatestScanResult(scanRes)
    }

    if (Number.isFinite(estimated)) {
      onEstimatedBodyfat?.(estimated)
      setBodyFatStatus(`DEXA-Calibrated Estimate: ${estimated}% body fat (${scanRes?.classification || 'Calculated'})`)
      return
    }

    setBodyFatStatus('Body-fat estimate returned, but value was invalid.')
  }

  return (
    <section style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', letterSpacing: '0.04em', fontSize: 22, fontWeight: 700 }}>{title}</h2>
          <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13 }}>{subtitle}</p>
        </div>

        {/* AI DEXA Scanner Launcher Button */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #D4A017 0%, #F59E0B 100%)',
            color: '#000000',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 15px rgba(212,160,23,0.35)',
          }}
        >
          <GaaIcon name="dna" size={16} />
          <span>Launch AI DEXA Scanner</span>
          <span
            style={{
              background: '#000000',
              color: '#D4A017',
              fontSize: 9,
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: 10,
              marginLeft: 4,
            }}
          >
            4C PRO
          </span>
        </button>
      </div>

      {canUpload && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 14, background: 'rgba(13,27,42,0.55)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Photo</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={event => setForm(prev => ({ ...prev, file: event.target.files?.[0] ?? null }))}
                style={{ color: 'var(--white)', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Date Taken</label>
              <input
                type="date"
                value={form.takenAt}
                onChange={event => setForm(prev => ({ ...prev, takenAt: event.target.value }))}
                style={inputStyle}
                required
              />
            </div>
          </div>

          <textarea
            value={form.notes}
            onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))}
            rows={2}
            placeholder="Optional notes: lighting, scale weight, pumped vs cold, mood, etc."
            style={{ ...inputStyle, minHeight: 60 }}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" disabled={uploading} style={{ ...buttonStyle, flex: 1 }}>
              {uploading ? 'Uploading...' : 'Save Progress Photo'}
            </button>
            {bodyFatInputs && (
              <button
                type="button"
                onClick={() => void handleEstimateBodyFat()}
                disabled={estimating}
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(56,189,248,0.08) 100%)',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  flex: 1,
                }}
              >
                {estimating ? 'Analyzing Vision Models...' : 'Quick Photo DEXA Estimate'}
              </button>
            )}
          </div>

          {bodyFatInputs && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <p style={{ margin: 0, color: 'var(--gray)', fontSize: 12 }}>
                  Current Est: <strong style={{ color: estimatedBodyfat ? '#D4A017' : 'var(--gray)' }}>{estimatedBodyfat ? `${estimatedBodyfat}% body fat` : 'No estimate recorded'}</strong>
                </p>
                {latestScanResult && (
                  <span style={{ fontSize: 11, color: '#38BDF8' }}>
                    LBM: {latestScanResult.leanBodyMassLbs} lbs · FFMI: {latestScanResult.ffmi} ({latestScanResult.ffmiCategory})
                  </span>
                )}
              </div>
              {bodyFatStatus && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: bodyFatStatus.toLowerCase().includes('could not') || bodyFatStatus.toLowerCase().includes('invalid') ? 'var(--error)' : 'var(--success)' }}>
                  {bodyFatStatus}
                </p>
              )}
            </div>
          )}
        </form>
      )}

      {status && <p style={{ margin: '0 0 12px', color: status.toLowerCase().includes('could') || status.toLowerCase().includes('select') ? 'var(--error)' : 'var(--success)' }}>{status}</p>}

      {photos.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--gray)' }}>No progress photos saved yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {photos.map(photo => (
            <article key={photo.id} style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy)', padding: 10, borderRadius: 6 }}>
              <Image
                src={photo.photo_url}
                alt={`Progress photo from ${photo.taken_at}`}
                width={360}
                height={480}
                unoptimized
                style={{ width: '100%', height: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, display: 'block' }}
              />
              <p style={{ margin: '10px 0 4px', color: 'var(--gold)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {new Date(`${photo.taken_at}T12:00:00Z`).toLocaleDateString()}
              </p>
              <p style={{ margin: 0, color: 'var(--gray)', fontSize: 13, lineHeight: 1.5 }}>
                {photo.notes?.trim() ? photo.notes : 'No notes added.'}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* AI Body Composition Scanner Modal */}
      <AiBodyCompositionScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        clientId={clientId}
        clientName={clientName}
        initialSex={bodyFatInputs?.sex}
        initialHeightCm={bodyFatInputs?.heightCm}
        initialWeightKg={bodyFatInputs?.weightKg}
        initialAge={bodyFatInputs?.age}
        initialWaistCm={bodyFatInputs?.waistCm}
        initialNeckCm={bodyFatInputs?.neckCm}
        initialHipCm={bodyFatInputs?.hipCm}
        isCoachView={isCoachView}
        onApplyScan={scan => {
          setLatestScanResult(scan)
          onEstimatedBodyfat?.(scan.estimatedBodyFatPercent)
          setBodyFatStatus(`DEXA-Calibrated Estimate: ${scan.estimatedBodyFatPercent}% body fat (±${scan.confidenceIntervalPercent}%)`)
        }}
      />
    </section>
  )
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve('')
    reader.onload = () => {
      const img = document.createElement('img')
      img.onerror = () => resolve(String(reader.result))
      img.onload = () => {
        try {
          const maxDim = 1280
          let width = img.width
          let height = img.height
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(String(reader.result))
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        } catch {
          resolve(String(reader.result))
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--navy)',
  border: '1px solid var(--navy-lt)',
  color: 'var(--white)',
  fontFamily: 'Raleway, sans-serif',
  fontSize: 14,
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  background: 'var(--gold)',
  color: '#0D1B2A',
  border: 'none',
  fontFamily: 'var(--font-sans, Raleway), sans-serif',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}