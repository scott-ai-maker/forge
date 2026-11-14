export type ErgonomicFlag = 'forward_head' | 'rounded_shoulders' | 'hip_flexor_tightness'
export type DeskErgonomicFlag = ErgonomicFlag

export type StrainLevel = 'optimal' | 'amber' | 'coral'

export type EnvironmentProfileId =
  | 'home_gym'
  | 'full_gym'
  | 'hotel_travel'
  | 'bodyweight_only'

export interface SavedWorkstationProfile {
  id: string
  label: string
  score: number
  strainLevel: StrainLevel
  ergonomicFlags: ErgonomicFlag[]
  craniovertebralDeg: number
  shoulderProtractionDeg: number
  elbowAngleDeg: number
  seatedHipAngleDeg: number
  savedAt: string
}

export interface InjectedReadinessDrill {
  id: string
  name: string
  targetArea: string
  durationSec: number
  cue: string
  priority: number
}

export interface DailyReadinessComfortLog {
  date: string // YYYY-MM-DD
  readinessScore?: number
  jointComfortScore?: number // 1 - 10 scale (or 0-100 mapped)
  comfortLabel?: string
  screenType?: 'overhead_squat' | 'scapular_wall_slides' | 'dual_screen'
  restrictionFlags?: string[]
  updatedAt: string
}

export interface PostureDeltaSummary {
  baselineDate: string
  latestDate: string
  forwardHeadDeltaDeg: number // e.g., -4.5 means improved by 4.5°
  shoulderSymmetryDeltaDeg: number
  pelvicTiltDeltaDeg: number
  overallPostureScore: number
  strainFlag: StrainLevel
}

export interface PersistedPostureProfileState {
  ergonomicFlags: ErgonomicFlag[]
  workstationProfiles: SavedWorkstationProfile[]
  expressModeActive: boolean
  environmentProfile: EnvironmentProfileId
  environmentSwapDates: string[] // YYYY-MM-DD dates when hotel_travel or bodyweight_only was selected
  injectedWarmupDrills: InjectedReadinessDrill[]
  injectedWarmupRemovedForDate?: string | null
  dailyLogs: Record<string, DailyReadinessComfortLog>
  postureDelta: PostureDeltaSummary
  updatedAt: string
}

export const POSTURE_PROFILE_STORAGE_KEY = 'forge_posture_profile_v1'
export const POSTURE_PROFILE_EVENT = 'forge:posture-profile-updated'

export const ENVIRONMENT_PROFILE_META: Record<
  EnvironmentProfileId,
  { label: string; shortLabel: string; isTravelSwap: boolean }
> = {
  home_gym: { label: 'Home Gym', shortLabel: 'Home Gym', isTravelSwap: false },
  full_gym: { label: 'Full Gym', shortLabel: 'Full Gym', isTravelSwap: false },
  hotel_travel: { label: 'Hotel Travel', shortLabel: 'Hotel Travel', isTravelSwap: true },
  bodyweight_only: { label: 'Bodyweight Only', shortLabel: 'Bodyweight', isTravelSwap: true },
}

export function getTodayIsoDate(now = new Date()): string {
  return now.toISOString().split('T')[0]
}

export function getDefaultPostureProfileState(): PersistedPostureProfileState {
  return {
    ergonomicFlags: [],
    workstationProfiles: [],
    expressModeActive: false,
    environmentProfile: 'home_gym',
    environmentSwapDates: [],
    injectedWarmupDrills: [],
    injectedWarmupRemovedForDate: null,
    dailyLogs: {},
    postureDelta: {
      baselineDate: '2026-10-16',
      latestDate: '2026-11-13',
      forwardHeadDeltaDeg: -4.5,
      shoulderSymmetryDeltaDeg: -2.1,
      pelvicTiltDeltaDeg: -3.0,
      overallPostureScore: 84,
      strainFlag: 'amber',
    },
    updatedAt: new Date().toISOString(),
  }
}

