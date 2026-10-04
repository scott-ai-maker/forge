import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { notifyUser } from '@/lib/notifications'
import {
  isVoiceNoteBody,
  parseVoiceNoteBody,
  uploadVoiceNoteAudio,
  enrichMessagesWithSignedVoiceUrls,
} from '@/lib/voice-notes-storage'

export async function GET(req: NextRequest) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const role = authz.client.role
  const admin = supabaseAdmin()

  let clientId = ''
  let coachId = ''

  if (role === 'client') {
    clientId = authz.user.id
    coachId = authz.client.designated_coach_id ?? ''
    if (!coachId) {
      return NextResponse.json({ error: 'No designated trainer assigned yet.' }, { status: 400 })
    }
  } else {
    const targetClientId = req.nextUrl.searchParams.get('clientId') ?? ''
    if (!targetClientId) {
      return NextResponse.json({ error: 'clientId is required for coach message threads.' }, { status: 400 })
    }

    try {
      await requireCoachAssignedClient(authz.user.id, targetClientId)
    } catch (error) {
      const status = error instanceof AuthzError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Forbidden'
      return NextResponse.json({ error: message }, { status })
    }

    clientId = targetClientId
    coachId = authz.user.id
  }

  // Select standard guaranteed columns
  const { data, error } = await admin
    .from('coach_client_messages')
    .select('id, client_id, coach_id, sender_id, message_body, read_at, created_at')
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Normalize message list with soft-delete metadata
  const normalizedMessages = (data ?? []).map(m => {
    const bodyStr = String(m.message_body ?? '')
    const isRetracted = bodyStr.startsWith('[retracted]:')
    const cleanBody = isRetracted ? bodyStr.slice('[retracted]:'.length) : bodyStr

    return {
      ...m,
      message_body: bodyStr,
      clean_body: cleanBody,
      is_deleted: isRetracted,
      deleted_at: isRetracted ? m.created_at : null,
    }
  })

  // Enrich private storage voice notes with fast signed CDN playback URLs
  const enrichedMessages = await enrichMessagesWithSignedVoiceUrls(admin, normalizedMessages)

  return NextResponse.json({ messages: enrichedMessages })
}

export async function POST(req: NextRequest) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const body = await req.json().catch(() => ({}))
  const messageBody = String(body.message ?? '').trim()
  if (!messageBody) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  const isVoiceNote = messageBody.startsWith('[voice-note]:')
  const maxLength = isVoiceNote ? 5000000 : 2000

  if (messageBody.length > maxLength) {
    return NextResponse.json({
      error: isVoiceNote
        ? 'Voice note audio payload exceeds maximum size limit (5MB).'
        : 'message must be 2000 characters or fewer'
    }, { status: 400 })
  }

  let clientId = ''
  let coachId = ''

  if (authz.client.role === 'client') {
    clientId = authz.user.id
    coachId = authz.client.designated_coach_id ?? ''
    if (!coachId) {
      return NextResponse.json({ error: 'No designated trainer assigned yet.' }, { status: 400 })
    }
  } else {
    const targetClientId = String(body.clientId ?? '').trim()
    if (!targetClientId) {
      return NextResponse.json({ error: 'clientId is required for coach messages.' }, { status: 400 })
    }

    try {
      await requireCoachAssignedClient(authz.user.id, targetClientId)
    } catch (error) {
      const status = error instanceof AuthzError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Forbidden'
      return NextResponse.json({ error: message }, { status })
    }

    clientId = targetClientId
    coachId = authz.user.id
  }

  const admin = supabaseAdmin()
  let bodyToInsert = messageBody

  if (isVoiceNote) {
    const parsed = parseVoiceNoteBody(messageBody)
    if (parsed && parsed.payload.startsWith('data:')) {
      bodyToInsert = await uploadVoiceNoteAudio(admin, {
        clientId,
        audioDataUrl: parsed.payload,
        duration: parsed.duration,
      })
    }
  }

  const { data, error } = await admin
    .from('coach_client_messages')
    .insert({
      client_id: clientId,
      coach_id: coachId,
      sender_id: authz.user.id,
      message_body: bodyToInsert,
    })
    .select('id, client_id, coach_id, sender_id, message_body, read_at, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const recipientUserId = authz.user.id === clientId ? coachId : clientId
  let alertSnippet = messageBody
  if (isVoiceNote) {
    const match = messageBody.match(/^\[voice-note\]:(\d+(?:\.\d+)?):/)
    const duration = match ? Math.round(Number(match[1])) : ''
    alertSnippet = `Voice memo ${duration ? `(${duration}s)` : ''}`
  }

  void notifyUser({
    userId: recipientUserId,
    type: 'new_message',
    title: authz.client.role === 'coach' ? 'New coach message' : 'New client message',
    body: alertSnippet.slice(0, 140),
    data: { clientId, coachId },
  }).catch(() => undefined)

  const [enriched] = await enrichMessagesWithSignedVoiceUrls(admin, [
    {
      ...data,
      is_deleted: false,
      deleted_at: null,
    },
  ])

  return NextResponse.json({
    message: enriched,
  })
}

