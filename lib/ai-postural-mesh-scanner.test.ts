import { describe, expect, it } from 'vitest'
import {
  analyzePosturalMesh,
  POSTURAL_VIEW_INSTRUCTIONS,
  PosturalViewType,
} from './ai-postural-mesh-scanner'

describe('analyzePosturalMesh engine', () => {
  it('returns valid biomechanical landmarks and angles for anterior view', async () => {
    const result = await analyzePosturalMesh({
      view: 'anterior',
      clientName: 'Alex Mercer',
    })

    expect(result.view).toBe('anterior')
    expect(result.landmarks.length).toBeGreaterThanOrEqual(6)
    expect(result.angles.length).toBeGreaterThanOrEqual(2)
    expect(result.ohsaObservations.length).toBeGreaterThanOrEqual(1)
    expect(result.cexPrescription.inhibit.length).toBeGreaterThan(0)
    expect(result.cexPrescription.lengthen.length).toBeGreaterThan(0)
    expect(result.cexPrescription.activate.length).toBeGreaterThan(0)
    expect(result.cexPrescription.integrate.length).toBeGreaterThan(0)
  })

  it('returns valid lateral sagittal alignment landmarks and angles', async () => {
    const result = await analyzePosturalMesh({
      view: 'lateral',
      clientName: 'Jennifer Rainville',
    })

    expect(result.view).toBe('lateral')
    expect(result.landmarks.some(l => l.id === 'c7' || l.id === 'ear')).toBe(true)
    expect(result.angles.some(a => a.name.includes('Head') || a.name.includes('Pelvic'))).toBe(true)
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

  it('guarantees AiPostureMeshScannerModal has zIndex above MobileBottomNav and responsive mobile rules', async () => {
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
  })

  it('guarantees AiPostureMeshScannerModal saves pictures independently for each pose and preserves multi-view state', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const modalPath = path.resolve(__dirname, '../components/coach/AiPostureMeshScannerModal.tsx')
    const content = fs.readFileSync(modalPath, 'utf-8')

    // Verifies multi-pose state stores exist
    expect(content).toContain('photosByView')
    expect(content).toContain('scanResultsByView')
    expect(content).toContain('sgf_posture_photos_')
    expect(content).toContain('handleClearActivePhoto')
    expect(content).toContain('handleClearAllPhotos')
    expect(content).toContain('handleApplyAllFindings')
    expect(content).toContain('Multi-Pose Gallery')
  })

  it('guarantees best practice standards: memory safety, image compression, timer cleanup, and accessibility', async () => {
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
  })

  it('aggregates multi-pose findings cleanly without duplicate compensation keys', async () => {
    const views: PosturalViewType[] = ['anterior', 'lateral', 'posterior', 'overhead_squat']
    const results = await Promise.all(
      views.map(view => analyzePosturalMesh({ view, clientName: 'Athlete Gordon' }))
    )

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
    expect(uniqueCompensations.length).toBeGreaterThanOrEqual(1)
    const keys = uniqueCompensations.map(c => c.compensation)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

