'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { triggerHaptic } from '@/lib/offline-sync-queue'

export interface CoachGordonContext {
  athleteName?: string
  goal?: string
  nasmOptPhase?: number
  currentWorkoutFocus?: string
  currentExerciseName?: string
  equipmentAccess?: string[]
  cardioEquipmentAccess?: string[]
  kineticCompensations?: string[]
  recentReadinessScore?: number
  recentSleepHours?: number
  recentRpe?: number
  isCoachUser?: boolean
}

/**
 * Determines whether the floating "Ask Coach Gordon" FAB should be rendered in the bottom right.
 * Only makes sense on the primary athlete command center (/dashboard) and fitness lab (/dashboard/fitness).
 * Excluded on messages, live video studio, booking, settings, onboarding, and dossier.
 */
export function shouldShowCoachGordonFab(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '')
  return cleanPath === '/dashboard' || cleanPath.startsWith('/dashboard/fitness')
}

/**
 * Dispatches a global event to open Coach Gordon from anywhere in the app
 * with optional real-time athlete telemetry or workout context.
 */
export function openCoachGordon(context?: CoachGordonContext) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('open-coach-gordon', { detail: context || {} }))
}

/**
 * Dispatches a global event to close Coach Gordon.
 */
export function closeCoachGordon() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('close-coach-gordon'))
}

const AskCoachGordonModal = dynamic(
  () => import('@/components/fitness/AskCoachGordonModal'),
  { ssr: false }
)

export default function GlobalCoachGordonHost() {
  const pathname = usePathname()
  const isFabVisible = shouldShowCoachGordonFab(pathname)
  const [isOpen, setIsOpen] = useState(false)
  const [context, setContext] = useState<CoachGordonContext>({})

  const handleOpen = useCallback((customContext?: CoachGordonContext) => {
    if (customContext && Object.keys(customContext).length > 0) {
      setContext(prev => ({ ...prev, ...customContext }))
    }
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<CoachGordonContext>
      handleOpen(customEvent.detail)
    }
    const handleCloseEvent = () => {
      handleClose()
    }

    window.addEventListener('open-coach-gordon', handleOpenEvent)
    window.addEventListener('close-coach-gordon', handleCloseEvent)

    return () => {
      window.removeEventListener('open-coach-gordon', handleOpenEvent)
      window.removeEventListener('close-coach-gordon', handleCloseEvent)
    }
  }, [handleOpen, handleClose])

  return (
    <>
      {/* Global Floating Concierge Trigger FAB (Rendered ONLY where it makes pedagogical sense) */}
      {isFabVisible && !isOpen && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap')
            handleOpen()
          }}
          className="tactile-btn global-coach-gordon-fab"
          aria-label="Open Coach Gordon AI Concierge"
          title="Ask Coach Scott Gordon (AI & Voice Concierge)"
        >
          <div style={{ position: 'relative', width: 22, height: 22, flexShrink: 0 }}>
            <Image
              src="/images/coach-gordon-shield-logo.jpg"
              alt="Coach Gordon Shield"
              fill
              sizes="22px"
              style={{ borderRadius: 4, objectFit: 'cover', border: '1px solid rgba(212, 160, 23, 0.4)' }}
            />
          </div>
          <span className="coach-gordon-label">Ask Coach Gordon</span>
          <span className="coach-gordon-pulse" />
        </button>
      )}

      {/* Ask Coach Gordon Interactive AI & Voice Modal */}
      {isOpen && (
        <AskCoachGordonModal
          isOpen={isOpen}
          onClose={handleClose}
          athleteName={context.athleteName || 'Athlete'}
          goal={context.goal || 'general_fitness'}
          nasmOptPhase={context.nasmOptPhase || 1}
          currentWorkoutFocus={context.currentWorkoutFocus || 'Executive Performance'}
          currentExerciseName={context.currentExerciseName}
          equipmentAccess={context.equipmentAccess}
          cardioEquipmentAccess={context.cardioEquipmentAccess}
          kineticCompensations={context.kineticCompensations}
          recentReadinessScore={context.recentReadinessScore || 82}
          recentSleepHours={context.recentSleepHours}
          recentRpe={context.recentRpe}
          isCoachUser={context.isCoachUser}
        />
      )}

      <style jsx>{`
        .global-coach-gordon-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 900;
          background: linear-gradient(135deg, #182236 0%, #0d121c 100%);
          border: 1px solid rgba(212, 160, 23, 0.6);
          border-radius: 28px;
          padding: 10px 18px;
          color: var(--gold-lt, #fef08a);
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 160, 23, 0.3);
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .global-coach-gordon-fab:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: rgba(212, 160, 23, 0.9);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.9), 0 0 28px rgba(212, 160, 23, 0.45);
        }

        .global-coach-gordon-fab:active {
          transform: translateY(0) scale(0.98);
        }

        .coach-gordon-label {
          font-family: var(--font-raleway), 'Raleway', sans-serif;
          letter-spacing: 0.02em;
        }

        .coach-gordon-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: coachPulse 2.5s infinite;
        }

        @keyframes coachPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        @media (max-width: 768px) {
          .global-coach-gordon-fab {
            bottom: calc(68px + env(safe-area-inset-bottom, 8px));
            right: 14px;
            padding: 8px 14px;
            font-size: 12px;
            border-radius: 24px;
          }
        }
      `}</style>
    </>
  )
}

