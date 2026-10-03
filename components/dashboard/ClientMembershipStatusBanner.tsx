'use client'

import React from 'react'
import Link from 'next/link'
import type { ClientStatus } from '@/lib/client-lifecycle'
import GaaIcon from '@/components/ui/GaaIcon'

interface ClientMembershipStatusBannerProps {
  status: ClientStatus
  statusReason?: string | null
}

export default function ClientMembershipStatusBanner({
  status,
  statusReason,
}: ClientMembershipStatusBannerProps) {
  if (status === 'active') return null

  const isPaused = status === 'paused'

  return (
    <div
      style={{
        background: isPaused
          ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(180,83,9,0.15) 100%)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(185,28,28,0.15) 100%)',
        border: isPaused ? '1px solid #F59E0B' : '1px solid #EF4444',
        borderRadius: 10,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <GaaIcon name={isPaused ? 'status-paused' : 'status-inactive'} size={28} />
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: isPaused ? '#FCD34D' : '#FCA5A5',
              marginBottom: 2,
            }}
          >
            {isPaused ? 'Membership On Temporary Hold' : 'Membership Inactive'}
          </div>
          <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>
            {isPaused
              ? `Your training program is on hold (${statusReason || 'Temporary pause'}). Active workout logging and booking are suspended.`
              : `Your account is currently inactive (${statusReason || 'Offboarded'}). Past logs remain preserved.`}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link
          href="/dashboard/messages"
          className="tactile-btn"
          style={{
            padding: '8px 16px',
            background: isPaused ? '#F59E0B' : '#EF4444',
            color: isPaused ? '#080E14' : '#FFFFFF',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>Message Coach Gordon</span>
            <GaaIcon name="arrow-right" size={12} style={{ color: isPaused ? '#080E14' : '#FFFFFF', stroke: isPaused ? '#080E14' : '#FFFFFF' }} />
          </span>
        </Link>
      </div>
    </div>
  )
}

