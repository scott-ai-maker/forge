import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BOSU Ball Exercise Library & Movement Directory | Forge Athletic',
  description:
    'Comprehensive NASM Phase 1 Stabilization & Balance exercise guide for BOSU dome-up and platform-up movements with coaching cues, tempo guidelines, and video demonstrations.',
  openGraph: {
    title: 'BOSU Ball Exercise Library & Movement Directory | Forge Athletic',
    description:
      'NASM Phase 1 Stabilization & Balance exercises for BOSU dome-up and platform-up movements with coaching cues and video demonstrations.',
    url: 'https://forge-athletic.app/exercises/bosu',
    siteName: 'Forge Athletic',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

const bosuStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'BOSU Ball Exercise Library',
  description:
    'NASM OPT™ Phase 1 Stabilization exercises utilizing BOSU balance trainers to improve neuromuscular efficiency and core stability.',
  url: 'https://forge-athletic.app/exercises/bosu',
  itemListOrder: 'https://schema.org/ItemListUnordered',
  numberOfItems: 30,
}

export default function BosuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bosuStructuredData) }}
      />
      {children}
    </>
  )
}
