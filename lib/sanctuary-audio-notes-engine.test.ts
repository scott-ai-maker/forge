import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_SANCTUARY_AUDIO_NOTES,
  generateWaveformPoints,
  getStoredSanctuaryAudioNotes,
  saveSanctuaryAudioNote,
  markAudioNoteListened,
  deleteSanctuaryAudioNote,
  getRelevantAudioNoteForRest,
  createCoachAudioNote,
  playSanctuaryAcousticIntroChime,
} from './sanctuary-audio-notes-engine'

describe('Sanctuary Audio Notes Engine', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => {
        store[key] = val
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
    })
    vi.restoreAllMocks()
  })

  describe('Default Seed Library', () => {
    it('contains institutional notes from Coach Gordon with Forge Athletic branding and ElevenLabs cloned voice', () => {
      expect(DEFAULT_SANCTUARY_AUDIO_NOTES.length).toBeGreaterThanOrEqual(5)
      for (const note of DEFAULT_SANCTUARY_AUDIO_NOTES) {
        expect(note.coachName).toBe('Coach Gordon')
        expect(note.coachTitle).toContain('Forge Athletic')
        expect(note.coachInitials).toBe('SG')
        expect(note.durationSeconds).toBeLessThanOrEqual(60)
        expect(note.waveformPoints.length).toBe(32)
        expect(note.transcript.length).toBeGreaterThan(20)
        expect(note.voiceProvider).toBe('elevenlabs-coach-gordon')
        expect(note.voiceId).toBe('UPezm4CtrvcD6aNXjeU1')
        // Strictly verify brand safety rule
        expect(note.coachTitle).not.toContain('GAA')
        expect(note.coachTitle).not.toContain('Gordon Athletic Advisory')
      }
    })
  })

  describe('generateWaveformPoints', () => {
    it('produces bounded normalized points between 0.12 and 1.0', () => {
      const points = generateWaveformPoints('Barbell Back Squat Brace', 32)
      expect(points.length).toBe(32)
      for (const p of points) {
        expect(p).toBeGreaterThanOrEqual(0.12)
        expect(p).toBeLessThanOrEqual(1.0)
      }
    })

    it('is deterministic for identical seeds', () => {
      const p1 = generateWaveformPoints('Bench Press Retraction')
      const p2 = generateWaveformPoints('Bench Press Retraction')
      expect(p1).toEqual(p2)
    })
  })

  describe('Storage & CRUD Operations', () => {
    it('initializes with default notes if storage is empty', () => {
      const notes = getStoredSanctuaryAudioNotes()
      expect(notes.length).toBe(DEFAULT_SANCTUARY_AUDIO_NOTES.length)
      expect(notes[0].id).toBe(DEFAULT_SANCTUARY_AUDIO_NOTES[0].id)
    })

    it('saves a new note and retrieves it at the beginning', () => {
      const newNote = createCoachAudioNote({
        title: 'Custom RDL Tension Cue',
        transcript: 'Hinge through hips, push back against the wall, feel hamstrings load.',
        category: 'movement_cue',
        durationSeconds: 25,
        exerciseScope: 'Romanian Deadlift',
      })

      const updated = saveSanctuaryAudioNote(newNote)
      expect(updated[0].id).toBe(newNote.id)
      expect(getStoredSanctuaryAudioNotes()[0].title).toBe('Custom RDL Tension Cue')
    })

    it('marks a note as listened with timestamp', () => {
      const targetId = DEFAULT_SANCTUARY_AUDIO_NOTES[0].id
      markAudioNoteListened(targetId)

      const notes = getStoredSanctuaryAudioNotes()
      const listened = notes.find(n => n.id === targetId)
      expect(listened?.isListened).toBe(true)
      expect(listened?.listenedAt).toBeDefined()
    })

    it('deletes an audio note by ID', () => {
      const targetId = DEFAULT_SANCTUARY_AUDIO_NOTES[0].id
      deleteSanctuaryAudioNote(targetId)

      const notes = getStoredSanctuaryAudioNotes()
      expect(notes.find(n => n.id === targetId)).toBeUndefined()
    })
  })

  describe('getRelevantAudioNoteForRest', () => {
    it('matches notes specifically for the active exercise', () => {
      const squatNote = getRelevantAudioNoteForRest({
        exerciseName: 'Heavy Barbell Back Squat',
      })
      expect(squatNote?.exerciseScope).toBe('Barbell Back Squat')
      expect(squatNote?.title).toContain('Squat')
    })

    it('prioritizes unlistened exercise notes over listened ones', () => {
      // Mark squat note as listened
      markAudioNoteListened('sanctuary-note-squat-brace')

      // Add a second unlistened squat note
      const freshSquatNote = createCoachAudioNote({
        title: 'Squat Depth & Adductor Squeeze',
        transcript: 'Push knees outward along toes, hit parallel, bounce out.',
        category: 'movement_cue',
        durationSeconds: 30,
        exerciseScope: 'Barbell Back Squat',
      })
      saveSanctuaryAudioNote(freshSquatNote)

      const selected = getRelevantAudioNoteForRest({
        exerciseName: 'Barbell Back Squat',
        unplayedFirst: true,
      })
      expect(selected?.id).toBe(freshSquatNote.id)
    })

    it('falls back to category match when exercise scope does not match', () => {
      const note = getRelevantAudioNoteForRest({
        exerciseName: 'Bicep Curls',
        categoryPreference: 'cns_recovery',
      })
      expect(note?.category).toBe('cns_recovery')
    })
  })

  describe('createCoachAudioNote', () => {
    it('clamps duration between 5 and 60 seconds', () => {
      const noteHigh = createCoachAudioNote({
        title: 'Long Memo',
        transcript: 'Testing',
        category: 'mental_focus',
        durationSeconds: 120, // should clamp to 60
      })
      expect(noteHigh.durationSeconds).toBe(60)

      const noteLow = createCoachAudioNote({
        title: 'Short Memo',
        transcript: 'Testing',
        category: 'mental_focus',
        durationSeconds: 2, // should clamp to 5
      })
      expect(noteLow.durationSeconds).toBe(5)
    })

    it('defaults to ElevenLabs voiceProvider and Coach Gordon voiceId', () => {
      const note = createCoachAudioNote({
        title: 'Form Cue',
        transcript: 'Hinge back',
        category: 'movement_cue',
        durationSeconds: 20,
      })
      expect(note.voiceProvider).toBe('elevenlabs-coach-gordon')
      expect(note.voiceId).toBe('UPezm4CtrvcD6aNXjeU1')
    })
  })

  describe('playSanctuaryAcousticIntroChime', () => {
    it('executes safely without throwing error even in mock environments', () => {
      expect(() => playSanctuaryAcousticIntroChime()).not.toThrow()
    })
  })
})
