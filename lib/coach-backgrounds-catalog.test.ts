import { describe, expect, it } from 'vitest'
import { COACH_BACKGROUND_PRESETS, getCoachBackgroundById } from './coach-backgrounds-catalog'

describe('Coach Virtual Background Catalog — Client Training Modality Suite', () => {
  it('contains all 8 training-modality backgrounds and DSLR Portrait Bokeh Blur', () => {
    expect(COACH_BACKGROUND_PRESETS.length).toBe(9)

    // 1. Biomechanical Movement Screen & Posture Triage
    const diagnostic = COACH_BACKGROUND_PRESETS.find(p => p.id === 'diagnostic-lab')
    expect(diagnostic).toBeDefined()
    expect(diagnostic?.imageUrl).toContain('/images/backgrounds/coach-assessment-movement-screen.jpg')
    expect(diagnostic?.trainingModality).toContain('Movement Screen')
    expect(diagnostic?.category).toBe('Assessment & Triage')

    // 2. Stabilization Endurance & Functional Balance
    const stabilization = COACH_BACKGROUND_PRESETS.find(p => p.id === 'functional-stabilization')
    expect(stabilization).toBeDefined()
    expect(stabilization?.imageUrl).toContain('/images/backgrounds/coach-functional-stabilization.jpg')
    expect(stabilization?.category).toBe('Stabilization & Balance')

    // 3. Hypertrophy & Muscular Architecture
    const hypertrophy = COACH_BACKGROUND_PRESETS.find(p => p.id === 'hypertrophy-muscular-architecture')
    expect(hypertrophy).toBeDefined()
    expect(hypertrophy?.imageUrl).toContain('/images/backgrounds/coach-hypertrophy-muscular-architecture.jpg')
    expect(hypertrophy?.category).toBe('Hypertrophy & Physique')

    // 4. Maximal Strength & Olympic Platform
    const olympic = COACH_BACKGROUND_PRESETS.find(p => p.id === 'olympic-facility')
    expect(olympic).toBeDefined()
    expect(olympic?.imageUrl).toContain('/images/backgrounds/coach-maximal-strength-olympic.jpg')
    expect(olympic?.category).toBe('Maximal Strength')

    // 5. Explosive Power & Athletic Turf Arena
    const athleticPower = COACH_BACKGROUND_PRESETS.find(p => p.id === 'athletic-power-turf')
    expect(athleticPower).toBeDefined()
    expect(athleticPower?.imageUrl).toContain('/images/backgrounds/coach-athletic-power-turf.jpg')
    expect(athleticPower?.category).toBe('Athletic Power & SAQ')

    // 6. Metabolic Conditioning & Bioenergetic Lab
    const metabolic = COACH_BACKGROUND_PRESETS.find(p => p.id === 'metabolic-conditioning-engine')
    expect(metabolic).toBeDefined()
    expect(metabolic?.imageUrl).toContain('/images/backgrounds/coach-metabolic-conditioning-engine.jpg')
    expect(metabolic?.category).toBe('Metabolic Conditioning')

    // 7. Mobility, Joint Longevity & Recovery Sanctuary
    const recovery = COACH_BACKGROUND_PRESETS.find(p => p.id === 'mobility-recovery-sanctuary')
    expect(recovery).toBeDefined()
    expect(recovery?.imageUrl).toContain('/images/backgrounds/coach-mobility-recovery-sanctuary.jpg')
    expect(recovery?.category).toBe('Recovery & Longevity')

    // 8. Executive 1:1 Master Sanctum
    const executive = COACH_BACKGROUND_PRESETS.find(p => p.id === 'executive-suite')
    expect(executive).toBeDefined()
    expect(executive?.imageUrl).toContain('/images/backgrounds/coach-executive-master-sanctum.jpg')
    expect(executive?.category).toBe('Executive Suite')

    // 9. DSLR Portrait Bokeh Blur
    const blurPreset = COACH_BACKGROUND_PRESETS.find(p => p.id === 'studio-blur')
    expect(blurPreset).toBeDefined()
    expect(blurPreset?.isBlur).toBe(true)
    expect(blurPreset?.category).toBe('Blur')
  })

  it('embeds the official Forge Athletic logo mark across all image-based presets', () => {
    const presetsWithImages = COACH_BACKGROUND_PRESETS.filter(p => !p.isBlur)
    expect(presetsWithImages.length).toBe(8)

    for (const preset of presetsWithImages) {
      const thumbStyleStr = JSON.stringify(preset.thumbnailStyle)
      expect(thumbStyleStr).toContain('/images/brand/forge-crest-mark.png')
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

  it('supports looking up presets by ID and legacy aliases via getCoachBackgroundById', () => {
    expect(getCoachBackgroundById('diagnostic-lab')?.id).toBe('diagnostic-lab')
    expect(getCoachBackgroundById('olympic-facility')?.id).toBe('olympic-facility')
    expect(getCoachBackgroundById('executive-suite')?.id).toBe('executive-suite')
    expect(getCoachBackgroundById('assessment-movement-screen')?.id).toBe('diagnostic-lab')
    expect(getCoachBackgroundById('forge-athletic-sanctuary')?.id).toBe('functional-stabilization')
    expect(getCoachBackgroundById('hybrid-concierge')?.id).toBe('hypertrophy-muscular-architecture')
    expect(getCoachBackgroundById('corporate-lounge')?.id).toBe('athletic-power-turf')
    expect(getCoachBackgroundById('non-existent')).toBeNull()
  })
})
