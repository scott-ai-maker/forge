'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import GaaIcon, { GaaIconName } from '@/components/ui/GaaIcon'
import { APP_VERSION } from '@/lib/app-version'
import { openCoachGordon } from '@/components/fitness/GlobalCoachGordonHost'

export interface CommandItem {
  id: string
  title: string
  subtitle: string
  category: 'Quick Actions' | 'Navigation' | 'Features & Tools' | 'Coach Operations' | 'Athletes' | 'Settings & Hardware'
  icon: GaaIconName
  href: string
  keywords?: string[]
  badge?: string
}

const GLOBAL_COMMAND_ITEMS: CommandItem[] = [
  // ── Quick Actions ──
  {
    id: 'action-ask-coach-gordon',
    title: 'Ask Coach Gordon',
    subtitle: 'Training, movement, form, and nutrition support',
    category: 'Quick Actions',
    icon: 'message',
    href: '#coach-gordon',
    keywords: ['coach', 'gordon', 'ai', 'ask', 'chat', 'voice', 'chatbot', 'assistant', 'swap', 'form', 'nutrition', 'concierge', 'help'],
    badge: 'Live AI',
  },

  // ── Features & Tools (Athlete & Coach) ──
  {
    id: 'feat-periodization',
    title: '12-Week Training Plan',
    subtitle: 'A phased plan with clear steps for building progress',
    category: 'Features & Tools',
    icon: 'periodization',
    href: '/dashboard/fitness?workspace=periodization',
    keywords: ['periodization', 'roadmap', 'macrocycle', 'opt', 'phases', 'deload', 'setback', 'tempo', 'volume', 'weeks'],
    badge: 'NASM OPT',
  },
  {
    id: 'feat-3d-matrix',
    title: '3D Muscle Recovery View',
    subtitle: 'Explore muscle soreness and recovery trends',
    category: 'Features & Tools',
    icon: 'dna',
    href: '/dashboard/fitness?workspace=readiness&tab=3d',
    keywords: ['3d', 'muscle', 'heatmap', 'recovery', 'matrix', 'soreness', 'fatigue', 'time-lapse', 'chest', 'quads', 'back'],
    badge: 'Live 3D',
  },
  {
    id: 'feat-readiness',
    title: 'Daily Readiness & Training Load',
    subtitle: 'Review recovery signals and recent training',
    category: 'Features & Tools',
    icon: 'lightning',
    href: '/dashboard/fitness?workspace=readiness',
    keywords: ['readiness', 'acwr', 'workload', 'injury risk', 'cns', 'fatigue', 'hrv', 'strain', 'rpe'],
    badge: 'Sports Science',
  },
  {
    id: 'feat-sleep',
    title: 'Sleep & Recovery',
    subtitle: 'Review sleep, heart rate, and recovery trends',
    category: 'Features & Tools',
    icon: 'sleep',
    href: '/dashboard/fitness?workspace=sleep',
    keywords: ['sleep', 'stages', 'deep sleep', 'rem', 'hrv', 'autonomic', 'rmssd', 'rhr dip', 'apple health', 'google health', 'apple watch', 'wear os', 'recovery'],
    badge: 'Autonomic HUD',
  },
  {
    id: 'feat-video-critique',
    title: 'Movement & Form Feedback',
    subtitle: 'Review movement patterns and coaching suggestions',
    category: 'Features & Tools',
    icon: 'camera',
    href: '/dashboard/fitness?workspace=video',
    keywords: ['video', 'critique', 'form', 'camera', 'squat', 'bench', 'deadlift', 'bar-path', 'biomechanics', 'corrective', 'nasm', 'valgus', 'opt'],
  },
  {
    id: 'feat-train',
    title: 'Today\'s Workout & Exercise Logger',
    subtitle: 'Log sets, reps, weight, RPE, 4/2/1 tempo cadence & auto-PR detection',
    category: 'Features & Tools',
    icon: 'barbell',
    href: '/dashboard/fitness?workspace=train',
    keywords: ['workout', 'train', 'exercise', 'sets', 'reps', 'weight', 'rpe', 'log', 'gym', 'tempo', 'plate calculator'],
  },
  {
    id: 'feat-cardio-studio',
    title: 'AI Voice Cardio Studio (In-Ear Copilot)',
    subtitle: '6 Tanaka stage protocols, live HR pacing, in-pocket touch shield & music ducking',
    category: 'Features & Tools',
    icon: 'headphones',
    href: '/dashboard/fitness?workspace=train#cardio-studio',
    keywords: ['cardio', 'voiceover', 'running', 'walking', 'treadmill', 'zone 2', 'hiit', 'tabata', 'music ducking', 'in-ear', 'headphones'],
    badge: 'Voice AI',
  },
  {
    id: 'feat-assessment',
    title: 'Movement Assessment',
    subtitle: 'Explore movement patterns and posture',
    category: 'Features & Tools',
    icon: 'movement-screen',
    href: '/dashboard/fitness?workspace=assessment',
    keywords: ['assessment', 'movement', 'screen', 'ohsa', 'posture', 'valgus', 'pronation', 'davies', 'radar'],
  },
  {
    id: 'feat-toolboxes',
    title: 'Personalized Training Guides',
    subtitle: 'Support for work, travel, back care, and sleep',
    category: 'Features & Tools',
    icon: 'toolbox',
    href: '/dashboard/fitness?workspace=toolboxes',
    keywords: ['toolbox', 'toolboxes', 'desk worker', 'travel', 'low back', 'sleep', 'prescriptions'],
  },
  {
    id: 'feat-supplements',
    title: 'Supplement Guidance',
    subtitle: 'Evidence-informed options, timing, and nutrition support',
    category: 'Features & Tools',
    icon: 'supplements',
    href: '/dashboard/fitness?workspace=supplements',
    keywords: ['supplements', 'creatine', 'whey', 'protein', 'magnesium', 'dosing', 'prescriptions', 'nutrition'],
  },
  {
    id: 'feat-travel',
    title: 'Hotel & Travel Workout Generator',
    subtitle: 'Instant bodyweight, dumbbell, and resistance band adaptations on the road',
    category: 'Features & Tools',
    icon: 'travel',
    href: '/dashboard/fitness?workspace=travel',
    keywords: ['travel', 'hotel', 'adapter', 'bodyweight', 'bands', 'on the road', 'equipment'],
  },
  {
    id: 'feat-progress',
    title: 'Progress Photos & Body Composition',
    subtitle: 'Visual transformation timeline, US Navy bodyfat & predictive aesthetics',
    category: 'Features & Tools',
    icon: 'chart',
    href: '/dashboard/fitness?workspace=progress',
    keywords: ['progress', 'photos', 'bodyfat', 'body comp', 'transformation', 'timeline', 'predict look'],
  },
  {
    id: 'feat-book',
    title: 'Book a Coaching Session',
    subtitle: 'Schedule a video session or movement assessment with Coach Gordon',
    category: 'Features & Tools',
    icon: 'calendar',
    href: '/dashboard/book',
    keywords: ['book', 'schedule', 'session', 'consultation', 'calendar', 'appointment'],
  },
  {
    id: 'feat-messages',
    title: 'Message Your Coach',
    subtitle: 'Send a message or voice memo to your coach',
    category: 'Features & Tools',
    icon: 'message',
    href: '/dashboard/messages',
    keywords: ['messages', 'chat', 'concierge', 'voice note', 'audio', 'coach'],
  },
  {
    id: 'feat-whats-new',
    title: 'What\'s New',
    subtitle: `See the latest app updates and features (v${APP_VERSION})`,
    category: 'Features & Tools',
    icon: 'crown',
    href: '/whats-new',
    keywords: ['whats new', 'changelog', 'version', 'release', 'update', 'log', APP_VERSION, 'features'],
    badge: `v${APP_VERSION}`,
  },
  {
    id: 'feat-live',
    title: 'Live Video Coaching',
    subtitle: 'Train with your coach over live video',
    category: 'Features & Tools',
    icon: 'video-studio',
    href: '/dashboard/live',
    keywords: ['live', 'studio', 'video call', 'telestrator', 'camera', 'hud', 'telehealth'],
  },

  // ── Coach Operations ──
  {
    id: 'coach-corporate-proposal',
    title: 'Team Wellness Proposal Builder',
    subtitle: 'Create a workplace wellness plan and shareable proposal',
    category: 'Coach Operations',
    icon: 'crown',
    href: '/corporate/proposal',
    keywords: ['corporate', 'proposal', 'b2b', 'enterprise', 'seats', 'roi', 'pitch', 'deck', 'pricing', 'boardroom'],
    badge: 'B2B Suite',
  },
  {
    id: 'coach-sunday-dossier',
    title: 'Weekly Progress Report',
    subtitle: 'Review training trends, movement notes, and progress in a printable report',
    category: 'Coach Operations',
    icon: 'clipboard',
    href: '/dashboard/dossier',
    keywords: ['dossier', 'sunday', 'briefing', 'acwr', 'soap', 'telemetry', 'report', 'boardroom', 'pdf', 'print'],
    badge: 'Coach',
  },
  {
    id: 'coach-triage',
    title: 'Daily Member Check-ins',
    subtitle: 'Review urgent concerns, training load, and plan adjustments',
    category: 'Coach Operations',
    icon: 'alert-triangle',
    href: '/coach',
    keywords: ['coach', 'triage', 'cockpit', 'alerts', 'urgent', 'danger', 'acwr', 'red', 'amber'],
    badge: 'Coach',
  },
  {
    id: 'coach-athletes',
    title: 'Member Directory',
    subtitle: 'Member list, attendance, and training plans',
    category: 'Coach Operations',
    icon: 'users',
    href: '/coach#assigned-clients',
    keywords: ['coach', 'athletes', 'clients', 'roster', 'assigned', 'management'],
    badge: 'Coach',
  },
  {
    id: 'coach-templates',
    title: 'Training Plan Builder',
    subtitle: 'Build and adapt training plans with the exercise library',
    category: 'Coach Operations',
    icon: 'clipboard',
    href: '/coach/settings?tab=templates',
    keywords: ['templates', 'program generator', 'rag', 'exercise library', 'nasm', 'builder'],
    badge: 'Coach',
  },
  {
    id: 'coach-analytics',
    title: 'Training & Progress Analytics',
    subtitle: 'Review attendance, member progress, and program trends',
    category: 'Coach Operations',
    icon: 'chart',
    href: '/coach?tab=analytics',
    keywords: ['analytics', 'dossier', 'compliance', 'revenue', 'attendance', 'stats', 'sunday'],
    badge: 'Coach',
  },
  {
    id: 'coach-discounts',
    title: 'Discount Codes',
    subtitle: 'Create and manage membership discounts',
    category: 'Coach Operations',
    icon: 'ticket',
    href: '/coach/settings?tab=promotions',
    keywords: ['promotions', 'discount', 'coupons', 'promo', 'codes', 'checkout'],
    badge: 'Coach',
  },

  // ── Settings & Hardware ──
  {
    id: 'set-wearables',
    title: 'Health Telemetry & Biometrics Setup',
    subtitle: 'Configure Apple Health (iOS) or Google Health Connect (Android) Single Source of Truth',
    category: 'Settings & Hardware',
    icon: 'radio',
    href: '/dashboard/settings?tab=wearables',
    keywords: ['wearables', 'apple health', 'google health', 'health connect', 'apple watch', 'wear os', 'heart rate', 'sync', 'telemetry'],
  },
  {
    id: 'set-profile',
    title: 'Account Settings & Display Units',
    subtitle: 'Update profile, avatar, metric/imperial units & email preferences',
    category: 'Settings & Hardware',
    icon: 'user',
    href: '/dashboard/settings?tab=profile',
    keywords: ['profile', 'settings', 'account', 'units', 'metric', 'imperial', 'avatar', 'email'],
  },
  {
    id: 'set-billing',
    title: 'Billing, Payments & Memberships',
    subtitle: 'Stripe customer portal, active subscriptions & session balances',
    category: 'Settings & Hardware',
    icon: 'credit-card',
    href: '/dashboard/settings?tab=billing',
    keywords: ['billing', 'stripe', 'invoices', 'subscription', 'packages', 'payment'],
  },
  {
    id: 'set-security',
    title: 'Security, Password & Authentication',
    subtitle: 'Update login credentials, password reset & multi-factor security',
    category: 'Settings & Hardware',
    icon: 'lock',
    href: '/dashboard/settings?tab=security',
    keywords: ['security', 'password', 'login', 'auth', 'credentials'],
  },
]

