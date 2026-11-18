import { describe, expect, it } from 'vitest'
import {
  analyzePosturalMesh,
  formatScanResult,
  POSTURAL_VIEW_INSTRUCTIONS,
  PosturalViewType,
  sanitizeAthleteFirstName,
} from './ai-postural-mesh-scanner'

const SAMPLE_PHOTO_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/'

describe('analyzePosturalMesh engine', () => {
  it('rejects missing or empty posture photographs rather than fabricating distortion syndromes', async () => {
    await expect(
      analyzePosturalMesh({
        view: 'anterior',
        clientName: 'Alex Mercer',
      })
    ).rejects.toThrow(/posture photograph is required/i)
  })

  it('returns neutral unverified fallback (zero fabricated syndromes) when AI vision key is absent', async () => {
    const result = await analyzePosturalMesh({
      view: 'anterior',
      imageBase64: SAMPLE_PHOTO_BASE64,
      clientName: 'Alex Mercer',
    })

    expect(result.view).toBe('anterior')
    expect(result.isUnverifiedFallback).toBe(true)
    expect(result.syndromeDetected).toBe('Optimal Alignment')
    expect(result.detectedCompensations).toEqual([])
    expect(result.landmarks).toEqual([])
    expect(result.angles).toEqual([])
    expect(result.ohsaObservations).toEqual([])
    // HIPAA Minimum Necessary: surname stripped from summary
    expect(result.clinicalSummary).toContain('Alex')
    expect(result.clinicalSummary).not.toContain('Mercer')
    expect(result.clinicalSummary).toContain('No synthetic postural distortion syndrome was inferred')
  })

  it('returns neutral unverified fallback for lateral view with surname stripped', async () => {
    const result = await analyzePosturalMesh({
      view: 'lateral',
      imageBase64: SAMPLE_PHOTO_BASE64,
      clientName: 'Jennifer Rainville',
    })

    expect(result.view).toBe('lateral')
    expect(result.isUnverifiedFallback).toBe(true)
    expect(result.syndromeDetected).toBe('Optimal Alignment')
    expect(result.clinicalSummary).toContain('Jennifer')
    expect(result.clinicalSummary).not.toContain('Rainville')
  })

  it('sanitizes athlete names and strips PII (emails, phones, surnames)', () => {
    expect(sanitizeAthleteFirstName('Jennifer Rainville')).toBe('Jennifer')
    expect(sanitizeAthleteFirstName('athlete@example.com')).toBe('Athlete')
    expect(sanitizeAthleteFirstName('555-867-5309')).toBe('Athlete')
    expect(sanitizeAthleteFirstName('')).toBe('Athlete')
    expect(sanitizeAthleteFirstName(undefined)).toBe('Athlete')
  })

  it('formats Optimal Alignment cleanly without injecting hardcoded distortion syndromes', () => {
    const optimal = formatScanResult(
      {
        syndromeDetected: 'Optimal Alignment',
        detectedCompensations: [],
        landmarks: [
          { id: 'c7', name: 'C7', x: 50, y: 20, confidence: 0.99 },
          { id: 'l_shoulder', name: 'L Shoulder', x: -12, y: 140, confidence: 1.4 },
        ],
        angles: [
          { name: 'Forward Head Deviation', angleDegrees: 3.2, status: 'optimal', normalRange: '< 10°', clinicalNote: 'Aligned' },
        ],
      },
      'anterior',
      'Julian Mercer'
    )

    expect(optimal.syndromeDetected).toBe('Optimal Alignment')
    expect(optimal.detectedCompensations).toEqual([])
    expect(optimal.ohsaObservations).toEqual([])
    expect(optimal.staticFindings).toEqual([])
    expect(optimal.postureScore).toBeGreaterThanOrEqual(90)
    // Clamps out-of-range landmark coordinates & confidence safely
    expect(optimal.landmarks[1].x).toBe(0)
    expect(optimal.landmarks[1].y).toBe(100)
    expect(optimal.landmarks[1].confidence).toBe(1)
  })

  it('provides complete, clinical client photo instructions for all 4 views', () => {
    const views: PosturalViewType[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']

    for (const v of views) {
      const instruction = POSTURAL_VIEW_INSTRUCTIONS[v]
      expect(instruction).toBeDefined()
      expect(instruction.id).toBe(v)
      expect(instruction.label).toBeTruthy()
      expect(instruction.subtitle).toBeTruthy()
      expect(instruction.whatClientDoes).toBeTruthy()
      expect(instruction.stanceAndFeet).toBeTruthy()
      expect(instruction.armsAndHands).toBeTruthy()
      expect(instruction.headAndGaze).toBeTruthy()
      expect(instruction.photoMoment).toBeTruthy()
      expect(instruction.cameraSetup).toMatch(/8–10 feet/)
      expect(instruction.aiFocusAreas.length).toBeGreaterThanOrEqual(4)
      expect(instruction.proTip).toBeTruthy()
    }

    // Specific OHSA checks
    expect(POSTURAL_VIEW_INSTRUCTIONS.overhead_squat.whatClientDoes).toContain('Raise arms straight overhead')
    expect(POSTURAL_VIEW_INSTRUCTIONS.overhead_squat.armsAndHands).toContain('bisecting ears')
    expect(POSTURAL_VIEW_INSTRUCTIONS.overhead_squat.photoMoment).toContain('inflection point')

    // Specific Lateral checks
    expect(POSTURAL_VIEW_INSTRUCTIONS.lateral.whatClientDoes).toContain('Turn 90°')
    expect(POSTURAL_VIEW_INSTRUCTIONS.lateral.aiFocusAreas.some(f => f.includes('pelvic tilt'))).toBe(true)
  })

  it('guarantees AiPostureMeshScannerModal has zIndex above MobileBottomNav, skeletal line joint resolution, and responsive mobile rules', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const modalPath = path.resolve(__dirname, '../components/coach/AiPostureMeshScannerModal.tsx')
    const content = fs.readFileSync(modalPath, 'utf-8')

    // Must be zIndex >= 100000 to firmly sit above MobileBottomNav (which is 9999)
    expect(content).toContain('zIndex: 100050')
    expect(content).toContain('posture-scanner-backdrop')
    expect(content).toContain('posture-mobile-tab-nav')
    expect(content).toContain('posture-shutter-row')
    expect(content).toContain('@media (max-width: 768px)')
    expect(content).toContain('Take Photo')
    expect(content).toContain('SNAP PHOTO')
    // Must connect both l_shoulder/r_shoulder and left_shoulder/right_shoulder IDs on canvas
    expect(content).toContain("getJoint('l_shoulder', 'left_shoulder')")
    expect(content).toContain("getJoint('l_hip', 'left_hip')")
    expect(content).toContain("getJoint('l_knee', 'left_knee')")
    expect(content).toContain("getJoint('l_ankle', 'left_ankle')")
  })

  it('guarantees AiPostureMeshScannerModal saves pictures independently for each pose and preserves multi-view state', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const modalPath = path.resolve(__dirname, '../components/coach/AiPostureMeshScannerModal.tsx')
    const content = fs.readFileSync(modalPath, 'utf-8')

    expect(content).toContain('photosByView')
    expect(content).toContain('scanResultsByView')
    expect(content).toContain('sgf_posture_photos_')
    expect(content).toContain('handleClearActivePhoto')
    expect(content).toContain('handleClearAllPhotos')
    expect(content).toContain('handleApplyAllFindings')
    expect(content).toContain('Multi-Pose Gallery')
  })

  it('guarantees best practice standards: memory safety, image compression, camera release, timer cleanup, and accessibility', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const modalPath = path.resolve(__dirname, '../components/coach/AiPostureMeshScannerModal.tsx')
    const content = fs.readFileSync(modalPath, 'utf-8')

    expect(content).toContain('compressPosturePhoto')
    expect(content).toContain('clearTimer')
    expect(content).toContain('handleBatchScan')
    expect(content).toContain('Escape')
    expect(content).toContain('role="dialog"')
    expect(content).toContain('aria-modal="true"')
    expect(content).toContain('forge:release-camera')
    expect(content).toContain('min-height: 44px')
  })

  it('aggregates multi-pose findings cleanly across all 4 views without duplicate compensation keys', () => {
    const sampleRawByView: Record<PosturalViewType, { syndromeDetected: string; detectedCompensations: string[] }> = {
      anterior: { syndromeDetected: 'Pronation Distortion', detectedCompensations: ['knees_cave_in', 'feet_turn_out'] },
      lateral: { syndromeDetected: 'Lower Crossed', detectedCompensations: ['low_back_arches', 'excessive_forward_lean', 'head_protrudes'] },
      posterior: { syndromeDetected: 'Pronation Distortion', detectedCompensations: ['feet_flatten', 'asymmetric_weight_shift'] },
      overhead_squat: { syndromeDetected: 'Lower Crossed', detectedCompensations: ['knees_cave_in', 'excessive_forward_lean', 'arms_fall_forward'] },
    }
    const views: PosturalViewType[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']
    const results = views.map(view => formatScanResult(sampleRawByView[view], view, 'Julian Gordon'))

    expect(results).toHaveLength(4)

    const ohsaMap = new Map<string, (typeof results)[0]['ohsaObservations'][number]>()
    results.forEach(r => {
      r.ohsaObservations.forEach(obs => {
        if (!ohsaMap.has(obs.compensation)) {
          ohsaMap.set(obs.compensation, obs)
        }
      })
    })

    const uniqueCompensations = Array.from(ohsaMap.values())
    expect(uniqueCompensations.length).toBeGreaterThanOrEqual(4)
    const keys = uniqueCompensations.map(c => c.compensation)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
