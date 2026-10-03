import { describe, it, expect } from 'vitest'
import { mapExerciseNameToLiftType } from './LiveVideoFormCaptureModal'
import { inferLiftTypeFromFileName } from '@/components/fitness/VideoCritiqueStudio'
import { analyzeLiftForm } from '@/lib/video-form-analysis'

describe('Live Video Form Capture & NASM Technique Biomechanics', () => {
  it('maps various exercise names to correct NASM lift types', () => {
    expect(mapExerciseNameToLiftType('Barbell Back Squat')).toBe('barbell_back_squat')
    expect(mapExerciseNameToLiftType('Romanian Deadlift (RDL)')).toBe('romanian_deadlift')
    expect(mapExerciseNameToLiftType('Dumbbell Bench Press')).toBe('barbell_bench_press')
    expect(mapExerciseNameToLiftType('Seated Overhead Dumbbell Press')).toBe('overhead_press')
    expect(mapExerciseNameToLiftType('Bent-Over Barbell Row')).toBe('barbell_row')
  })

  it('infers lift type accurately from uploaded video file names', () => {
    expect(inferLiftTypeFromFileName('heavy_squat_set2.mp4')).toBe('barbell_back_squat')
    expect(inferLiftTypeFromFileName('my_rdl_form.mov')).toBe('romanian_deadlift')
    expect(inferLiftTypeFromFileName('deadlift_conventional.webm')).toBe('barbell_deadlift')
    expect(inferLiftTypeFromFileName('bench_press_225.m4v')).toBe('barbell_bench_press')
    expect(inferLiftTypeFromFileName('ohp_shoulder_press.mp4')).toBe('overhead_press')
    expect(inferLiftTypeFromFileName('random_clip.mp4')).toBeNull()
  })

  it('generates high form score when no deviations are detected', () => {
    const critique = analyzeLiftForm({
      liftType: 'barbell_back_squat',
      loadLbs: 225,
      repsCount: 5,
      observedDeviations: [],
    })

    expect(critique.overallFormScore).toBe(100)
    expect(critique.checkpoints.length).toBeGreaterThan(0)
  })

  it('adjusts form score and provides targeted cues when deviations exist', () => {
    const critique = analyzeLiftForm({
      liftType: 'barbell_back_squat',
      loadLbs: 315,
      repsCount: 3,
      observedDeviations: ['knee_valgus', 'excessive_forward_lean'],
    })

    expect(critique.overallFormScore).toBeLessThan(85)
    expect(critique.checkpoints.some(c => c.prescribedCue.toLowerCase().includes('knee') || c.prescribedCue.toLowerCase().includes('torso') || c.prescribedCue.toLowerCase().includes('chest'))).toBe(true)
    expect(critique.prescribedCorrectiveContinuum.inhibit.length).toBeGreaterThan(0)
    expect(critique.prescribedCorrectiveContinuum.activate.length).toBeGreaterThan(0)
  })
})

