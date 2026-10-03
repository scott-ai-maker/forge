import type { Metadata } from 'next'
import FoundingIntakeSplashClient from '@/components/marketing/FoundingIntakeSplashClient'

export const metadata: Metadata = {
  title: 'Forge Athletic Early Access',
  description: 'Get Forge Athletic product and membership updates.',
  openGraph: {
    title: 'Forge Athletic Early Access',
    description: 'Get Forge Athletic product and membership updates.',
    images: ['/images/brand/logo-concept-1-kinetic-f.jpg'],
  },
}

export default function WaitlistPage() {
  return (
    <main id="main-content">
      <FoundingIntakeSplashClient />
    </main>
  )
}
