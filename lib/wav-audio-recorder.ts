/**
 * Forge Athletic — Cross-Platform Universal WAV Audio Engine
 * 
 * Records crystal-clear mono PCM audio and encodes it into standard 16-bit WAV format.
 * Works flawlessly across iOS Safari, iOS Chrome, Android, macOS, and Windows with zero
 * codec or container compatibility issues.
 */

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Encodes raw Float32 audio samples into a standard 16-bit linear PCM WAV Blob.
 */
export function encodeWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // 1. RIFF chunk descriptor
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(view, 8, 'WAVE')

  // 2. fmt sub-chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true) // AudioFormat (1 = Linear PCM)
  view.setUint16(22, 1, true) // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true) // SampleRate (e.g. 16000 or 44100)
  view.setUint32(28, sampleRate * 2, true) // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true) // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true) // BitsPerSample (16-bit)

  // 3. data sub-chunk
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * 2, true)

  // 4. Write 16-bit PCM samples with clipping protection
  let offset = 44
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([view], { type: 'audio/wav' })
}

/**
 * Universal Voice Recorder using Web Audio API ScriptProcessor / Analyser.
 * Completely immune to iOS WebKit MediaRecorder bugs.
 */
export class UniversalVoiceRecorder {
  private stream: MediaStream | null = null
  private audioCtx: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private scriptNode: ScriptProcessorNode | null = null
  private analyserNode: AnalyserNode | null = null
  private recordedSamples: Float32Array[] = []
  private totalSampleCount: number = 0
  private targetSampleRate: number = 22050

  public async start(onAnalyserReady?: (analyser: AnalyserNode) => void): Promise<void> {
    if (typeof window === 'undefined') return

    const AudioClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioClass) throw new Error('AudioContext not supported')

    this.audioCtx = new AudioClass()
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume()
    }

    this.targetSampleRate = this.audioCtx.sampleRate || 22050
    this.recordedSamples = []
    this.totalSampleCount = 0

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream)

    // Setup Analyser for visualizer waves
    this.analyserNode = this.audioCtx.createAnalyser()
    this.analyserNode.fftSize = 64
    this.sourceNode.connect(this.analyserNode)

    if (onAnalyserReady) {
      onAnalyserReady(this.analyserNode)
    }

    // Setup ScriptProcessor to capture PCM samples
    const bufferSize = 4096
    this.scriptNode = this.audioCtx.createScriptProcessor(bufferSize, 1, 1)

    this.scriptNode.onaudioprocess = (e: AudioProcessingEvent) => {
      const inputData = e.inputBuffer.getChannelData(0)
      const copy = new Float32Array(inputData.length)
      copy.set(inputData)
      this.recordedSamples.push(copy)
      this.totalSampleCount += copy.length
    }

    this.sourceNode.connect(this.scriptNode)
    this.scriptNode.connect(this.audioCtx.destination)
  }

  public async stop(): Promise<{ blob: Blob; dataUrl: string; durationSec: number }> {
    // 1. Disconnect audio nodes
    if (this.scriptNode) {
      this.scriptNode.disconnect()
      this.scriptNode.onaudioprocess = null
      this.scriptNode = null
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect()
      this.analyserNode = null
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    // 2. Stop microphone stream tracks completely to restore iOS speaker output
    if (this.stream) {
      this.stream.getTracks().forEach(t => {
        t.stop()
        t.enabled = false
      })
      this.stream = null
    }

    // 3. Merge all recorded chunks into single Float32Array
    const merged = new Float32Array(this.totalSampleCount)
    let offset = 0
    for (const chunk of this.recordedSamples) {
      merged.set(chunk, offset)
      offset += chunk.length
    }

    const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : this.targetSampleRate
    const durationSec = Math.max(1, Math.round(this.totalSampleCount / (sampleRate || 22050)))

    // 4. Encode directly into standard 16-bit WAV Blob
    const wavBlob = encodeWavBlob(merged, sampleRate)

    // 5. Convert to Base64 Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(wavBlob)
    })

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        void this.audioCtx.close()
      } catch {}
      this.audioCtx = null
    }

    return { blob: wavBlob, dataUrl, durationSec }
  }

  public cancel(): void {
    if (this.scriptNode) {
      this.scriptNode.disconnect()
      this.scriptNode.onaudioprocess = null
      this.scriptNode = null
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => {
        t.stop()
        t.enabled = false
      })
      this.stream = null
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        void this.audioCtx.close()
      } catch {}
      this.audioCtx = null
    }
    this.recordedSamples = []
    this.totalSampleCount = 0
  }
}

