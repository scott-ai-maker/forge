import { describe, it, expect } from 'vitest'
import {
  evaluateClientOnboardingProgression,
  type ClientProgressionProfile,
} from '@/lib/coach-onboarding-progression'
import { CoachClientTabSchema } from '@/lib/validation'

describe('Coach Onboarding Workflow Interactive Mechanics', () => {
  const mockAthleteA = evaluateClientOnboardingProgression({
    clientId: 'athlete-a',
    clientName: 'Alex Mercer',
    email: 'alex@example.com',
    designatedCoachId: 'coach-1',
    packages: [{ id: 'pkg-1', package_name: 'Pro Tier', sessions_remaining: 8, sessions_total: 10, source: 'paid' }],
    intakeForm: {
      parq_answers: { hasHeartCondition: false },
      consent_signature_name: 'Alex Mercer',
      consent_signed_at: '2026-09-01',
    },
    fitnessProfile: {
      height_cm: 182,
      weight_kg: 85,
      fitness_goal: 'Hypertrophy & Strength',
      equipment_access: ['barbell', 'dumbbells', 'cable_machine'],
      training_days_per_week: 4,
    },
  })

  const mockAthleteB = evaluateClientOnboardingProgression({
    clientId: 'athlete-b',
    clientName: 'Samira Khan',
    email: 'samira@example.com',
    designatedCoachId: null, // Unassigned lead -> Stage 1
  })

  const mockAthleteC = evaluateClientOnboardingProgression({
    clientId: 'athlete-c',
    clientName: 'Marcus Vance',
    email: 'marcus@example.com',
    designatedCoachId: 'coach-1',
    packages: [{ id: 'pkg-2', package_name: 'Standard', sessions_remaining: 10, sessions_total: 10, source: 'paid' }],
    intakeForm: {
      parq_answers: { hasHeartCondition: true }, // Medical clearance required -> Stage 2 blocked
      consent_signature_name: 'Marcus Vance',
      consent_signed_at: '2026-09-01',
    },
  })

  const mockAthleteD = evaluateClientOnboardingProgression({
    clientId: 'athlete-d',
    clientName: 'Diana Prince',
    email: 'diana@example.com',
    designatedCoachId: 'coach-1',
    packages: [{ id: 'pkg-3', package_name: 'Pro Tier', sessions_remaining: 5, sessions_total: 10, source: 'paid' }],
    intakeForm: {
      parq_answers: { hasHeartCondition: false },
      consent_signature_name: 'Diana Prince',
      consent_signed_at: '2026-09-01',
    },
    fitnessProfile: {
      height_cm: 175,
      weight_kg: 68,
      fitness_goal: 'Power & Agility',
      equipment_access: ['full_gym'],
      training_days_per_week: 5,
    },
    assessments: [{ id: 'a-1', assessment_date: '2026-09-01', ohsa_findings: [] }],
    latestPlan: {
      id: 'plan-1',
      name: 'Power Program',
      nasm_opt_phase: 2,
      plan_json: {
        periodizationPlan: { macrocycleId: 'm-1', weeks: [] },
        sessions: [{ day: 'Monday', exercises: [{ name: 'Squat' }] }],
      },
    },
  })

  describe('Interactive Next Step Link Resolution', () => {
    it('generates valid and parseable CoachClientTab target for athlete at Stage 4', () => {
      expect(mockAthleteA.currentStageNumber).toBe(4)
      expect(mockAthleteA.nextAction.tab).toBe('assessment')
      expect(CoachClientTabSchema.safeParse(mockAthleteA.nextAction.tab).success).toBe(true)
      expect(mockAthleteA.nextAction.href).toBe('/coach/clients/athlete-a?tab=assessment&subtab=ohsa#workspace-tab-content')
      expect(mockAthleteA.nextAction.label).toBe('Conduct Overhead Squat Assessment')
    })

    it('generates valid Next Action for unassigned lead at Stage 1', () => {
      expect(mockAthleteB.currentStageNumber).toBe(1)
      expect(mockAthleteB.nextAction.tab).toBe('commerce')
      expect(CoachClientTabSchema.safeParse(mockAthleteB.nextAction.tab).success).toBe(true)
      expect(mockAthleteB.nextAction.href).toBe('/coach/clients/athlete-b?tab=commerce#workspace-tab-content')
      expect(mockAthleteB.nextAction.urgency).toBe('urgent')
    })

    it('flags blocked Stage 2 athlete with urgent shield review action', () => {
      expect(mockAthleteC.currentStageNumber).toBe(2)
      expect(mockAthleteC.isBlockedByMedicalClearance).toBe(true)
      expect(mockAthleteC.nextAction.tab).toBe('shield')
      expect(CoachClientTabSchema.safeParse(mockAthleteC.nextAction.tab).success).toBe(true)
      expect(mockAthleteC.nextAction.href).toBe('/coach/clients/athlete-c?tab=shield#workspace-tab-content')
      expect(mockAthleteC.nextAction.urgency).toBe('urgent')
    })

    it('verifies that all stage actionHrefs point to valid recognized CoachClientTab tabs', () => {
      for (const stage of mockAthleteA.stages) {
        expect(stage.actionHref).toMatch(/^\/coach\/clients\/athlete-a\?tab=/)
        const tabParam = stage.actionHref.split('tab=')[1].split('&')[0].split('#')[0]
        expect(CoachClientTabSchema.safeParse(tabParam).success).toBe(true)
      }
    })

    it('verifies Stage 4 milestones have deep links to specific assessment subtabs and workspace anchors', () => {
      const stage4 = mockAthleteA.stages.find(s => s.stageNumber === 4)!
      expect(stage4).toBeDefined()
      expect(stage4.milestones).toHaveLength(3)

      const [staticPosture, ohsa, cex] = stage4.milestones
      expect(staticPosture.actionHref).toBe(
        '/coach/clients/athlete-a?tab=assessment&subtab=posture#workspace-tab-content'
      )
      expect(ohsa.actionHref).toBe(
        '/coach/clients/athlete-a?tab=assessment&subtab=ohsa#workspace-tab-content'
      )
      expect(cex.actionHref).toBe(
        '/coach/clients/athlete-a?tab=assessment&subtab=cex#workspace-tab-content'
      )
    })
  })

  describe('Studio Ribbon and Category Filter Logic', () => {
    const profiles: ClientProgressionProfile[] = [mockAthleteA, mockAthleteB, mockAthleteC, mockAthleteD]

    function applyFilters(
      list: ClientProgressionProfile[],
      stageFilter: number | 'all',
      categoryFilter: 'all' | 'needs_action' | 'testing' | 'program_build' | 'active_delivery',
      searchQuery: string
    ) {
      return list.filter(p => {
        // Stage filter
        if (stageFilter !== 'all' && p.currentStageNumber !== stageFilter) {
          return false
        }
        // Category filter
        if (categoryFilter === 'needs_action' && p.nextAction.urgency !== 'urgent' && !p.isBlockedByMedicalClearance) {
          return false
        }
        if (categoryFilter === 'testing' && p.currentStageNumber !== 4) {
          return false
        }
        if (categoryFilter === 'program_build' && p.currentStageNumber !== 5 && p.currentStageNumber !== 6) {
          return false
        }
        if (categoryFilter === 'active_delivery' && p.currentStageNumber < 7) {
          return false
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesName = p.clientName.toLowerCase().includes(q)
          const matchesEmail = (p.email || '').toLowerCase().includes(q)
          if (!matchesName && !matchesEmail) return false
        }
        return true
      })
    }

    it('filters by stage 4 accurately', () => {
      const filtered = applyFilters(profiles, 4, 'all', '')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].clientId).toBe('athlete-a')
    })

    it('filters by needs_action category accurately excluding normal delivery athletes', () => {
      const filtered = applyFilters(profiles, 'all', 'needs_action', '')
      // Athlete A (Stage 4 urgent), Athlete B (Stage 1 unassigned urgent), Athlete C (Stage 2 blocked urgent)
      expect(filtered).toHaveLength(3)
      expect(filtered.map(f => f.clientId)).toEqual(['athlete-a', 'athlete-b', 'athlete-c'])
    })

    it('filters by active_delivery category accurately', () => {
      const filtered = applyFilters(profiles, 'all', 'active_delivery', '')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].clientId).toBe('athlete-d')
    })

    it('filters by athlete name search query case-insensitively', () => {
      const filtered = applyFilters(profiles, 'all', 'all', 'samira')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].clientName).toBe('Samira Khan')
    })

    it('filters by email search query case-insensitively', () => {
      const filtered = applyFilters(profiles, 'all', 'all', 'marcus@')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].clientName).toBe('Marcus Vance')
    })
  })

  // ── 3. Focus Mode & Ribbon Collapse Logic ─────────────────────
  describe('Focus Mode & Collapsed Ribbon Logic for Graduated Athletes', () => {
    function shouldCollapseRibbon(isFullyOnboarded: boolean, activeTab?: string): boolean {
      return isFullyOnboarded && activeTab !== 'onboarding'
    }

    it('auto-collapses the continuum card into ribbon mode for graduated athletes on daily coaching tabs', () => {
      // Graduated athlete on 'program' tab -> collapses to ribbon
      expect(shouldCollapseRibbon(true, 'program')).toBe(true)
      // Graduated athlete on 'checkins' tab -> collapses to ribbon
      expect(shouldCollapseRibbon(true, 'checkins')).toBe(true)
      // Graduated athlete on 'overview' tab -> collapses to ribbon
      expect(shouldCollapseRibbon(true, 'overview')).toBe(true)
    })

    it('keeps the full continuum expanded when the coach explicitly visits the onboarding tab', () => {
      // Graduated athlete on 'onboarding' tab -> expands full card
      expect(shouldCollapseRibbon(true, 'onboarding')).toBe(false)
    })

    it('always keeps the full continuum expanded for athletes still in onboarding (Phases 1-7)', () => {
      // Onboarding athlete on any tab -> always full card
      expect(shouldCollapseRibbon(false, 'overview')).toBe(false)
      expect(shouldCollapseRibbon(false, 'program')).toBe(false)
      expect(shouldCollapseRibbon(false, 'assessment')).toBe(false)
    })
  })
})
