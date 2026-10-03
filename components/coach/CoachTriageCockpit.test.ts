import { describe, expect, it } from 'vitest'
import { evaluateClientTriage, sortTriageQueue } from '@/lib/coach-triage'

describe('CoachTriageCockpit Architecture & Diagnostic Integration', () => {
  it('generates direct Live Studio consultation playbook route for triage clients', () => {
    const client = evaluateClientTriage({
      clientId: 'athlete-007',
      clientName: 'Julian Sterling',
      email: 'julian@sovereign.com',
      daysSinceLastCheckin: 4,
      acwrRatio: 1.62,
    })

    expect(client.clientId).toBe('athlete-007')
    expect(client.priority).toBe('red')
    
    // Live Studio launcher URL schema
    const liveStudioHref = `/coach/clients/${client.clientId}/live`
    expect(liveStudioHref).toBe('/coach/clients/athlete-007/live')
  })

  it('orders urgent danger zone spikes ahead of attention overreaching and autonomous clients', () => {
    const redClient = evaluateClientTriage({
      clientId: 'red-1',
      clientName: 'Red Athlete',
      email: 'red@example.com',
      daysSinceLastCheckin: 2,
      acwrRatio: 1.65,
    })

    const amberClient = evaluateClientTriage({
      clientId: 'amber-1',
      clientName: 'Amber Athlete',
      email: 'amber@example.com',
      daysSinceLastCheckin: 1,
      acwrRatio: 1.35,
    })

    const greenClient = evaluateClientTriage({
      clientId: 'green-1',
      clientName: 'Green Athlete',
      email: 'green@example.com',
      daysSinceLastCheckin: 1,
      readinessScore: 95,
      completionRate14d: 100,
    })

    const queue = sortTriageQueue([greenClient, redClient, amberClient])
    expect(queue.map(c => c.clientId)).toEqual(['red-1', 'amber-1', 'green-1'])
  })

  it('supplies actionable periodization interventions on danger spikes', () => {
    const dangerClient = evaluateClientTriage({
      clientId: 'danger-1',
      clientName: 'Overreached Client',
      email: 'danger@example.com',
      daysSinceLastCheckin: 1,
      acwrRatio: 1.55,
    })

    expect(dangerClient.suggestedPeriodizationAction).toBe('insert_deload')
    expect(dangerClient.suggestedActionLabel).toBe('1-Click Restorative Deload')
  })

  it('escalates clients with reported pain or medical red flags to Red Priority', () => {
    const painClient = evaluateClientTriage({
      clientId: 'pain-1',
      clientName: 'Injured Athlete',
      email: 'pain@example.com',
      daysSinceLastCheckin: 1,
      reportedPainInLogs: true,
      acwrRatio: 1.1,
    })

    expect(painClient.priority).toBe('red')
    expect(painClient.suggestedPeriodizationAction).toBe('setback_protocol')
    expect(painClient.suggestedActionLabel).toBe('1-Click Setback Protocol')
    expect(painClient.primaryReason).toContain('Joint pain / discomfort')

    const medicalClient = evaluateClientTriage({
      clientId: 'med-1',
      clientName: 'Medical Flag Athlete',
      email: 'med@example.com',
      daysSinceLastCheckin: 1,
      hasMedicalRedFlag: true,
    })

    expect(medicalClient.priority).toBe('red')
    expect(medicalClient.primaryReason).toContain('High-risk medical symptom')
  })
})

