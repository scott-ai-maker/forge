'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import ForgeIcon from '@/components/ui/ForgeIcon'
import { isSfxMuted, playForgeTactileTone, useSfxMuted } from '@/lib/sfx-audio'
import {
  STUDIO_BACKGROUND_MODES,
  STUDIO_BACKGROUND_MODE_LIST,
  STUDIO_FRAMING_GUIDES,
  STUDIO_FRAMING_GUIDE_LIST,
  STUDIO_LIGHTING_PRESETS,
  STUDIO_LIGHTING_PRESET_LIST,
  type StudioBackgroundMode,
  type StudioFramingGuideMode,
  type StudioLightingPresetId,
} from '@/lib/studio-video-presets'
import type { StudioVideoPipelineController } from '@/hooks/useStudioVideoPipeline'

function triggerStudioTick() {
  if (!isSfxMuted()) {
    playForgeTactileTone('tick')
  }
}

/**
 * Determines whether the Pre-Call Green Room Preview should auto-open on initial entry.
 * - Opens automatically once per session for interactive human participants.
 * - Bypasses automatically in automated headless/WebDriver E2E suites unless `?greenRoom=1`
 *   is explicitly present in the URL, keeping existing HUD E2E selectors immediately reachable.
 */
export function shouldAutoOpenStudioGreenRoom(sessionStorageKey: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('greenRoom') === '1') return true
    if (params.get('skipGreenRoom') === '1') return false
    if (window.location.pathname.startsWith('/test-harness/')) return false
    if (typeof navigator !== 'undefined' && navigator.webdriver) return false
    if (window.sessionStorage.getItem(sessionStorageKey) === 'joined') return false
    return true
  } catch {
    return false
  }
}

