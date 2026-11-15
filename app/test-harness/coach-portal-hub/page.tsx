import React from 'react'
import CoachPortalHubHarnessClient from './CoachPortalHubHarnessClient'
import { CoachClientTabSchema, type CoachClientTab } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export default async function CoachPortalHubTestHarnessPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const resolved = searchParams ? await searchParams : {}
  const parsed = CoachClientTabSchema.safeParse(resolved?.tab)
  const activeTab: CoachClientTab = parsed.success ? parsed.data : 'periodization'

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--navy)', padding: '24px 16px', color: '#FFFFFF' }}>
      <CoachPortalHubHarnessClient activeTab={activeTab} />
    </main>
  )
}
