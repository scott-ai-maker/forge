import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import LogoutButton from '@/components/auth/LogoutButton'
import MessageThreadClient from '@/components/messages/MessageThreadClient'
import SiteHeader from '@/components/ui/SiteHeader'
import GaaIcon from '@/components/ui/GaaIcon'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CoachClientMessagesPage({ params }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { id } = await params

  const admin = supabaseAdmin()

  const { data: client } = await admin
    .from('clients')
    .select('id, full_name, email, designated_coach_id')
    .eq('id', id)
    .maybeSingle()

  if (!client) {
    notFound()
  }

  if (!client.designated_coach_id) {
    await admin
      .from('clients')
      .update({ designated_coach_id: user.id })
      .eq('id', id)
    client.designated_coach_id = user.id
  } else if (client.designated_coach_id !== user.id) {
    const isMasterCoach =
      user.email?.toLowerCase() === 'scott.gordon72@outlook.com' ||
      user.user_metadata?.surface_role === 'coach'
    if (!isMasterCoach) {
      notFound()
    }
  }

  const athleteName = client.full_name || client.email

  return (
    <main className="coach-client-messages-page" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Messages"
        links={[
          { href: '/coach', label: 'Overview' },
          { href: '/coach#assigned-clients', label: 'Members' },
          { href: `/coach/clients/${id}`, label: 'Member Profile' },
          { href: `/coach/clients/${id}/live`, label: 'Live Coaching' },
          { href: '/coach/settings', label: 'Settings' },
        ]}
        actions={<LogoutButton />}
      />

      <div
        className="coach-client-messages-content"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: 'clamp(14px, 2.5vw, 24px) clamp(8px, 1.8vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* ── Member messaging header ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16,22,38,0.98) 0%, rgba(9,13,24,0.98) 100%)',
            border: '1px solid rgba(212,160,23,0.4)',
            borderRadius: 12,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 800,
                  background: 'rgba(212,160,23,0.15)',
                  color: 'var(--gold-lt)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(212,160,23,0.35)',
                }}
              >
                ● Member Messaging
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray)' }}>{client.email}</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontWeight: 700,
                fontSize: 28,
                color: 'var(--white)',
                letterSpacing: '0.04em',
                margin: '6px 0 4px',
                lineHeight: 1.1,
              }}
            >
              {athleteName}
            </h1>
            <p style={{ fontFamily: 'Raleway, sans-serif', color: 'var(--gray)', margin: 0, fontSize: 13 }}>
              Private encrypted messaging with your member for exercise guidance, progress updates, and voice notes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/coach/clients/${id}`}
              style={{
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'Raleway, sans-serif',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                color: '#F8FAFC',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <GaaIcon name="user" size={14} tone="inherit" />
              <span>Member Profile</span>
            </Link>

            <Link
              href={`/coach/clients/${id}/live`}
              style={{
                padding: '10px 18px',
                fontSize: 13,
                fontFamily: 'Raleway, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 800,
                border: '1px solid #D4AF37',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
                color: '#080E14',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(212,160,23,0.3)',
                cursor: 'pointer',
              }}
            >
              <GaaIcon name="video-studio" size={15} tone="inherit" />
              <span>Start Live Coaching</span>
            </Link>
          </div>
        </div>

        {/* ── Message Thread Container ── */}
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            borderRadius: 14,
            padding: '20px 16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}
        >
          <MessageThreadClient
            currentUserId={user.id}
            role="coach"
            clientId={id}
            recipientName={athleteName}
            recipientRoleTitle="Member"
          />
        </div>
      </div>
    </main>
  )
}
