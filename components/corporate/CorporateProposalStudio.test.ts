import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  computeCorporateFinancials,
  generateCorporateDocRefId,
  generateCorporateProposalSignature,
  getProposalDeliverablesList,
  CORPORATE_TIER_PRESETS,
} from '@/lib/corporate-proposal-engine'

describe('CorporateProposalStudio & Financial Engine', () => {
  describe('computeCorporateFinancials', () => {
    it('accurately calculates the 10-person team plan financials', () => {
      const annual = computeCorporateFinancials(10, 'annual')
      expect(annual.seats).toBe(10)
      expect(annual.monthlyInvestment).toBe(3500)
      expect(annual.annualInvestment).toBe(35000)
      expect(annual.activePrice).toBe(35000)
      expect(annual.annualSavings).toBe(7000) // 2 months complimentary
      expect(annual.perSeatMonthlyEffective).toBe(292)
      expect(annual.estimatedAnnualHoursRecovered).toBe(780)
      expect(annual.estimatedEnterpriseValueCreated).toBe(273000)

      const monthly = computeCorporateFinancials(10, 'monthly')
      expect(monthly.activePrice).toBe(3500)
      expect(monthly.perSeatMonthlyEffective).toBe(350)
    })

    it('accurately calculates the 4-person small team pod', () => {
      const result = computeCorporateFinancials(4, 'annual')
      expect(result.monthlyInvestment).toBe(1600)
      expect(result.annualInvestment).toBe(16000)
      expect(result.annualSavings).toBe(3200)
      expect(result.perSeatMonthlyEffective).toBe(333)
    })

    it('accurately calculates the 6-person executive small group', () => {
      const result = computeCorporateFinancials(6, 'annual')
      expect(result.monthlyInvestment).toBe(2200)
      expect(result.annualInvestment).toBe(22000)
      expect(result.annualSavings).toBe(4400)
      expect(result.perSeatMonthlyEffective).toBe(306)
    })

    it('dynamically models custom seat counts within supported 1–10 capacity', () => {
      const custom8 = computeCorporateFinancials(8, 'monthly')
      expect(custom8.seats).toBe(8)
      expect(custom8.monthlyInvestment).toBe(8 * 350) // 2800
      expect(custom8.annualInvestment).toBe(28000)
      expect(custom8.perSeatMonthlyEffective).toBe(350)
    })

    it('clamps negative or over-capacity seat counts to current 1–10 supported limit', () => {
      const low = computeCorporateFinancials(-5, 'annual')
      expect(low.seats).toBe(1)

      const high = computeCorporateFinancials(50, 'annual')
      expect(high.seats).toBe(10)
    })
  })

  describe('generateCorporateDocRefId', () => {
    it('generates proposal tracking references with organization code, team size and year', () => {
      const year = new Date().getFullYear()
      const ref1 = generateCorporateDocRefId('Apex Capital Partners', 10)
      expect(ref1).toBe(`GAA-PROP-APEX-10S-${year}`)

      const ref2 = generateCorporateDocRefId('Skadden Arps', 25)
      expect(ref2).toBe(`GAA-PROP-SKAD-25S-${year}`)

      const refEmpty = generateCorporateDocRefId('', 5)
      expect(refEmpty).toBe(`GAA-PROP-CORP-5S-${year}`)
    })
  })

  describe('generateCorporateProposalSignature', () => {
    it('generates deterministic sovereign cryptographic signatures', () => {
      const sig1 = generateCorporateProposalSignature('Apex Capital Partners', 35000, 10)
      const sig2 = generateCorporateProposalSignature('Apex Capital Partners', 35000, 10)
      const sigDiff = generateCorporateProposalSignature('Apex Capital Partners', 35001, 10)

      expect(sig1).toMatch(/^GAA-SIG-[0-9A-F]{4}-[0-9A-F]{4}$/)
      expect(sig1).toBe(sig2)
      expect(sig1).not.toBe(sigDiff)
    })
  })

  describe('getProposalDeliverablesList', () => {
    it('exposes only truly supportable small-group corporate cohorts (4, 6, and 10 dual-pod seats)', () => {
      expect(CORPORATE_TIER_PRESETS.map(preset => preset.name)).toEqual([
        'Small Team Pod',
        'Executive Small Group',
        'Dual-Pod Team',
      ])
      expect(CORPORATE_TIER_PRESETS.map(preset => preset.seats)).toEqual([4, 6, 10])
    })

    it('returns 5 core deliverables for monthly (dual-pod for >6 seats) and adds virtual clinic for annual agreements', () => {
      const monthlyDeliverables = getProposalDeliverablesList(10, 'monthly')
      expect(monthlyDeliverables.length).toBe(5)
      expect(monthlyDeliverables[0].title).toContain('10 app memberships')
      expect(monthlyDeliverables[1].title).toContain('2 pods of up to 5')

      const smallGroupDeliverables = getProposalDeliverablesList(6, 'monthly')
      expect(smallGroupDeliverables[1].title).toContain('up to 6 live')

      const annualDeliverables = getProposalDeliverablesList(10, 'annual')
      expect(annualDeliverables.length).toBe(6)
      expect(annualDeliverables[5].title).toContain('Annual virtual movement & ergonomics clinic')
    })
  })

  describe('Proposal branding, credentials, and typography', () => {
    it('verifies Coach Gordon verified credentials in CorporateProposalStudio.tsx', () => {
      const componentSource = fs.readFileSync(
        path.join(process.cwd(), 'components/corporate/CorporateProposalStudio.tsx'),
        'utf8'
      )

      expect(componentSource).toContain('COACH GORDON, B.S., NASM-CPT®')
      expect(componentSource).not.toContain('NASM MASTER TRAINER')
      expect(componentSource).toContain('Founder &amp; Performance Director · Forge Athletic')
      expect(componentSource).toContain('NASM-CPT® (#1261890687) · Prior ACE-CPT (2008–2021) · B.S. IT · ASTI CPR/AED')
      expect(componentSource).toContain('Proposal ready for review')
    })

    it('verifies shared typography standards in CorporateProposalStudio.tsx', () => {
      const componentSource = fs.readFileSync(
        path.join(process.cwd(), 'components/corporate/CorporateProposalStudio.tsx'),
        'utf8'
      )

      // Strict typography rules: Cinzel headers, Raleway uppercase buttons, tabular mono numbers
      expect(componentSource).toContain('font-serif')
      expect(componentSource).toContain('Raleway')
      expect(componentSource).toContain('font-telemetry font-mono')
      expect(componentSource).not.toContain('Bebas Neue')

      // Print engine integration
      expect(componentSource).toContain('print-theme-ivory')
      expect(componentSource).toContain('corporate-print-banner')
      expect(componentSource).toContain('window.print()')
    })

    it('verifies corporate landing page integration in app/corporate/page.tsx', () => {
      const pageSource = fs.readFileSync(
        path.join(process.cwd(), 'app/corporate/page.tsx'),
        'utf8'
      )

      expect(pageSource).toContain('CorporateProposalStudio')
      expect(pageSource).toContain('/corporate/proposal')
      expect(pageSource).toContain('BUILD A TEAM PLAN')
    })
  })
})
