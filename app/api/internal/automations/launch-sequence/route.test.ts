import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const dispatchDueLaunchAutomationsMock = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({}),
}))

vi.mock('@/lib/automations/launchSequence', () => ({
  dispatchDueLaunchAutomations: (...args: unknown[]) => dispatchDueLaunchAutomationsMock(...args),
}))

describe('/api/internal/automations/launch-sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.INTERNAL_CRON_SECRET = 'test-cron-secret'
  })

  it('rejects missing or invalid cron secrets with 401', async () => {
    const req = new NextRequest(
      'https://forge-athletic.app/api/internal/automations/launch-sequence'
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(dispatchDueLaunchAutomationsMock).not.toHaveBeenCalled()
  })

  it('dispatches due launch automations on authorized POST with dryRun and simulatedNowIso', async () => {
    dispatchDueLaunchAutomationsMock.mockResolvedValueOnce({
      evaluatedNowIso: '2026-11-20T11:00:00.000Z',
      dryRun: true,
      sentEmails: 50,
      sentSms: 32,
      suppressed: 0,
      skippedSchedule: 0,
      skippedDuplicate: 0,
      errors: [],
    })

    const req = new NextRequest(
      'https://forge-athletic.app/api/internal/automations/launch-sequence',
      {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-cron-secret',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          simulatedNowIso: '2026-11-20T06:00:00-05:00',
          onlyTemplates: ['launch_01a_sms', 'launch_01b_email'],
        }),
      }
    )

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.sentEmails).toBe(50)
    expect(json.sentSms).toBe(32)
    expect(dispatchDueLaunchAutomationsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dryRun: true,
        onlyTemplates: ['launch_01a_sms', 'launch_01b_email'],
      })
    )
  })
})

