'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { APP_VERSION } from '@/lib/app-version'

/**
 * Dispatches a global event to open the What's New release modal.
 */
export function openWhatsNew() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('open-whats-new'))
}

const WhatsNewModal = dynamic(
  () => import('@/components/ui/WhatsNewModal'),
  { ssr: false }
)

export default function GlobalWhatsNewHost() {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    // 1. Listen for global open events
    const handleOpenEvent = () => handleOpen()
    window.addEventListener('open-whats-new', handleOpenEvent)

    // 2. Check if user hasn't seen the current release yet
    try {
      const lastSeen = localStorage.getItem('gaa_last_seen_version')
      if (lastSeen && lastSeen !== APP_VERSION) {
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 1200)
        return () => clearTimeout(timer)
      }
    } catch {}

    return () => {
      window.removeEventListener('open-whats-new', handleOpenEvent)
    }
  }, [handleOpen])

  return (
    <>
      {isOpen && (
        <WhatsNewModal
          isOpen={isOpen}
          onClose={handleClose}
        />
      )}
    </>
  )
}

