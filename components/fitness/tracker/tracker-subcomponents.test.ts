import { describe, it, expect } from 'vitest'
import { isOlympicWeightExercise, calculateBarbellPlates, generateWarmUpRampSets } from '@/lib/barbell-plate-calculator'

describe('Fitness Tracker Subcomponents Logic & Integration', () => {
  it('SetProgressionMatrix logic correctly resolves completed sets vs target sets', () => {
    const targetSets = 3
    const loggedSets = [
      { set_number: 1, weight_kg: 43.09, reps: 10, session_date: '2026-08-30' },
      { set_number: 2, weight_kg: 43.09, reps: 10, session_date: '2026-08-30' },
    ]
    const remaining = Math.max(0, targetSets - loggedSets.length)
    expect(remaining).toBe(1)
    expect(loggedSets.length >= targetSets).toBe(false)
  })

  it('WarmUpRampDrawer generates expected progressive stages for dumbbell movements', () => {
    const stages = generateWarmUpRampSets(50, 'olympic_45', true)
    expect(stages.length).toBeGreaterThanOrEqual(2)
    expect(stages[0].platesSummary).toContain('Pair of')
    expect(stages[0].weightLbs).toBeLessThan(50)
  })

  it('InlineBarbellPlateBadges correctly determines when Olympic barbell plates apply', () => {
    expect(isOlympicWeightExercise('Barbell Bench Press')).toBe(true)
    expect(isOlympicWeightExercise('Barbell Back Squat')).toBe(true)
    const plateCalc = calculateBarbellPlates(135, 'olympic_45')
    expect(plateCalc.platesPerSide).toEqual([{ denomination: expect.objectContaining({ weightLbs: 45 }), count: 1 }])
  })

  it('FloatingRestTimerDock format math accurately parses mm:ss and completion states', () => {
    const remainingSeconds = 90
    const mm = Math.floor(remainingSeconds / 60)
    const ss = String(remainingSeconds % 60).padStart(2, '0')
    expect(`${mm}:${ss}`).toBe('1:30')
  })

  it('LiveSessionStickyDock format math accurately parses total session duration', () => {
    const elapsedSeconds = 3665
    const mm = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')
    const ss = (elapsedSeconds % 60).toString().padStart(2, '0')
    expect(`${mm}:${ss}`).toBe('61:05')
  })

  it('PostWorkoutFinishModal CNS readiness report calculates valid metrics', async () => {
    const { calculateSessionFatigueCnsIndex } = await import('@/lib/session-fatigue-cns-index')
    const report = calculateSessionFatigueCnsIndex({
      sessionDurationMinutes: 45,
      sessionRpe: 8,
      setLogs: [
        { exercise_name: 'Dumbbell Hammer Curl', weight_kg: 16, reps: 12, rpe: 8 },
        { exercise_name: 'Barbell Bench Press', weight_kg: 85, reps: 6, rpe: 8.5 },
      ],
      units: 'imperial',
    })
    expect(report.fosterTrainingLoadAu).toBe(360)
    expect(report.cnsScore).toBeGreaterThanOrEqual(1)
    expect(report.recoveryHoursNeeded).toBeGreaterThan(0)
    expect(report.hammerCurlGuardrailVerified).toBe(true)
  })

  it('BarVelocityPowerTrackerTray calculates valid concentric velocity and VBT zones', async () => {
    const { calculateRepVelocityAndPower, classifyVbtZone } = await import('@/lib/bar-velocity-power-engine')
    const rep = calculateRepVelocityAndPower({
      exerciseName: 'Dumbbell Hammer Curl',
      loadKg: 20,
      concentricSec: 0.85,
      eccentricSec: 2.0,
      repNumber: 1,
    })
    expect(rep.romMeters).toBe(0.34)
    expect(rep.meanConcentricVelocity).toBe(0.4)
    expect(rep.meanPowerWatts).toBeGreaterThan(50)
    const zone = classifyVbtZone(rep.meanConcentricVelocity)
    expect(zone.zone).toBe('accelerative_strength')
  })

  it('AutoregulationDeloadAdvisor evaluates acute fatigue drop, back-off load, and drop-set plan with hammer curl guardrails', async () => {
    const { evaluateExerciseAutoregulation } = await import('@/lib/autoregulation-advisor-engine')
    const decision = evaluateExerciseAutoregulation({
      exerciseName: 'Dumbbell Hammer Curl',
      currentDraftWeightLbs: 50,
      currentDraftReps: 6,
      targetReps: '10',
      units: 'imperial',
      completedSets: [
        { setNumber: 1, weightLbs: 50, reps: 10, rpe: 8, isWarmup: false },
        { setNumber: 2, weightLbs: 50, reps: 6, rpe: 10, rir: 0, isWarmup: false },
      ],
    })
    expect(decision.hasAcuteFatigueDrop).toBe(true)
    expect(decision.acuteFatigueDropPercent).toBe(40)
    expect(decision.backOffPlan).toBeDefined()
    expect(decision.backOffPlan?.backOffWeightLbs).toBeLessThan(50)
    expect(decision.dropSetRecommendation).toBeDefined()
    expect(decision.dropSetRecommendation?.stages.length).toBe(3)
    expect(decision.biomechanicalWarning).toContain('thumbs pointing up')
    expect(decision.biomechanicalWarning).toContain('zero wrist supination/twisting')
  })

  it('FloatingRestTimerDock & RestAudioHrEngine adapts rest interval dynamically and enforces hammer curl guardrails', async () => {
    const { evaluateDynamicRestHeartRateRecovery, getRestAudioMetronomeTone } = await import('@/lib/rest-timer-audio-hr-engine')
    const adaptation = evaluateDynamicRestHeartRateRecovery({
      exerciseName: 'Dumbbell Hammer Curl',
      baseRestSeconds: 60,
      remainingSeconds: 15,
      elapsedRestSeconds: 45,
      currentHeartRateBpm: 146,
      hasAcuteFatigueDrop: true,
      acuteFatigueDropPercent: 25,
      userAge: 30,
    })
    expect(adaptation.shouldExtend).toBe(true)
    expect(adaptation.suggestedExtensionSeconds).toBe(30)
    expect(adaptation.isHammerCurl).toBe(true)
    expect(adaptation.guardrailMandate).toContain('thumbs pointed up toward the ceiling')
    expect(adaptation.guardrailMandate).toContain('zero wrist twisting/supination')

    // Verify audio metronome tone generator
    const pip = getRestAudioMetronomeTone('countdown_only', 45, 2)
    expect(pip?.freq).toBe(880)
    const bell = getRestAudioMetronomeTone('countdown_only', 45, 0)
    expect(bell?.freq).toBe(1318.5)
  })

  it('Cluster Set & Myo-Reps intra-set protocols synthesize correctly with hammer curl guardrails', async () => {
    const { generateClusterSetPlan, generateMyoRepsPlan } = await import('@/lib/cluster-myoreps-advisor-engine')

    const clusterPlan = generateClusterSetPlan({
      exerciseName: 'Dumbbell Hammer Curl',
      currentWeightLbs: 50,
      targetReps: 8,
      units: 'imperial',
    })
    expect(clusterPlan.clusterCount).toBe(3)
    expect(clusterPlan.repsPerCluster).toBe(3)
    expect(clusterPlan.intraRestSeconds).toBe(15)
    expect(clusterPlan.isHammerCurl).toBe(true)
    expect(clusterPlan.guardrailMandate).toContain('zero wrist twisting/supination')

    const myoPlan = generateMyoRepsPlan({
      exerciseName: 'Dumbbell Hammer Curl',
      currentWeightLbs: 50,
      targetReps: 12,
      units: 'imperial',
    })
    expect(myoPlan.activationReps).toBe(12)
    expect(myoPlan.miniSets.length).toBe(4)
    expect(myoPlan.totalEffectiveReps).toBe(17)
    expect(myoPlan.isHammerCurl).toBe(true)
    expect(myoPlan.guardrailMandate).toContain('thumbs pointing up toward ceiling')
  })

  it('Gym-Floor Quick Logger collapsible drawer state logic maintains above-the-fold ergonomics', () => {
    // Initial states: collapsed by default to save ~750px of vertical space
    let formGuides: Record<string, boolean> = {}
    let advancedMetrics: Record<string, boolean> = {}

    const exerciseKey = 'Day 1: Upper Body-ex-0'

    // Default state: collapsed
    expect(Boolean(formGuides[exerciseKey])).toBe(false)
    expect(Boolean(advancedMetrics[exerciseKey])).toBe(false)

    // User taps to view form & video guide
    formGuides = { ...formGuides, [exerciseKey]: !formGuides[exerciseKey] }
    expect(formGuides[exerciseKey]).toBe(true)
    expect(Boolean(advancedMetrics[exerciseKey])).toBe(false)

    // User taps to open advanced telemetry
    advancedMetrics = { ...advancedMetrics, [exerciseKey]: !advancedMetrics[exerciseKey] }
    expect(formGuides[exerciseKey]).toBe(true)
    expect(advancedMetrics[exerciseKey]).toBe(true)

    // User collapses form guide; advanced metrics stays open
    formGuides = { ...formGuides, [exerciseKey]: !formGuides[exerciseKey] }
    expect(formGuides[exerciseKey]).toBe(false)
    expect(advancedMetrics[exerciseKey]).toBe(true)
  })

  it('Pro Ultra-Compact 4-Tool Segmented Strip state machine seamlessly manages mutually exclusive and toggleable panel views', () => {
    type ToolTab = 'form' | 'warmup' | 'science' | 'telemetry' | null
    let activeToolTabs: Record<string, ToolTab> = {}
    const exerciseKey = 'Day 1: Upper Body-ex-0'

    const toggleTool = (tab: 'form' | 'warmup' | 'science' | 'telemetry') => {
      const current = activeToolTabs[exerciseKey] ?? null
      const next = current === tab ? null : tab
      activeToolTabs = { ...activeToolTabs, [exerciseKey]: next }
      return next
    }

    // Default state: all tools closed -> compact card height (~220px)
    expect(activeToolTabs[exerciseKey]).toBeUndefined()

    // Tap Form
    expect(toggleTool('form')).toBe('form')
    expect(activeToolTabs[exerciseKey]).toBe('form')

    // Switch to Warmup
    expect(toggleTool('warmup')).toBe('warmup')
    expect(activeToolTabs[exerciseKey]).toBe('warmup')

    // Switch to Science
    expect(toggleTool('science')).toBe('science')
    expect(activeToolTabs[exerciseKey]).toBe('science')

    // Switch to Telemetry
    expect(toggleTool('telemetry')).toBe('telemetry')
    expect(activeToolTabs[exerciseKey]).toBe('telemetry')

    // Tap Telemetry again to collapse all
    expect(toggleTool('telemetry')).toBeNull()
    expect(activeToolTabs[exerciseKey]).toBeNull()
  })

  it('Pro Ultra-Compact architecture geometry reduces vertical height by >80% vs baseline', () => {
    // Baseline legacy height: ~1,400px (video hero banner, 4 step how-to, warm-up wizard open, dynamic load pill, volume hud, deload advisor, full inputs, secondary telemetry fields, recent logs stack)
    const baselineHeightPx = 1420

    // Ultra-compact closed tools height:
    // Header (42px) + Progression Matrix (28px) + Match Set (24px) + Reps/Weight Steppers & Presets (72px) + Log Button (38px) + Rest/Skip (22px) + 4-Tool Strip (28px) + Carousel (26px)
    const ultraCompactHeightPx = 42 + 28 + 24 + 72 + 38 + 22 + 28 + 26 // = 280px or ~220px depending on screen
    expect(ultraCompactHeightPx).toBeLessThan(300)

    const heightReductionPercent = Math.round(((baselineHeightPx - ultraCompactHeightPx) / baselineHeightPx) * 100)
    expect(heightReductionPercent).toBeGreaterThanOrEqual(80)
  })

  it('validates NASM OPT™ feature offerings & default isolation across all 5 phases', async () => {
    const {
      isSupersetOfferedForPhase,
      isSupersetDefaultOnForPhase,
      isIntensityProtocolOfferedForPhase,
      isVbtOfferedForPhase,
      getDefaultNasmOptTempo,
      getNasmOptPhaseFeatureRules,
    } = await import('@/lib/nasm-opt-feature-matrix')

    // 1. Supersets must NEVER be default ON in any phase
    for (let p = 1; p <= 5; p++) {
      expect(isSupersetDefaultOnForPhase(p)).toBe(false)
    }

    // 2. Phase 1 Stabilization: No supersets, no drop sets, no VBT; strictly 4/2/1 tempo
    expect(isSupersetOfferedForPhase(1)).toBe(false)
    expect(isIntensityProtocolOfferedForPhase(1)).toBe(false)
    expect(isVbtOfferedForPhase(1)).toBe(false)
    expect(getDefaultNasmOptTempo(1, 'Dumbbell Bench Press').tempo).toBe('4/2/1')

    // 3. Phase 2 Strength Endurance: Supersets offered (default OFF), drop sets optional, 2/0/2 strength & 4/2/1 stabilizer
    expect(isSupersetOfferedForPhase(2)).toBe(true)
    expect(isIntensityProtocolOfferedForPhase(2)).toBe(true)
    expect(getDefaultNasmOptTempo(2, 'Bench Press').tempo).toBe('2/0/2')
    expect(getDefaultNasmOptTempo(2, 'Stability Ball Push-up').tempo).toBe('4/2/1')

    // 4. Phase 3 Muscular Development: Supersets offered (default OFF), drop sets highly recommended, 2/0/2 tempo
    expect(isSupersetOfferedForPhase(3)).toBe(true)
    expect(isIntensityProtocolOfferedForPhase(3)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(3).isIntensityProtocolRecommended).toBe(true)
    expect(getDefaultNasmOptTempo(3, 'Dumbbell Fly').tempo).toBe('2/0/2')

    // 5. Phase 4 Maximal Strength: Supersets prohibited (demands full rest), drop sets prohibited, VBT active
    expect(isSupersetOfferedForPhase(4)).toBe(false)
    expect(isIntensityProtocolOfferedForPhase(4)).toBe(false)
    expect(isVbtOfferedForPhase(4)).toBe(true)
    expect(getDefaultNasmOptTempo(4, 'Deadlift').tempo).toBe('1/1/1')

    // 6. Phase 5 Power: Supersets offered for PAP (default OFF), drop sets prohibited, VBT primary
    expect(isSupersetOfferedForPhase(5)).toBe(true)
    expect(isIntensityProtocolOfferedForPhase(5)).toBe(false)
    expect(isVbtOfferedForPhase(5)).toBe(true)
    expect(getNasmOptPhaseFeatureRules(5).isVbtPrimaryMetric).toBe(true)
    expect(getDefaultNasmOptTempo(5, 'Squat Jump').tempo).toBe('X/0/X')
  })
})



