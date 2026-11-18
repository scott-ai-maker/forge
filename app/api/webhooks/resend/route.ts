import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { suppressEmail } from '@/lib/marketing-email'
import { verifySvixWebhookSignature } from '@/lib/webhook-security'

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

export async function POST(req: NextRequest) {
  const rawBody = await req.text().catch(() => '')
  const authorized = verifySvixWebhookSignature({
    rawBody,
    headers: req.headers,
    secret: process.env.RESEND_WEBHOOK_SECRET,
    legacySecretHeaderNames: ['x-resend-webhook-secret'],
  })
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
  }

  let body: ResendWebhookPayload
  try {
    body = JSON.parse(rawBody) as ResendWebhookPayload
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

