import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stability Ball Exercise Library & Biomechanics Guide | Forge Athletic',
  description:
    'Official NASM OPT™ stability ball exercise directory. Core stabilization, hamstring curls, push-ups, and tempo cues with video demonstrations.',
  openGraph: {
    title: 'Stability Ball Exercise Library & Biomechanics Guide | Forge Athletic',
    description:
      'NASM OPT™ stability ball exercise guide for core stabilization, balance, and kinetic chain endurance.',
    url: 'https://forge-athletic.app/exercises/stability-ball',
    siteName: 'Forge Athletic',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

const stabilityBallStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Stability Ball Exercise Library',
  description:
    'NASM OPT™ Phase 1 Stabilization and core endurance exercises on the Swiss ball / stability ball.',
  url: 'https://forge-athletic.app/exercises/stability-ball',
  itemListOrder: 'https://schema.org/ItemListUnordered',
  numberOfItems: 30,
}

export default function StabilityBallLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(stabilityBallStructuredData) }}
      />
      {children}
    </>
  )
}
