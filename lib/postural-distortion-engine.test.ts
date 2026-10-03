import { describe, it, expect } from 'vitest'
import { diagnosePosturalDistortions } from './postural-distortion-engine'

describe('Postural Distortion Syndrome & Muscle Synergy Diagnostic Engine', () => {
  it('diagnoses Pronation Distortion Syndrome when feet flatten and knees collapse inward', () => {
    const diag = diagnosePosturalDistortions({
      feetFlattenOrPronate: true,
      feetTurnOut: true,
      heelsElevate: false,
      kneesValgusInward: true,
      kneesVarusOutward: false,
      kneesHyperextended: false,
      anteriorPelvicTilt: false,
      posteriorPelvicTilt: false,
      excessiveForwardLean: false,
      asymmetricWeightShift: false,
      roundedShouldersProtracted: false,
      shouldersElevated: false,
      scapularWinging: false,
      armsFallForward: false,
      forwardHeadCarriage: false,
      cervicalHyperextension: false,
    })

    expect(diag.syndrome).toBe('pronation_distortion')
    expect(diag.detectedSyndromes.pronation).toBe(true)
    expect(diag.allOveractiveMuscles).toContain('Adductors')
    expect(diag.allUnderactiveMuscles).toContain('Gluteus Medius')
    expect(diag.injuryRisks).toContain('Patellofemoral Pain Syndrome (PFPS)')
    expect(diag.correctiveProtocol.inhibit[0].name).toContain('Peroneals')
  })

  it('diagnoses Lower Crossed Syndrome when anterior pelvic tilt is present', () => {
    const diag = diagnosePosturalDistortions({
      feetFlattenOrPronate: false,
      feetTurnOut: false,
      heelsElevate: false,
      kneesValgusInward: false,
      kneesVarusOutward: false,
      kneesHyperextended: true,
      anteriorPelvicTilt: true,
      posteriorPelvicTilt: false,
      excessiveForwardLean: true,
      asymmetricWeightShift: false,
      roundedShouldersProtracted: false,
      shouldersElevated: false,
      scapularWinging: false,
      armsFallForward: false,
      forwardHeadCarriage: false,
      cervicalHyperextension: false,
    })

    expect(diag.syndrome).toBe('lower_crossed')
    expect(diag.detectedSyndromes.lowerCrossed).toBe(true)
    expect(diag.allOveractiveMuscles).toContain('Iliopsoas')
    expect(diag.allUnderactiveMuscles).toContain('Gluteus Maximus')
    expect(diag.injuryRisks).toContain('Low-Back SI Joint Pain')
    expect(diag.correctiveProtocol.lengthen[0].name).toContain('Hip Flexor')
  })

  it('diagnoses Upper Crossed Syndrome when forward head and rounded shoulders are present', () => {
    const diag = diagnosePosturalDistortions({
      feetFlattenOrPronate: false,
      feetTurnOut: false,
      heelsElevate: false,
      kneesValgusInward: false,
      kneesVarusOutward: false,
      kneesHyperextended: false,
      anteriorPelvicTilt: false,
      posteriorPelvicTilt: false,
      excessiveForwardLean: false,
      asymmetricWeightShift: false,
      roundedShouldersProtracted: true,
      shouldersElevated: true,
      scapularWinging: true,
      armsFallForward: true,
      forwardHeadCarriage: true,
      cervicalHyperextension: true,
    })

    expect(diag.syndrome).toBe('upper_crossed')
    expect(diag.detectedSyndromes.upperCrossed).toBe(true)
    expect(diag.allOveractiveMuscles).toContain('Upper Trapezius')
    expect(diag.allUnderactiveMuscles).toContain('Serratus Anterior')
    expect(diag.injuryRisks).toContain('Subacromial Bursitis')
    expect(diag.correctiveProtocol.activate[0].name).toContain('Chin Tucks')
  })

  it('diagnoses Mixed Postural Distortion Syndrome when multiple checkpoints are distorted', () => {
    const diag = diagnosePosturalDistortions({
      feetFlattenOrPronate: true,
      feetTurnOut: false,
      heelsElevate: false,
      kneesValgusInward: true,
      kneesVarusOutward: false,
      kneesHyperextended: false,
      anteriorPelvicTilt: true,
      posteriorPelvicTilt: false,
      excessiveForwardLean: true,
      asymmetricWeightShift: false,
      roundedShouldersProtracted: true,
      shouldersElevated: false,
      scapularWinging: false,
      armsFallForward: false,
      forwardHeadCarriage: true,
      cervicalHyperextension: false,
    })

    expect(diag.syndrome).toBe('mixed_distortion')
    expect(diag.severityScore).toBeGreaterThanOrEqual(50)
    expect(diag.correctiveProtocol.inhibit.length).toBeGreaterThanOrEqual(4)
  })

  it('diagnoses knee varus lateral chain distortion when kneesVarusOutward is true', () => {
    const diag = diagnosePosturalDistortions({
      feetFlattenOrPronate: false,
      feetTurnOut: false,
      heelsElevate: false,
      kneesValgusInward: false,
      kneesVarusOutward: true,
      kneesHyperextended: false,
      anteriorPelvicTilt: false,
      posteriorPelvicTilt: false,
      excessiveForwardLean: false,
      asymmetricWeightShift: false,
      roundedShouldersProtracted: false,
      shouldersElevated: false,
      scapularWinging: false,
      armsFallForward: false,
      forwardHeadCarriage: false,
      cervicalHyperextension: false,
    })

    expect(diag.allOveractiveMuscles).toContain('TFL')
    expect(diag.allUnderactiveMuscles).toContain('Adductor Complex')
    expect(diag.injuryRisks).toContain('IT Band Syndrome')
    expect(diag.correctiveProtocol.activate.some(ex => ex.name.includes('Adductor'))).toBe(true)
  })

  it('diagnoses posterior pelvic tilt and hamstring dominance when posteriorPelvicTilt is true', () => {
    const diag = diagnosePosturalDistortions({
      feetFlattenOrPronate: false,
      feetTurnOut: false,
      heelsElevate: false,
      kneesValgusInward: false,
      kneesVarusOutward: false,
      kneesHyperextended: false,
      anteriorPelvicTilt: false,
      posteriorPelvicTilt: true,
      excessiveForwardLean: false,
      asymmetricWeightShift: false,
      roundedShouldersProtracted: false,
      shouldersElevated: false,
      scapularWinging: false,
      armsFallForward: false,
      forwardHeadCarriage: false,
      cervicalHyperextension: false,
    })

    expect(diag.syndrome).toBe('lower_crossed')
    expect(diag.title).toContain('Posterior Pelvic Tilt')
    expect(diag.allOveractiveMuscles).toContain('Hamstrings')
    expect(diag.allUnderactiveMuscles).toContain('Iliopsoas')
    expect(diag.injuryRisks).toContain('Lumbar Disc Herniation Risk')
  })
})
