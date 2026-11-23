import { supabaseAdmin } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'
import { getTeamById } from '@/lib/teams'
import { getBaseUrl } from '@/lib/marketing-email'
import { AuthzError, isMasterCoachEmail } from '@/lib/authz'
import { checkClientMedicalClearanceGate } from '@/lib/liability-shield'

/**
 * Dispatches a real-time Team Live Studio alert to all cleared active team members:
 * 1. Verifies the requesting coach owns the team (or is a master coach).
 * 2. Enforces Phase 0 Medical Clearance Hold per member (skips uncleared athletes).
 * 3. Posts an in-app concierge link reminding each member to confirm their ERAP address/dispatch before camera connect.
 * 4. Sends push, email, and SMS notifications with the direct Team Live Studio link.
 */
export async function dispatchTeamLiveSessionAlert(
  teamId: string,
  coachId: string,
  coachEmail?: string | null
): Promise<{
  success: boolean
  notifiedCount: number
  skippedMedicalHoldCount: number
  teamName: string
}> {
  const team = await getTeamById(teamId, coachId)
  if (!team) {
    throw new AuthzError(`Team not found: ${teamId}`, 404)
  }

  if (team.coachId && team.coachId !== coachId && !isMasterCoachEmail(coachEmail)) {
    throw new AuthzError('Forbidden: Not assigned coach for this team.', 403)
  }

  const admin = supabaseAdmin()
  let notifiedCount = 0
  let skippedMedicalHoldCount = 0
  const baseUrl = typeof getBaseUrl === 'function' ? getBaseUrl() : 'https://forge-athletic.app'
  const teamLivePath = `/dashboard/live?teamId=${encodeURIComponent(team.id)}`
  const teamLiveUrl = `${baseUrl}${teamLivePath}`

  const inviteMessage = `**TEAM LIVE STUDIO IN PROGRESS: ${team.name.toUpperCase()}**\n\nCoach Gordon is hosting a Live Team Training session for **${team.name}**. Before your camera connects, you will be prompted to confirm your current physical training address and local emergency dispatch details (ERAP):\n\n[**Join Team Live Studio**](${teamLivePath})\n\nDirect Link: ${teamLiveUrl}`

  for (const member of team.members) {
    try {
      // Enforce Phase 0 Medical Clearance Hold before inviting an athlete into live exercise
      const medicalGate = await checkClientMedicalClearanceGate(admin, member.clientId)
      if (medicalGate.blocked) {
        skippedMedicalHoldCount++
        continue
      }

      // 1. Post message in client's Concierge line
      await admin.from('coach_client_messages').insert({
        client_id: member.clientId,
        coach_id: coachId,
        sender_id: coachId,
        message_body: inviteMessage,
      })

      // 2. Dispatch push, email & SMS notification with direct link
      await notifyUser({
        userId: member.clientId,
        type: 'live_session_started',
        title: `Team Live Session: ${team.name}`,
        body: `Coach Gordon launched Team Live Studio for ${team.name}. Confirm your training location & join: ${teamLiveUrl}`,
        url: teamLivePath,
        data: {
          teamId: team.id,
          url: teamLivePath,
          link: teamLiveUrl,
        },
      })
      notifiedCount++
    } catch (err) {
      console.warn(`Failed to dispatch alert to team member ${member.fullName} (${member.clientId}):`, err)
    }
  }

  return {
    success: true,
    notifiedCount,
    skippedMedicalHoldCount,
    teamName: team.name,
  }
}
