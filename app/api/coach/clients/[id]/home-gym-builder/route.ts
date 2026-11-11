import { NextRequest, NextResponse } from 'next/server'
import {
  getRequestAuthz,
  requireRole,
  requireCoachAssignedClient,
  AuthzError,
} from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  buildRagHomeGymBlueprint,
  mapProfileGoalToHomeGymGoal,
  type HomeGymBuilderNeedsInput,
} from '@/lib/rag-home-gym-builder'

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

  try {
    await requireCoachAssignedClient(coachId, clientId)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 403
    return NextResponse.json({ error: 'Not authorized for this athlete.' }, { status })
  }

  const body = (await req.json().catch(() => ({}))) as Partial<HomeGymBuilderNeedsInput> & {
    sendToAthleteInbox?: boolean
    customCoachNote?: string
  }

  const admin = supabaseAdmin()
  const [{ data: clientRecord }, { data: profile }, { data: assessment }, { data: plan }] =
    await Promise.all([
      admin.from('clients').select('full_name').eq('id', clientId).maybeSingle(),
      admin.from('fitness_profiles').select('*').eq('user_id', clientId).maybeSingle(),
      admin
        .from('nasm_assessments')
        .select('*')
        .eq('client_id', clientId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from('workout_plans')
        .select('nasm_opt_phase')
        .eq('user_id', clientId)
        .eq('is_active', true)
        .maybeSingle(),
    ])

  const blueprint = buildRagHomeGymBlueprint({
    athleteName: clientRecord?.full_name || 'Athlete',
    spaceType: body.spaceType,
    ceilingHeight: body.ceilingHeight,
    floorLevel: body.floorLevel,
    budgetTier: body.budgetTier,
    customMaxBudgetUsd: body.customMaxBudgetUsd,
    primaryGoal:
      body.primaryGoal ?? mapProfileGoalToHomeGymGoal(profile?.primary_goal ?? profile?.goal ?? null),
    householdUsers: body.householdUsers,
    preferredModalities: body.preferredModalities,
    concerns: body.concerns,
    assessment: assessment ?? null,
    ownedEquipment: profile?.equipment_access ?? null,
    optPhase: plan?.nasm_opt_phase ?? null,
    injuriesLimitations: profile?.injuries_limitations ?? null,
  })

  let conciergeNotified = false
  if (body.sendToAthleteInbox) {
    const phase1Lines = blueprint.phase1ImmediateBuild
      .map(
        item =>
          `• **${item.name}** (${item.partnerBrand} · ${item.clientPriceFormatted}): ${item.dispensaryUrl}`
      )
      .join('\n')

    const specLines = blueprint.siteEngineeringSpecs
      .map(spec => `• **${spec.title}**: ${spec.specification}`)
      .join('\n')

    const customNote = (body.customCoachNote || '').trim()

    const conciergeMessage = `**CUSTOM FORGE ATHLETIC HOME-GYM ARCHITECTURE BLUEPRINT**

**${blueprint.blueprintTitle}**
${blueprint.architectSummaryMemo}

**Phase 1 Prescribed Buildout (${blueprint.phase1MemberFormatted} · Target Cap ${blueprint.resolvedBudgetFormatted}):**
${phase1Lines || '• Your existing home-gym equipment already covers Phase 1 requirements!'}

**NASM HGD Site, Clearance & Safety Specs:**
${specLines}

${customNote ? `**Coach's Personal Setup Note:**\n"${customNote}"\n\n` : ''}*${blueprint.ftcAffiliateDisclosure} ${blueprint.voluntarySourcingNotice}*`

    const { error: msgErr } = await admin.from('coach_client_messages').insert({
      coach_id: coachId,
      client_id: clientId,
      sender_id: coachId,
      sender_role: 'coach',
      body: conciergeMessage,
    })
    conciergeNotified = !msgErr
  }

  return NextResponse.json({
    ok: true,
    blueprint,
    conciergeNotified,
  })
}

