import { describe, it, expect } from 'vitest'
import {
  COMMON_SPORTS_INJURIES,
  getAllSportsInjuries,
  getSportsInjuryById,
  getSportsInjuriesByRegion,
  parseInjuriesFromText,
  serializeInjuriesWithNotes,
  getInjuryAugmentations,
} from './sports-injuries'

describe('sports-injuries', () => {
  it('contains essential sports injuries requested by user', () => {
    expect(COMMON_SPORTS_INJURIES.runners_knee).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.tennis_elbow).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.golfers_elbow).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.jumpers_knee).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.it_band_syndrome).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.shin_splints).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.plantar_fasciitis).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.rotator_cuff_impingement).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.lumbar_strain_disc).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.hamstring_strain).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.achilles_tendinopathy).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.ankle_sprain_instability).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.hip_impingement_fai).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.cervical_strain_neck).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.wrist_strain_carpal).toBeDefined()
    expect(COMMON_SPORTS_INJURIES.groin_adductor_strain).toBeDefined()
  })

  it('strictly enforces neutral hammer grip rule on tennis elbow and wrist strain', () => {
    const tennisElbow = COMMON_SPORTS_INJURIES.tennis_elbow
    const hammerSub = tennisElbow.prescribedSubstitutions.find(s => s.replacement.includes('Hammer Curl'))
    expect(hammerSub).toBeDefined()
    expect(hammerSub?.coachingCue.toLowerCase()).toContain('neutral hammer grip')
    expect(hammerSub?.coachingCue.toLowerCase()).toContain('zero twisting or supination')

    const wristStrain = COMMON_SPORTS_INJURIES.wrist_strain_carpal
    const wristHammerSub = wristStrain.prescribedSubstitutions.find(s => s.replacement.includes('Hammer Curl'))
    expect(wristHammerSub).toBeDefined()
    expect(wristHammerSub?.coachingCue.toLowerCase()).toContain('neutral hammer grip')
    expect(wristHammerSub?.coachingCue.toLowerCase()).toContain('zero twisting or supination')
  })

  it('groups injuries by anatomical region accurately', () => {
    const grouped = getSportsInjuriesByRegion()
    expect(grouped.knee.length).toBeGreaterThanOrEqual(3)
    expect(grouped.elbow.length).toBeGreaterThanOrEqual(2)
    expect(grouped.shoulder.length).toBeGreaterThanOrEqual(1)
    expect(grouped.spine.length).toBeGreaterThanOrEqual(2)
    expect(grouped.foot_ankle.length).toBeGreaterThanOrEqual(3)
  })

  it('parses structured injury tags correctly', () => {
    const raw = "[injuries: runners_knee, tennis_elbow] Notes: Left knee hurts after 3 miles, right elbow hurts when lifting bags."
    const parsed = parseInjuriesFromText(raw)
    expect(parsed.selectedInjuryIds).toContain('runners_knee')
    expect(parsed.selectedInjuryIds).toContain('tennis_elbow')
    expect(parsed.customNotes).toContain('Left knee hurts after 3 miles')
  })

  it('parses natural language legacy text correctly', () => {
    const legacy = "Client has bad runner's knee and chronic tennis elbow flare-ups from pickleball"
    const parsed = parseInjuriesFromText(legacy)
    expect(parsed.selectedInjuryIds).toContain('runners_knee')
    expect(parsed.selectedInjuryIds).toContain('tennis_elbow')
  })

  it('serializes injuries and notes cleanly', () => {
    const serialized = serializeInjuriesWithNotes(['runners_knee', 'tennis_elbow'], 'Occasional morning stiffness')
    expect(serialized).toContain('[injuries: runners_knee, tennis_elbow]')
    expect(serialized).toContain("Runner's Knee")
    expect(serialized).toContain("Tennis Elbow")
    expect(serialized).toContain('Occasional morning stiffness')

    // Round-trip verification
    const roundTrip = parseInjuriesFromText(serialized)
    expect(roundTrip.selectedInjuryIds).toContain('runners_knee')
    expect(roundTrip.selectedInjuryIds).toContain('tennis_elbow')
  })

  it('aggregates injury augmentations correctly', () => {
    const augmentations = getInjuryAugmentations(['runners_knee', 'shin_splints', 'tennis_elbow'])
    expect(augmentations.substitutions.length).toBeGreaterThan(0)
    expect(augmentations.coachingCues.length).toBeGreaterThan(0)
    expect(augmentations.warmupSmr.length).toBeGreaterThan(0)
    expect(augmentations.warmupDynamic.length).toBeGreaterThan(0)
    expect(augmentations.avoidCardioModalities).toContain('outdoor-running')
    expect(augmentations.recommendedCardioModalities).toContain('stationary-bike')
  })
})
