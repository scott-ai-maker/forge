"use client"

import React, { useState } from "react"
import CoachCardioVoiceoverPlayer from "@/components/fitness/CoachCardioVoiceoverPlayer"

export const dynamic = "force-dynamic"

export default function CardioStudioTestHarnessPage() {
  const [isStudioOpen, setIsStudioOpen] = useState(true)
  const [loggedSession, setLoggedSession] = useState<{
    duration_mins: number
    activity_type: string
    perceived_effort: number
    calories: number
  } | null>(null)
  const [flowedToCoolDown, setFlowedToCoolDown] = useState(false)

  return (
    <main style={{ minHeight: "100vh", background: "#0A0F1D", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
            style={{ padding: "10px 20px", cursor: "pointer" }}
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
