import { describe, it, expect } from 'vitest'
import {
  normalizeDashboardWorkspace,
  normalizeFitnessWorkspace,
  DashboardWorkspaceSchema,
  CoachFocusFilterSchema,
  normalizeCoachClientTab,
  CoachClientTabSchema,
} from '@/lib/validation'

describe('validation schema & normalizers', () => {
  describe('normalizeDashboardWorkspace', () => {
    it('normalizes all valid dashboard workspaces correctly', () => {
      expect(normalizeDashboardWorkspace('overview')).toBe('overview')
      expect(normalizeDashboardWorkspace('lab')).toBe('lab')
      expect(normalizeDashboardWorkspace('dossier')).toBe('dossier')
      expect(normalizeDashboardWorkspace('packages')).toBe('packages')
      expect(normalizeDashboardWorkspace('sessions')).toBe('sessions')
    })

    it('handles arrays and invalid values by defaulting to overview', () => {
      expect(normalizeDashboardWorkspace(['lab'])).toBe('lab')
      expect(normalizeDashboardWorkspace(undefined)).toBe('overview')
      expect(normalizeDashboardWorkspace('invalid-workspace')).toBe('overview')
      expect(normalizeDashboardWorkspace('')).toBe('overview')
    })

    it('has all 5 workspaces in the schema', () => {
      expect(DashboardWorkspaceSchema.options).toEqual(['overview', 'lab', 'dossier', 'packages', 'sessions'])
    })
  })

  describe('normalizeFitnessWorkspace', () => {
    it('maps workouts alias to train', () => {
      expect(normalizeFitnessWorkspace('workouts')).toBe('train')
    })

    it('preserves valid hubs and tool deep links', () => {
      expect(normalizeFitnessWorkspace('train')).toBe('train')
      expect(normalizeFitnessWorkspace('progress')).toBe('progress')
      expect(normalizeFitnessWorkspace('lab')).toBe('lab')
      expect(normalizeFitnessWorkspace('coach')).toBe('coach')
      expect(normalizeFitnessWorkspace('readiness')).toBe('readiness')
    })

    it('defaults unknown to train', () => {
      expect(normalizeFitnessWorkspace('unknown-tab')).toBe('train')
      expect(normalizeFitnessWorkspace(undefined)).toBe('train')
    })
  })

  describe('CoachFocusFilterSchema', () => {
    it('validates coach focus keys', () => {
      expect(CoachFocusFilterSchema.parse('all')).toBe('all')
      expect(CoachFocusFilterSchema.parse('low-credits')).toBe('low-credits')
      expect(CoachFocusFilterSchema.parse('inactive')).toBe('inactive')
    })
  })

  describe('normalizeCoachClientTab & CoachClientTabSchema', () => {
    it('validates prescriptions and dossier tabs in schema', () => {
      expect(normalizeCoachClientTab('prescriptions')).toBe('prescriptions')
      expect(normalizeCoachClientTab('dossier')).toBe('dossier')
      expect(CoachClientTabSchema.parse('dossier')).toBe('dossier')
    })

    it('normalizes legacy toolbox and supplements tabs to prescriptions', () => {
      expect(normalizeCoachClientTab('toolbox')).toBe('prescriptions')
      expect(normalizeCoachClientTab('supplements')).toBe('prescriptions')
      expect(normalizeCoachClientTab(['toolbox'])).toBe('prescriptions')
      expect(normalizeCoachClientTab(['supplements'])).toBe('prescriptions')
    })

    it('normalizes audit tab to lifecycle', () => {
      expect(normalizeCoachClientTab('audit')).toBe('lifecycle')
    })

    it('defaults unknown tabs to overview', () => {
      expect(normalizeCoachClientTab('unknown-tab')).toBe('overview')
      expect(normalizeCoachClientTab(undefined)).toBe('overview')
    })
  })
})
