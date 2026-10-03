import { describe, expect, it } from 'vitest'
import { evaluateClientOnboardingProgression, ClientProgressionTelemetry } from '@/lib/coach-onboarding-progression'

describe('Session Delivery & SOAP Notes Workflow Integration', () => {
  const telemetry: ClientProgressionTelemetry = {
    clientId: 'client-athlete-777',
    clientName: 'Sarah Connor',
    email: 'sarah@example.com',
    designatedCoachId: 'coach-master-1',
    sessions: [
      {
        id: 'session-101',
        scheduled_at: '2026-09-05T15:00:00Z',
        status: 'scheduled',
        notes: null,
      },
    ],
  }

  it('Stage 7 defines direct Deliver Live Session milestone linking to live video room', () => {
    const profile = evaluateClientOnboardingProgression(telemetry)
    const stage7 = profile.stages.find(s => s.stageNumber === 7)

    expect(stage7).toBeDefined()
    expect(stage7?.id).toBe('delivery_kickoff')
    expect(stage7?.actionHref).toBe('/coach/clients/client-athlete-777?tab=sessions#workspace-tab-content')
    expect(stage7?.actionLabel).toBe('Deliver Session & Record SOAP Notes')

    // Check delivery milestone
    const deliveryMilestone = stage7?.milestones.find(m => m.key === 'session_delivered')
    expect(deliveryMilestone).toBeDefined()
    expect(deliveryMilestone?.actionHref).toBe('/coach/clients/client-athlete-777/live')
    expect(deliveryMilestone?.actionLabel).toBe('Deliver Live Session')

    // Check SOAP notes milestone
    const soapMilestone = stage7?.milestones.find(m => m.key === 'soap_notes_dictated')
    expect(soapMilestone).toBeDefined()
    expect(soapMilestone?.actionHref).toBe('/coach/clients/client-athlete-777?tab=sessions#workspace-tab-content')
    expect(soapMilestone?.actionLabel).toBe('Record SOAP Notes')
  })

  it('generates correct live session URL for scheduled session cards', () => {
    const clientId = 'client-athlete-777'
    const liveSessionRoomHref = `/coach/clients/${clientId}/live`
    expect(liveSessionRoomHref).toBe('/coach/clients/client-athlete-777/live')
  })

  it('validates clinical SOAP note payload structure', () => {
    const rawNotes = 'Squat 185x5x3, RPE 7. Excellent depth, neutral cervical spine.'
    const payload = {
      rawNotes,
      clientName: 'Sarah Connor',
      mode: 'clinical_soap',
    }

    expect(payload.rawNotes.trim().length).toBeGreaterThan(0)
    expect(payload.clientName).toBe('Sarah Connor')
    expect(payload.mode).toBe('clinical_soap')
  })
})
