import type { Metadata } from 'next'
import FoundingIntakeSplashClient from '@/components/marketing/FoundingIntakeSplashClient'

export const metadata: Metadata = {
  title: 'Priority Waitlist & Founding Intake | Gordon Athletic Advisory',
  description: 'Reserve priority allocation in the Gordon Athletic Advisory Founding Principal Cohort while certification protocols finalize.',
  openGraph: {
    title: 'Priority Waitlist & Founding Intake | Gordon Athletic Advisory',
    description: 'Reserve priority allocation in the Gordon Athletic Advisory Founding Principal Cohort.',
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

