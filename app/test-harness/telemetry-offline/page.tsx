import React from 'react'
import TelemetryOfflineHarnessClient from './TelemetryOfflineHarnessClient'

export const dynamic = 'force-dynamic'

export default function TelemetryOfflineTestHarnessPage() {
  return (
    <main className="min-h-dvh bg-[#080E14] px-4 py-8 text-zinc-100 sm:px-6">
      <TelemetryOfflineHarnessClient />
    </main>
  )
}