/**
 * Mark Messages as Read Endpoint
 * Updates unread messages sent by the other party to read_at = NOW()
 */
export async function PATCH(req: NextRequest) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const role = authz.client.role
  const admin = supabaseAdmin()

  let clientId = ''
  let coachId = ''

  if (role === 'client') {
    clientId = authz.user.id
    coachId = authz.client.designated_coach_id ?? ''
    if (!coachId) {
      return NextResponse.json({ error: 'No designated trainer assigned yet.' }, { status: 400 })
    }
  } else {
    const targetClientId = req.nextUrl.searchParams.get('clientId') ?? ''
    if (!targetClientId) {
      return NextResponse.json({ error: 'clientId is required for coach mark read.' }, { status: 400 })
    }

    try {
      await requireCoachAssignedClient(authz.user.id, targetClientId)
    } catch (error) {
      const status = error instanceof AuthzError ? error.status : 500
      const message = error instanceof Error ? error.message : 'Forbidden'
      return NextResponse.json({ error: message }, { status })
    }

    clientId = targetClientId
    coachId = authz.user.id
  }

  const now = new Date().toISOString()

  // Mark all unread messages sent by the other party as read
  const { error: updateErr } = await admin
    .from('coach_client_messages')
    .update({ read_at: now })
    .eq('client_id', clientId)
    .eq('coach_id', coachId)
    .neq('sender_id', authz.user.id)
    .is('read_at', null)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, read_at: now })
}

/**
 * Soft Delete / Retract Message(s) Endpoint
 * Hides text and audio from active thread while permanently preserving full message_body and audit trail in PostgreSQL.
 * Supports:
 * - Single message retraction: ?messageId=...
 * - Batch thread clear: ?clearAll=true (& clientId=... if coach)
 */
export async function DELETE(req: NextRequest) {
  let authz
  try {
    authz = await getRequestAuthz(req)
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const admin = supabaseAdmin()
  const searchParams = req.nextUrl.searchParams
  const isClearAll = searchParams.get('clearAll') === 'true'
  const messageId = searchParams.get('messageId')

  // ── A. Batch Clear Thread (Soft-delete all messages in thread) ──
  if (isClearAll) {
    let clientId = ''
    let coachId = ''

    if (authz.client.role === 'client') {
      clientId = authz.user.id
      coachId = authz.client.designated_coach_id ?? ''
      if (!coachId) {
        return NextResponse.json({ error: 'No designated trainer assigned yet.' }, { status: 400 })
      }
    } else {
      const targetClientId = searchParams.get('clientId') ?? ''
      if (!targetClientId) {
        return NextResponse.json({ error: 'clientId is required for coach thread clear.' }, { status: 400 })
      }

      try {
        await requireCoachAssignedClient(authz.user.id, targetClientId)
      } catch (error) {
        const status = error instanceof AuthzError ? error.status : 500
        const message = error instanceof Error ? error.message : 'Forbidden'
        return NextResponse.json({ error: message }, { status })
      }

      clientId = targetClientId
      coachId = authz.user.id
    }

    const { data: messagesToClear, error: fetchErr } = await admin
      .from('coach_client_messages')
      .select('id, message_body')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const unretracted = (messagesToClear ?? []).filter(m => !String(m.message_body ?? '').startsWith('[retracted]:'))

    for (const msg of unretracted) {
      const taggedBody = `[retracted]:${msg.message_body}`
      await admin
        .from('coach_client_messages')
        .update({ message_body: taggedBody })
        .eq('id', msg.id)
    }

    return NextResponse.json({
      success: true,
      clearedAll: true,
      clearedCount: unretracted.length,
    })
  }

  // ── B. Single Message Retraction ──
  if (!messageId) {
    const body = await req.json().catch(() => ({}))
    if (!body.messageId && !body.clearAll) {
      return NextResponse.json({ error: 'messageId or clearAll is required' }, { status: 400 })
    }
  }

  const targetMsgId = messageId || (await req.json().catch(() => ({}))).messageId

  // 1. Fetch message using base guaranteed columns
  const { data: existingMsg, error: fetchErr } = await admin
    .from('coach_client_messages')
    .select('id, client_id, coach_id, sender_id, message_body')
    .eq('id', targetMsgId)
    .maybeSingle()

  if (fetchErr || !existingMsg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  // 2. Authorization: sender of message OR assigned coach can retract
  const isSender = existingMsg.sender_id === authz.user.id
  const isAssignedCoach = authz.client.role === 'coach' && existingMsg.coach_id === authz.user.id

  if (!isSender && !isAssignedCoach) {
    return NextResponse.json({ error: 'You do not have permission to retract this message.' }, { status: 403 })
  }

  // 3. Soft-delete: prepend [retracted]: tag to message_body to preserve full text/audio in DB
  const originalBody = String(existingMsg.message_body ?? '')
  const taggedBody = originalBody.startsWith('[retracted]:') ? originalBody : `[retracted]:${originalBody}`

  const { error: updateErr } = await admin
    .from('coach_client_messages')
    .update({
      message_body: taggedBody,
    })
    .eq('id', targetMsgId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    messageId: targetMsgId,
    deleted_at: new Date().toISOString(),
  })
}
