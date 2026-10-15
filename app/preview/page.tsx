import type { Metadata } from 'next'
import FullMarketingHome from '@/components/marketing/FullMarketingHome'

export const metadata: Metadata = {
  title: 'Full Site Preview (Staff)',
  description: 'Internal preview of the complete Forge Athletic unmasked marketing experience.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PreviewPage() {
  return <FullMarketingHome isPreview={true} />
}
