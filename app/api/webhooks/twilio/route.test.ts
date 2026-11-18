import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const supabaseAdminMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

import { POST } from './route'
import { parseInboundSmsIntent } from '@/lib/sms'

describe('Twilio Inbound SMS Webhook (/api/webhooks/twilio)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('recognizes standard TCPA keywords AND FCC 2024 natural-language opt-out phrases', () => {
    expect(parseInboundSmsIntent('STOP')).toBe('opt_out')
    expect(parseInboundSmsIntent('stop all')).toBe('opt_out')
    expect(parseInboundSmsIntent('Revoke')).toBe('opt_out')
    expect(parseInboundSmsIntent('Please stop texting me')).toBe('opt_out')
    expect(parseInboundSmsIntent("don't text this number")).toBe('opt_out')
    expect(parseInboundSmsIntent('take me off your list')).toBe('opt_out')
    expect(parseInboundSmsIntent('START')).toBe('opt_in')
    expect(parseInboundSmsIntent('PASS')).toBe('pass')
    expect(parseInboundSmsIntent('HELP')).toBe('help')
  })

  it('suppresses notification_preferences, waitlist, and sms_suppressions and returns TwiML confirmation on opt-out', async () => {
    const upsertedSuppressions: unknown[] = []
    const waitlistUpdates: unknown[] = []
    const prefsUpdates: unknown[] = []
    const queueUpdates: unknown[] = []

    supabaseAdminMock.mockReturnValue({
      from: (table: string) => {
        if (table === 'sms_suppressions') {
          return {
            upsert: async (row: unknown) => {
              upsertedSuppressions.push(row)
              return { error: null }
            },
          }
        }
        if (table === 'notification_preferences') {
          return {
            update: (row: unknown) => {
              prefsUpdates.push(row)
              return { eq: async () => ({ error: null }) }
            },
          }
        }
        if (table === 'waitlist') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { email: 'lead@example.com' }, error: null }),
              }),
            }),
            update: (row: unknown) => {
              waitlistUpdates.push(row)
              return { eq: async () => ({ error: null }) }
            },
          }
        }
        if (table === 'marketing_email_queue') {
          return {
            update: (row: unknown) => {
              queueUpdates.push(row)
              return {
                eq: () => ({
                  eq: () => ({
                    eq: async () => ({ error: null }),
                  }),
                }),
              }
            },
          }
        }
        return {}
      },
    })

    const body = new URLSearchParams({
      From: '(617) 555-0199',
      Body: 'Please stop texting me',
    }).toString()

    const req = new NextRequest('http://localhost:3000/api/webhooks/twilio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const xml = await res.text()
    expect(xml).toContain('You are opted out and will receive no further text messages')
    expect(upsertedSuppressions).toHaveLength(1)
    expect(prefsUpdates[0]).toMatchObject({ sms_enabled: false })
    expect(waitlistUpdates[0]).toMatchObject({ sms_opt_in: false })
    expect(queueUpdates[0]).toMatchObject({ status: 'cancelled' })
  })
})
