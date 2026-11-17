import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function POST(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  if (authz.client.role !== 'coach') {
    return NextResponse.json(
      { error: 'Only assigned coaches can initiate live session alerts.' },
      { status: 403, headers: NO_STORE_HEADERS }
    )
  }

  return NextResponse.json(
    {
      error:
        'Team Live Studio is disabled. Launch a 1:1 Live Coaching session instead so each athlete has a verified Emergency Response Action Plan (ERAP).',
      teamStudioDisabled: true,
    },
    { status: 410, headers: NO_STORE_HEADERS }
  )
}
