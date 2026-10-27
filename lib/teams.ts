import { supabaseAdmin } from '@/lib/supabase'
import { notifyUser } from '@/lib/notifications'

export interface TeamMember {
  id: string
  teamId: string
  clientId: string
  fullName: string
  email: string
  role: 'athlete' | 'captain' | 'assistant'
  status: 'active' | 'invited' | 'inactive'
  avatarUrl?: string
  joinedAt?: string
  sessionsRemaining?: number
}

export interface Team {
  id: string
  name: string
  coachId: string
  description?: string
  sportOrFocus: string
  maxSeats: number
  isActive: boolean
  members: TeamMember[]
  memberCount: number
  createdAt: string
  updatedAt?: string
}

export interface TeamCircuitTimerData {
  workSeconds: number
  restSeconds: number
  totalRounds: number
  currentRound: number
  phase: 'work' | 'rest' | 'idle' | 'completed'
  isActive: boolean
  remainingSeconds?: number
  timestamp: number
}

export interface TeamQuickCue {
  id: string
  title: string
  cue: string
  category: 'cadence' | 'form' | 'effort' | 'breathing'
}

export const TEAM_QUICK_CUES: readonly TeamQuickCue[] = [
  {
    id: 'sync-cadence',
    title: 'Sync Cadence',
    cue: 'Lock into the tempo pulse together. Match the cadence on every rep.',
    category: 'cadence',
  },
  {
    id: 'chest-proud',
    title: 'Chest Up & Tall',
    cue: 'Shoulders back, chest proud. Drive eyes forward to protect cervical alignment.',
    category: 'form',
  },
  {
    id: 'ground-drive',
    title: 'Drive from Floor',
    cue: 'Drive through the floor. Full triple extension from ankles, knees, and hips.',
    category: 'form',
  },
  {
    id: 'eccentric-control',
    title: 'Control Eccentric',
    cue: 'Control the eccentric descent. Resisting the load builds joint durability.',
    category: 'cadence',
  },
  {
    id: 'diaphragmatic-breath',
    title: 'Breathe at Reset',
    cue: 'Inhale deep through the diaphragm at the reset; exhale sharply through the sticking point.',
    category: 'breathing',
  },
  {
    id: 'final-ten-seconds',
    title: 'Final 10 Seconds',
    cue: 'Final 10 seconds of this work interval! Stay locked in, finish strong!',
    category: 'effort',
  },
  {
    id: 'rest-and-recover',
    title: 'Active Recovery',
    cue: 'Rest interval active. Shake out the limbs, hydrate, and breathe.',
    category: 'breathing',
  },
] as const

/**
 * Builds default team presets from coach assigned clients when database teams are not yet provisioned.
 */
export function generateCoachDefaultTeams(
  coachId: string,
  assignedClients: Array<{ id: string; fullName: string; email?: string; sessionsRemaining?: number }> = []
): Team[] {
  const now = new Date().toISOString()

  // Format members from available assigned clients
  const allMembers: TeamMember[] = assignedClients.map((client, idx) => ({
    id: `mem-${client.id}`,
    teamId: 'team-apex-performance',
    clientId: client.id,
    fullName: client.fullName || 'Athlete',
    email: client.email || 'athlete@forge-athletic.app',
    role: idx === 0 ? 'captain' : 'athlete',
    status: 'active',
    joinedAt: now,
    sessionsRemaining: client.sessionsRemaining ?? 6,
  }))

  const splitHalf = Math.max(1, Math.ceil(allMembers.length / 2))
  const team1Members = allMembers.slice(0, splitHalf).map(m => ({ ...m, teamId: 'team-apex-performance' }))
  const team2Members = allMembers.slice(splitHalf).map(m => ({ ...m, teamId: 'team-executive-wellness' }))

  const defaultTeam1: Team = {
    id: 'team-apex-performance',
    name: 'Apex Performance Squad',
    coachId,
    description: 'High-intensity athletic conditioning, movement screening, and kinetic chain endurance.',
    sportOrFocus: 'Kinetic Conditioning & OPT Phase 2',
    maxSeats: 8,
    isActive: true,
    members: team1Members.length > 0 ? team1Members : [
      {
        id: 'mem-demo-1',
        teamId: 'team-apex-performance',
        clientId: 'demo-athlete-1',
        fullName: 'Marcus Vance',
        email: 'marcus@forge-athletic.app',
        role: 'captain',
        status: 'active',
        sessionsRemaining: 8,
      },
      {
        id: 'mem-demo-2',
        teamId: 'team-apex-performance',
        clientId: 'demo-athlete-2',
        fullName: 'Elena Rostova',
        email: 'elena@forge-athletic.app',
        role: 'athlete',
        status: 'active',
        sessionsRemaining: 6,
      },
    ],
    memberCount: team1Members.length > 0 ? team1Members.length : 2,
    createdAt: now,
  }

  const defaultTeam2: Team = {
    id: 'team-executive-wellness',
    name: 'Executive Leadership Cohort',
    coachId,
    description: 'Corporate wellness retainer cohort for mobility, postural restoration, and metabolic vigor.',
    sportOrFocus: 'Postural Restoration & Metabolic Health',
    maxSeats: 12,
    isActive: true,
    members: team2Members.length > 0 ? team2Members : [
      {
        id: 'mem-demo-3',
        teamId: 'team-executive-wellness',
        clientId: 'demo-athlete-3',
        fullName: 'David Sterling',
        email: 'sterling@acmepartners.com',
        role: 'captain',
        status: 'active',
        sessionsRemaining: 10,
      },
      {
        id: 'mem-demo-4',
        teamId: 'team-executive-wellness',
        clientId: 'demo-athlete-4',
        fullName: 'Chloe Bennett',
        email: 'cbennett@acmepartners.com',
        role: 'athlete',
        status: 'active',
        sessionsRemaining: 10,
      },
    ],
    memberCount: team2Members.length > 0 ? team2Members.length : 2,
    createdAt: now,
  }

  return [defaultTeam1, defaultTeam2]
}

