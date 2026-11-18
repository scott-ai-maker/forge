import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AuthzError } from '@/lib/authz'

const {
  getRequestAuthzMock,
  subscriptionsListMock,
  subscriptionsCancelMock,
  customerDeleteMock,
  deleteVitalUserMock,
  storageRemoveByBucket,
  deletedTables,
  referralUpdateEqMock,
  smsSuppressionUpsertMock,
  adminUpdateMock,
  adminDeleteUserMock,
  transitionClientStatusMock,
  auditInsertMock,
  auditUpdateEqMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  subscriptionsListMock: vi.fn(),
  subscriptionsCancelMock: vi.fn(),
  customerDeleteMock: vi.fn(),
  deleteVitalUserMock: vi.fn(),
  storageRemoveByBucket: {
    'fitness-photos': vi.fn().mockResolvedValue({ data: [], error: null }),
    'coach-voice-notes': vi.fn().mockResolvedValue({ data: [], error: null }),
  } as Record<string, ReturnType<typeof vi.fn>>,
  deletedTables: [] as Array<{ table: string; col: string; val: string }>,
  referralUpdateEqMock: vi.fn().mockResolvedValue({ error: null }),
  smsSuppressionUpsertMock: vi.fn().mockResolvedValue({ error: null }),
  adminUpdateMock: vi.fn(),
  adminDeleteUserMock: vi.fn(),
  transitionClientStatusMock: vi.fn(),
  auditInsertMock: vi.fn(),
  auditUpdateEqMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/vital-health-bridge', () => ({
  deleteVitalUser: deleteVitalUserMock,
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      list: vi.fn().mockResolvedValue({ data: [{ id: 'cus_client_1' }] }),
      del: customerDeleteMock,
    },
    subscriptions: {
      list: subscriptionsListMock,
      cancel: subscriptionsCancelMock,
    },
  },
}))

vi.mock('@/lib/client-lifecycle', () => ({
  transitionClientStatus: transitionClientStatusMock,
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: vi.fn(() => ({
    storage: {
      from: vi.fn((bucket: string) => ({
        list: vi.fn().mockImplementation(async (prefix: string) => ({
          data:
            bucket === 'fitness-photos'
              ? [{ name: 'bodycomp-123.jpg' }, { name: 'posture-front.jpg' }]
              : bucket === 'coach-voice-notes'
              ? [{ name: 'voice_999.mp4' }]
              : [],
          error: null,
          prefix,
        })),
        remove: storageRemoveByBucket[bucket] ?? vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'client_intake_forms') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  consent_liability_waiver: true,
                  consent_informed_consent: true,
                  consent_coaching_agreement: true,
                  consent_signature_name: 'Marcus Vance',
                  consent_signed_at: '2026-10-01T12:00:00Z',
                  parq_any_yes: false,
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'legal_consent_audit_log') {
        return {
          insert: auditInsertMock,
          update: vi.fn().mockReturnValue({
            eq: auditUpdateEqMock,
          }),
        }
      }
      if (table === 'fitness_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { before_photo_path: 'client-del-1/before.jpg' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'progress_photos') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ photo_url: 'client-del-1/progress-wk4.jpg' }],
              error: null,
            }),
          }),
        }
      }
      if (table === 'body_composition_analyses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ photo_data_url: 'client-del-1/bodycomp-db.jpg' }],
              error: null,
            }),
          }),
        }
      }
      if (table === 'coach_client_messages') {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({
              data: [{ message_body: '[voice-note]:12:client-del-1/msg_voice_1.mp4' }],
              error: null,
            }),
          }),
        }
      }
      if (table === 'coaching_applications' || table === 'waitlist' || table === 'marketing_email_queue') {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn(async (col: string, val: string) => {
              deletedTables.push({ table, col, val })
              return { error: null }
            }),
          }),
        }
      }
      if (table === 'referral_attributions') {
        return {
          update: vi.fn().mockReturnValue({
            eq: referralUpdateEqMock,
          }),
        }
      }
      if (table === 'sms_suppressions') {
        return {
          upsert: smsSuppressionUpsertMock,
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                email: 'client@example.com',
                phone: '+16175550199',
                avatar_path: 'client-del-1/avatar.jpg',
                stripe_customer_id: 'cus_client_1',
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: adminUpdateMock,
        }),
      }
    }),
    auth: {
      admin: {
        deleteUser: adminDeleteUserMock,
      },
    },
  })),
}))

import { DELETE } from './route'

