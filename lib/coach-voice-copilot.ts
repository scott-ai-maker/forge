export type VoiceCommandType =
  | 'LOG_SET'
  | 'START_REST'
  | 'STOP_REST'
  | 'TOGGLE_METRONOME'
  | 'NEXT_EXERCISE'
  | 'PREVIOUS_EXERCISE'
  | 'SPOKEN_CUE'
  | 'UNKNOWN'

export interface ParsedVoiceCommand {
  type: VoiceCommandType
  rawTranscript: string
  // Set details
  weightLbs?: number
  reps?: number
  rpe?: number
  setNumber?: number
  isWarmup?: boolean
  // Rest details
  restSeconds?: number
  // Cue details
  cueText?: string
  confidence?: 'high' | 'medium' | 'low'
}

export function parseVoiceCoachCommand(transcript: string): ParsedVoiceCommand {
  const text = transcript.toLowerCase().trim()

  if (!text) {
    return { type: 'UNKNOWN', rawTranscript: transcript }
  }

  // 1. Check for Rest Commands
  if (text.includes('stop rest') || text.includes('cancel rest') || text.includes('skip rest')) {
    return { type: 'STOP_REST', rawTranscript: transcript, confidence: 'high' }
  }

  if (text.includes('rest') || text.includes('take a rest') || text.includes('break')) {
    const minMatch = text.match(/(\d+)\s*(?:minute|min)/)
    const secMatch = text.match(/(\d+)\s*(?:second|sec)/)
    const plainNum = text.match(/rest\s*(?:for\s*)?(\d+)/)

    let seconds = 60
    if (minMatch) {
      seconds = Number(minMatch[1]) * 60
    } else if (secMatch) {
      seconds = Number(secMatch[1])
    } else if (plainNum) {
      const val = Number(plainNum[1])
      seconds = val <= 5 ? val * 60 : val
    }

    return {
      type: 'START_REST',
      rawTranscript: transcript,
      restSeconds: seconds,
      confidence: 'high',
    }
  }

  // 2. Check for Metronome Commands
  if (text.includes('metronome') || text.includes('cadence') || text.includes('tempo')) {
    if (text.includes('start') || text.includes('on') || text.includes('play') || text.includes('stop') || text.includes('off')) {
      return { type: 'TOGGLE_METRONOME', rawTranscript: transcript, confidence: 'high' }
    }
  }

  // 3. Check for Navigation Commands
  if (text.includes('next exercise') || text.includes('next movement') || text.includes('move on')) {
    return { type: 'NEXT_EXERCISE', rawTranscript: transcript, confidence: 'high' }
  }
  if (text.includes('previous exercise') || text.includes('last movement') || text.includes('back up')) {
    return { type: 'PREVIOUS_EXERCISE', rawTranscript: transcript, confidence: 'high' }
  }

  // 4. Check for Spoken Cues
  if (text.startsWith('cue') || text.startsWith('tell athlete') || text.startsWith('say')) {
    const cue = text.replace(/^(?:cue|tell athlete to|say)\s*[:,\-]?\s*/, '')
    return { type: 'SPOKEN_CUE', rawTranscript: transcript, cueText: cue, confidence: 'high' }
  }

  // 5. Check for Set Logging Commands
  // Examples: "log set 2 225 lbs 8 reps rpe 8", "set logged 315 for 5 rpe 9", "225 pounds 10 reps", "bodyweight 15 reps"
  const isSetIntent =
    text.includes('log') ||
    text.includes('set') ||
    text.includes('rep') ||
    text.includes('pound') ||
    text.includes('lb') ||
    text.includes('kg') ||
    text.includes('rpe')

  if (isSetIntent) {
    let weightLbs: number | undefined
    let reps: number | undefined
    let rpe: number | undefined
    let setNumber: number | undefined
    const isWarmup = text.includes('warmup') || text.includes('warm up')

    // Parse Set Number: "set 3", "set number 2", "first set"
    const setNumMatch = text.match(/set\s*(?:number\s*)?(\d+)/)
    if (setNumMatch) setNumber = Number(setNumMatch[1])
    else if (text.includes('first set')) setNumber = 1
    else if (text.includes('second set')) setNumber = 2
    else if (text.includes('third set')) setNumber = 3
    else if (text.includes('fourth set')) setNumber = 4

    // Parse Weight
    if (text.includes('bodyweight') || text.includes('body weight')) {
      weightLbs = 0
    } else {
      // Check for kg: e.g. "100 kg", "100 kilos"
      const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilogram)/)
      if (kgMatch) {
        weightLbs = Math.round(Number(kgMatch[1]) * 2.20462)
      } else {
        // Check for lbs: e.g. "225 lbs", "225 pounds", "225 lb"
        const lbMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)/)
        if (lbMatch) {
          weightLbs = Number(lbMatch[1])
        }
      }
    }

    // Parse Reps: "8 reps", "10 repetitions", "for 5", "5 times"
    const repsMatch = text.match(/(\d+)\s*(?:rep|reps|repetition|repetitions)/)
    const forRepsMatch = text.match(/(?:for|x|times)\s*(\d+)/)
    if (repsMatch) {
      reps = Number(repsMatch[1])
    } else if (forRepsMatch) {
      reps = Number(forRepsMatch[1])
    }

    // Parse RPE: "rpe 8.5", "rate 8", "rpe of 9", "at an 8"
    const rpeMatch = text.match(/rpe\s*(?:of\s*)?(\d+(?:\.\d+)?)/)
    const atRpeMatch = text.match(/at\s*(?:an?\s*)?(\d+(?:\.\d+)?)\s*rpe/)
    if (rpeMatch) {
      rpe = Number(rpeMatch[1])
    } else if (atRpeMatch) {
      rpe = Number(atRpeMatch[1])
    }

    // If we have reps or weight, it's a valid set log command
    if (reps !== undefined || weightLbs !== undefined) {
      return {
        type: 'LOG_SET',
        rawTranscript: transcript,
        weightLbs,
        reps,
        rpe,
        setNumber,
        isWarmup,
        confidence: reps !== undefined && weightLbs !== undefined ? 'high' : 'medium',
      }
    }
  }

  return { type: 'UNKNOWN', rawTranscript: transcript, confidence: 'low' }
}
