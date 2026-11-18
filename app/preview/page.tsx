import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import FullMarketingHome from '@/components/marketing/FullMarketingHome'
import { getRequestAuthz } from '@/lib/authz'

export const metadata: Metadata = {
  title: 'Full Site Preview (Staff)',
  description: 'Internal preview of the complete Forge Athletic unmasked marketing experience.',
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

  return <FullMarketingHome isPreview={true} />
}
