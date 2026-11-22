import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { runPublicConciergeTurn } from '@/lib/enterprise-chatbots/engine'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const

const PublicConciergePayloadSchema = z.object({
  message: z.string().trim().min(1, 'Please enter a question').max(800, 'Question is too long'),
  pageContext: z.string().max(120).optional(),
  honeypot: z.string().max(120).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(1600),
      })
    )
    .max(8)
    .optional(),
})

export async function POST(req: NextRequest) {
  const rateCheck = checkSlidingWindowRateLimit({
    namespace: 'public_sales_concierge',
    subjectKey: resolveRequestSubjectKey(req, null),
    maxRequests: 20,
    windowMs: 10 * 60 * 1000,
  })

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Too many concierge messages sent quickly. Please wait ${rateCheck.retryAfterSeconds}s and try again.`,
      },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'Retry-After': String(rateCheck.retryAfterSeconds),
        },
      }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request payload' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const parsed = PublicConciergePayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid concierge message' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  // Silently discard automated bot honeypot submissions
  if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
    return NextResponse.json(
      {
        ok: true,
        botId: 'sales-concierge',
        replyMarkdown: 'Thank you for your interest in Forge Athletic.',
        suggestedFollowUps: [],
        actionLinks: [{ label: 'Explore Forge Athletic', href: '/', variant: 'primary' }],
        engineMode: 'deterministic_concierge',
        launchMode: 'prelaunch_waitlist',
      },
      { headers: NO_STORE_HEADERS }
    )
  }

  try {
    const response = await runPublicConciergeTurn({
      message: parsed.data.message,
      pageContext: parsed.data.pageContext,
      history: parsed.data.history,
    })

    return NextResponse.json(
      {
        ok: true,
        ...response,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('[PublicConcierge API] Failed to generate response:', error)
    return NextResponse.json(
      { error: 'Unable to reach the Forge Athletic Concierge right now.' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
