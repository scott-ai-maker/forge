import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildRagHomeGymBlueprint } from './rag-home-gym-builder'
import type { NasmAssessmentRecord } from './nasm-assessments'

function buildAssessmentWithUpperCrossed(): NasmAssessmentRecord {
  return {
    id: 'assess-hgb-1',
    client_id: 'client-1',
    coach_id: 'coach-1',
    assessment_date: '2026-11-11',
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
    overactive_muscles: ['Pectoralis Minor', 'Latissimus Dorsi'],
    underactive_muscles: ['Lower Trapezius', 'Serratus Anterior'],
    prescribed_correctives: {
      inhibit: [],
      lengthen: [],
      activate: [],
      integrate: [],
      summary: 'Upper Crossed corrective protocol',
    },
    created_at: '2026-11-11T00:00:00Z',
  }
}

describe('rag-home-gym-builder (NASM HGD RAG + Multi-Vendor Optimizer)', () => {
  it('retrieves NASM Home Gym Design (HGD) & CES RAG citations and stays strictly within budget', () => {
    const blueprint = buildRagHomeGymBlueprint({
      athleteName: 'Jordan Rivera',
      spaceType: 'spare_room_office',
      ceilingHeight: 'standard_84_to_95in',
      floorLevel: 'ground_slab',
      budgetTier: 'studio_1500',
      primaryGoal: 'hypertrophy',
      assessment: buildAssessmentWithUpperCrossed(),
    })

    expect(blueprint.phase1MemberTotalUsd).toBeLessThanOrEqual(1500)
    expect(blueprint.ragCitations.some(c => c.id.startsWith('hgd_2'))).toBe(true)
    expect(blueprint.ragCitations.some(c => c.id.startsWith('hgd_5'))).toBe(true)
    expect(blueprint.ragCitations.some(c => c.id === 'ces3_master_study_guide')).toBe(true)

    const phase1Ids = blueprint.phase1ImmediateBuild.map(i => i.id)
    expect(phase1Ids).toContain('pb_eva_foam_roller')
    expect(phase1Ids).toContain('cs_shoulder_system')
    expect(phase1Ids).toContain('rep_quickdraw_dumbbells')

    // Never prescribe duplicate benches or duplicate racks
    const hasAb3000 = phase1Ids.includes('rep_ab3000_fid_bench')
    const hasAb3100 = phase1Ids.includes('rep_ab3100_bench')
    expect(hasAb3000 && hasAb3100).toBe(false)
  })

  it('enforces sub-84" low-ceiling and compact-corner guardrails by withholding tall racks & cable towers from Phase 1', () => {
    const lowCeilingBlueprint = buildRagHomeGymBlueprint({
      spaceType: 'corner_apartment',
      ceilingHeight: 'low_under_84in',
      floorLevel: 'upper_floor_wood_condo',
      budgetTier: 'sanctuary_5000',
      primaryGoal: 'maximal_strength',
      preferredModalities: ['barbell_rack', 'cables_functional', 'dumbbells_bench'],
    })

    const phase1Ids = lowCeilingBlueprint.phase1ImmediateBuild.map(i => i.id)
    expect(phase1Ids).not.toContain('rep_pr4000_power_rack')
    expect(phase1Ids).not.toContain('rep_pr1100_rack')
    expect(phase1Ids).not.toContain('rep_adonis_cable_tower')
    expect(phase1Ids).toContain('rep_quickdraw_dumbbells')

    // Verify low-ceiling & upper-floor acoustic specs were generated
    const specIds = lowCeilingBlueprint.siteEngineeringSpecs.map(s => s.id)
    expect(specIds).toContain('spec_ceiling_low')
    expect(specIds).toContain('spec_floor_acoustic')
  })

  it('credits already-owned equipment at $0 and unlocks garage barbell + rack + bumper plates when space & budget allow', () => {
    const garageBlueprint = buildRagHomeGymBlueprint({
      spaceType: 'garage_basement',
      ceilingHeight: 'tall_96in_plus',
      floorLevel: 'ground_slab',
      budgetTier: 'sanctuary_5000',
      primaryGoal: 'maximal_strength',
      preferredModalities: ['barbell_rack', 'cables_functional', 'dumbbells_bench'],
      ownedEquipment: ['Dumbbells', 'Foam Roller'],
    })

    expect(garageBlueprint.ownedCoreAssets.map(i => i.id)).toContain('rep_quickdraw_dumbbells')
    expect(garageBlueprint.ownedCoreAssets.map(i => i.id)).toContain('pb_eva_foam_roller')

    const phase1Ids = garageBlueprint.phase1ImmediateBuild.map(i => i.id)
    expect(phase1Ids).not.toContain('rep_quickdraw_dumbbells')
    expect(phase1Ids).toContain('rep_pr4000_power_rack')
    expect(phase1Ids).toContain('rep_colorado_barbell')
    expect(phase1Ids).toContain('rep_black_bumper_plates')
    expect(garageBlueprint.phase1MemberTotalUsd).toBeLessThanOrEqual(5000)
    expect(garageBlueprint.optUnlockPercentage).toBeGreaterThanOrEqual(90)
  })

  it('enforces HIPAA coach authorization and modern-web-guidance semantic form controls', () => {
    const coachRouteSource = fs.readFileSync(
      path.resolve(process.cwd(), 'app/api/coach/clients/[id]/home-gym-builder/route.ts'),
      'utf-8'
    )
    const builderUiSource = fs.readFileSync(
      path.resolve(process.cwd(), 'components/fitness/RagHomeGymBuilder.tsx'),
      'utf-8'
    )

    expect(coachRouteSource).toContain('requireRole(authz.client.role, [\'coach\'])')
    expect(coachRouteSource).toContain('requireCoachAssignedClient(coachId, clientId)')
    expect(builderUiSource).toContain('<form')
    expect(builderUiSource).toContain('<fieldset')
    expect(builderUiSource).toContain('<legend')
    expect(builderUiSource).toContain('role="status"')
  })
})