export function markStudioGreenRoomJoined(sessionStorageKey: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(sessionStorageKey, 'joined')
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

/**
 * Installs `focusgroup="toolbar wrap"` and a WAI-ARIA roving-tabindex keyboard fallback
 * when native `focusGroup` is unsupported (`!('focusGroup' in HTMLElement.prototype)`).
 */
function useToolbarKeyboardNavigation(toolbarRef: React.RefObject<HTMLDivElement | null>, isActive: boolean) {
  useEffect(() => {
    const bar = toolbarRef.current
    if (!bar || !isActive || typeof HTMLElement === 'undefined') return

    bar.setAttribute('focusgroup', 'toolbar wrap')

    if ('focusGroup' in HTMLElement.prototype) {
      return
    }

    const getItems = () =>
      Array.from(bar.querySelectorAll<HTMLButtonElement>('button[type="button"]'))

    const syncInitialTabStops = () => {
      const items = getItems()
      const currentActive = items.findIndex(b => b.tabIndex === 0)
      const activeIdx = currentActive >= 0 ? currentActive : 0
      items.forEach((b, idx) => {
        b.tabIndex = idx === activeIdx ? 0 : -1
      })
    }

    syncInitialTabStops()

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLButtonElement | null
      const items = getItems()
      if (target && items.includes(target)) {
        items.forEach(b => {
          b.tabIndex = b === target ? 0 : -1
        })
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getItems()
      if (items.length === 0) return
      const activeEl = document.activeElement as HTMLButtonElement | null
      const currentIdx = activeEl ? items.indexOf(activeEl) : 0
      const vertical = bar.getAttribute('aria-orientation') === 'vertical'
      const rtl = getComputedStyle(bar).direction === 'rtl'
      const steps: Record<string, number> = vertical
        ? { ArrowDown: 1, ArrowUp: -1 }
        : { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }

      let nextIdx: number | null = null
      if (e.key in steps) {
        const delta = steps[e.key]
        nextIdx = (Math.max(0, currentIdx) + delta + items.length) % items.length
      } else if (e.key === 'Home') {
        nextIdx = 0
      } else if (e.key === 'End') {
        nextIdx = items.length - 1
      }

      if (nextIdx !== null && items[nextIdx]) {
        e.preventDefault()
        items.forEach((b, idx) => {
          b.tabIndex = idx === nextIdx ? 0 : -1
        })
        items[nextIdx].focus()
      }
    }

    bar.addEventListener('focusin', handleFocusIn)
    bar.addEventListener('keydown', handleKeyDown)
    return () => {
      bar.removeEventListener('focusin', handleFocusIn)
      bar.removeEventListener('keydown', handleKeyDown)
    }
  }, [toolbarRef, isActive])
}

export interface StudioFramingGuideOverlayProps {
  mode: StudioFramingGuideMode
}

/**
 * Non-blocking SVG camera framing guide (`Head-to-Toe` 6–8 ft kinetic zone vs. `Upper-Body Desk Check`)
 * so clients and Coach Gordon align their camera in under 5 seconds.
 */
export function StudioFramingGuideOverlay({ mode }: StudioFramingGuideOverlayProps) {
  if (mode === 'off') return null

  const spec = STUDIO_FRAMING_GUIDES[mode]

  return (
    <div
      data-testid={`studio-framing-guide-${mode}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {mode === 'head_to_toe' ? (
          <>
            {/* Full-Body 6–8 ft Alignment Zone */}
            <rect
              x="22"
              y="7"
              width="56"
              height="86"
              rx="2.5"
              fill="none"
              stroke="rgba(212, 175, 55, 0.65)"
              strokeWidth="0.45"
              strokeDasharray="2,1.4"
            />
            {/* Overhead Press Clearance Line */}
            <line
              x1="25"
              y1="11"
              x2="75"
              y2="11"
              stroke="rgba(52, 211, 153, 0.75)"
              strokeWidth="0.35"
              strokeDasharray="1.2,1"
            />
            {/* Shoulder & Hip Kinetic Reference Ticks */}
            <line x1="34" y1="28" x2="66" y2="28" stroke="rgba(212, 175, 55, 0.45)" strokeWidth="0.3" />
            <line x1="36" y1="53" x2="64" y2="53" stroke="rgba(212, 175, 55, 0.45)" strokeWidth="0.3" />
            {/* Center Plumb Sightline */}
            <line
              x1="50"
              y1="9"
              x2="50"
              y2="91"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="0.28"
              strokeDasharray="1.5,1.5"
            />
            {/* Ankle & Floor Traction Baseline */}
            <line
              x1="25"
              y1="89"
              x2="75"
              y2="89"
              stroke="rgba(52, 211, 153, 0.8)"
              strokeWidth="0.4"
            />
          </>
        ) : (
          <>
            {/* Upper-Body Desk Check Framing Zone */}
            <rect
              x="24"
              y="12"
              width="52"
              height="74"
              rx="3"
              fill="none"
              stroke="rgba(96, 165, 250, 0.68)"
              strokeWidth="0.45"
              strokeDasharray="2,1.4"
            />
            {/* Eye-Level Rule-of-Thirds Sightline */}
            <line
              x1="27"
              y1="34"
              x2="73"
              y2="34"
              stroke="rgba(212, 175, 55, 0.72)"
              strokeWidth="0.35"
              strokeDasharray="1.4,1"
            />
            {/* Head Crown Oval */}
            <ellipse
              cx="50"
              cy="36"
              rx="9"
              ry="14"
              fill="none"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="0.35"
            />
            {/* Shoulder Frame Arc */}
            <path
              d="M 31 82 Q 34 60 50 60 Q 66 60 69 82"
              fill="none"
              stroke="rgba(52, 211, 153, 0.65)"
              strokeWidth="0.4"
              strokeDasharray="1.6,1.2"
            />
          </>
        )}
      </svg>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 28,
          background: 'rgba(8, 12, 20, 0.84)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(212, 175, 55, 0.48)',
          borderRadius: 999,
          padding: '4px 12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#F8FAFC',
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
        }}
      >
        <ForgeIcon name="crosshair" size={12} tone="gold" />
        <span>{spec.label}</span>
        <span style={{ color: '#D4AF37' }}>· {spec.distanceHint}</span>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: 8,
          background: 'rgba(8, 12, 20, 0.82)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 6,
          padding: '4px 10px',
          color: '#E2E8F0',
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'center',
          maxWidth: 'min(420px, 90%)',
        }}
      >
        {spec.instruction}
      </div>
    </div>
  )
}

export interface StudioVideoControlsProps {
  pipeline: StudioVideoPipelineController
  onOpenGreenRoom?: () => void
  onToast?: (message: string, tone?: 'gold' | 'emerald' | 'amber') => void
  /** Compact pill placement inside HUD command bar or floating header */
  placement?: 'dock' | 'header'
  /** Hides secondary active-preset badge on ultra-compact mobile docks */
  compact?: boolean
}

/**
 * In-Call Collapsible "Studio FX" Pill & Accessible WAI-ARIA Video Processing Toolbar.
 * Allows Coach Gordon or the client to toggle Background Mode, Forge Studio LUT Preset,
 * Low-Light Studio Boost, Framing Guide, or Mirror Flip mid-session without obstructing video.
 */
export default function StudioVideoControls({
  pipeline,
  onOpenGreenRoom,
  onToast,
  placement = 'dock',
  compact = false,
}: StudioVideoControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const panelId = useId()

  useToolbarKeyboardNavigation(toolbarRef, isOpen)

  // Light-dismiss on Escape or click outside
  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const announce = useCallback(
    (msg: string, toastTone?: 'gold' | 'emerald' | 'amber') => {
      setStatusMessage(msg)
      triggerStudioTick()
      if (toastTone && onToast) {
        onToast(msg, toastTone)
      }
    },
    [onToast]
  )

  const handleSelectBackground = (mode: StudioBackgroundMode) => {
    pipeline.setBackgroundMode(mode)
    const spec = STUDIO_BACKGROUND_MODES[mode]
    announce(`Studio Background: ${spec.label}`, 'gold')
  }

  const handleSelectLighting = (preset: StudioLightingPresetId) => {
    pipeline.setLightingPreset(preset)
    const spec = STUDIO_LIGHTING_PRESETS[preset]
    announce(`Studio Lighting: ${spec.label}`, 'gold')
  }

  const handleToggleLowLight = () => {
    const next = !pipeline.lowLightBoostEnabled
    pipeline.setLowLightBoostEnabled(next)
    announce(
      next ? 'Low-Light Studio Boost ON' : 'Low-Light Studio Boost OFF',
      next ? 'emerald' : 'amber'
    )
  }

  const handleToggleMirror = () => {
    const next = !pipeline.isMirrored
    pipeline.toggleMirror()
    announce(next ? 'Mirror Self-View ON' : 'True Optical Self-View (Unmirrored)', 'gold')
  }

  const handleSelectFraming = (guide: StudioFramingGuideMode) => {
    pipeline.setFramingGuide(guide)
    announce(`Framing Guide: ${STUDIO_FRAMING_GUIDES[guide].label}`)
  }

  const activeBgSpec = STUDIO_BACKGROUND_MODES[pipeline.backgroundMode]
  const activeLutSpec = STUDIO_LIGHTING_PRESETS[pipeline.lightingPreset]
  const showLowLightNudge = pipeline.isLowLightDetected && !pipeline.lowLightBoostEnabled

  return (
    <div
      ref={wrapperRef}
      className="forge-studio-fx-root"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <style>{`
        .forge-studio-fx-root {
          --studio-target-min: 28px;
        }
        @media (pointer: coarse) {
          .forge-studio-fx-root {
            --studio-target-min: 44px;
          }
        }
        .forge-studio-fx-btn {
          min-inline-size: var(--studio-target-min);
          min-block-size: var(--studio-target-min);
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #E2E8F0;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 9px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          text-align: left;
        }
        .forge-studio-fx-btn:focus-visible {
          outline: 2px solid #F59E0B;
          outline-offset: 2px;
        }
        .forge-studio-fx-btn[aria-pressed="true"] {
          background: rgba(212, 175, 55, 0.24);
          border-color: #D4AF37;
          color: #FDE68A;
          box-shadow: inset 0 0 0 1px rgba(212, 175, 55, 0.45);
        }
        @media (hover: hover) {
          .forge-studio-fx-btn:hover:not([aria-pressed="true"]) {
            background: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.26);
          }
        }
        @media (prefers-reduced-motion: no-preference) {
          .forge-studio-fx-btn {
            transition: background-color 0.14s ease, border-color 0.14s ease, color 0.14s ease;
          }
        }
        @media (forced-colors: active) {
          .forge-studio-fx-btn[aria-pressed="true"] {
            background: Highlight;
            color: ButtonText;
            outline: 2px solid Highlight;
          }
        }
      `}</style>

      {/* Screen-reader live region outside role="toolbar" per WAI-ARIA toolbar guidance */}
      <p
        role="status"
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {statusMessage}
      </p>

      {/* Collapsible In-Call "Studio FX" Pill */}
      <button
        type="button"
        data-testid="studio-fx-pill"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => {
          triggerStudioTick()
          setIsOpen(prev => !prev)
        }}
        title="Studio FX: Configure Background Segmentation, Forge Studio LUT Lighting & Mirror Flip"
        className="forge-studio-fx-btn"
        style={{
          borderRadius: 999,
          padding: '5px 12px',
          background: isOpen
            ? 'linear-gradient(135deg, rgba(212,175,55,0.32) 0%, rgba(161,120,24,0.24) 100%)'
            : 'rgba(15, 23, 42, 0.85)',
          border: isOpen
            ? '1px solid #D4AF37'
            : '1px solid rgba(212, 175, 55, 0.42)',
          color: '#F8FAFC',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          boxShadow: isOpen ? '0 0 14px rgba(212,175,55,0.3)' : 'none',
        }}
      >
        <ForgeIcon name="sparkles" size={12} tone="gold" />
        <span>Studio FX</span>
        {!compact && (
          <span
            style={{
              fontSize: 9.5,
              color: '#FDE68A',
              background: 'rgba(212, 175, 55, 0.16)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              borderRadius: 999,
              padding: '1px 6px',
              fontWeight: 800,
            }}
          >
            {activeBgSpec.shortLabel} · {activeLutSpec.shortLabel}
          </span>
        )}
      </button>

      {/* Smart Auto-Light 1-Tap Boost Chip when dark room (< 75 luminance) is detected */}
      {showLowLightNudge && (
        <button
          type="button"
          data-testid="low-light-auto-boost-chip"
          aria-pressed={pipeline.lowLightBoostEnabled}
          onClick={handleToggleLowLight}
          title={`Room luminance is low (${Math.round(pipeline.meanLuminance)}/255). Tap for Low-Light Studio Boost.`}
          className="forge-studio-fx-btn"
          style={{
            borderRadius: 999,
            padding: '4px 10px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            color: '#FCD34D',
            fontSize: 10.5,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          <ForgeIcon name="sun" size={11} tone="amber" />
          <span>Low-Light Studio Boost</span>
        </button>
      )}

      {/* Floating Collapsible Studio FX Panel */}
      {isOpen && (
        <div
          id={panelId}
          data-testid="studio-fx-panel"
          style={{
            position: 'absolute',
            ...(placement === 'dock'
              ? { bottom: 'calc(100% + 10px)', right: 0 }
              : { top: 'calc(100% + 8px)', right: 0 }),
            width: 'min(400px, calc(100vw - 24px))',
            background: 'rgba(8, 12, 22, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            borderRadius: 12,
            padding: 14,
            boxShadow: '0 16px 42px rgba(0, 0, 0, 0.82)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minInlineSize: 0 }}>
              <ForgeIcon name="sparkles" size={14} tone="gold" />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Forge Studio FX Engine
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                  {pipeline.captureResolutionLabel} · {pipeline.renderFps} fps · 48kHz Isolated Voice
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close Studio FX panel"
              title="Close Studio FX panel"
              onClick={() => setIsOpen(false)}
              className="forge-studio-fx-btn"
              style={{ padding: '4px 7px' }}
            >
              <ForgeIcon name="close" size={12} tone="slate" />
            </button>
          </div>

          {/* Composite WAI-ARIA Toolbar */}
          <div
            ref={toolbarRef}
            role="toolbar"
            aria-label="Forge Studio Video and Lighting Controls"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Group 1: Studio Background Segmentation Modes */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#D4AF37',
                  marginBottom: 6,
                }}
              >
                Studio Background Segmentation
              </div>
              <div
                role="group"
                aria-label="Studio Background Mode"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 6,
                }}
              >
                {STUDIO_BACKGROUND_MODE_LIST.map(bg => (
                  <button
                    key={bg.id}
                    type="button"
                    data-testid={`studio-bg-${bg.id}`}
                    aria-pressed={pipeline.backgroundMode === bg.id}
                    onClick={() => handleSelectBackground(bg.id)}
                    title={bg.description}
                    className="forge-studio-fx-btn"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    {bg.id === 'pure_chroma' ? (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 3,
                          background: '#121417',
                          border: '1px solid rgba(255,255,255,0.45)',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <ForgeIcon
                        name={bg.id === 'off' ? 'eye' : bg.id === 'bokeh_blur' ? 'camera' : 'shield-check'}
                        size={12}
                        tone={pipeline.backgroundMode === bg.id ? 'gold' : 'slate'}
                      />
                    )}
                    <span style={{ minInlineSize: 0, overflowWrap: 'anywhere' }}>{bg.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            <span
              role="separator"
              aria-orientation="horizontal"
              style={{
                display: 'block',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />

            {/* Group 2: Forge Studio LUT Lighting Presets */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#D4AF37',
                  marginBottom: 6,
                }}
              >
                Forge Studio Lighting LUT
              </div>
              <div
                role="group"
                aria-label="Forge Studio Lighting Preset"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 6,
                }}
              >
                {STUDIO_LIGHTING_PRESET_LIST.map(lut => (
                  <button
                    key={lut.id}
                    type="button"
                    data-testid={`studio-lut-${lut.id}`}
                    aria-pressed={pipeline.lightingPreset === lut.id}
                    onClick={() => handleSelectLighting(lut.id)}
                    title={lut.description}
                    className="forge-studio-fx-btn"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <ForgeIcon
                      name={lut.id === 'warm_tactile' ? 'sun' : lut.id === 'high_contrast_form' ? 'lightning' : 'sliders'}
                      size={12}
                      tone={pipeline.lightingPreset === lut.id ? 'gold' : 'slate'}
                    />
                    <span style={{ minInlineSize: 0, overflowWrap: 'anywhere' }}>{lut.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <span
              role="separator"
              aria-orientation="horizontal"
              style={{
                display: 'block',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />

            {/* Group 3: Low-Light Boost, Mirror Flip & Framing Guide */}
            <div
              role="group"
              aria-label="Camera Utilities and Framing"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              <button
                type="button"
                data-testid="studio-low-light-boost-btn"
                aria-pressed={pipeline.lowLightBoostEnabled}
                onClick={handleToggleLowLight}
                className="forge-studio-fx-btn"
                style={{ flex: '1 1 160px', justifyContent: 'flex-start' }}
              >
                <ForgeIcon
                  name="sun"
                  size={12}
                  tone={pipeline.lowLightBoostEnabled || pipeline.isLowLightDetected ? 'gold' : 'slate'}
                />
                <span>Low-Light Studio Boost</span>
                {pipeline.isLowLightDetected && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 999,
                      background: 'rgba(245, 158, 11, 0.25)',
                      color: '#FCD34D',
                      fontWeight: 800,
                    }}
                  >
                    AUTO
                  </span>
                )}
              </button>

              <button
                type="button"
                data-testid="studio-mirror-flip-btn"
                aria-pressed={pipeline.isMirrored}
                onClick={handleToggleMirror}
                className="forge-studio-fx-btn"
                style={{ flex: '1 1 110px', justifyContent: 'flex-start' }}
              >
                <ForgeIcon name="rotate-ccw" size={12} tone={pipeline.isMirrored ? 'gold' : 'slate'} />
                <span>Mirror Flip</span>
              </button>

              {STUDIO_FRAMING_GUIDE_LIST.map(fg => (
                <button
                  key={fg.id}
                  type="button"
                  data-testid={`studio-framing-${fg.id}`}
                  aria-pressed={pipeline.framingGuide === fg.id}
                  onClick={() => handleSelectFraming(fg.id)}
                  title={fg.instruction}
                  className="forge-studio-fx-btn"
                  style={{ flex: '1 1 auto' }}
                >
                  <ForgeIcon name="crosshair" size={11} tone={pipeline.framingGuide === fg.id ? 'gold' : 'slate'} />
                  <span>{fg.shortLabel}</span>
                </button>
              ))}

              {onOpenGreenRoom && (
                <button
                  type="button"
                  data-testid="studio-open-green-room-btn"
                  onClick={() => {
                    setIsOpen(false)
                    triggerStudioTick()
                    onOpenGreenRoom()
                  }}
                  className="forge-studio-fx-btn"
                  style={{
                    flex: '1 1 100%',
                    background: 'rgba(16, 185, 129, 0.14)',
                    borderColor: 'rgba(16, 185, 129, 0.42)',
                    color: '#6EE7B7',
                  }}
                >
                  <ForgeIcon name="video-studio" size={12} tone="emerald" />
                  <span>Open Green Room Mirror Check</span>
                </button>
              )}
            </div>
          </div>

          {/* Telemetry & Mic Level Meter Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 10,
              color: '#94A3B8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <ForgeIcon name={pipeline.isMicMuted ? 'mic-off' : 'mic'} size={11} tone={pipeline.isMicMuted ? 'ruby' : 'emerald'} />
              <span>Mic</span>
              <div
                aria-label={`Microphone level ${pipeline.micLevel}%`}
                style={{
                  flex: 1,
                  maxWidth: 96,
                  height: 6,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pipeline.isMicMuted ? 0 : pipeline.micLevel}%`,
                    height: '100%',
                    background:
                      pipeline.micLevel > 82
                        ? '#F59E0B'
                        : 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                    transition: 'width 0.09s linear',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Luma {Math.round(pipeline.meanLuminance)}</span>
              {pipeline.isGuardrailActive && (
                <span
                  data-testid="studio-guardrail-badge"
                  title="Automatic mobile performance guardrail stepped segmentation resolution down to keep 30fps live video smooth"
                  style={{
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.45)',
                    color: '#93C5FD',
                    fontWeight: 800,
                  }}
                >
                  Guardrail: {pipeline.guardrailTier.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export interface StudioGreenRoomPreviewProps {
  isOpen: boolean
  pipeline: StudioVideoPipelineController
  participantName: string
  counterpartName: string
  isCoach?: boolean
  onJoinStudio: () => void
}

/**
 * Pre-Call Green Room Mirror Preview:
 * Renders a live processed mirror preview before joining the Live Studio session with
 * "Test Studio Filter & Background" toggles, 48kHz voice-isolated mic level meter,
 * and "Framing Guide" overlay (`Head-to-Toe` vs. `Upper-Body Desk Check`).
 */
export function StudioGreenRoomPreview({
  isOpen,
  pipeline,
  participantName,
  counterpartName,
  isCoach = false,
  onJoinStudio,
}: StudioGreenRoomPreviewProps) {
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const { sfxMuted } = useSfxMuted()

  // Default to a helpful Framing Guide when opening the Green Room if currently 'off'
  useEffect(() => {
    if (isOpen && pipeline.framingGuide === 'off') {
      pipeline.setFramingGuide(isCoach ? 'upper_body_desk' : 'head_to_toe')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    const el = previewVideoRef.current
    const stream = pipeline.outputStream
    if (isOpen && el && stream && el.srcObject !== stream) {
      el.srcObject = stream
      void el.play().catch(() => {})
    }
  }, [isOpen, pipeline.outputStream, pipeline.isCameraActive])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Forge Athletic Live Studio Green Room Preview"
      data-testid="studio-green-room-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(4, 7, 14, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(14px, env(safe-area-inset-top, 0px)) max(14px, env(safe-area-inset-right, 0px)) max(14px, env(safe-area-inset-bottom, 0px)) max(14px, env(safe-area-inset-left, 0px))',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: 'min(980px, 100%)',
          maxHeight: '94dvh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #0B1120 0%, #060913 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          padding: 'clamp(16px, 2.5vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Top Studio Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#D4AF37',
              }}
            >
              FORGE ATHLETIC · PRE-CALL GREEN ROOM CHECK
            </div>
            <h2
              style={{
                margin: '3px 0 0',
                fontSize: 'clamp(18px, 2.4vw, 22px)',
                fontWeight: 800,
                color: '#FFFFFF',
                textWrap: 'balance',
              }}
            >
              Test Studio Filter & Background Before Joining {counterpartName}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6EE7B7',
              }}
            >
              {pipeline.captureResolutionLabel} · 2.5 Mbps HD Ready
            </span>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#CBD5E1',
              }}
            >
              UI SFX: {sfxMuted ? 'Muted' : 'Active'}
            </span>
          </div>
        </div>

        {/* Main Responsive Grid: Live Mirror Stage + Test Studio Filter & Background Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 18,
            alignItems: 'stretch',
          }}
        >
          {/* Left: Live Processed Mirror Stage + Framing Guide + Mic Level Meter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              data-testid="green-room-mirror-stage"
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                background: '#05080F',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid rgba(212, 175, 55, 0.38)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pipeline.isCameraActive && pipeline.outputStream ? (
                <video
                  ref={el => {
                    previewVideoRef.current = el
                    if (el && pipeline.outputStream && el.srcObject !== pipeline.outputStream) {
                      el.srcObject = pipeline.outputStream
                      void el.play().catch(() => {})
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    // Output stream canvas already mirrors ONLY the foreground subject while keeping
                    // studio backdrops & brand marks in true optical left-to-right orientation.
                    transform: pipeline.isPipelineRendering
                      ? 'none'
                      : pipeline.isMirrored
                      ? 'scaleX(-1)'
                      : 'none',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8' }}>
                  <ForgeIcon name="video-off" size={30} tone="slate" />
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>
                    {pipeline.streamError || `${participantName} — Camera Paused`}
                  </div>
                </div>
              )}

              <StudioFramingGuideOverlay mode={pipeline.framingGuide} />

              {/* Participant Preview Pill */}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  zIndex: 20,
                  background: 'rgba(6, 10, 18, 0.82)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 6,
                  padding: '3px 9px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                ● {participantName} · Studio Preview
              </div>
            </div>

            {/* Hardware & Voice Isolation Mic Level Meter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  aria-pressed={!pipeline.isMicMuted}
                  onClick={() => {
                    triggerStudioTick()
                    pipeline.toggleMic()
                  }}
                  style={{
                    minBlockSize: 34,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: pipeline.isMicMuted ? '#EF4444' : 'rgba(16, 185, 129, 0.18)',
                    color: '#FFFFFF',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <ForgeIcon name={pipeline.isMicMuted ? 'mic-off' : 'mic'} size={13} tone="white" />
                  <span>{pipeline.isMicMuted ? 'Mic Muted' : 'Mic Live'}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={pipeline.isCameraActive}
                  onClick={() => {
                    triggerStudioTick()
                    pipeline.toggleCamera()
                  }}
                  style={{
                    minBlockSize: 34,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: pipeline.isCameraActive ? 'rgba(255,255,255,0.08)' : '#EF4444',
                    color: '#FFFFFF',
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <ForgeIcon name={pipeline.isCameraActive ? 'video-studio' : 'video-off'} size={13} tone="white" />
                  <span>{pipeline.isCameraActive ? 'Cam Live' : 'Cam Off'}</span>
                </button>

                <button
                  type="button"
                  aria-pressed={pipeline.isMirrored}
                  onClick={() => {
                    triggerStudioTick()
                    pipeline.toggleMirror()
                  }}
                  style={{
                    minBlockSize: 34,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: pipeline.isMirrored ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.08)',
                    color: pipeline.isMirrored ? '#FDE68A' : '#FFFFFF',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <ForgeIcon name="rotate-ccw" size={12} tone="inherit" />
                  <span>Mirror</span>
                </button>
              </div>

              {/* Segmented 48kHz Voice Level Meter */}
              <div
                data-testid="green-room-mic-meter"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flex: '1 1 140px',
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Voice Isolation:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const threshold = (idx + 1) * 8
                    const active = !pipeline.isMicMuted && pipeline.micLevel >= threshold
                    return (
                      <span
                        key={idx}
                        style={{
                          width: 5,
                          height: 14,
                          borderRadius: 2,
                          background: active
                            ? idx >= 9
                              ? '#F59E0B'
                              : '#10B981'
                            : 'rgba(255,255,255,0.12)',
                          transition: 'background-color 0.08s ease',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Test Studio Filter & Background + Framing Guide Controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Framing Guide Selector */}
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#D4AF37',
                    marginBottom: 6,
                  }}
                >
                  5-Second Camera Framing Guide
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                  {STUDIO_FRAMING_GUIDE_LIST.map(fg => {
                    const selected = pipeline.framingGuide === fg.id
                    return (
                      <button
                        key={fg.id}
                        type="button"
                        data-testid={`green-room-framing-${fg.id}`}
                        aria-pressed={selected}
                        onClick={() => {
                          triggerStudioTick()
                          pipeline.setFramingGuide(fg.id)
                        }}
                        style={{
                          minBlockSize: 36,
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: selected
                            ? '1px solid #D4AF37'
                            : '1px solid rgba(255,255,255,0.14)',
                          background: selected
                            ? 'rgba(212, 175, 55, 0.22)'
                            : 'rgba(255,255,255,0.05)',
                          color: selected ? '#FDE68A' : '#E2E8F0',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {fg.shortLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Background Segmentation Mode */}
              <div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#D4AF37',
                    marginBottom: 6,
                  }}
                >
                  Studio Background Mode
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                  {STUDIO_BACKGROUND_MODE_LIST.map(bg => {
                    const selected = pipeline.backgroundMode === bg.id
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        data-testid={`green-room-bg-${bg.id}`}
                        aria-pressed={selected}
                        onClick={() => {
                          triggerStudioTick()
                          pipeline.setBackgroundMode(bg.id)
                        }}
                        style={{
                          minBlockSize: 38,
                          padding: '7px 10px',
                          borderRadius: 6,
                          border: selected
                            ? '1px solid #D4AF37'
                            : '1px solid rgba(255,255,255,0.14)',
                          background: selected
                            ? 'rgba(212, 175, 55, 0.22)'
                            : 'rgba(255,255,255,0.05)',
                          color: selected ? '#FDE68A' : '#E2E8F0',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {bg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Forge Studio Lighting Filter */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#D4AF37',
                    }}
                  >
                    Forge Studio Lighting Filter
                  </span>
                  <button
                    type="button"
                    data-testid="green-room-low-light-btn"
                    aria-pressed={pipeline.lowLightBoostEnabled}
                    onClick={() => {
                      triggerStudioTick()
                      pipeline.toggleLowLightBoost()
                    }}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 999,
                      border: pipeline.lowLightBoostEnabled
                        ? '1px solid #10B981'
                        : '1px solid rgba(245, 158, 11, 0.5)',
                      background: pipeline.lowLightBoostEnabled
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(245, 158, 11, 0.14)',
                      color: pipeline.lowLightBoostEnabled ? '#6EE7B7' : '#FCD34D',
                      fontSize: 10.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {pipeline.lowLightBoostEnabled ? '✓ ' : ''}Low-Light Studio Boost
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                  {STUDIO_LIGHTING_PRESET_LIST.map(lut => {
                    const selected = pipeline.lightingPreset === lut.id
                    return (
                      <button
                        key={lut.id}
                        type="button"
                        data-testid={`green-room-lut-${lut.id}`}
                        aria-pressed={selected}
                        onClick={() => {
                          triggerStudioTick()
                          pipeline.setLightingPreset(lut.id)
                        }}
                        style={{
                          minBlockSize: 38,
                          padding: '7px 10px',
                          borderRadius: 6,
                          border: selected
                            ? '1px solid #D4AF37'
                            : '1px solid rgba(255,255,255,0.14)',
                          background: selected
                            ? 'rgba(212, 175, 55, 0.22)'
                            : 'rgba(255,255,255,0.05)',
                          color: selected ? '#FDE68A' : '#E2E8F0',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {lut.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Join Live Studio CTA */}
            <button
              type="button"
              data-testid="green-room-join-btn"
              onClick={() => {
                triggerStudioTick()
                onJoinStudio()
              }}
              style={{
                minBlockSize: 46,
                width: '100%',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #F5D061 100%)',
                color: '#080E14',
                fontSize: 13.5,
                fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
              }}
            >
              <ForgeIcon name="video-studio" size={15} tone="dark" />
              <span>Join Live Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
