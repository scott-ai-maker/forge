"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import CoachCardioVoiceoverPlayer from "@/components/fitness/CoachCardioVoiceoverPlayer"
import CardioLogForm from "@/components/fitness/CardioLogForm"
import BluetoothHeartRateMonitor from "@/components/fitness/BluetoothHeartRateMonitor"
import CoachCardioPrescriber from "@/components/coach/CoachCardioPrescriber"
import ActiveRestCardioPacerTray from "@/components/fitness/tracker/ActiveRestCardioPacerTray"
import AppleWatchSimulatorModal from "@/components/fitness/watch/AppleWatchSimulatorModal"
import type { WatchExerciseItemPayload } from "@/lib/native-healthkit-bridge"

export const dynamic = "force-dynamic"

const SUPERSET_STATIONS: WatchExerciseItemPayload[] = [
  {
    exerciseName: "Barbell Bench Press",
    phaseLabel: "Phase 3 · Hypertrophy",
    orderIndex: 0,
    setNumber: 1,
    totalSets: 3,
    prescribedWeight: 185,
    prescribedReps: 10,
    repsDisplay: "10",
    targetRpe: 8,
    tempo: "2-0-2-0",
    restSeconds: 0,
    isCompound: true,
    isSuperset: true,
    supersetRole: "A",
    supersetPartnerIndex: 1,
  },
  {
    exerciseName: "Bent-Over Barbell Row",
    phaseLabel: "Phase 3 · Hypertrophy",
    orderIndex: 1,
    setNumber: 1,
    totalSets: 3,
    prescribedWeight: 165,
    prescribedReps: 10,
    repsDisplay: "10",
    targetRpe: 8,
    tempo: "2-1-2-0",
    restSeconds: 60,
    isCompound: true,
    isSuperset: true,
    supersetRole: "B",
    supersetPartnerIndex: 0,
  },
]

