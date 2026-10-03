import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Forge Athletic Memberships',
  description: 'Explore current Forge Athletic membership options.',
}

export default function AsyncCoachingPage() {
  redirect('/packages')
}