export function loadPostureProfileState(): PersistedPostureProfileState {
  if (typeof window === 'undefined') return getDefaultPostureProfileState()
  try {
    const raw = window.localStorage.getItem(POSTURE_PROFILE_STORAGE_KEY)
    if (!raw) return getDefaultPostureProfileState()
    const parsed = JSON.parse(raw) as Partial<PersistedPostureProfileState>
    const defaults = getDefaultPostureProfileState()
    return {
      ...defaults,
      ...parsed,
      ergonomicFlags: Array.isArray(parsed.ergonomicFlags) ? parsed.ergonomicFlags : defaults.ergonomicFlags,
      workstationProfiles: Array.isArray(parsed.workstationProfiles)
        ? parsed.workstationProfiles
        : defaults.workstationProfiles,
      environmentSwapDates: Array.isArray(parsed.environmentSwapDates)
        ? parsed.environmentSwapDates
        : defaults.environmentSwapDates,
      injectedWarmupDrills: Array.isArray(parsed.injectedWarmupDrills)
        ? parsed.injectedWarmupDrills
        : defaults.injectedWarmupDrills,
      dailyLogs: parsed.dailyLogs && typeof parsed.dailyLogs === 'object' ? parsed.dailyLogs : defaults.dailyLogs,
      postureDelta: parsed.postureDelta ? { ...defaults.postureDelta, ...parsed.postureDelta } : defaults.postureDelta,
    }
  } catch {
    return getDefaultPostureProfileState()
  }
}

export function savePostureProfileState(
  updater:
    | PersistedPostureProfileState
    | ((prev: PersistedPostureProfileState) => PersistedPostureProfileState)
): PersistedPostureProfileState {
  const prev = loadPostureProfileState()
  const next = typeof updater === 'function' ? updater(prev) : updater
  const stamped: PersistedPostureProfileState = {
    ...next,
    updatedAt: new Date().toISOString(),
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(POSTURE_PROFILE_STORAGE_KEY, JSON.stringify(stamped))
      window.dispatchEvent(new CustomEvent(POSTURE_PROFILE_EVENT, { detail: stamped }))
    } catch {
      // ignore storage write errors
    }
  }
  return stamped
}

/**
 * Checks whether selecting a travel/bodyweight environment swap today results in 2+ consecutive days.
 */
export function hasConsecutiveTravelSwaps(swapDates: string[], candidateDate: string): boolean {
  const unique = Array.from(new Set([...swapDates, candidateDate])).sort()
  if (unique.length < 2) return false

  for (let i = 1; i < unique.length; i += 1) {
    const prevMs = new Date(`${unique[i - 1]}T00:00:00Z`).getTime()
    const currMs = new Date(`${unique[i]}T00:00:00Z`).getTime()
    const diffDays = Math.round((currMs - prevMs) / 86_400_000)
    if (diffDays === 1) {
      return true
    }
  }
  return false
}

export function persistDeskErgonomicFlags(
  flags: ErgonomicFlag[],
  profileToSave?: Omit<SavedWorkstationProfile, 'id' | 'savedAt'>
): PersistedPostureProfileState {
  return savePostureProfileState(prev => {
    const mergedFlags = Array.from(new Set([...prev.ergonomicFlags, ...flags]))
    const nextProfiles = profileToSave
      ? [
          ...prev.workstationProfiles,
          {
            ...profileToSave,
            id: `ws-${Date.now()}`,
            savedAt: new Date().toISOString(),
          },
        ]
      : prev.workstationProfiles

    return {
      ...prev,
      ergonomicFlags: mergedFlags,
      workstationProfiles: nextProfiles,
      postureDelta: profileToSave
        ? {
            ...prev.postureDelta,
            latestDate: getTodayIsoDate(),
            overallPostureScore: profileToSave.score,
            strainFlag: profileToSave.strainLevel,
          }
        : prev.postureDelta,
    }
  })
}

export function recordDailyReadinessAndComfort(params: {
  date?: string
  readinessScore?: number
  jointComfortScore?: number
  comfortLabel?: string
  screenType?: 'overhead_squat' | 'scapular_wall_slides' | 'dual_screen'
  restrictionFlags?: string[]
  injectedDrills?: InjectedReadinessDrill[]
}): PersistedPostureProfileState {
  const dateKey = params.date || getTodayIsoDate()
  return savePostureProfileState(prev => {
    const existing = prev.dailyLogs[dateKey] || {
      date: dateKey,
      updatedAt: new Date().toISOString(),
    }
    const updatedLog: DailyReadinessComfortLog = {
      ...existing,
      ...(params.readinessScore !== undefined ? { readinessScore: params.readinessScore } : {}),
      ...(params.jointComfortScore !== undefined ? { jointComfortScore: params.jointComfortScore } : {}),
      ...(params.comfortLabel !== undefined ? { comfortLabel: params.comfortLabel } : {}),
      ...(params.screenType !== undefined ? { screenType: params.screenType } : {}),
      ...(params.restrictionFlags !== undefined ? { restrictionFlags: params.restrictionFlags } : {}),
      updatedAt: new Date().toISOString(),
    }
    return {
      ...prev,
      dailyLogs: {
        ...prev.dailyLogs,
        [dateKey]: updatedLog,
      },
      ...(params.injectedDrills !== undefined
        ? {
            injectedWarmupDrills: params.injectedDrills,
            injectedWarmupRemovedForDate: null,
          }
        : {}),
    }
  })
}

