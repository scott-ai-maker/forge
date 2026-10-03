'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type PortableOrientationLock =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'

function canAttemptPortraitLock() {
  return typeof window !== 'undefined' && typeof screen !== 'undefined' && 'orientation' in screen
}

function isLikelyPhone() {
  if (typeof window === 'undefined') return false

  const isNarrow = window.matchMedia('(max-width: 900px)').matches
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  return isNarrow && isCoarsePointer
}

function isLandscape() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(orientation: landscape)').matches
}

export default function MobilePortraitLock() {
  const pathname = usePathname() || ''
  const [showLandscapeBlocker, setShowLandscapeBlocker] = useState(false)
  const [dismissedForSession, setDismissedForSession] = useState(false)

  useEffect(() => {
    let mounted = true

    async function tryLockPortrait() {
      if (!canAttemptPortraitLock()) return

      try {
        const orientationApi = screen.orientation as ScreenOrientation & {
          lock?: (orientation: PortableOrientationLock) => Promise<void>
        }

        if (typeof orientationApi.lock === 'function') {
          await orientationApi.lock('portrait')
        }
      } catch {
        // Many browsers only allow locking in installed/fullscreen contexts.
      }
    }

    function updateBlockerState() {
      if (!mounted) return
      // Allow landscape freely on live video consultation, video critique, and test harness routes
      const isVideoOrLiveRoute = pathname.includes('/live') || pathname.includes('video') || pathname.startsWith('/test-harness')
      setShowLandscapeBlocker(isLikelyPhone() && isLandscape() && !isVideoOrLiveRoute && !dismissedForSession)
    }

    updateBlockerState()
    void tryLockPortrait()

    window.addEventListener('resize', updateBlockerState)
    window.addEventListener('orientationchange', updateBlockerState)

    return () => {
      mounted = false
      window.removeEventListener('resize', updateBlockerState)
      window.removeEventListener('orientationchange', updateBlockerState)
    }
  }, [pathname, dismissedForSession])

  if (!showLandscapeBlocker || dismissedForSession) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(13, 27, 42, 0.98)',
        color: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
      }}
    >
      <div style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
        <p className="font-serif" style={{ margin: 0, letterSpacing: '0.08em', fontSize: 20, color: 'var(--gold)', fontWeight: 600 }}>
          Rotate To Portrait
        </p>
        <p style={{ margin: 0, fontFamily: 'Raleway, sans-serif', fontSize: 15, color: 'var(--gray)' }}>
          This app is optimized for portrait mode on phone.
        </p>
        <button
          type="button"
          onClick={() => setDismissedForSession(true)}
          style={{
            margin: '12px auto 0',
            background: 'rgba(197, 160, 89, 0.1)',
            border: '1px solid rgba(197, 160, 89, 0.35)',
            borderRadius: 6,
            padding: '8px 18px',
            color: 'var(--gold-lt)',
            fontFamily: 'var(--font-sans, Raleway), sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Continue In Landscape
        </button>
      </div>
    </div>
  )
}