function CardioStudioHarnessInner() {
  const searchParams = useSearchParams()
  const scenario = searchParams.get("scenario")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const [isStudioOpen, setIsStudioOpen] = useState(true)
  const [loggedSession, setLoggedSession] = useState<{
    duration_mins: number
    activity_type: string
    perceived_effort: number
    calories: number
  } | null>(null)
  const [flowedToCoolDown, setFlowedToCoolDown] = useState(false)

  // Suite scenario states
  const [btSyncedStats, setBtSyncedStats] = useState<{
    avgBpm: number
    maxBpm: number
    durationMins: number
  } | null>(null)
  const [isWatchOpen, setIsWatchOpen] = useState(false)
  const [watchLoggedSet, setWatchLoggedSet] = useState<{
    exerciseName: string
    setIndex: number
    reps: number
    weightLbs: number
    rpe: number
  } | null>(null)

  if (scenario === "suite") {
    return (
      <main
        data-hydrated={isHydrated ? "true" : "false"}
        style={{
          minHeight: "100dvh",
          background: "#0A0F1D",
          color: "#FFFFFF",
          padding: "clamp(12px, 3vw, 24px)",
          boxSizing: "border-box",
          maxWidth: "100%",
          overflowX: "clip",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 20 }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(20px, 4vw, 26px)", color: "#FFFFFF" }}>
                Forge Athletic Cardio &amp; Companion Bridge Suite
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
                Tanaka Stage Conditioning, Web Bluetooth GATT Telemetry &amp; Apple Watch Companion
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWatchOpen(true)}
              style={{
                minHeight: 44,
                padding: "10px 16px",
                background: "linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)",
                color: "#0A0E18",
                border: "none",
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              Launch Apple Watch Simulator
            </button>
          </header>

          {watchLoggedSet && (
            <div
              data-testid="watch-set-logged-banner"
              role="status"
              style={{
                padding: "10px 14px",
                background: "rgba(16, 185, 129, 0.14)",
                border: "1px solid rgba(16, 185, 129, 0.45)",
                borderRadius: 8,
                color: "#34D399",
                fontSize: 13,
              }}
            >
              Watch Logged: {watchLoggedSet.exerciseName} · Set #{watchLoggedSet.setIndex} · {watchLoggedSet.reps} reps @ {watchLoggedSet.weightLbs} lbs (RPE {watchLoggedSet.rpe})
            </div>
          )}

          {btSyncedStats && (
            <div
              data-testid="bt-synced-stats-banner"
              role="status"
              style={{
                padding: "10px 14px",
                background: "rgba(56, 189, 248, 0.14)",
                border: "1px solid rgba(56, 189, 248, 0.45)",
                borderRadius: 8,
                color: "#38BDF8",
                fontSize: 13,
              }}
            >
              Bluetooth Synced: Avg {btSyncedStats.avgBpm} BPM · Max {btSyncedStats.maxBpm} BPM · {btSyncedStats.durationMins} min
            </div>
          )}

          <BluetoothHeartRateMonitor
            athleteAge={35}
            athleteRestingHr={60}
            onSyncSessionStats={(stats) => setBtSyncedStats(stats)}
          />

          <CardioLogForm
            initialLogs={[]}
            preferredUnits="imperial"
            athleteAge={35}
            athleteRestingHr={60}
          />

          <ActiveRestCardioPacerTray
            exerciseName="Dumbbell Hammer Curl"
            elapsedRestSeconds={30}
            totalRestSeconds={60}
            restingHeartRateBpm={60}
            userAge={35}
          />

          <CoachCardioPrescriber
            clientId="test-athlete-14"
            clientName="Julian"
            clientAge={35}
          />

          <AppleWatchSimulatorModal
            isOpen={isWatchOpen}
            onClose={() => setIsWatchOpen(false)}
            exercises={SUPERSET_STATIONS}
            activeExerciseIndex={0}
            isSuperset={true}
            supersetRole="A"
            cardioProtocol={{
              modality: "Zone 2 Aerobic Engine",
              durationMins: 20,
              targetZone: 2,
              targetBpmMin: 132,
              targetBpmMax: 148,
              isCompleted: false,
            }}
            onSimulateSetLogged={(payload) => setWatchLoggedSet(payload)}
          />
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: "100dvh", background: "#0A0F1D", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {!isStudioOpen && (
        <div style={{ textAlign: "center", color: "#FFFFFF", display: "grid", gap: 12 }}>
          <div data-testid="studio-closed-banner" style={{ color: "#94A3B8", fontSize: 16 }}>
            Cardio Studio Closed
          </div>
          {loggedSession && (
            <div data-testid="session-logged-feedback" style={{ padding: 16, background: "rgba(52,211,153,0.15)", border: "1px solid #34D399", borderRadius: 8, color: "#34D399" }}>
              Logged: {loggedSession.duration_mins} mins · {loggedSession.activity_type} · RPE {loggedSession.perceived_effort} · {loggedSession.calories} kcal
            </div>
          )}
          {flowedToCoolDown && (
            <div data-testid="cooldown-flow-feedback" style={{ padding: 12, background: "rgba(16,185,129,0.15)", border: "1px solid #34D399", borderRadius: 8, color: "#34D399" }}>
              Flowed into Post-Cardio Cool-Down
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setIsStudioOpen(true)
              setLoggedSession(null)
              setFlowedToCoolDown(false)
            }}
            className="sgf-button sgf-button-gold"
            style={{ padding: "10px 20px", minHeight: 44, cursor: "pointer" }}
          >
            Re-open Studio
          </button>
        </div>
      )}

      {isStudioOpen && (
        <CoachCardioVoiceoverPlayer
          initialPatternId="zone2_aerobic_engine"
          initialDurationMinutes={20}
          athleteName="Julian"
          athleteAge={35}
          athleteWeightKg={82}
          athleteGender="male"
          initialModality="Treadmill Incline Walk"
          clientNotes="Maintain nasal breathing and stay locked into Tanaka 184 ceiling."
          onClose={() => setIsStudioOpen(false)}
          onFlowToCoolDown={() => {
            setFlowedToCoolDown(true)
            setIsStudioOpen(false)
          }}
          onFlowToMindfulness={() => {
            setFlowedToCoolDown(true)
            setIsStudioOpen(false)
          }}
          onSessionLogged={(log) => {
            setLoggedSession(log)
            setIsStudioOpen(false)
          }}
        />
      )}
    </main>
  )
}

export default function CardioStudioTestHarnessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#0A0F1D" }} />}>
      <CardioStudioHarnessInner />
    </Suspense>
  )
}
