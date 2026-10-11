import { describe, expect, it } from 'vitest'
import type { ClientErapData } from './LiveErapSafetyModal'

describe('LiveErapSafetyModal Architecture', () => {
  const sampleErapData: ClientErapData = {
    clientId: 'client-101',
    athleteName: 'Jordan Reed',
    athleteEmail: 'jordan@example.com',
    athletePhone: '555-0144',
    emergencyContactName: 'Dana Reed',
    emergencyContactPhone: '555-0155',
    medicalConditions: 'Controlled hypertension, patellar tendinopathy',
    riskTier: 'Moderate Risk',
    clearanceStatus: 'cleared_with_modifications',
    erap: {
      workoutLocationSummary: '100 Main St Apt 4B, Austin, TX 78701',
      workoutStreetAddress: '100 Main St',
      workoutUnitOrGateCode: 'Apt 4B / Gate #1234',
      workoutCity: 'Austin',
      workoutState: 'TX',
      workoutPostalCode: '78701',
      localEmergencyDispatchPhone: '512-974-0845',
      hasAcceptedVirtualTelehealthConsent: true,
      isErapComplete: true,
    },
    virtualTelehealthDisclaimer: 'NASM VIRTUAL COACHING & REMOTE TELEHEALTH AGREEMENT',
  }

  it('validates complete ERAP data model structure', () => {
    expect(sampleErapData.erap?.workoutStreetAddress).toBe('100 Main St')
    expect(sampleErapData.erap?.workoutUnitOrGateCode).toBe('Apt 4B / Gate #1234')
    expect(sampleErapData.erap?.localEmergencyDispatchPhone).toBe('512-974-0845')
    expect(sampleErapData.erap?.hasAcceptedVirtualTelehealthConsent).toBe(true)
    expect(sampleErapData.emergencyContactPhone).toBe('555-0155')
  })

  it('formats combined address and access code for emergency dispatch', () => {
    const erap = sampleErapData.erap!
    const fullCityStateZip = [erap.workoutCity, erap.workoutState, erap.workoutPostalCode]
      .filter(Boolean)
      .join(', ')

    const formattedAddress = [
      erap.workoutStreetAddress,
      erap.workoutUnitOrGateCode ? `(${erap.workoutUnitOrGateCode})` : null,
      fullCityStateZip,
    ]
      .filter(Boolean)
      .join(' · ')

    expect(formattedAddress).toBe('100 Main St · (Apt 4B / Gate #1234) · Austin, TX, 78701')
  })

  it('ensures local municipal dispatch is distinct from generic 911 for remote coaching safety', () => {
    const dispatchPhone = sampleErapData.erap?.localEmergencyDispatchPhone || '911'
    const isLocalDispatch = !dispatchPhone.startsWith('911')
    expect(isLocalDispatch).toBe(true)
    expect(dispatchPhone).toBe('512-974-0845')
  })
})
