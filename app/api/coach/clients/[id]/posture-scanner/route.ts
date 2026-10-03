import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzePosturalMesh, PosturalViewType } from '@/lib/ai-postural-mesh-scanner'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { id: clientId } = await params
  const body = await req.json().catch(() => ({}))
  const { imageBase64, view = 'anterior', clientName: bodyClientName } = body as {
    imageBase64?: string
    view: PosturalViewType
    clientName?: string
  }

  const admin = supabaseAdmin()

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  const { data: clientRecord } = await admin
    .from('clients')
    .select('full_name, email')
    .eq('id', clientId)
    .maybeSingle()

  const clientName = bodyClientName || clientRecord?.full_name || 'Athlete'

  try {
    const scanResult = await analyzePosturalMesh({
      imageBase64,
      view,
      clientName,
    })

    return NextResponse.json({
      ok: true,
      data: scanResult,
    })
  } catch (err: unknown) {
    const errObj = err as { message?: string }
    return NextResponse.json(
      { error: errObj?.message || 'Postural mesh analysis failed.' },
      { status: 500 }
    )
  }
}

