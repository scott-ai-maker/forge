import type { Metadata } from 'next'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { Camera, CirclePlay, Users, BriefcaseBusiness } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Reset Account Password',
  description: 'Update your Gordon Athletic Advisory account credentials.',
}

const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://instagram.com/scottgordonfitness', Icon: Camera },
  { name: 'YouTube', href: 'https://youtube.com/@scottgordonfitness', Icon: CirclePlay },
  { name: 'Facebook', href: 'https://facebook.com/scottgordonfitness', Icon: Users },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/scottgordonfitness', Icon: BriefcaseBusiness },
]

export const dynamic = 'force-dynamic'

interface ResetPasswordPageProps {
  searchParams: Promise<{ required?: string; next?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams
  const forceChange = resolvedSearchParams.required === '1'
  const nextPath = resolvedSearchParams.next?.startsWith('/') ? resolvedSearchParams.next : '/dashboard'

  return (
    <main
      className="sgf-auth-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div
          aria-hidden
          style={{
            width: 100,
            height: 100,
            margin: '0 auto 20px',
            borderRadius: 18,
            border: '2px solid var(--gold)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 25px rgba(197,160,89,0.45)',
            backgroundImage: "url('/images/gaa-brand-crest.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
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
          GORDON ATHLETIC ADVISORY
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
          {forceChange ? 'Update your password to continue' : 'Account Access & Password Recovery'}
        </p>
        <div
          style={{
            background: 'rgba(18, 35, 54, 0.9)',
            padding: 32,
            border: '1px solid var(--navy-lt)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <ResetPasswordForm forceChange={forceChange} nextPath={nextPath} />
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
                width: 32,
                height: 32,
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
