import type { Metadata } from 'next'
import FoundingIntakeSplashClient from '@/components/marketing/FoundingIntakeSplashClient'

export const metadata: Metadata = {
  title: 'Founding Principal Cohort Intake | Gordon Athletic Advisory',
  description: 'Preliminary intake registry for the Gordon Athletic Advisory Founding Principal Cohort. Reserve priority 1:1 Live Diagnostic Consultation slots and locked lifetime grandfathered retainers.',
  openGraph: {
    title: 'Founding Principal Cohort Intake | Gordon Athletic Advisory',
    description: 'Preliminary intake registry for the Gordon Athletic Advisory Founding Principal Cohort. Strictly capped at 15 allocations.',
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

