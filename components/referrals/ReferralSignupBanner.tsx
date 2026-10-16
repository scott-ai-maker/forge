'use client'

import React, { useEffect, useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'

interface ReferralSignupBannerProps {
  initialCode?: string | null
}

export default function ReferralSignupBanner({ initialCode }: ReferralSignupBannerProps) {
  const [referralInfo, setReferralInfo] = useState<{
    valid: boolean
    code: string
    referrerName?: string
    refereeDiscountCents: number
    refereeTrialDays: number
  } | null>(null)

  useEffect(() => {
    // Check initial prop, URL param, or cookie
    const urlParams = new URLSearchParams(window.location.search)
    const codeCandidate = initialCode || urlParams.get('ref') || urlParams.get('referral')

    if (!codeCandidate) {
      // Check document.cookie
      const match = document.cookie.match(/(^|;)\s*forge_referral_code=([^;]+)/)
      if (match && match[2]) {
        fetchReferralInfo(decodeURIComponent(match[2]))
      }
      return
    }

    fetchReferralInfo(codeCandidate)
  }, [initialCode])

  const fetchReferralInfo = async (code: string) => {
    try {
      const res = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setReferralInfo(data)
      }
    } catch {
      // Silent fallback
    }
  }

  if (!referralInfo || !referralInfo.valid) return null

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.18) 0%, rgba(16, 185, 129, 0.12) 100%)',
        border: '1px solid rgba(197, 160, 89, 0.45)',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: 'rgba(197, 160, 89, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F3E5AB',
          flexShrink: 0,
        }}
      >
        <GaaIcon name="sparkles" size={16} />
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#F3E5AB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          VIP Invitation Applied · {referralInfo.code}
        </div>
        <div style={{ fontSize: 12.5, color: '#F8FAFC', lineHeight: 1.4 }}>
          {referralInfo.referrerName} gifted you a <strong>{referralInfo.refereeTrialDays}-Day Extended VIP Pass</strong> + <strong>${(referralInfo.refereeDiscountCents / 100).toFixed(0)} Welcome Credit</strong>.
        </div>
      </div>
    </div>
  )
}
