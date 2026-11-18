import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const {
  insertMock,
  triggerLeadEmailAutomationMock,
} = vi.hoisted(() => ({
  insertMock: vi.fn(),
  triggerLeadEmailAutomationMock: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: vi.fn().mockReturnValue({
      insert: insertMock,
    }),
  }),
}))

vi.mock('@/lib/marketing-email', () => ({
  triggerLeadEmailAutomation: triggerLeadEmailAutomationMock,
}))

describe('POST /api/apply/master-allocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    insertMock.mockResolvedValue({ error: null })
    triggerLeadEmailAutomationMock.mockResolvedValue({ success: true })
  })

  it('rejects submissions with missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/apply/master-allocation', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alexander Vance',
        // missing email, occupationalVelocity, etc.
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Missing required fields')
  })

  it('rejects submissions without standalone Consumer Health Data consent (WA MHMDA / NV SB 370)', async () => {
    const req = new NextRequest('http://localhost/api/apply/master-allocation', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Julian Sterling',
        email: 'julian@sterlingadvisory.com',
        occupationalVelocity: 'Managing Partner, Private Equity.',
        orthopedicHistory: 'L4/L5 lumbar compression.',
        autonomousExecution: 'yes',
        capitalAllocated: 'yes',
        healthDataConsent: false,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('Consumer Health Data consent')
  })

  it('rejects mobile phone submission without TCPA smsConsent', async () => {
    const req = new NextRequest('http://localhost/api/apply/master-allocation', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Julian Sterling',
        email: 'julian@sterlingadvisory.com',
        phone: '+1 (555) 234-5678',
        occupationalVelocity: 'Managing Partner, Private Equity.',
        orthopedicHistory: 'L4/L5 lumbar compression.',
        autonomousExecution: 'yes',
        capitalAllocated: 'yes',
        healthDataConsent: true,
        smsConsent: false,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('TCPA')
  })

  it('accepts qualified master allocation submission with TCPA smsConsent and triggers high-priority pipeline', async () => {
    const req = new NextRequest('http://localhost/api/apply/master-allocation', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Julian Sterling',
        email: 'julian@sterlingadvisory.com',
        phone: '+1 (555) 234-5678',
        smsConsent: true,
        occupationalVelocity: 'Managing Partner, Private Equity, weekly transcontinental travel.',
        orthopedicHistory: 'L4/L5 lumbar compression from flight seating, right AC joint impingement.',
        autonomousExecution: 'yes',
        capitalAllocated: 'yes',
        healthDataConsent: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.qualified).toBe(true)

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'julian@sterlingadvisory.com',
        first_name: 'Julian Sterling',
        recommended_tier: 'transformation',
        support_level: 'Transformation Direct',
        source: 'master_allocation_modal',
      })
    )
  })
})
