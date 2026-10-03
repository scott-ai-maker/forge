import { describe, it, expect } from 'vitest'
import { NASM_OHSA_MAPPINGS } from './nasm-assessments'

describe('Clinical Kinetic Warmup & OHSA Integration', () => {
  it('correctly maps Knee Valgus (knees_move_inward) to 4-phase CEx protocols', () => {
    const valgusMeta = NASM_OHSA_MAPPINGS.knees_move_inward
    expect(valgusMeta).toBeDefined()
    expect(valgusMeta.overactiveMuscles).toContain('Adductor Complex')
    expect(valgusMeta.underactiveMuscles).toContain('Gluteus Medius')
    expect(valgusMeta.inhibitExercises.length).toBeGreaterThan(0)
    expect(valgusMeta.lengthenExercises.length).toBeGreaterThan(0)
    expect(valgusMeta.activateExercises.length).toBeGreaterThan(0)
    expect(valgusMeta.integrateExercises.length).toBeGreaterThan(0)
  })

  it('correctly maps Excessive Forward Lean to 4-phase CEx protocols', () => {
    const leanMeta = NASM_OHSA_MAPPINGS.excessive_forward_lean
    expect(leanMeta).toBeDefined()
    expect(leanMeta.overactiveMuscles).toContain('Soleus')
    expect(leanMeta.underactiveMuscles).toContain('Anterior Tibialis')
    expect(leanMeta.inhibitExercises.some(ex => ex.name.includes('SMR'))).toBe(true)
  })

  it('correctly maps Arms Fall Forward to lat/pectoral inhibition and mid-trap activation', () => {
    const armsMeta = NASM_OHSA_MAPPINGS.arms_fall_forward
    expect(armsMeta).toBeDefined()
    expect(armsMeta.overactiveMuscles).toContain('Latissimus Dorsi')
    expect(armsMeta.underactiveMuscles).toContain('Mid / Lower Trapezius')
    expect(armsMeta.activateExercises.some(ex => ex.name.includes('Cobra') || ex.name.includes('Ball'))).toBe(true)
  })

  it('resolves verified official NASM CDN images for clinical warmup & cooldown movements with brand logo fallback', async () => {
    const { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } = await import('./nasm-generated-images')

    // Warmup Inhibit SMR
    expect(resolveGaaExerciseImage('SMR Calves & Thoracic Spine')).toBe('https://img.youtube.com/vi/6f2LO5EeB0I/hqdefault.jpg')
    expect(resolveGaaExerciseImage('SMR Peroneals')).toBe('https://img.youtube.com/vi/o0sqnX6FMzk/hqdefault.jpg')
    expect(resolveGaaExerciseImage('SMR IT-Band / TFL')).toBe('https://img.youtube.com/vi/NfWjVK7agTM/hqdefault.jpg')
    expect(resolveGaaExerciseImage('SMR Adductors (Inner Thigh)')).toBe('https://img.youtube.com/vi/Nqol0T6rKDg/hqdefault.jpg')

    // Warmup Lengthen (Static Stretches)
    expect(resolveGaaExerciseImage('Kneeling Hip Flexor & Latissimus Stretch')).toBe('https://img.youtube.com/vi/UU7Nqd_Dric/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Static Calf Stretch (Gastrocnemius / Soleus)')).toBe('https://img.youtube.com/vi/83G00Fwlqqw/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Static Standing Hamstring Stretch (Neutral Rotation)')).toBe('https://img.youtube.com/vi/h_yZV27H684/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Static Standing TFL / ITB Stretch')).toBe('https://img.youtube.com/vi/h_8VHKvi1zo/hqdefault.jpg')

    // Warmup Activate & Integrate
    expect(resolveGaaExerciseImage('Glute Bridge & Floor Prone Cobra')).toBe('https://img.youtube.com/vi/keErJXdp2lE/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Squat to Scaption / Multi-Planar Reach')).toBe('https://img.youtube.com/vi/PKjDGnwpB_o/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Isolated Anterior Tibialis Dorsiflexion')).toBe('https://img.youtube.com/vi/CeFbXhifvvA/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Side-Lying Clamshells with Band')).toBe('https://img.youtube.com/vi/V_AnVxKPFlY/hqdefault.jpg')
    expect(resolveGaaExerciseImage('Single-Leg Squat to Balance')).toBe('https://img.youtube.com/vi/sSXnaFyhiZs/hqdefault.jpg')

    // Cooldown Movements
    expect(resolveGaaExerciseImage('self myofascial release smr quadriceps')).toBe('https://img.youtube.com/vi/vUzmXO56jDI/hqdefault.jpg')
    expect(resolveGaaExerciseImage('self myofascial release smr thoracic spine')).toBe('https://img.youtube.com/vi/xKmqizOqshI/hqdefault.jpg')
    expect(resolveGaaExerciseImage('static latissimus dorsi ball stretch')).toBe('https://img.youtube.com/vi/kEH6jatSVSw/hqdefault.jpg')
    expect(resolveGaaExerciseImage('static 90 90 hamstring stretch')).toBe('https://img.youtube.com/vi/h_yZV27H684/hqdefault.jpg')

    // Outliers & Breathwork fallback to brand logo
    expect(resolveGaaExerciseImage('4-7-8 Parasympathetic Reset')).toBe(BRAND_LOGO_FALLBACK_IMAGE)
    expect(resolveGaaExerciseImage('Custom Outlier Movement XYZ')).toBe(BRAND_LOGO_FALLBACK_IMAGE)
    expect(resolveGaaExerciseImage(null)).toBe(BRAND_LOGO_FALLBACK_IMAGE)
  })
})
