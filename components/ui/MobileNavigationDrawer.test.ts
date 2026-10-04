import { describe, it, expect } from 'vitest'
import {
  CLIENT_DRAWER_SECTIONS,
  COACH_DRAWER_SECTIONS,
  type DrawerSection,
} from './MobileNavigationDrawer'

describe('MobileNavigationDrawer Structure & Unique Keys', () => {
  it('ensures all items in CLIENT_DRAWER_SECTIONS have distinct hrefs within each section', () => {
    CLIENT_DRAWER_SECTIONS.forEach((section: DrawerSection) => {
      const hrefs = section.items.map(item => item.href)
      const uniqueHrefs = new Set(hrefs)
      expect(uniqueHrefs.size).toBe(hrefs.length)
    })
  })

  it('ensures all items in COACH_DRAWER_SECTIONS have distinct hrefs within each section', () => {
    COACH_DRAWER_SECTIONS.forEach((section: DrawerSection) => {
      const hrefs = section.items.map(item => item.href)
      const uniqueHrefs = new Set(hrefs)
      expect(uniqueHrefs.size).toBe(hrefs.length)
    })
  })

  it('keeps member navigation focused on the core experience', () => {
    const memberItems = CLIENT_DRAWER_SECTIONS.flatMap(section => section.items)
    const performanceSection = CLIENT_DRAWER_SECTIONS.find(section => section.title === 'Your Performance')

    expect(memberItems).toHaveLength(10)
    expect(performanceSection?.items.map(item => item.label)).toEqual([
      'Today',
      'Training',
      'Progress',
      'Fitness Lab',
    ])
    expect(memberItems.find(item => item.label === 'Fitness Lab')?.href).toBe('/dashboard/fitness?workspace=lab')
    expect(memberItems.some(item => item.label === '3D Muscle Recovery Matrix')).toBe(false)
    expect(memberItems.some(item => item.label === 'AI Voice Cardio Studio')).toBe(false)
  })

  it('retains direct access to human coaching services and account settings', () => {
    const memberItems = CLIENT_DRAWER_SECTIONS.flatMap(section => section.items)

    expect(memberItems.map(item => item.href)).toEqual(expect.arrayContaining([
      '/dashboard/fitness?workspace=coach',
      '/dashboard/messages',
      '/dashboard/live',
      '/dashboard/book',
      '/dashboard/settings',
    ]))
  })

  it('generates completely unique keys for all client drawer items', () => {
    const keys: string[] = []
    CLIENT_DRAWER_SECTIONS.forEach(section => {
      section.items.forEach(link => {
        const itemKey = `${section.title}-${link.href}-${link.label}`
        keys.push(itemKey)
      })
    })

    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('generates completely unique keys for all coach drawer items', () => {
    const keys: string[] = []
    COACH_DRAWER_SECTIONS.forEach(section => {
      section.items.forEach(link => {
        const itemKey = `${section.title}-${link.href}-${link.label}`
        keys.push(itemKey)
      })
    })

    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('verifies that all links have valid labels, hrefs, icons, and descriptions', () => {
    const allSections = [...CLIENT_DRAWER_SECTIONS, ...COACH_DRAWER_SECTIONS]
    allSections.forEach(section => {
      expect(section.title.trim().length).toBeGreaterThan(0)
      section.items.forEach(item => {
        expect(item.label.trim().length).toBeGreaterThan(0)
        expect(item.href.trim().length).toBeGreaterThan(0)
        expect(item.desc.trim().length).toBeGreaterThan(0)
        expect(item.icon.trim().length).toBeGreaterThan(0)
      })
    })
  })
})
