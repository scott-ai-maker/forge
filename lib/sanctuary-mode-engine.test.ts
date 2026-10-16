import { describe, expect, it } from 'vitest'
import {
  getBreathingPhaseAtSeconds,
  calculateSanctuaryFocusScore,
  getSanctuaryDisciplineBadge,
  getSanctuaryBadge,
  getDistractionInterceptionCue,
} from './sanctuary-mode-engine'

describe('Sanctuary Mode Engine', () => {
  describe('Breathing Cadences', () => {
    it('accurately cycles through Box 4x4 breathing phases', () => {
      // 0..4s -> Inhale
      const p0 = getBreathingPhaseAtSeconds(0, 'box_4x4')
      expect(p0.phase).toBe('inhale')
      expect(p0.phaseSeconds).toBe(4)
      expect(p0.remainingInPhase).toBe(4)
      expect(p0.progressPercent).toBe(0)

      const p2 = getBreathingPhaseAtSeconds(2, 'box_4x4')
      expect(p2.phase).toBe('inhale')
      expect(p2.remainingInPhase).toBe(2)
      expect(p2.progressPercent).toBe(50)

      // 4..8s -> Hold In
      const p5 = getBreathingPhaseAtSeconds(5, 'box_4x4')
      expect(p5.phase).toBe('hold_in')
      expect(p5.remainingInPhase).toBe(3)

      // 8..12s -> Exhale
      const p9 = getBreathingPhaseAtSeconds(9, 'box_4x4')
      expect(p9.phase).toBe('exhale')
      expect(p9.remainingInPhase).toBe(3)

      // 12..16s -> Hold Out
      const p14 = getBreathingPhaseAtSeconds(14, 'box_4x4')
      expect(p14.phase).toBe('hold_out')
      expect(p14.remainingInPhase).toBe(2)

      // 16s wraps back to Inhale
      const p16 = getBreathingPhaseAtSeconds(16, 'box_4x4')
      expect(p16.phase).toBe('inhale')
    })

    it('accurately computes 4-2-6 down-regulation breathing phases', () => {
      // 0..4s -> Inhale
      const p0 = getBreathingPhaseAtSeconds(0, 'down_reg_4_2_6')
      expect(p0.phase).toBe('inhale')
      expect(p0.phaseSeconds).toBe(4)

      // 4..6s -> Hold In
      const p4 = getBreathingPhaseAtSeconds(4, 'down_reg_4_2_6')
      expect(p4.phase).toBe('hold_in')
      expect(p4.phaseSeconds).toBe(2)

      // 6..12s -> Exhale
      const p7 = getBreathingPhaseAtSeconds(7, 'down_reg_4_2_6')
      expect(p7.phase).toBe('exhale')
      expect(p7.phaseSeconds).toBe(6)
    })
  })

  describe('Focus Scoring', () => {
    it('awards 100% focus score for uninterrupted sessions', () => {
      const score = calculateSanctuaryFocusScore(3600, 0, 0, 5)
      expect(score).toBe(100)
    })

    it('applies penalties for distraction events (tab/app switching)', () => {
      // 1 event, 10s away, 0 down-reg breaths
      const score1 = calculateSanctuaryFocusScore(3600, 1, 10, 0)
      expect(score1).toBe(85) // 100 - 14 - 1 = 85

      // 3 events, 40s away, 0 breaths
      const score3 = calculateSanctuaryFocusScore(3600, 3, 40, 0)
      expect(score3).toBe(53) // 100 - (3 * 14 = 42) - (40 / 8 = 5) = 53
    })

    it('rewards conscious down-regulation breathwork', () => {
      // 1 event (85), but with 5 breaths (+10) => 95
      const scoreWithBreaths = calculateSanctuaryFocusScore(3600, 1, 10, 5)
      expect(scoreWithBreaths).toBe(95)
    })

    it('clamps focus scores between 10 and 100', () => {
      const low = calculateSanctuaryFocusScore(3600, 20, 500, 0)
      expect(low).toBe(10)

      const high = calculateSanctuaryFocusScore(3600, 0, 0, 50)
      expect(high).toBe(100)
    })
  })

  describe('Discipline Badges & Cues', () => {
    it('assigns DIAMOND tier for 95%+ focus score', () => {
      const badge = getSanctuaryDisciplineBadge(98, 0, 8)
      expect(badge.tier).toBe('DIAMOND')
      expect(badge.title).toBe('Sanctuary Master')
      expect(badge.badge).toContain('100% Focused')
    })

    it('assigns GOLD tier for 85-94% focus score', () => {
      const badge = getSanctuaryDisciplineBadge(90, 1, 4)
      expect(badge.tier).toBe('GOLD')
      expect(badge.title).toBe('High-Discipline Lifter')

      const uiBadge = getSanctuaryBadge(90)
      expect(uiBadge.title).toBe('High-Discipline Lifter')
      expect(uiBadge.badgeColor).toBe('#FBBF24')
    })

    it('escalates intervention cues on repeated distractions', () => {
      const cue1 = getDistractionInterceptionCue(1, 'Barbell Back Squat')
      expect(cue1.headline).toContain('FOCUS RESTORED')
      expect(cue1.coachMessage).toContain('Barbell Back Squat')

      const cue2 = getDistractionInterceptionCue(2)
      expect(cue2.headline).toContain('SANCTUARY ALERT')

      const cue3 = getDistractionInterceptionCue(3)
      expect(cue3.headline).toContain('COACH GORDON')
      expect(cue3.coachMessage).toContain('We do not sell your attention')
    })
  })
})
