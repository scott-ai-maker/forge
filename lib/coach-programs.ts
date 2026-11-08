import { detectExerciseEquipment } from './nasm-equipment-detector'
import { resolveExerciseVideoEmbed, extractYouTubeVideoId } from './nasm-exercise-video-catalog'
import { resolveGaaExerciseImage, BRAND_LOGO_FALLBACK_IMAGE } from './nasm-generated-images'
import { parseExerciseStepInstructions } from './nasm-clinical-movement-cards'
import {
  type IntegratedCardioPrescription,
  type HandPortionNutritionPlan,
  type DualCardioPlanSummary,
  type StrengthCardioBlendSummary,
} from './rag-nasm-program-generator'
import { calculateEstimatedWorkoutDuration } from './workout-duration-engine'

export interface ExerciseLibraryRecord {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  coaching_cues?: string[] | null
  primary_equipment?: string[] | null
  muscle_groups?: string[] | null
  media_image_url?: string | null
  media_video_url?: string | null
  open_externally_only?: boolean | null
}

export interface EquipmentLibraryRecord {
  id: string
  name: string
  slug?: string | null
  description?: string | null
  media_image_url?: string | null
}

export interface WorkoutProgramTemplateRecord {
  id: string
  title: string
  slug?: string | null
  goal?: string | null
  nasm_opt_phase?: number | null
  phase_name?: string | null
  sessions_per_week?: number | null
  estimated_duration_mins?: number | null
  template_json?: {
    workouts?: CoachProgramWorkoutInput[]
  } | null
}

