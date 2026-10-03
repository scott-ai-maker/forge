import { describe, it, expect } from 'vitest'
import { encodeWavBlob, UniversalVoiceRecorder } from './wav-audio-recorder'

describe('wav-audio-recorder', () => {
  it('encodes Float32 samples into valid WAV Blob with correct header', async () => {
    const sampleRate = 22050
    const durationSec = 1
    const totalSamples = sampleRate * durationSec
    const samples = new Float32Array(totalSamples)

    // Generate a 440Hz sine wave
    for (let i = 0; i < totalSamples; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate)
    }

    const blob = encodeWavBlob(samples, sampleRate)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/wav')
    // Header is 44 bytes + totalSamples * 2 bytes
    expect(blob.size).toBe(44 + totalSamples * 2)

    // Verify RIFF and WAVE header bytes
    const arrayBuffer = await blob.arrayBuffer()
    const view = new DataView(arrayBuffer)
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))
    expect(riff).toBe('RIFF')
    expect(wave).toBe('WAVE')
  })

  it('instantiates UniversalVoiceRecorder safely in testing environment', () => {
    const recorder = new UniversalVoiceRecorder()
    expect(recorder).toBeDefined()
    expect(() => recorder.cancel()).not.toThrow()
  })
})

