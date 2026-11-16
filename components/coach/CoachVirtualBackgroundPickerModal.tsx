'use client'

import { useState, useMemo, useRef, useId } from 'react'
import {
  COACH_BACKGROUND_PRESETS,
  type CoachBackgroundPreset,
  type CoachBackgroundCategory,
} from '@/lib/coach-backgrounds-catalog'
import { GaaIcon } from '@/components/ui/GaaIcon'
import { useNativeStudioDialog } from './useNativeStudioDialog'

interface CoachVirtualBackgroundPickerModalProps {
  isOpen: boolean
  activeBackground: CoachBackgroundPreset | null
  onSelectBackground: (preset: CoachBackgroundPreset | null) => void
  onClose: () => void
}

type FilterCategory = 'ALL' | CoachBackgroundCategory

export default function CoachVirtualBackgroundPickerModal({
  isOpen,
  activeBackground,
  onSelectBackground,
  onClose,
}: CoachVirtualBackgroundPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const searchInputId = useId()

  useNativeStudioDialog(dialogRef, isOpen, onClose)

  const categories: { label: string; value: FilterCategory; count: number }[] = useMemo(() => {
    return [
      { label: 'All Modalities', value: 'ALL', count: COACH_BACKGROUND_PRESETS.length },
      {
        label: 'Assessment & Triage',
        value: 'Assessment & Triage',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Assessment & Triage').length,
      },
      {
        label: 'Stabilization & Balance',
        value: 'Stabilization & Balance',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Stabilization & Balance').length,
      },
      {
        label: 'Hypertrophy & Physique',
        value: 'Hypertrophy & Physique',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Hypertrophy & Physique').length,
      },
      {
        label: 'Maximal Strength',
        value: 'Maximal Strength',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Maximal Strength').length,
      },
      {
        label: 'Athletic Power & SAQ',
        value: 'Athletic Power & SAQ',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Athletic Power & SAQ').length,
      },
      {
        label: 'Metabolic Conditioning',
        value: 'Metabolic Conditioning',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Metabolic Conditioning').length,
      },
      {
        label: 'Recovery & Longevity',
        value: 'Recovery & Longevity',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Recovery & Longevity').length,
      },
      {
        label: 'Executive Suite',
        value: 'Executive Suite',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Executive Suite').length,
      },
      {
        label: 'Blur',
        value: 'Blur',
        count: COACH_BACKGROUND_PRESETS.filter((p) => p.category === 'Blur').length,
      },
    ]
  }, [])

  const filteredPresets = useMemo(() => {
    return COACH_BACKGROUND_PRESETS.filter((preset) => {
      const matchesCategory = selectedCategory === 'ALL' || preset.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesSearch =
        preset.name.toLowerCase().includes(query) ||
        preset.tagline.toLowerCase().includes(query) ||
        preset.trainingModality.toLowerCase().includes(query) ||
        preset.recommendedFor.toLowerCase().includes(query) ||
        preset.badge.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="forge-live-studio-dialog"
      aria-label="Studio Virtual Backgrounds Picker"
      {...({ closedby: 'any' } as Record<string, unknown>)}
      style={{
        maxWidth: 'min(1040px, calc(100vw - 16px))',
      }}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0F172A 0%, #0A0F1D 100%)',
          border: '1px solid rgba(212, 160, 23, 0.35)',
          borderRadius: 12,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 160, 23, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'clamp(14px, 2vw, 18px) clamp(14px, 2.5vw, 24px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ minInlineSize: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  fontWeight: 800,
                  background: 'rgba(212, 160, 23, 0.12)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(212, 160, 23, 0.3)',
                }}
              >
                Coach Studio Environment
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.55)' }}>
                {COACH_BACKGROUND_PRESETS.length} Calibrated Modality Sets
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 'clamp(17px, 2.2vw, 20px)',
                color: '#FFF',
                fontWeight: 700,
                letterSpacing: '0.04em',
                margin: '6px 0 0 0',
                textWrap: 'balance',
              }}
            >
              Select Virtual Training Background
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
              Choose a hyperrealistic facility background tailored to the client’s active training block.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {activeBackground && (
              <button
                type="button"
                onClick={() => {
                  onSelectBackground(null)
                  onClose()
                }}
                style={{
                  minHeight: 44,
                  padding: '7px 14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#FCA5A5',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Turn Off Background</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close background picker"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '50%',
                minWidth: 44,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Strip & Search */}
        <div
          style={{
            padding: '12px clamp(14px, 2.5vw, 24px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.2)',
            flexWrap: 'wrap',
          }}
        >
          {/* Category Tabs */}
          <div
            role="group"
            aria-label="Filter backgrounds by training modality"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 4,
              maxWidth: '100%',
              flex: '1 1 280px',
              minInlineSize: 0,
            }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    minHeight: 38,
                    padding: '6px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                    background: isSelected ? 'var(--gold)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#0D1B2A' : 'rgba(255, 255, 255, 0.78)',
                    border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {cat.label} ({cat.count})
                </button>
              )
            })}
          </div>

          {/* Quick Search wrapped in semantic <search> */}
          <search style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
            <label htmlFor={searchInputId} className="sr-only">
              Search virtual training backgrounds
            </label>
            <input
              id={searchInputId}
              name="background_search"
              type="search"
              placeholder="Search modality..."
              value={searchQuery}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                minHeight: 44,
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: 6,
                padding: '8px 12px 8px 30px',
                color: '#FFF',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.55,
                pointerEvents: 'none',
                display: 'inline-flex',
              }}
            >
              <GaaIcon name="search" size={13} tone="inherit" />
            </span>
          </search>
        </div>

        {/* Background Cards Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(14px, 2.5vw, 24px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: 16,
          }}
        >
          {filteredPresets.map((preset) => {
            const isActive = activeBackground?.id === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onSelectBackground(preset)
                  onClose()
                }}
                style={{
                  padding: 0,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  borderRadius: 10,
                  border: isActive ? '2px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isActive ? 'rgba(212, 160, 23, 0.06)' : 'rgba(15, 23, 42, 0.6)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                  boxShadow: isActive ? '0 0 20px rgba(212, 160, 23, 0.25)' : 'none',
                }}
              >
                {/* 16:9 Thumbnail Stage */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: '#0A0F1D',
                  }}
                >
                  {preset.isBlur ? (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 13,
                        fontWeight: 600,
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <GaaIcon name="camera" size={28} tone="gold" />
                      <span>85mm f/1.4 Portrait Bokeh Blur</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${preset.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  )}

                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'rgba(10, 15, 29, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(212, 160, 23, 0.4)',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'var(--gold-lt)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {preset.badge}
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'var(--gold)',
                        color: '#0D1B2A',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      <span>✓ ACTIVE</span>
                    </div>
                  )}
                </div>

                {/* Details Card */}
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#FFF',
                        lineHeight: 1.3,
                      }}
                    >
                      {preset.name}
                    </h3>
                  </div>

                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: 11.5,
                      color: 'rgba(255, 255, 255, 0.65)',
                      lineHeight: 1.45,
                    }}
                  >
                    {preset.tagline}
                  </p>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 10,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontSize: 10.5,
                    }}
                  >
                    <span style={{ color: 'var(--gold-lt)', fontWeight: 600 }}>
                      Target: {preset.recommendedFor.slice(0, 36)}...
                    </span>
                    <span
                      style={{
                        color: isActive ? 'var(--gold)' : 'rgba(255, 255, 255, 0.6)',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {isActive ? 'Selected' : 'Apply →'}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </dialog>
  )
}
