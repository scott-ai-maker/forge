import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'
import { Camera, CirclePlay, Users, BriefcaseBusiness, ShieldCheck } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import ReferralSignupBanner from '@/components/referrals/ReferralSignupBanner'
import { FOUNDING_PRICING_CARDS } from '@/lib/landingSocialProof'
import type { ForgeTierId } from '@/lib/tierEntitlements'
import { isPublicRegistrationOpen } from '@/lib/launch-config'

export const metadata: Metadata = {
  title: 'Create Your Forge Athletic Account',
  description: 'Join Forge Athletic for evidence-led coaching, periodization, and performance telemetry.',
}

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/forgeathleticapp', Icon: Camera },
  { name: 'YouTube', href: 'https://youtube.com/@forgeathleticapp', Icon: CirclePlay },
  { name: 'Facebook', href: 'https://facebook.com/forgeathleticapp', Icon: Users },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/forgeathleticapp', Icon: BriefcaseBusiness },
]

export const dynamic = 'force-dynamic'

type SignupPageSearchParams = Promise<{
  coach?: string | string[] | undefined
  ref?: string | string[] | undefined
  referral?: string | string[] | undefined
  pass?: string | string[] | undefined
  plan?: string | string[] | undefined
  error?: string | string[] | undefined
  error_description?: string | string[] | undefined
}>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeSelectedPlan(rawPlan: string | undefined): ForgeTierId | undefined {
  if (!rawPlan) return undefined
  const cleaned = rawPlan.trim().toLowerCase()
  if (cleaned === 'core' || cleaned === 'core_lab') return 'core_lab'
  if (cleaned === 'plus') return 'plus'
  if (cleaned === 'coach_support') return 'coach_support'
  return undefined
}

export default async function SignupPage({ searchParams }: { searchParams: SignupPageSearchParams }) {
  const resolvedSearchParams = await searchParams
  const requestedCoachId = Array.isArray(resolvedSearchParams.coach)
    ? resolvedSearchParams.coach[0]
    : resolvedSearchParams.coach

  const rawReferral = resolvedSearchParams.ref || resolvedSearchParams.referral
  const referralCode = Array.isArray(rawReferral) ? rawReferral[0] : rawReferral
  const rawPass = resolvedSearchParams.pass
  const passParam = Array.isArray(rawPass) ? rawPass[0] : rawPass
  const isPartnerPass = passParam === '30day'

  const rawPlan = Array.isArray(resolvedSearchParams.plan)
    ? resolvedSearchParams.plan[0]
    : resolvedSearchParams.plan
  const selectedPlanId = normalizeSelectedPlan(rawPlan)
  const selectedPlanCard = selectedPlanId
    ? FOUNDING_PRICING_CARDS.find(card => card.id === selectedPlanId)
    : undefined

  const rawError = resolvedSearchParams.error_description || resolvedSearchParams.error
  const initialError = Array.isArray(rawError) ? rawError[0] : rawError

  let inviteCoachId: string | undefined
  let inviteCoachName: string | undefined

  if (requestedCoachId && UUID_PATTERN.test(requestedCoachId)) {
    const { data: coach } = await supabaseAdmin()
      .from('clients')
      .select('id, full_name')
      .eq('id', requestedCoachId)
      .eq('role', 'coach')
      .maybeSingle()

    if (coach) {
      inviteCoachId = coach.id
      inviteCoachName = coach.full_name?.trim() || 'your coach'
    }
  }

  // Pre-launch defense-in-depth: block uninvited public self-serve signups until Jan 4, 2027
  if (!isPublicRegistrationOpen() && !inviteCoachId) {
    redirect('/?waitlist=prelaunch')
  }

  return (
    <main
      className="sgf-auth-bg"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Image
          className="forge-auth-logo"
          src="/images/brand/forge-crest-mark.png"
          alt="Forge Athletic"
          width={112}
          height={112}
          priority
        />
        <h1
          className="font-serif gold-gradient-text"
          style={{
            fontSize: 26,
            letterSpacing: '0.08em',
            textAlign: 'center',
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          FORGE ATHLETIC
        </h1>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 14,
            color: 'var(--gray)',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          Create your account to get started
        </p>
        {inviteCoachId ? (
          <p
            style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: 13,
              color: 'var(--gold-lt)',
              textAlign: 'center',
              marginTop: 0,
              marginBottom: 18,
            }}
          >
            You are signing up with {inviteCoachName}. Your account will be connected to that coach automatically.
          </p>
        ) : null}
        <div
          style={{
            background: 'rgba(18, 35, 54, 0.9)',
            padding: 32,
            border: '1px solid var(--navy-lt)',
            backdropFilter: 'blur(2px)',
          }}
        >
          {selectedPlanCard ? (
            <div
              data-testid="selected-founding-plan-banner"
              style={{
                marginBottom: 18,
                padding: '12px 14px',
                borderRadius: 6,
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={18} style={{ color: '#34D399', flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <div
                    style={{
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#6EE7B7',
                    }}
                  >
                    Founding Member Rate Lock
                  </div>
                  <div
                    style={{
                      fontFamily: 'Raleway, sans-serif',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      marginTop: 2,
                    }}
                  >
                    Selected Plan: {selectedPlanCard.name}
                  </div>
                </div>
              </div>
              <div className="tabular-nums" style={{ textAlign: 'right', flexShrink: 0 }}>
                {selectedPlanCard.postLaunchPrice !== selectedPlanCard.foundingPrice && (
                  <div style={{ fontSize: 11, color: '#94A3B8', textDecoration: 'line-through' }}>
                    {selectedPlanCard.postLaunchPrice}
                    {selectedPlanCard.billingUnit}
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
                  {selectedPlanCard.foundingPrice}
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#CBD5E1' }}>
                    {selectedPlanCard.billingUnit}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          <ReferralSignupBanner initialCode={referralCode} initialPartnerPass={isPartnerPass} />
          <AuthForm
            mode="signup"
            coachId={inviteCoachId}
            coachName={inviteCoachName}
            selectedPlan={selectedPlanId}
            initialError={initialError}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.55rem', marginTop: '1rem' }}>
          {SOCIAL_LINKS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={name}
              style={{
                width: 44,
                height: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--navy-lt)',
                color: 'var(--gray)',
                background: 'rgba(13,27,42,0.55)',
              }}
            >
              <Icon size={15} strokeWidth={2} />
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
