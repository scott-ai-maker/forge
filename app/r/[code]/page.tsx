import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { validateReferralCode } from '@/lib/referrals'
import { cookies } from 'next/headers'
import ReferralLandingClient from '@/components/referrals/ReferralLandingClient'

interface ReferralPageProps {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: ReferralPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const admin = supabaseAdmin()
  const referral = await validateReferralCode(admin, resolvedParams.code)

  const inviter = referral.valid && referral.referrerName ? referral.referrerName : 'A Forge Athlete'
  const title = `${inviter} gifted you a 30-Day VIP Pass | Forge Athletic`
  const description = `Claim your exclusive 30-Day Extended VIP Pass + $20 Welcome Credit to Forge Athletic. Evidence-led periodization, NASM OPT™ tracking, and elite sports science.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/images/brand/logo-concept-1-kinetic-f.jpg',
          width: 800,
          height: 800,
          alt: 'Forge Athletic VIP Invitation',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ReferralLandingPage({ params }: ReferralPageProps) {
  const resolvedParams = await params
  const admin = supabaseAdmin()
  const referral = await validateReferralCode(admin, resolvedParams.code)

  if (!referral.valid || !referral.code) {
    notFound()
  }

  // Pre-seed the attribution cookie on server render
  const cookieStore = await cookies()
  cookieStore.set('forge_referral_code', referral.code, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return (
    <ReferralLandingClient
      code={referral.code}
      referrerName={referral.referrerName || 'A Forge Athlete'}
      refereeDiscountCents={referral.refereeDiscountCents}
      refereeTrialDays={referral.refereeTrialDays}
    />
  )
}
