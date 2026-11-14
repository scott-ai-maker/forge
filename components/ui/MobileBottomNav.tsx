'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import { CLIENT_PRIMARY_NAV, isClientPrimaryNavItemActive } from '@/components/ui/client-primary-navigation'

interface MobileBottomNavProps {
  role?: 'client' | 'coach'
}

export default function MobileBottomNav({ role = 'client' }: MobileBottomNavProps) {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()

  if (role === 'coach') {
    const coachTab = searchParams.get('tab')
    const coachTabs: Array<{ href: string; label: string; icon: GaaIconName; isActive: boolean }> = [
      { href: '/coach', label: 'Review', icon: 'alert-triangle', isActive: pathname === '/coach' && coachTab !== 'roster' },
      { href: '/coach?tab=roster#assigned-clients', label: 'Members', icon: 'users', isActive: pathname === '/coach' && coachTab === 'roster' },
      { href: '/dashboard/live', label: 'Live session', icon: 'video-studio', isActive: pathname.startsWith('/dashboard/live') },
      { href: '/coach/settings', label: 'Settings', icon: 'gear', isActive: pathname.startsWith('/coach/settings') },
    ]

    return (
      <nav
        className="mobile-bottom-dock"
        aria-label="Mobile Coach Navigation"
        suppressHydrationWarning
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'rgba(17, 19, 24, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '6px 8px max(8px, calc(4px + env(safe-area-inset-bottom, 0px)))',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 -10px 30px rgba(0, 0, 0, 0.72)',
        }}
      >
        {coachTabs.map(tab => {
          const { isActive } = tab
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => triggerHaptic('tap')}
              className="forge-tactile-press"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                textDecoration: 'none',
                color: isActive ? '#34D399' : '#A1A1AA',
                minWidth: 64,
                minHeight: 48,
                padding: '4px 6px',
                borderRadius: 12,
                position: 'relative',
                transition: 'color 0.15s ease, background-color 0.15s ease',
              }}
            >
              <div style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s var(--ease-spring)' }}>
                <GaaIcon
                  name={tab.icon}
                  size={19}
                  tone={isActive ? 'gold' : 'slate'}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: isActive ? '#F8FAFC' : '#A1A1AA',
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 1,
                    width: 20,
                    height: 2,
                    borderRadius: 9999,
                    background: '#34D399',
                    boxShadow: '0 0 8px rgba(52, 211, 153, 0.7)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      className="mobile-bottom-dock"
      aria-label="Mobile Navigation"
      suppressHydrationWarning
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'rgba(17, 19, 24, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 6px max(8px, calc(4px + env(safe-area-inset-bottom, 0px)))',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 -10px 30px rgba(0, 0, 0, 0.72)',
      }}
    >
      {CLIENT_PRIMARY_NAV.map(tab => {
        const isActive = isClientPrimaryNavItemActive(tab.id, pathname, searchParams.get('workspace'))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => triggerHaptic('tap')}
            className="forge-tactile-press"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? '#34D399' : '#A1A1AA',
              minWidth: 58,
              minHeight: 48,
              padding: '4px 6px',
              borderRadius: 12,
              position: 'relative',
              transition: 'color 0.15s ease, background-color 0.15s ease',
            }}
          >
            <div style={{ transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s var(--ease-spring)' }}>
              <GaaIcon
                name={tab.icon}
                size={19}
                tone={isActive ? 'gold' : 'slate'}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: isActive ? '#F8FAFC' : '#A1A1AA',
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 1,
                  width: 20,
                  height: 2,
                  borderRadius: 9999,
                  background: '#34D399',
                  boxShadow: '0 0 8px rgba(52, 211, 153, 0.7)',
                }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
