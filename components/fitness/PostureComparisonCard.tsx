'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  Camera,
  Check,
  Columns,
  GripVertical,
  Layers,
  Mail,
  Maximize2,
  RotateCcw,
  ScanLine,
  Smartphone,
  Sparkles,
  Upload,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react'
import {
  getDefaultPostureProfileState,
  getTodayIsoDate,
  loadPostureProfileState,
  POSTURE_PROFILE_EVENT,
  runQuickPostureCheckDelta,
  savePostureProfileState,
  type PostureDeltaSummary,
} from '@/lib/posture-profile-state'
import {
  evaluateStandingPostureFromMediaPipe,
  getStrainHexColor,
  MEDIAPIPE_POSE_CONNECTIONS,
  type StandingPostureScanEvaluation,
} from '@/lib/standing-posture-mesh-engine'
import { getUpgradeTriggerCopy, useTierAccess } from '@/lib/tierEntitlements'
import TierUpgradeModal from '@/components/packages/TierUpgradeModal'
import { playForgeTactileTone } from '@/lib/sfx-audio'
import {
  subscribeToWatchCameraCommand,
  syncCameraRemoteStateToWatch,
} from '@/lib/native-healthkit-bridge'
import { trackEvent } from '@/src/lib/telemetry/telemetryClient'
import CoachEscalationModal from '@/components/coach-gordon/CoachEscalationModal'
import {
  buildPostScanDiagnosticSummary,
  playCoachStaticCue,
  speakCoachDynamicText,
} from '@/src/lib/audio/coachVoiceEngine'

export interface PostureComparisonViewerProps {
  sandboxMode?: boolean
  remoteActive?: boolean
  onRequestUpgrade?: () => void
  showPostScanBanner?: boolean
  initialDroppedFile?: File | null
  onConsumedDroppedFile?: () => void
}

const DAY30_REMINDER_KEY = 'forge_posture_day30_reminder_v1'

interface CachedStandingPoseLandmarker {
  detect: (source: HTMLImageElement | HTMLCanvasElement) => {
    landmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>>
    worldLandmarks?: Array<Array<{ x: number; y: number; z?: number; visibility?: number }>>
  }
}

let sharedStandingLandmarkerPromise: Promise<CachedStandingPoseLandmarker> | null = null

function getOrInitStandingPoseLandmarker(): Promise<CachedStandingPoseLandmarker> {
  if (sharedStandingLandmarkerPromise) return sharedStandingLandmarkerPromise
  sharedStandingLandmarkerPromise = (async () => {
    const vision = await import('@mediapipe/tasks-vision')
    let fileset
    try {
      fileset = await vision.FilesetResolver.forVisionTasks('/wasm')
    } catch {
      fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
    }
    const createWith = async (modelAssetPath: string, delegate: 'GPU' | 'CPU') =>
      (await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.35,
        minPosePresenceConfidence: 0.35,
        minTrackingConfidence: 0.35,
      })) as unknown as CachedStandingPoseLandmarker

    for (const modelPath of [
      '/models/pose_landmarker_lite.task',
      'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
    ]) {
      try {
        return await createWith(modelPath, 'GPU')
      } catch {
        try {
          return await createWith(modelPath, 'CPU')
        } catch {
          // Try next model path
        }
      }
    }
    throw new Error('Unable to initialize MediaPipe PoseLandmarker')
  })().catch(err => {
    sharedStandingLandmarkerPromise = null
    throw err
  })
  return sharedStandingLandmarkerPromise
}

