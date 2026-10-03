import { NextRequest, NextResponse } from 'next/server'
import { type CoachProgramWorkoutInput } from '@/lib/coach-programs'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'

interface SaveTemplateRequest {
  title: string
  goal?: string | null
  nasmOptPhase: number
  phaseName: string
  sessionsPerWeek: number
  estimatedDurationMins: number
  workouts: CoachProgramWorkoutInput[]
}

export async function GET(req: NextRequest) {
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

  const admin = supabaseAdmin()
  const { data: templates, error: fetchError } = await admin
    .from('coach_program_templates')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }

  return NextResponse.json({ templates: templates || [] })
}

export async function POST(request: NextRequest) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(request)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  try {
    const body: SaveTemplateRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.phaseName) {
      return NextResponse.json(
        { error: 'Title and phase name are required' },
        { status: 400 }
      )
    }

    const templatePayload = {
      coach_id: coachId,
      title: body.title,
      goal: body.goal || null,
      nasm_opt_phase: body.nasmOptPhase,
      phase_name: body.phaseName,
      sessions_per_week: body.sessionsPerWeek,
      estimated_duration_mins: body.estimatedDurationMins,
      template_json: {
        workouts: body.workouts,
      },
      is_active: true,
    }

    const admin = supabaseAdmin()
    const { data: newTemplate, error: createError } = await admin
      .from('coach_program_templates')
      .insert([templatePayload])
      .select()
      .single()

    if (createError || !newTemplate) {
      console.error('Failed to save coach template:', createError)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json(
      { template: newTemplate, message: 'Template saved successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/coach/program-templates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
