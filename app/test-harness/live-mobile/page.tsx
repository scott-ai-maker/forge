'use client'

import LiveSessionClient, { DEFAULT_LIVE_ASSESSMENT_PLAN } from '@/components/coach/LiveSessionClient'

export default function LiveMobileTestHarnessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#04070E' }}>
      <div className="w-full max-w-[1440px] mx-auto p-0 md:px-5 md:py-4 pb-[calc(76px+env(safe-area-inset-bottom,16px))] md:pb-8">
        <LiveSessionClient
          clientId="test-client-mobile"
          athleteName="Devin Booker"
          plan={DEFAULT_LIVE_ASSESSMENT_PLAN}
          initialSets={[]}
          today={new Date().toISOString().slice(0, 10)}
        />
      </div>
    </main>
  )
}
