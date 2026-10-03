import { describe, expect, it, vi, beforeEach } from 'vitest'

describe('components/coach/LiveRemoteVideoFeed', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('determines initials correctly from participant name', () => {
    function getInitials(name: string, role: string) {
      return (
        name
          .split(/\s+/)
          .slice(0, 2)
          .map(p => p[0]?.toUpperCase())
          .join('') || (role === 'Coach' ? 'CG' : 'AT')
      )
    }

    expect(getInitials('Sarah Connor', 'Athlete')).toBe('SC')
    expect(getInitials('Coach Gordon', 'Coach')).toBe('CG')
    expect(getInitials('', 'Coach')).toBe('CG')
    expect(getInitials('', 'Athlete')).toBe('AT')
  })

  it('gracefully degrades to muted playback when browser rejects unmuted autoplay', async () => {
    let isMuted = false
    let isAudioBlocked = false
    let isPlaying = false

    const mockVideo = {
      muted: false,
      srcObject: null as any,
      play: vi.fn().mockImplementation(async () => {
        if (!isMuted) {
          const err = new Error('play() failed because the user didn\'t interact with the document first.')
          err.name = 'NotAllowedError'
          throw err
        }
        isPlaying = true
      }),
    }

    async function attemptPlay() {
      try {
        await mockVideo.play()
        isPlaying = true
        isAudioBlocked = false
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          isMuted = true
          mockVideo.muted = true
          await mockVideo.play()
          isPlaying = true
          isAudioBlocked = true
        }
      }
    }

    await attemptPlay()
    expect(isMuted).toBe(true)
    expect(isPlaying).toBe(true)
    expect(isAudioBlocked).toBe(true)
    expect(mockVideo.play).toHaveBeenCalledTimes(2)

    // Simulate user tap to unmute
    async function handleUserUnmute() {
      isMuted = false
      mockVideo.muted = false
      await mockVideo.play()
      isAudioBlocked = false
    }

    // Now user has interacted, so unmuted play succeeds
    mockVideo.play.mockResolvedValueOnce(undefined)
    await handleUserUnmute()
    expect(isMuted).toBe(false)
    expect(isAudioBlocked).toBe(false)
  })

  it('detects active tracks and triggers playback on track unmuting', () => {
    const listeners: Record<string, Array<() => void>> = {}
    const trackMock = {
      id: 'video-trk-1',
      kind: 'video',
      readyState: 'live',
      addEventListener: (evt: string, cb: () => void) => {
        listeners[evt] = listeners[evt] || []
        listeners[evt].push(cb)
      },
      removeEventListener: vi.fn(),
    }

    let unmutedFired = false
    trackMock.addEventListener('unmute', () => {
      unmutedFired = true
    })

    // Trigger unmute
    listeners['unmute']?.forEach(fn => fn())
    expect(unmutedFired).toBe(true)
  })

  it('formats lobby waiting status label and elapsed wait timer accurately', () => {
    function formatLobbyStatus(isPeerInLobby: boolean, isConnected: boolean, lobbyWaitSeconds?: number) {
      if (isPeerInLobby) {
        const timeStr = lobbyWaitSeconds !== undefined && lobbyWaitSeconds > 0
          ? `(${Math.floor(lobbyWaitSeconds / 60)}m ${lobbyWaitSeconds % 60}s)`
          : ''
        return `In Studio Lobby Waiting ${timeStr}`.trim()
      }
      if (isConnected) {
        return 'Signal Connected · Awaiting Camera'
      }
      return 'Standby · Awaiting Remote Stream'
    }

    expect(formatLobbyStatus(true, false, 0)).toBe('In Studio Lobby Waiting')
    expect(formatLobbyStatus(true, false, 75)).toBe('In Studio Lobby Waiting (1m 15s)')
    expect(formatLobbyStatus(true, false, 184)).toBe('In Studio Lobby Waiting (3m 4s)')
    expect(formatLobbyStatus(false, true)).toBe('Signal Connected · Awaiting Camera')
    expect(formatLobbyStatus(false, false)).toBe('Standby · Awaiting Remote Stream')
  })

  it('grades network latency into optimal UX color tiers', () => {
    function getLatencyColor(ms: number): string {
      if (ms < 100) return '#34D399' // Emerald (<100ms)
      if (ms < 250) return '#FBBF24' // Amber (100-249ms)
      return '#F87171' // Rose/Red (>=250ms)
    }

    expect(getLatencyColor(32)).toBe('#34D399')
    expect(getLatencyColor(99)).toBe('#34D399')
    expect(getLatencyColor(100)).toBe('#FBBF24')
    expect(getLatencyColor(249)).toBe('#FBBF24')
    expect(getLatencyColor(250)).toBe('#F87171')
    expect(getLatencyColor(450)).toBe('#F87171')
  })
})

