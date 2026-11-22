import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  AuthzError,
  getRequestAuthz,
  isEnterpriseLeaderEmail,
  isMasterCoachEmail,
  requireEnterpriseLeadershipAccess,
} from '@/lib/authz'
import {
  EXECUTIVE_BOT_ORDER,
  EXECUTIVE_BOT_PROFILES,
} from '@/lib/enterprise-chatbots/knowledge'
import { fetchEnterpriseTelemetrySnapshot } from '@/lib/enterprise-chatbots/telemetry'
import { runExecutiveBotTurn } from '@/lib/enterprise-chatbots/engine'
import {
  checkSlidingWindowRateLimit,
  resolveRequestSubjectKey,
} from '@/src/lib/security/rateLimiter'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const

const ExecutiveChatPayloadSchema = z.object({
  botId: z.enum(['b2b-partnerships', 'growth-marketing', 'cfo-revenue', 'enterprise-ops']),
  message: z.string().trim().min(1, 'Message is required').max(2400, 'Message is too long'),
  deliverableMode: z
    .enum(['advisory', 'playbook', 'outreach_draft', 'financial_model', 'compliance_checklist'])
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(4000),
      })
    )
    .max(12)
    .optional(),
})

export async function GET(req: NextRequest) {
  let actorId = ''
  let includeCompanyWide = false
  try {
    const authz = await getRequestAuthz(req)
    requireEnterpriseLeadershipAccess(authz)
    actorId = authz.user.id
    includeCompanyWide = isMasterCoachEmail(authz.user.email) || isEnterpriseLeaderEmail(authz.user.email)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const telemetry = await fetchEnterpriseTelemetrySnapshot(actorId, includeCompanyWide)

  return NextResponse.json(
    {
      ok: true,
      telemetry,
      bots: EXECUTIVE_BOT_ORDER.map(id => EXECUTIVE_BOT_PROFILES[id]),
    },
    { headers: NO_STORE_HEADERS }
  )
}

export async function POST(req: NextRequest) {
  let actorId = ''
  let includeCompanyWide = false
  try {
    const authz = await getRequestAuthz(req)
    requireEnterpriseLeadershipAccess(authz)
    actorId = authz.user.id
    includeCompanyWide = isMasterCoachEmail(authz.user.email) || isEnterpriseLeaderEmail(authz.user.email)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 401
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const rateCheck = checkSlidingWindowRateLimit({
    namespace: 'enterprise_executive_bots',
    subjectKey: resolveRequestSubjectKey(req, actorId),
    maxRequests: 40,
    windowMs: 10 * 60 * 1000,
  })

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Executive board rate limit reached. Please wait ${rateCheck.retryAfterSeconds}s before sending another brief.`,
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

  const parsed = ExecutiveChatPayloadSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || 'Invalid executive chatbot request',
      },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  try {
    const telemetry = await fetchEnterpriseTelemetrySnapshot(actorId, includeCompanyWide)
    const result = await runExecutiveBotTurn(parsed.data, telemetry)

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    console.error('[EnterpriseBots API] Failed to generate executive response:', error)
    return NextResponse.json(
      { error: 'Failed to consult executive advisor' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
