import { describe, it, expect } from 'vitest'
import {
  convertBiometricInputUnits,
  resolveScanMetricBiometrics,
} from './AiBodyCompositionScannerModal'

describe('AiBodyCompositionScannerModal Biometric Input Engine', () => {
  describe('convertBiometricInputUnits', () => {
    it('accurately converts weight between imperial lbs and metric kg on explicit toggle', () => {
      // 195 lbs -> kg
      const kg = convertBiometricInputUnits('195', 'imperial', 'weight')
      expect(kg).toBe('88.5') // 195 / 2.20462 = 88.45 -> 88.5

      // 88.5 kg -> lbs
      const lbs = convertBiometricInputUnits('88.5', 'metric', 'weight')
      expect(lbs).toBe('195.1')
    })

    it('accurately converts height between inches and centimeters', () => {
      // 70 in -> 178 cm
      const cm = convertBiometricInputUnits('70', 'imperial', 'height')
      expect(cm).toBe('178')

      // 178 cm -> 70 in
      const inches = convertBiometricInputUnits('178', 'metric', 'height')
      expect(inches).toBe('70')
    })

    it('accurately converts circumference measurements', () => {
      // 34 in waist -> 86.4 cm
      const cm = convertBiometricInputUnits('34', 'imperial', 'circumference')
      expect(cm).toBe('86.4')

      // 86.4 cm -> 34 in
      const inches = convertBiometricInputUnits('86.4', 'metric', 'circumference')
      expect(inches).toBe('34')
    })

    it('safely handles empty or non-numeric input without crashing', () => {
      expect(convertBiometricInputUnits('', 'imperial', 'weight')).toBe('')
      expect(convertBiometricInputUnits('abc', 'imperial', 'weight')).toBe('abc')
    })
  })

  describe('resolveScanMetricBiometrics', () => {
    it('converts imperial inputs to accurate metric payload for DEXA engine', () => {
      const resolved = resolveScanMetricBiometrics({
        units: 'imperial',
        weightInput: '195',
        heightInput: '70',
        ageInput: '35',
        waistInput: '33',
        neckInput: '16',
        hipInput: '38',
      })

      expect(resolved.weightKg).toBe(88.5)
      expect(resolved.heightCm).toBe(177.8)
      expect(resolved.age).toBe(35)
      expect(resolved.waistCm).toBe(83.8)
      expect(resolved.neckCm).toBe(40.6)
      expect(resolved.hipCm).toBe(96.5)
    })

    it('retains metric inputs directly when units is metric', () => {
      const resolved = resolveScanMetricBiometrics({
        units: 'metric',
        weightInput: '88.5',
        heightInput: '178',
        ageInput: '35',
        waistInput: '84',
        neckInput: '40',
      })

      expect(resolved.weightKg).toBe(88.5)
      expect(resolved.heightCm).toBe(178)
      expect(resolved.age).toBe(35)
      expect(resolved.waistCm).toBe(84)
      expect(resolved.neckCm).toBe(40)
      expect(resolved.hipCm).toBeUndefined()
    })

    it('provides clinical safe defaults when inputs are empty', () => {
      const resolved = resolveScanMetricBiometrics({
        units: 'imperial',
        weightInput: '',
        heightInput: '',
        ageInput: '',
      })

      expect(resolved.weightKg).toBe(80)
      expect(resolved.heightCm).toBe(178)
      expect(resolved.age).toBe(32)
    })
  })
})
