import { describe, it, expect, vi } from 'vitest'
import { COACH_BACKGROUND_PRESETS } from '@/lib/coach-backgrounds-catalog'

describe('CoachVirtualBackgroundPickerModal Architecture & Training Suite', () => {
  it('covers all client training modalities in the preset suite', () => {
    const categories = new Set(COACH_BACKGROUND_PRESETS.map((p) => p.category))

    expect(categories.has('Assessment & Triage')).toBe(true)
    expect(categories.has('Stabilization & Balance')).toBe(true)
    expect(categories.has('Hypertrophy & Physique')).toBe(true)
    expect(categories.has('Maximal Strength')).toBe(true)
    expect(categories.has('Athletic Power & SAQ')).toBe(true)
    expect(categories.has('Metabolic Conditioning')).toBe(true)
    expect(categories.has('Recovery & Longevity')).toBe(true)
    expect(categories.has('Executive Suite')).toBe(true)
    expect(categories.has('Blur')).toBe(true)
  })

  it('provides rich training modality and recommended-for descriptors for every preset', () => {
    for (const preset of COACH_BACKGROUND_PRESETS) {
      expect(preset.trainingModality).toBeTruthy()
      expect(preset.recommendedFor).toBeTruthy()
      expect(preset.badge).toBeTruthy()
    }
  })

  it('filters presets accurately by category and search terms', () => {
    const hypertrophyItems = COACH_BACKGROUND_PRESETS.filter(
      (p) => p.category === 'Hypertrophy & Physique'
    )
    expect(hypertrophyItems.length).toBe(1)
    expect(hypertrophyItems[0].name).toContain('Hypertrophy')

    const metabolicItems = COACH_BACKGROUND_PRESETS.filter(
      (p) => p.category === 'Metabolic Conditioning'
    )
    expect(metabolicItems.length).toBe(1)
    expect(metabolicItems[0].tagline).toContain('treadmills')

    const recoveryItems = COACH_BACKGROUND_PRESETS.filter(
      (p) => p.category === 'Recovery & Longevity'
    )
    expect(recoveryItems.length).toBe(1)
    expect(recoveryItems[0].badge).toContain('Recovery')
  })
})
