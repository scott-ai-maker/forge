import { NextRequest, NextResponse } from 'next/server'
import { getRequestAuthz, requireRole, AuthzError } from '@/lib/authz'
import { generateSlots } from '@/lib/session-slots'

// Returns available 1-hour slots for the next 28 days (self-service booking).
// Coach Gordon Active Coaching Hours (America/New_York):
//   Mon–Fri: 5:00 PM – 8:00 PM  (hourly slots: 5:00 PM, 6:00 PM, 7:00 PM; ending at 8:00 PM)
//   Weekends (Sat & Sun): 8:00 AM – 2:00 PM (hourly slots: 8am, 9am, 10am, 11am, 12pm, 1pm; ending at 2:00 PM)

export async function GET(req: NextRequest) {
  try {
    const authz = await getRequestAuthz(req)
    requireRole(authz.client.role, ['client', 'coach'])
  } catch (error) {
    const status = error instanceof AuthzError ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unauthorized'
    return NextResponse.json({ error: message }, { status })
  }

  const { supabaseAdmin } = await import('@/lib/supabase')

  const url = new URL(req.url)
  const requestedDays = parseInt(url.searchParams.get('days') || '28', 10)
  const daysAhead = Math.min(Math.max(Number.isFinite(requestedDays) ? requestedDays : 28, 7), 60)

  const now = new Date()
  const windowLimit = new Date(now)
  windowLimit.setDate(windowLimit.getDate() + daysAhead)

  const { data: booked } = await supabaseAdmin()
    .from('sessions')
    .select('scheduled_at')
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', windowLimit.toISOString())

  // Normalize booked times to "YYYY-MM-DDTHH:MM" for comparison
  const bookedTimes = new Set(
    (booked ?? []).map(s => s.scheduled_at.substring(0, 16))
  )

  const slots = generateSlots(now, daysAhead).filter(
    s => !bookedTimes.has(s.datetime.substring(0, 16))
  )

  return NextResponse.json(slots)
}
