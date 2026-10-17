import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('CoachSanctuaryAudioNoteModal Component Architecture', () => {
  const componentPath = path.resolve(
    process.cwd(),
    'components/coach/CoachSanctuaryAudioNoteModal.tsx'
  )

  it('verifies component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true)
  })

  it('contains 60-second limiter, UniversalVoiceRecorder, and dispatch controls', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('Sanctuary In-Ear Voice Studio')
    expect(source).toContain('UniversalVoiceRecorder')
    expect(source).toContain('start-record-btn')
    expect(source).toContain('stop-record-btn')
    expect(source).toContain('preview-record-btn')
    expect(source).toContain('dispatch-sanctuary-note-btn')
    expect(source).toContain('elapsed >= 60')
    expect(source).toContain('Dispatched Library')
  })

  it('strictly adheres to brand rule: Forge Athletic, no GAA', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('Coach Gordon')
    expect(source).not.toContain('GAA')
    expect(source).not.toContain('Gordon Athletic Advisory')
  })

  it('integrates ElevenLabs neural voice generation with Coach Gordon cloned model', () => {
    const source = fs.readFileSync(componentPath, 'utf-8')
    expect(source).toContain('generate-elevenlabs-voice-btn')
    expect(source).toContain('handleGenerateWithElevenLabs')
    expect(source).toContain('COACH_GORDON_ELEVENLABS_VOICE_ID')
    expect(source).toContain('audio-provider-status')
    expect(source).toContain('/api/coach/tts')
    expect(source).toContain('voiceProvider')
  })
})
