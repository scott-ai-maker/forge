import { describe, it, expect } from 'vitest'
import {
  computeConsultationGate,
  formatConsultationCountdown,
  CONSULTATION_PLAYBOOK_GATES,
} from './LiveConsultationPlaybookModal'

describe('LiveConsultationPlaybookModal Clinical Diagnostic Protocol Logic', () => {
  describe('computeConsultationGate', () => {
    it('correctly maps session duration to the 5 diagnostic gates', () => {
      // Gate 1: 0 - 8 mins (0 - 479s)
      expect(computeConsultationGate(0)).toBe(1)
      expect(computeConsultationGate(300)).toBe(1) // 5 mins
      expect(computeConsultationGate(479)).toBe(1)

      // Gate 2: 8 - 18 mins (480s - 1079s)
      expect(computeConsultationGate(480)).toBe(2)
      expect(computeConsultationGate(600)).toBe(2) // 10 mins
      expect(computeConsultationGate(1079)).toBe(2)

      // Gate 3: 18 - 30 mins (1080s - 1799s)
      expect(computeConsultationGate(1080)).toBe(3)
      expect(computeConsultationGate(1500)).toBe(3) // 25 mins
      expect(computeConsultationGate(1799)).toBe(3)

      // Gate 4: 30 - 38 mins (1800s - 2279s)
      expect(computeConsultationGate(1800)).toBe(4)
      expect(computeConsultationGate(2100)).toBe(4) // 35 mins
      expect(computeConsultationGate(2279)).toBe(4)

      // Gate 5: 38 - 45+ mins (>= 2280s)
      expect(computeConsultationGate(2280)).toBe(5)
      expect(computeConsultationGate(2700)).toBe(5) // 45 mins
      expect(computeConsultationGate(3000)).toBe(5) // Overtime
    })
  })

  describe('formatConsultationCountdown', () => {
    it('accurately counts down from 45:00 total consultation allocation', () => {
      const start = formatConsultationCountdown(0)
      expect(start.formattedRemaining).toBe('45:00')
      expect(start.isOvertime).toBe(false)
      expect(start.remainingSec).toBe(2700)

      const mid = formatConsultationCountdown(900) // 15 mins elapsed
      expect(mid.formattedRemaining).toBe('30:00')
      expect(mid.isOvertime).toBe(false)
      expect(mid.remainingSec).toBe(1800)

      const late = formatConsultationCountdown(2670) // 44:30 elapsed
      expect(late.formattedRemaining).toBe('00:30')
      expect(late.isOvertime).toBe(false)
      expect(late.remainingSec).toBe(30)
    })

    it('flags overtime with leading plus sign when session exceeds 45:00', () => {
      const overtime = formatConsultationCountdown(2775) // 46:15 elapsed -> +01:15 overtime
      expect(overtime.formattedRemaining).toBe('+01:15')
      expect(overtime.isOvertime).toBe(true)
      expect(overtime.remainingSec).toBe(-75)
    })
  })

  describe('CONSULTATION_PLAYBOOK_GATES metadata verification', () => {
    it('defines exactly 5 clinical gates in strictly sequential order', () => {
      expect(CONSULTATION_PLAYBOOK_GATES.length).toBe(5)
      CONSULTATION_PLAYBOOK_GATES.forEach((gate, idx) => {
        expect(gate.gateNumber).toBe(idx + 1)
        expect(gate.title).toBeTruthy()
        expect(gate.shortTitle).toBeTruthy()
        expect(gate.minuteRange).toBeTruthy()
        expect(gate.clinicalObjective).toBeTruthy()
        expect(gate.keyCues.length).toBeGreaterThanOrEqual(3)
        expect(gate.recommendedActionLabel).toBeTruthy()
      })
    })

    it('verifies Gate 1 through Gate 5 specific clinical standards', () => {
      const [g1, g2, g3, g4, g5] = CONSULTATION_PLAYBOOK_GATES
      expect(g1.title).toContain('CNS Readiness')
      expect(g2.title).toContain('Static Gravitational Mesh')
      expect(g3.title).toContain('Overhead Squat Assessment')
      expect(g4.title).toContain('Metabolic Base')
      expect(g5.title).toContain('Master Periodization')
    })
  })
})
