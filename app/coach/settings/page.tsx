import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import CoachOperationsStudio, { CoachSettingsTab } from '@/components/coach/CoachOperationsStudio'
import { createSignedFitnessPhotoUrl } from '@/lib/fitness-photos'

export const dynamic = 'force-dynamic'

interface CoachSettingsPageProps {
  searchParams: Promise<{
    email_updated?: string | string[] | undefined
    tab?: string | string[] | undefined
  }>
}

export default async function CoachSettingsPage({ searchParams }: CoachSettingsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('clients')
    .select('email, full_name, phone, role, avatar_path')
    .eq('id', user.id)
    .maybeSingle()

  const avatarUrl = await createSignedFitnessPhotoUrl(supabase, profile?.avatar_path)

  const initialProfile = {
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    role: profile?.role === 'coach' || user.user_metadata?.surface_role === 'coach' ? 'coach' : 'client',
    avatarUrl,
    pendingEmail: user.new_email ?? null,
  } as const

  const resolvedSearchParams = await searchParams
  const emailUpdated = (Array.isArray(resolvedSearchParams.email_updated)
    ? resolvedSearchParams.email_updated[0]
    : resolvedSearchParams.email_updated) === '1'

  const tabParam = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab

  const initialTab = (tabParam as CoachSettingsTab) || 'promotions'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Coach Console"
        links={[
          { href: '/coach', label: 'Triage' },
          { href: '/coach#assigned-clients', label: 'Athletes' },
          { href: '/coach#live-studio', label: 'Live Studio' },
          { href: '/coach/settings', label: 'Operations' },
        ]}
        actions={<LogoutButton />}
      />

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {emailUpdated && (
          <div
            style={{
              border: '1px solid rgba(46, 204, 113, 0.45)',
              background: 'rgba(46, 204, 113, 0.08)',
              padding: '14px 16px',
              color: 'var(--success)',
              fontFamily: 'Raleway, sans-serif',
              fontSize: 14,
              borderRadius: 6,
            }}
          >
            Email updated successfully. Your verified login email is now {initialProfile.email}.
          </div>
        )}

        <CoachOperationsStudio
          initialProfile={initialProfile}
          initialTab={initialTab}
        />
      </div>
    </main>
  )
}