function buildMeshArcPath(
  vertex: { x: number; y: number },
  armA: { x: number; y: number },
  armB: { x: number; y: number },
  radius = 8.5
): string {
  const startAngle = Math.atan2(armA.y - vertex.y, armA.x - vertex.x)
  const endAngle = Math.atan2(armB.y - vertex.y, armB.x - vertex.x)
  let delta = endAngle - startAngle
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  const sweepFlag = delta >= 0 ? 1 : 0
  const x1 = vertex.x + radius * Math.cos(startAngle)
  const y1 = vertex.y + radius * Math.sin(startAngle)
  const x2 = vertex.x + radius * Math.cos(endAngle)
  const y2 = vertex.y + radius * Math.sin(endAngle)
  return `M ${vertex.x} ${vertex.y} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

function CapturedPostureMeshStage({
  photoUrl,
  evaluation,
  showMesh = true,
}: {
  photoUrl: string
  evaluation: StandingPostureScanEvaluation
  showMesh?: boolean
}) {
  const svgUid = useId().replace(/:/g, '')
  const glowId = `captured-mesh-glow-${svgUid}`
  const { width: vbW, height: vbH } = evaluation.viewBox
  const { ear, shoulder, elbow, wrist, hip, knee, ankle } = evaluation.landmarks

  const cvaColor =
    evaluation.cvaDeg <= 7.5 ? '#10B981' : evaluation.cvaDeg <= 18 ? '#F59E0B' : '#FB7185'
  const trunkAbs = Math.abs(evaluation.pelvicDriftDeg)
  const trunkColor =
    trunkAbs <= 4.5 ? '#10B981' : trunkAbs <= 10.5 ? '#F59E0B' : '#FB7185'
  const overallColor = getStrainHexColor(evaluation.strainFlag)

  const clampX = (v: number, w = 18) => Math.max(2, Math.min(vbW - w - 2, v))
  const clampY = (v: number, h = 6) => Math.max(2.5, Math.min(vbH - h - 2.5, v))

  const showCv = !ear.occluded && !shoulder.occluded
  const showTrunk = !shoulder.occluded && !hip.occluded
  const showThigh = !hip.occluded && !knee.occluded
  const showShin = !knee.occluded && !ankle.occluded
  const showUpperArm = !shoulder.occluded && !elbow.occluded
  const showForearm = !elbow.occluded && !wrist.occluded

  const plumbLabelX = clampX(evaluation.plumbLineX + 1.4, 20)

  return (
    <div
      className="relative mx-auto flex h-full max-h-full max-w-full items-center justify-center overflow-hidden rounded-xl"
      style={{ aspectRatio: `${vbW} / ${vbH}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl}
        alt="Analyzed 33-point posture photo"
        className={`block h-full w-full object-contain ${showMesh ? 'opacity-92' : 'opacity-100'}`}
      />
      {showMesh ? (
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Detected 33-point posture mesh overlay"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Vertical Gravity Plumb Line */}
        <line
          x1={evaluation.plumbLineX}
          y1={vbH * 0.05}
          x2={evaluation.plumbLineX}
          y2={vbH * 0.96}
          stroke="#38BDF8"
          strokeOpacity="0.72"
          strokeWidth="0.6"
          strokeDasharray="2.2 1.8"
        />
        <rect
          x={plumbLabelX}
          y={vbH * 0.92}
          width="19.5"
          height="4.6"
          rx="1.3"
          fill="rgba(9,10,13,0.88)"
        />
        <text
          x={plumbLabelX + 1.4}
          y={vbH * 0.92 + 3.2}
          fill="#7DD3FC"
          fontSize="2.55"
          fontWeight="700"
          letterSpacing="0.06em"
        >
          PLUMB LINE
        </text>

        {/* Secondary 33-Node BlazePose Bilateral Lattice */}
        <g stroke="rgba(56, 189, 248, 0.35)" strokeWidth="0.55" strokeLinecap="round">
          {MEDIAPIPE_POSE_CONNECTIONS.map(([aIdx, bIdx]) => {
            const a = evaluation.allNodes[aIdx]
            const b = evaluation.allNodes[bIdx]
            if (!a?.visible || !b?.visible) return null
            return <line key={`${aIdx}-${bIdx}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          })}
        </g>
        {evaluation.allNodes.map(node =>
          node.visible ? (
            <circle
              key={`raw-${node.index}`}
              cx={node.x}
              cy={node.y}
              r="0.85"
              fill="#38BDF8"
              fillOpacity={Math.max(0.35, node.confidence * 0.65)}
            />
          ) : null
        )}

        {/* Calibrated CVA Wedge Arc at Shoulder */}
        {showCv && evaluation.cameraAngle !== 'frontal' && evaluation.cvaDeg >= 1 && (() => {
          const earToShAngle = Math.atan2(ear.y - shoulder.y, ear.x - shoulder.x)
          const facingDir = ear.x >= shoulder.x ? 1 : -1
          const refAngle = earToShAngle - facingDir * ((evaluation.cvaDeg * Math.PI) / 180)
          const refArm = {
            x: shoulder.x + 15 * Math.cos(refAngle),
            y: shoulder.y + 15 * Math.sin(refAngle),
          }
          return (
            <path
              d={buildMeshArcPath(shoulder, refArm, ear, 7.5)}
              fill={cvaColor}
              fillOpacity="0.26"
              stroke={cvaColor}
              strokeWidth="0.7"
            />
          )
        })()}

        {/* Primary Highlighted Sagittal Kinetic Chain */}
        <g filter={`url(#${glowId})`} strokeLinecap="round">
          {showCv && (
            <line x1={ear.x} y1={ear.y} x2={shoulder.x} y2={shoulder.y} stroke={cvaColor} strokeWidth="1.45" />
          )}
          {showTrunk && (
            <line x1={shoulder.x} y1={shoulder.y} x2={hip.x} y2={hip.y} stroke={trunkColor} strokeWidth="1.55" />
          )}
          {showThigh && (
            <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={overallColor} strokeWidth="1.45" />
          )}
          {showShin && (
            <line x1={knee.x} y1={knee.y} x2={ankle.x} y2={ankle.y} stroke={overallColor} strokeWidth="1.4" />
          )}
          {showUpperArm && (
            <line
              x1={shoulder.x}
              y1={shoulder.y}
              x2={elbow.x}
              y2={elbow.y}
              stroke="rgba(248,250,252,0.75)"
              strokeWidth="1.05"
              strokeDasharray="2 1.5"
            />
          )}
          {showForearm && (
            <line
              x1={elbow.x}
              y1={elbow.y}
              x2={wrist.x}
              y2={wrist.y}
              stroke="rgba(248,250,252,0.75)"
              strokeWidth="1.05"
              strokeDasharray="2 1.5"
            />
          )}
        </g>

        {/* Primary Dual-Ring Anatomical Nodes */}
        {(['ear', 'shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'] as const).map(key => {
          const pt = evaluation.landmarks[key]
          if (pt.occluded) return null
          return (
            <g key={pt.id}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="2.9"
                fill="rgba(52, 211, 153, 0.16)"
                stroke="rgba(255, 255, 255, 0.36)"
                strokeWidth="0.4"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r="1.45"
                fill="#090A0D"
                stroke="#FFFFFF"
                strokeWidth="0.75"
              />
            </g>
          )
        })}

        {/* Floating Degree Callout Pills */}
        {showCv && (
          <g>
            <rect
              x={clampX(ear.x - 21, 18.5)}
              y={clampY(ear.y - 3, 5.4)}
              width="18.5"
              height="5.4"
              rx="2"
              fill="rgba(9,10,13,0.88)"
              stroke={cvaColor}
              strokeOpacity="0.75"
              strokeWidth="0.45"
            />
            <text
              x={clampX(ear.x - 21, 18.5) + 9.25}
              y={clampY(ear.y - 3, 5.4) + 3.7}
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="2.85"
              fontWeight="800"
            >
              {`CVA ${evaluation.cvaDeg.toFixed(1)}°`}
            </text>
          </g>
        )}
        {showTrunk && (
          <g>
            <rect
              x={clampX(hip.x - 22, 19.5)}
              y={clampY(hip.y - 2.7, 5.4)}
              width="19.5"
              height="5.4"
              rx="2"
              fill="rgba(9,10,13,0.88)"
              stroke={trunkColor}
              strokeOpacity="0.75"
              strokeWidth="0.45"
            />
            <text
              x={clampX(hip.x - 22, 19.5) + 9.75}
              y={clampY(hip.y - 2.7, 5.4) + 3.7}
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="2.8"
              fontWeight="800"
            >
              {`SWAY ${trunkAbs.toFixed(1)}°`}
            </text>
          </g>
        )}
      </svg>
      ) : null}
    </div>
  )
}

function createInitialDelta(sandboxMode: boolean): PostureDeltaSummary {
  const base = getDefaultPostureProfileState().postureDelta
  return sandboxMode ? { ...base, forwardHeadDeltaDeg: -4.2 } : base
}

function PostureSilhouetteSvg({
  variant,
  measuredDeg,
  pelvicDriftDeg = -3.0,
  opacity = 1,
  compact = false,
}: {
  variant: 'baseline' | 'current' | 'day30_ghost'
  measuredDeg?: number
  pelvicDriftDeg?: number
  opacity?: number
  compact?: boolean
}) {
  const svgUid = useId().replace(/:/g, '')
  const isBaseline = variant === 'baseline'
  const isGhost = variant === 'day30_ghost'

  const effectiveDeg =
    measuredDeg ?? (isGhost ? 3.2 : isBaseline ? 8.9 : 4.7)
  // Plumb line sits at x = 210 in a 420x260 precision clinical stage
  const plumbX = 210
  const forwardOffset = Math.max(2, Math.min(26, (effectiveDeg - 2.2) * 2.75))
  const tragusX = Math.round((plumbX + forwardOffset) * 10) / 10
  const shoulderX = Math.round((plumbX + forwardOffset * 0.36) * 10) / 10
  const thoracicX = Math.round((plumbX - 7 + forwardOffset * 0.16) * 10) / 10
  const lumbarX = Math.round((plumbX + 3 + Math.abs(pelvicDriftDeg) * 0.45) * 10) / 10
  const hipX = plumbX
  const kneeX = Math.round((plumbX + 2.5) * 10) / 10
  const ankleX = plumbX
  const elbowX = Math.round((shoulderX - 5) * 10) / 10
  const wristX = Math.round((shoulderX + 3) * 10) / 10

  const strokeColor = isBaseline ? '#FBBF24' : '#34D399'
  const secondaryStroke = isBaseline ? 'rgba(251,191,36,0.45)' : 'rgba(52,211,153,0.5)'
  const glowColor = isBaseline ? 'rgba(251,191,36,0.16)' : 'rgba(52,211,153,0.16)'
  const glowFilterId = `mesh-glow-${variant}-${svgUid}`
  const torsoGradId = `torso-grad-${variant}-${svgUid}`

  // CVA wedge arc at C7 (shoulderX, 76) between vertical plumb and C7->Tragus vector
  const tragusY = 42
  const c7Y = 76
  const arcR = 19
  const vecAngle = Math.atan2(tragusY - c7Y, tragusX - shoulderX)
  const vertAngle = -Math.PI / 2
  const arcStartX = shoulderX + arcR * Math.cos(vertAngle)
  const arcStartY = c7Y + arcR * Math.sin(vertAngle)
  const arcEndX = shoulderX + arcR * Math.cos(vecAngle)
  const arcEndY = c7Y + arcR * Math.sin(vecAngle)

  return (
    <svg
      viewBox={compact ? '95 6 230 248' : '0 0 420 260'}
      className="pointer-events-none h-full max-h-full w-full select-none"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <filter id={glowFilterId} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="2.1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={torsoGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isGhost ? 'rgba(30,36,48,0.42)' : '#232834'} />
          <stop offset="100%" stopColor={isGhost ? 'rgba(17,19,24,0.38)' : '#141720'} />
        </linearGradient>
      </defs>

      {/* Calibrated Studio Depth Grid */}
      {[42, 84, 126, 168, 210, 252, 294, 336, 378].map(gx => (
        <line
          key={`vx-${gx}`}
          x1={gx}
          y1={12}
          x2={gx}
          y2={248}
          stroke={gx === plumbX ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.035)'}
          strokeWidth={0.8}
        />
      ))}
      {[36, 76, 116, 156, 196, 236].map(gy => (
        <line
          key={`hy-${gy}`}
          x1={18}
          y1={gy}
          x2={402}
          y2={gy}
          stroke="rgba(255,255,255,0.035)"
          strokeWidth={0.8}
        />
      ))}

      {/* Optical Viewfinder Framing Brackets */}
      <path
        d={
          compact
            ? 'M 106 24 L 106 14 L 116 14 M 304 14 L 314 14 L 314 24 M 106 236 L 106 246 L 116 246 M 304 246 L 314 246 L 314 236'
            : 'M 26 28 L 26 16 L 40 16 M 380 16 L 394 16 L 394 28 M 26 232 L 26 244 L 40 244 M 380 244 L 394 244 L 394 232'
        }
        fill="none"
        stroke={secondaryStroke}
        strokeWidth={1.35}
        strokeLinecap="round"
      />

      {/* Ambient Anatomical Halo & Calibrated Force-Plate Platform */}
      <ellipse
        cx={plumbX}
        cy={136}
        rx={58}
        ry={98}
        fill={glowColor}
        opacity={isGhost ? 0.35 : 0.72}
      />
      <ellipse
        cx={plumbX + 4}
        cy={240}
        rx={46}
        ry={6.5}
        fill="rgba(17,19,24,0.92)"
        stroke={secondaryStroke}
        strokeWidth={0.9}
      />

      {/* Left & Right Clinical Telemetry Callouts (Full Stage View) */}
      {!compact && (
        <g opacity={0.92}>
          {/* Left Callout: Craniovertebral Plumb Reference */}
          <rect
            x={34}
            y={56}
            width={108}
            height={44}
            rx={7}
            fill="rgba(17,19,24,0.88)"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={0.9}
          />
          <text x={43} y={71} fill="#A1A1AA" fontSize="6.8" fontFamily="monospace" fontWeight="600">
            C7 → TRAGUS AXIS
          </text>
          <text x={43} y={87} fill={strokeColor} fontSize="11" fontFamily="monospace" fontWeight="800">
            {isBaseline ? '+8.9° DRIFT' : `+${effectiveDeg.toFixed(1)}° ALIGNED`}
          </text>
          <line
            x1={142}
            y1={76}
            x2={shoulderX - 18}
            y2={76}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.8}
            strokeDasharray="2.5 2.5"
          />

          {/* Left Lower Callout: Lumbo-Pelvic Stack */}
          <rect
            x={34}
            y={132}
            width={108}
            height={42}
            rx={7}
            fill="rgba(17,19,24,0.88)"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={0.9}
          />
          <text x={43} y={147} fill="#A1A1AA" fontSize="6.8" fontFamily="monospace" fontWeight="600">
            PELVIC TILT VECTOR
          </text>
          <text
            x={43}
            y={162}
            fill={isBaseline ? '#FBBF24' : '#6EE7B7'}
            fontSize="10.2"
            fontFamily="monospace"
            fontWeight="700"
          >
            {isBaseline ? 'ANTERIOR 6.2°' : `NEUTRAL ${Math.abs(pelvicDriftDeg).toFixed(1)}°`}
          </text>
          <line
            x1={142}
            y1={150}
            x2={hipX - 20}
            y2={146}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.8}
            strokeDasharray="2.5 2.5"
          />

          {/* Right Callout: Kinetic Plumb Verification */}
          <rect
            x={278}
            y={94}
            width={108}
            height={52}
            rx={7}
            fill="rgba(17,19,24,0.88)"
            stroke={secondaryStroke}
            strokeWidth={0.9}
          />
          <text x={287} y={109} fill="#A1A1AA" fontSize="6.8" fontFamily="monospace" fontWeight="600">
            33-PT SAGITTAL LOCK
          </text>
          <text x={287} y={124} fill="#F8FAFC" fontSize="9.8" fontFamily="monospace" fontWeight="700">
            33 / 33 NODES
          </text>
          <text x={287} y={137} fill={strokeColor} fontSize="7.4" fontFamily="monospace" fontWeight="700">
            {isBaseline ? 'DAY-01 BASELINE' : 'POST-SCAN VERIFIED'}
          </text>
        </g>
      )}

      {/* True Vertical Gravity Plumb Line */}
      <line
        x1={plumbX}
        y1={14}
        x2={plumbX}
        y2={244}
        stroke="#38BDF8"
        strokeOpacity={0.58}
        strokeWidth={1.15}
        strokeDasharray="4 3"
      />

      {/* Anatomical Sagittal Human Profile (Fitted Charcoal Crewneck & Training Shorts — Strict Shirts-On Standard) */}
      <g>
        {/* Posterior & Anterior Sculpted Legs + Training Shoes */}
        <path
          d={`M ${hipX - 11} 176
              Q ${kneeX - 12} 196 ${kneeX - 8} 206
              L ${ankleX - 7} 233
              L ${ankleX + 13} 236
              Q ${ankleX + 16} 239 ${ankleX + 12} 241
              L ${ankleX - 11} 241
              Q ${ankleX - 14} 236 ${ankleX - 11} 231
              L ${kneeX - 14} 204
              Q ${hipX - 16} 188 ${hipX - 14} 176 Z`}
          fill={isGhost ? 'rgba(39,43,54,0.34)' : '#252A36'}
          stroke={isGhost ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.16)'}
          strokeWidth={1}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />
        <path
          d={`M ${hipX - 2} 176
              Q ${kneeX + 9} 194 ${kneeX + 6} 206
              L ${ankleX + 4} 233
              L ${ankleX + 18} 236
              Q ${ankleX + 20} 240 ${ankleX + 15} 241
              L ${ankleX - 4} 241
              L ${ankleX - 3} 232
              L ${kneeX - 3} 205
              Q ${hipX - 5} 189 ${hipX - 4} 176 Z`}
          fill={isGhost ? 'rgba(46,52,66,0.38)' : '#2D3342'}
          stroke={isGhost ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.2)'}
          strokeWidth={1}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />

        {/* Fitted Athletic Training Shorts */}
        <path
          d={`M ${hipX - 16} 142
              L ${hipX + 16} 142
              Q ${kneeX + 15} 162 ${kneeX + 12} 178
              L ${hipX - 14} 178
              Q ${hipX - 18} 160 ${hipX - 16} 142 Z`}
          fill={isGhost ? 'rgba(17,19,24,0.4)' : '#12151D'}
          stroke={isGhost ? 'rgba(52,211,153,0.42)' : 'rgba(255,255,255,0.2)'}
          strokeWidth={1.05}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />

        {/* Fitted Dark-Slate Crewneck Performance T-Shirt Torso */}
        <path
          d={`M ${shoulderX - 17} 69
              Q ${shoulderX + 2} 63 ${shoulderX + 17} 71
              Q ${shoulderX + 21} 98 ${hipX + 16} 143
              L ${hipX - 16} 143
              Q ${thoracicX - 14} 106 ${shoulderX - 17} 69 Z`}
          fill={`url(#${torsoGradId})`}
          stroke={isGhost ? 'rgba(52,211,153,0.48)' : 'rgba(255,255,255,0.24)'}
          strokeWidth={1.15}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />

        {/* Fitted Short-Sleeve Crewneck Sleeve & Forearm */}
        <path
          d={`M ${shoulderX - 7} 72
              Q ${shoulderX + 7} 72 ${shoulderX + 10} 84
              L ${elbowX + 8} 102
              L ${elbowX - 7} 101
              Z`}
          fill={isGhost ? 'rgba(30,35,46,0.38)' : '#1E232E'}
          stroke={isGhost ? 'rgba(52,211,153,0.42)' : 'rgba(255,255,255,0.2)'}
          strokeWidth={0.95}
          strokeDasharray={isGhost ? '3 3' : undefined}
        />
        <path
          d={`M ${elbowX - 5} 101
              L ${elbowX + 6} 101
              L ${wristX + 4} 139
              L ${wristX - 4} 139 Z`}
          fill={isGhost ? 'rgba(45,51,66,0.34)' : '#2B3140'}
          stroke={isGhost ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.16)'}
          strokeWidth={0.9}
          strokeDasharray={isGhost ? '3 3' : undefined}
        />

        {/* Sculpted Neck & Sagittal Head Profile (Facing Right) */}
        <path
          d={`M ${shoulderX - 6} 69
              L ${tragusX - 6} 53
              L ${tragusX + 6} 55
              L ${shoulderX + 7} 70 Z`}
          fill={isGhost ? 'rgba(39,45,58,0.36)' : '#252B38'}
          stroke={isGhost ? 'rgba(52,211,153,0.36)' : 'rgba(255,255,255,0.16)'}
          strokeWidth={0.9}
        />
        <path
          d={`M ${tragusX - 13} 41
              C ${tragusX - 13} 27, ${tragusX + 10} 25, ${tragusX + 14} 36
              L ${tragusX + 16.5} 42
              L ${tragusX + 14} 45
              Q ${tragusX + 13.5} 53 ${tragusX + 6} 55
              Q ${tragusX - 9} 55 ${tragusX - 13} 41 Z`}
          fill={isGhost ? 'rgba(28,33,43,0.4)' : '#1D222D'}
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeDasharray={isGhost ? '4 3' : undefined}
        />

        {/* CVA Angle Wedge Arc (Plumb -> C7-Tragus Vector) */}
        <path
          d={`M ${shoulderX} ${c7Y} L ${arcStartX.toFixed(1)} ${arcStartY.toFixed(1)} A ${arcR} ${arcR} 0 0 1 ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)} Z`}
          fill={strokeColor}
          fillOpacity={isGhost ? 0.16 : 0.26}
          stroke={strokeColor}
          strokeWidth={0.95}
        />

        {/* Biomechanical Torso Mesh Lattice */}
        <polygon
          points={`${shoulderX - 12},76 ${shoulderX + 12},76 ${hipX + 12},144 ${hipX - 12},144`}
          fill={glowColor}
          fillOpacity={isGhost ? 0.28 : 0.52}
          stroke={strokeColor}
          strokeOpacity={isGhost ? 0.38 : 0.45}
          strokeWidth={0.85}
          strokeDasharray={isGhost ? '3 2.5' : undefined}
        />
        <line
          x1={shoulderX - 12}
          y1={76}
          x2={hipX + 12}
          y2={144}
          stroke={strokeColor}
          strokeOpacity={0.22}
          strokeWidth={0.75}
        />
        <line
          x1={shoulderX + 12}
          y1={76}
          x2={hipX - 12}
          y2={144}
          stroke={strokeColor}
          strokeOpacity={0.22}
          strokeWidth={0.75}
        />

        {/* Pelvic Tilt Plane Indicator */}
        <line
          x1={hipX - 17}
          y1={isBaseline ? 141 : 143.5}
          x2={hipX + 17}
          y2={isBaseline ? 148 : 145}
          stroke={isBaseline ? '#FBBF24' : '#34D399'}
          strokeWidth={1.5}
          strokeLinecap="round"
        />

        {/* Primary Glowing Sagittal Spine & Lower-Limb Kinetic Chain */}
        <path
          d={`M ${tragusX} ${tragusY}
              L ${shoulderX} ${c7Y}
              Q ${thoracicX} 106 ${lumbarX} 127
              L ${hipX} 144
              L ${kneeX} 198
              L ${ankleX} 236`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isGhost ? '4 3' : undefined}
          filter={`url(#${glowFilterId})`}
        />
        <polyline
          points={`${shoulderX},${c7Y} ${elbowX},108 ${wristX},138`}
          fill="none"
          stroke={strokeColor}
          strokeOpacity={0.78}
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />

        {/* Crisp Degree Callout Badge Over Tragus Landmark */}
        <line
          x1={tragusX + 16}
          y1={tragusY - 2}
          x2={tragusX + 30}
          y2={tragusY - 10}
          stroke={strokeColor}
          strokeWidth={0.95}
        />
        <rect
          x={tragusX + 30}
          y={tragusY - 20}
          width={68}
          height={18}
          rx={5}
          fill="rgba(9, 10, 13, 0.9)"
          stroke={strokeColor}
          strokeOpacity={0.8}
          strokeWidth={0.95}
        />
        <text
          x={tragusX + 64}
          y={tragusY - 8.5}
          textAnchor="middle"
          fill={isGhost ? '#6EE7B7' : '#F8FAFC'}
          fontSize="7.8"
          fontFamily="monospace"
          fontWeight="700"
        >
          {isGhost ? 'TARGET ≤4°' : `CVA +${effectiveDeg.toFixed(1)}°`}
        </text>

        {/* Dual-Ring Anatomical Landmark Nodes */}
        {[
          { x: tragusX, y: tragusY, conf: 0.99 },
          { x: shoulderX, y: c7Y, conf: 0.97 },
          { x: thoracicX, y: 106, conf: 0.93 },
          { x: lumbarX, y: 127, conf: 0.92 },
          { x: elbowX, y: 108, conf: 0.89 },
          { x: wristX, y: 138, conf: 0.88 },
          { x: hipX, y: 144, conf: 0.97 },
          { x: kneeX, y: 198, conf: 0.95 },
          { x: ankleX, y: 236, conf: 0.93 },
        ].map((pt, idx) => (
          <g key={idx} opacity={isGhost ? 0.58 : pt.conf}>
            <circle cx={pt.x} cy={pt.y} r={5.4} fill={strokeColor} fillOpacity={0.22} />
            <circle cx={pt.x} cy={pt.y} r={2.6} fill={strokeColor} stroke="#090A0D" strokeWidth={1.1} />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function PostureComparisonInteractiveStage({
  sandboxMode = false,
  remoteActive = false,
  onRequestUpgrade,
  showPostScanBanner = false,
  initialDroppedFile = null,
  onConsumedDroppedFile,
}: PostureComparisonViewerProps) {
  const { tierId } = useTierAccess()
  const isCoachSupport = tierId === 'coach_support'
  const sliderId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const baselineFileInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scanAnimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  const [escalationOpen, setEscalationOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'overlay' | 'side_by_side' | 'day1_preview'>('overlay')
  const [splitPct, setSplitPct] = useState(54)
  const [delta, setDelta] = useState<PostureDeltaSummary>(() => createInitialDelta(sandboxMode))
  const [day30ReminderArmed, setDay30ReminderArmed] = useState(false)
  const [remoteCountdownSec, setRemoteCountdownSec] = useState<number>(0)
  const [isScanningSweep, setIsScanningSweep] = useState(false)
  const [scanStatusBanner, setScanStatusBanner] = useState<string | null>(null)
  const [baselinePhotoUrl, setBaselinePhotoUrl] = useState<string | null>(null)
  const [baselineMesh, setBaselineMesh] = useState<StandingPostureScanEvaluation | null>(null)
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null)
  const [detectedMesh, setDetectedMesh] = useState<StandingPostureScanEvaluation | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [sideDropHover, setSideDropHover] = useState<'baseline' | 'current' | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraCountdownSec, setCameraCountdownSec] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const sliderInputRef = useRef<HTMLInputElement | null>(null)
  const draggingRef = useRef(false)
  const remoteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopSandboxCamera = useCallback(() => {
    if (cameraTimerRef.current) {
      clearInterval(cameraTimerRef.current)
      cameraTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream
      s.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setCameraCountdownSec(null)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (scanAnimTimerRef.current) clearTimeout(scanAnimTimerRef.current)
      stopSandboxCamera()
    }
  }, [stopSandboxCamera])

  useEffect(() => {
    if (typeof window === 'undefined' || (!sandboxMode && !remoteActive)) return
    void getOrInitStandingPoseLandmarker().catch(() => {})
  }, [remoteActive, sandboxMode])

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      void videoRef.current.play().catch(() => {})
    }
  }, [cameraActive])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cameraActive) {
        stopSandboxCamera()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cameraActive, stopSandboxCamera])

  useEffect(() => {
    if (sandboxMode) return
    const sync = () => setDelta(loadPostureProfileState().postureDelta)
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [sandboxMode])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(DAY30_REMINDER_KEY) === '1') {
        setDay30ReminderArmed(true)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const el = sliderInputRef.current
    if (!el) return
    el.style.setProperty('--attr-min', '6')
    el.style.setProperty('--attr-max', '94')
    el.style.setProperty('--control-value', String(splitPct))
  }, [splitPct, viewMode])

  const baselineMeshRef = useRef<StandingPostureScanEvaluation | null>(null)
  baselineMeshRef.current = baselineMesh
  const detectedMeshRef = useRef<StandingPostureScanEvaluation | null>(null)
  detectedMeshRef.current = detectedMesh
  const viewModeRef = useRef(viewMode)
  viewModeRef.current = viewMode

  const analyzeImagePoseLocally = useCallback(
    async (
      sourceEl: HTMLImageElement | HTMLCanvasElement,
      dataUrl: string,
      slot: 'baseline' | 'current' = 'current'
    ) => {
      const imgWidth =
        sourceEl instanceof HTMLImageElement
          ? sourceEl.naturalWidth || sourceEl.width
          : sourceEl.width
      const imgHeight =
        sourceEl instanceof HTMLImageElement
          ? sourceEl.naturalHeight || sourceEl.height
          : sourceEl.height

      setIsScanningSweep(true)
      setCameraError(null)

      try {
        const landmarker = await Promise.race([
          getOrInitStandingPoseLandmarker(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 10000)),
        ])

        if (!isMountedRef.current) return

        if (!landmarker) {
          setCameraError('33-point vision model timed out while loading. Please try again.')
          return
        }

        const detection = landmarker.detect(sourceEl)
        const firstPose = detection?.landmarks?.[0]
        const firstWorldPose = detection?.worldLandmarks?.[0]

        if (!firstPose) {
          setCameraError(
            'No standing or seated person detected in frame. Ensure head, shoulders, and torso are clearly visible in good lighting.'
          )
          return
        }

        const refBaselineCva =
          slot === 'current' && baselineMeshRef.current ? baselineMeshRef.current.cvaDeg : 8.9

        const evaluated = evaluateStandingPostureFromMediaPipe(firstPose, {
          imageWidth: imgWidth,
          imageHeight: imgHeight,
          worldLandmarks: firstWorldPose,
          baselineCvaDeg: refBaselineCva,
        })

        if (!evaluated) {
          setCameraError(
            'Ear and shoulder landmarks were outside the frame. Step back slightly so your full posture is visible.'
          )
          return
        }

        if (slot === 'baseline') {
          setBaselineMesh(evaluated)
          setBaselinePhotoUrl(dataUrl)
          if (viewModeRef.current === 'day1_preview') {
            setViewMode('side_by_side')
          } else if (viewModeRef.current === 'overlay' && detectedMeshRef.current) {
            setSplitPct(50)
          }
          // If a Current photo is also loaded, recompute Before -> After delta between the two real photos
          if (detectedMeshRef.current) {
            const cur = detectedMeshRef.current
            const pairHeadDelta = Number((cur.cvaDeg - evaluated.cvaDeg).toFixed(1))
            setDelta(prev => ({
              ...prev,
              forwardHeadDeltaDeg: pairHeadDelta,
              shoulderSymmetryDeltaDeg: cur.shoulderDeltaDeg,
              pelvicTiltDeltaDeg: cur.pelvicDriftDeg,
              overallPostureScore: cur.score,
              strainFlag: cur.strainFlag,
            }))
            setScanStatusBanner(
              `Baseline (${evaluated.score}/100 · CVA ${evaluated.cvaDeg.toFixed(1)}°) vs Current (${cur.score}/100 · CVA ${cur.cvaDeg.toFixed(1)}°) locked.`
            )
          } else {
            setScanStatusBanner(
              `Baseline photo locked (${evaluated.trackedNodeCount}/33 nodes · CVA ${evaluated.cvaDeg.toFixed(1)}° · Score ${evaluated.score}/100). Drop a 2nd photo on Current to compare!`
            )
          }
          playForgeTactileTone('success')
          if (!sandboxMode) {
            const spokenSummary = buildPostScanDiagnosticSummary({
              scanType: 'posture_2min',
              score: evaluated.score,
              primaryFinding: `baseline forward-head angle ${evaluated.cvaDeg.toFixed(1)} degrees`,
            })
            void speakCoachDynamicText(spokenSummary, { moment: 'post_scan_summary' })
          }
          return
        }

        const nextDelta: PostureDeltaSummary = {
          baselineDate: delta.baselineDate,
          latestDate: getTodayIsoDate(),
          forwardHeadDeltaDeg: evaluated.forwardHeadDeltaDeg,
          shoulderSymmetryDeltaDeg: evaluated.shoulderDeltaDeg,
          pelvicTiltDeltaDeg: evaluated.pelvicDriftDeg,
          overallPostureScore: evaluated.score,
          strainFlag: evaluated.strainFlag,
        }

        setDetectedMesh(evaluated)
        setCapturedPhotoUrl(dataUrl)
        // Preserve Side-by-Side if user is comparing side-by-side; only exit day1_preview
        if (viewModeRef.current === 'day1_preview') {
          setViewMode('overlay')
        }
        if (viewModeRef.current !== 'side_by_side') {
          setSplitPct(baselineMeshRef.current ? 50 : 36)
        }
        setDelta(nextDelta)

        if (!sandboxMode) {
          savePostureProfileState(prev => ({
            ...prev,
            postureDelta: nextDelta,
          }))
          void trackEvent('posture_scan_completed', {
            scan_mode: 'full_33_point_mesh',
            overall_posture_score: evaluated.score,
            forward_head_tilt_deg: evaluated.cvaDeg,
            shoulder_symmetry_deg: evaluated.shoulderDeltaDeg,
            pelvic_symmetry_deg: evaluated.pelvicDriftDeg,
            joint_deltas_33: {
              forward_head_delta_deg: evaluated.forwardHeadDeltaDeg,
              shoulder_symmetry_delta_deg: evaluated.shoulderDeltaDeg,
              pelvic_tilt_delta_deg: evaluated.pelvicDriftDeg,
            },
          })
          const spokenSummary = buildPostScanDiagnosticSummary({
            scanType: 'posture_2min',
            score: evaluated.score,
            primaryFinding: `craniovertebral angle ${evaluated.cvaDeg.toFixed(1)} degrees and pelvic drift ${Math.abs(evaluated.pelvicDriftDeg).toFixed(1)} degrees`,
          })
          void speakCoachDynamicText(spokenSummary, { moment: 'post_scan_summary' })
        }

        if (baselineMeshRef.current) {
          const base = baselineMeshRef.current
          setScanStatusBanner(
            `Before/After locked · Baseline ${base.score}/100 (${base.cvaDeg.toFixed(1)}°) → Current ${evaluated.score}/100 (${evaluated.cvaDeg.toFixed(1)}°)`
          )
        } else {
          setScanStatusBanner(
            sandboxMode
              ? `Local frame analyzed in browser (0 bytes uploaded) · ${evaluated.trackedNodeCount}/33 nodes · Score ${evaluated.score}/100`
              : `33-point posture mesh locked (${evaluated.trackedNodeCount}/33 nodes · CVA ${evaluated.cvaDeg.toFixed(1)}°) · Posture Score ${evaluated.score}/100`
          )
        }
        playForgeTactileTone('success')
      } catch {
        if (!isMountedRef.current) return
        setCameraError(
          'Local 33-point vision engine could not run in this browser context. Check WebGL/WebAssembly settings.'
        )
      } finally {
        if (isMountedRef.current) {
          setIsScanningSweep(false)
        }
      }
    },
    [delta.baselineDate, sandboxMode]
  )

  const analyzeImageRef = useRef(analyzeImagePoseLocally)
  analyzeImageRef.current = analyzeImagePoseLocally

  const handleStartSandboxCamera = async () => {
    setCameraError(null)
    setScanStatusBanner(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera stream unavailable on this browser. Upload a side photo or run Quick Check.')
      return
    }
    void getOrInitStandingPoseLandmarker().catch(() => {})
    try {
      stopSandboxCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop())
        return
      }
      streamRef.current = stream
      setCameraActive(true)
      setCameraCountdownSec(5)
      playForgeTactileTone('cue')

      let rem = 5
      cameraTimerRef.current = setInterval(() => {
        rem -= 1
        if (rem > 0) {
          setCameraCountdownSec(rem)
          if (rem === 2) {
            playCoachStaticCue('calibration_locked')
          } else {
            playForgeTactileTone('countdown')
          }
        } else {
          if (cameraTimerRef.current) {
            clearInterval(cameraTimerRef.current)
            cameraTimerRef.current = null
          }
          const video = videoRef.current
          if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
              stopSandboxCamera()
              void analyzeImageRef.current(canvas, dataUrl)
              return
            }
          }
          stopSandboxCamera()
        }
      }, 1000)
    } catch {
      stopSandboxCamera()
      setCameraError('Camera access was declined or blocked. Upload a photo or run the interactive Quick Check.')
    }
  }

  const processPostureFile = useCallback(
    (file: File, slot: 'baseline' | 'current' = 'current') => {
      if (file.type && !/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(file.type)) {
        setCameraError('Please choose a JPEG, PNG, WebP, or HEIC side-profile image.')
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        setCameraError('Posture photo must be 15 MB or smaller.')
        return
      }
      setCameraError(null)
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : null
        if (!dataUrl) return
        const img = new window.Image()
        img.onload = () => {
          void analyzeImageRef.current(img, dataUrl, slot)
        }
        img.onerror = () => {
          setCameraError('Could not decode image file. Please try a JPEG, PNG, or WebP photo.')
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    []
  )

  useEffect(() => {
    if (!initialDroppedFile) return
    processPostureFile(initialDroppedFile, 'current')
    onConsumedDroppedFile?.()
  }, [initialDroppedFile, onConsumedDroppedFile, processPostureFile])

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    processPostureFile(file, 'current')
  }

  const handleBaselinePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    processPostureFile(file, 'baseline')
  }

  const handleStageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleStageDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setIsDragOver(false)
  }

  const handleStageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setSideDropHover(null)
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    if (files.length >= 2) {
      // Dropping 2 photos at once loads Photo 1 as Baseline (Before) and Photo 2 as Current (After)
      processPostureFile(files[0], 'baseline')
      processPostureFile(files[1], 'current')
      return
    }
    processPostureFile(files[0], 'current')
  }

  const handleRunQuickScan = () => {
    setCameraError(null)
    if (viewMode === 'day1_preview') {
      setViewMode('overlay')
    }
    setIsScanningSweep(true)
    if (scanAnimTimerRef.current) clearTimeout(scanAnimTimerRef.current)
    scanAnimTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setIsScanningSweep(false)
    }, 1200)

    if (sandboxMode) {
      setDelta(prev => {
        const nextHead =
          prev.forwardHeadDeltaDeg <= -6.2
            ? -4.5
            : Number((prev.forwardHeadDeltaDeg - 0.6).toFixed(1))
        const nextPelvic =
          prev.pelvicTiltDeltaDeg >= -1.4
            ? -2.8
            : Number((prev.pelvicTiltDeltaDeg + 0.5).toFixed(1))
        const nextScore =
          prev.overallPostureScore >= 94 ? 86 : Math.min(95, prev.overallPostureScore + 4)
        const nextStrain = nextScore >= 88 ? 'optimal' : 'amber'
        setScanStatusBanner(
          `33-Point Quick Check locked · Forward Head ${nextHead.toFixed(1)}° · Score ${nextScore}/100`
        )
        return {
          ...prev,
          forwardHeadDeltaDeg: nextHead,
          pelvicTiltDeltaDeg: nextPelvic,
          overallPostureScore: nextScore,
          strainFlag: nextStrain,
        }
      })
      playForgeTactileTone('success')
      return
    }

    const updated = runQuickPostureCheckDelta()
    setDelta(updated)
    playForgeTactileTone('success')

    const spokenSummary = buildPostScanDiagnosticSummary({
      scanType: 'posture_2min',
      score: updated.overallPostureScore,
      primaryFinding: `forward-head delta ${updated.forwardHeadDeltaDeg.toFixed(1)} degrees and pelvic drift ${updated.pelvicTiltDeltaDeg.toFixed(1)} degrees`,
    })
    void speakCoachDynamicText(spokenSummary, { moment: 'post_scan_summary' })

    void trackEvent('posture_scan_completed', {
      scan_mode: 'quick_check',
      overall_posture_score: updated.overallPostureScore,
      forward_head_tilt_deg: updated.forwardHeadDeltaDeg,
      shoulder_symmetry_deg: updated.shoulderSymmetryDeltaDeg,
      pelvic_symmetry_deg: updated.pelvicTiltDeltaDeg,
      joint_deltas_33: {
        forward_head_delta_deg: updated.forwardHeadDeltaDeg,
        shoulder_symmetry_delta_deg: updated.shoulderSymmetryDeltaDeg,
        pelvic_tilt_delta_deg: updated.pelvicTiltDeltaDeg,
      },
    })
  }

  // Bidirectional Apple Watch Wrist Camera Remote sync (2-Minute Quick Posture Check)
  useEffect(() => {
    if (sandboxMode || !remoteActive) return
    const locked = remoteCountdownSec > 0 && remoteCountdownSec <= 2
    void syncCameraRemoteStateToWatch({
      isActive: true,
      mode: 'quick_posture',
      modeTitle: '2-Min Posture Check',
      framingStatus: locked ? 'locked' : remoteCountdownSec > 0 ? 'recording' : 'locked',
      isRecording: remoteCountdownSec > 0,
      countdownSeconds: remoteCountdownSec,
      repCount: 0,
      targetReps: 1,
      statusHint:
        remoteCountdownSec > 0
          ? `Hold tall posture (${remoteCountdownSec}s)`
          : 'Locked · Emerald — Tap Start 5s Timer on Watch',
    })
  }, [remoteActive, remoteCountdownSec, sandboxMode])

  useEffect(() => {
    if (sandboxMode || !remoteActive) return
    let cleanupWatchSub: (() => void) | null = null

    void subscribeToWatchCameraCommand(cmd => {
      if (cmd.command === 'startTimer5s' || cmd.command === 'recordRep') {
        if (remoteTimerRef.current) clearInterval(remoteTimerRef.current)
        let rem = 5
        setRemoteCountdownSec(5)
        playForgeTactileTone('countdown')
        remoteTimerRef.current = setInterval(() => {
          rem -= 1
          if (rem > 0) {
            setRemoteCountdownSec(rem)
            playForgeTactileTone('countdown')
          } else {
            if (remoteTimerRef.current) {
              clearInterval(remoteTimerRef.current)
              remoteTimerRef.current = null
            }
            setRemoteCountdownSec(0)
            handleRunQuickScan()
          }
        }, 1000)
      } else if (cmd.command === 'stopAndReview') {
        if (remoteTimerRef.current) {
          clearInterval(remoteTimerRef.current)
          remoteTimerRef.current = null
        }
        setRemoteCountdownSec(0)
        handleRunQuickScan()
      } else if (cmd.command === 'dismissRemote') {
        if (remoteTimerRef.current) {
          clearInterval(remoteTimerRef.current)
          remoteTimerRef.current = null
        }
        setRemoteCountdownSec(0)
      }
    }).then(unsub => {
      cleanupWatchSub = unsub
    })

    return () => {
      if (remoteTimerRef.current) {
        clearInterval(remoteTimerRef.current)
        remoteTimerRef.current = null
      }
      cleanupWatchSub?.()
      void syncCameraRemoteStateToWatch({
        isActive: false,
        mode: 'quick_posture',
        modeTitle: '2-Min Posture Check',
        framingStatus: 'framing',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteActive, sandboxMode])

  const handleArmDay30Reminder = () => {
    const next = !day30ReminderArmed
    setDay30ReminderArmed(next)
    try {
      if (typeof window !== 'undefined') {
        if (next) localStorage.setItem(DAY30_REMINDER_KEY, '1')
        else localStorage.removeItem(DAY30_REMINDER_KEY)
      }
    } catch {
      // ignore
    }
    playForgeTactileTone('chime')
  }

  const updateSplitFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const rawPct = ((clientX - rect.left) / rect.width) * 100
    setSplitPct(Math.round(Math.max(6, Math.min(94, rawPct))))
  }

  const baselineDeg = baselineMesh ? baselineMesh.cvaDeg : 8.9
  const currentDeg = detectedMesh
    ? detectedMesh.cvaDeg
    : Number(Math.max(0, baselineDeg + delta.forwardHeadDeltaDeg).toFixed(1))
  const hasTwoPhotos = Boolean(
    baselinePhotoUrl && baselineMesh && capturedPhotoUrl && detectedMesh
  )
  const hasSinglePhoto = Boolean(
    !hasTwoPhotos &&
      ((capturedPhotoUrl && detectedMesh) || (baselinePhotoUrl && baselineMesh))
  )
  const singlePhotoUrl = (capturedPhotoUrl || baselinePhotoUrl) as string | null
  const singlePhotoEval = (detectedMesh || baselineMesh) as StandingPostureScanEvaluation | null
  const postScanCopy = getUpgradeTriggerCopy('post_scan_flag', 'core_lab')
  const strainTextClass =
    delta.strainFlag === 'optimal'
      ? 'text-emerald-300'
      : delta.strainFlag === 'amber'
        ? 'text-amber-300'
        : 'text-rose-300'

  return (
    <div
      onDragOver={handleStageDragOver}
      onDragLeave={handleStageDragLeave}
      onDrop={handleStageDrop}
      className={`space-y-3.5 rounded-2xl text-zinc-100 transition-shadow duration-150 ${
        isDragOver ? 'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[#090A0D]' : ''
      }`}
    >
      {/* Top Toolbar: View Switcher + Interactive Scan / Local Camera Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Posture comparison view mode"
          className="inline-flex flex-wrap rounded-xl border border-white/[0.08] bg-[#111318] p-1"
        >
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            aria-pressed={viewMode === 'overlay'}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
              viewMode === 'overlay'
                ? 'bg-[#181B22] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={13} strokeWidth={1.75} aria-hidden="true" /> Overlay Slider
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side_by_side')}
            aria-pressed={viewMode === 'side_by_side'}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
              viewMode === 'side_by_side'
                ? 'bg-[#181B22] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Columns size={13} strokeWidth={1.75} aria-hidden="true" /> Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day1_preview')}
            aria-pressed={viewMode === 'day1_preview'}
            className={`forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors duration-150 ${
              viewMode === 'day1_preview'
                ? 'bg-[#181B22] text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck size={13} strokeWidth={1.75} aria-hidden="true" /> Day-1 vs Day-30
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!cameraActive ? (
            <>
              <button
                type="button"
                onClick={() => void handleStartSandboxCamera()}
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors duration-150 hover:border-emerald-400/40 hover:bg-[#1D212A]"
              >
                <Camera size={14} strokeWidth={1.75} className="text-emerald-300" aria-hidden="true" />
                <span>5s Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3 py-2 text-xs font-semibold text-zinc-100 transition-colors duration-150 hover:border-white/25 hover:bg-[#1D212A]"
              >
                <Upload size={14} strokeWidth={1.75} className="text-amber-300" aria-hidden="true" />
                <span>Upload Photo</span>
              </button>
              {capturedPhotoUrl && !baselinePhotoUrl ? (
                <button
                  type="button"
                  onClick={() => baselineFileInputRef.current?.click()}
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors duration-150 hover:bg-amber-500/20"
                >
                  <Upload size={13} strokeWidth={1.75} aria-hidden="true" />
                  <span>+ Baseline Photo</span>
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label="Upload side-profile posture photo"
              />
              <input
                ref={baselineFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBaselinePhotoUpload}
                className="hidden"
                aria-label="Upload baseline comparison posture photo"
              />
              {capturedPhotoUrl || baselinePhotoUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhotoUrl(null)
                    setDetectedMesh(null)
                    setBaselinePhotoUrl(null)
                    setBaselineMesh(null)
                    setSplitPct(54)
                    setDelta(
                      sandboxMode
                        ? createInitialDelta(true)
                        : loadPostureProfileState().postureDelta
                    )
                    setScanStatusBanner(null)
                  }}
                  aria-label="Reset sample posture mesh"
                  className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-white/10 bg-[#111318] px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  <RotateCcw size={13} strokeWidth={1.75} aria-hidden="true" />
                  <span>Reset</span>
                </button>
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            onClick={handleRunQuickScan}
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 transition-colors duration-150 hover:border-emerald-400/50 hover:bg-emerald-500/25"
          >
            <ScanLine size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>{isScanningSweep ? 'Scanning 33 Nodes…' : 'Run 2-Min Quick Check'}</span>
          </button>
        </div>
      </div>

      {/* Camera Permission / File Validation Feedback */}
      {cameraError ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-[#181B22] px-3.5 py-2.5 text-xs text-amber-200"
        >
          <span>{cameraError}</span>
          <button
            type="button"
            onClick={handleRunQuickScan}
            className="forge-tactile-press inline-flex min-h-[44px] items-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200"
          >
            Simulate Scan Instead
          </button>
        </div>
      ) : null}

      {/* Live 5-Second Local Camera Capture Viewfinder */}
      {cameraActive ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-emerald-400/50 bg-[#090A0D]">
          <video
            ref={videoRef}
            muted
            playsInline
            className="block h-full w-full object-cover"
          />
          <div className="forge-glass-pill absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2 rounded-full px-3.5 py-1.5 text-xs text-zinc-100">
            <span className="truncate">
              Stand tall in side profile · <strong>Ear → Shoulder → Hip → Ankle</strong>
            </span>
            <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              LOCAL IN-BROWSER
            </span>
          </div>
          <div className="forge-glass-pill absolute inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold tabular-nums text-emerald-300">
                {cameraCountdownSec ?? 5}s
              </span>
              <span className="text-xs text-zinc-200">Capturing 33-point sagittal frame…</span>
            </div>
            <button
              type="button"
              onClick={stopSandboxCamera}
              className="forge-tactile-press min-h-[44px] rounded-xl border border-white/15 bg-[#181B22] px-3.5 text-xs font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : viewMode === 'overlay' ? (
        <div
          ref={stageRef}
          onPointerDown={e => {
            if ((e.target as HTMLElement).tagName === 'INPUT') return
            draggingRef.current = true
            e.currentTarget.setPointerCapture?.(e.pointerId)
            updateSplitFromClientX(e.clientX)
          }}
          onPointerMove={e => {
            if (!draggingRef.current) return
            updateSplitFromClientX(e.clientX)
          }}
          onPointerUp={() => {
            draggingRef.current = false
          }}
          onPointerCancel={() => {
            draggingRef.current = false
          }}
          style={{ touchAction: 'pan-y' }}
          className={`relative w-full cursor-ew-resize overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0B0E14] ${
            hasTwoPhotos || hasSinglePhoto ? 'h-80 sm:h-96' : 'h-72 sm:h-80'
          }`}
        >
          {/* Right / Base Layer: 33-Point Analyzed Mesh (Current Photo, Single Photo X-Ray, or Synthetic Reference) */}
          <div className="absolute inset-0 flex items-center justify-center p-2 pb-14 sm:p-3 sm:pb-14">
            {hasTwoPhotos && capturedPhotoUrl && detectedMesh ? (
              <CapturedPostureMeshStage photoUrl={capturedPhotoUrl} evaluation={detectedMesh} showMesh />
            ) : hasSinglePhoto && singlePhotoUrl && singlePhotoEval ? (
              <CapturedPostureMeshStage photoUrl={singlePhotoUrl} evaluation={singlePhotoEval} showMesh />
            ) : (
              <PostureSilhouetteSvg
                variant="current"
                measuredDeg={currentDeg}
                pelvicDriftDeg={delta.pelvicTiltDeltaDeg}
              />
            )}
          </div>

          {/* Left / Clipped Layer: Either Baseline Photo Mesh (2 photos), Clean Original Photo (1 photo X-Ray reveal), or Day-1 Reference (0 photos) */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-[#0B0E14] p-2 pb-14 sm:p-3 sm:pb-14"
            style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
          >
            {hasTwoPhotos && baselinePhotoUrl && baselineMesh ? (
              <CapturedPostureMeshStage photoUrl={baselinePhotoUrl} evaluation={baselineMesh} showMesh />
            ) : hasSinglePhoto && singlePhotoUrl && singlePhotoEval ? (
              <CapturedPostureMeshStage
                photoUrl={singlePhotoUrl}
                evaluation={singlePhotoEval}
                showMesh={false}
              />
            ) : (
              <PostureSilhouetteSvg variant="baseline" measuredDeg={baselineDeg} pelvicDriftDeg={-6.2} />
            )}
          </div>

          {/* Animated 33-Point Laser Sweep Overlay when Quick Check / Photo Scan runs */}
          {isScanningSweep ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 overflow-hidden bg-emerald-500/[0.04]"
            >
              <div
                className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_24px_rgba(52,211,153,0.95)]"
                style={{
                  animation: 'pulse 0.6s ease-in-out infinite',
                  marginTop: '44%',
                }}
              />
              <div className="absolute inset-x-0 bottom-16 flex justify-center">
                <span className="rounded-full border border-emerald-400/50 bg-[#090A0D]/92 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-300 shadow-lg">
                  Locking 33 Sagittal Landmarks…
                </span>
              </div>
            </div>
          ) : null}

          {/* Vertical Laser-Hairline Divider + 44px Circular Thumb Grip */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-px bg-gradient-to-b from-emerald-300/35 via-emerald-400 to-emerald-300/35 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
            style={{ left: `${splitPct}%` }}
          >
            <div className="absolute top-[44%] left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-emerald-400/60 bg-[#111318]/92 text-emerald-300 shadow-[0_4px_18px_rgba(0,0,0,0.75),0_0_16px_rgba(52,211,153,0.3)] backdrop-blur-md">
              <GripVertical size={16} strokeWidth={1.75} />
            </div>
          </div>

          <div className="pointer-events-none absolute left-2.5 top-2.5 rounded-full border border-amber-500/35 bg-black/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider tabular-nums text-amber-300 backdrop-blur-md">
            {hasTwoPhotos && baselineMesh
              ? `Baseline (${baselineMesh.cvaDeg.toFixed(1)}° · ${baselineMesh.score}/100)`
              : hasSinglePhoto
                ? 'Original Photo'
                : `Baseline (${baselineDeg}°)`}
          </div>
          <div
            className={`pointer-events-none absolute right-2.5 top-2.5 rounded-full border bg-black/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider tabular-nums backdrop-blur-md ${
              delta.strainFlag === 'optimal'
                ? 'border-emerald-500/35 text-emerald-300'
                : delta.strainFlag === 'amber'
                  ? 'border-amber-500/35 text-amber-300'
                  : 'border-rose-500/35 text-rose-300'
            }`}
          >
            {hasTwoPhotos && detectedMesh
              ? `Current (${detectedMesh.cvaDeg.toFixed(1)}° · ${detectedMesh.score}/100)`
              : hasSinglePhoto && singlePhotoEval
                ? `33-Pt Mesh (${singlePhotoEval.cvaDeg.toFixed(1)}° · ${singlePhotoEval.score}/100)`
                : `Current (${currentDeg}°)`}
          </div>

          <div className="absolute inset-x-2.5 bottom-2.5 rounded-xl border border-white/10 bg-[#111318]/90 px-3 py-0.5 backdrop-blur-xl sm:inset-x-3 sm:px-3.5">
            <div className="flex items-center gap-2.5 text-[11px] font-semibold text-zinc-200 sm:gap-3">
              <label htmlFor={sliderId} className="shrink-0 cursor-pointer">
                {hasSinglePhoto ? 'Scrub X-Ray' : 'Scrub Mesh'}
              </label>
              <input
                ref={sliderInputRef}
                id={sliderId}
                type="range"
                min={6}
                max={94}
                step={1}
                value={splitPct}
                onChange={e => setSplitPct(Number(e.target.value))}
                aria-label="Compare baseline and current 33-point posture alignment"
                aria-valuetext={`${splitPct}% baseline to ${100 - splitPct}% current posture alignment`}
                style={
                  {
                    touchAction: 'pan-y',
                    '--attr-min': 6,
                    '--attr-max': 94,
                    '--control-value': splitPct,
                  } as React.CSSProperties
                }
                className="forge-range-slider flex-1"
              />
              <span className="w-10 text-right font-mono font-bold tabular-nums text-emerald-300">
                {splitPct}%
              </span>
            </div>
          </div>
        </div>
      ) : viewMode === 'side_by_side' ? (
        <div className="grid grid-cols-1 gap-2.5 sm:h-80 sm:grid-cols-2">
          {/* Left Panel: Baseline / Before Photo Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault()
              e.stopPropagation()
              if (sideDropHover !== 'baseline') setSideDropHover('baseline')
            }}
            onDragLeave={e => {
              e.preventDefault()
              e.stopPropagation()
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
              setSideDropHover(null)
            }}
            onDrop={e => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragOver(false)
              setSideDropHover(null)
              const file = e.dataTransfer?.files?.[0]
              if (file) processPostureFile(file, 'baseline')
            }}
            className={`relative flex h-64 min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl border bg-[#0B0E14] p-2 pt-10 transition-colors sm:h-full ${
              sideDropHover === 'baseline'
                ? 'border-amber-400 ring-2 ring-amber-400/70'
                : 'border-amber-500/25'
            }`}
          >
            <span className="absolute left-2.5 top-2.5 z-10 rounded-full border border-amber-500/30 bg-black/80 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-amber-300 backdrop-blur-md">
              {baselineMesh
                ? `Baseline · ${baselineMesh.cvaDeg.toFixed(1)}° · ${baselineMesh.score}/100`
                : `Baseline · ${baselineDeg}°`}
            </span>
            <button
              type="button"
              onClick={() => baselineFileInputRef.current?.click()}
              className="forge-tactile-press absolute right-2 top-2 z-10 inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-white/12 bg-black/80 px-3 py-1.5 text-[10.5px] font-semibold text-zinc-200 backdrop-blur-md hover:border-amber-400/50 hover:text-white"
            >
              <Upload size={11} aria-hidden="true" />
              <span>{baselinePhotoUrl ? 'Replace' : 'Drop / Upload'}</span>
            </button>
            {baselinePhotoUrl && baselineMesh ? (
              <CapturedPostureMeshStage photoUrl={baselinePhotoUrl} evaluation={baselineMesh} />
            ) : (
              <PostureSilhouetteSvg variant="baseline" measuredDeg={baselineDeg} compact />
            )}
          </div>

          {/* Right Panel: Current / After Photo Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault()
              e.stopPropagation()
              if (sideDropHover !== 'current') setSideDropHover('current')
            }}
            onDragLeave={e => {
              e.preventDefault()
              e.stopPropagation()
              if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
              setSideDropHover(null)
            }}
            onDrop={e => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragOver(false)
              setSideDropHover(null)
              const file = e.dataTransfer?.files?.[0]
              if (file) processPostureFile(file, 'current')
            }}
            className={`relative flex h-64 min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl border bg-[#0B0E14] p-2 pt-10 transition-colors sm:h-full ${
              sideDropHover === 'current'
                ? 'border-emerald-400 ring-2 ring-emerald-400/70'
                : 'border-emerald-500/25'
            }`}
          >
            <span
              className={`absolute left-2.5 top-2.5 z-10 rounded-full border bg-black/80 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums backdrop-blur-md ${
                delta.strainFlag === 'optimal'
                  ? 'border-emerald-500/30 text-emerald-300'
                  : delta.strainFlag === 'amber'
                    ? 'border-amber-500/30 text-amber-300'
                    : 'border-rose-500/30 text-rose-300'
              }`}
            >
              {detectedMesh
                ? `Current · ${detectedMesh.cvaDeg.toFixed(1)}° · ${detectedMesh.score}/100`
                : `Current · ${currentDeg}°`}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="forge-tactile-press absolute right-2 top-2 z-10 inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-white/12 bg-black/80 px-3 py-1.5 text-[10.5px] font-semibold text-zinc-200 backdrop-blur-md hover:border-emerald-400/50 hover:text-white"
            >
              <Upload size={11} aria-hidden="true" />
              <span>{capturedPhotoUrl ? 'Replace' : 'Drop / Upload'}</span>
            </button>
            {capturedPhotoUrl && detectedMesh ? (
              <CapturedPostureMeshStage photoUrl={capturedPhotoUrl} evaluation={detectedMesh} />
            ) : (
              <PostureSilhouetteSvg
                variant="current"
                measuredDeg={currentDeg}
                pelvicDriftDeg={delta.pelvicTiltDeltaDeg}
                compact
              />
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0E14] p-3.5 sm:p-4">
          <div className="grid grid-cols-1 gap-2.5 sm:h-64 sm:grid-cols-2">
            <div className="relative flex h-56 min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-amber-500/25 bg-[#111318] p-2 pt-8 sm:h-full">
              <span className="absolute left-2.5 top-2.5 rounded-full border border-amber-500/30 bg-black/80 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-amber-300 backdrop-blur-md">
                Day-1 Baseline ({baselineDeg}°)
              </span>
              <PostureSilhouetteSvg variant="baseline" measuredDeg={baselineDeg} compact />
            </div>

            <div className="relative flex h-56 min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-emerald-500/35 bg-[#111318]/50 p-2 pt-8 sm:h-full">
              <span className="absolute left-2.5 top-2.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Day-30 Target Preview
              </span>
              <PostureSilhouetteSvg variant="day30_ghost" compact />
            </div>
          </div>

          <div className="mt-3 flex flex-col justify-between gap-2.5 rounded-xl border border-white/[0.07] bg-[#111318] p-3 sm:flex-row sm:items-center">
            <div className="text-xs leading-relaxed text-zinc-300">
              <strong className="text-white">Day-1 Baseline Locked:</strong> Consistent 5-minute desk
              resets and Phase 01 stabilization typically reduce forward-head drift by{' '}
              <span className="font-mono font-bold tabular-nums text-emerald-300">3.5°–5.0°</span> in
              30 days.
            </div>
            <button
              type="button"
              onClick={handleArmDay30Reminder}
              aria-pressed={day30ReminderArmed}
              className={`forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors duration-150 ${
                day30ReminderArmed
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
                  : 'border-white/12 bg-[#181B22] text-white hover:border-white/20 hover:bg-[#1D212A]'
              }`}
            >
              {day30ReminderArmed ? (
                <>
                  <Check size={14} strokeWidth={1.75} aria-hidden="true" /> Day-30 Reminder Set
                </>
              ) : (
                <>
                  <Bell size={14} strokeWidth={1.75} aria-hidden="true" /> Set Day-30 Reminder
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Interactive Scan Confirmation Banner */}
      {scanStatusBanner ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200"
        >
          <span className="font-medium">✓ {scanStatusBanner}</span>
          {sandboxMode ? (
            <button
              type="button"
              onClick={() => {
                const spokenSummary = buildPostScanDiagnosticSummary({
                  scanType: 'posture_2min',
                  score: delta.overallPostureScore,
                  primaryFinding: `forward-head delta ${delta.forwardHeadDeltaDeg.toFixed(1)} degrees and pelvic drift ${delta.pelvicTiltDeltaDeg.toFixed(1)} degrees`,
                })
                void speakCoachDynamicText(spokenSummary, {
                  moment: 'post_scan_summary',
                  forceUnlockVoiceOnTap: true,
                })
              }}
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-[#111318] px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-[#181B22]"
            >
              <Volume2 size={13} strokeWidth={1.75} className="text-emerald-300" aria-hidden="true" />
              <span>Hear Coach Gordon</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {/* 3 Telemetry KPI Cards (Stack cleanly on narrow mobile so labels never break mid-word) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#181B22] p-3 sm:block">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Forward Head
          </div>
          <div className={`font-mono text-sm font-bold tabular-nums sm:mt-0.5 ${strainTextClass}`}>
            {delta.forwardHeadDeltaDeg > 0 ? `+${delta.forwardHeadDeltaDeg.toFixed(1)}` : delta.forwardHeadDeltaDeg.toFixed(1)}°
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#181B22] p-3 sm:block">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Posture Score
          </div>
          <div className="font-mono text-sm font-bold tabular-nums text-white sm:mt-0.5">
            {delta.overallPostureScore}/100
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#181B22] p-3 sm:block">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            Pelvic Drift
          </div>
          <div className={`font-mono text-sm font-bold tabular-nums sm:mt-0.5 ${strainTextClass}`}>
            {delta.pelvicTiltDeltaDeg.toFixed(1)}° ({delta.strainFlag.toUpperCase()})
          </div>
        </div>
      </div>

      {!sandboxMode && showPostScanBanner && delta.strainFlag !== 'optimal' ? (
        <div className="flex flex-col justify-between gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-xs text-amber-100">
            <Sparkles size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <span>{postScanCopy.bannerCopy}</span>
          </div>
          <button
            type="button"
            onClick={onRequestUpgrade}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#090A0D] transition-colors duration-150 hover:bg-amber-300"
          >
            Upgrade to Plus <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      {!sandboxMode ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              const spokenSummary = buildPostScanDiagnosticSummary({
                scanType: 'posture_2min',
                score: delta.overallPostureScore,
                primaryFinding: `forward-head delta ${delta.forwardHeadDeltaDeg.toFixed(1)} degrees and pelvic drift ${delta.pelvicTiltDeltaDeg.toFixed(1)} degrees`,
              })
              void speakCoachDynamicText(spokenSummary, {
                moment: 'post_scan_summary',
                forceUnlockVoiceOnTap: true,
              })
            }}
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/12 bg-[#181B22] px-3.5 py-2 text-xs font-bold text-zinc-100 hover:bg-[#1D212A]"
          >
            <Volume2 size={14} className="text-emerald-300" aria-hidden="true" />
            <span>Listen to Coach Gordon</span>
          </button>

          <button
            type="button"
            onClick={() => setEscalationOpen(true)}
            data-testid="posture-scan-message-real-coach-btn"
            className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-3.5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
          >
            {isCoachSupport ? (
              <Smartphone size={14} aria-hidden="true" />
            ) : (
              <Mail size={14} aria-hidden="true" />
            )}
            <span>
              {isCoachSupport
                ? 'Text Real Coach Gordon (24h SLA)'
                : 'Message Real Coach Gordon'}
            </span>
          </button>
        </div>
      ) : null}

      {!sandboxMode ? (
        <CoachEscalationModal
          open={escalationOpen}
          onClose={() => setEscalationOpen(false)}
          sourceContext="post_scan_results"
          initialQuestion={`Hi Coach Gordon — my 2-Min Posture Check scored ${delta.overallPostureScore}/100 (Forward Head ${delta.forwardHeadDeltaDeg.toFixed(1)}°, Pelvic Drift ${delta.pelvicTiltDeltaDeg.toFixed(1)}°). Any corrective drill you want me to prioritize?`}
          telemetryOverride={{
            postureFlags: [
              `Posture ${delta.overallPostureScore}/100`,
              `Forward Head ${delta.forwardHeadDeltaDeg.toFixed(1)}°`,
              `Pelvic Drift ${delta.pelvicTiltDeltaDeg.toFixed(1)}°`,
            ],
          }}
        />
      ) : null}
    </div>
  )
}

export interface PostureComparisonCardProps {
  sandboxMode?: boolean
  externalModalOpen?: boolean
  onExternalModalClose?: () => void
}

export default function PostureComparisonCard({
  sandboxMode = false,
  externalModalOpen = false,
  onExternalModalClose,
}: PostureComparisonCardProps) {
  const { tierId, shouldShowTrigger } = useTierAccess()
  const [modalOpen, setModalOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [cardDragOver, setCardDragOver] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [delta, setDelta] = useState<PostureDeltaSummary>(() => createInitialDelta(sandboxMode))
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()

  const isDialogShown = modalOpen || externalModalOpen

  useEffect(() => {
    if (sandboxMode) return
    const sync = () => setDelta(loadPostureProfileState().postureDelta)
    sync()
    window.addEventListener(POSTURE_PROFILE_EVENT, sync)
    return () => window.removeEventListener(POSTURE_PROFILE_EVENT, sync)
  }, [sandboxMode])

  useEffect(() => {
    if (sandboxMode) return
    const dialog = dialogRef.current
    if (!dialog) return
    if (isDialogShown && !dialog.open) {
      dialog.showModal()
    } else if (!isDialogShown && dialog.open) {
      dialog.close()
    }
  }, [isDialogShown, sandboxMode])

  useEffect(() => {
    if (sandboxMode) return
    const dialog = dialogRef.current
    if (!dialog || typeof HTMLDialogElement === 'undefined') return
    if ('closedBy' in HTMLDialogElement.prototype) return

    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }

    let pressedOutside = false
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close()
      }
      pressedOutside = false
    }

    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [sandboxMode])

  if (sandboxMode) {
    return <PostureComparisonInteractiveStage sandboxMode />
  }

  const closeFullScreenModal = () => {
    setModalOpen(false)
    onExternalModalClose?.()
  }

  const baselineDeg = 8.9
  const currentDeg = Number(Math.max(0, baselineDeg + delta.forwardHeadDeltaDeg).toFixed(1))
  const showPostScanBanner = shouldShowTrigger('post_scan_flag') && delta.strainFlag !== 'optimal'

  return (
    <>
      <div
        onDragOver={e => {
          e.preventDefault()
          e.stopPropagation()
          if (!cardDragOver) setCardDragOver(true)
        }}
        onDragLeave={e => {
          e.preventDefault()
          e.stopPropagation()
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setCardDragOver(false)
        }}
        onDrop={e => {
          e.preventDefault()
          e.stopPropagation()
          setCardDragOver(false)
          const file = e.dataTransfer?.files?.[0]
          if (file) {
            setDroppedFile(file)
            setModalOpen(true)
          }
        }}
        className={`rounded-2xl border border-white/[0.07] bg-[#111318] p-4 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-shadow duration-150 sm:p-6 ${
          cardDragOver ? 'ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-[#090A0D]' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              33-Point Posture Mesh Delta
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-white">
              Forward Head {delta.forwardHeadDeltaDeg.toFixed(1)}° · Score {delta.overallPostureScore}/100
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 transition-colors duration-150 hover:border-emerald-400/40 hover:bg-emerald-500/18"
          >
            <Maximize2 size={14} strokeWidth={1.75} aria-hidden="true" /> Compare
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#181B22] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Baseline → Now
            </span>
            <span className="font-mono font-bold tabular-nums text-emerald-300">
              {baselineDeg}° → {currentDeg}°
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#181B22] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Shoulder Delta
            </span>
            <span className="font-mono font-bold tabular-nums text-white">
              {delta.shoulderSymmetryDeltaDeg.toFixed(1)}°
            </span>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#181B22] px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-zinc-400">
              Strain Status
            </span>
            <span
              className={`font-mono font-bold ${
                delta.strainFlag === 'optimal'
                  ? 'text-emerald-300'
                  : delta.strainFlag === 'amber'
                    ? 'text-amber-300'
                    : 'text-rose-300'
              }`}
            >
              {delta.strainFlag.toUpperCase()}
            </span>
          </div>
        </div>

        {showPostScanBanner ? (
          <div className="mt-3 flex items-center justify-between gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-100">
            <span className="leading-relaxed">
              Want Coach Gordon to verify your form on this? Upgrade to Plus for 2 monthly Form Lab reviews.
            </span>
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#090A0D]"
            >
              Plus →
            </button>
          </div>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        {...({ closedby: 'any' } as Record<string, string>)}
        aria-labelledby={headingId}
        onClose={() => {
          if (dialogRef.current) dialogRef.current.returnValue = ''
          closeFullScreenModal()
        }}
        style={{ zIndex: 100055 }}
        className="forge-glass-modal m-0 h-dvh max-h-dvh w-screen max-w-none overscroll-contain p-0 text-zinc-100 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[min(94vw,660px)] sm:rounded-2xl"
      >
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Interactive 33-Point Comparison
              </span>
              <h2 id={headingId} className="font-serif text-lg font-bold tracking-tight text-white">
                Posture Alignment Side-by-Side &amp; Overlay
              </h2>
            </div>
            <button
              type="button"
              onClick={closeFullScreenModal}
              aria-label="Close posture comparison modal"
              className="forge-tactile-press inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A]"
            >
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <PostureComparisonInteractiveStage
            remoteActive={isDialogShown}
            showPostScanBanner={showPostScanBanner}
            initialDroppedFile={droppedFile}
            onConsumedDroppedFile={() => setDroppedFile(null)}
            onRequestUpgrade={() => {
              closeFullScreenModal()
              setUpgradeOpen(true)
            }}
          />
        </div>
      </dialog>

      <TierUpgradeModal
        open={upgradeOpen}
        triggerContext="post_scan_flag"
        currentTier={tierId}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  )
}
