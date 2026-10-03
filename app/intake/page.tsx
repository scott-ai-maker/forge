import type { Metadata } from 'next'
import FoundingIntakeSplashClient from '@/components/marketing/FoundingIntakeSplashClient'

export const metadata: Metadata = {
  title: 'Forge Athletic Early Access',
  description: 'Request early access to Forge Athletic training and membership updates.',
  openGraph: {
    title: 'Forge Athletic Early Access',
    description: 'Request early access to Forge Athletic training and membership updates.',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

export default function IntakePage() {
  return (
    <main id="main-content">
      <FoundingIntakeSplashClient />
    </main>
  )
}
