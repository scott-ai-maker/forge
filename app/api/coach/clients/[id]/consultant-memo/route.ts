import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { generateConsultantMemo } from '@/lib/coach-consultant-memo'
import { supabaseAdmin } from '@/lib/supabase'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

function sanitizeMemoField(value: unknown, maxLen = 1000): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F<>]/g, '').trim().slice(0, maxLen)
  return cleaned || undefined
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id: clientId } = await params
  const admin = supabaseAdmin()

  // Verify coach assignment
  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id, full_name, designated_coach_id')
    .eq('id', clientId)
    .single()

  if (clientError || !client || client.designated_coach_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized coach access' }, { status: 403, headers: NO_STORE_HEADERS })
  }

  try {
    const body = await req.json()
    const memo = generateConsultantMemo({
      clientName: client.full_name || 'Client',
      optPhase: Math.max(1, Math.min(5, Number(body.opt_phase ?? 1) || 1)),
      totalSetsLogged: Math.max(0, Number(body.total_sets_logged ?? 40)),
      targetSetsPlanned: Math.max(1, Number(body.target_sets_planned ?? 45)),
      avgReadiness: Math.max(0, Math.min(100, Number(body.avg_readiness ?? 80))),
      cexStreakDays: Math.max(0, Number(body.cex_streak_days ?? 5)),
      topPrBreakthrough: sanitizeMemoField(body.top_pr, 240) ?? null,
      activeKineticCompensation: sanitizeMemoField(body.active_compensation, 240) ?? null,
      coachCustomNotes: sanitizeMemoField(body.custom_notes, 2000),
    })

    // Optionally dispatch directly into messages table if requested
    if (body.dispatch_to_client_messages) {
      try {
        await admin.from('coach_client_messages').insert({
          client_id: clientId,
          coach_id: userId,
          sender_id: userId,
          message_body: memo.fullMemoMarkdown,
        })
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json(
      {
        success: true,
        memo,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate memo'
    return NextResponse.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS })
  }
}

