'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import GaaIcon from '@/components/ui/GaaIcon'
import { isCompanionApp } from '@/lib/native-companion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSAL_KEY = 'gaa_pwa_prompt_dismissed_v2'
const SNOOZE_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export default function PwaInstallPrompt() {
  const pathname = usePathname() || ''
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState<boolean>(false)
  const [isStandalone, setIsStandalone] = useState<boolean>(true) // default true to avoid SSR flash
  const [dismissed, setDismissed] = useState<boolean>(true)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Check if already running in helper app (standalone PWA or native Capacitor app)
    const isStandaloneMode =
      isCompanionApp() ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')

    if (isStandaloneMode) {
      setIsStandalone(true)
      return
    }
    setIsStandalone(false)

    // 2. Check if previously dismissed within snooze duration
    try {
      const dismissedTimestamp = window.localStorage.getItem(DISMISSAL_KEY)
      if (dismissedTimestamp) {
        const timeSince = Date.now() - Number(dismissedTimestamp)
        if (timeSince < SNOOZE_DURATION_MS) {
          setDismissed(true)
          return
        }
      }
      // Legacy fallback
      if (window.localStorage.getItem('gaa_pwa_prompt_dismissed_v1') === 'true') {
        setDismissed(true)
        return
      }
    } catch {
      // Storage access blocked / private mode
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream
    if (isIosDevice) {
      setIsIos(true)
      // Delay showing iOS install banner slightly for better UX
      const timer = setTimeout(() => {
        setDismissed(false)
      }, 2500)
      return () => clearTimeout(timer)
    }

    // 4. Listen for Chromium beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setDismissed(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setDismissed(true)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      window.localStorage.setItem(DISMISSAL_KEY, Date.now().toString())
      window.localStorage.setItem('gaa_pwa_prompt_dismissed_v1', 'true')
    } catch {
      // Ignore storage restrictions
    }
  }

  // Suppress on full-screen studio / live routes and test harnesses to prevent UX interference
  const isSuppressedRoute =
    pathname.includes('/live') ||
    pathname.startsWith('/test-harness')

  if (isStandalone || dismissed || isSuppressedRoute) {
    return null
  }

  return (
    <aside
      aria-label="Install Forge Athletic App"
      className="pwa-install-banner"
      style={{
        position: 'fixed',
        top: 'calc(10px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(94vw, 440px)',
        zIndex: 9998,
        background: 'rgba(14, 23, 36, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(197, 160, 89, 0.45)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(197, 160, 89, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        animation: 'pwaSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'radial-gradient(circle, rgba(197, 160, 89, 0.3) 0%, rgba(8, 14, 20, 0.8) 100%)',
            border: '1px solid rgba(197, 160, 89, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <GaaIcon name="lightning" size={18} tone="gold" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#F8FAFC', fontSize: 12.5, fontWeight: 700, fontFamily: 'Raleway, sans-serif' }}>
            Gordon Athletic App
          </div>
          <div style={{ color: 'var(--gray)', fontSize: 11, lineHeight: 1.3, marginTop: 1 }}>
            {isIos ? (
              <span>
                Tap <strong style={{ color: 'var(--gold-lt)' }}>Share ⎋</strong> then <strong style={{ color: 'var(--gold-lt)' }}>&quot;Add to Home Screen&quot;</strong>
              </span>
            ) : (
              <span>Install for full-screen offline gym tracking</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!isIos && deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #D4A017 0%, #B38610 100%)',
              color: '#080E14',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 8px rgba(212,160,23,0.35)',
            }}
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8A99AA',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GaaIcon name="close" size={14} tone="slate" />
        </button>
      </div>

      <style jsx global>{`
        @keyframes pwaSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </aside>
  )
}
