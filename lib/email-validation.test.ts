import { describe, expect, it } from 'vitest'
import {
  detectEmailTypo,
  isDisposableEmailDomain,
  normalizeEmail,
  validateEmailSyntax,
  validateInboundEmail,
  verifyDomainMxRecords,
} from './email-validation'

describe('lib/email-validation', () => {
  describe('normalizeEmail', () => {
    it('lowercases and trims whitespace', () => {
      expect(normalizeEmail('  Scott@GordonAthletic.com  ')).toBe('scott@gordonathletic.com')
      expect(normalizeEmail('')).toBe('')
      expect(normalizeEmail(null)).toBe('')
      expect(normalizeEmail(undefined)).toBe('')
    })
  })

  describe('validateEmailSyntax', () => {
    it('accepts valid RFC 5322 emails', () => {
      expect(validateEmailSyntax('athlete@gordonathletic.com')).toBe(true)
      expect(validateEmailSyntax('first.last+tag@sub.domain.co')).toBe(true)
      expect(validateEmailSyntax('scott.gordon@vip.advisory.org')).toBe(true)
    })

    it('rejects invalid or malformed emails', () => {
      expect(validateEmailSyntax('plainaddress')).toBe(false)
      expect(validateEmailSyntax('@missingusername.com')).toBe(false)
      expect(validateEmailSyntax('missingdomain@.com')).toBe(false)
      expect(validateEmailSyntax('missingdot@domain')).toBe(false)
      expect(validateEmailSyntax('two@@domain.com')).toBe(false)
      expect(validateEmailSyntax('.leadingdot@domain.com')).toBe(false)
      expect(validateEmailSyntax('trailingdot.@domain.com')).toBe(false)
      expect(validateEmailSyntax('double..dot@domain.com')).toBe(false)
    })
  })

  describe('detectEmailTypo', () => {
    it('detects common domain misspellings and suggests corrections', () => {
      expect(detectEmailTypo('user@gmai.com')).toEqual({
        hasTypo: true,
        suggestedEmail: 'user@gmail.com',
        suggestedDomain: 'gmail.com',
      })
      expect(detectEmailTypo('user@yaho.com')).toEqual({
        hasTypo: true,
        suggestedEmail: 'user@yahoo.com',
        suggestedDomain: 'yahoo.com',
      })
      expect(detectEmailTypo('user@hotmial.com')).toEqual({
        hasTypo: true,
        suggestedEmail: 'user@hotmail.com',
        suggestedDomain: 'hotmail.com',
      })
      expect(detectEmailTypo('user@outlok.com')).toEqual({
        hasTypo: true,
        suggestedEmail: 'user@outlook.com',
        suggestedDomain: 'outlook.com',
      })
      expect(detectEmailTypo('user@ooutlook.com')).toEqual({
        hasTypo: true,
        suggestedEmail: 'user@outlook.com',
        suggestedDomain: 'outlook.com',
      })
      expect(detectEmailTypo('user@iclod.com')).toEqual({
        hasTypo: true,
        suggestedEmail: 'user@icloud.com',
        suggestedDomain: 'icloud.com',
      })
    })

    it('returns hasTypo: false for correct domains', () => {
      expect(detectEmailTypo('user@gmail.com')).toEqual({ hasTypo: false })
      expect(detectEmailTypo('user@gordonathletic.com')).toEqual({ hasTypo: false })
    })
  })

  describe('isDisposableEmailDomain', () => {
    it('identifies known burner and temporary mail services', () => {
      expect(isDisposableEmailDomain('tempuser@mailinator.com')).toBe(true)
      expect(isDisposableEmailDomain('spammer@10minutemail.com')).toBe(true)
      expect(isDisposableEmailDomain('guerrillamail.com')).toBe(true)
      expect(isDisposableEmailDomain('trashmail.com')).toBe(true)
    })

    it('passes legitimate consumer and corporate domains', () => {
      expect(isDisposableEmailDomain('executive@apple.com')).toBe(false)
      expect(isDisposableEmailDomain('athlete@gmail.com')).toBe(false)
    })
  })

  describe('verifyDomainMxRecords', () => {
    it('allows valid domains and test environments', async () => {
      const res = await verifyDomainMxRecords('gordonathleticadvisory.com')
      expect(res.valid).toBe(true)
    })

    it('flags test synthetic invalid domains', async () => {
      const res = await verifyDomainMxRecords('no-mx.test')
      expect(res.valid).toBe(false)
      expect(res.reason).toContain('MX')
    })
  })

  describe('validateInboundEmail', () => {
    it('validates a pristine email successfully', async () => {
      const result = await validateInboundEmail({
        email: 'Scott.Gordon@Example.com',
      })
      expect(result.valid).toBe(true)
      expect(result.normalizedEmail).toBe('scott.gordon@example.com')
    })

    it('rejects bot submission when honeypot is populated', async () => {
      const result = await validateInboundEmail({
        email: 'bot@example.com',
        honeypot: 'http://spam-link.com',
      })
      expect(result.valid).toBe(false)
      expect(result.isBot).toBe(true)
    })

    it('rejects bot submission when submitted under 800ms', async () => {
      const result = await validateInboundEmail({
        email: 'human@example.com',
        startTimeMs: Date.now() - 200, // 200ms elapsed
      })
      expect(result.valid).toBe(false)
      expect(result.isBot).toBe(true)
      expect(result.error).toContain('too fast')
    })

    it('flags common typos with suggested correction', async () => {
      const result = await validateInboundEmail({
        email: 'client@gmai.com',
      })
      expect(result.valid).toBe(false)
      expect(result.suggestedEmail).toBe('client@gmail.com')
      expect(result.error).toContain('Did you mean client@gmail.com')
    })

    it('blocks disposable emails', async () => {
      const result = await validateInboundEmail({
        email: 'throwaway@mailinator.com',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Temporary and disposable')
    })
  })
})

