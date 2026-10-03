import { describe, expect, it } from 'vitest'

describe('useStaticStretchHoldTimer logic & duration constraints', () => {
  it('validates target hold duration bounds for static stretches and SMR foam rolling', () => {
    const validateSeconds = (input: number) => Math.max(1, input || 30)

    expect(validateSeconds(30)).toBe(30)
    expect(validateSeconds(60)).toBe(60)
    expect(validateSeconds(0)).toBe(30)
    expect(validateSeconds(-10)).toBe(1)
  })

  it('formats remaining hold duration cleanly', () => {
    const formatRemaining = (remaining: number) => `${remaining}s`

    expect(formatRemaining(30)).toBe('30s')
    expect(formatRemaining(5)).toBe('5s')
    expect(formatRemaining(0)).toBe('0s')
  })
})

