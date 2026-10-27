/**
 * Calendar Synchronization & Export Engine for Forge Athletic
 * Generates standard RFC 5545 (.ics) iCalendar files and one-tap web calendar
 * deep links (Google Calendar, Outlook) for 1-on-1 live video coaching sessions.
 */

export interface CalendarEventParams {
  title: string
  description?: string
  startTime: Date | string
  endTime?: Date | string
  durationMins?: number
  location?: string
  url?: string
  organizerName?: string
  organizerEmail?: string
}

function formatDateToIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  )
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Builds an RFC 5545 compliant .ics file content string.
 */
export function generateIcsCalendar(params: CalendarEventParams): string {
  const start = typeof params.startTime === 'string' ? new Date(params.startTime) : params.startTime
  const duration = params.durationMins ?? 60
  const end = params.endTime
    ? typeof params.endTime === 'string'
      ? new Date(params.endTime)
      : params.endTime
    : new Date(start.getTime() + duration * 60 * 1000)

  const dtstamp = formatDateToIcsUtc(new Date())
  const dtstart = formatDateToIcsUtc(start)
  const dtend = formatDateToIcsUtc(end)
  const uid = `forge-session-${start.getTime()}-${Math.random().toString(36).substring(2, 9)}@forge-athletic.app`

  const location = params.location || 'https://forge-athletic.app/dashboard/live'
  const url = params.url || location
  const title = params.title || 'Forge Athletic: Live Coaching Session with Coach Gordon'
  const description =
    params.description ||
    '1-on-1 Live Diagnostic & Movement Screen in the Forge Athletic Video Studio.\\n\\nJoin Link: ' +
      location +
      '\\n\\nPlease join 2 minutes prior to session start.'

  const organizer = params.organizerName
    ? `ORGANIZER;CN=${escapeIcsText(params.organizerName)}:mailto:${params.organizerEmail || 'coach@forge-athletic.app'}\r\n`
    : 'ORGANIZER;CN=Coach Gordon (Forge Athletic):mailto:coach@forge-athletic.app\r\n'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Forge Athletic//Live Coaching Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${url}`,
    organizer.trimEnd(),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Forge Athletic Live Session in 15 minutes',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Forge Athletic Live Session with Coach Gordon today',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Generates an Add-to-Google-Calendar URL.
 */
export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const start = typeof params.startTime === 'string' ? new Date(params.startTime) : params.startTime
  const duration = params.durationMins ?? 60
  const end = params.endTime
    ? typeof params.endTime === 'string'
      ? new Date(params.endTime)
      : params.endTime
    : new Date(start.getTime() + duration * 60 * 1000)

  const dtstart = formatDateToIcsUtc(start)
  const dtend = formatDateToIcsUtc(end)

  const title = params.title || 'Forge Athletic: Live 1-on-1 Studio Session with Coach Gordon'
  const location = params.location || 'https://forge-athletic.app/dashboard/live'
  const details =
    params.description ||
    `1-on-1 Live Diagnostic & Movement Screen in the Forge Athletic Video Studio.\n\nStudio Room Link: ${location}\n\nPlease enter the studio 2 minutes prior to session start.`

  const queryParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtstart}/${dtend}`,
    details,
    location,
  })

  return `https://calendar.google.com/calendar/render?${queryParams.toString()}`
}

/**
 * Generates an Add-to-Outlook Web Calendar URL.
 */
export function generateOutlookCalendarUrl(params: CalendarEventParams): string {
  const start = typeof params.startTime === 'string' ? new Date(params.startTime) : params.startTime
  const duration = params.durationMins ?? 60
  const end = params.endTime
    ? typeof params.endTime === 'string'
      ? new Date(params.endTime)
      : params.endTime
    : new Date(start.getTime() + duration * 60 * 1000)

  const title = params.title || 'Forge Athletic: Live 1-on-1 Studio Session with Coach Gordon'
  const location = params.location || 'https://forge-athletic.app/dashboard/live'
  const details =
    params.description ||
    `1-on-1 Live Diagnostic & Movement Screen in the Forge Athletic Video Studio.\n\nStudio Room Link: ${location}`

  const queryParams = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: details,
    location,
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${queryParams.toString()}`
}

/**
 * Triggers a browser download of the .ics file.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
