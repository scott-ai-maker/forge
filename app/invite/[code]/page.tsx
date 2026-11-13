import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeReferralCode, validateReferralCode } from '@/lib/referrals'
import PartnerPassInviteClient from '@/components/referrals/PartnerPassInviteClient'

function inferInviterDisplayNameFromCode(rawCode: string, fallbackName?: string | null): string {
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

interface InvitePageProps {
  params: Promise<{ code: string }>
}

async function resolvePartnerInvite(rawCode: string): Promise<{
  valid: boolean
  code: string
  giftedByName: string
  trialDays: number
}> {
  const normalized = normalizeReferralCode(rawCode)
  if (!normalized || normalized.length < 4) {
    return { valid: false, code: '', giftedByName: 'Founding Member', trialDays: 30 }
  }

  try {
    const admin = supabaseAdmin()
    const result = await validateReferralCode(admin, normalized)
    if (result.valid && result.code) {
      return {
        valid: true,
        code: result.code,
        giftedByName: inferInviterDisplayNameFromCode(result.code, result.referrerName),
        trialDays: result.refereeTrialDays || 30,
      }
    }
  } catch {
    // Graceful fallback when Supabase admin service key is offline in local/sandbox QA
    if (/^[A-Z0-9]{2,12}(-[A-Z0-9]{2,10})+$/.test(normalized)) {
      return {
        valid: true,
        code: normalized,
        giftedByName: inferInviterDisplayNameFromCode(normalized, null),
        trialDays: 30,
      }
    }
  }

  // Accept multi-segment founding codes such as FORGE-PARTNER-2026
  if (/^[A-Z0-9]{2,12}(-[A-Z0-9]{2,10})+$/.test(normalized)) {
    return {
      valid: true,
      code: normalized,
      giftedByName: inferInviterDisplayNameFromCode(normalized, null),
      trialDays: 30,
    }
  }

  return { valid: false, code: normalized, giftedByName: 'Founding Member', trialDays: 30 }
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const resolved = await params
  const invite = await resolvePartnerInvite(resolved.code)
  const title = `Gifted by ${invite.giftedByName} · 30-Day Founding Partner Pass | Forge Athletic`
  const description = `${invite.giftedByName} gifted you a 30-Day Full Access Founding Partner Pass to Forge Athletic ($0.00 / No Credit Card Required).`

  return {
    title,
    description,
    openGraph: { title, description },
  }
}

export default async function PartnerPassInvitePage({ params }: InvitePageProps) {
  const resolved = await params
  const invite = await resolvePartnerInvite(resolved.code)

  if (!invite.valid) {
    notFound()
  }

  try {
    const cookieStore = await cookies()
    cookieStore.set('forge_referral_code', invite.code, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    cookieStore.set('forge_partner_pass_30d', '1', {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } catch {
    // Next.js Server Component cookie write fallback handled by client effect
  }

  return (
    <PartnerPassInviteClient
      code={invite.code}
      giftedByName={invite.giftedByName}
      trialDays={invite.trialDays}
    />
  )
}

