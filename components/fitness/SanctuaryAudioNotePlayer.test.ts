import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('SanctuaryAudioNotePlayer Component Architecture & Design Standards', () => {
  const componentPath = path.resolve(
    process.cwd(),
    'components/fitness/SanctuaryAudioNotePlayer.tsx'
  )

  it('verifies component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true)
  })

  it('contains institutional branding tokens, audio ducking, and verified coach badges', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('VERIFIED COACH')
    expect(source).toContain('In-Ear Audio Memo')
    expect(source).toContain('AirPods / Audio Ducking Active')
    expect(source).toContain('audio-waveform-bars')
    expect(source).toContain('play-sanctuary-note-btn')
    expect(source).toContain('audio-note-transcript-drawer')
    expect(source).toContain('configureAudioSession')
    expect(source).toContain('playSanctuaryAcousticIntroChime')
  })

  it('strictly adheres to brand rule: no GAA or Gordon Athletic Advisory', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).not.toContain('GAA')
    expect(source).not.toContain('Gordon Athletic Advisory')
  })

  it('supports speech synthesis fallback and tactile haptics', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('speechSynthesis')
    expect(source).toContain('triggerHaptic')
    expect(source).toContain('SpeechSynthesisUtterance')
  })
})