export function setExpressModeActive(active: boolean): PersistedPostureProfileState {
  return savePostureProfileState(prev => ({
    ...prev,
    expressModeActive: active,
  }))
}

export function recordEnvironmentSelection(
  env: EnvironmentProfileId,
  dateKey = getTodayIsoDate()
): { state: PersistedPostureProfileState; triggeredConsecutiveTravel: boolean } {
  const current = loadPostureProfileState()
  const meta = ENVIRONMENT_PROFILE_META[env]
  const triggeredConsecutiveTravel = meta.isTravelSwap
    ? hasConsecutiveTravelSwaps(current.environmentSwapDates, dateKey)
    : false

  const nextState = savePostureProfileState(prev => ({
    ...prev,
    environmentProfile: env,
    environmentSwapDates: meta.isTravelSwap
      ? Array.from(new Set([...prev.environmentSwapDates, dateKey])).sort()
      : prev.environmentSwapDates,
  }))

  return { state: nextState, triggeredConsecutiveTravel }
}

export function removeInjectedWarmupForToday(dateKey = getTodayIsoDate()): PersistedPostureProfileState {
  return savePostureProfileState(prev => ({
    ...prev,
    injectedWarmupDrills: [],
    injectedWarmupRemovedForDate: dateKey,
  }))
}

export function runQuickPostureCheckDelta(): PostureDeltaSummary {
  const next = savePostureProfileState(prev => {
    const improvedDelta = Number((prev.postureDelta.forwardHeadDeltaDeg - 0.3).toFixed(1))
    return {
      ...prev,
      postureDelta: {
        ...prev.postureDelta,
        latestDate: getTodayIsoDate(),
        forwardHeadDeltaDeg: Math.max(-7.5, improvedDelta),
        overallPostureScore: Math.min(96, prev.postureDelta.overallPostureScore + 2),
      },
    }
  })
  return next.postureDelta
}

export interface ServerTelemetryRehydrationPayload {
  snapshot?: {
    latestReadinessScore?: number | null
    latestReadinessAt?: string | null
    jointComfortHistory?: Array<{
      date: string
      score: number
      label?: string
      timestamp?: string
    }>
    deskWorkstationScore?: number | null
    deskStrainLevel?: string | null
    deskStrainFlags?: string[]
    postureDelta?: {
      overallPostureScore?: number | null
      forwardHeadTiltDeg?: number | null
      shoulderSymmetryDeg?: number | null
      pelvicSymmetryDeg?: number | null
      checkedAt?: string | null
    }
    injectedWarmupDrills?: Array<{ id: string; title: string; duration_sec: number }>
    expressModeActive?: boolean
    environmentProfile?: string
    lastSyncedAt?: string | null
  } | null
  baselineAssessment?: {
    assessmentDate?: string | null
    overallPostureScore?: number | null
  } | null
}

/**
 * Mitigates Apple iOS Safari / WKWebView 7-day script-writable storage eviction
 * by merging server-persisted posture scores, Desk Audit flags, Joint Comfort history,
 * Readiness scores, and environment preferences into `forge_posture_profile_v1` on launch.
 */
