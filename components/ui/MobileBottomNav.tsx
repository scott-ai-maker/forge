'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'

interface MobileBottomNavProps {
  role?: 'client' | 'coach'
}

export default function MobileBottomNav({ role = 'client' }: MobileBottomNavProps) {
  const pathname = usePathname() || ''

  if (role === 'coach') {
    const coachTabs: Array<{ href: string; label: string; icon: GaaIconName }> = [
      { href: '/coach', label: 'Triage', icon: 'alert-triangle' },
      { href: '/coach#assigned-clients', label: 'Athletes', icon: 'users' },
      { href: '/dashboard/live', label: 'Live Studio', icon: 'video-studio' },
      { href: '/coach/settings', label: 'Operations', icon: 'gear' },
    ]

    return (
      <nav
        className="mobile-bottom-dock"
        aria-label="Mobile Coach Navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'rgba(8, 14, 24, 0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(197, 160, 89, 0.35)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 8px calc(6px + env(safe-area-inset-bottom, 8px))',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(197, 160, 89, 0.08)',
        }}
      >
        {coachTabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== '/coach' && pathname.startsWith(tab.href.split('#')[0]))
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => triggerHaptic('tap')}
              className="tactile-btn"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                textDecoration: 'none',
                color: isActive ? 'var(--gold)' : 'var(--gray)',
                minWidth: 64,
                minHeight: 48,
                padding: '4px 0',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ transform: isActive ? 'scale(1.12)' : 'scale(1)', transition: 'transform 0.15s ease' }}>
                <GaaIcon
                  name={tab.icon}
                  size={19}
                  tone={isActive ? 'gold' : 'slate'}
                />
              </div>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 9.5,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--gold-lt)' : 'var(--gray)',
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: 20,
                    height: 2,
                    borderRadius: 1,
                    background: 'var(--gold)',
                    boxShadow: '0 0 8px var(--gold)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  const clientTabs: Array<{ href: string; label: string; icon: GaaIconName }> = [
    { href: '/dashboard', label: 'Home', icon: 'crown' },
    { href: '/dashboard/fitness', label: 'Fitness Lab', icon: 'barbell' },
    { href: '/dashboard/messages', label: 'Concierge', icon: 'message' },
    { href: '/dashboard/live', label: 'Live Studio', icon: 'video-studio' },
    { href: '/dashboard/settings', label: 'Settings', icon: 'gear' },
  ]

  return (
    <nav
      className="mobile-bottom-dock"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(8, 14, 24, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(197, 160, 89, 0.35)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 6px calc(6px + env(safe-area-inset-bottom, 8px))',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(197, 160, 89, 0.08)',
      }}
    >
      {clientTabs.map(tab => {
        const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => triggerHaptic('tap')}
            className="tactile-btn"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? 'var(--gold)' : 'var(--gray)',
              minWidth: 58,
              minHeight: 48,
              padding: '4px 0',
              position: 'relative',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ transform: isActive ? 'scale(1.12)' : 'scale(1)', transition: 'transform 0.15s ease' }}>
              <GaaIcon
                name={tab.icon}
                size={19}
                tone={isActive ? 'gold' : 'slate'}
              />
            </div>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 9.5,
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: isActive ? 'var(--gold-lt)' : 'var(--gray)',
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  background: 'var(--gold)',
                  boxShadow: '0 0 8px var(--gold)',
                }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

