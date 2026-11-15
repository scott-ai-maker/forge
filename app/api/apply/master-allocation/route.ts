import { NextRequest, NextResponse } from 'next/server'
import {
  enforceRateLimit,
  getClientIp,
  getPositiveIntEnv,
} from '@/lib/rate-limit'
import { validateInboundEmail } from '@/lib/email-validation'

type MasterAllocationPayload = {
  fullName: string
  email: string
  phone?: string
  occupationalVelocity: string
  orthopedicHistory: string
  autonomousExecution: 'yes' | 'no'
  capitalAllocated: 'yes' | 'no'
  honeypot?: string
  startTimeMs?: number
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const

function jsonNoStore(
  body: Record<string, unknown>,
  init?: { status?: number; headers?: Record<string, string> }
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init?.headers ?? {}),
    },
  })
}

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001F\u007F<>]/g, '').trim()
}

function retryAfterSeconds(resetAt: string) {
  const ms = new Date(resetAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 1000))
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return jsonNoStore({ error: 'Supabase not configured' }, { status: 503 })
  }

  let payload: MasterAllocationPayload
  try {
    const raw = await req.json()
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    payload = raw as MasterAllocationPayload
  } catch {
    return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  try {
    const fullName = sanitizeText(payload.fullName)
    const occupationalVelocity = sanitizeText(payload.occupationalVelocity)
    const orthopedicHistory = sanitizeText(payload.orthopedicHistory)
    const phone = sanitizeText(payload.phone).slice(0, 40)

    if (!payload.email || !fullName || !occupationalVelocity || !orthopedicHistory) {
      return jsonNoStore({ error: 'Missing required fields' }, { status: 400 })
    }

    if (fullName.length > 100) {
      return jsonNoStore({ error: 'Full name is too long' }, { status: 400 })
    }

    const validation = await validateInboundEmail({
      email: payload.email,
      honeypot: payload.honeypot,
      startTimeMs: payload.startTimeMs,
    })

    if (!validation.valid) {
      if (validation.isBot) {
        return jsonNoStore({ success: true })
      }
      return jsonNoStore(
        { error: validation.error || 'Invalid email address' },
        { status: 400 }
      )
    }

    const email = validation.normalizedEmail

    // Rate limiting
    const ipLimit = getPositiveIntEnv('RATE_LIMIT_APPLY_IP_LIMIT', 10)
    const ipWindowSeconds = getPositiveIntEnv('RATE_LIMIT_APPLY_IP_WINDOW_SECONDS', 60 * 60)
    const ip = getClientIp(req)
    const ipResult = await enforceRateLimit({
      key: `master_alloc:ip:${ip}`,
      limit: ipLimit,
      windowSeconds: ipWindowSeconds,
      route: '/api/apply/master-allocation',
      dimension: 'ip',
    })

    if (!ipResult.allowed) {
      return jsonNoStore(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds(ipResult.resetAt)) } }
      )
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const supabase = supabaseAdmin()

    // Store high-priority master allocation record
    const { error } = await supabase
      .from('coaching_applications')
      .insert({
        email,
        first_name: fullName,
        goal: `Occupational: ${occupationalVelocity.slice(0, 300)}`,
        primary_obstacle: `Orthopedic: ${orthopedicHistory.slice(0, 300)}`,
        support_level: 'Transformation Direct',
        budget_band: payload.capitalAllocated === 'yes' ? '$4500+/quarter' : 'exploring',
        readiness: payload.autonomousExecution === 'yes' ? 'autonomous_ready' : 'needs_motivation',
        recommended_tier: 'transformation',
        coaching_history: `Phone/WhatsApp: ${phone || 'N/A'}`,
        source: 'master_allocation_modal',
      })

    if (error) {
      console.error('Master allocation insert error:', error)
      // Non-fatal if table schema differences exist
    }

    // Trigger lead email automation
    try {
      const { triggerLeadEmailAutomation } = await import('@/lib/marketing-email')
      await triggerLeadEmailAutomation(supabase, {
        email,
        firstName: fullName.split(' ')[0] || fullName,
        source: 'apply',
        recommendedTier: 'transformation',
      })
    } catch (mailErr) {
      console.error('Master allocation mail trigger error:', mailErr)
    }

    return jsonNoStore({
      success: true,
      message: 'Master Diagnostic Application Confirmed',
      qualified: payload.autonomousExecution === 'yes' && payload.capitalAllocated === 'yes',
    })
  } catch (err) {
    console.error('Master allocation route error:', err)
    return jsonNoStore({ error: 'Server error' }, { status: 500 })
  }
}
