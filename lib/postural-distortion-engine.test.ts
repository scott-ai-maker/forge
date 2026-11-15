import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  diagnosePosturalDistortions,
  type PosturalObservationsInput,
} from './postural-distortion-engine'
import {
  computePostureDailyStreak,
  getDefaultPostureProfileState,
  runQuickPostureCheckDelta,
} from './posture-profile-state'
import PostureComparisonCard from '@/components/fitness/PostureComparisonCard'
import PosturalDistortionStudio from '@/components/fitness/PosturalDistortionStudio'

function createOptimalInput(): PosturalObservationsInput {
  return {
    feetFlattenOrPronate: false,
    feetTurnOut: false,
    heelsElevate: false,
    kneesValgusInward: false,
    kneesVarusOutward: false,
    kneesHyperextended: false,
    anteriorPelvicTilt: false,
    posteriorPelvicTilt: false,
    excessiveForwardLean: false,
    asymmetricWeightShift: false,
    roundedShouldersProtracted: false,
    shouldersElevated: false,
    scapularWinging: false,
    armsFallForward: false,
    forwardHeadCarriage: false,
    cervicalHyperextension: false,
  }
}

describe('Postural Distortion Engine & Alignment Comparison Suite', () => {
  it('diagnoses Optimal Postural Alignment when zero checkpoints are flagged', () => {
    const res = diagnosePosturalDistortions(createOptimalInput())
    expect(res.syndrome).toBe('optimal_alignment')
    expect(res.severityScore).toBe(0)
    expect(res.kineticChainDysfunctionLevel).toBe('Optimal')
    expect(res.allOveractiveMuscles).toEqual([])
    expect(res.allUnderactiveMuscles).toEqual([])
    expect(res.injuryRisks).toEqual([])
    expect(res.correctiveProtocol.inhibit.length).toBeGreaterThan(0)
  })

  it('diagnoses Pronation Distortion Syndrome and Knee Varus lateral chain accurately', () => {
    const pronation = diagnosePosturalDistortions({
      ...createOptimalInput(),
      feetFlattenOrPronate: true,
      feetTurnOut: true,
      kneesValgusInward: true,
    })
    expect(pronation.syndrome).toBe('pronation_distortion')
    expect(pronation.detectedSyndromes.pronation).toBe(true)
    expect(pronation.allOveractiveMuscles).toContain('Peroneals')
    expect(pronation.allUnderactiveMuscles).toContain('Gluteus Medius')

    const varus = diagnosePosturalDistortions({
      ...createOptimalInput(),
      kneesVarusOutward: true,
      feetTurnOut: true,
    })
    expect(varus.syndrome).toBe('pronation_distortion')
    expect(varus.allUnderactiveMuscles).toContain('Adductor Complex')
  })

  it('separates Posterior Pelvic Tilt (Flat Back) from Anterior Pelvic Tilt without contradictory hip-flexor stretches', () => {
    const ppt = diagnosePosturalDistortions({
      ...createOptimalInput(),
      posteriorPelvicTilt: true,
    })
    expect(ppt.syndrome).toBe('lower_crossed')
    expect(ppt.title).toContain('Posterior Pelvic Tilt')
    expect(ppt.allOveractiveMuscles).toContain('Hamstrings')
    expect(ppt.allUnderactiveMuscles).toContain('Iliopsoas')
    // Must NOT simultaneously claim Iliopsoas is overactive when only Posterior Pelvic Tilt is present
    expect(ppt.allOveractiveMuscles).not.toContain('Iliopsoas')

    const apt = diagnosePosturalDistortions({
      ...createOptimalInput(),
      anteriorPelvicTilt: true,
      excessiveForwardLean: true,
    })
    expect(apt.syndrome).toBe('lower_crossed')
    expect(apt.title).toContain('Lower Crossed Syndrome')
    expect(apt.allOveractiveMuscles).toContain('Iliopsoas')
    expect(apt.allUnderactiveMuscles).toContain('Gluteus Maximus')
  })

  it('diagnoses Upper Crossed and Mixed Postural Distortion Syndromes', () => {
    const ucs = diagnosePosturalDistortions({
      ...createOptimalInput(),
      forwardHeadCarriage: true,
      roundedShouldersProtracted: true,
      scapularWinging: true,
    })
    expect(ucs.syndrome).toBe('upper_crossed')
    expect(ucs.allUnderactiveMuscles).toContain('Deep Cervical Flexors')
    expect(ucs.allUnderactiveMuscles).toContain('Serratus Anterior')

    const mixed = diagnosePosturalDistortions({
      ...createOptimalInput(),
      feetFlattenOrPronate: true,
      kneesValgusInward: true,
      anteriorPelvicTilt: true,
      forwardHeadCarriage: true,
      roundedShouldersProtracted: true,
    })
    expect(mixed.syndrome).toBe('mixed_distortion')
    expect(mixed.detectedSyndromes).toEqual({
      pronation: true,
      lowerCrossed: true,
      upperCrossed: true,
    })
    expect(mixed.severityScore).toBeGreaterThanOrEqual(65)
    expect(mixed.kineticChainDysfunctionLevel).toBe('Severe Dysfunction')
  })

  it('updates posture delta and computes consecutive posture streaks accurately', () => {
    const delta = runQuickPostureCheckDelta()
    expect(delta.forwardHeadDeltaDeg).toBeLessThanOrEqual(-4.5)
    expect(delta.overallPostureScore).toBeGreaterThanOrEqual(84)

    const baseState = getDefaultPostureProfileState()
    baseState.dailyLogs = {
      '2026-11-13': { date: '2026-11-13', readinessScore: 80, updatedAt: '2026-11-13T10:00:00Z' },
      '2026-11-14': { date: '2026-11-14', readinessScore: 84, updatedAt: '2026-11-14T10:00:00Z' },
    }
    baseState.deskResetCompletedDates = ['2026-11-15']
    expect(computePostureDailyStreak(baseState, '2026-11-15')).toBe(3)
  })

  it('renders PostureComparisonCard and PosturalDistortionStudio cleanly via SSR with all 16 checkpoints and shirted silhouettes', () => {
    const cardHtml = renderToStaticMarkup(React.createElement(PostureComparisonCard, { sandboxMode: true }))
    expect(cardHtml).toContain('Overlay Slider')
    expect(cardHtml).toContain('Side-by-Side')
    expect(cardHtml).toContain('Day-1 vs Day-30')
    expect(cardHtml).toContain('Scrub Mesh')
    expect(cardHtml).toContain('forge-range-slider')

    const fullCardHtml = renderToStaticMarkup(React.createElement(PostureComparisonCard))
    expect(fullCardHtml).toContain('33-Point Posture Mesh Delta')
    expect(fullCardHtml).toContain('closedby="any"')

    const studioHtml = renderToStaticMarkup(React.createElement(PosturalDistortionStudio))
    expect(studioHtml).toContain('POSTURAL DISTORTION &amp; MUSCLE SYNERGY DIAGNOSTIC STUDIO')
    expect(studioHtml).toContain('Asymmetric Weight Shift')
    expect(studioHtml).toContain('Scapular Winging')
    const checkboxMatches = studioHtml.match(/type="checkbox"/g) || []
    expect(checkboxMatches.length).toBe(16)
  })
})
