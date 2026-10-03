import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import LogoutButton from '@/components/auth/LogoutButton'
import SiteHeader from '@/components/ui/SiteHeader'
import ClientSettingsStudio, { SettingsTab } from '@/components/settings/ClientSettingsStudio'
import { createSignedFitnessPhotoUrl } from '@/lib/fitness-photos'

export const dynamic = 'force-dynamic'

interface ClientSettingsPageProps {
  searchParams: Promise<{
    email_updated?: string | string[] | undefined
    tab?: string | string[] | undefined
  }>
}

export default async function ClientSettingsPage({ searchParams }: ClientSettingsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: latestPackage }, { data: fitnessProfile }] = await Promise.all([
    supabase
      .from('clients')
      .select('email, full_name, phone, role, avatar_path')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('client_packages')
      .select('package_name')
      .eq('client_id', user.id)
      .order('purchased_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('fitness_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const avatarUrl = await createSignedFitnessPhotoUrl(supabase, profile?.avatar_path)

  const initialProfile = {
    email: profile?.email ?? user.email ?? '',
    fullName: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    role: profile?.role === 'coach' || user.user_metadata?.surface_role === 'coach' ? 'coach' : 'client',
    avatarUrl,
    pendingEmail: user.new_email ?? null,
    preferredUnits: (fitnessProfile?.preferred_units === 'metric' ? 'metric' : 'imperial') as 'imperial' | 'metric',
    sex: (fitnessProfile?.sex === 'female' ? 'female' : 'male') as 'male' | 'female',
  } as const

  const initialFitnessProfile = fitnessProfile ? {
    preferredUnits: (fitnessProfile.preferred_units === 'metric' ? 'metric' : 'imperial') as 'imperial' | 'metric',
    age: fitnessProfile.age,
    sex: fitnessProfile.sex,
    heightCm: fitnessProfile.height_cm,
    weightKg: fitnessProfile.weight_kg,
    waistCm: fitnessProfile.waist_cm,
    neckCm: fitnessProfile.neck_cm,
    hipCm: fitnessProfile.hip_cm,
    activityLevel: fitnessProfile.activity_level,
    trainingDaysPerWeek: fitnessProfile.training_days_per_week,
    preferredTrainingDays: fitnessProfile.preferred_training_days,
    fitnessGoal: fitnessProfile.fitness_goal,
    targetWeightKg: fitnessProfile.target_weight_kg,
    targetBodyfatPercent: fitnessProfile.target_bodyfat_percent,
    injuriesLimitations: fitnessProfile.injuries_limitations,
    experienceLevel: fitnessProfile.experience_level,
    workoutLocation: fitnessProfile.workout_location,
    equipmentAccess: fitnessProfile.equipment_access,
    cardioEquipmentAccess: fitnessProfile.cardio_equipment_access,
    onboardingCompletedAt: fitnessProfile.onboarding_completed_at,
  } : undefined

  const resolvedSearchParams = await searchParams
  const emailUpdated = (Array.isArray(resolvedSearchParams.email_updated)
    ? resolvedSearchParams.email_updated[0]
    : resolvedSearchParams.email_updated) === '1'

  const tabParam = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab

  const initialTab = (tabParam as SettingsTab) || 'wearables'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Settings & Hardware"
        links={[
          { href: '/dashboard', label: 'Command Center' },
          { href: '/dashboard/fitness', label: 'Fitness Lab' },
          { href: '/dashboard/dossier', label: 'Weekly Dossier' },
          { href: '/dashboard/book', label: 'Consultations' },
          { href: '/dashboard/messages', label: 'Messages' },
          { href: '/dashboard/settings', label: 'Settings' },
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

        <ClientSettingsStudio
          initialProfile={initialProfile}
          initialFitnessProfile={initialFitnessProfile}
          activePackageName={latestPackage?.package_name || 'Hybrid Concierge'}
          initialTab={initialTab}
        />
      </div>
    </main>
  )
}
