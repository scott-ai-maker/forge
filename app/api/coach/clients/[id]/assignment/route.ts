import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, isMasterCoachEmail, requireRole, AuthzError } from '@/lib/authz'
import {
  assignClientToCoach,
  CoachAssignmentError,
  type CoachAssignmentsAdmin,
  releaseClientFromCoach,
} from '@/lib/coach-assignments'
import { supabaseAdmin } from '@/lib/supabase'
import { getMissingEmailConfigKeys, sendWelcomeEmail } from '@/lib/marketing-email'

type ClientRouteContext = { params: Promise<{ id: string }> }
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' }

export async function PATCH(
  _req: NextRequest,
  ctx: ClientRouteContext
) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(_req)
    requireRole(authz.client.role, ['coach'])
    if (!isMasterCoachEmail(authz.user.email)) {
      throw new AuthzError('Only the Master Coach may claim unassigned clients from the intake pool', 403)
    }
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id } = await ctx.params
  const admin = supabaseAdmin() as unknown as CoachAssignmentsAdmin

  try {
    const client = await assignClientToCoach(admin, id, coachId)

    let welcomeEmail: {
      sent: boolean
      providerMessageId?: string | null
      skipped?: boolean
      error?: string
    } | null = null

    if (client.email) {
      try {
        const firstName = client.full_name?.split(' ')[0] ?? null
        const result = await sendWelcomeEmail({
          email: client.email,
          firstName,
          coachReplyToEmail: process.env.MARKETING_REPLY_TO_EMAIL,
        })

        if (result.skipped) {
          const missing = getMissingEmailConfigKeys()
          welcomeEmail = {
            sent: false,
            skipped: true,
            error: `Email service is not configured on this environment. Missing: ${missing.join(', ') || 'unknown settings'}.`,
          }
        } else {
          welcomeEmail = {
            sent: true,
            providerMessageId: result.id,
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send welcome email'
        welcomeEmail = {
          sent: false,
          error: message,
        }
      }
    }

    return NextResponse.json({ client, welcomeEmail }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const status = error instanceof CoachAssignmentError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unexpected assignment error'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: ClientRouteContext
) {
  let coachId = ''
  try {
    const authz = await getRequestAuthz(_req)
    requireRole(authz.client.role, ['coach'])
    coachId = authz.user.id
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }

  const { id } = await ctx.params
  const admin = supabaseAdmin() as unknown as CoachAssignmentsAdmin

  try {
    const client = await releaseClientFromCoach(admin, id, coachId)
    return NextResponse.json({ client }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const status = error instanceof CoachAssignmentError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unexpected assignment error'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
  }
}