interface ClientRosterItem {
  id: string
  name: string
  email: string
}

export default function GlobalCommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [clients, setClients] = useState<ClientRosterItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Fetch coach client roster if available
  useEffect(() => {
    if (isOpen && clients.length === 0) {
      fetch('/api/coach/clients')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.clients)) {
            setClients(
              data.clients.map((c: { id: string; full_name?: string | null; email?: string | null }) => ({
                id: c.id,
                name: c.full_name || 'Client',
                email: c.email || '',
              }))
            )
          }
        })
        .catch(() => {})
    }
  }, [isOpen, clients.length])

  // Generate dynamic client commands for coaches
  const dynamicClientItems = useMemo<CommandItem[]>(() => {
    if (clients.length === 0) return []
    const items: CommandItem[] = []
    for (const c of clients) {
      items.push({
        id: `client-overview-${c.id}`,
        title: `${c.name} — Overview`,
        subtitle: `Open client profile & telemetry dashboard (${c.email})`,
        category: 'Athletes',
        icon: 'user',
        href: `/coach/clients/${c.id}`,
        keywords: [c.name.toLowerCase(), c.email.toLowerCase(), 'client', 'overview'],
        badge: 'Athlete',
      })
      items.push({
        id: `client-periodization-${c.id}`,
        title: `${c.name} — Periodization Architect`,
        subtitle: `12-Week OPT macrocycle, deloads & setback modulation`,
        category: 'Athletes',
        icon: 'periodization',
        href: `/coach/clients/${c.id}?tab=periodization`,
        keywords: [c.name.toLowerCase(), 'periodization', 'macrocycle', 'deload', 'setback', 'phase'],
        badge: 'Periodization',
      })
      items.push({
        id: `client-program-${c.id}`,
        title: `${c.name} — Program Workspace`,
        subtitle: `Prescribed workout days, exercise selection & sets`,
        category: 'Athletes',
        icon: 'barbell',
        href: `/coach/clients/${c.id}?tab=program`,
        keywords: [c.name.toLowerCase(), 'program', 'workout', 'exercises'],
        badge: 'Program',
      })
      items.push({
        id: `client-assessment-${c.id}`,
        title: `${c.name} — Movement Screen Suite`,
        subtitle: `Kinetic chain assessment, OHSA screen & radar`,
        category: 'Athletes',
        icon: 'movement-screen',
        href: `/coach/clients/${c.id}?tab=assessment`,
        keywords: [c.name.toLowerCase(), 'assessment', 'ohsa', 'movement', 'posture'],
        badge: 'Screen',
      })
      items.push({
        id: `client-shield-${c.id}`,
        title: `${c.name} — Clinical Liability Shield`,
        subtitle: `PAR-Q medical intake & clinical contraindications`,
        category: 'Athletes',
        icon: 'shield',
        href: `/coach/clients/${c.id}?tab=shield`,
        keywords: [c.name.toLowerCase(), 'shield', 'liability', 'par-q', 'medical'],
        badge: 'Safety',
      })
      items.push({
        id: `client-toolbox-${c.id}`,
        title: `${c.name} — Prescribe Toolboxes`,
        subtitle: `Assign specialized Desk Worker, Travel, or Back toolboxes`,
        category: 'Athletes',
        icon: 'toolbox',
        href: `/coach/clients/${c.id}?tab=prescriptions&subtab=toolboxes`,
        keywords: [c.name.toLowerCase(), 'toolbox', 'toolboxes', 'desk', 'travel'],
        badge: 'Toolbox',
      })
      items.push({
        id: `client-supplements-${c.id}`,
        title: `${c.name} — Supplement Prescriptions`,
        subtitle: `Prescribe clinical supplements & timing protocols`,
        category: 'Athletes',
        icon: 'supplements',
        href: `/coach/clients/${c.id}?tab=prescriptions&subtab=supplements`,
        keywords: [c.name.toLowerCase(), 'supplements', 'creatine', 'prescribe'],
        badge: 'Supplements',
      })
      items.push({
        id: `client-messages-${c.id}`,
        title: `${c.name} — Messages`,
        subtitle: `Open direct encrypted message thread & voice notes`,
        category: 'Athletes',
        icon: 'message',
        href: `/coach/clients/${c.id}/messages`,
        keywords: [c.name.toLowerCase(), 'messages', 'chat', 'voice'],
        badge: 'Direct',
      })
    }
    return items
  }, [clients])

  const allItems = useMemo(() => {
    return [...GLOBAL_COMMAND_ITEMS, ...dynamicClientItems]
  }, [dynamicClientItems])

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Return top features & quick actions when query is empty
      return allItems.filter(item => item.category !== 'Athletes')
    }
    return allItems.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchSubtitle = item.subtitle.toLowerCase().includes(q)
      const matchKeywords = (item.keywords || []).some(k => k.toLowerCase().includes(q))
      return matchTitle || matchSubtitle || matchKeywords
    })
  }, [allItems, query])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        onClose()
        if (selected.href === '#coach-gordon' || selected.id === 'action-ask-coach-gordon') {
          openCoachGordon()
        } else {
          router.push(selected.href)
        }
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 'clamp(20px, 8vh, 80px) 16px 20px',
      }}
    >
      {/* Dimmed Blurred Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(4, 8, 14, 0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      />

      {/* Palette Container */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          background: '#070D18',
          border: '1px solid rgba(212, 160, 23, 0.4)',
          borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 32px rgba(212, 160, 23, 0.15)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          maxHeight: '80vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <GaaIcon name="search" size={20} tone="gold" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search features, modules, settings, or client names... (e.g. '3D', 'Periodization', 'Alex')"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontFamily: 'inherit',
              fontSize: 16,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--gray)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
              aria-label="Clear search"
            >
              <GaaIcon name="close" size={14} tone="slate" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div
          style={{
            overflowY: 'auto',
            padding: '10px 12px',
            display: 'grid',
            gap: 4,
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <GaaIcon name="compass" size={32} tone="slate" />
              </div>
              <p style={{ margin: 0, fontSize: 14, color: '#FFFFFF' }}>No matching features or athletes found</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>Try searching for &quot;3D&quot;, &quot;Periodization&quot;, &quot;Deload&quot;, &quot;Supplements&quot;, or &quot;Workout&quot;</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onClose()
                    if (item.href === '#coach-gordon' || item.id === 'action-ask-coach-gordon') {
                      openCoachGordon()
                    } else {
                      router.push(item.href)
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className="tactile-btn"
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    background: isSelected ? 'rgba(212, 160, 23, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid var(--gold)' : '1px solid transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.1s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: isSelected ? 'rgba(197, 160, 89, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <GaaIcon name={item.icon} tone={isSelected ? 'gold' : 'slate'} size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontFamily: 'Raleway, sans-serif',
                            fontWeight: 700,
                            fontSize: 14,
                            color: isSelected ? 'var(--gold-lt)' : '#FFFFFF',
                          }}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              padding: '2px 6px',
                              background: 'rgba(212, 160, 23, 0.2)',
                              color: 'var(--gold-lt)',
                              border: '1px solid rgba(212, 160, 23, 0.4)',
                              borderRadius: 4,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 12,
                          color: '#94A3B8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, color: isSelected ? 'var(--gold-lt)' : 'var(--gray)', flexShrink: 0 }}>
                    Jump ↵
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: 'var(--gray)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <span><strong style={{ color: '#CBD5E1' }}>↑ ↓</strong> Navigate</span>
            <span><strong style={{ color: '#CBD5E1' }}>↵</strong> Select</span>
            <span><strong style={{ color: '#CBD5E1' }}>ESC</strong> Close</span>
          </div>
          <span>Forge Athletic Global Navigator</span>
        </div>
      </div>
    </div>
  )
}
