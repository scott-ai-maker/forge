import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  getRequestAuthzMock,
  supabaseAdminMock,
  getOrCreateClientReferralCodeMock,
  resendSendMock,
} = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
  getOrCreateClientReferralCodeMock: vi.fn(),
  resendSendMock: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = {
      send: resendSendMock,
    }
  },
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/referrals', () => ({
  getOrCreateClientReferralCode: getOrCreateClientReferralCodeMock,
}))

import { POST } from './route'

describe('POST /api/referrals/invite (#23 CAN-SPAM, XSS & FTC Referral Hardening)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 're_test_123')
    vi.stubEnv('MARKETING_FROM_EMAIL', 'Forge Athletic <coach@forge-athletic.app>')
    vi.stubEnv('APP_BASE_URL', 'https://forge-athletic.app')
    resendSendMock.mockResolvedValue({ data: { id: 'msg_invite_1' }, error: null })
    getOrCreateClientReferralCodeMock.mockResolvedValue({
      id: 'code-row-1',
      code: 'SCOTT-7B3K',
      customSlug: null,
    })
  })

  it('HTML-escapes inviterName and personalNote, checks email_suppressions, includes CAN-SPAM postal + unsubscribe + FTC disclosure, and omits unapplied $20 credit claims', async () => {
    const attributionInsertMock = vi.fn().mockResolvedValue({ error: null })
    getRequestAuthzMock.mockResolvedValueOnce({
      user: { id: 'user-xss-1' },
      client: { role: 'client' },
    })

    supabaseAdminMock.mockImplementation(() => ({
      from: (table: string) => {
        if (table === 'clients') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    full_name: 'Alex <script>alert(1)</script>',
                    email: 'alex@example.com',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'email_suppressions') {
          return {
            select: () => ({
              eq: (col: string, val: string) => ({
                maybeSingle: async () => ({
                  data: val === 'optedout@example.com' ? { id: 'sup_1' } : null,
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'referral_attributions') {
          return {
            insert: attributionInsertMock,
          }
        }
        return {}
      },
    }))

    const req = new NextRequest('https://forge-athletic.app/api/referrals/invite', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.10' },
      body: JSON.stringify({
        emails: ['friend@example.com', 'optedout@example.com'],
        personalNote: 'Click <a href="https://evil.test">here</a> & join!',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.sentCount).toBe(1)
    expect(json.suppressedCount).toBe(1)

    expect(resendSendMock).toHaveBeenCalledTimes(1)
    const sent = resendSendMock.mock.calls[0][0]
    expect(sent.to).toBe('friend@example.com')

    // XSS / HTML injection neutralized
    expect(sent.html).not.toContain('<script>')
    expect(sent.html).not.toContain('<a href="https://evil.test">')
    expect(sent.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(sent.html).toContain('&lt;a href=&quot;https://evil.test&quot;&gt;')

    // CAN-SPAM postal address + RFC 8058 1-click unsubscribe + FTC 16 CFR § 255.5 disclosure
    expect(sent.html).toContain('82 Wendell Ave., Ste 100, Pittsfield, MA 01201')
    expect(sent.html).toContain('/api/marketing/unsubscribe?')
    expect(sent.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')
    expect(sent.text).toContain('FTC Material Connection Disclosure (16 CFR § 255.5)')

    // Canonical domain & truthful 30-day free trial (zero unapplied $20 credit)
    expect(sent.text).toContain('https://forge-athletic.app/r/SCOTT-7B3K')
    expect(sent.text).not.toContain('forgeathletic.com')
    expect(sent.text).not.toContain('$20 Welcome Credit')
    expect(sent.html).not.toContain('$20 Welcome Credit')

    expect(attributionInsertMock).toHaveBeenCalledTimes(1)
  })

  it('enforces per-user rate limits (429) against bulk spam relay abuse', async () => {
    supabaseAdminMock.mockImplementation(() => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { full_name: 'Spammer', email: 'spammer@example.com' },
              error: null,
            }),
          }),
        }),
        insert: async () => ({ error: null }),
      }),
    }))

    let lastStatus = 200
    for (let i = 0; i < 11; i += 1) {
      getRequestAuthzMock.mockResolvedValueOnce({
        user: { id: 'rate-limited-user-99' },
        client: { role: 'client' },
      })
      const req = new NextRequest('https://forge-athletic.app/api/referrals/invite', {
        method: 'POST',
        headers: { 'x-forwarded-for': `198.51.100.${i + 1}` },
        body: JSON.stringify({ emails: [`target${i}@example.com`] }),
      })
      const res = await POST(req)
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })
})
