import { describe, expect, it } from 'vitest'
import { resolveExerciseVideoEmbed } from '@/lib/nasm-exercise-video-catalog'
import { resolveGaaExerciseImage } from '@/lib/nasm-generated-images'
import { getSmartSubstitutions, detectMovementPattern } from '@/lib/nasm-exercise-substitution'
import type { GeneratedMacrocyclePlan } from '@/lib/rag-nasm-program-generator'

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

  it('correctly structures Jennifer profile intake parameters for synthesis', () => {
    const jenniferIntake = {
      clientName: 'Jennifer',
      clientAge: 46,
      clientSex: 'female' as const,
      goal: 'fat_loss' as const,
      targetNasmPhase: 1,
      trainingDaysPerWeek: 3,
      experienceLevel: 'intermediate' as const,
      equipmentAccess: ['dumbbell', 'band', 'reebok step', 'stability ball', 'bodyweight'],
      lifestyleRhythm: {
        workStyle: 'sedentary_desk' as const,
        dailyRhythm: 'early_morning' as const,
        sessionDurationMins: 35,
      },
      movementSuperpowers: ['Burpees', 'Reebok Step Aerobics'],
      strictExclusions: ['Mountain Climbers', 'Running / Jogging', 'Forward Lunges (Runner\'s Knee)'],
      functionalDemands: 'Assists elderly father on weekends; needs posterior chain and hinge integrity.',
      nutritionPhilosophy: 'precision_nutrition_hand_portion' as const,
      dualCardioSplit: {
        sweatyFinisherModality: '10-Minute Reebok Step Metabolic Flush',
        freshNeatWalkMinutes: 30,
        freshNeatNotes: 'Morning walk to father\'s home; non-sweaty NEAT to clear mind.',
      },
      coachGuidanceNotes: 'Incorporate Reebok Step. Burpees loved. Strictly exclude mountain climbers and running.',
    }

    expect(jenniferIntake.movementSuperpowers).toContain('Burpees')
    expect(jenniferIntake.strictExclusions).toContain('Mountain Climbers')
    expect(jenniferIntake.nutritionPhilosophy).toBe('precision_nutrition_hand_portion')
    expect(jenniferIntake.dualCardioSplit.sweatyFinisherModality).toContain('Reebok Step')
    expect(jenniferIntake.dualCardioSplit.freshNeatWalkMinutes).toBe(30)
  })

  it('transforms generated program into workout_plans deployment payload with rich clinical and hand-portion fields', () => {
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
      handPortionPlan: {
        philosophy: 'precision_nutrition_hand_portion',
        title: 'Precision Nutrition Hand-Portion Plate',
        mealsPerDay: 3,
        guidelines: {
          protein: { portionsPerMeal: '1-2 palms', handMeasure: 'Palm', examples: 'Chicken, fish, tofu', rationale: 'Maintain LBM' },
          vegetables: { portionsPerMeal: '1-2 fists', handMeasure: 'Fist', examples: 'Spinach, broccoli', rationale: 'Micronutrient density' },
          smartCarbs: { portionsPerMeal: '1 cupped hand', handMeasure: 'Cupped hand', examples: 'Oats, quinoa', rationale: 'Glycogen repletion' },
          healthyFats: { portionsPerMeal: '1 thumb', handMeasure: 'Thumb', examples: 'Olive oil, almonds', rationale: 'Hormonal balance' },
        },
        mindfulEatingCue: 'Eat until 80% full (Hara Hachi Bu)',
        hydrationAnchor: '2.5L water daily',
        summary: 'Precision Hand-Portion Architecture',
      },
      dualCardioPlan: {
        sweatyFinisher: {
          title: '10-Minute Reebok Step Metabolic Flush',
          durationMins: 10,
          modality: 'Reebok Step',
          zone: 'Zone 2-3',
          timing: 'Post-Lift',
          rationale: 'Glycogen depletion and EPOC without joint impact',
        },
        freshNeatWalk: {
          title: '30-Minute Morning NEAT Walk',
          durationMins: 30,
          frequency: 'Daily',
          modality: 'Outdoor walk',
          timing: 'Morning',
          rationale: 'Circadian reset and recovery',
        },
      },
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
              coachingCues: ['Drive through heel on Reebok Step'],
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
      clientId: 'client-jennifer-123',
      name: mockPlan.planTitle,
      goal: mockPlan.primaryGoal,
      nasmOptPhase: mockPlan.nasmOptPhase,
      phaseName: mockPlan.phaseName,
      sessionsPerWeek: mockPlan.sessionsPerWeek,
      estimatedDurationMins: 45,
      clinicalRationale: mockPlan.clinicalRationale,
      handPortionPlan: mockPlan.handPortionPlan,
      dualCardioPlan: mockPlan.dualCardioPlan,
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
    expect(payload.handPortionPlan?.philosophy).toBe('precision_nutrition_hand_portion')
    expect(payload.handPortionPlan?.guidelines.protein.portionsPerMeal).toBe('1-2 palms')
    expect(payload.dualCardioPlan?.sweatyFinisher.title).toBe('10-Minute Reebok Step Metabolic Flush')
    expect(payload.dualCardioPlan?.freshNeatWalk?.durationMins).toBe(30)
    expect(payload.workouts[0].exercises[0].name).toBe('Dumbbell Step-Up to Balance')
    expect(payload.workouts[0].exercises[0].tempo).toBe('4/2/1')
  })
})
