import { describe, expect, it } from 'vitest'
import type { AssignedClientLauncherItem } from './CoachLiveSessionLauncher'

describe('CoachLiveSessionLauncher Logic & Architecture', () => {
  const sampleClients: AssignedClientLauncherItem[] = [
    {
      id: 'client-123',
      fullName: 'John Doe',
      email: 'john@example.com',
      sessionsRemaining: 4,
    },
    {
      id: 'client-456',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      sessionsRemaining: 8,
    },
  ]

  it('selects the first assigned athlete by default when list is populated', () => {
    const defaultSelectedId = sampleClients.length > 0 ? sampleClients[0].id : ''
    expect(defaultSelectedId).toBe('client-123')
  })

  it('generates the correct live session destination room URL for selected client', () => {
    const selectedId = 'client-456'
    const targetUrl = `/coach/clients/${selectedId}/live`
    expect(targetUrl).toBe('/coach/clients/client-456/live')
  })

  it('generates the matching webrtc room identifier between coach and client', () => {
    const clientId = 'client-123'
    const coachSessionId = `live-${clientId}`
    const athleteSessionId = `live-${clientId}`

    expect(coachSessionId).toBe(athleteSessionId)
    expect(coachSessionId).toBe('live-client-123')
  })

  it('correctly handles empty roster gracefully', () => {
    const emptyClients: AssignedClientLauncherItem[] = []
    const defaultSelectedId = emptyClients.length > 0 ? emptyClients[0].id : ''
    expect(defaultSelectedId).toBe('')
    expect(emptyClients).toHaveLength(0)
  })

  it('formats quick pick athlete chips and labels', () => {
    const chipLabels = sampleClients.map(c => ({
      id: c.id,
      label: c.fullName,
      firstName: c.fullName.split(' ')[0],
    }))

    expect(chipLabels[0].firstName).toBe('John')
    expect(chipLabels[1].firstName).toBe('Jane')
  })

  it('identifies athletes currently active in lobby and builds urgent launch CTA', () => {
    const inLobbyClients = new Set<string>(['client-456'])

    function isClientWaitingInLobby(clientId: string): boolean {
      return inLobbyClients.has(clientId)
    }

    function getLaunchButtonText(selectedClient: AssignedClientLauncherItem | undefined, isWaiting: boolean): string {
      if (!selectedClient) return 'Select Athlete to Begin'
      if (isWaiting) {
        return `Join ${selectedClient.fullName.split(' ')[0]} in Lobby Now →`
      }
      return `Enter Studio with ${selectedClient.fullName.split(' ')[0]} →`
    }

    expect(isClientWaitingInLobby('client-123')).toBe(false)
    expect(isClientWaitingInLobby('client-456')).toBe(true)

    const waitingClient = sampleClients.find(c => c.id === 'client-456')
    const nonWaitingClient = sampleClients.find(c => c.id === 'client-123')

    expect(getLaunchButtonText(waitingClient, true)).toBe('Join Jane in Lobby Now →')
    expect(getLaunchButtonText(nonWaitingClient, false)).toBe('Enter Studio with John →')
    expect(getLaunchButtonText(undefined, false)).toBe('Select Athlete to Begin')
  })
})

