'use client'

import React, { useState, useEffect } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { generateQrCodeSvg } from '@/lib/qr-code'
import type { ReferralDashboardData } from '@/lib/referrals'
import { triggerHaptic } from '@/lib/offline-sync-queue'

interface ReferralHubModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ReferralHubModal({ isOpen, onClose }: ReferralHubModalProps) {
  const [data, setData] = useState<ReferralDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  // Direct email invite state
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteNote, setInviteNote] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch('/api/referrals/me')
      .then(res => res.json())
      .then((resData: ReferralDashboardData) => {
        setData(resData)
        if (resData.shareUrl) {
          generateQrCodeSvg(resData.shareUrl, { width: 200 }).then(setQrSvg).catch(() => {})
        }
      })
      .catch(err => {
        console.error('[ReferralHub] Failed fetching stats:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isOpen])

  if (!isOpen) return null

  const handleCopyLink = async () => {
    if (!data?.shareUrl) return
    try {
      await navigator.clipboard.writeText(data.shareUrl)
      triggerHaptic('success')
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  const handleNativeShare = async () => {
    if (!data?.shareUrl) return
    triggerHaptic('tap')
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Forge Athletic VIP Invitation',
          text: 'Here is an exclusive 30-Day VIP Pass + $20 Credit to train on Forge Athletic with me:',
          url: data.shareUrl,
        })
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink()
    }
  }

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)

    const rawList = inviteEmails
      .split(/[,;\n]+/)
      .map(e => e.trim())
      .filter(Boolean)

    if (rawList.length === 0) {
      setInviteError('Please enter at least one email address.')
      return
    }

    if (rawList.length > 5) {
      setInviteError('You can invite up to 5 workout partners at a time.')
      return
    }

    setInviteSending(true)
    try {
      const res = await fetch('/api/referrals/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: rawList,
          personalNote: inviteNote,
        }),
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to send invitations')
      }

      triggerHaptic('success')
      setInviteSuccess(`✓ Successfully sent ${resData.sentCount} VIP invitation(s)!`)
      setInviteEmails('')
      setInviteNote('')

      // Refresh dashboard data
      const refreshed = await fetch('/api/referrals/me').then(r => r.json())
      setData(refreshed)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invites')
    } finally {
      setInviteSending(false)
    }
  }

  const shareText = encodeURIComponent(
    'Join me on Forge Athletic. Claim your 30-Day Extended VIP Pass + $20 Welcome Credit: '
  )
  const shareUrlEnc = encodeURIComponent(data?.shareUrl || '')

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 7, 14, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overscrollBehavior: 'contain',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0B131E',
          border: '1px solid rgba(197, 160, 89, 0.4)',
          borderRadius: 14,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          color: '#F8FAFC',
          overscrollBehavior: 'contain',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(197, 160, 89, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(197, 160, 89, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#C5A059',
              }}
            >
              <GaaIcon name="crown" size={17} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.04em' }}>
                AMBASSADOR REFERRAL ENGINE
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
                Give 30 Days Free + $20 Credit · Earn $20 Credit &amp; Milestones
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
              Loading ambassador telemetry...
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#EF4444' }}>
              Unable to load referral profile. Please try again.
            </div>
          ) : (
            <>
              {/* Quick Metrics Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                    Clicks
                  </span>
                  <strong style={{ fontSize: 18, color: '#F8FAFC' }}>{data.clicks}</strong>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                    Joined
                  </span>
                  <strong style={{ fontSize: 18, color: '#F8FAFC' }}>{data.signupsCount}</strong>
                </div>

                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                    Subscribed
                  </span>
                  <strong style={{ fontSize: 18, color: '#10B981' }}>{data.conversionsCount}</strong>
                </div>

                <div
                  style={{
                    background: 'rgba(197, 160, 89, 0.12)',
                    border: '1px solid rgba(197, 160, 89, 0.35)',
                    borderRadius: 8,
                    padding: '12px 10px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                    Credit Earned
                  </span>
                  <strong style={{ fontSize: 18, color: '#F3E5AB' }}>
                    ${(data.totalRewardsEarnedCents / 100).toFixed(0)}
                  </strong>
                </div>
              </div>

              {/* Milestone Progress Bar */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(197, 160, 89, 0.25)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: '#C5A059', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                      Current Rank: {data.milestones.currentTier.name}
                    </span>
                    <h3 style={{ margin: '2px 0 0', fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>
                      {data.milestones.nextTier
                        ? `Next Milestone: ${data.milestones.nextTier.name} (${data.conversionsCount}/${data.milestones.nextTier.requiredConversions} Partners)`
                        : '🎉 All Milestones Achieved! Founding Ambassador'}
                    </h3>
                  </div>
                  {data.milestones.nextTier && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#C5A059' }}>
                      {data.milestones.progressToNext}%
                    </span>
                  )}
                </div>

                {/* Progress track */}
                <div
                  style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${data.milestones.progressToNext}%`,
                      background: 'linear-gradient(90deg, #C5A059 0%, #10B981 100%)',
                      borderRadius: 4,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                {/* Milestone Tiers Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {data.milestones.allTiers.map(tier => (
                    <div
                      key={tier.level}
                      style={{
                        padding: '8px 6px',
                        background: tier.unlocked ? 'rgba(197, 160, 89, 0.15)' : 'rgba(0,0,0,0.3)',
                        border: tier.unlocked
                          ? '1px solid rgba(197, 160, 89, 0.45)'
                          : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 6,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: tier.unlocked ? '#10B981' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 3,
                          marginBottom: 2,
                        }}
                      >
                        {tier.unlocked ? '✓ UNLOCKED' : `${tier.requiredConversions} Partners`}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: tier.unlocked ? '#F8FAFC' : '#94A3B8' }}>
                        {tier.name}
                      </div>
                      <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 2, lineHeight: 1.2 }}>
                        {tier.rewardSummary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share Drawer */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  marginBottom: 24,
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#94A3B8',
                    marginBottom: 8,
                    fontWeight: 700,
                  }}
                >
                  Your Personal Invitation Link
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    type="text"
                    readOnly
                    value={data.shareUrl}
                    style={{
                      flex: 1,
                      background: '#04070E',
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                      borderRadius: 6,
                      padding: '10px 12px',
                      color: '#F8FAFC',
                      fontSize: 13,
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    style={{
                      background: copied ? '#10B981' : 'linear-gradient(135deg, #C5A059 0%, #DFBA73 100%)',
                      color: '#080E14',
                      border: 'none',
                      borderRadius: 6,
                      padding: '10px 16px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy Link'}
                  </button>
                </div>

                {/* Instant Share Buttons */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="share" size={13} />
                    Share Sheet
                  </button>

                  <a
                    href={`https://wa.me/?text=${shareText}${shareUrlEnc}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      minWidth: 100,
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      color: '#25D366',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    WhatsApp
                  </a>

                  <a
                    href={`sms:?&body=${shareText}${shareUrlEnc}`}
                    style={{
                      flex: 1,
                      minWidth: 80,
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38BDF8',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    iMessage/SMS
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    style={{
                      background: showQr ? 'rgba(197, 160, 89, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                      color: '#C5A059',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <GaaIcon name="ticket" size={13} />
                    {showQr ? 'Hide QR' : 'Gym QR'}
                  </button>
                </div>

                {/* Inline Gym QR display */}
                {showQr && qrSvg && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      background: '#04070E',
                      borderRadius: 8,
                      border: '1px solid rgba(197, 160, 89, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: '#94A3B8' }}>
                      Show this code to your workout partner at the gym:
                    </p>
                    <div
                      style={{ display: 'inline-block' }}
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  </div>
                )}
              </div>

              {/* Direct Email Inviter */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '16px 18px',
                  marginBottom: 24,
                }}
              >
                <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                  Send Direct VIP Email Invites
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94A3B8' }}>
                  Enter up to 5 email addresses. We will send a personalized VIP pass on your behalf.
                </p>

                <form onSubmit={handleSendInvites}>
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder="e.g. partner@example.com, gymbuddy@example.com"
                      value={inviteEmails}
                      onChange={e => setInviteEmails(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#04070E',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        color: '#F8FAFC',
                        fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Optional personal note (e.g. 'Let's crush this next cycle together!')"
                      value={inviteNote}
                      onChange={e => setInviteNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#04070E',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 6,
                        color: '#CBD5E1',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {inviteError && (
                    <div style={{ color: '#F87171', fontSize: 12, marginBottom: 10 }}>
                      {inviteError}
                    </div>
                  )}

                  {inviteSuccess && (
                    <div style={{ color: '#10B981', fontSize: 12, marginBottom: 10 }}>
                      {inviteSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={inviteSending}
                    style={{
                      background: 'rgba(197, 160, 89, 0.2)',
                      border: '1px solid rgba(197, 160, 89, 0.4)',
                      color: '#F3E5AB',
                      padding: '8px 16px',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: inviteSending ? 'wait' : 'pointer',
                    }}
                  >
                    {inviteSending ? 'Sending Invitations...' : 'Send VIP Invitations →'}
                  </button>
                </form>
              </div>

              {/* Referral Activity Ledger */}
              {data.history.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Invited Partners &amp; Activity
                  </h4>
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                  >
                    {data.history.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: idx === data.history.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                          fontSize: 12,
                        }}
                      >
                        <div>
                          <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{item.refereeEmailMasked}</span>
                          <span style={{ color: '#64748B', marginLeft: 8 }}>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          {item.status === 'rewarded' || item.status === 'converted' ? (
                            <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Subscribed (+$20)</span>
                          ) : item.status === 'signed_up' ? (
                            <span style={{ color: '#38BDF8', fontWeight: 600 }}>VIP Trial Active</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Invited</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
