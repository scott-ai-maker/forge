'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isCompanionApp } from '@/lib/native-companion'
import { createClient } from '@/lib/supabase-browser'

export default function HelperAppRootGuard() {
  const router = useRouter()
  const [isHelper, setIsHelper] = useState(false)

  useEffect(() => {
    if (isCompanionApp()) {
      setIsHelper(true)
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          router.replace('/dashboard/fitness?source=helper')
        } else {
          router.replace('/auth/login?mode=companion&next=%2Fdashboard%2Ffitness')
        }
      }).catch(() => {
        router.replace('/auth/login?mode=companion&next=%2Fdashboard%2Ffitness')
      })
    }
  }, [router])

  if (!isHelper) return null

  // Sleek transition screen preventing marketing landing page flash in helper apps
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#080E14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 18,
          backgroundImage: "url('/images/gaa-brand-crest.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '2px solid var(--gold, #C5A059)',
          boxShadow: '0 0 25px rgba(197, 160, 89, 0.4)',
          marginBottom: 18,
        }}
      />
      <h2
        style={{
          fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
          fontSize: 18,
          letterSpacing: '0.08em',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          margin: '0 0 8px',
        }}
      >
        Gordon Athletic Companion
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-sans, Raleway), sans-serif',
          fontSize: 12,
          letterSpacing: '0.12em',
          color: 'var(--gold-lt, #E5C378)',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Initializing In-Gym Execution Hub...
      </p>
    </div>
  )
}

