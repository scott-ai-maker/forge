import { describe, expect, it, vi } from 'vitest'
import {
  normalizeClientEmail,
  normalizeClientPhone,
  validateStatusTransition,
  validateClientUniqueness,
  transitionClientStatus,
  getClientLifecycleAuditTrail,
  ClientLifecycleError,
  type ClientStatus,
} from '@/lib/client-lifecycle'

describe('client-lifecycle engine', () => {
  describe('normalization helpers', () => {
    it('normalizes emails to lowercase trimmed strings', () => {
      expect(normalizeClientEmail('  Athlete.Gordon@Outlook.COM  ')).toBe('athlete.gordon@outlook.com')
      expect(normalizeClientEmail(null)).toBe('')
      expect(normalizeClientEmail(undefined)).toBe('')
    })

    it('normalizes phone numbers to pure digits and plus prefix', () => {
      expect(normalizeClientPhone('+1 (555) 234-5678')).toBe('+15552345678')
      expect(normalizeClientPhone('555.234.5678')).toBe('5552345678')
      expect(normalizeClientPhone(null)).toBe('')
    })
  })

  describe('validateStatusTransition', () => {
    it('allows valid activation transitions', () => {
      const result = validateStatusTransition('inactive', 'active', 'reactivation_approved')
      expect(result.valid).toBe(true)
      expect(result.reasonDef.code).toBe('reactivation_approved')
    })

    it('allows valid pause transition with notes when required', () => {
      const result = validateStatusTransition(
        'active',
        'paused',
        'injury_medical_leave',
        'Grade 2 hamstring strain during sprint session'
      )
      expect(result.valid).toBe(true)
      expect(result.reasonDef.category).toBe('pause')
    })

    it('throws error when required notes are missing', () => {
      expect(() =>
        validateStatusTransition('active', 'paused', 'injury_medical_leave', '')
      ).toThrow(ClientLifecycleError)
    })

    it('throws error when reason code does not match target status category', () => {
      expect(() =>
        validateStatusTransition('active', 'active', 'injury_medical_leave')
      ).toThrow(/cannot be used for transitioning/)
    })

    it('throws error for unknown reason codes or invalid statuses', () => {
      expect(() =>
        validateStatusTransition('active', 'invalid_status' as ClientStatus, 'new_enrollment')
      ).toThrow(ClientLifecycleError)

      expect(() =>
        validateStatusTransition('active', 'paused', 'unknown_code')
      ).toThrow(ClientLifecycleError)
    })

    it('rejects no-op transitions', () => {
      expect(() =>
        validateStatusTransition('active', 'active', 'new_enrollment')
      ).toThrowError(expect.objectContaining({ code: 'NO_OP_TRANSITION' }))
    })
  })

  describe('validateClientUniqueness (anti-duplicity)', () => {
    it('returns unique when no duplicate exists', async () => {
      const adminMock = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }

      const result = await validateClientUniqueness(adminMock, 'unique.athlete@example.com')
      expect(result.isUnique).toBe(true)
    })

    it('detects duplicate email collision', async () => {
      const adminMock = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'client-existing',
                  email: 'athlete@example.com',
                  full_name: 'Existing Athlete',
                  status: 'active',
                  designated_coach_id: 'coach-1',
                },
                error: null,
              }),
            }),
          }),
        }),
      }

      const result = await validateClientUniqueness(adminMock, 'ATHLETE@example.com')
      expect(result.isUnique).toBe(false)
      expect(result.duplicateField).toBe('email')
      expect(result.existingClient?.id).toBe('client-existing')
    })
  })

  describe('transitionClientStatus & audit trail', () => {
    it('executes atomic update and inserts audit log', async () => {
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'audit-log-1',
              client_id: 'client-1',
              actor_id: 'coach-1',
              action: 'pause',
              previous_status: 'active',
              new_status: 'paused',
              reason_code: 'travel_freeze',
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
        }),
      })

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'client-1',
                email: 'athlete@example.com',
                full_name: 'Test Athlete',
                status: 'paused',
                status_reason: 'Travel / Vacation Freeze',
                status_updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      })

      const adminMock = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'client-1',
                      email: 'athlete@example.com',
                      full_name: 'Test Athlete',
                      status: 'active',
                      designated_coach_id: 'coach-1',
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            }
          }
          if (table === 'client_lifecycle_audit_logs') {
            return {
              insert: insertMock,
            }
          }
          return {}
        }),
      }

      const result = await transitionClientStatus(adminMock, {
        clientId: 'client-1',
        coachId: 'coach-1',
        coachName: 'Scott Gordon',
        newStatus: 'paused',
        reasonCode: 'travel_freeze',
        reasonNotes: 'Olympic trials travel freeze',
      })

      expect(result.success).toBe(true)
      expect(result.client.status).toBe('paused')
      expect(updateMock).toHaveBeenCalled()
      expect(insertMock).toHaveBeenCalled()
    })

    it('rejects a coach who is not assigned to the client before updating or auditing', async () => {
      const updateMock = vi.fn()
      const insertMock = vi.fn()
      const adminMock = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'client-1',
                      email: 'athlete@example.com',
                      full_name: 'Test Athlete',
                      status: 'active',
                      designated_coach_id: 'coach-2',
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            }
          }
          return { insert: insertMock }
        }),
      }

      await expect(
        transitionClientStatus(adminMock, {
          clientId: 'client-1',
          coachId: 'coach-1',
          newStatus: 'paused',
          reasonCode: 'travel_freeze',
        })
      ).rejects.toThrowError(expect.objectContaining({ code: 'CLIENT_NOT_ASSIGNED' }))
      expect(updateMock).not.toHaveBeenCalled()
      expect(insertMock).not.toHaveBeenCalled()
    })

    it('rejects no-op transitions before updating or auditing', async () => {
      const updateMock = vi.fn()
      const insertMock = vi.fn()
      const adminMock = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'clients') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'client-1',
                      email: 'athlete@example.com',
                      full_name: 'Test Athlete',
                      status: 'active',
                      designated_coach_id: 'coach-1',
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateMock,
            }
          }
          return { insert: insertMock }
        }),
      }

      await expect(
        transitionClientStatus(adminMock, {
          clientId: 'client-1',
          coachId: 'coach-1',
          newStatus: 'active',
          reasonCode: 'new_enrollment',
        })
      ).rejects.toThrowError(expect.objectContaining({ code: 'NO_OP_TRANSITION' }))
      expect(updateMock).not.toHaveBeenCalled()
      expect(insertMock).not.toHaveBeenCalled()
    })

    it('retrieves audit trail history for client', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          client_id: 'client-1',
          actor_name: 'Scott Gordon',
          action: 'activation',
          previous_status: 'inactive',
          new_status: 'active',
          reason_code: 'reactivation_approved',
          created_at: new Date().toISOString(),
        },
      ]

      const adminMock = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockLogs,
                error: null,
              }),
            }),
          }),
        }),
      }

      const logs = await getClientLifecycleAuditTrail(adminMock, 'client-1')
      expect(logs.length).toBe(1)
      expect(logs[0].reason_code).toBe('reactivation_approved')
    })
  })
})
