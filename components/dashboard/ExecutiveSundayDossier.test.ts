import { describe, it, expect } from 'vitest'
import {
  computeDossierDocRefId,
  computeDossierRecoveryState,
  computeAcwrZoneState,
  buildCoachDebriefScript,
  estimateDebriefAudioDuration,
} from './ExecutiveSundayDossier'
import { DossierMetrics } from '@/lib/sunday-dossier-engine'

describe('ExecutiveSundayDossier Swiss Private Wealth Standard Engine', () => {
  const mockDossier: DossierMetrics = {
    totalTonnageLbs: 64250,
    totalWorkingSets: 28,
    completedSessions: 4,
    targetSessions: 4,
    adherencePct: 100,
    totalCardioMins: 140,
    zone2CardioMins: 120,
    avgSessionRpe: 7.8,
    topPrsThisWeek: [
      {
        exercise_name: 'Barbell Romanian Deadlift',
        weight_lbs: 315,
        reps: 5,
        achieved_at: '2026-09-06T10:00:00Z',
      },
    ],
    recoveryIndexScore: 88,
    executiveSummary: [
      'Neuromuscular adaptation across posterior chain exceeds benchmark by 4.2%.',
      'Parasympathetic HRV tone remained stable despite highest training volume this block.',
    ],
    nextWeekFocus: 'Advance to Phase 2: Strength Endurance with superset agonist/antagonist pairings.',
    acwrRatio: 1.07,
    acwrZone: 'Sweet Spot',
    acwrStatusMessage: 'Optimal Overload Corridor: Neuromuscular adaptation progressing without soft-tissue compromise.',
    kineticDistribution: {
      pushSets: 8,
      pullSets: 6,
      squatSets: 6,
      hingeSets: 5,
      carryCoreSets: 3,
      totalSets: 28,
      pushPct: 29,
      pullPct: 21,
      squatPct: 21,
      hingePct: 18,
      carryCorePct: 11,
    },
    soapRecord: {
      subjective: 'Athlete reports high energy levels, restorative sleep latency, and zero musculoskeletal friction.',
      objective: 'Completed 4 microcycle training sessions. Mechanical tonnage totaled 64,250 lbs across 28 working sets. ACWR steady at 1.07.',
      assessment: 'Neuromuscular adaptation exceeds baseline. Autonomic recovery index registers at 88/100, signaling optimal supercompensation.',
      plan: 'Advance to Phase 2: Strength Endurance with superset agonist/antagonist pairings. Maintain 120 mins of Zone 2 aerobic recovery.',
    },
    authSignature: 'GAA-SIG-E3A9-7B14',
    authTimestamp: '2026-09-06T20:00:00.000Z',
    auditorCredential: 'SCOTT GORDON, NASM MASTER TRAINER · GAA SOVEREIGN DESK',
  }

  describe('computeDossierDocRefId', () => {
    it('generates pristine governance tracking IDs with athlete initials and date stamp', () => {
      const id = computeDossierDocRefId('Scott Gordon', 'Sep 8, 2026')
      expect(id).toBe('FORGE-PROGRESS-SG-2026')

      const id2 = computeDossierDocRefId('Marcus Aurelius Antoninus', 'Dec 31, 2026')
      expect(id2).toBe('FORGE-PROGRESS-MAA-2026')
    })

    it('gracefully handles single names or missing characters', () => {
      const id = computeDossierDocRefId('Vanguard', '2026')
      expect(id).toBe('FORGE-PROGRESS-V-2026')
    })
  })

  describe('computeDossierRecoveryState', () => {
    it('returns Optimal Supercompensation for scores >= 80', () => {
      const state88 = computeDossierRecoveryState(88)
      expect(state88.label).toBe('Ready to train')
      expect(state88.color).toBe('#34D399')

      const state80 = computeDossierRecoveryState(80)
      expect(state80.label).toBe('Ready to train')
    })

    it('returns Allostatic Equilibrium for scores between 65 and 79', () => {
      const state72 = computeDossierRecoveryState(72)
      expect(state72.label).toBe('Steady recovery')
      expect(state72.color).toBe('#FBBF24')

      const state65 = computeDossierRecoveryState(65)
      expect(state65.label).toBe('Steady recovery')
    })

    it('returns Restorative Deload Advised for scores below 65', () => {
      const state64 = computeDossierRecoveryState(64)
      expect(state64.label).toBe('More recovery may help')
      expect(state64.color).toBe('#F87171')

      const state45 = computeDossierRecoveryState(45)
      expect(state45.label).toBe('More recovery may help')
    })
  })

  describe('buildCoachDebriefScript & estimateDebriefAudioDuration', () => {
    it('generates an authoritative, complete neural voice debrief script', () => {
      const script = buildCoachDebriefScript({
        athleteName: 'David Vance',
        weekEndingDate: 'Sep 8, 2026',
        optPhase: 'Phase 1: Stabilization Endurance',
        dossier: mockDossier,
      })

      expect(script).toContain('Hi David Vance.')
      expect(script).toContain('weekly training update')
      expect(script).toContain('Phase 1: Stabilization Endurance')
      expect(script).toContain('64,250 pounds across 28 working sets')
      expect(script).toContain('average effort rating was 7.8 out of 10')
      expect(script).toContain('120 minutes of steady, moderate-intensity cardio')
      expect(script).toContain('recovery score was 88 out of 100')
      expect(script).toContain('100 percent of your planned sessions')
      expect(script).toContain('Advance to Phase 2: Strength Endurance')
      expect(script).toContain('Keep listening to your body and adjust as needed.')
    })

    it('calculates duration proportionate to cadence with a safety floor', () => {
      const shortScript = 'Hello athlete. Short update.'
      expect(estimateDebriefAudioDuration(shortScript)).toBe(28) // Minimum floor

      const fullScript = buildCoachDebriefScript({
        athleteName: 'David Vance',
        weekEndingDate: 'Sep 8, 2026',
        optPhase: 'Phase 1: Stabilization Endurance',
        dossier: mockDossier,
      })

      const duration = estimateDebriefAudioDuration(fullScript)
      expect(duration).toBeGreaterThanOrEqual(30)
      expect(duration).toBeLessThanOrEqual(60)
    })
  })

  describe('computeAcwrZoneState', () => {
    it('returns Sweet Spot styling for optimal overload (0.80–1.30)', () => {
      const state = computeAcwrZoneState('Sweet Spot')
      expect(state.label).toContain('Within your usual range')
      expect(state.color).toBe('#34D399')
    })

    it('returns Overreaching styling for acute spikes (1.31–1.49)', () => {
      const state = computeAcwrZoneState('Overreaching')
      expect(state.label).toContain('Higher than usual')
      expect(state.color).toBe('#FBBF24')
    })

    it('returns Danger Zone styling for extreme spikes (>= 1.50)', () => {
      const state = computeAcwrZoneState('Danger Zone')
      expect(state.label).toContain('Much higher than usual')
      expect(state.color).toBe('#F87171')
    })

    it('defaults to Under-training styling for sub-optimal workload (<0.80)', () => {
      const state = computeAcwrZoneState('Under-training')
      expect(state.label).toContain('Lower than usual')
      expect(state.color).toBe('#60A5FA')
    })

    it('returns No Data styling when insufficient volume exists', () => {
      const state = computeAcwrZoneState('No Data')
      expect(state.label).toContain('Not enough training data yet')
      expect(state.color).toBe('#94A3B8')
    })
  })

  describe('Boardroom Certification & Credentials', () => {
    it('verifies Coach Scott Gordon master credential and disciplines in dossier footer', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const dossierSource = fs.readFileSync(
        path.join(process.cwd(), 'components/dashboard/ExecutiveSundayDossier.tsx'),
        'utf8'
      )

      expect(dossierSource).toContain('SCOTT GORDON, NASM MASTER TRAINER')
      expect(dossierSource).toContain('Founder &amp; Performance Director · NASM-CPT® · CES® · PES® · CNC™ · CSNC')
      expect(dossierSource).toContain('Report reference:')
    })

    it('verifies readable progress notes and typography in source', async () => {
      const fs = await import('fs')
      const path = await import('path')
      const dossierSource = fs.readFileSync(
        path.join(process.cwd(), 'components/dashboard/ExecutiveSundayDossier.tsx'),
        'utf8'
      )

      expect(dossierSource).toContain('font-serif')
      expect(dossierSource).toContain('Raleway')
      expect(dossierSource).toContain('font-telemetry font-mono')
      expect(dossierSource).not.toContain('Bebas Neue')

      expect(dossierSource).toContain('Training notes')
      expect(dossierSource).toContain('How you felt')
      expect(dossierSource).toContain('Training details')
      expect(dossierSource).toContain('Next steps')

      // Kinetic distribution distribution planes
      expect(dossierSource).toContain('Movement pattern balance')
      expect(dossierSource).toContain('Push')
      expect(dossierSource).toContain('Pull')
      expect(dossierSource).toContain('Squat')
      expect(dossierSource).toContain('Hinge')
      expect(dossierSource).toContain('Carry & Core')

      // Dual print engine support
      expect(dossierSource).toContain('print-theme-ivory')
      expect(dossierSource).toContain('window.print()')
    })
  })
})
