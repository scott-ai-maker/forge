"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import CoachCardioVoiceoverPlayer from "@/components/fitness/CoachCardioVoiceoverPlayer"
import BluetoothHeartRateMonitor from "@/components/fitness/BluetoothHeartRateMonitor"
import ActiveRestCardioPacerTray from "@/components/fitness/tracker/ActiveRestCardioPacerTray"

export const dynamic = "force-dynamic"

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
  const [btSyncedStats, setBtSyncedStats] = useState<{
    avgBpm: number
    maxBpm: number
    durationMins: number
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
                Forge Athletic Cardio Pacer Test Suite
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>
                Conditioning Voiceover &amp; Heart Rate Pacing Harness
              </p>
            </div>
          </header>

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

          <ActiveRestCardioPacerTray
            exerciseName="Dumbbell Hammer Curl"
            elapsedRestSeconds={30}
            totalRestSeconds={60}
            restingHeartRateBpm={60}
            userAge={35}
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
          clientNotes="Maintain nasal breathing and steady aerobic rhythm."
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
