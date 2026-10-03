import type { Metadata } from 'next'
import { requireSurfaceRole } from '@/lib/authz'
import MobileBottomNav from '@/components/ui/MobileBottomNav'
import OfflineTelemetryBadge from '@/components/ui/OfflineTelemetryBadge'
import GlobalCoachGordonHost from '@/components/fitness/GlobalCoachGordonHost'
import GlobalWhatsNewHost from '@/components/ui/GlobalWhatsNewHost'

export const metadata: Metadata = {
  title: 'Client Dashboard',
  description: 'Private human performance dashboard, 3D recovery telemetry, and personalized workout execution.',
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  await requireSurfaceRole('client', { allowCoach: true })
  return (
    <>
      <OfflineTelemetryBadge />
      {children}
      <GlobalCoachGordonHost />
      <GlobalWhatsNewHost />
      <MobileBottomNav role="client" />
    </>
  )
}


