import type { Metadata } from 'next'
import { requireSurfaceRole } from '@/lib/authz'
import MobileBottomNav from '@/components/ui/MobileBottomNav'
import OfflineTelemetryBadge from '@/components/ui/OfflineTelemetryBadge'

export const metadata: Metadata = {
  title: 'Coach Console',
  description: 'Master coaching console, client triage, OPT periodization, and real-time telemetry studio.',
}

interface CoachLayoutProps {
  children: React.ReactNode
}

export default async function CoachLayout({ children }: CoachLayoutProps) {
  await requireSurfaceRole('coach')
  return (
    <>
      <OfflineTelemetryBadge />
      {children}
      <MobileBottomNav role="coach" />
    </>
  )
}
