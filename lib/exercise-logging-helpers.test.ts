import { describe, expect, it } from 'vitest'
import {
  isTimedStaticStretch,
  isFoamRollerExercise,
  isBandExercise,
  isStrengthExercise,
  parseHoldDurationSeconds,
  formatExerciseTargetDisplay,
  findBandByWeight,
  BAND_COLOR_SPECTRUM,
} from './exercise-logging-helpers'

describe('exercise-logging-helpers', () => {
  describe('isTimedStaticStretch', () => {
    it('identifies static stretch exercises', () => {
      expect(isTimedStaticStretch('Static Gastrocnemius Stretch')).toBe(true)
      expect(isTimedStaticStretch('Hamstring Stretch')).toBe(true)
      expect(isTimedStaticStretch('Doorway Pectoral Stretch')).toBe(true)
      expect(isTimedStaticStretch('Static Latissimus Dorsi Stretch')).toBe(true)
      expect(isTimedStaticStretch('Plank')).toBe(true)
      expect(isTimedStaticStretch('Side Plank Hold')).toBe(true)
      expect(isTimedStaticStretch('Wall Sit')).toBe(true)
      expect(isTimedStaticStretch('Dead Hang')).toBe(true)
      expect(isTimedStaticStretch('Couch Stretch')).toBe(true)
      expect(isTimedStaticStretch('Pigeon Pose')).toBe(true)
    })

    it('identifies exercises with time hold reps string', () => {
      expect(isTimedStaticStretch('Hip Extension', null, '30s hold')).toBe(true)
      expect(isTimedStaticStretch('Core Iso', null, '45 sec')).toBe(true)
    })

    it('rejects standard dynamic resistance exercises', () => {
      expect(isTimedStaticStretch('Barbell Bench Press')).toBe(false)
      expect(isTimedStaticStretch('Goblet Squat')).toBe(false)
      expect(isTimedStaticStretch('Single-Arm Dumbbell Row')).toBe(false)
      expect(isTimedStaticStretch('Dynamic Leg Swings')).toBe(false)
    })
  })

  describe('isFoamRollerExercise', () => {
    it('identifies SMR and foam rolling movements', () => {
      expect(isFoamRollerExercise('Foam Roll Calves')).toBe(true)
      expect(isFoamRollerExercise('Foam Roller Quads')).toBe(true)
      expect(isFoamRollerExercise('SMR Latissimus Dorsi')).toBe(true)
      expect(isFoamRollerExercise('SMR Piriformis')).toBe(true)
      expect(isFoamRollerExercise('Lacrosse Ball Glute Release')).toBe(true)
      expect(isFoamRollerExercise('Massage Ball Upper Traps')).toBe(true)
    })

    it('rejects non-foam rolling exercises', () => {
      expect(isFoamRollerExercise('Barbell Squat')).toBe(false)
      expect(isFoamRollerExercise('Push-Up')).toBe(false)
    })
  })

  describe('isBandExercise', () => {
    it('identifies band and tubing movements', () => {
      expect(isBandExercise('Band Pull-Aparts')).toBe(true)
      expect(isBandExercise('Banded Lateral Walk')).toBe(true)
      expect(isBandExercise('Band Face Pull')).toBe(true)
      expect(isBandExercise('Resistance Band Row')).toBe(true)
      expect(isBandExercise('Mini-Band Clamshells')).toBe(true)
      expect(isBandExercise('Lateral Tube Walking')).toBe(true)
      expect(isBandExercise('Monster Walk')).toBe(true)
    })

    it('identifies when equipment array contains bands', () => {
      expect(isBandExercise('Pallof Press', ['Resistance Bands'])).toBe(true)
    })

    it('rejects free weight and bodyweight exercises', () => {
      expect(isBandExercise('Dumbbell Bench Press')).toBe(false)
      expect(isBandExercise('Barbell Deadlift')).toBe(false)
      expect(isBandExercise('Push-Up')).toBe(false)
    })
  })

  describe('parseHoldDurationSeconds & formatExerciseTargetDisplay', () => {
    it('parses duration strings into seconds', () => {
      expect(parseHoldDurationSeconds('30s', 30)).toBe(30)
      expect(parseHoldDurationSeconds('30-60s', 30)).toBe(30)
      expect(parseHoldDurationSeconds('45 sec', 30)).toBe(45)
      expect(parseHoldDurationSeconds('60s hold', 30)).toBe(60)
      expect(parseHoldDurationSeconds(null, 30)).toBe(30)
    })

    it('formats display target for timed stretches and foam rolls', () => {
      expect(formatExerciseTargetDisplay({
        name: 'Static Hamstring Stretch',
        sets: 3,
        reps: '30s',
        rest: '30s',
      })).toBe('3 sets × 30s hold · Rest 30s')

      expect(formatExerciseTargetDisplay({
        name: 'Foam Roll Calves',
        sets: 2,
        reps: '30-60s',
        rest: '0s',
      })).toBe('2 sets × 30s SMR roll · Rest 0s')

      expect(formatExerciseTargetDisplay({
        name: 'Goblet Squat',
        sets: 3,
        reps: '12-15',
        rest: '60s',
      })).toBe('3 sets × 12-15 · Rest 60s')
    })
  })

  describe('BAND_COLOR_SPECTRUM & findBandByWeight', () => {
    it('provides full 6-tier resistance band spectrum with colors and weights', () => {
      expect(BAND_COLOR_SPECTRUM.length).toBe(6)
      expect(BAND_COLOR_SPECTRUM[0].colorName).toBe('Yellow')
      expect(BAND_COLOR_SPECTRUM[0].weightLbsAvg).toBe(10)
      expect(BAND_COLOR_SPECTRUM[1].colorName).toBe('Red')
      expect(BAND_COLOR_SPECTRUM[1].weightLbsAvg).toBe(20)
      expect(BAND_COLOR_SPECTRUM[2].colorName).toBe('Green')
      expect(BAND_COLOR_SPECTRUM[2].weightLbsAvg).toBe(35)
      expect(BAND_COLOR_SPECTRUM[3].colorName).toBe('Blue')
      expect(BAND_COLOR_SPECTRUM[3].weightLbsAvg).toBe(50)
      expect(BAND_COLOR_SPECTRUM[4].colorName).toBe('Black')
      expect(BAND_COLOR_SPECTRUM[4].weightLbsAvg).toBe(70)
      expect(BAND_COLOR_SPECTRUM[5].colorName).toBe('Purple')
      expect(BAND_COLOR_SPECTRUM[5].weightLbsAvg).toBe(90)
    })

    it('finds appropriate band for target weight', () => {
      expect(findBandByWeight(10, 'imperial').colorName).toBe('Yellow')
      expect(findBandByWeight(20, 'imperial').colorName).toBe('Red')
      expect(findBandByWeight(35, 'imperial').colorName).toBe('Green')
      expect(findBandByWeight(50, 'imperial').colorName).toBe('Blue')
      expect(findBandByWeight(75, 'imperial').colorName).toBe('Black')
      expect(findBandByWeight(95, 'imperial').colorName).toBe('Purple')
    })
  })

  describe('isStrengthExercise', () => {
    it('correctly identifies strength / resistance exercises', () => {
      expect(isStrengthExercise('Barbell Bench Press', 'resistance')).toBe(true)
      expect(isStrengthExercise('Goblet Squat', 'strength')).toBe(true)
      expect(isStrengthExercise('Dumbbell Romanian Deadlift')).toBe(true)
      expect(isStrengthExercise('Lat Pulldown', 'resistance')).toBe(true)
      expect(isStrengthExercise('Overhead Dumbbell Press')).toBe(true)
    })

    it('rejects static stretches, SMR foam rolls, warmups, and cooldowns', () => {
      expect(isStrengthExercise('Static Gastrocnemius Stretch', 'cooldown')).toBe(false)
      expect(isStrengthExercise('Foam Roll Calves', 'warmup')).toBe(false)
      expect(isStrengthExercise('Kneeling Hip Flexor Stretch', 'flexibility')).toBe(false)
      expect(isStrengthExercise('Dynamic Arm Circles', 'warmup')).toBe(false)
      expect(isStrengthExercise('Plank', 'activation', '45s hold')).toBe(false)
      expect(isStrengthExercise('Treadmill Running', 'cardio')).toBe(false)
      expect(isStrengthExercise('Assault AirBike', 'cardio')).toBe(false)
    })
  })
})

