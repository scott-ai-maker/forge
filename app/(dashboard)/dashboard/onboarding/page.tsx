import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import OnboardingForm from '@/components/fitness/OnboardingForm'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: _profile } = await supabase
    .from('fitness_profiles')
    .select('onboarding_completed_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)', padding: '40px 24px' }}>
      <SiteHeader
        links={[
          { href: '/dashboard', label: 'Today' },
          { href: '/dashboard/fitness', label: 'Training & progress' },
          { href: '/dashboard/settings?tab=fitness', label: 'Settings' },
          { href: '/dashboard/messages', label: 'Messages' },
        ]}
        badgeText={_profile?.onboarding_completed_at ? 'Baseline Profile' : 'Onboarding'}
        actions={<LogoutButton />}
      />
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <a href="/dashboard" className="sgf-shell-back">
          ← Back to Dashboard
        </a>
        <h1 style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 32, letterSpacing: '0.04em', margin: '0 0 8px' }}>
          Fitness Setup
        </h1>
        <p style={{ color: 'var(--gray)', marginTop: 0, marginBottom: 24 }}>
          Tell us your baseline vitals and goals so your NASM OPT program and tracking are personalized from day one.
        </p>

        <div style={{ border: '1px solid var(--navy-lt)', background: 'var(--navy-mid)', padding: 24 }}>
          <OnboardingForm />
        </div>
      </div>
    </main>
  )
}
