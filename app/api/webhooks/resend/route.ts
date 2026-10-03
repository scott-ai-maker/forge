import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { suppressEmail } from '@/lib/marketing-email'

type ResendWebhookPayload = {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string[]
    subject?: string
    bounce?: {
      message?: string
    }
  }
}

function isAuthorized(req: NextRequest): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    // If not configured, allow in development/test, or fail closed in production
    return process.env.NODE_ENV !== 'production'
  }

  const headerSecret = req.headers.get('x-resend-webhook-secret')?.trim()
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

  return headerSecret === webhookSecret || bearer === webhookSecret
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
  }

  let body: ResendWebhookPayload
  try {
    body = (await req.json()) as ResendWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { type, data } = body
  if (!type || !data || !Array.isArray(data.to)) {
    return NextResponse.json({ error: 'Malformed webhook event' }, { status: 400 })
  }

  const supabase = supabaseAdmin()

  try {
    switch (type) {
      case 'email.bounced': {
        for (const recipient of data.to) {
          await suppressEmail(supabase, recipient, 'bounced')
        }
        break
      }

      case 'email.complained': {
        for (const recipient of data.to) {
          await suppressEmail(supabase, recipient, 'complained')
        }
        break
      }

      case 'email.delivered': {
        if (data.email_id) {
          await supabase
            .from('marketing_email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('provider_message_id', data.email_id)
        }
        break
      }

      default:
        // Ignore other event types (opened, clicked, sent)
        break
    }

    return NextResponse.json({ received: true, type, recipients: data.to.length })
  } catch (err) {
    console.error('Resend webhook processing error:', err)
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 })
  }
}

