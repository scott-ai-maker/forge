/**
 * Slot Generation Engine for Forge Athletic Live Video Coaching Sessions
 * Business & Operating Hours (America/New_York):
 *   Mon–Fri: 5:00 PM – 8:00 PM ET (1-hour slots: 5:00 PM, 6:00 PM, 7:00 PM; ending at 8:00 PM)
 *   Weekends (Sat & Sun): 8:00 AM – 2:00 PM ET (1-hour slots: 8am, 9am, 10am, 11am, 12pm, 1pm; ending at 2:00 PM)
 */

export interface AvailableSessionSlot {
  date: string
  time: string
  datetime: string
}

export function generateSlots(now: Date, daysAhead = 28): AvailableSessionSlot[] {
  const slots: AvailableSessionSlot[] = []

  const nyWeekdayFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
  })
  const nyHourFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    hour12: false,
  })
  const nyDateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // Start from the next whole hour
  const cursor = new Date(now)
  cursor.setMinutes(0, 0, 0)
  cursor.setTime(cursor.getTime() + 3_600_000)

  const limit = new Date(now)
  limit.setDate(limit.getDate() + daysAhead)

  const dayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  while (cursor <= limit) {
    const weekday = nyWeekdayFmt.format(cursor)
    const dayNum = dayIndex[weekday] ?? -1
    const nyHour = parseInt(nyHourFmt.format(cursor), 10)

    let valid = false
    // Mon–Fri: 5pm–8pm (17:00, 18:00, 19:00 start times, each 1 hr, ending at 20:00)
    if (dayNum >= 1 && dayNum <= 5) {
      valid = nyHour >= 17 && nyHour < 20
    }
    // Weekends (Saturday & Sunday): 8am–2pm (8:00–13:00 start times, each 1 hr, ending at 14:00)
    else if (dayNum === 0 || dayNum === 6) {
      valid = nyHour >= 8 && nyHour < 14
    }

    if (valid) {
      const dateStr = nyDateFmt.format(cursor) // YYYY-MM-DD
      const h = nyHour % 12 || 12
      const ampm = nyHour < 12 ? 'AM' : 'PM'
      slots.push({
        date: dateStr,
        time: `${h}:00 ${ampm}`,
        datetime: cursor.toISOString(),
      })
    }

    cursor.setTime(cursor.getTime() + 3_600_000)
  }

  return slots
}
