import React from 'react'
import CoachTriageCockpit from '@/components/coach/CoachTriageCockpit'
import { ClientTriageSummary } from '@/lib/coach-triage'

export const dynamic = 'force-dynamic'

const MOCK_TRIAGE_CLIENTS: ClientTriageSummary[] = [
  {
    clientId: 'athlete-red-01',
    clientName: 'Julian Sterling',
    email: 'julian@executive.com',
    priority: 'red',
    priorityRank: 1,
    primaryReason: 'ACWR Danger Spike (1.62) · Workload Surge',
    readinessScore: 42,
    adherencePercent: 88,
    daysSinceLastCheckin: 4,
    hasPendingVideoCritique: false,
    hasMedicalRedFlag: false,
    hasReportedPain: true,
    currentOptPhase: 2,
    recommendedAction: 'Insert 1-week restorative deload to protect connective tissue.',
    acwrRatio: 1.62,
    acwrZone: 'Danger Zone',
    acuteWorkloadUnits: 1420,
    chronicWorkloadUnits: 880,
    primaryFatiguedMuscles: ['Lower Back', 'Hamstrings'],
    suggestedPeriodizationAction: 'insert_deload',
    suggestedActionLabel: '1-Click Restorative Deload',
  },
  {
    clientId: 'athlete-fatigue-02',
    clientName: 'Marcus Vance',
    email: 'marcus@vancecap.com',
    priority: 'amber',
    priorityRank: 2,
    primaryReason: 'Recent Check-in · CNS Neural Readiness Drop (52%)',
    readinessScore: 52,
    adherencePercent: 92,
    daysSinceLastCheckin: 1,
    hasPendingVideoCritique: false,
    hasMedicalRedFlag: false,
    hasReportedPain: false,
    currentOptPhase: 1,
    recommendedAction: 'Modulate intra-set RPE to 8.0 and prescribe 10 min Zone 1 aerobic recovery.',
    acwrRatio: 1.25,
    acwrZone: 'Sweet Spot',
    acuteWorkloadUnits: 980,
    chronicWorkloadUnits: 790,
    primaryFatiguedMuscles: ['Shoulders', 'Upper Traps'],
    suggestedPeriodizationAction: null,
    suggestedActionLabel: undefined,
  },
  {
    clientId: 'athlete-amber-03',
    clientName: 'Elena Rostova',
    email: 'elena@rostova.com',
    priority: 'amber',
    priorityRank: 2,
    primaryReason: 'Pending Form Video Critique · Knee Valgus on Heavy Sets',
    readinessScore: 78,
    adherencePercent: 85,
    daysSinceLastCheckin: 3,
    hasPendingVideoCritique: true,
    hasMedicalRedFlag: false,
    hasReportedPain: false,
    currentOptPhase: 4,
    recommendedAction: 'Review bilateral squat mechanics and prescribe 4-Phase CEx sequence.',
    acwrRatio: 1.15,
    acwrZone: 'Sweet Spot',
    acuteWorkloadUnits: 920,
    chronicWorkloadUnits: 800,
    primaryFatiguedMuscles: ['Gluteus Medius'],
    suggestedPeriodizationAction: null,
    suggestedActionLabel: undefined,
  },
  {
    clientId: 'athlete-green-04',
    clientName: 'Devin Booker',
    email: 'devin@hoops.com',
    priority: 'green',
    priorityRank: 3,
    primaryReason: 'Autonomous Progress · 100% Adherence & PR Breakthrough',
    readinessScore: 94,
    adherencePercent: 100,
    daysSinceLastCheckin: 1,
    hasPendingVideoCritique: false,
    hasMedicalRedFlag: false,
    hasReportedPain: false,
    currentOptPhase: 5,
    recommendedAction: 'Authorize +5% load increase on primary compound lifts (NASM 2-for-2 Rule).',
    acwrRatio: 1.10,
    acwrZone: 'Sweet Spot',
    acuteWorkloadUnits: 1100,
    chronicWorkloadUnits: 1000,
    primaryFatiguedMuscles: [],
    suggestedPeriodizationAction: 'accelerate_phase',
    suggestedActionLabel: '1-Click Fast-Track Phase',
  },
]

export default function CoachTriageTestHarnessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080E14', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <CoachTriageCockpit initialClients={MOCK_TRIAGE_CLIENTS} />
      </div>
    </main>
  )
}
