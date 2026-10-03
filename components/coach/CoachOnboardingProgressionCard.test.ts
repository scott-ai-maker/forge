import { describe, expect, it } from 'vitest'
import {
  formatCheckpointLabel,
  formatSyndromeLabel,
  formatStaticPostureFinding,
} from './CoachOnboardingProgressionCard'

describe('CoachOnboardingProgressionCard Postural Finding Formatters', () => {
  describe('formatCheckpointLabel', () => {
    it('maps known kinetic chain checkpoints to standard display names', () => {
      expect(formatCheckpointLabel('feet_ankles')).toBe('Feet & Ankles')
      expect(formatCheckpointLabel('knees')).toBe('Knees')
      expect(formatCheckpointLabel('lphc')).toBe('LPHC')
      expect(formatCheckpointLabel('lumbar_pelvic_hip')).toBe('LPHC')
      expect(formatCheckpointLabel('shoulders')).toBe('Shoulders')
      expect(formatCheckpointLabel('head_neck')).toBe('Head & Neck')
      expect(formatCheckpointLabel('head_cervical')).toBe('Head & Neck')
    })

    it('formats unmapped snake_case keys cleanly', () => {
      expect(formatCheckpointLabel('thoracic_spine')).toBe('Thoracic Spine')
      expect(formatCheckpointLabel('')).toBe('')
      expect(formatCheckpointLabel(null)).toBe('')
    })
  })

  describe('formatSyndromeLabel', () => {
    it('maps distortion syndrome keys to standard clinical terminology', () => {
      expect(formatSyndromeLabel('pronation_distortion')).toBe('Pronation Distortion')
      expect(formatSyndromeLabel('lower_crossed')).toBe('Lower Crossed Syndrome')
      expect(formatSyndromeLabel('upper_crossed')).toBe('Upper Crossed Syndrome')
      expect(formatSyndromeLabel('mixed_distortion')).toBe('Mixed Distortion')
      expect(formatSyndromeLabel('optimal_alignment')).toBe('Optimal Alignment')
    })
  })

  describe('formatStaticPostureFinding', () => {
    it('handles string input cleanly', () => {
      expect(formatStaticPostureFinding('Lower Crossed Syndrome')).toBe('Lower Crossed Syndrome')
      expect(formatStaticPostureFinding('feet_flatten')).toBe('feet flatten')
    })

    it('formats checkpoint + observation object pairs properly', () => {
      expect(
        formatStaticPostureFinding({
          checkpoint: 'knees',
          observation: 'Bilateral knee valgus tracking medial',
        })
      ).toBe('Knees: Bilateral knee valgus tracking medial')

      expect(
        formatStaticPostureFinding({
          checkpoint: 'lphc',
          observation: 'Anterior pelvic tilt with hyperlordosis',
          distortionSyndrome: 'lower_crossed',
        })
      ).toBe('LPHC: Anterior pelvic tilt with hyperlordosis')
    })

    it('avoids redundant prefixes when observation already begins with checkpoint name', () => {
      expect(
        formatStaticPostureFinding({
          checkpoint: 'knees',
          observation: 'Knees move inward during stance',
        })
      ).toBe('Knees move inward during stance')
    })

    it('formats objects with distortionSyndrome only', () => {
      expect(
        formatStaticPostureFinding({
          distortionSyndrome: 'upper_crossed',
        })
      ).toBe('Upper Crossed Syndrome')
    })

    it('formats objects with name and clinicalNote', () => {
      expect(
        formatStaticPostureFinding({
          name: 'Knee Valgus Q-Angle',
          angleDegrees: 11,
          clinicalNote: 'Medial knee collapse',
        })
      ).toBe('Knee Valgus Q-Angle: Medial knee collapse')
    })

    it('formats objects with key-value pairs without [object Object]', () => {
      expect(
        formatStaticPostureFinding({
          key: 'kneesValgusInward',
          value: true,
        })
      ).toBe('Knees Valgus Inward')
    })

    it('parses JSON stringified objects safely', () => {
      const json = JSON.stringify({ checkpoint: 'knees', observation: 'Knee valgus' })
      expect(formatStaticPostureFinding(json)).toBe('Knees: Knee valgus')
    })

    it('never produces [object Object] on an array of 18 diverse postural finding objects', () => {
      const simulated18Findings = [
        { checkpoint: 'head_neck', observation: 'Forward head migration noted', distortionSyndrome: 'upper_crossed' },
        { checkpoint: 'lphc', observation: 'Anterior pelvic tilt with lumbar extension', distortionSyndrome: 'lower_crossed' },
        { checkpoint: 'knees', observation: 'Bilateral knee valgus tracking medial to 2nd toe', distortionSyndrome: 'pronation_distortion' },
        { checkpoint: 'feet_ankles', observation: 'Mild subtalar pronation and eversion', distortionSyndrome: 'pronation_distortion' },
        { checkpoint: 'knees', observation: 'Knee hyperextension in standing posture' },
        { checkpoint: 'shoulders', observation: 'Rounded protracted scapulae' },
        { checkpoint: 'shoulders', observation: 'Elevated trapezius dominance' },
        { checkpoint: 'head_neck', observation: 'Cervical extension' },
        { distortionSyndrome: 'lower_crossed' },
        { name: 'Knee Valgus Q-Angle', clinicalNote: 'Moderate valgus' },
        { name: 'Pelvic Incline', angleDegrees: 14 },
        { key: 'asymmetricWeightShift', value: true },
        { key: 'heelsElevate', value: true },
        { compensation: 'arms_fall_forward' },
        { finding: 'Subtalar Eversion' },
        { label: 'Scapular Winging' },
        'Optimal Left Ankle Dorsiflexion',
        { checkpoint: 'feet_ankles' },
      ]

      expect(simulated18Findings).toHaveLength(18)

      simulated18Findings.forEach(item => {
        const formatted = formatStaticPostureFinding(item)
        expect(formatted).not.toContain('[object Object]')
        expect(formatted.length).toBeGreaterThan(0)
      })
    })

    it('handles null, undefined, and empty objects gracefully', () => {
      expect(formatStaticPostureFinding(null)).toBe('')
      expect(formatStaticPostureFinding(undefined)).toBe('')
      expect(formatStaticPostureFinding({})).toBe('')
    })
  })
})

