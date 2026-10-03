import { describe, expect, it } from 'vitest'
import { COACH_BACKGROUND_PRESETS } from './coach-backgrounds-catalog'

describe('Coach Virtual Background Catalog', () => {
  it('contains all 5 package-appropriate backgrounds and DSLR Portrait Bokeh Blur', () => {
    expect(COACH_BACKGROUND_PRESETS.length).toBe(6)

    // 1. Olympic Performance Facility (Autonomous / Performance Protocol)
    const olympic = COACH_BACKGROUND_PRESETS.find(p => p.id === 'olympic-facility')
    expect(olympic).toBeDefined()
    expect(olympic?.imageUrl).toContain('/images/backgrounds/coach-olympic-facility-gaa.jpg')
    expect(olympic?.category).toBe('Facility')

    // 2. Biomechanics Diagnostic Lab (Diagnostic & Kinetic Movement Screen)
    const diagnostic = COACH_BACKGROUND_PRESETS.find(p => p.id === 'diagnostic-lab')
    expect(diagnostic).toBeDefined()
    expect(diagnostic?.imageUrl).toContain('/images/backgrounds/coach-diagnostic-lab.jpg')
    expect(diagnostic?.category).toBe('Diagnostic Lab')

    // 3. Hybrid Concierge Sanctuary (Flagship Membership)
    const hybrid = COACH_BACKGROUND_PRESETS.find(p => p.id === 'hybrid-concierge')
    expect(hybrid).toBeDefined()
    expect(hybrid?.imageUrl).toContain('/images/backgrounds/coach-hybrid-concierge.jpg')
    expect(hybrid?.category).toBe('Facility')

    // 4. Executive 1:1 Master Suite (Private Master Retainer)
    const executive = COACH_BACKGROUND_PRESETS.find(p => p.id === 'executive-suite')
    expect(executive).toBeDefined()
    expect(executive?.imageUrl).toContain('/images/backgrounds/coach-executive-suite.jpg')
    expect(executive?.category).toBe('Executive Suite')

    // 5. Corporate Performance Lounge (Corporate Executive Retainer)
    const corporate = COACH_BACKGROUND_PRESETS.find(p => p.id === 'corporate-lounge')
    expect(corporate).toBeDefined()
    expect(corporate?.imageUrl).toContain('/images/backgrounds/coach-corporate-lounge.jpg')
    expect(corporate?.category).toBe('Executive Suite')

    // 6. DSLR Portrait Bokeh Blur
    const blurPreset = COACH_BACKGROUND_PRESETS.find(p => p.id === 'studio-blur')
    expect(blurPreset).toBeDefined()
    expect(blurPreset?.isBlur).toBe(true)
    expect(blurPreset?.category).toBe('Blur')
  })

  it('embeds the official Gordon Athletic Advisory logo mark across all package presets', () => {
    const presetsWithImages = COACH_BACKGROUND_PRESETS.filter(p => !p.isBlur)
    expect(presetsWithImages.length).toBe(5)

    for (const preset of presetsWithImages) {
      const thumbStyleStr = JSON.stringify(preset.thumbnailStyle)
      expect(thumbStyleStr).toContain('/images/gaa-brand-crest.jpg')
    }
  })

  it('confirms all background image files exist on disk with valid 1376x768 dimensions and true optical orientation', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const sharp = (await import('sharp')).default

    const presetsWithImages = COACH_BACKGROUND_PRESETS.filter(p => !p.isBlur)

    for (const preset of presetsWithImages) {
      const filePath = path.join(process.cwd(), 'public', preset.imageUrl!)
      expect(fs.existsSync(filePath)).toBe(true)

      const stat = fs.statSync(filePath)
      expect(stat.size).toBeGreaterThan(100 * 1024)

      const meta = await sharp(filePath).metadata()
      expect(meta.width).toBe(1376)
      expect(meta.height).toBe(768)
    }
  })
})
