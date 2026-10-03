import type { Metadata } from 'next'
import FoundingIntakeSplashClient from '@/components/marketing/FoundingIntakeSplashClient'

export const metadata: Metadata = {
  title: 'Founding Cohort Intake | Forge Athletic',
  description: 'Preliminary intake registry for the Forge Athletic Founding Cohort. Reserve priority 1:1 Live Diagnostic Consultation slots and locked lifetime grandfathered memberships.',
  openGraph: {
    title: 'Founding Cohort Intake | Forge Athletic',
    description: 'Preliminary intake registry for the Forge Athletic Founding Cohort. Precision sports science for real lives.',
    images: ['/images/backgrounds/coach-olympic-facility-gaa.jpg'],
  },
}

export default function IntakePage() {
  return (
    <main id="main-content">
      <FoundingIntakeSplashClient />
    </main>
  )
}

