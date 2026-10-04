import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequestAuthzMock, requireCoachAssignedClientMock, supabaseAdminMock } = vi.hoisted(() => ({
  getRequestAuthzMock: vi.fn(),
  requireCoachAssignedClientMock: vi.fn(),
  supabaseAdminMock: vi.fn(),
}))

const { notifyUserMock } = vi.hoisted(() => ({
  notifyUserMock: vi.fn(),
}))

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz')
  return {
    ...actual,
    getRequestAuthz: getRequestAuthzMock,
    requireCoachAssignedClient: requireCoachAssignedClientMock,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: supabaseAdminMock,
}))

vi.mock('@/lib/notifications', () => ({
  notifyUser: notifyUserMock,
}))

import { GET, POST, PATCH, DELETE } from '@/app/api/messages/route'
import { AuthzError } from '@/lib/authz'

function createMessagesAdmin(messages: unknown[] = [], storageMock?: unknown) {
  return {
    storage: storageMock,
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                eq() {
                  return {
                    order() {
                      return {
                        limit: async () => ({ data: messages, error: null }),
                      }
                    },
                  }
                },
                maybeSingle: async () => ({ data: messages[0] ?? null, error: null }),
              }
            },
            single: async () => ({ data: messages[0] ?? null, error: null }),
            maybeSingle: async () => ({ data: messages[0] ?? null, error: null }),
          }
        },
        insert(payload: unknown) {
          return {
            select() {
              return {
                single: async () => ({ data: payload, error: null }),
              }
            },
          }
        },
        update() {
          const chain: Record<string, unknown> = {}
          const fn = () => chain
          chain.eq = fn
          chain.neq = fn
          chain.is = async () => ({ error: null })
          return chain
        },
      }
    },
  }
}

