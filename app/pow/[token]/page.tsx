import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

interface ProofOfWorkPageProps {
  params: Promise<{ token: string }>
}

/**
 * Public `/pow/[token]` URLs are disabled to prevent unencrypted Base64 URL
 * leakage or OpenGraph reflection of athlete names, tonnage, or coaching notes.
 * `generateMetadata` intentionally ignores `params.token`.
 */
export async function generateMetadata(_props: ProofOfWorkPageProps): Promise<Metadata> {
  const title = 'Performance Verification | Forge Athletic'
  const description =
    'Authenticated performance dossiers are strictly private and accessible only inside the Forge Athletic member portal.'

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: '/images/brand/logo-concept-1-kinetic-f.jpg',
          width: 800,
          height: 800,
          alt: 'Forge Athletic',
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

export default async function ProofOfWorkSharePage(_props: ProofOfWorkPageProps) {
  redirect('/')
}
