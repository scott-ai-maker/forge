'use client'

import UnifiedLiveStudioHud, { Plan, SetLog } from '@/components/coach/UnifiedLiveStudioHud'

interface LiveSessionClientProps {
  clientId: string
  coachUserId?: string
  plan: Plan | null
  initialSets: SetLog[]
  today: string
  athleteName?: string
}

export const DEFAULT_LIVE_ASSESSMENT_PLAN: Plan = {
  id: 'live-movement-screen',
  name: 'NASM 1:1 Live Movement Screen & Kinetic Assessment',
  nasm_opt_phase: 1,
  plan_json: {
    workouts: [
      {
        day: 1,
        focus: 'Comprehensive Movement Screen & Kinetic Diagnostics',
        exercises: [
          {
            name: 'Overhead Squat Assessment (OHSA)',
            sets: '3',
            reps: '5',
            tempo: '4-2-1',
            rest: '60s',
            notes: 'Kinetic checkpoints: Feet straight, knees tracking 2nd toe, neutral spine, arms overhead',
          },
          {
            name: 'Single-Leg Squat Assessment',
            sets: '2',
            reps: '5 each',
            tempo: '2-0-2',
            rest: '60s',
            notes: 'Assess dynamic knee valgus, pelvic tilt, and ankle eversion',
          },
          {
            name: 'Pushing Assessment (Push-Up)',
            sets: '2',
            reps: '10',
            tempo: '2-0-2',
            rest: '60s',
            notes: 'Check for scapular winging and hyperextension of lumbar spine',
          },
          {
            name: 'Standing Cable/Band Row',
            sets: '2',
            reps: '10',
            tempo: '2-0-2',
            rest: '60s',
            notes: 'Assess shoulder elevation and forward head compensation',
          },
        ],
      },
    ],
  },
}

export default function LiveSessionClient({
  clientId,
  coachUserId,
  plan,
  initialSets,
  today,
  athleteName = 'Athlete',
}: LiveSessionClientProps) {
  const activePlan = plan ?? DEFAULT_LIVE_ASSESSMENT_PLAN

  return (
    <div style={{ width: '100%' }}>
      <UnifiedLiveStudioHud
        clientId={clientId}
        coachUserId={coachUserId}
        athleteName={athleteName}
        coachName="Coach Gordon"
        plan={activePlan}
        initialSets={initialSets}
        today={today}
      />
    </div>
  )
}
