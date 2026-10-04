import { describe, expect, it } from 'vitest'
import { CLIENT_PRIMARY_NAV, isClientPrimaryNavItemActive } from './client-primary-navigation'

describe('client primary navigation', () => {
  it('presents four destinations aligned with the core member journey', () => {
    expect(CLIENT_PRIMARY_NAV.map(item => item.label)).toEqual(['Today', 'Train', 'Progress', 'Coach'])
    expect(new Set(CLIENT_PRIMARY_NAV.map(item => item.href)).size).toBe(4)
  })

  it('keeps the training destination active for specialist workspaces', () => {
    expect(isClientPrimaryNavItemActive('training', '/dashboard/fitness', 'readiness')).toBe(true)
    expect(isClientPrimaryNavItemActive('progress', '/dashboard/fitness', 'readiness')).toBe(false)
  })

  it('routes progress and coaching surfaces to their matching destinations', () => {
    expect(isClientPrimaryNavItemActive('progress', '/dashboard/fitness', 'progress')).toBe(true)
    expect(isClientPrimaryNavItemActive('progress', '/dashboard/dossier', null)).toBe(true)
    expect(isClientPrimaryNavItemActive('coach', '/dashboard/fitness', 'coach')).toBe(true)
    expect(isClientPrimaryNavItemActive('coach', '/dashboard/messages', null)).toBe(true)
    expect(isClientPrimaryNavItemActive('today', '/dashboard', null)).toBe(true)
  })
})
