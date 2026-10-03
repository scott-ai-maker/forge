import type { Metadata } from 'next'
import FoundingIntakeSplashClient from '@/components/marketing/FoundingIntakeSplashClient'

export const metadata: Metadata = {
  title: 'Priority Waitlist & Founding Intake | Forge Athletic',
  description: 'Reserve priority allocation in the Forge Athletic Founding Cohort and lock in grandfathered membership rates.',
  openGraph: {
    title: 'Priority Waitlist & Founding Intake | Forge Athletic',
    description: 'Reserve priority allocation in the Forge Athletic Founding Cohort.',
    images: ['/images/backgrounds/coach-olympic-facility-gaa.jpg'],
  },
}

export default function WaitlistPage() {
  return (
    <main id="main-content">
      <FoundingIntakeSplashClient />
    </main>
  )
}

