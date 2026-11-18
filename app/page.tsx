import type { Metadata } from 'next'
import HolidayUnmaskingSplash from '@/components/marketing/HolidayUnmaskingSplash'
import LiveLandingHome from '@/components/marketing/LiveLandingHome'
import { LANDING_FAQ_ITEMS } from '@/lib/landingSocialProof'
import { isSiteUnmasked } from '@/lib/launch-config'

export const metadata: Metadata = {
  title: 'Forge Athletic | Online Personal Training, 33-Point Posture Screening & NASM OPT™',
  description:
    'Start 2027 with joint-first precision—not a 3-week resolution. NASM-certified human coaching combining local 33-point phone camera posture screening, adaptive 5-Phase OPT™ workouts, and Coach Gordon’s real voice.',
  openGraph: {
    title: 'Forge Athletic | Online Personal Training & 33-Point Camera Posture Screening',
    description:
      'NASM-certified personal training combining local 33-point phone camera posture screening, adaptive workouts, and Coach Gordon’s real voice.',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

const homeFaqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: LANDING_FAQ_ITEMS.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {}
  const rawPreview = resolvedParams.preview || resolvedParams.unmask || resolvedParams.unmasked
  const previewParam =
    typeof rawPreview === 'string'
      ? rawPreview
      : Array.isArray(rawPreview)
        ? rawPreview[0]
        : null

  const forceSplash = resolvedParams.splash === '1' || resolvedParams.splash === 'true'
  const unmasked = forceSplash ? false : isSiteUnmasked(previewParam)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqStructuredData) }}
      />
      {unmasked ? (
        <LiveLandingHome isPreview={Boolean(previewParam)} />
      ) : (
        <main id="main-content">
          <HolidayUnmaskingSplash previewMode={Boolean(previewParam)} />
        </main>
      )}
    </>
  )
}
