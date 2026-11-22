import type { Metadata } from 'next'
import Link from 'next/link'
import { isLisaGordonEmail, requireEnterpriseSurface } from '@/lib/authz'
import { fetchEnterpriseBiDashboard } from '@/lib/enterprise-chatbots/metrics'
import ExecutiveBiSuite from '@/components/enterprise/ExecutiveBiSuite'
import SiteHeader from '@/components/ui/SiteHeader'
import LogoutButton from '@/components/auth/LogoutButton'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Executive Suite & Business Intelligence | Forge Athletic',
  description:
    'Dedicated Forge Athletic leadership suite with zero-PII Executive KPI dashboards, Prometheus/Grafana metrics bridge, and AI Executive Advisory Board.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function EnterpriseExecutivePortalPage() {
  const { user, role } = await requireEnterpriseSurface()
  const isLisa = isLisaGordonEmail(user.email)
  const biSnapshot = await fetchEnterpriseBiDashboard(user.id, true)

  return (
    <main id="main-content" style={{ minHeight: '100dvh', background: 'var(--navy)' }}>
      <SiteHeader
        badgeText="Executive Suite"
        links={
          role === 'coach'
            ? [
                { href: '/enterprise', label: 'Executive Suite' },
                { href: '/coach', label: 'Coach Console' },
                { href: '/coach?tab=analytics', label: 'Athlete Analytics' },
              ]
            : [
                { href: '/enterprise', label: 'Executive Suite' },
                { href: '/packages', label: 'Memberships' },
                { href: '/credentials', label: 'Leadership' },
              ]
        }
        actions={<LogoutButton />}
      />

      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: 'clamp(14px, 2.5vw, 28px) clamp(12px, 2vw, 24px) 64px',
          boxSizing: 'border-box',
        }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl font-bold tracking-wide text-white sm:text-2xl">
              {isLisa
                ? 'WELCOME, LISA GORDON · FORGE ATHLETIC EXECUTIVE SUITE'
                : 'FORGE ATHLETIC EXECUTIVE SUITE'}
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              {isLisa
                ? 'Dedicated HIPAA-isolated leadership workspace (zero athlete PHI). Live KPIs, Customer Success playbooks, and your AI Advisory Board in one place.'
                : 'Unified leadership workspace for Scott Gordon & Lisa Gordon — live zero-PII KPIs, Prometheus/Grafana bridge, and AI Executive Board.'}
            </p>
          </div>

          {role === 'coach' ? (
            <Link
              href="/coach"
              className="inline-flex min-h-[40px] items-center rounded-xl border border-amber-400/35 bg-amber-400/10 px-3.5 py-2 text-xs font-bold text-amber-200 no-underline transition hover:bg-amber-400/20"
            >
              Open Clinical Coach Console →
            </Link>
          ) : null}
        </div>

        <ExecutiveBiSuite
          initialSnapshot={biSnapshot}
          viewerPersona={isLisa ? 'lisa' : 'scott'}
        />
      </div>
    </main>
  )
}