export function rehydratePostureProfileFromServer(
  rehydration: ServerTelemetryRehydrationPayload | null | undefined
): PersistedPostureProfileState | null {
  if (typeof window === 'undefined' || !rehydration) return null
  const snap = rehydration.snapshot
  const baseline = rehydration.baselineAssessment
  if (!snap && !baseline) return null

  return savePostureProfileState(prev => {
    const validFlags = Array.isArray(snap?.deskStrainFlags)
      ? snap.deskStrainFlags.filter(
          (f): f is ErgonomicFlag =>
            f === 'forward_head' || f === 'rounded_shoulders' || f === 'hip_flexor_tightness'
        )
      : []

    const mergedFlags = Array.from(new Set([...prev.ergonomicFlags, ...validFlags]))

    const mergedLogs: Record<string, DailyReadinessComfortLog> = { ...prev.dailyLogs }
    if (Array.isArray(snap?.jointComfortHistory)) {
      for (const entry of snap.jointComfortHistory) {
        if (!entry?.date || typeof entry.score !== 'number') continue
        const existing = mergedLogs[entry.date] || {
          date: entry.date,
          updatedAt: entry.timestamp || new Date().toISOString(),
        }
        // Preserve local entry if already recorded today, otherwise backfill from server
        if (existing.jointComfortScore === undefined) {
          mergedLogs[entry.date] = {
            ...existing,
            jointComfortScore: Math.max(1, Math.min(10, Math.round(entry.score / 10))),
            comfortLabel: entry.label || existing.comfortLabel,
            updatedAt: entry.timestamp || existing.updatedAt,
          }
        }
      }
    }

    if (typeof snap?.latestReadinessScore === 'number' && snap.latestReadinessAt) {
      const readinessDate = snap.latestReadinessAt.split('T')[0]
      const existing = mergedLogs[readinessDate] || {
        date: readinessDate,
        updatedAt: snap.latestReadinessAt,
      }
      if (existing.readinessScore === undefined) {
        mergedLogs[readinessDate] = {
          ...existing,
          readinessScore: snap.latestReadinessScore,
          updatedAt: snap.latestReadinessAt,
        }
      }
    }

    const validEnv =
      snap?.environmentProfile &&
      (snap.environmentProfile === 'home_gym' ||
        snap.environmentProfile === 'full_gym' ||
        snap.environmentProfile === 'hotel_travel' ||
        snap.environmentProfile === 'bodyweight_only')
        ? (snap.environmentProfile as EnvironmentProfileId)
        : prev.environmentProfile

    const strainMap: StrainLevel =
      snap?.deskStrainLevel === 'high_strain'
        ? 'coral'
        : snap?.deskStrainLevel === 'optimal'
          ? 'optimal'
          : prev.postureDelta.strainFlag

    const nextPostureDelta: PostureDeltaSummary = {
      ...prev.postureDelta,
      baselineDate: baseline?.assessmentDate
        ? String(baseline.assessmentDate).split('T')[0]
        : prev.postureDelta.baselineDate,
      latestDate: snap?.postureDelta?.checkedAt
        ? snap.postureDelta.checkedAt.split('T')[0]
        : prev.postureDelta.latestDate,
      overallPostureScore:
        typeof snap?.postureDelta?.overallPostureScore === 'number'
          ? snap.postureDelta.overallPostureScore
          : typeof snap?.deskWorkstationScore === 'number'
            ? snap.deskWorkstationScore
            : typeof baseline?.overallPostureScore === 'number'
              ? baseline.overallPostureScore
              : prev.postureDelta.overallPostureScore,
      forwardHeadDeltaDeg:
        typeof snap?.postureDelta?.forwardHeadTiltDeg === 'number'
          ? snap.postureDelta.forwardHeadTiltDeg
          : prev.postureDelta.forwardHeadDeltaDeg,
      shoulderSymmetryDeltaDeg:
        typeof snap?.postureDelta?.shoulderSymmetryDeg === 'number'
          ? snap.postureDelta.shoulderSymmetryDeg
          : prev.postureDelta.shoulderSymmetryDeltaDeg,
      pelvicTiltDeltaDeg:
        typeof snap?.postureDelta?.pelvicSymmetryDeg === 'number'
          ? snap.postureDelta.pelvicSymmetryDeg
          : prev.postureDelta.pelvicTiltDeltaDeg,
      strainFlag: strainMap,
    }

    return {
      ...prev,
      ergonomicFlags: mergedFlags,
      expressModeActive:
        typeof snap?.expressModeActive === 'boolean' ? snap.expressModeActive : prev.expressModeActive,
      environmentProfile: validEnv,
      dailyLogs: mergedLogs,
      postureDelta: nextPostureDelta,
    }
  })
}
