import { getTeamById } from '@/lib/teams'
import { AuthzError, isMasterCoachEmail } from '@/lib/authz'

/**
 * Team Live Studio has been permanently disabled for clinical safety & ERAP compliance.
 * Ownership authorization checks remain enforced prior to returning 410 Gone so unauthorized
 * cross-coach probes still receive 403/404 without leaking team state or dispatching alerts.
 */
export async function dispatchTeamLiveSessionAlert(
  teamId: string,
  coachId: string,
  coachEmail?: string | null
): Promise<{ success: boolean; notifiedCount: number; teamName: string }> {
  const team = await getTeamById(teamId, coachId)
  if (!team) {
    throw new AuthzError(`Team not found: ${teamId}`, 404)
  }

  if (team.coachId && team.coachId !== coachId && !isMasterCoachEmail(coachEmail)) {
    throw new AuthzError('Forbidden: Not assigned coach for this team.', 403)
  }

  throw new AuthzError(
    'Team Live Studio is disabled. Launch a 1:1 Live Coaching session instead so each athlete has an active Emergency Response Action Plan (ERAP).',
    410
  )
}
