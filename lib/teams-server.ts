import { supabaseAdmin } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'
import { getTeamById } from '@/lib/teams'

/**
 * Dispatches a real-time live session alert to all active team members:
 * 1. Posts an in-app concierge link into each member's private coach chat channel.
 * 2. Sends a push notification alert.
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

  const inviteMessage = `**TEAM LIVE STUDIO IN PROGRESS: ${team.name.toUpperCase()}**\n\nCoach Gordon is hosting a Live Squad Coaching session for **${team.name}**. Tap below to enter the Team Studio with your teammates:\n\n[**Join Team Live Studio**](/dashboard/live?teamId=${encodeURIComponent(team.id)})`

  for (const member of team.members) {
    try {
      // 1. Post message in client's Concierge line
      await admin.from('coach_client_messages').insert({
        client_id: member.clientId,
        coach_id: coachId,
        sender_id: coachId,
        message_body: inviteMessage,
      })

      // 2. Dispatch push notification
      await notifyUser({
        userId: member.clientId,
        type: 'live_session_started',
        title: `Team Live Session: ${team.name}`,
        body: `Coach Gordon launched Live Studio for ${team.name}. Tap to join!`,
        url: `/dashboard/live?teamId=${encodeURIComponent(team.id)}`,
        data: {
          teamId: team.id,
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
