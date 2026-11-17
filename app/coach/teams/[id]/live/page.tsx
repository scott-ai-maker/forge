import { redirect } from 'next/navigation'
import { requireSurfaceRole } from '@/lib/authz'

export const dynamic = 'force-dynamic'

/**
 * Team Live Studio has been permanently disabled for clinical safety & ERAP compliance.
 * All live telehealth coaching sessions operate strictly 1:1 with verified athlete ERAP records.
 */
export default async function CoachTeamLiveSessionPage() {
  await requireSurfaceRole('coach')
  redirect('/coach#live-studio')
}