/**
 * Retrieves all coaching teams assigned to a given coach.
 * Falls back dynamically to assigned client squad groupings if no custom SQL teams exist.
 */
export async function getTeamsForCoach(
  coachId: string,
  assignedClientsFallback: Array<{ id: string; fullName: string; email?: string; sessionsRemaining?: number }> = []
): Promise<Team[]> {
  try {
    const admin = supabaseAdmin()
    const { data: dbTeams, error: teamsError } = await admin
      .from('teams')
      .select('id, name, coach_id, description, sport_or_focus, max_seats, is_active, created_at')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (teamsError || !dbTeams || dbTeams.length === 0) {
      return generateCoachDefaultTeams(coachId, assignedClientsFallback)
    }

    // Load team members for each team
    const teamIds = dbTeams.map(t => t.id)
    const { data: dbMembers } = await admin
      .from('team_members')
      .select(`
        id,
        team_id,
        client_id,
        role,
        status,
        joined_at,
        clients:client_id (
          full_name,
          email
        )
      `)
      .in('team_id', teamIds)
      .eq('status', 'active')

    const membersByTeam: Record<string, TeamMember[]> = {}
    if (dbMembers) {
      dbMembers.forEach((raw: {
        id: string
        team_id: string
        client_id: string
        role: string
        status: string
        joined_at: string
        clients?: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null
      }) => {
        const clientObj = Array.isArray(raw.clients) ? raw.clients[0] : raw.clients
        const member: TeamMember = {
          id: raw.id,
          teamId: raw.team_id,
          clientId: raw.client_id,
          fullName: clientObj?.full_name || 'Athlete',
          email: clientObj?.email || '',
          role: (raw.role as 'athlete' | 'captain' | 'assistant') || 'athlete',
          status: (raw.status as 'active' | 'invited' | 'inactive') || 'active',
          joinedAt: raw.joined_at,
        }
        if (!membersByTeam[raw.team_id]) {
          membersByTeam[raw.team_id] = []
        }
        membersByTeam[raw.team_id].push(member)
      })
    }

    return dbTeams.map((t: {
      id: string
      name: string
      coach_id: string
      description?: string
      sport_or_focus?: string
      max_seats?: number
      is_active: boolean
      created_at: string
    }) => {
      const members = membersByTeam[t.id] || []
      return {
        id: t.id,
        name: t.name,
        coachId: t.coach_id,
        description: t.description || undefined,
        sportOrFocus: t.sport_or_focus || 'General Performance',
        maxSeats: t.max_seats || 12,
        isActive: t.is_active,
        members,
        memberCount: members.length,
        createdAt: t.created_at,
      }
    })
  } catch (err) {
    console.warn('Error fetching teams from Supabase, falling back to dynamic presets:', err)
    return generateCoachDefaultTeams(coachId, assignedClientsFallback)
  }
}

/**
 * Retrieves a single team by its unique identifier.
 */
export async function getTeamById(
  teamId: string,
  coachId?: string,
  assignedClientsFallback: Array<{ id: string; fullName: string; email?: string; sessionsRemaining?: number }> = []
): Promise<Team | null> {
  // Check default presets first if match
  const defaultTeams = generateCoachDefaultTeams(coachId || 'coach-scott', assignedClientsFallback)
  const matchedDefault = defaultTeams.find(t => t.id === teamId)

  try {
    const admin = supabaseAdmin()
    const { data: teamRow, error } = await admin
      .from('teams')
      .select('id, name, coach_id, description, sport_or_focus, max_seats, is_active, created_at')
      .eq('id', teamId)
      .maybeSingle()

    if (error || !teamRow) {
      return matchedDefault ?? null
    }

    const { data: dbMembers } = await admin
      .from('team_members')
      .select(`
        id,
        team_id,
        client_id,
        role,
        status,
        joined_at,
        clients:client_id (
          full_name,
          email
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'active')

    const members: TeamMember[] = (dbMembers || []).map((raw: {
      id: string
      team_id: string
      client_id: string
      role: string
      status: string
      joined_at: string
      clients?: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null
    }) => {
      const clientObj = Array.isArray(raw.clients) ? raw.clients[0] : raw.clients
      return {
        id: raw.id,
        teamId: raw.team_id,
        clientId: raw.client_id,
        fullName: clientObj?.full_name || 'Athlete',
        email: clientObj?.email || '',
        role: (raw.role as 'athlete' | 'captain' | 'assistant') || 'athlete',
        status: (raw.status as 'active' | 'invited' | 'inactive') || 'active',
        joinedAt: raw.joined_at,
      }
    })

    return {
      id: teamRow.id,
      name: teamRow.name,
      coachId: teamRow.coach_id,
      description: teamRow.description || undefined,
      sportOrFocus: teamRow.sport_or_focus || 'General Performance',
      maxSeats: teamRow.max_seats || 12,
      isActive: teamRow.is_active,
      members,
      memberCount: members.length,
      createdAt: teamRow.created_at,
    }
  } catch {
    return matchedDefault ?? null
  }
}

/**
 * Dispatches live session alert & invite to all members of a team.
 */
export async function dispatchTeamLiveSessionAlert(
  teamId: string,
  coachId: string,
  assignedClientsFallback: Array<{ id: string; fullName: string; email?: string }> = []
): Promise<{ success: boolean; notifiedCount: number; teamName: string }> {
  const team = await getTeamById(teamId, coachId, assignedClientsFallback)
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
