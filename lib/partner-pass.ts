'use client'

import { useCallback, useEffect, useState } from 'react'

const SAFE_ALPHANUM = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function normalizeReferralCode(code: string | null | undefined): string {
  if (!code) return ''
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
}

function generateReferralCode(clientName?: string | null): string {
  const firstName = (clientName || '').trim().split(/\s+/)[0] || 'FORGE'
  const cleanName = firstName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)

  const prefix = cleanName.length >= 2 ? cleanName : 'FORGE'
  let suffix = ''
  for (let i = 0; i < 4; i += 1) {
    suffix += SAFE_ALPHANUM[Math.floor(Math.random() * SAFE_ALPHANUM.length)]
  }
  return `${prefix}-${suffix}`
}

export type PartnerPassLifecycleStatus = 'available' | 'sent' | 'claimed'

export interface PartnerPassState {
  code: string
  status: PartnerPassLifecycleStatus
  claimedByName: string | null
  invitedRecipientEmail: string | null
  sentAtIso: string | null
  claimedAtIso: string | null
  revokedCount: number
}

const PARTNER_PASS_STORAGE_KEY = 'forge_founding_partner_pass_v1'
const PARTNER_PASS_EVENT = 'forge:partner-pass-change'

export const PARTNER_PASS_BASE_DOMAIN = 'https://forge-athletic.app'

export function buildPartnerPassInviteUrl(code: string, baseDomain = PARTNER_PASS_BASE_DOMAIN): string {
  const cleanCode = normalizeReferralCode(code) || 'FORGE-2026'
  return `${baseDomain.replace(/\/$/, '')}/invite/${cleanCode}`
}

export function formatPartnerPassTileStatus(state: Pick<PartnerPassState, 'status' | 'claimedByName'>): string {
  if (state.status === 'claimed') {
    const guest = state.claimedByName?.trim() || 'Guest Athlete'
    return `Claimed by ${guest}`
  }
  if (state.status === 'sent') {
    return 'Sent · Awaiting Claim'
  }
  return '1 Guest Pass Available'
}

export function getPartnerPassStepIndex(status: PartnerPassLifecycleStatus): 0 | 1 | 2 {
  if (status === 'claimed') return 2
  if (status === 'sent') return 1
  return 0
}

export function inferInviterDisplayNameFromCode(rawCode: string, fallbackName?: string | null): string {
  if (fallbackName && fallbackName.trim() && fallbackName.trim() !== 'A Forge Athlete') {
    return fallbackName.trim()
  }
  const normalized = normalizeReferralCode(rawCode)
  const prefix = normalized.split('-')[0] || ''
  if (prefix && prefix !== 'FORGE' && prefix.length >= 2 && /^[A-Z]+$/.test(prefix)) {
    return prefix.charAt(0) + prefix.slice(1).toLowerCase()
  }
  return fallbackName?.trim() || 'Founding Member'
}

export function buildPartnerPassShareChannels(code: string, senderName?: string | null) {
  const url = buildPartnerPassInviteUrl(code)
  const sender = senderName?.trim() || 'A Founding Member'
  const subject = `${sender} gifted you a 30-Day Founding Partner Pass to Forge Athletic`
  const message = `I saved my 30-Day Founding Partner Pass to Forge Athletic for you ($0.00, no credit card required). Claim your pass here: ${url}`

  return {
    url,
    subject,
    message,
    smsHref: `sms:?&body=${encodeURIComponent(message)}`,
    mailtoHref: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
  }
}

export function getInitialPartnerPassState(memberName?: string | null): PartnerPassState {
  const fallbackCode = generateReferralCode(memberName || 'FORGE')
  if (typeof window === 'undefined') {
    return {
      code: fallbackCode,
      status: 'available',
      claimedByName: null,
      invitedRecipientEmail: null,
      sentAtIso: null,
      claimedAtIso: null,
      revokedCount: 0,
    }
  }

  try {
    const raw = window.localStorage.getItem(PARTNER_PASS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PartnerPassState>
      if (parsed && typeof parsed.code === 'string' && parsed.code.length >= 4) {
        return {
          code: normalizeReferralCode(parsed.code),
          status: parsed.status === 'claimed' || parsed.status === 'sent' ? parsed.status : 'available',
          claimedByName: typeof parsed.claimedByName === 'string' ? parsed.claimedByName : null,
          invitedRecipientEmail: typeof parsed.invitedRecipientEmail === 'string' ? parsed.invitedRecipientEmail : null,
          sentAtIso: typeof parsed.sentAtIso === 'string' ? parsed.sentAtIso : null,
          claimedAtIso: typeof parsed.claimedAtIso === 'string' ? parsed.claimedAtIso : null,
          revokedCount: typeof parsed.revokedCount === 'number' ? parsed.revokedCount : 0,
        }
      }
    }
  } catch {
    // ignore storage errors
  }

  const fresh: PartnerPassState = {
    code: fallbackCode,
    status: 'available',
    claimedByName: null,
    invitedRecipientEmail: null,
    sentAtIso: null,
    claimedAtIso: null,
    revokedCount: 0,
  }
  savePartnerPassState(fresh)
  return fresh
}

