import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, AuthzError } from '@/lib/authz'
import { generateConsultantMemo } from '@/lib/coach-consultant-memo'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId = ''
  try {
    const authz = await getRequestAuthz(req)
    userId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
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
    return NextResponse.json({ error: 'Unauthorized coach access' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const memo = generateConsultantMemo({
      clientName: client.full_name || 'Client',
      optPhase: Number(body.opt_phase ?? 1),
      totalSetsLogged: Number(body.total_sets_logged ?? 40),
      targetSetsPlanned: Number(body.target_sets_planned ?? 45),
      avgReadiness: Number(body.avg_readiness ?? 80),
      cexStreakDays: Number(body.cex_streak_days ?? 5),
      topPrBreakthrough: body.top_pr ?? null,
      activeKineticCompensation: body.active_compensation ?? null,
      coachCustomNotes: body.custom_notes ?? undefined,
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

    return NextResponse.json({
      success: true,
      memo,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate memo'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

