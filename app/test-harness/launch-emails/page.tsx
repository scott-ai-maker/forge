import { notFound } from 'next/navigation'
import LaunchEmailsHarnessClient from './LaunchEmailsHarnessClient'

export const dynamic = 'force-dynamic'

export default function LaunchEmailsHarnessPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return <LaunchEmailsHarnessClient />
}

