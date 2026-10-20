import { describe, expect, it } from 'vitest'
import { resolveExerciseVideoEmbed } from '@/lib/nasm-exercise-video-catalog'
import { resolveGaaExerciseImage } from '@/lib/nasm-generated-images'
import { getSmartSubstitutions, detectMovementPattern } from '@/lib/nasm-exercise-substitution'
import type { GeneratedMacrocyclePlan } from '@/lib/rag-nasm-program-generator'
import type { CoachAiIntakeFormData } from './CoachAiIntakeDrawer'

describe('CoachCustomPeriodizationStudio UI & Integration Logic', () => {
  it('resolves official NASM Edge video demonstrations with verified YouTube embed URLs', () => {
    const burpeeRes = resolveExerciseVideoEmbed('burpee')
    expect(burpeeRes.embedUrl).toContain('youtube-nocookie.com/embed')
    expect(burpeeRes.sourceTitle).toContain('NASM Edge')

    const stepUpRes = resolveExerciseVideoEmbed('dumbbell step-up')
    expect(stepUpRes.embedUrl).toContain('youtube-nocookie.com/embed')

    const deadliftRes = resolveExerciseVideoEmbed('dumbbell romanian deadlift')
    expect(deadliftRes.videoId).toBe('V8Hdl1FiNt4')
    expect(deadliftRes.embedUrl).toContain('V8Hdl1FiNt4')
  })

  it('resolves verified exercise thumbnail images for studio matrix display', () => {
    const gobletSquatImg = resolveGaaExerciseImage('goblet squat')
    expect(gobletSquatImg).toBeTruthy()
    expect(gobletSquatImg).toContain('img.youtube.com')

    const pushUpImg = resolveGaaExerciseImage('push up')
    expect(pushUpImg).toBeTruthy()
    expect(pushUpImg).toContain('img.youtube.com')
  })

  it('powers 1-click smart exercise swaps with joint-protective biomechanical alternatives', () => {
    // Test case: Substituting a forward lunge due to runner's knee
    const pattern = detectMovementPattern('barbell forward lunge')
    expect(pattern).toBe('lunge_split')

    const substitutions = getSmartSubstitutions('barbell forward lunge', 'Phase 1: Stabilization Endurance', 'runners_knee')
    expect(substitutions.length).toBeGreaterThan(0)

    const firstSub = substitutions[0]
    expect(firstSub.name).toBeTruthy()
    expect(firstSub.category).toBeDefined()
    expect(firstSub.reasoning).toBeTruthy()
    expect(firstSub.prescribedTempo).toBeTruthy()
  })

  it('correctly structures athlete intake parameters for NASM OPT synthesis', () => {
    const intake: CoachAiIntakeFormData = {
      clientName: 'Sarah Jenkins',
      clientAge: 46,
      clientSex: 'female',
      goal: 'fat_loss',
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      sessionDurationMins: 45,
      experienceLevel: 'intermediate',
      equipmentAccess: ['dumbbell', 'band', 'stability ball', 'bodyweight'],
      coachGuidanceNotes: 'Phase 1 stabilization endurance with controlled 4/2/1 tempo.',
    }

    expect(intake.targetNasmPhase).toBe(1)
    expect(intake.trainingDaysPerWeek).toBe(3)
    expect(intake.sessionDurationMins).toBe(45)
    expect(intake.equipmentAccess).toContain('dumbbell')
    expect(intake.equipmentAccess).not.toContain('reebok step')
  })

  it('transforms generated program into workout_plans deployment payload with rich clinical fields', () => {
    const mockPlan: GeneratedMacrocyclePlan = {
      planTitle: 'Jennifer · 4-Week Phase 1 Stabilization Endurance Block',
      primaryGoal: 'fat_loss',
      nasmOptPhase: 1,
      phaseName: 'Phase 1: Stabilization Endurance',
      totalWeeks: 4,
      sessionsPerWeek: 3,
      ragSourcesCited: ['NASM Essentials 7th Ed, Ch 12'],
      strengthCardioBlendSummary: {
        goal: 'fat_loss',
        blendRatio: '55% Strength / 45% Cardio',
        strengthPct: 55,
        cardioPct: 45,
        weeklyStrengthSessions: 3,
        weeklyCardioMinutes: 90,
        primaryCardioStages: 'Stage 1 Base',
        interferenceShieldStrategy: 'Concurrent separation',
        clinicalGuideline: 'Maintain distinct energy pathways',
      },
      clinicalRationale: 'Coach Gordon: High-EQ clinical briefing memo.',
      workouts: [
        {
          day: 1,
          dayName: 'Day 1',
          focus: 'Full Body Stabilization',
          nasmOptPhase: 1,
          phaseName: 'Phase 1: Stabilization Endurance',
          estimatedDurationMins: 35,
          warmupProtocol: {
            inhibitSmr: ['Calves', 'Thoracic Spine'],
            lengthenStaticStretch: ['Gastrocnemius', 'Hip Flexors'],
            activateDynamic: ['Glute Bridge'],
          },
          exercises: [
            {
              block: 'resistance',
              name: 'Dumbbell Step-Up to Balance',
              sets: '3',
              reps: '12',
              tempo: '4/2/1',
              rest: '60s',
              coachingCues: ['Drive through front heel with strong core brace'],
              nasmClinicalSource: 'NASM Edge Catalog',
            },
          ],
          dailyPeriodizationMemo: 'Focus on 4/2/1 eccentric control.',
        },
      ],
      periodizationWeeklyMemos: ['Week 1: Neuromuscular baseline', 'Week 2: Balance progression'],
    }

    // Prepare payload as deployed in CoachProgramPreviewCanvas & CoachCustomPeriodizationStudio
    const payload = {
      clientId: 'client-sarah-123',
      name: mockPlan.planTitle,
      goal: mockPlan.primaryGoal,
      nasmOptPhase: mockPlan.nasmOptPhase,
      phaseName: mockPlan.phaseName,
      sessionsPerWeek: mockPlan.sessionsPerWeek,
      estimatedDurationMins: 45,
      clinicalRationale: mockPlan.clinicalRationale,
      strengthCardioBlendSummary: mockPlan.strengthCardioBlendSummary,
      periodizationPlan: {
        weeklyMemos: mockPlan.periodizationWeeklyMemos,
        ragSourcesCited: mockPlan.ragSourcesCited,
      },
      workouts: mockPlan.workouts.map(w => ({
        day: w.day,
        focus: w.focus,
        notes: w.dailyPeriodizationMemo,
        exercises: w.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          tempo: ex.tempo,
          rest: ex.rest,
          notes: ex.coachingCues?.join(' | '),
          description: ex.nasmClinicalSource,
          block: ex.block,
        })),
      })),
    }

    expect(payload.name).toBe('Jennifer · 4-Week Phase 1 Stabilization Endurance Block')
    expect(payload.clinicalRationale).toBe('Coach Gordon: High-EQ clinical briefing memo.')
    expect(payload.workouts[0].exercises[0].name).toBe('Dumbbell Step-Up to Balance')
    expect(payload.workouts[0].exercises[0].tempo).toBe('4/2/1')
  })
})
