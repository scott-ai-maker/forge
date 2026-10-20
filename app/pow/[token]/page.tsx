import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { decodeProofOfWorkToken } from '@/lib/proof-of-work-dossier-engine'
import ProofOfWorkDossierModal from '@/components/fitness/ProofOfWorkDossierModal'

interface ProofOfWorkPageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: ProofOfWorkPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const dossier = decodeProofOfWorkToken(resolvedParams.token)

  const athleteName = dossier ? dossier.athleteName : 'Forge Athlete'
  const title = `Clinical Proof of Work Dossier: ${athleteName} | Forge Athletic`
  const description = dossier
    ? `Official physical adaptation dossier for ${dossier.athleteName}. ${dossier.totalTonnageLbs.toLocaleString()} lbs lifted across ${dossier.totalWorkingSets} sets. Verified progressive overload and Sanctuary Mode focus.`
    : 'Evidence-led clinical sports science and physical adaptation record certified by Forge Athletic.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [
        {
          url: '/images/brand/logo-concept-1-kinetic-f.jpg',
          width: 800,
          height: 800,
          alt: 'Forge Athletic Proof of Work Dossier',
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

export default async function ProofOfWorkSharePage({ params }: ProofOfWorkPageProps) {
  const resolvedParams = await params
  const dossier = decodeProofOfWorkToken(resolvedParams.token)

  if (!dossier) {
    notFound()
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#04070E',
        color: '#F8FAFC',
        padding: 'clamp(16px, 4vw, 40px) 16px 64px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ── PUBLIC HEADER BANNER (NO-PRINT) ── */}
      <nav
        className="pow-no-print"
        aria-label="Public Navigation"
        style={{
          width: '100%',
          maxWidth: 880,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          padding: '10px 16px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            color: '#FFFFFF',
            fontFamily: 'var(--font-heading, Cinzel), Georgia, serif',
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.06em',
          }}
        >
          <span style={{ color: 'var(--gold-lt, #F3E5AB)' }}>FORGE</span>
          <span>ATHLETIC</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              color: '#94A3B8',
              fontFamily: 'var(--font-telemetry, monospace)',
            }}
          >
            CONFIDENTIAL ATHLETE RECORD
          </span>

          <Link
            href={dossier.peerInvitation.shareUrl}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)',
              color: '#0A0E18',
              borderRadius: 4,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 800,
              textDecoration: 'none',
              fontFamily: 'var(--font-heading, sans-serif)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Claim 30-Day VIP Pass →
          </Link>
        </div>
      </nav>

      <div style={{ width: '100%', maxWidth: 880 }}>
        <ProofOfWorkDossierModal
          isOpen={true}
          isEmbedded={true}
          dossier={dossier}
        />
      </div>

      <footer
        className="pow-no-print"
        style={{
          marginTop: 36,
          textAlign: 'center',
          fontSize: 12,
          color: '#64748B',
          maxWidth: 600,
          lineHeight: 1.6,
        }}
      >
        <p style={{ margin: 0 }}>
          This record is certified by <strong>Forge Athletic</strong>. All progressive overload, mechanical tonnage, and
          Sanctuary Mode autonomic telemetry are calculated directly from verified session logs.
        </p>
        <p style={{ margin: '6px 0 0', fontSize: 11 }}>
          © {new Date().getFullYear()} Forge Athletic. Coach Gordon, Master Trainer Candidate. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
