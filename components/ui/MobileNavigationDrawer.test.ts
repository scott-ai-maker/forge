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

  it('verifies Fitness Lab and AI Voice Cardio Studio have distinct hrefs and keys', () => {
    const trainingSection = CLIENT_DRAWER_SECTIONS.find(s => s.title === 'Training & Periodization')
    expect(trainingSection).toBeDefined()

    const fitnessLab = trainingSection?.items.find(i => i.label === 'Fitness Lab')
    const cardioStudio = trainingSection?.items.find(i => i.label === 'AI Voice Cardio Studio')

    expect(fitnessLab).toBeDefined()
    expect(cardioStudio).toBeDefined()

    expect(fitnessLab?.href).toBe('/dashboard/fitness?workspace=train')
    expect(cardioStudio?.href).toBe('/dashboard/fitness?workspace=train#cardio-studio')
    expect(fitnessLab?.href).not.toBe(cardioStudio?.href)

    const labKey = `${trainingSection?.title}-${fitnessLab?.href}-${fitnessLab?.label}`
    const cardioKey = `${trainingSection?.title}-${cardioStudio?.href}-${cardioStudio?.label}`
    expect(labKey).not.toBe(cardioKey)
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

