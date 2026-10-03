import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('POST /api/corporate/inquire', () => {
  it('rejects incomplete requests missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/corporate/inquire', {
      method: 'POST',
      body: JSON.stringify({
        companyName: 'Apex Capital Partners',
        // missing contactName and contactEmail
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('Missing required field'),
    })
  })

  it('rejects invalid email addresses', async () => {
    const req = new NextRequest('http://localhost/api/corporate/inquire', {
      method: 'POST',
      body: JSON.stringify({
        companyName: 'Apex Capital Partners',
        contactName: 'David Vance',
        contactEmail: 'invalid-email-string',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('valid corporate email'),
    })
  })

  it('accepts valid corporate inquiries and returns 200 with confirmation message', async () => {
    const req = new NextRequest('http://localhost/api/corporate/inquire', {
      method: 'POST',
      body: JSON.stringify({
        companyName: 'Apex Capital Partners',
        contactName: 'David Vance',
        contactEmail: 'david.vance@apexcapital.com',
        teamSize: '8 Managing Partners',
        customGoals: 'Mitigate travel fatigue and improve executive stamina',
        budgetTimeline: 'Immediate Q3 Start',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      inquiry: {
        companyName: 'Apex Capital Partners',
        contactName: 'David Vance',
        contactEmail: 'david.vance@apexcapital.com',
        teamSize: '8 Managing Partners',
      },
    })
  })
})

