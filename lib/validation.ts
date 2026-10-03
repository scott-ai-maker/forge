import { z } from 'zod'

// Dashboard workspace validation
export const DashboardWorkspaceSchema = z.enum(['overview', 'lab', 'dossier', 'packages', 'sessions'])
export type DashboardWorkspace = z.infer<typeof DashboardWorkspaceSchema>

export function normalizeDashboardWorkspace(value: string | string[] | undefined): DashboardWorkspace {
  try {
    const parsed = DashboardWorkspaceSchema.parse(Array.isArray(value) ? value[0] : value)
    return parsed
  } catch {
    return 'overview'
  }
}

// Fitness workspace validation (4 Primary Hubs + Deep-Link Identifiers)
export const FitnessWorkspaceSchema = z.enum([
  'train',
  'progress',
  'lab',
  'coach',
  'workouts',
  'analyze',
  'checkin',
  'assessment',
  'video',
  'nutrition',
  'roadmap',
  'periodization',
  'readiness',
  'sleep',
  'calculator',
  'performance',
  'toolboxes',
  'supplements',
  'travel',
])
export type FitnessWorkspace = z.infer<typeof FitnessWorkspaceSchema>

export function normalizeFitnessWorkspace(value: string | string[] | undefined): FitnessWorkspace {
  try {
    const parsed = FitnessWorkspaceSchema.parse(Array.isArray(value) ? value[0] : value)
    if (parsed === 'workouts') return 'train'
    return parsed
  } catch {
    return 'train'
  }
}

// Coach focus filter validation
export const CoachFocusFilterSchema = z.enum([
  'all',
  'sessions-this-week',
  'attendance-30d',
  'no-show-30d',
  'onboarding-complete',
  'unread-messages',
  'low-credits',
  'inactive',
  'no-upcoming',
])
export type CoachFocusFilter = z.infer<typeof CoachFocusFilterSchema>

export function normalizeCoachFocusFilter(value: string | string[] | undefined): CoachFocusFilter {
  try {
    const parsed = CoachFocusFilterSchema.parse(Array.isArray(value) ? value[0] : value)
    return parsed
  } catch {
    return 'all'
  }
}

// Coach dashboard tab validation
export const CoachDashboardTabSchema = z.enum(['overview', 'onboarding', 'architect', 'triage', 'roster', 'intake', 'pipeline', 'analytics'])
export type CoachDashboardTab = z.infer<typeof CoachDashboardTabSchema>

export function normalizeCoachDashboardTab(value: string | string[] | undefined): CoachDashboardTab {
  try {
    const parsed = CoachDashboardTabSchema.parse(Array.isArray(value) ? value[0] : value)
    return parsed
  } catch {
    return 'overview'
  }
}

// Coach client tab validation
export const CoachClientTabSchema = z.enum([
  'overview',
  'onboarding',
  'program',
  'periodization',
  'assessment',
  'shield',
  'toolbox',
  'supplements',
  'cardio',
  'prescriptions',
  'commerce',
  'sessions',
  'checkins',
  'dossier',
  'lifecycle',
  'audit',
])
export type CoachClientTab = z.infer<typeof CoachClientTabSchema>

export function normalizeCoachClientTab(value: string | string[] | undefined): CoachClientTab {
  try {
    const raw = Array.isArray(value) ? value[0] : value
    if (raw === 'audit') return 'lifecycle'
    if (raw === 'toolbox' || raw === 'supplements' || raw === 'cardio') return 'prescriptions'
    const parsed = CoachClientTabSchema.parse(raw)
    return parsed
  } catch {
    return 'overview'
  }
}

