import { supabaseAdmin } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'
import { getTeamById } from '@/lib/teams'
import { getBaseUrl } from '@/lib/marketing-email'

/**
 * Dispatches a real-time live session alert to all active team members:
 * 1. Posts an in-app concierge link into each member's private coach chat channel.
 * 2. Sends a push, email, and SMS notification alert with a direct link.
 */
export async function dispatchTeamLiveSessionAlert(
  teamId: string,
  coachId: string
): Promise<{ success: boolean; notifiedCount: number; teamName: string }> {
  const team = await getTeamById(teamId, coachId)
  if (!team) {
    throw new Error(`Team not found: ${teamId}`)
  }

  const admin = supabaseAdmin()
  let notifiedCount = 0
  const baseUrl = typeof getBaseUrl === 'function' ? getBaseUrl() : 'https://forge-athletic.app'
  const teamLivePath = `/dashboard/live?teamId=${encodeURIComponent(team.id)}`
  const teamLiveUrl = `${baseUrl}${teamLivePath}`

  const inviteMessage = `**TEAM LIVE STUDIO IN PROGRESS: ${team.name.toUpperCase()}**\n\nCoach Gordon is hosting a Live Squad Coaching session for **${team.name}**. Tap below to enter the Team Studio with your teammates:\n\n[**Join Team Live Studio**](${teamLivePath})\n\nDirect Link: ${teamLiveUrl}`

  for (const member of team.members) {
    try {
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
        body: `Coach Gordon launched Live Studio for ${team.name}. Tap to join: ${teamLiveUrl}`,
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
    teamName: team.name,
  }
}
