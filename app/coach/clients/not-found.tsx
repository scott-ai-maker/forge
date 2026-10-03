import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import LogoutButton from '@/components/auth/LogoutButton'

export default function CoachNotFound() {
  return (
    <main id="main-content" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <SiteHeader
        links={[{ href: '/coach', label: 'Coach Dashboard' }]}
        actions={<LogoutButton />}
      />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontWeight: 700,
            fontSize: 32,
            color: 'var(--gold)',
            letterSpacing: '0.04em',
            marginBottom: 16,
          }}
        >
          CLIENT NOT FOUND
        </h1>
        <p
          style={{
            fontFamily: 'Raleway, sans-serif',
            fontSize: 15,
            color: 'var(--gray)',
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          This client doesn&apos;t exist or you don&apos;t have access to their profile.
        </p>
        <Link
          href="/coach"
          className="tactile-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--gold)',
            color: '#080E14',
            textDecoration: 'none',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.04em',
            padding: '12px 28px',
            borderRadius: 4,
            boxShadow: '0 4px 15px rgba(197, 160, 89, 0.3)',
          }}
        >
          Back to Roster
        </Link>
      </div>
    </main>
  )
}
