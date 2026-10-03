import { describe, expect, it } from 'vitest'
import { assignClientToCoach, releaseClientFromCoach } from '@/lib/coach-assignments'
import type { CoachAssignmentsAdmin } from '@/lib/coach-assignments'

type CoachAssignableClient = {
  id: string
  role: string | null
  designated_coach_id: string | null
  full_name: string | null
  email: string | null
}

function createAssignAdmin(options: {
  targetClient: CoachAssignableClient | null
  updatedClient?: CoachAssignableClient | null
  updateError?: { message: string } | null
}): CoachAssignmentsAdmin {
  const targetMaybeSingle = async () => ({ data: options.targetClient })
  const updatedMaybeSingle = async () => ({
    data: options.updatedClient ?? null,
    error: options.updateError ?? null,
  })

  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: targetMaybeSingle,
              }
            },
          }
        },
        update() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    is() {
                      return {
                        select() {
                          return {
                            maybeSingle: updatedMaybeSingle,
                          }
                        },
                      }
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
  } as CoachAssignmentsAdmin
}

function createReleaseAdmin(options: {
  targetClient: CoachAssignableClient | null
  updatedClient?: CoachAssignableClient | null
  updateError?: { message: string } | null
}): CoachAssignmentsAdmin {
  const targetMaybeSingle = async () => ({ data: options.targetClient })
  const updatedMaybeSingle = async () => ({
    data: options.updatedClient ?? null,
    error: options.updateError ?? null,
  })

  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: targetMaybeSingle,
              }
            },
          }
        },
        update() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    select() {
                      return {
                        maybeSingle: updatedMaybeSingle,
                      }
                    },
                  }
                },
              }
            },
          }
        },
      }
    },
  } as CoachAssignmentsAdmin
}

describe('coach assignment logic', () => {
  it('assigns an unassigned client to the coach', async () => {
    const client = await assignClientToCoach(
      createAssignAdmin({
        targetClient: { id: 'client-1', role: 'client', designated_coach_id: null, full_name: 'Client', email: 'c@example.com' },
        updatedClient: { id: 'client-1', role: 'client', designated_coach_id: 'coach-1', full_name: 'Client', email: 'c@example.com' },
      }),
      'client-1',
      'coach-1'
    )

    expect(client.designated_coach_id).toBe('coach-1')
  })

  it('rejects assignment when client belongs to another coach', async () => {
    await expect(
      assignClientToCoach(
        createAssignAdmin({
          targetClient: { id: 'client-1', role: 'client', designated_coach_id: 'coach-2', full_name: 'Client', email: 'c@example.com' },
        }),
        'client-1',
        'coach-1'
      )
    ).rejects.toMatchObject({ status: 409 })
  })

  it('releases only a client assigned to the current coach', async () => {
    const client = await releaseClientFromCoach(
      createReleaseAdmin({
        targetClient: { id: 'client-1', role: 'client', designated_coach_id: 'coach-1', full_name: 'Client', email: 'c@example.com' },
        updatedClient: { id: 'client-1', role: 'client', designated_coach_id: null, full_name: 'Client', email: 'c@example.com' },
      }),
      'client-1',
      'coach-1'
    )

    expect(client.designated_coach_id).toBeNull()
  })

  it('rejects release when the client is assigned to another coach', async () => {
    await expect(
      releaseClientFromCoach(
        createReleaseAdmin({
          targetClient: { id: 'client-1', role: 'client', designated_coach_id: 'coach-2', full_name: 'Client', email: 'c@example.com' },
        }),
        'client-1',
        'coach-1'
      )
    ).rejects.toMatchObject({ status: 403 })
  })
})