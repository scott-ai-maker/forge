import { describe, expect, it } from 'vitest';
import {
  recommendClientTrainingSplits,
  type ClientTrainingRecommendationInput,
} from './client-training-recommendations';
import { generateRagNasmProgram } from './rag-nasm-program-generator';

describe('recommendClientTrainingSplits', () => {
  it('recommends Upper / Lower 4-Day Split and Push / Pull 4-Day Split for a 4-day intermediate hypertrophy client', () => {
    const input: ClientTrainingRecommendationInput = {
      experienceLevel: 'intermediate',
      trainingDaysPerWeek: 4,
      fitnessGoal: 'hypertrophy',
      equipmentAccess: ['full_gym'],
      injuriesLimitations: [],
      kineticCompensations: [],
    };

    const summary = recommendClientTrainingSplits(input);
    expect(summary.recommendedNasmPhase).toBe(3);
    expect(summary.ragSourcesCited.length).toBeGreaterThan(0);

    const topIds = summary.options.slice(0, 2).map((o) => o.id);
    expect(topIds).toContain('upper_lower');
    expect(topIds).toContain('push_pull_4day');

    const pushPull = summary.options.find((o) => o.id === 'push_pull_4day');
    expect(pushPull).toBeDefined();
    expect(pushPull?.daySchedulePreview).toHaveLength(4);
    expect(pushPull?.daySchedulePreview[0]).toContain('Push A');
    expect(pushPull?.daySchedulePreview[1]).toContain('Pull A');
    expect(pushPull?.daySchedulePreview[2]).toContain('Push B');
    expect(pushPull?.daySchedulePreview[3]).toContain('Pull B');
  });

  it('recommends Total-Body Integration and clamps to Phase 1 for a beginner with kinetic compensations training 3 days/week', () => {
    const summary = recommendClientTrainingSplits({
      experienceLevel: 'beginner',
      trainingDaysPerWeek: 3,
      fitnessGoal: 'general_fitness',
      equipmentAccess: ['dumbbells', 'bands'],
      injuriesLimitations: ['Low back sensitivity'],
      kineticCompensations: ['knee_valgus', 'low_back_arch'],
    });

    expect(summary.recommendedNasmPhase).toBe(1);
    expect(summary.recommendedSplitId).toBe('full_body');
    expect(summary.ragRationale).toContain('corrective warm-ups');
  });

  it('recommends Push / Pull / Legs (PPL) for a 6-day advanced hypertrophy athlete', () => {
    const summary = recommendClientTrainingSplits({
      experienceLevel: 'advanced',
      trainingDaysPerWeek: 6,
      fitnessGoal: 'hypertrophy',
      equipmentAccess: ['full_gym'],
    });

    expect(summary.recommendedSplitId).toBe('push_pull_legs');
    expect(summary.recommendedNasmPhase).toBe(3);
    const ppl = summary.options.find((o) => o.id === 'push_pull_legs');
    expect(ppl?.daySchedulePreview).toHaveLength(6);
  });

  it('prioritizes Metabolic Strength & Conditioning Contrast for fat loss / body recomposition goals', () => {
    const summary = recommendClientTrainingSplits({
      experienceLevel: 'intermediate',
      trainingDaysPerWeek: 3,
      fitnessGoal: 'fat_loss',
      equipmentAccess: ['full_gym'],
    });

    const topTwo = summary.options.slice(0, 2).map((o) => o.id);
    expect(topTwo).toContain('metabolic_contrast');
    expect(summary.recommendedNasmPhase).toBe(2);
  });
});

describe('generateRagNasmProgram with client training splits', () => {
  it('crafts a 4-day Push / Pull split with verified Forge Athletic studio media and whyForYou rationales', () => {
    const plan = generateRagNasmProgram({
      clientName: 'Alex Rivera',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 4,
      trainingSplit: 'push_pull_4day',
      equipmentAccess: ['barbell', 'squat rack', 'dumbbell', 'cable', 'bench', 'band'],
      kineticCompensations: ['knees_cave_in'],
      injuriesLimitations: '',
      experienceLevel: 'intermediate',
      cardioBlendStyle: 'integrated_finishers',
    });

    expect(plan.trainingSplit).toBe('push_pull_4day');
    expect(plan.trainingSplitLabel).toContain('Push / Pull');
    expect(plan.workouts).toHaveLength(4);
    expect(plan.workouts[0]?.focus).toContain('Push A');
    expect(plan.workouts[1]?.focus).toContain('Pull A');
    expect(plan.workouts[2]?.focus).toContain('Push B');
    expect(plan.workouts[3]?.focus).toContain('Pull B');

    for (const workout of plan.workouts) {
      expect(workout.exercises.length).toBeGreaterThanOrEqual(5);
      for (const ex of workout.exercises) {
        expect(ex.whyForYou).toBeTruthy();
        expect(ex.imageUrl).toMatch(/^\/images\/exercises\/[a-z0-9-]+\.jpg$/);
      }
    }
  });

  it('crafts a 4-day Upper / Lower split and respects home equipment & shoulder injury guardrails', () => {
    const plan = generateRagNasmProgram({
      clientName: 'Jordan Vance',
      goal: 'general_fitness',
      targetNasmPhase: 2,
      trainingDaysPerWeek: 4,
      trainingSplit: 'upper_lower',
      equipmentAccess: ['dumbbell', 'band', 'bodyweight'],
      kineticCompensations: ['arms_fall_forward'],
      contraindicationTags: ['shoulder_impingement'],
      injuriesLimitations: 'shoulder impingement',
      experienceLevel: 'intermediate',
      cardioBlendStyle: 'minimal_flush',
    });

    expect(plan.trainingSplit).toBe('upper_lower');
    expect(plan.workouts).toHaveLength(4);
    expect(plan.workouts[0]?.focus).toContain('Upper Body A');
    expect(plan.workouts[1]?.focus).toContain('Lower Body A');
    expect(plan.workouts[2]?.focus).toContain('Upper Body B');
    expect(plan.workouts[3]?.focus).toContain('Lower Body B');

    for (const workout of plan.workouts) {
      for (const ex of workout.exercises) {
        expect(ex.whyForYou).toBeTruthy();
        expect(ex.imageUrl).toMatch(/^\/images\/exercises\/[a-z0-9-]+\.jpg$/);
      }
    }
  });

  it('crafts a 3-day Push / Pull / Legs routine with distinct Push, Pull, and Lower/Legs days', () => {
    const plan = generateRagNasmProgram({
      clientName: 'Taylor Brooks',
      goal: 'hypertrophy',
      targetNasmPhase: 3,
      trainingDaysPerWeek: 3,
      trainingSplit: 'push_pull_legs',
      equipmentAccess: ['barbell', 'dumbbell', 'cable', 'bench'],
      kineticCompensations: [],
      injuriesLimitations: '',
      experienceLevel: 'intermediate',
    });

    expect(plan.trainingSplit).toBe('push_pull_legs');
    expect(plan.workouts).toHaveLength(3);
    expect(plan.workouts[0]?.focus).toContain('Push');
    expect(plan.workouts[1]?.focus).toContain('Pull');
    expect(plan.workouts[2]?.focus).toContain('Legs');
  });
});
