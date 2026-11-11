import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_CROSSOVER_SYMMETRY_URL,
  DEFAULT_PERFORM_BETTER_URL,
  DEFAULT_REP_FITNESS_URL,
  EQUIPMENT_DISPENSARY_CATALOG,
  buildEquipmentDispensaryUrl,
  generateEquipmentPrescription,
  getEquipmentPartnersConfig,
  isEquipmentDispensaryEnabled,
} from './equipment-prescriptions'
import type { NasmAssessmentRecord } from './nasm-assessments'

function buildMockAssessment(
  overrides: Partial<NasmAssessmentRecord> = {}
): NasmAssessmentRecord {
  return {
    id: 'assess-1',
    client_id: 'client-1',
    coach_id: 'coach-1',
    assessment_date: '2026-11-11',
    static_posture: [],
    ohsa_findings: [],
    overactive_muscles: [],
    underactive_muscles: [],
    prescribed_correctives: {
      inhibit: [],
      lengthen: [],
      activate: [],
      integrate: [],
      summary: 'Test NASM CEx Plan',
    },
    created_at: '2026-11-11T00:00:00Z',
    ...overrides,
  }
}

describe('equipment-prescriptions & REP Fitness / CEx hardware dispensary', () => {
  it('configures REP Fitness, Crossover Symmetry (15% off), and Perform Better (10% off) by default', () => {
    expect(isEquipmentDispensaryEnabled).toBe(true)
    const partners = getEquipmentPartnersConfig()

    expect(partners.rep_fitness.baseUrl).toContain(DEFAULT_REP_FITNESS_URL)
    expect(partners.rep_fitness.perkBadgeText).toBe('FREE US SHIPPING')
    expect(partners.crossover_symmetry.discountPercentage).toBe(15)
    expect(partners.crossover_symmetry.baseUrl).toContain(DEFAULT_CROSSOVER_SYMMETRY_URL)
    expect(partners.perform_better.discountPercentage).toBe(10)
    expect(partners.perform_better.baseUrl).toContain(DEFAULT_PERFORM_BETTER_URL)

    expect(EQUIPMENT_DISPENSARY_CATALOG.length).toBe(16)
    const shoulderKit = EQUIPMENT_DISPENSARY_CATALOG.find(i => i.id === 'cs_shoulder_system')
    expect(shoulderKit?.retailPriceUsd).toBe(199)
    expect(shoulderKit?.clientDiscountPriceUsd).toBe(169.15)

    const quickDraw = EQUIPMENT_DISPENSARY_CATALOG.find(i => i.id === 'rep_quickdraw_dumbbells')
    expect(quickDraw?.partnerId).toBe('rep_fitness')
    expect(quickDraw?.retailPriceUsd).toBe(495.99)
    expect(quickDraw?.clientDiscountPriceUsd).toBe(495.99)
  })

  it('builds verified direct partner product URLs for REP Fitness, Crossover Symmetry, and Perform Better', () => {
    const repUrl = buildEquipmentDispensaryUrl(
      'rep_fitness',
      '/products/quickdraw-adjustable-dumbbell-lb'
    )
    const repRackUrl = buildEquipmentDispensaryUrl(
      'rep_fitness',
      '/products/pr-4000-power-rack-pre-selected'
    )
    const csUrl = buildEquipmentDispensaryUrl(
      'crossover_symmetry',
      '/products/individual-package'
    )
    const pbUrl = buildEquipmentDispensaryUrl(
      'perform_better',
      '/First-Place-6-Round-EVA-Foam-Roller/'
    )

    expect(repUrl).toContain('repfitness.com/products/quickdraw-adjustable-dumbbell-lb')
    expect(repRackUrl).toContain('repfitness.com/products/pr-4000-power-rack-pre-selected')
    expect(csUrl).toContain('crossoversymmetry.com/products/individual-package')
    expect(pbUrl).toContain('performbetter.com/First-Place-6-Round-EVA-Foam-Roller/')
  })

  it('computes 3-Tier Home-Gym Blueprints and deducts already-owned REP / corrective items', () => {
    const unownedRes = generateEquipmentPrescription({ ownedEquipment: [] })
    expect(unownedRes.homeGymTiers.map(t => t.id)).toEqual([
      'tier1_compact_studio',
      'tier2_cable_corrective',
      'tier3_full_sanctuary',
    ])

    const tier1Full = unownedRes.homeGymTiers.find(t => t.id === 'tier1_compact_studio')!
    expect(tier1Full.totalCount).toBe(5)
    expect(tier1Full.ownedCount).toBe(0)
    expect(tier1Full.remainingUnownedUsd).toBe(tier1Full.fullPackageTotalUsd)

    const partialOwnedRes = generateEquipmentPrescription({
      ownedEquipment: ['Dumbbells', 'Adjustable Bench', 'Foam Roller'],
    })
    const tier1Partial = partialOwnedRes.homeGymTiers.find(t => t.id === 'tier1_compact_studio')!
    expect(tier1Partial.ownedCount).toBe(3)
    expect(tier1Partial.remainingUnownedUsd).toBeLessThan(tier1Full.fullPackageTotalUsd)
  })

  it('elevates Crossover Symmetry Shoulder System when Upper Crossed / Arms Fall Forward is flagged', () => {
    const assessment = buildMockAssessment({
      static_posture: [
        {
          checkpoint: 'shoulders',
          observation: 'Rounded shoulders',
          distortionSyndrome: 'upper_crossed',
        },
      ],
      ohsa_findings: [
        {
          compensation: 'arms_fall_forward',
          view: 'lateral',
          checkpoint: 'shoulders',
          severity: 'moderate',
        },
      ],
      prescribed_correctives: {
        inhibit: [
          {
            name: 'SMR Thoracic & Lats',
            phaseType: 'inhibit',
            targetMuscle: 'Latissimus Dorsi',
            protocol: '30s',
            repsOrDuration: '30-60s',
            coachingCues: ['Roll slowly'],
          },
        ],
        lengthen: [],
        activate: [
          {
            name: 'Standing Scaption',
            phaseType: 'activate',
            targetMuscle: 'Lower Trapezius',
            protocol: '2x12',
            repsOrDuration: '12 reps',
            coachingCues: ['4/2/2 tempo'],
          },
        ],
        integrate: [],
        summary: 'Upper Crossed corrective plan',
      },
    })

    const res = generateEquipmentPrescription({ assessment })
    expect(res.hasActiveAssessmentMapping).toBe(true)

    const shoulderSystem = res.prescribedItems.find(i => i.id === 'cs_shoulder_system')
    expect(shoulderSystem?.necessityTier).toBe('essential_corrective')
    expect(shoulderSystem?.prescribedReasons.join(' ')).toContain('Arms Fall Forward')
    expect(shoulderSystem?.prescribedReasons.join(' ')).toContain('Upper Crossed')
  })

  it('elevates Hip Halo and Mini-Bands when Knee Valgus or SLS instability is flagged', () => {
    const assessment = buildMockAssessment({
      ohsa_findings: [
        {
          compensation: 'knees_move_inward',
          view: 'anterior',
          checkpoint: 'knees',
          severity: 'moderate',
        },
      ],
      single_leg_squat: [
        {
          leg: 'left',
          kneeValgus: true,
          pelvicDrop: true,
          pelvicRotation: false,
          torsoLean: false,
        },
      ],
    })

    const res = generateEquipmentPrescription({ assessment, optPhase: 1 })
    const hipHalo = res.prescribedItems.find(i => i.id === 'cs_hip_halo')
    const miniBands = res.prescribedItems.find(i => i.id === 'pb_mini_band_pack')
    const balancePad = res.prescribedItems.find(i => i.id === 'pb_airex_balance_pad')

    expect(hipHalo?.necessityTier).toBe('essential_corrective')
    expect(hipHalo?.prescribedReasons.join(' ')).toContain('Knees Move Inward (Valgus)')
    expect(miniBands?.necessityTier).toBe('essential_corrective')
    expect(balancePad?.prescribedReasons.join(' ')).toContain('Phase 1')
  })

  it('enforces Forge Athletic brand standards, FTC disclosure, and UI surface integrations', () => {
    const engineSource = fs.readFileSync(
      path.resolve(process.cwd(), 'lib/equipment-prescriptions.ts'),
      'utf-8'
    )
    const widgetSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/fitness/EquipmentDispensaryWidget.tsx'),
      'utf-8'
    )
    const nasmSummarySource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/fitness/NasmAssessmentSummary.tsx'),
      'utf-8'
    )
    const nutritionSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/fitness/MetabolicNutritionProtocol.tsx'),
      'utf-8'
    )

    const coachWorkspaceSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/coach/CoachPrescriptionsWorkspace.tsx'),
      'utf-8'
    )

    expect(engineSource).toContain('Forge Athletic')
    expect(engineSource).toContain('REP Fitness')
    expect(engineSource).toContain('FTC AFFILIATE & PRACTITIONER DISCLOSURE')
    expect(widgetSource).toContain('<article')
    expect(widgetSource).toContain('Turnkey Home-Gym Blueprints')
    expect(nasmSummarySource).toContain('EquipmentDispensaryWidget')
    expect(nutritionSource).toContain('Prescribed Gear &amp; Home Gym')
    expect(coachWorkspaceSource).toContain('Corrective &amp; Home-Gym Gear')
  })
})
