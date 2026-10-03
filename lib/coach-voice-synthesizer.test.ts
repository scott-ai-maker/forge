import { describe, expect, it } from 'vitest'
import { sanitizeCoachSpeechText } from './coach-voice-synthesizer'

describe('coach-voice-synthesizer', () => {
  describe('sanitizeCoachSpeechText', () => {
    it('strips all emojis so speech synthesizers do not speak their names', () => {
      const raw = '🎯 Primary Focus: Upper body strength ⚡ Target Effort: High intensity 💡 Key Form Cue: Lock in'
      const clean = sanitizeCoachSpeechText(raw)

      expect(clean).not.toContain('🎯')
      expect(clean).not.toContain('⚡')
      expect(clean).not.toContain('💡')
      expect(clean).toBe('Primary Focus. Upper body strength Target Effort. High intensity Key Form Cue. Lock in')
    })

    it('strips UI decorators and symbol characters', () => {
      const raw = '🔊 Listen to Briefing (15s) · 🛡️ Primed Overload · 🏃 Cardio Session'
      const clean = sanitizeCoachSpeechText(raw)

      expect(clean).not.toContain('🔊')
      expect(clean).not.toContain('🛡️')
      expect(clean).not.toContain('🏃')
      expect(clean).not.toContain('·')
      expect(clean).toContain('15 seconds')
    })

    it('phonetically expands abbreviations like 1RM, SMR, and RPE ranges', () => {
      const raw = 'Based on 1RM of 225 lbs. Perform SMR calves for 30s. Target RPE 8.5–9.5 for 2–3s eccentric.'
      const clean = sanitizeCoachSpeechText(raw)

      expect(clean).toContain('one rep max')
      expect(clean).toContain('S M R')
      expect(clean).toContain('30 seconds')
      expect(clean).toContain('8.5 to 9.5')
      expect(clean).toContain('2 to 3 seconds')
      expect(clean).not.toContain('–')
    })

    it('strips markdown formatting like bold, italics, and headers', () => {
      const raw = '### Day 1: **Chest & Back**. Maintain `2/0/2` tempo on *all* sets.'
      const clean = sanitizeCoachSpeechText(raw)

      expect(clean).not.toContain('**')
      expect(clean).not.toContain('*')
      expect(clean).not.toContain('`')
      expect(clean).not.toContain('###')
      expect(clean).toBe('Day 1. Chest & Back. Maintain 2/0/2 tempo on all sets.')
    })

    it('handles empty or null strings gracefully', () => {
      expect(sanitizeCoachSpeechText('')).toBe('')
    })
  })

  describe('COACH_GORDON_VOICE_ID and neural synthesis coordinator', () => {
    it('standardizes on authentic ElevenLabs cloned voice ID for Coach Gordon', async () => {
      const { COACH_GORDON_VOICE_ID } = await import('./coach-voice-synthesizer')
      expect(COACH_GORDON_VOICE_ID).toBe('UPezm4CtrvcD6aNXjeU1')
    })

    it('handles prefetchCoachVoiceCue safely in node environment', async () => {
      const { prefetchCoachVoiceCue } = await import('./coach-voice-synthesizer')
      const result = await prefetchCoachVoiceCue('Stay tight and brace your core')
      expect(result).toBeNull()
    })

    it('handles playNeuralCoachVoiceCue safely and gracefully in node environment', async () => {
      const { playNeuralCoachVoiceCue } = await import('./coach-voice-synthesizer')
      const result = await playNeuralCoachVoiceCue('Great set!')
      expect(result).toBe(false)
    })

    it('safely calls speakCoachVoiceCue without throwing in node environment', async () => {
      const { speakCoachVoiceCue } = await import('./coach-voice-synthesizer')
      expect(() => speakCoachVoiceCue('Rest complete! Let\'s get this set.')).not.toThrow()
    })
  })
})
