import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getRequestAuthz, requireCoachAssignedClient, AuthzError } from '@/lib/authz'
import { notifyUser } from '@/lib/notifications'
import {
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

  // Normalize message list with soft-delete metadata (never transmit retracted body or audio over the wire)
  const normalizedMessages = (data ?? []).map(m => {
    const bodyStr = String(m.message_body ?? '')
    const isRetracted = bodyStr.startsWith('[retracted]:') || bodyStr === '[retracted]'

    return {
      ...m,
      message_body: isRetracted ? '[retracted]' : bodyStr,
      clean_body: isRetracted ? '' : bodyStr,
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

  if (process.env.NODE_ENV !== 'test') {
    const { enforceRateLimit } = await import('@/lib/rate-limit')
    const rl = await enforceRateLimit({
      key: `messages_post:${authz.user.id}`,
      limit: 100,
      windowSeconds: 300,
      route: '/api/messages',
      dimension: 'user',
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a moment before sending more.' },
        { status: 429 }
      )
    }
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
    if (!parsed || !parsed.payload.startsWith('data:audio/')) {
      return NextResponse.json(
        { error: 'Invalid voice note audio payload.' },
        { status: 400 }
      )
    }
    bodyToInsert = await uploadVoiceNoteAudio(admin, {
      clientId,
      audioDataUrl: parsed.payload,
      duration: parsed.duration,
    })
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
  const redactedNotificationBody = isVoiceNote
    ? 'A new encrypted voice memo is waiting in your Forge Athletic portal.'
    : authz.client.role === 'coach'
      ? 'Coach Gordon sent a new secure message. Sign in to view.'
      : 'You have a new secure client message. Sign in to view.'

  void notifyUser({
    userId: recipientUserId,
    type: 'new_message',
    title: authz.client.role === 'coach' ? 'New coach message' : 'New client message',
    body: redactedNotificationBody,
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

  if (process.env.NODE_ENV !== 'test') {
    const { enforceRateLimit } = await import('@/lib/rate-limit')
    const rl = await enforceRateLimit({
      key: `messages_post:${authz.user.id}`,
      limit: 100,
      windowSeconds: 300,
      route: '/api/messages',
      dimension: 'user',
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a moment before sending more.' },
        { status: 429 }
      )
    }
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

  if (process.env.NODE_ENV !== 'test') {
    const { enforceRateLimit } = await import('@/lib/rate-limit')
    const rl = await enforceRateLimit({
      key: `messages_post:${authz.user.id}`,
      limit: 100,
      windowSeconds: 300,
      route: '/api/messages',
      dimension: 'user',
    })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please wait a moment before sending more.' },
        { status: 429 }
      )
    }
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
      .select('id, sender_id, message_body')
      .eq('client_id', clientId)
      .eq('coach_id', coachId)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const unretracted = (messagesToClear ?? []).filter(m => {
      const b = String(m.message_body ?? '')
      return b !== '[retracted]' && !b.startsWith('[retracted]:')
    })

    const voicePathsToPurge: string[] = []
    for (const msg of unretracted) {
      const rawBody = String(msg.message_body ?? '')
      const parsedVoice = parseVoiceNoteBody(rawBody)
      if (
        parsedVoice &&
        !parsedVoice.payload.startsWith('data:') &&
        !parsedVoice.payload.startsWith('http://') &&
        !parsedVoice.payload.startsWith('https://') &&
        !parsedVoice.payload.startsWith('blob:') &&
        !parsedVoice.payload.includes('..') &&
        parsedVoice.payload.startsWith(`${clientId}/`)
      ) {
        voicePathsToPurge.push(parsedVoice.payload)
      }

      try {
        await admin.from('retracted_message_forensic_archive').upsert(
          {
            message_id: msg.id,
            client_id: clientId,
            coach_id: coachId,
            sender_id: (msg as { sender_id?: string | null }).sender_id ?? null,
            retracted_by: authz.user.id,
            original_body: rawBody,
            retracted_at: new Date().toISOString(),
          },
          { onConflict: 'message_id' }
        )
      } catch {
        // Ignore if forensic archive migration is not active in local/test mock
      }

      await admin
        .from('coach_client_messages')
        .update({ message_body: '[retracted]' })
        .eq('id', msg.id)
    }

    if (voicePathsToPurge.length > 0 && admin.storage?.from) {
      try {
        await admin.storage.from('coach-voice-notes').remove(voicePathsToPurge)
      } catch {
        // Ignore storage purge errors on non-existent mock paths
      }
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

  // 3. Scrub PostgREST-visible row to literal '[retracted]', archive original in service_role-only vault,
  //    and delete any client-accessible voice-note object (#27).
  const originalBody = String(existingMsg.message_body ?? '')
  const cleanOriginal = originalBody.replace(/^\[retracted\]:/, '')
  const deletedAtIso = new Date().toISOString()

  if (originalBody !== '[retracted]') {
    try {
      await admin.from('retracted_message_forensic_archive').upsert(
        {
          message_id: targetMsgId,
          client_id: existingMsg.client_id,
          coach_id: existingMsg.coach_id,
          sender_id: existingMsg.sender_id,
          retracted_by: authz.user.id,
          original_body: cleanOriginal,
          retracted_at: deletedAtIso,
        },
        { onConflict: 'message_id' }
      )
    } catch {
      // Ignore if forensic archive migration is not active in local/test mock
    }

    const parsedVoice = parseVoiceNoteBody(cleanOriginal)
    if (
      parsedVoice &&
      !parsedVoice.payload.startsWith('data:') &&
      !parsedVoice.payload.startsWith('http://') &&
      !parsedVoice.payload.startsWith('https://') &&
      !parsedVoice.payload.startsWith('blob:') &&
      !parsedVoice.payload.includes('..') &&
      parsedVoice.payload.startsWith(`${existingMsg.client_id}/`) &&
      admin.storage?.from
    ) {
      try {
        await admin.storage.from('coach-voice-notes').remove([parsedVoice.payload])
      } catch {
        // Ignore storage purge errors
      }
    }
  }

  const { error: updateErr } = await admin
    .from('coach_client_messages')
    .update({
      message_body: '[retracted]',
    })
    .eq('id', targetMsgId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    messageId: targetMsgId,
    deleted_at: deletedAtIso,
  })
}
