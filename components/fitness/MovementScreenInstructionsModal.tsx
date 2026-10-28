'use client'

import React, { useState } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  detectStillCameraPlatform,
  IOS_STILL_CAMERA_STEPS,
  ANDROID_STILL_CAMERA_STEPS,
  NASM_VIRTUAL_ASSESSMENT_CHECKLIST,
} from '@/lib/camera-still-mode'

export type MovementScreenTab = 'setup' | 'ohsa' | 'dynamic' | 'submit'

export interface MovementScreenInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: MovementScreenTab
  onLaunchVideoUpload?: () => void
  onLaunchLiveStudio?: () => void
}

export function MovementScreenGuideCard({
  onOpenModal,
  onLaunchVideoUpload,
  onLaunchLiveStudio,
}: {
  onOpenModal?: () => void
  onLaunchVideoUpload?: () => void
  onLaunchLiveStudio?: () => void
}) {
  const [selectedAngle, setSelectedAngle] = useState<'anterior' | 'lateral' | 'posterior'>('anterior')

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px 26px',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        background: 'linear-gradient(180deg, rgba(10, 16, 28, 0.95) 0%, rgba(6, 10, 18, 0.98) 100%)',
        borderRadius: 12,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
      }}
    >
      {/* Header Badge & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 800,
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '3px 8px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: 'var(--gold-lt)',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: 4,
              }}
            >
              NASM Diagnostic Protocol
            </span>
            <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 700, letterSpacing: '0.04em' }}>
              Kinetic Chain Movement Screen
            </span>
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
              fontSize: 19,
              fontWeight: 700,
              color: 'var(--white)',
              margin: '4px 0 0',
              letterSpacing: '0.03em',
            }}
          >
            Overhead Squat Assessment (OHSA) Protocol
          </h3>
          <p style={{ margin: '6px 0 0', color: 'var(--gray)', fontSize: 13, lineHeight: 1.5, maxWidth: 650 }}>
            The overhead squat evaluates your entire kinetic chain under dynamic motion. By screening your feet, knees, lumbo-pelvic-hip complex (LPHC), and shoulder complex across 3 angles, Coach Gordon pinpoints tight lines and weak stabilizers to personalize your Forge Athletic program.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {onOpenModal && (
            <button
              type="button"
              onClick={onOpenModal}
              className="tactile-btn"
              style={{
                padding: '8px 14px',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold)',
                color: 'var(--gold-lt)',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="clipboard" size={14} tone="gold" />
              Full Setup Guide &amp; Checklist
            </button>
          )}
        </div>
      </div>

      {/* 3 Quick-Rule Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>1. Camera Setup</div>
          <div style={{ fontSize: 12.5, color: 'var(--white)', fontWeight: 600, marginTop: 2 }}>Hip Height · 8–12 Ft Distance</div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>Landscape, full body head-to-toe in frame</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>2. Attire &amp; Footwear</div>
          <div style={{ fontSize: 12.5, color: 'var(--white)', fontWeight: 600, marginTop: 2 }}>Barefoot · Fitted Athletic Attire</div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>Shoes off to see arches; shirts on for men</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--gold-lt)', fontWeight: 800 }}>3. Tempo &amp; Reps</div>
          <div style={{ fontSize: 12.5, color: 'var(--white)', fontWeight: 600, marginTop: 2 }}>5 Reps Per Angle @ 4/2/1 Tempo</div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>4s down, 2s pause at parallel, 1s up</div>
        </div>
      </div>

      {/* 3 Angles Tabs */}
      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            The 3 Essential Screening Angles
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['anterior', 'lateral', 'posterior'] as const).map(angle => (
              <button
                key={angle}
                type="button"
                onClick={() => setSelectedAngle(angle)}
                style={{
                  padding: '5px 12px',
                  background: selectedAngle === angle ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255,255,255,0.05)',
                  border: selectedAngle === angle ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                  color: selectedAngle === angle ? 'var(--gold-lt)' : 'var(--gray)',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                {angle === 'anterior' ? '1. Front (Anterior)' : angle === 'lateral' ? '2. Side (Lateral)' : '3. Back (Posterior)'}
              </button>
            ))}
          </div>
        </div>

        {selectedAngle === 'anterior' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>Positioning &amp; Repetitions</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>
                <li>Face the camera directly with feet shoulder-width apart.</li>
                <li>Point toes straight ahead (parallel, not flared).</li>
                <li>Raise arms fully overhead, locking elbows straight.</li>
                <li>Perform <strong>5 smooth squats</strong> down to chair depth.</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase' }}>What Coach Gordon Evaluates</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>
                <li><strong>Feet &amp; Ankles:</strong> Do arches flatten into pronation? Do toes spin outward?</li>
                <li><strong>Knees:</strong> Do knees collapse inward (valgus tracking inside big toe)?</li>
                <li><strong>Symmetry:</strong> Does one leg carry more weight during ascent?</li>
              </ul>
            </div>
          </div>
        )}

        {selectedAngle === 'lateral' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>Positioning &amp; Repetitions</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>
                <li>Turn 90° sideways so your full profile is visible.</li>
                <li>Maintain shoulder-width foot stance and overhead arm extension.</li>
                <li>Ensure heels, hips, shoulders, and overhead wrists are in frame.</li>
                <li>Perform <strong>5 smooth squats</strong> down to femur-parallel depth.</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase' }}>What Coach Gordon Evaluates</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>
                <li><strong>LPHC:</strong> Does the torso pitch excessively forward past the tibia line?</li>
                <li><strong>Lumbar Spine:</strong> Does lower back arch (anterior tilt) or round (butt wink)?</li>
                <li><strong>Shoulder Complex:</strong> Do arms fall forward past the ears?</li>
              </ul>
            </div>
          </div>
        )}

        {selectedAngle === 'posterior' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, borderLeft: '3px solid #38BDF8' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>Positioning &amp; Repetitions</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>
                <li>Turn 180° with your back facing the camera.</li>
                <li>Keep feet shoulder-width, toes parallel, and arms overhead.</li>
                <li>Ensure calves, heels, and posterior pelvis are centered.</li>
                <li>Perform <strong>5 smooth squats</strong> down to parallel.</li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, borderLeft: '3px solid var(--gold)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase' }}>What Coach Gordon Evaluates</div>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--white)', lineHeight: 1.5 }}>
                <li><strong>Foot &amp; Ankle:</strong> Do heels lift off the ground (soleus / calf stiffness)?</li>
                <li><strong>Pelvic Shift:</strong> Is there an asymmetrical weight shift toward one hip?</li>
                <li><strong>Thoracic / Scapular:</strong> Does one shoulder drop or elevate?</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Action Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--gray)' }}>
          Ready to record? Upload your video or join Coach Gordon live in the Video Studio.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href="/dashboard/fitness?workspace=video&lift=overhead_squat_assessment"
            onClick={e => {
              if (onLaunchVideoUpload) {
                e.preventDefault()
                onLaunchVideoUpload()
              }
            }}
            className="tactile-btn"
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="video-studio" size={14} tone="white" />
            Upload Video for Form Analysis
          </a>

          <a
            href="/studio"
            onClick={e => {
              if (onLaunchLiveStudio) {
                e.preventDefault()
                onLaunchLiveStudio()
              }
            }}
            className="tactile-btn"
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--white)',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <GaaIcon name="camera" size={14} tone="gold" />
            Live Studio Screen
          </a>
        </div>
      </div>
    </div>
  )
}

