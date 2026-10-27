import { describe, expect, it } from 'vitest'
import {
  generateIcsCalendar,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from './calendar-sync'

describe('calendar-sync', () => {
  const sampleEvent = {
    title: 'Forge Athletic: Live 1-on-1 Studio Session with Coach Gordon',
    description: 'Kinetic chain assessment and OHSA movement screen.',
    startTime: '2026-11-02T22:00:00.000Z', // 5:00 PM ET
    durationMins: 60,
    location: 'https://forge-athletic.app/dashboard/live',
  }

  it('generates a valid RFC 5545 .ics iCalendar payload', () => {
    const ics = generateIcsCalendar(sampleEvent)

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('PRODID:-//Forge Athletic//Live Coaching Calendar//EN')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('DTSTART:20261102T220000Z')
    expect(ics).toContain('DTEND:20261102T230000Z')
    expect(ics).toContain('SUMMARY:Forge Athletic: Live 1-on-1 Studio Session with Coach Gordon')
    expect(ics).toContain('LOCATION:https://forge-athletic.app/dashboard/live')
    expect(ics).toContain('STATUS:CONFIRMED')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-PT15M')
    expect(ics).toContain('END:VALARM')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('generates a valid Google Calendar URL with query parameters', () => {
    const url = generateGoogleCalendarUrl(sampleEvent)
    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE')
    expect(url).toContain('20261102T220000Z%2F20261102T230000Z')
    expect(url).toContain('Forge+Athletic')
  })

  it('generates an Outlook Calendar URL', () => {
    const url = generateOutlookCalendarUrl(sampleEvent)
    expect(url).toContain('https://outlook.live.com/calendar/0/deeplink/compose')
    expect(url).toContain('Forge+Athletic')
  })
})
