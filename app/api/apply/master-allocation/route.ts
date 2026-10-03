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

function retryAfterSeconds(resetAt: string) {
  const ms = new Date(resetAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 1000))
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const payload = (await req.json()) as MasterAllocationPayload

    if (!payload.email || !payload.fullName || !payload.occupationalVelocity || !payload.orthopedicHistory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validation = await validateInboundEmail({
      email: payload.email,
      honeypot: payload.honeypot,
      startTimeMs: payload.startTimeMs,
    })

    if (!validation.valid) {
      if (validation.isBot) {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json(
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
      return NextResponse.json(
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
        first_name: payload.fullName.trim(),
        goal: `Occupational: ${payload.occupationalVelocity.slice(0, 300)}`,
        primary_obstacle: `Orthopedic: ${payload.orthopedicHistory.slice(0, 300)}`,
        support_level: 'Executive 1:1 Master Retainer',
        budget_band: payload.capitalAllocated === 'yes' ? '$4500+/quarter' : 'exploring',
        readiness: payload.autonomousExecution === 'yes' ? 'autonomous_ready' : 'needs_motivation',
        recommended_tier: 'transformation',
        coaching_history: `Phone/WhatsApp: ${payload.phone?.trim() || 'N/A'}`,
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
        firstName: payload.fullName.split(' ')[0] || payload.fullName,
        source: 'apply',
        recommendedTier: 'transformation',
      })
    } catch (mailErr) {
      console.error('Master allocation mail trigger error:', mailErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Master Diagnostic Application Confirmed',
      qualified: payload.autonomousExecution === 'yes' && payload.capitalAllocated === 'yes',
    })
  } catch (err) {
    console.error('Master allocation route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