export default function MovementScreenInstructionsModal({
  isOpen,
  onClose,
  initialTab = 'setup',
  onLaunchVideoUpload,
  onLaunchLiveStudio,
}: MovementScreenInstructionsModalProps) {
  const [activeTab, setActiveTab] = useState<MovementScreenTab>(initialTab)
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({
    bare_feet: true,
    contrasting_attire: true,
    camera_distance_angle: true,
    frontal_lighting: true,
    space_traction: true,
    still_camera: true,
  })

  const platform = detectStillCameraPlatform()
  const stillCameraSteps = platform === 'android' ? ANDROID_STILL_CAMERA_STEPS : IOS_STILL_CAMERA_STEPS

  if (!isOpen) return null

  function toggleCheck(id: string) {
    setCheckedChecklist(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="movement-screen-instructions-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(3, 6, 12, 0.88)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #0C1220 0%, #060912 100%)',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          borderRadius: 14,
          maxWidth: 780,
          width: '100%',
          maxHeight: '92vh',
          boxShadow: '0 24px 70px rgba(0,0,0,0.85), 0 0 35px rgba(212,175,55,0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            background: 'rgba(212, 175, 55, 0.08)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(212,175,55,0.25)',
              }}
            >
              <GaaIcon name="movement-screen" size={20} tone="gold" />
            </div>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold-lt)', fontWeight: 800 }}>
                Forge Athletic · Clinical Diagnostic Standards
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--white)',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                Movement Screen &amp; OHSA Precision Guide
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--gray)',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              🖨️ Print
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 22,
                cursor: 'pointer',
                padding: '4px 8px',
                lineHeight: 1,
              }}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.3)',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'setup' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'setup' ? 'var(--gold-lt)' : 'var(--gray)',
              fontWeight: activeTab === 'setup' ? 700 : 500,
              fontSize: 12.5,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            1. Camera &amp; Space Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ohsa')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'ohsa' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'ohsa' ? 'var(--gold-lt)' : 'var(--gray)',
              fontWeight: activeTab === 'ohsa' ? 700 : 500,
              fontSize: 12.5,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            2. The 3 OHSA Angles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dynamic')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'dynamic' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'dynamic' ? 'var(--gold-lt)' : 'var(--gray)',
              fontWeight: activeTab === 'dynamic' ? 700 : 500,
              fontSize: 12.5,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            3. Dynamic Screens (SLS &amp; Push/Pull)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'submit' ? '2px solid var(--gold)' : '2px solid transparent',
              color: activeTab === 'submit' ? 'var(--gold-lt)' : 'var(--gray)',
              fontWeight: activeTab === 'submit' ? 700 : 500,
              fontSize: 12.5,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            4. Submit &amp; Next Steps
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, color: 'var(--white)' }}>
          {/* TAB 1: SETUP & ENVIRONMENT CHECKLIST */}
          {activeTab === 'setup' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--white)' }}>
                  Camera Rig &amp; Environment Preparation
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                  High-fidelity movement analysis requires an unobstructed view of your 5 kinetic chain checkpoints (feet/ankles, knees, LPHC, shoulders, and cervical spine). Review each item before recording.
                </p>
              </div>

              {/* Checklist */}
              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                {NASM_VIRTUAL_ASSESSMENT_CHECKLIST.map(item => {
                  const isChecked = checkedChecklist[item.id] ?? false
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      style={{
                        padding: '12px 16px',
                        background: isChecked ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(item.id)}
                        style={{ marginTop: 3, accentColor: 'var(--gold)', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: isChecked ? 'var(--gold-lt)' : 'var(--white)' }}>
                            {item.number}. {item.title}
                          </span>
                          <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600 }}>
                            {item.standard}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
                          {item.nasmRationale}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {/* Clinical Attire & Image Quality Acceptance Standard */}
                <div
                  style={{
                    padding: '14px 18px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, color: '#38BDF8' }}>🛡️</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Forge Athletic Clinical Attire &amp; Acceptance Standard
                      </div>
                      <div style={{ fontSize: 11.5, color: '#BAE6FD', marginTop: 2 }}>
                        Mandatory compliance required for clinical video acceptance and OPT™ programming sign-off.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, fontSize: 12 }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 6, padding: '10px 12px', color: '#E2E8F0' }}>
                      <strong style={{ color: '#34D399', display: 'block', marginBottom: 4 }}>✓ Approved Screening Attire:</strong>
                      <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.5 }}>
                        <li><strong>Lower Body:</strong> Fitted athletic shorts above the knee or compression tights. Knees and ankles must be 100% visible.</li>
                        <li><strong>Upper Body:</strong> Form-fitting athletic top. <strong>Male athletes must keep shirts on at all times</strong> (fitted crewneck t-shirt or compression top); female athletes wear fitted performance tops or tanks. Tuck loose hems into shorts.</li>
                        <li><strong>Footwear:</strong> Barefoot or flat athletic socks on a non-slip, level surface.</li>
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '10px 12px', color: '#E2E8F0' }}>
                      <strong style={{ color: '#F87171', display: 'block', marginBottom: 4 }}>✕ Prohibited (Submissions Will Be Rejected):</strong>
                      <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.5 }}>
                        <li><strong>Baggy Pants:</strong> Sweatpants, wide-leg joggers, cargo pants, or jeans (obscures knee valgus/varus).</li>
                        <li><strong>Loose Outerwear:</strong> Oversized hoodies, baggy sweatshirts, jackets, or robes (obscures spine curvature and torso lean).</li>
                        <li><strong>Footwear:</strong> Cushioned running shoes, platform trainers, or wedge sneakers (artificially masks ankle dorsiflexion and arch collapse).</li>
                        <li><strong>Inappropriate Attire:</strong> Non-athletic or casual garments.</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8, lineHeight: 1.4 }}>
                    <strong>Coach Gordon&apos;s Policy:</strong> Submissions recorded in baggy clothing, obscured knee joints, or improper footwear fail clinical standards and will be rejected and returned for re-recording before program progression.
                  </div>
                </div>
              </div>

              {/* Still Camera / Auto-Zoom Prevention Guidance */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-lt)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Critical: Disable Auto-Zoom &amp; Center Stage ({platform === 'android' ? 'Android / Samsung' : 'iPhone / iPad'})
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase' }}>
                    Required for fixed optical scale
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                  {stillCameraSteps.map(s => (
                    <div key={s.step} style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#38BDF8' }}>Step {s.step}: {s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--white)', marginTop: 2, lineHeight: 1.4 }}>{s.instruction}</div>
                      {s.detail && <div style={{ fontSize: 10.5, color: 'var(--gray)', marginTop: 2 }}>{s.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THE 3 OHSA ANGLES */}
          {activeTab === 'ohsa' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--white)' }}>
                  The 3-Angle Overhead Squat Protocol (5 Reps Each)
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                  Perform 5 smooth repetitions facing the camera, 5 repetitions sideways, and 5 repetitions with your back turned. Follow the 4/2/1 tempo: 4 seconds down, 2-second hold at parallel, and 1 second up.
                </p>
              </div>

              {/* Angle 1: Anterior */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#38BDF8' }}>
                    Angle 1: Anterior (Front Facing) — 5 Repetitions
                  </span>
                  <span style={{ fontSize: 11, background: 'rgba(56,189,248,0.15)', color: '#38BDF8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    Foot &amp; Knee Tracking
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5 }}>
                  <strong>Setup:</strong> Stand facing the camera directly. Feet shoulder-width apart, pointing straight ahead (parallel). Extend both arms directly overhead, locking elbows straight with thumbs pointed back.
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
                  <strong>Coach Gordon checks for:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    <li><strong>Feet Flatten (Pronation):</strong> Does the arch collapse inward toward the floor?</li>
                    <li><strong>Feet Turn Out:</strong> Do the toes spin outward past neutral during descent?</li>
                    <li><strong>Knees Cave Inward (Valgus):</strong> Do knees move medially inside the line of the big toe?</li>
                    <li><strong>Knees Move Outward (Varus):</strong> Do knees bow excessively outward past the feet?</li>
                  </ul>
                </div>
              </div>

              {/* Angle 2: Lateral */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-lt)' }}>
                    Angle 2: Lateral (Side Profile) — 5 Repetitions
                  </span>
                  <span style={{ fontSize: 11, background: 'rgba(212,175,55,0.15)', color: 'var(--gold-lt)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    LPHC &amp; Shoulder Extension
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5 }}>
                  <strong>Setup:</strong> Turn 90° sideways to the camera. Maintain shoulder-width foot stance and lock arms overhead. Squat until thighs are parallel to the floor (femur parallel to ground).
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
                  <strong>Coach Gordon checks for:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    <li><strong>Excessive Forward Lean:</strong> Does the torso pitch forward excessively beyond the angle of the tibia?</li>
                    <li><strong>Low Back Arches:</strong> Does the lumbar spine hyperextend (anterior pelvic tilt)?</li>
                    <li><strong>Low Back Rounds:</strong> Does the pelvis tuck under at the bottom (posterior pelvic tilt / butt wink)?</li>
                    <li><strong>Arms Fall Forward:</strong> Do arms drop forward past the line of the ears?</li>
                  </ul>
                </div>
              </div>

              {/* Angle 3: Posterior */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                    Angle 3: Posterior (Back Facing) — 5 Repetitions
                  </span>
                  <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                    Heels &amp; Weight Shift
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5 }}>
                  <strong>Setup:</strong> Turn 180° with your back to the camera. Keep feet parallel and arms overhead. Perform 5 controlled squats.
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray)', lineHeight: 1.45 }}>
                  <strong>Coach Gordon checks for:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                    <li><strong>Heels Rise:</strong> Do the heels lift off the floor during the descent (tight calf/soleus complex)?</li>
                    <li><strong>Asymmetrical Weight Shift:</strong> Does the pelvis shift toward one side during descent or ascent?</li>
                    <li><strong>Scapular Winging / Asymmetry:</strong> Does one shoulder blade wing outward or drop?</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC SCREENS */}
          {activeTab === 'dynamic' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--white)' }}>
                  Secondary Dynamic Screens (Optional / Supplementary)
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                  These additional movement screens isolate unilateral knee stability, pelvic control, and upper-body pushing/pulling mechanics.
                </p>
              </div>

              {/* Single-Leg Squat */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-lt)', marginBottom: 6 }}>
                  1. Single-Leg Squat Assessment (SLS)
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5 }}>
                  <strong>Protocol:</strong> Place hands on hips. Lift one leg forward slightly off the floor. Squat down on the supporting leg to a comfortable depth (45° to 60° knee bend) for <strong>5 reps per leg</strong>.
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray)' }}>
                  <strong>Clinical Rationale:</strong> Isolates gluteus medius strength. Screens for knee valgus cave, pelvic drop (Trendelenburg sign), and torso rotation under single-leg load.
                </div>
              </div>

              {/* Pushing & Pulling */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold-lt)', marginBottom: 6 }}>
                  2. Pushing &amp; Pulling Dynamic Assessments
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5 }}>
                  <strong>Protocol:</strong> Perform 5 controlled repetitions of a standing chest press (or push-up) followed by 5 repetitions of a standing row (cable or resistance band).
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray)' }}>
                  <strong>Clinical Rationale:</strong> Screens for scapular winging, shoulder elevation (upper trapezius dominance), forward head migration, and lower back hyperextension under horizontal load.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUBMIT & NEXT STEPS */}
          {activeTab === 'submit' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--white)' }}>
                  How to Complete &amp; Submit Your Movement Screen
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                  Choose the option that fits your schedule. Both methods ensure Coach Gordon personally reviews your kinetic chain to calibrate your OPT™ program.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
                {/* Option A: Video Upload */}
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.06)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 10,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>📹</span>
                      <h5 style={{ fontSize: 15, fontWeight: 700, color: '#10B981', margin: 0 }}>
                        Option A: Self-Capture &amp; Video Upload
                      </h5>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5, margin: '0 0 12px' }}>
                      Record your 3 angles on your phone or camera, then upload the file or paste an unlisted YouTube link. The Forge Athletic Form Studio analyzes your repetitions and notifies Coach Gordon for clinical sign-off.
                    </p>
                  </div>

                  <a
                    href="/dashboard/fitness?workspace=video&lift=overhead_squat_assessment"
                    onClick={e => {
                      if (onLaunchVideoUpload) {
                        e.preventDefault()
                        onClose()
                        onLaunchVideoUpload()
                      }
                    }}
                    className="tactile-btn"
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 6,
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    Open Form Analysis Studio →
                  </a>
                </div>

                {/* Option B: Live Studio */}
                <div
                  style={{
                    background: 'rgba(212, 175, 55, 0.06)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: 10,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>🎙️</span>
                      <h5 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-lt)', margin: 0 }}>
                        Option B: 1-on-1 Live Studio Screen
                      </h5>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--white)', lineHeight: 1.5, margin: '0 0 12px' }}>
                      Join Coach Gordon in the Forge Athletic Video Studio. You’ll be guided through your movement screen in real time with live biomechanical angle feedback and corrective calibration.
                    </p>
                  </div>

                  <a
                    href="/studio"
                    onClick={e => {
                      if (onLaunchLiveStudio) {
                        e.preventDefault()
                        onClose()
                        onLaunchLiveStudio()
                      }
                    }}
                    className="tactile-btn"
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      border: '1px solid var(--gold)',
                      color: 'var(--gold-lt)',
                      fontSize: 13,
                      fontWeight: 700,
                      borderRadius: 6,
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                  >
                    Enter Live Studio Room →
                  </a>
                </div>
              </div>

              {/* Message Coach Gordon Direct Link */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>
                    Have questions about your movement screen?
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                    Message Coach Gordon directly in your Concierge thread anytime.
                  </div>
                </div>

                <a
                  href="/dashboard/fitness?workspace=concierge"
                  className="tactile-btn"
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    textDecoration: 'none',
                  }}
                >
                  Open Concierge Chat
                </a>
              </div>

              {/* HIPAA (1996) Security & Client Privacy Safeguards */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 18, color: '#10B981' }}>🔒</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Client Privacy &amp; HIPAA (1996) Technical Standards</span>
                    <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                      PROTECTED HEALTH DATA
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray)', marginTop: 4, lineHeight: 1.45 }}>
                    Your movement screen videos and assessment diagnostics are encrypted in transit via <strong>TLS 1.3</strong> and at rest via <strong>AES-256</strong>. Enforced by PostgreSQL <strong>Row-Level Security (RLS)</strong> and private storage vaults, client biomechanical records are accessible exclusively to you and Coach Gordon.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 22px',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--gray)' }}>
            Forge Athletic · NASM Optimum Performance Training (OPT™)
          </span>

          <button
            type="button"
            onClick={onClose}
            className="tactile-btn"
            style={{
              padding: '8px 18px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--white)',
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}
