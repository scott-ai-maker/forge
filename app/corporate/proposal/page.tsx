import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/ui/SiteHeader'
import SiteFooter from '@/components/ui/SiteFooter'
import MarketingLoginActions from '@/components/ui/MarketingLoginActions'
import GaaIcon from '@/components/ui/GaaIcon'
import CorporateProposalStudio from '@/components/corporate/CorporateProposalStudio'
import { CorporateCadence } from '@/lib/corporate-proposal-engine'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Team Wellness Proposal | Forge Athletic',
  description:
    'A team wellness and fitness coaching proposal for organizations looking to support healthy routines at work.',
  openGraph: {
    title: 'Team Wellness Proposal | Forge Athletic',
    description:
      'Explore team fitness coaching, workplace wellness support, and options for your organization.',
  },
}

interface CorporateProposalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CorporateProposalPage({ searchParams }: CorporateProposalPageProps) {
  const params = await searchParams

  const companyParam = typeof params.company === 'string' ? params.company : 'Your organization'
  const sponsorParam = typeof params.sponsor === 'string' ? params.sponsor : 'Program contact'
  const titleParam = typeof params.title === 'string' ? params.title : 'Wellness program team'
  const seatsParam = typeof params.seats === 'string' ? parseInt(params.seats, 10) : 10
  const safeSeats = isNaN(seatsParam) || seatsParam < 1 ? 10 : seatsParam
  const cadenceParam: CorporateCadence = params.cadence === 'monthly' ? 'monthly' : 'annual'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--navy)', position: 'relative' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 50%, transparent 100%)' }} />

      <SiteHeader
        fixed
        links={[
          { href: '/packages', label: 'Memberships' },
          { href: '/corporate', label: 'Workplace Wellness' },
          { href: '/audit', label: 'Movement Assessment' },
          { href: '/apply', label: 'Find a Training Plan' },
        ]}
        actions={<MarketingLoginActions />}
      />

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: 'clamp(80px, 12vw, 110px) 24px 60px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Navigation Breadcrumb (Screen Only) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '10px 16px',
            background: 'rgba(10, 16, 29, 0.75)',
            border: '1px solid rgba(212, 160, 23, 0.25)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Link
              href="/corporate"
              style={{
                color: 'var(--gold, #D4A017)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                letterSpacing: '0.04em',
              }}
            >
              <span>←</span>
              <span>Corporate Overview</span>
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
            <span style={{ color: '#E2E8F0', fontWeight: 500 }}>Team Wellness Proposal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 4,
                background: 'rgba(212, 160, 23, 0.12)',
                color: '#D4A017',
                border: '1px solid rgba(212, 160, 23, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <GaaIcon name="building" size={10} tone="gold" />
              Organization proposal
            </span>
          </div>
        </div>

        {/* The Interactive Proposal Studio & Document Engine */}
        <CorporateProposalStudio
          initialCompany={companyParam}
          initialSponsor={sponsorParam}
          initialTitle={titleParam}
          initialSeats={safeSeats}
          initialCadence={cadenceParam}
          isStandalonePage={true}
        />
      </div>

      <SiteFooter />
    </main>
  )
}
