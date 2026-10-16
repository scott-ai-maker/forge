'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import ReferralHubModal from '@/components/referrals/ReferralHubModal'
import { triggerHaptic } from '@/lib/offline-sync-queue'
import type { ReferralDashboardData } from '@/lib/referrals'

export default function ReferralDashboardWidget() {
  const [modalOpen, setModalOpen] = useState(false)
  const [data, setData] = useState<ReferralDashboardData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/referrals/me')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})

    // Check if query param requested open
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('openReferrals') === 'true') {
        setModalOpen(true)
      }
    }
  }, [])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!data?.shareUrl) {
      setModalOpen(true)
      return
    }

    try {
      await navigator.clipboard.writeText(data.shareUrl)
      triggerHaptic('success')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setModalOpen(true)
    }
  }

  const conversions = data?.conversionsCount || 0
  const totalEarned = data?.totalRewardsEarnedCents ? (data.totalRewardsEarnedCents / 100).toFixed(0) : '0'

  return (
    <>
      <div
        onClick={() => {
          triggerHaptic('tap')
          setModalOpen(true)
        }}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(8, 14, 20, 0.95) 100%)',
          border: '1px solid rgba(197, 160, 89, 0.35)',
          borderRadius: 12,
          padding: '16px 20px',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, transform 0.15s ease',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(197, 160, 89, 0.15)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C5A059',
              flexShrink: 0,
            }}
          >
            <GaaIcon name="crown" size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#C5A059',
                  background: 'rgba(197, 160, 89, 0.12)',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                Ambassador Pass
              </span>
              {Number(totalEarned) > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                  +${totalEarned} Earned
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>
              Give 30 Days Free + $20 · Get $20 Credit
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
              {data?.milestones?.nextTier
                ? `${conversions}/${data.milestones.nextTier.requiredConversions} to unlock ${data.milestones.nextTier.name} (${data.milestones.nextTier.rewardSummary})`
                : 'Invite workout buddies to train on Forge Athletic with you.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: copied ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
              color: copied ? '#10B981' : '#F8FAFC',
              borderRadius: 6,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #C5A059 0%, #DFBA73 100%)',
              color: '#080E14',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(197, 160, 89, 0.25)',
            }}
          >
            Invite Partners →
          </button>
        </div>
      </div>

      <ReferralHubModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
