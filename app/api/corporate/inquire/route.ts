import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, getClientIp, getPositiveIntEnv } from '@/lib/rate-limit'

type CorporateInquiryPayload = {
  companyName?: string
  contactName?: string
  contactEmail?: string
  teamSize?: string
  customGoals?: string
  budgetTimeline?: string
}

const REQUIRED_FIELDS: Array<keyof CorporateInquiryPayload> = [
  'companyName',
  'contactName',
  'contactEmail',
]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = getPositiveIntEnv('RATE_LIMIT_CORPORATE_MAX', 5)
  const windowSeconds = Math.ceil(getPositiveIntEnv('RATE_LIMIT_CORPORATE_WINDOW_MS', 60_000) / 1000)

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const limitResult = await enforceRateLimit({
        key: `corporate_inquiry:${ip}`,
        limit,
        windowSeconds,
        route: '/api/corporate/inquire',
        dimension: 'ip',
      })

      if (!limitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: { 'Retry-After': String(Math.ceil((new Date(limitResult.resetAt).getTime() - Date.now()) / 1000)) },
          }
        )
      }
    } catch {
      // In offline/test environments, proceed if rate limiter store is unavailable
    }
  }

  try {
    const payload = (await req.json()) as CorporateInquiryPayload

    for (const field of REQUIRED_FIELDS) {
      const value = payload[field]
      if (typeof value !== 'string' || value.trim().length === 0) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const email = payload.contactEmail!.toLowerCase().trim()
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid corporate email address.' }, { status: 400 })
    }

    // Inquiry received successfully
    return NextResponse.json({
      ok: true,
      message: 'Executive corporate wellness inquiry received. Coach Gordon will prepare your customized institutional proposal within 24 business hours.',
      inquiry: {
        companyName: payload.companyName?.trim(),
        contactName: payload.contactName?.trim(),
        contactEmail: email,
        teamSize: payload.teamSize?.trim() || 'Up to 10 executives',
        customGoals: payload.customGoals?.trim() || 'General executive human performance',
        receivedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 })
  }
}