describe('DELETE /api/account/delete (#22 Complete Account & Biometric Destruction)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deletedTables.length = 0
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123')
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-del-1', email: 'client@example.com' },
      client: { role: 'client', email: 'client@example.com' },
    })
    adminUpdateMock.mockResolvedValue({ error: null })
    adminDeleteUserMock.mockResolvedValue({ error: null })
    auditInsertMock.mockResolvedValue({ error: null })
    auditUpdateEqMock.mockResolvedValue({ error: null })
    customerDeleteMock.mockResolvedValue({ id: 'cus_client_1', deleted: true })
    deleteVitalUserMock.mockResolvedValue({ deleted: true })
    subscriptionsListMock.mockResolvedValue({
      data: [
        { id: 'sub_active_1', status: 'active' },
        { id: 'sub_trial_2', status: 'trialing' },
      ],
    })
    subscriptionsCancelMock.mockResolvedValue({ id: 'sub_canceled' })
    transitionClientStatusMock.mockResolvedValue({ success: true })
  })

  it('rejects unauthenticated requests with 401', async () => {
    getRequestAuthzMock.mockRejectedValueOnce(new AuthzError('Unauthorized', 401))
    const req = new NextRequest('http://localhost:3000/api/account/delete', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('purges private Storage media, deletes Stripe Customer & Vital user, scrubs email/phone rows, and deletes auth user', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/delete', { method: 'DELETE' })
    const res = await DELETE(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.deleted).toBe(true)

    // 1. Stripe subscriptions cancelled + Stripe Customer permanently deleted
    expect(subscriptionsCancelMock).toHaveBeenCalledWith('sub_active_1')
    expect(subscriptionsCancelMock).toHaveBeenCalledWith('sub_trial_2')
    expect(customerDeleteMock).toHaveBeenCalledWith('cus_client_1')

    // 2. Vital wearable user deleted
    expect(deleteVitalUserMock).toHaveBeenCalledWith('client-del-1')

    // 3. Private Storage media purged across fitness-photos & coach-voice-notes BEFORE auth cascade
    expect(storageRemoveByBucket['fitness-photos']).toHaveBeenCalledWith(
      expect.arrayContaining([
        'client-del-1/avatar.jpg',
        'client-del-1/before.jpg',
        'client-del-1/progress-wk4.jpg',
        'client-del-1/bodycomp-db.jpg',
        'client-del-1/bodycomp-123.jpg',
        'client-del-1/posture-front.jpg',
      ])
    )
    expect(storageRemoveByBucket['coach-voice-notes']).toHaveBeenCalledWith(
      expect.arrayContaining(['client-del-1/msg_voice_1.mp4', 'client-del-1/voice_999.mp4'])
    )

    // 4. Email & phone-keyed tables scrubbed + SMS suppressed
    expect(deletedTables).toEqual(
      expect.arrayContaining([
        { table: 'coaching_applications', col: 'email', val: 'client@example.com' },
        { table: 'waitlist', col: 'email', val: 'client@example.com' },
        { table: 'marketing_email_queue', col: 'email', val: 'client@example.com' },
        { table: 'waitlist', col: 'phone', val: '+16175550199' },
      ])
    )
    expect(referralUpdateEqMock).toHaveBeenCalledWith('referee_email', 'client@example.com')
    expect(referralUpdateEqMock).toHaveBeenCalledWith('referee_id', 'client-del-1')
    expect(smsSuppressionUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+16175550199', reason: 'account_deleted' }),
      { onConflict: 'phone' }
    )

    // 5. Pseudonymized waiver defense proof preserved + auth user deleted
    expect(auditInsertMock).toHaveBeenCalledTimes(1)
    expect(auditUpdateEqMock).toHaveBeenCalledWith('user_id', 'client-del-1')
    expect(transitionClientStatusMock).toHaveBeenCalled()
    expect(adminDeleteUserMock).toHaveBeenCalledWith('client-del-1')
  })

  it('exposes self-serve DeleteAccountSection UI inside ClientSettingsStudio', () => {
    const repoRoot = process.cwd()
    const settingsSrc = fs.readFileSync(
      path.join(repoRoot, 'components/settings/ClientSettingsStudio.tsx'),
      'utf8'
    )
    const deleteUiSrc = fs.readFileSync(
      path.join(repoRoot, 'components/settings/DeleteAccountSection.tsx'),
      'utf8'
    )
    expect(settingsSrc).toContain('<DeleteAccountSection')
    expect(deleteUiSrc).toContain("fetch('/api/account/delete'")
    expect(deleteUiSrc).toContain("method: 'DELETE'")
  })
})
