import { describe, expect, it } from 'vitest'
import { buildLookup, mapSnapshot, normalizeKey, parseStepInstructions, remapPlanJson, resolveOfficialExercise } from './remap-client-exercises-to-official.mjs'

const officialRdl = {
  id: 'official-1',
  name: 'Dumbbell Romanian Deadlift',
  slug: 'dumbbell-romanian-deadlift',
  description: 'Official instructions',
  coaching_cues: ['Keep a neutral spine'],
  primary_equipment: ['Dumbbells'],
  media_image_url: 'official-image',
  media_video_url: 'official-video',
  open_externally_only: false,
}

const officialSingleLegSquat = {
  id: 'official-2',
  name: 'Single Leg Squat',
  slug: 'single-leg-squat',
  description: 'Unilateral squat on single leg.',
  coaching_cues: ['Keep knee tracking over second toe'],
  primary_equipment: ['Bodyweight'],
  media_image_url: 'squat-image',
  media_video_url: 'squat-video',
  open_externally_only: false,
}

const officialExtensionPoor = {
  id: 'official-ext-1',
  name: 'Supported Bent Over Dumbbell Extension',
  slug: 'supported-bent-over-dumbbell-extension-001',
  description: 'Old duplicate without media',
  coaching_cues: [],
  primary_equipment: ['Dumbbells'],
  media_image_url: null,
  media_video_url: null,
  open_externally_only: false,
}

const officialExtensionRich = {
  id: 'official-ext-2',
  name: 'Supported Bent Over Dumbbell Extension',
  slug: 'supported-bent-over-dumbbell-extension-002',
  description: 'Rich duplicate with video and cues',
  coaching_cues: ['Keep elbows high and pinned to ribs'],
  primary_equipment: ['Dumbbells'],
  media_image_url: 'ext-img',
  media_video_url: 'https://youtube.com/watch?v=ext',
  open_externally_only: false,
}

describe('remap-client-exercises-to-official', () => {
  it('normalizes equivalent exercise names', () => {
    expect(normalizeKey('Dumbbell Romanian Deadlift')).toBe('dumbbell romanian deadlift')
    expect(normalizeKey('Dumbbell-Romanian Deadlift')).toBe('dumbbell romanian deadlift')
  })

  it('replaces mapped metadata without changing prescriptions', () => {
    const result = remapPlanJson(
      {
        workouts: [{ day: 1, exercises: [{ name: 'Dumbbell-Romanian Deadlift', sets: '3', reps: '8' }] }],
      },
      buildLookup([officialRdl])
    )

    expect(result.changed).toBe(true)
    expect(result.unresolved).toEqual([])
    expect(result.planJson.workouts[0].exercises[0]).toMatchObject({
      libraryExerciseId: 'official-1',
      name: 'Dumbbell Romanian Deadlift',
      sets: '3',
      reps: '8',
      description: 'Official instructions',
    })
  })

  it('resolves clinical and injury aliases cleanly', () => {
    const lookup = buildLookup([officialSingleLegSquat, officialExtensionRich])

    const squatOfficial = resolveOfficialExercise(
      { name: 'Single-Leg Squat to Box / Bench (Dumbbell Counterbalance)' },
      lookup
    )
    expect(squatOfficial?.id).toBe('official-2')
    expect(squatOfficial?.name).toBe('Single Leg Squat')

    const typoOfficial = resolveOfficialExercise(
      { name: 'Dumbbell Bent Over Extention' },
      lookup
    )
    expect(typoOfficial?.name).toBe('Supported Bent Over Dumbbell Extension')

    const floorBridgeOfficial = {
      id: 'official-bridge',
      name: 'Floor Bridge',
      slug: 'floor-bridge',
      description: 'Glute bridge on floor',
    }
    const bridgeLookup = buildLookup([floorBridgeOfficial])
    const remappedBridge = resolveOfficialExercise(
      { name: 'Stability Ball Hamstring Curl', libraryExerciseId: 'old-ball-id' },
      bridgeLookup
    )
    expect(remappedBridge?.name).toBe('Floor Bridge')
    expect(remappedBridge?.id).toBe('official-bridge')
  })

  it('disambiguates duplicate entries by selecting the richer record', () => {
    const lookup = buildLookup([officialExtensionPoor, officialExtensionRich])
    const chosen = lookup.byKey.get(normalizeKey('Supported Bent Over Dumbbell Extension'))
    expect(chosen?.id).toBe('official-ext-2')
    expect(chosen?.media_video_url).toBe('https://youtube.com/watch?v=ext')
  })

  it('does not guess when a name is not in the official library', () => {
    const plan = { workouts: [{ day: 1, exercises: [{ name: 'Unmapped Exercise', sets: '2', reps: '10' }] }] }
    const result = remapPlanJson(plan, buildLookup([officialRdl]))

    expect(result.changed).toBe(false)
    expect(result.planJson).toEqual(plan)
    expect(result.unresolved).toEqual(['Unmapped Exercise'])
  })

  it('parses step instructions and clears coachingCues on snapshots', () => {
    const rawDesc = 'Step 1: Stand with feet shoulder-width apart.\n\nStep 2: Lower into a squat.\n\nStep 3: Explode upward.\n\nStep 4: Land softly.'
    const parsed = parseStepInstructions(rawDesc)
    expect(parsed).toEqual([
      '1. Stand with feet shoulder-width apart.',
      '2. Lower into a squat.',
      '3. Explode upward.',
      '4. Land softly.',
    ])

    const officialSquat = {
      id: 'squat-1',
      name: 'Repeat Squat Jumps',
      description: rawDesc,
      coaching_cues: ['Old clinical cue'],
      primary_equipment: ['Bodyweight'],
      media_image_url: 'img-url',
      media_video_url: 'vid-url',
    }
    const snapshot = mapSnapshot({ name: 'Repeat Squat Jumps' }, buildLookup([officialSquat]), [])
    expect(snapshot.instructions).toEqual(parsed)
    expect(snapshot.coachingCues).toEqual([])
    expect(snapshot.description).toBe(rawDesc)
  })
})

