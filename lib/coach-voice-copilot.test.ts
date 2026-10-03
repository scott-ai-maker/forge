import { describe, expect, it } from 'vitest'
import { parseVoiceCoachCommand } from './coach-voice-copilot'

describe('Coach Voice Co-Pilot Command Parser', () => {
  it('parses complete set logging speech with pounds and RPE', () => {
    const cmd = parseVoiceCoachCommand('log set 2 225 lbs 8 reps rpe 8.5')
    expect(cmd.type).toBe('LOG_SET')
    expect(cmd.setNumber).toBe(2)
    expect(cmd.weightLbs).toBe(225)
    expect(cmd.reps).toBe(8)
    expect(cmd.rpe).toBe(8.5)
    expect(cmd.isWarmup).toBe(false)
  })

  it('converts kilogram weights to pounds correctly', () => {
    const cmd = parseVoiceCoachCommand('set 1 100 kg for 5 reps rpe 9')
    expect(cmd.type).toBe('LOG_SET')
    expect(cmd.weightLbs).toBe(220) // 100 * 2.20462 rounded
    expect(cmd.reps).toBe(5)
    expect(cmd.rpe).toBe(9)
  })

  it('recognizes warmup flag and bodyweight', () => {
    const cmd = parseVoiceCoachCommand('warmup set bodyweight 15 reps')
    expect(cmd.type).toBe('LOG_SET')
    expect(cmd.weightLbs).toBe(0)
    expect(cmd.reps).toBe(15)
    expect(cmd.isWarmup).toBe(true)
  })

  it('parses rest timer commands in seconds and minutes', () => {
    const cmdSec = parseVoiceCoachCommand('start rest 90 seconds')
    expect(cmdSec.type).toBe('START_REST')
    expect(cmdSec.restSeconds).toBe(90)

    const cmdMin = parseVoiceCoachCommand('take a 2 minute rest')
    expect(cmdMin.type).toBe('START_REST')
    expect(cmdMin.restSeconds).toBe(120)

    const cmdStop = parseVoiceCoachCommand('stop rest timer')
    expect(cmdStop.type).toBe('STOP_REST')
  })

  it('parses navigation and spoken cue directives', () => {
    const cmdNav = parseVoiceCoachCommand('next exercise')
    expect(cmdNav.type).toBe('NEXT_EXERCISE')

    const cmdCue = parseVoiceCoachCommand('cue: brace your core and drive through heels')
    expect(cmdCue.type).toBe('SPOKEN_CUE')
    expect(cmdCue.cueText).toBe('brace your core and drive through heels')
  })
})
