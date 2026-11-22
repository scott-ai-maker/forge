import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  AuthzError,
  getRequestAuthz,
  isEnterpriseLeaderEmail,
  isMasterCoachEmail,
  requireEnterpriseLeadershipAccess,
} from '@/lib/authz'
import {
  fetchEnterpriseBiDashboard,
  formatPrometheusMetrics,
} from '@/lib/enterprise-chatbots/metrics'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const

function hasValidScrapeToken(req: NextRequest): boolean {
  const configured = (process.env.ENTERPRISE_METRICS_SCRAPE_TOKEN || '').trim()
  if (!configured || configured.length < 16) return false

  const authHeader = req.headers.get('authorization') || ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return false

  const a = Buffer.from(token.trim())
  const b = Buffer.from(configured)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  let actorId = 'scrape-service'
  let includeCompanyWide = true

  if (!hasValidScrapeToken(req)) {
    try {
      const authz = await getRequestAuthz(req)
      requireEnterpriseLeadershipAccess(authz)
      actorId = authz.user.id
      includeCompanyWide =
        isMasterCoachEmail(authz.user.email) || isEnterpriseLeaderEmail(authz.user.email)
    } catch (error) {
      const status = error instanceof AuthzError ? error.status : 401
      const message = error instanceof Error ? error.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
    }
  }

  const snapshot = await fetchEnterpriseBiDashboard(actorId, includeCompanyWide)
  const format = (req.nextUrl.searchParams.get('format') || 'json').toLowerCase()

  if (format === 'prometheus' || format === 'openmetrics') {
    return new NextResponse(formatPrometheusMetrics(snapshot), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    })
  }

  return NextResponse.json(
    {
      ok: true,
      metrics: snapshot,
    },
    { headers: NO_STORE_HEADERS }
  )
}