describe('messages route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseAdminMock.mockReturnValue(createMessagesAdmin([{ id: 'msg-1', message_body: 'hello' }]))
    notifyUserMock.mockResolvedValue({ channels: ['push'] })
  })

  it('returns unauthorized when message authz fails', async () => {
    getRequestAuthzMock.mockRejectedValue(new AuthzError('Unauthorized', 401))

    const res = await GET(new NextRequest('http://localhost/api/messages'))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('rejects client message reads when no designated coach exists', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: null },
    })

    const res = await GET(new NextRequest('http://localhost/api/messages'))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'No designated trainer assigned yet.' })
  })

  it('requires clientId for coach message thread reads', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach', designated_coach_id: null },
    })

    const res = await GET(new NextRequest('http://localhost/api/messages'))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'clientId is required for coach message threads.' })
  })

  it('reads an assigned coach thread and normalizes soft-delete flags', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach', designated_coach_id: null },
    })

    const res = await GET(new NextRequest('http://localhost/api/messages?clientId=client-1'))

    expect(requireCoachAssignedClientMock).toHaveBeenCalledWith('coach-1', 'client-1')
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      messages: [{ id: 'msg-1', message_body: 'hello', clean_body: 'hello', is_deleted: false, deleted_at: null }],
    })
  })

  it('rejects empty messages before hitting persistence', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const req = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ message: '   ' }),
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'message is required' })
  })

  it('requires clientId for coach messages', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach', designated_coach_id: null },
    })

    const req = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello athlete' }),
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'clientId is required for coach messages.' })
  })

  it('persists a valid client message', async () => {
    supabaseAdminMock.mockReturnValue(createMessagesAdmin())
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const req = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ message: 'Need to reschedule' }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      message: {
        client_id: 'client-1',
        coach_id: 'coach-1',
        sender_id: 'client-1',
        message_body: 'Need to reschedule',
        is_deleted: false,
        deleted_at: null,
      },
    })
    expect(notifyUserMock).toHaveBeenCalledWith({
      userId: 'coach-1',
      title: 'New client message',
      body: 'Need to reschedule',
      type: 'new_message',
      data: {
        clientId: 'client-1',
        coachId: 'coach-1',
      },
    })
  })

  it('accepts valid voice note payload and formats push notification cleanly', async () => {
    supabaseAdminMock.mockReturnValue(createMessagesAdmin())
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const voicePayload = '[voice-note]:15:data:audio/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ=='
    const req = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ message: voicePayload }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      message: {
        client_id: 'client-1',
        coach_id: 'coach-1',
        sender_id: 'client-1',
        message_body: voicePayload,
        is_deleted: false,
        deleted_at: null,
      },
    })
    expect(notifyUserMock).toHaveBeenCalledWith({
      userId: 'coach-1',
      title: 'New client message',
      body: 'Voice memo (15s)',
      type: 'new_message',
      data: {
        clientId: 'client-1',
        coachId: 'coach-1',
      },
    })
  })

  it('uploads voice note audio to storage bucket and enriches response with signed CDN URL', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null })
    const createSignedUrlsMock = vi.fn().mockImplementation(async (paths: string[]) => ({
      data: paths.map(p => ({ path: p, signedUrl: `https://cdn.example.com/${p}` })),
      error: null,
    }))

    const storageMock = {
      from: vi.fn().mockReturnValue({
        upload: uploadMock,
        createSignedUrls: createSignedUrlsMock,
      }),
    }

    supabaseAdminMock.mockReturnValue(createMessagesAdmin([], storageMock))
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const voicePayload = '[voice-note]:20:data:audio/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQ=='
    const req = new NextRequest('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ message: voicePayload }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(storageMock.from).toHaveBeenCalledWith('coach-voice-notes')
    expect(uploadMock).toHaveBeenCalledOnce()
    expect(json.message.message_body).toMatch(/^\[voice-note\]:20:https:\/\/cdn\.example\.com\/client-1\/voice_/)
  })

  it('soft-deletes message when requested by sender for audit preservation', async () => {
    supabaseAdminMock.mockReturnValue(createMessagesAdmin([{
      id: 'msg-1',
      client_id: 'client-1',
      coach_id: 'coach-1',
      sender_id: 'client-1',
      message_body: 'Old message to retract',
      is_deleted: false,
    }]))

    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const req = new NextRequest('http://localhost/api/messages?messageId=msg-1', {
      method: 'DELETE',
    })

    const res = await DELETE(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.messageId).toBe('msg-1')
    expect(json.deleted_at).toBeDefined()
  })

  it('rejects message retraction from unauthorized third-party user', async () => {
    supabaseAdminMock.mockReturnValue(createMessagesAdmin([{
      id: 'msg-1',
      client_id: 'client-1',
      coach_id: 'coach-1',
      sender_id: 'client-1',
      message_body: 'Sensitive text',
      is_deleted: false,
    }]))

    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'other-user-99' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const req = new NextRequest('http://localhost/api/messages?messageId=msg-1', {
      method: 'DELETE',
    })

    const res = await DELETE(req)

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ error: 'You do not have permission to retract this message.' })
  })

  it('batch soft-deletes all messages when clearAll=true is requested', async () => {
    supabaseAdminMock.mockReturnValue(createMessagesAdmin([
      { id: 'msg-1', client_id: 'client-1', coach_id: 'coach-1', message_body: 'Hello' },
      { id: 'msg-2', client_id: 'client-1', coach_id: 'coach-1', message_body: 'World' },
    ]))

    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const req = new NextRequest('http://localhost/api/messages?clearAll=true', {
      method: 'DELETE',
    })

    const res = await DELETE(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.clearedAll).toBe(true)
  })

  it('marks messages as read for client via PATCH', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'client-1' },
      client: { role: 'client', designated_coach_id: 'coach-1' },
    })

    const req = new NextRequest('http://localhost/api/messages', {
      method: 'PATCH',
    })

    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.read_at).toBeDefined()
  })

  it('marks messages as read for coach via PATCH with clientId', async () => {
    requireCoachAssignedClientMock.mockResolvedValue({ id: 'client-1' })
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach', designated_coach_id: null },
    })

    const req = new NextRequest('http://localhost/api/messages?clientId=client-1', {
      method: 'PATCH',
    })

    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.read_at).toBeDefined()
  })

  it('rejects coach PATCH when clientId is missing', async () => {
    getRequestAuthzMock.mockResolvedValue({
      user: { id: 'coach-1' },
      client: { role: 'coach', designated_coach_id: null },
    })

    const req = new NextRequest('http://localhost/api/messages', {
      method: 'PATCH',
    })

    const res = await PATCH(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'clientId is required for coach mark read.' })
  })
})