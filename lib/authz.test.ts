import { describe, expect, it, vi } from 'vitest'

const { supabaseAdminMock } = vi.hoisted(() => ({
  supabaseAdminMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { AuthzError, requireCoachAssignedClient, requireRole, requireActiveClient } from '@/lib/authz'

describe('authorization helpers', () => {
  it('allows listed roles', () => {
    expect(() => requireRole('coach', ['coach'])).not.toThrow()
  })

  it('rejects disallowed roles', () => {
    expect(() => requireRole('client', ['coach'])).toThrow(AuthzError)
  })

  it('allows active clients', () => {
    expect(() =>
      requireActiveClient({
        id: 'client-1',
        role: 'client',
        email: 'test@example.com',
        status: 'active',
        designated_coach_id: 'coach-1',
      })
    ).not.toThrow()
  })

  it('rejects paused or inactive clients', () => {
    expect(() =>
      requireActiveClient({
        id: 'client-1',
        role: 'client',
        email: 'test@example.com',
        status: 'paused',
        designated_coach_id: 'coach-1',
      })
    ).toThrow(AuthzError)

    expect(() =>
      requireActiveClient({
        id: 'client-1',
        role: 'client',
        email: 'test@example.com',
        status: 'inactive',
        designated_coach_id: 'coach-1',
      })
    ).toThrow(AuthzError)
  })

  it('allows assigned coach/client pairs', async () => {
    supabaseAdminMock.mockReturnValue({
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({ data: { id: 'client-1' } }),
                    }
                  },
                }
              },
            }
          },
        }
      },
    })

    await expect(requireCoachAssignedClient('coach-1', 'client-1')).resolves.toBeUndefined()
  })

  it('rejects unassigned coach/client pairs', async () => {
    supabaseAdminMock.mockReturnValue({
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      maybeSingle: async () => ({ data: null }),
                    }
                  },
                }
              },
            }
          },
        }
      },
    })

    await expect(requireCoachAssignedClient('coach-1', 'client-1')).rejects.toMatchObject({ status: 403 })
  })

  it('ensures getRequestAuthz uses DB role and does not allow metadata to escalate role to coach', async () => {
    const updateUserByIdMock = vi.fn().mockResolvedValue({ data: {}, error: null })
    supabaseAdminMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-attacker',
              email: 'attacker@example.com',
              user_metadata: { surface_role: 'coach' }, // Attacker set this in metadata!
            },
          },
          error: null,
        }),
        admin: {
          updateUserById: updateUserByIdMock,
        },
      },
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: {
                      id: 'user-attacker',
                      role: 'client', // DB role is client
                      email: 'attacker@example.com',
                      status: 'active',
                      designated_coach_id: null,
                    },
                  }),
                }
              },
            }
          },
        }
      },
    })

    const { getRequestAuthz } = await import('@/lib/authz')
    const { NextRequest } = await import('next/server')
    const req = new NextRequest('http://localhost/api/test', {
      headers: { authorization: 'Bearer test-token' },
    })

    const authz = await getRequestAuthz(req)
    // The resolved role must remain 'client' and NOT become 'coach'
    expect(authz.client.role).toBe('client')
    expect(updateUserByIdMock).toHaveBeenCalledWith('user-attacker', {
      user_metadata: {
        surface_role: 'client',
      },
    })
  })
})