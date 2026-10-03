import { describe, it, expect } from 'vitest'
import { CoachClientTab } from '@/lib/validation'

describe('CoachClientHubNavigator Tab & Current Phase Highlighting Logic', () => {
  // Test helper emulating getTabStyle and badging from CoachClientHubNavigator
  function evaluateTabHighlight({
    tabKey,
    activeTab,
    currentStageTab,
    currentStageNumber,
  }: {
    tabKey: CoachClientTab
    activeTab: CoachClientTab
    currentStageTab?: CoachClientTab
    currentStageNumber?: number
  }) {
    const isActive = activeTab === tabKey
    const isCurrentPhase = currentStageTab === tabKey

    let mode: 'current_and_active' | 'current_phase' | 'active_only' | 'inactive' = 'inactive'
    let badge = ''

    if (isCurrentPhase && isActive) {
      mode = 'current_and_active'
      badge = `STAGE ${currentStageNumber} · ACTIVE`
    } else if (isCurrentPhase && !isActive) {
      mode = 'current_phase'
      badge = `STAGE ${currentStageNumber}`
    } else if (isActive && !isCurrentPhase) {
      mode = 'active_only'
      badge = '● Active'
    } else {
      mode = 'inactive'
      badge = ''
    }

    return {
      isActive,
      isCurrentPhase,
      mode,
      badge,
    }
  }

  describe('Current Phase & Active Tab Visual Stratification', () => {
    it('illuminates combined focus state when viewing the current phase tab (Stage 8 Check-Ins)', () => {
      const result = evaluateTabHighlight({
        tabKey: 'checkins',
        activeTab: 'checkins',
        currentStageTab: 'checkins',
        currentStageNumber: 8,
      })

      expect(result.isActive).toBe(true)
      expect(result.isCurrentPhase).toBe(true)
      expect(result.mode).toBe('current_and_active')
      expect(result.badge).toBe('STAGE 8 · ACTIVE')
    })

    it('retains prominent current phase indicator when coach switches away to overview or program tab', () => {
      // Coach is viewing overview tab while athlete is in Stage 8 (checkins)
      const checkinsTabResult = evaluateTabHighlight({
        tabKey: 'checkins',
        activeTab: 'overview',
        currentStageTab: 'checkins',
        currentStageNumber: 8,
      })

      expect(checkinsTabResult.isActive).toBe(false)
      expect(checkinsTabResult.isCurrentPhase).toBe(true)
      expect(checkinsTabResult.mode).toBe('current_phase')
      expect(checkinsTabResult.badge).toBe('STAGE 8')

      // Meanwhile, the overview tab is highlighted as active_only
      const overviewTabResult = evaluateTabHighlight({
        tabKey: 'overview',
        activeTab: 'overview',
        currentStageTab: 'checkins',
        currentStageNumber: 8,
      })

      expect(overviewTabResult.isActive).toBe(true)
      expect(overviewTabResult.isCurrentPhase).toBe(false)
      expect(overviewTabResult.mode).toBe('active_only')
      expect(overviewTabResult.badge).toBe('● Active')
    })

    it('advances current phase to Stage 9 (Lifecycle) after notes are saved and switches tab', () => {
      // Coach advances to Stage 9 (Lifecycle & Retention)
      const lifecycleResult = evaluateTabHighlight({
        tabKey: 'lifecycle',
        activeTab: 'lifecycle',
        currentStageTab: 'lifecycle',
        currentStageNumber: 9,
      })

      expect(lifecycleResult.isActive).toBe(true)
      expect(lifecycleResult.isCurrentPhase).toBe(true)
      expect(lifecycleResult.mode).toBe('current_and_active')
      expect(lifecycleResult.badge).toBe('STAGE 9 · ACTIVE')

      // Previous Stage 8 (checkins) is now an ordinary inactive tab
      const previousStageResult = evaluateTabHighlight({
        tabKey: 'checkins',
        activeTab: 'lifecycle',
        currentStageTab: 'lifecycle',
        currentStageNumber: 9,
      })

      expect(previousStageResult.isActive).toBe(false)
      expect(previousStageResult.isCurrentPhase).toBe(false)
      expect(previousStageResult.mode).toBe('inactive')
    })

    it('accurately highlights Stage 4 (Movement Screen) during initial onboarding', () => {
      const assessmentResult = evaluateTabHighlight({
        tabKey: 'assessment',
        activeTab: 'assessment',
        currentStageTab: 'assessment',
        currentStageNumber: 4,
      })

      expect(assessmentResult.isActive).toBe(true)
      expect(assessmentResult.isCurrentPhase).toBe(true)
      expect(assessmentResult.badge).toBe('STAGE 4 · ACTIVE')
    })
  })

  describe('Navigator Header Breadcrumb Evaluation', () => {
    function getHeaderBreadcrumb(activeTab: CoachClientTab, currentStageTab?: CoachClientTab, stageNum?: number, title?: string) {
      if (!currentStageTab || !stageNum) return null
      const isViewingCurrentPhase = activeTab === currentStageTab
      return {
        label: stageNum <= 7
          ? `Onboarding Phase ${stageNum}: ${title || currentStageTab}`
          : `Maintenance & Compliance: Stage ${stageNum} (${title || currentStageTab})`,
        needsJumpLink: !isViewingCurrentPhase,
      }
    }

    it('generates jump link when coach is on a different tab from current phase', () => {
      const breadcrumb = getHeaderBreadcrumb('program', 'sessions', 7, 'Delivery Kickoff')
      expect(breadcrumb).not.toBeNull()
      expect(breadcrumb?.label).toBe('Onboarding Phase 7: Delivery Kickoff')
      expect(breadcrumb?.needsJumpLink).toBe(true)
    })

    it('omits jump link when already viewing the current phase tab', () => {
      const breadcrumb = getHeaderBreadcrumb('sessions', 'sessions', 7, 'Delivery Kickoff')
      expect(breadcrumb).not.toBeNull()
      expect(breadcrumb?.needsJumpLink).toBe(false)
    })

    it('formats Maintenance & Compliance header for Stage 8 (Check-Ins)', () => {
      const breadcrumb = getHeaderBreadcrumb('overview', 'checkins', 8, 'Weekly Follow-Ups')
      expect(breadcrumb).not.toBeNull()
      expect(breadcrumb?.label).toBe('Maintenance & Compliance: Stage 8 (Weekly Follow-Ups)')
      expect(breadcrumb?.needsJumpLink).toBe(true)
    })
  })
})