export interface CoachProgramTemplateRecord {
  id: string
  coach_id: string
  title: string
  goal?: string | null
  nasm_opt_phase?: number | null
  phase_name?: string | null
  sessions_per_week?: number | null
  estimated_duration_mins?: number | null
  template_json?: {
    workouts?: CoachProgramWorkoutInput[]
  } | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CoachProgramExerciseInput {
  libraryExerciseId?: string | null
  name: string
  block?: string | null
  sets: string
  reps: string
  tempo?: string | null
  rest?: string | null
  notes?: string | null
  description?: string | null
  personalReason?: string | null
  instructions?: string[] | null
  coachingCues?: string[] | null
  primaryEquipment?: string[] | null
  imageUrl?: string | null
  videoUrl?: string | null
}

export interface CoachProgramWorkoutInput {
  day: number
  focus: string
  scheduledDate?: string | null
  notes?: string | null
  exercises: CoachProgramExerciseInput[]
  cardioProtocol?: IntegratedCardioPrescription | null
}

export interface CoachProgramPayload {
  clientId: string
  name: string
  goal?: string | null
  nasmOptPhase: number
  phaseName: string
  sessionsPerWeek: number
  estimatedDurationMins: number
  startDate?: string | null
  templateId?: string | null
  workouts: CoachProgramWorkoutInput[]
  clinicalRationale?: string | null
  coachPersonalNote?: string | null
  handPortionPlan?: HandPortionNutritionPlan | null
  dualCardioPlan?: DualCardioPlanSummary | null
  periodizationWeeklyMemos?: string[] | null
  periodizationPlan?: {
    weeklyMemos?: string[]
    ragSourcesCited?: string[]
  } | null
  strengthCardioBlendSummary?: StrengthCardioBlendSummary | null
  isCertifiedByCoach?: boolean | null
  coachCertifiedAt?: string | null
  certifiedBy?: string | null
  safetyGateCertified?: boolean | null
}

export interface CoachProgramDraft {
  clientId: string
  name: string
  goal?: string | null
  nasmOptPhase: number
  phaseName: string
  sessionsPerWeek: number
  estimatedDurationMins: number
  startDate?: string | null
  templateId?: string | null
  templateTitle?: string | null
  generatedAt: string
  generatedWithEquipmentAccess?: string[]
  workouts: ProgramWorkoutSnapshot[]
}

export interface ProgramExerciseSnapshot {
  libraryExerciseId: string | null
  name: string
  block: string | null
  sets: string
  reps: string
  tempo: string | null
  rest: string | null
  notes: string | null
  description: string | null
  personalReason?: string | null
  instructions?: string[]
  coachingCues: string[]
  primaryEquipment: string[]
  imageUrl: string | null
  videoUrl: string | null
  openExternallyOnly: boolean
}

export interface ProgramWorkoutSnapshot {
  day: number
  focus: string
  scheduledDate: string | null
  notes: string | null
  exercises: ProgramExerciseSnapshot[]
  cardioProtocol?: IntegratedCardioPrescription | null
}

export interface ProgramCalendarEntry {
  day: number
  focus: string
  scheduledDate: string | null
  durationMins: number
  exerciseCount: number
}

export interface StoredProgramPlan {
  source: 'coach_builder'
  createdAt: string
  templateId: string | null
  workouts: ProgramWorkoutSnapshot[]
  calendar: ProgramCalendarEntry[]
  librarySummary: {
    exerciseCount: number
    equipmentCount: number
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeOptionalText(value: unknown) {
  const normalized = normalizeText(value)
  return normalized.length > 0 ? normalized : null
}

function normalizeTextArray(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()

  return values
    .map(item => normalizeText(item))
    .filter(item => {
      if (!item) return false
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function parseDateOnly(value: string | null | undefined) {
  if (!value) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const [, year, month, day] = match
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date.getTime())
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function buildGeneratedDates(startDate: string | null | undefined, count: number, sessionsPerWeek: number) {
  const parsedStart = parseDateOnly(startDate)
  if (!parsedStart || count <= 0) return []

  const spacing = Math.max(1, Math.ceil(7 / Math.max(1, sessionsPerWeek)))
  return Array.from({ length: count }, (_, index) => formatDateOnly(addUtcDays(parsedStart, index * spacing)))
}

const SEMANTIC_CANONICAL_EXERCISE_MAP: Record<string, string> = {
  'how to foam roll adductors': 'foam roll adductors',
  'dumbbell bent over extention': 'supported bent over dumbbell extension',
  'latissimus dorsi ball stretch': 'static latissimus dorsi ball stretch',
  'self myofascial release smr latissimus dorsi': 'foam roll latissimus dorsi',
  'core ball crunch': 'ball crunch',
  'two arm incline dumbbell chest press': 'incline dumbbell bench press',
}

function normalizeExerciseIdentityKey(name: string): string {
  const norm = String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return SEMANTIC_CANONICAL_EXERCISE_MAP[norm] || norm
}

function scoreExerciseLibraryRecord(record: ExerciseLibraryRecord, canonicalKey: string): number {
  let score = 0
  const rawNorm = String(record.name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (rawNorm === canonicalKey) score += 100
  if (record.media_video_url) score += 20
  if (record.media_image_url && !record.media_image_url.includes('placeholder')) score += 10
  if (record.description && record.description.length > 50) {
    score += Math.min(25, Math.floor(record.description.length / 50))
  }
  if (Array.isArray(record.coaching_cues) && record.coaching_cues.length > 0) score += 5
  if (Array.isArray(record.primary_equipment) && record.primary_equipment.length > 0) score += 5
  if (Array.isArray(record.muscle_groups) && record.muscle_groups.length > 0) score += 5
  return score
}

/**
 * Deduplicates an array of exercise library records by normalized/canonical exercise name,
 * retaining the highest-scoring canonical record when duplicates exist.
 */
export function deduplicateExerciseLibraryRecords<T extends ExerciseLibraryRecord>(records: T[]): T[] {
  const byKey = new Map<string, T>()
  for (const record of records) {
    if (!record || !record.name) continue
    const key = normalizeExerciseIdentityKey(record.name)
    if (!key) continue
    const existing = byKey.get(key)
    if (!existing || scoreExerciseLibraryRecord(record, key) > scoreExerciseLibraryRecord(existing, key)) {
      byKey.set(key, record)
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function findExerciseMatch(
  exercise: CoachProgramExerciseInput,
  byId: Map<string, ExerciseLibraryRecord>,
  byName: Map<string, ExerciseLibraryRecord>
) {
  const id = normalizeOptionalText(exercise.libraryExerciseId)
  const exactName = normalizeText(exercise.name).toLowerCase()
  const canonicalName = normalizeExerciseIdentityKey(exercise.name)

  if (id && byId.has(id)) {
    return byId.get(id) ?? null
  }

  if (exactName && byName.has(exactName)) {
    return byName.get(exactName) ?? null
  }

  if (canonicalName && byName.has(canonicalName)) {
    return byName.get(canonicalName) ?? null
  }

  return null
}

export function buildStoredProgramPlan(
  payload: CoachProgramPayload,
  exercises: ExerciseLibraryRecord[],
  equipmentLibrary: EquipmentLibraryRecord[]
): StoredProgramPlan {
  const uniqueExercises = deduplicateExerciseLibraryRecords(exercises)
  const exerciseById = new Map(exercises.map(exercise => [exercise.id, exercise]))
  const exerciseByName = new Map<string, ExerciseLibraryRecord>()
  for (const exercise of uniqueExercises) {
    exerciseByName.set(exercise.name.trim().toLowerCase(), exercise)
    exerciseByName.set(normalizeExerciseIdentityKey(exercise.name), exercise)
  }
  const generatedDates = buildGeneratedDates(payload.startDate, payload.workouts.length, payload.sessionsPerWeek)

  let generatedDateIndex = 0

  const workouts = payload.workouts
    .map<ProgramWorkoutSnapshot | null>((workout, index) => {
      const focus = normalizeText(workout.focus)
      const explicitScheduledDate = normalizeOptionalText(workout.scheduledDate)
      const scheduledDate = explicitScheduledDate ?? generatedDates[generatedDateIndex++] ?? null
      const notes = normalizeOptionalText(workout.notes)

      const sanitizedExercises: ProgramExerciseSnapshot[] = (Array.isArray(workout.exercises) ? workout.exercises : [])
        .map(exercise => {
          const name = normalizeText(exercise.name)
          if (!name) return null

          const match = findExerciseMatch(exercise, exerciseById, exerciseByName)
          const videoRes = resolveExerciseVideoEmbed(name, match?.media_video_url ?? exercise.videoUrl)
          const ytId = extractYouTubeVideoId(videoRes.externalUrl) || extractYouTubeVideoId(videoRes.embedUrl)
          const officialThumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null
          const gaaImage = resolveGaaExerciseImage(name, false)
          const isLocalCreated = (url?: string | null) => Boolean(url && url.includes('/images/exercises/'))
          const customExerciseImg = !isLocalCreated(exercise.imageUrl) ? normalizeOptionalText(exercise.imageUrl) : null
          const customMatchImg = !isLocalCreated(match?.media_image_url) ? normalizeOptionalText(match?.media_image_url) : null
          const resolvedImageUrl =
            officialThumbnail ??
            gaaImage ??
            customExerciseImg ??
            customMatchImg ??
            BRAND_LOGO_FALLBACK_IMAGE

          const resolvedDescription = normalizeOptionalText(match?.description ?? exercise.description)
          const resolvedInstructions = parseExerciseStepInstructions(resolvedDescription)

          const snapshot: ProgramExerciseSnapshot = {
            libraryExerciseId: match?.id ?? normalizeOptionalText(exercise.libraryExerciseId),
            name,
            block: normalizeOptionalText(exercise.block),
            sets: normalizeText(exercise.sets),
            reps: normalizeText(exercise.reps),
            tempo: normalizeOptionalText(exercise.tempo),
            rest: normalizeOptionalText(exercise.rest),
            notes: normalizeOptionalText(exercise.notes),
            description: resolvedDescription,
            personalReason: normalizeOptionalText(exercise.personalReason),
            instructions: resolvedInstructions.length > 0 ? resolvedInstructions : undefined,
            coachingCues: [],
            primaryEquipment: normalizeTextArray(
              match?.primary_equipment && match.primary_equipment.length > 0
                ? match.primary_equipment
                : detectExerciseEquipment(name, resolvedDescription, exercise.primaryEquipment)
            ),
            imageUrl: resolvedImageUrl,
            videoUrl: videoRes.externalUrl || normalizeOptionalText(match?.media_video_url ?? exercise.videoUrl),
            openExternallyOnly: Boolean(match?.open_externally_only),
          }
          return snapshot
        })
        .filter((exercise): exercise is ProgramExerciseSnapshot => exercise !== null)

      if (!focus || sanitizedExercises.length === 0) return null

        return {
          day: Number(workout.day) || index + 1,
          focus,
          scheduledDate,
          notes,
          exercises: sanitizedExercises,
          cardioProtocol: workout.cardioProtocol
            ? {
                ...workout.cardioProtocol,
                recommendedModalities: Array.isArray(workout.cardioProtocol.recommendedModalities)
                  ? workout.cardioProtocol.recommendedModalities.map(String)
                  : typeof workout.cardioProtocol.recommendedModalities === 'string' && (workout.cardioProtocol.recommendedModalities as string).trim()
                    ? [(workout.cardioProtocol.recommendedModalities as string).trim()]
                    : [],
                coachingCues: Array.isArray(workout.cardioProtocol.coachingCues)
                  ? workout.cardioProtocol.coachingCues.map(String)
                  : typeof workout.cardioProtocol.coachingCues === 'string' && (workout.cardioProtocol.coachingCues as string).trim()
                    ? [(workout.cardioProtocol.coachingCues as string).trim()]
                    : [],
              }
            : null,
        } satisfies ProgramWorkoutSnapshot
    })
    .filter(Boolean) as ProgramWorkoutSnapshot[]

  const equipmentNames = new Set(
    workouts.flatMap(workout => workout.exercises.flatMap(exercise => exercise.primaryEquipment.map(item => item.toLowerCase())))
  )

  return {
    source: 'coach_builder',
    createdAt: new Date().toISOString(),
    templateId: normalizeOptionalText(payload.templateId),
    workouts,
    calendar: workouts.map(workout => {
      const workoutDuration = calculateEstimatedWorkoutDuration({
        workout,
        cardio: workout.cardioProtocol,
        optPhase: payload.nasmOptPhase,
      }).totalDurationMins

      return {
        day: workout.day,
        focus: workout.focus,
        scheduledDate: workout.scheduledDate,
        durationMins: workoutDuration || payload.estimatedDurationMins,
        exerciseCount: workout.exercises.length,
      }
    }),
    librarySummary: {
      exerciseCount: uniqueExercises.length,
      equipmentCount: equipmentLibrary.filter(item => equipmentNames.has(item.name.trim().toLowerCase())).length,
    },
  }
}

export function buildPlanName(payload: Pick<CoachProgramPayload, 'name' | 'phaseName'>) {
  const explicitName = normalizeText(payload.name)
  if (explicitName) return explicitName
  return `${normalizeText(payload.phaseName) || 'Custom'} Program`
}