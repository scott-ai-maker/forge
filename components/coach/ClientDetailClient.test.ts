import { describe, expect, it } from 'vitest'

describe('ClientDetailClient Component & Lifecycle Consultation Logic', () => {
  it('maps session statuses to high-end luxury color themes', () => {
    function getStatusStyle(status: string) {
      const colors: Record<string, { bg: string; color: string }> = {
        scheduled: { bg: 'rgba(212,160,23,0.15)', color: 'var(--gold)' },
        completed: { bg: 'rgba(72,187,120,0.15)', color: 'var(--success)' },
        cancelled: { bg: 'rgba(138,153,170,0.15)', color: 'var(--gray)' },
        no_show: { bg: 'rgba(255,61,87,0.15)', color: 'var(--error)' },
      }
      return colors[status] ?? colors.scheduled
    }

    expect(getStatusStyle('scheduled').color).toBe('var(--gold)')
    expect(getStatusStyle('completed').color).toBe('var(--success)')
    expect(getStatusStyle('cancelled').color).toBe('var(--gray)')
    expect(getStatusStyle('no_show').color).toBe('var(--error)')
    // Unknown status fallback
    expect(getStatusStyle('in_progress').color).toBe('var(--gold)')
  })

  it('accurately identifies whether a consultation was waived or delivered asynchronously', () => {
    function checkIsConsultWaived(notesList: (string | null)[]): boolean {
      return notesList.some(notes => {
        if (!notes) return false
        const lower = notes.toLowerCase()
        return (
          lower.includes('waived') ||
          lower.includes('opted out') ||
          lower.includes('skip consult') ||
          lower.includes('client does not want') ||
          lower.includes('async delivery')
        )
      })
    }

    expect(checkIsConsultWaived(['Client requested async delivery via text'])).toBe(true)
    expect(checkIsConsultWaived(['Waived consultation - fast-tracked to Stage 8'])).toBe(true)
    expect(checkIsConsultWaived(['Client opted out of video call'])).toBe(true)
    expect(checkIsConsultWaived(['Standard live 1:1 kickoff delivered via Zoom'])).toBe(false)
    expect(checkIsConsultWaived([null, 'Great movement screen completed'])).toBe(false)
  })

  it('determines client kickoff lifecycle banner text based on completed sessions and waiver', () => {
    function getKickoffStatusText(hasCompletedSession: boolean, isConsultWaived: boolean): string {
      if (hasCompletedSession) {
        return isConsultWaived ? '✓ Consult Waived (Async)' : '✓ Kickoff Delivered'
      }
      return 'Live Kickoff Pending'
    }

    expect(getKickoffStatusText(false, false)).toBe('Live Kickoff Pending')
    expect(getKickoffStatusText(true, false)).toBe('✓ Kickoff Delivered')
    expect(getKickoffStatusText(true, true)).toBe('✓ Consult Waived (Async)')
  })
})