export function savePartnerPassState(next: PartnerPassState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PARTNER_PASS_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent<PartnerPassState>(PARTNER_PASS_EVENT, { detail: next }))
  } catch {
    // ignore storage errors
  }
}

export function usePartnerPass(memberName?: string | null) {
  const [state, setState] = useState<PartnerPassState>(() => ({
    code: 'FORGE-2026',
    status: 'available',
    claimedByName: null,
    invitedRecipientEmail: null,
    sentAtIso: null,
    claimedAtIso: null,
    revokedCount: 0,
  }))

  useEffect(() => {
    const initial = getInitialPartnerPassState(memberName)
    setState(initial)

    // Sync from server referral profile when authenticated
    let active = true
    fetch('/api/referrals/me')
      .then(async res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (!active || !data || typeof data.code !== 'string') return
        const serverCode = normalizeReferralCode(data.code)
        if (!serverCode) return

        const current = getInitialPartnerPassState(memberName)
        let derivedStatus: PartnerPassLifecycleStatus = current.status
        let claimedByName = current.claimedByName

        if (Number(data.signupsCount || 0) > 0 || Number(data.conversionsCount || 0) > 0) {
          derivedStatus = 'claimed'
          const latestHistory = Array.isArray(data.history) ? data.history[0] : null
          claimedByName = claimedByName || latestHistory?.refereeEmailMasked || 'Workout Partner'
        } else if (Number(data.clicks || 0) > 0 && derivedStatus === 'available') {
          derivedStatus = 'sent'
        }

        const merged: PartnerPassState = {
          ...current,
          code: current.revokedCount > 0 ? current.code : serverCode,
          status: derivedStatus,
          claimedByName,
        }
        savePartnerPassState(merged)
        setState(merged)
      })
      .catch(() => {
        // Unauthenticated or offline fallback cleanly retains local state
      })

    const onSync = (event: Event) => {
      const custom = event as CustomEvent<PartnerPassState>
      if (custom.detail) {
        setState(custom.detail)
      } else {
        setState(getInitialPartnerPassState(memberName))
      }
    }

    window.addEventListener(PARTNER_PASS_EVENT, onSync)
    return () => {
      active = false
      window.removeEventListener(PARTNER_PASS_EVENT, onSync)
    }
  }, [memberName])

  const markSent = useCallback(
    (recipientEmail?: string) => {
      const current = getInitialPartnerPassState(memberName)
      if (current.status === 'claimed') return current
      const next: PartnerPassState = {
        ...current,
        status: 'sent',
        invitedRecipientEmail: recipientEmail?.trim() || current.invitedRecipientEmail,
        sentAtIso: new Date().toISOString(),
      }
      savePartnerPassState(next)
      setState(next)
      return next
    },
    [memberName]
  )

  const revokeAndRegenerate = useCallback(async () => {
    const current = getInitialPartnerPassState(memberName)
    let newCode = generateReferralCode(memberName || 'FORGE')
    if (newCode === current.code) {
      newCode = generateReferralCode(memberName || 'FORGE')
    }

    try {
      const res = await fetch('/api/referrals/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberName }),
      })
      if (res.ok) {
        const payload = await res.json()
        if (typeof payload?.code === 'string' && payload.code.length >= 4) {
          newCode = normalizeReferralCode(payload.code)
        }
      }
    } catch {
      // Graceful offline/sandbox fallback
    }

    const next: PartnerPassState = {
      code: newCode,
      status: 'available',
      claimedByName: null,
      invitedRecipientEmail: null,
      sentAtIso: null,
      claimedAtIso: null,
      revokedCount: current.revokedCount + 1,
    }
    savePartnerPassState(next)
    setState(next)
    return next
  }, [memberName])

  return {
    passState: state,
    tileStatusLabel: formatPartnerPassTileStatus(state),
    inviteUrl: buildPartnerPassInviteUrl(state.code),
    stepIndex: getPartnerPassStepIndex(state.status),
    markSent,
    revokeAndRegenerate,
  }
}

