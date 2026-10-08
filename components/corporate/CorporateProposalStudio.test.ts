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

    it('accurately calculates the 5-person team plan', () => {
      const result = computeCorporateFinancials(5, 'annual')
      expect(result.monthlyInvestment).toBe(2000)
      expect(result.annualInvestment).toBe(20000)
      expect(result.annualSavings).toBe(4000)
      expect(result.perSeatMonthlyEffective).toBe(333)
    })

    it('accurately calculates the 25-person team plan', () => {
      const result = computeCorporateFinancials(25, 'annual')
      expect(result.monthlyInvestment).toBe(7500)
      expect(result.annualInvestment).toBe(75000)
      expect(result.annualSavings).toBe(15000)
      expect(result.perSeatMonthlyEffective).toBe(250)
    })

    it('accurately calculates the 50-person organization plan', () => {
      const result = computeCorporateFinancials(50, 'annual')
      expect(result.monthlyInvestment).toBe(13500)
      expect(result.annualInvestment).toBe(135000)
      expect(result.annualSavings).toBe(27000)
      expect(result.perSeatMonthlyEffective).toBe(225)
    })

    it('dynamically models custom seat counts with appropriate sliding scales', () => {
      const custom12 = computeCorporateFinancials(12, 'monthly')
      expect(custom12.seats).toBe(12)
      expect(custom12.monthlyInvestment).toBe(12 * 350) // 4200
      expect(custom12.annualInvestment).toBe(42000)
      expect(custom12.perSeatMonthlyEffective).toBe(350)

      const custom40 = computeCorporateFinancials(40, 'annual')
      expect(custom40.seats).toBe(40)
      expect(custom40.monthlyInvestment).toBe(40 * 270) // 10800
      expect(custom40.annualInvestment).toBe(108000)
      expect(custom40.perSeatMonthlyEffective).toBe(225)
    })

    it('clamps negative or extreme seat counts safely', () => {
      const low = computeCorporateFinancials(-5, 'annual')
      expect(low.seats).toBe(1)

      const high = computeCorporateFinancials(500, 'annual')
      expect(high.seats).toBe(250)
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
    it('uses team-first labels for the organization plan sizes', () => {
      expect(CORPORATE_TIER_PRESETS.map(preset => preset.name)).toEqual([
        'Small Team',
        'Team Plan',
        'Growing Team',
        'Organization Plan',
      ])
    })

    it('returns 5 core deliverables for monthly and adds annual clinic bonus for annual agreements', () => {
      const monthlyDeliverables = getProposalDeliverablesList(10, 'monthly')
      expect(monthlyDeliverables.length).toBe(5)
      expect(monthlyDeliverables[0].title).toContain('10 app memberships')

      const annualDeliverables = getProposalDeliverablesList(10, 'annual')
      expect(annualDeliverables.length).toBe(6)
      expect(annualDeliverables[5].title).toContain('On-site movement and ergonomics session')
    })
  })

  describe('Proposal branding, credentials, and typography', () => {
    it('verifies Coach Scott Gordon master credentials in CorporateProposalStudio.tsx', () => {
      const componentSource = fs.readFileSync(
        path.join(process.cwd(), 'components/corporate/CorporateProposalStudio.tsx'),
        'utf8'
      )

      expect(componentSource).toContain('SCOTT GORDON, NASM MASTER TRAINER')
      expect(componentSource).toContain('Founder &amp; Performance Director · Forge Athletic')
      expect(componentSource).toContain('NASM-CPT® · CES® · PES® · CNC™ · CSNC')
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
