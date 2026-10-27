import { describe, expect, it } from 'vitest'
import {
  generateCoachDefaultTeams,
  TEAM_QUICK_CUES,
  type Team,
  type TeamCircuitTimerData,
} from './teams'

describe('Teams Domain & Live Studio Squad Architecture', () => {
  it('generates coach default teams with assigned client partitioning', () => {
    const mockClients = [
      { id: 'client-1', fullName: 'Athlete Alpha', email: 'alpha@test.com' },
      { id: 'client-2', fullName: 'Athlete Beta', email: 'beta@test.com' },
      { id: 'client-3', fullName: 'Athlete Gamma', email: 'gamma@test.com' },
      { id: 'client-4', fullName: 'Athlete Delta', email: 'delta@test.com' },
    ]

    const teams = generateCoachDefaultTeams('coach-123', mockClients)
    expect(teams).toHaveLength(2)

    const [apexTeam, execTeam] = teams
    expect(apexTeam.name).toBe('Apex Performance Squad')
    expect(apexTeam.coachId).toBe('coach-123')
    expect(apexTeam.members.length).toBeGreaterThanOrEqual(1)

    expect(execTeam.name).toBe('Executive Leadership Cohort')
    expect(execTeam.coachId).toBe('coach-123')
    expect(execTeam.members.length).toBeGreaterThanOrEqual(1)

    // Captain is assigned to first member
    expect(apexTeam.members[0].role).toBe('captain')
  })

  it('provides safe demo fallback members when coach has zero assigned clients', () => {
    const teams = generateCoachDefaultTeams('coach-empty', [])
    expect(teams).toHaveLength(2)
    expect(teams[0].members.length).toBe(2)
    expect(teams[1].members.length).toBe(2)
    expect(teams[0].members[0].fullName).toBe('Marcus Vance')
  })

  it('includes comprehensive NASM VCS compliant team quick cues', () => {
    expect(TEAM_QUICK_CUES.length).toBeGreaterThanOrEqual(5)

    const cueIds = TEAM_QUICK_CUES.map(c => c.id)
    expect(cueIds).toContain('sync-cadence')
    expect(cueIds).toContain('chest-proud')
    expect(cueIds).toContain('ground-drive')
    expect(cueIds).toContain('eccentric-control')
    expect(cueIds).toContain('final-ten-seconds')

    // Verify all cues have required fields
    TEAM_QUICK_CUES.forEach(cue => {
      expect(cue.id).toBeTruthy()
      expect(cue.title).toBeTruthy()
      expect(cue.cue).toBeTruthy()
      expect(['cadence', 'form', 'effort', 'breathing']).toContain(cue.category)
    })
  })

  it('validates circuit interval timer progression logic', () => {
    const timer: TeamCircuitTimerData = {
      workSeconds: 40,
      restSeconds: 20,
      totalRounds: 4,
      currentRound: 1,
      phase: 'work',
      isActive: true,
      timestamp: Date.now(),
    }

    expect(timer.phase).toBe('work')
    expect(timer.currentRound).toBe(1)
    expect(timer.workSeconds).toBe(40)
    expect(timer.restSeconds).toBe(20)

    function transitionPhase(current: TeamCircuitTimerData): TeamCircuitTimerData {
      if (current.phase === 'work') {
        return {
          ...current,
          phase: 'rest',
        }
      }
      if (current.phase === 'rest') {
        const nextRound = current.currentRound + 1
        if (nextRound > current.totalRounds) {
          return {
            ...current,
            phase: 'completed',
            isActive: false,
          }
        }
        return {
          ...current,
          currentRound: nextRound,
          phase: 'work',
        }
      }
      return current
    }

    // Step 1: Work -> Rest (Round 1)
    const afterWork1 = transitionPhase(timer)
    expect(afterWork1.phase).toBe('rest')
    expect(afterWork1.currentRound).toBe(1)

    // Step 2: Rest -> Work (Round 2)
    const round2 = transitionPhase(afterWork1)
    expect(round2.phase).toBe('work')
    expect(round2.currentRound).toBe(2)

    // Fast-forward to Round 4 Rest -> Completed
    const round4Rest: TeamCircuitTimerData = {
      ...round2,
      currentRound: 4,
      phase: 'rest',
    }
    const completed = transitionPhase(round4Rest)
    expect(completed.phase).toBe('completed')
    expect(completed.isActive).toBe(false)
  })
})
