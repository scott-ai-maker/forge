import { describe, it, expect, vi } from 'vitest'
import { sanitizeNumericInput, parseNumericInput, selectOnFocus } from './form-input-helpers'

describe('form-input-helpers', () => {
  describe('sanitizeNumericInput', () => {
    it('strips unwanted leading zeros before non-zero integer digits', () => {
      expect(sanitizeNumericInput('05')).toBe('5')
      expect(sanitizeNumericInput('007')).toBe('7')
      expect(sanitizeNumericInput('0135')).toBe('135')
      expect(sanitizeNumericInput('000250')).toBe('250')
    })

    it('collapses multiple zeros into a single zero', () => {
      expect(sanitizeNumericInput('0')).toBe('0')
      expect(sanitizeNumericInput('00')).toBe('0')
      expect(sanitizeNumericInput('000')).toBe('0')
    })

    it('preserves valid decimal formats starting with zero or point', () => {
      expect(sanitizeNumericInput('0.5')).toBe('0.5')
      expect(sanitizeNumericInput('0.05')).toBe('0.05')
      expect(sanitizeNumericInput('0.')).toBe('0.')
      expect(sanitizeNumericInput('.5')).toBe('.5')
      expect(sanitizeNumericInput('135.25')).toBe('135.25')
    })

    it('strips non-numeric characters and enforces at most one decimal point', () => {
      expect(sanitizeNumericInput('abc123def')).toBe('123')
      expect(sanitizeNumericInput('12.34.56')).toBe('12.3456')
      expect(sanitizeNumericInput('$135.50 lbs')).toBe('135.50')
    })

    it('handles empty and whitespace values gracefully', () => {
      expect(sanitizeNumericInput('')).toBe('')
      expect(sanitizeNumericInput('   ')).toBe('')
      expect(sanitizeNumericInput(null)).toBe('')
      expect(sanitizeNumericInput(undefined)).toBe('')
    })

    it('respects allowDecimals = false', () => {
      expect(sanitizeNumericInput('123.45', { allowDecimals: false })).toBe('12345')
      expect(sanitizeNumericInput('05.5', { allowDecimals: false })).toBe('55')
    })

    it('respects allowNegative and maxDecimals options', () => {
      expect(sanitizeNumericInput('-05', { allowNegative: true })).toBe('-5')
      expect(sanitizeNumericInput('-0.5', { allowNegative: true })).toBe('-0.5')
      expect(sanitizeNumericInput('12.3456', { maxDecimals: 2 })).toBe('12.34')
    })
  })

  describe('parseNumericInput', () => {
    it('parses valid numeric strings accurately', () => {
      expect(parseNumericInput('135')).toBe(135)
      expect(parseNumericInput('14.5')).toBe(14.5)
      expect(parseNumericInput('0')).toBe(0)
      expect(parseNumericInput(225)).toBe(225)
    })

    it('returns fallback for empty, invalid, or nullish values without NaN', () => {
      expect(parseNumericInput('', 0)).toBe(0)
      expect(parseNumericInput('   ', 10)).toBe(10)
      expect(parseNumericInput(null, 5)).toBe(5)
      expect(parseNumericInput(undefined, 20)).toBe(20)
      expect(parseNumericInput('abc', 100)).toBe(100)
    })
  })

  describe('selectOnFocus', () => {
    it('calls select on the target input element', () => {
      const selectMock = vi.fn()
      const mockEvent = {
        target: { select: selectMock },
      } as unknown as React.FocusEvent<HTMLInputElement>

      selectOnFocus(mockEvent)
      expect(selectMock).toHaveBeenCalledTimes(1)
    })
  })
})

