import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LiveLandingHome from '@/components/marketing/LiveLandingHome'
import { getRequestAuthz } from '@/lib/authz'

export const metadata: Metadata = {
  title: 'Full Site Preview (Staff)',
  description: 'Internal preview of the complete Forge Athletic live marketing homepage.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    try {
      const authz = await getRequestAuthz()
      if (authz.client.role !== 'coach') {
        redirect('/')
      }
    } catch {
      redirect('/')
    }
  }

  return <LiveLandingHome isPreview={true} />
}
