'use client'

import React from 'react'
import Image from 'next/image'
import GaaIcon from '@/components/ui/GaaIcon'
import { openCoachGordon } from '@/components/fitness/GlobalCoachGordonHost'
import { triggerHaptic } from '@/lib/offline-sync-queue'

export function CoachGordonHeaderButton() {
  return (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('tap')
        openCoachGordon()
      }}
      className="tactile-btn"
      style={{
        padding: '10px 18px',
        fontSize: 13,
        fontWeight: 800,
        fontFamily: 'Raleway, sans-serif',
        border: '1px solid rgba(212, 160, 23, 0.8)',
        background: 'linear-gradient(135deg, rgba(212,160,23,0.25) 0%, rgba(14,23,36,0.95) 100%)',
        color: '#FFFFFF',
        borderRadius: 6,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(212,160,23,0.25)',
        transition: 'transform 0.15s ease, filter 0.15s ease',
      }}
      title="Ask Coach Gordon"
    >
      <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
        <Image
          src="/images/coach-gordon-shield-logo.jpg"
          alt="Coach Gordon Shield"
          fill
          sizes="18px"
          style={{ borderRadius: 3, objectFit: 'cover' }}
        />
      </div>
      <span>Ask Coach Gordon</span>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
    </button>
  )
}

export function CoachGordonDualConciergeCard() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(14,23,36,0.95) 0%, rgba(8,14,24,0.98) 100%)',
        border: '1px solid rgba(212,160,23,0.4)',
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(212,160,23,0.6)',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(212,160,23,0.2)',
          }}
        >
          <Image
            src="/images/coach-gordon-shield-logo.jpg"
            alt="Coach Scott Gordon"
            fill
            sizes="44px"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold-lt)' }}>
              Training support · Online 24/7
            </span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginTop: 1 }}>
            Need immediate advice on exercise swaps, nutrition, or soreness?
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 1 }}>
            Get practical training, movement, and nutrition guidance with voice responses.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('tap')
          openCoachGordon()
        }}
        className="tactile-btn"
        style={{
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 800,
          fontFamily: 'Raleway, sans-serif',
          background: 'linear-gradient(135deg, var(--gold) 0%, #AA820A 100%)',
          color: '#080E14',
          borderRadius: 6,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 4px 14px rgba(212,160,23,0.3)',
          flexShrink: 0,
        }}
      >
        <GaaIcon name="message" tone="inherit" size={14} />
        <span>Ask Coach Gordon →</span>
      </button>
    </div>
  )
}
