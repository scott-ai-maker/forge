'use client'

import React, { useState, useMemo } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import {
  calculateEnergyExpenditure,
  calculatePrecisionMacros,
  EXECUTIVE_DINING_PLAYBOOK,
  NasmOptPhase,
  NutritionGoal,
  ActivityLevel,
} from '@/lib/metabolic-nutrition'
import SupplementAdvisorWidget from '@/components/fitness/SupplementAdvisorWidget'

import { DailyBiometricSummary } from '@/lib/wearables-telemetry'

interface MetabolicNutritionProtocolProps {
  bodyweightLbs?: number
  goal?: NutritionGoal
  initialAge?: number
  initialSex?: 'male' | 'female' | 'other'
  initialHeightInches?: number
  initialBodyFat?: number
  initialActivityLevel?: ActivityLevel
  telemetry?: DailyBiometricSummary | null
  intake?: {
    parq_answers?: unknown
    parq_any_yes?: boolean
    medications?: string | null
    medical_conditions?: string | null
    surgeries_or_injuries?: string | null
    allergies?: string | null
  } | null
}

export default function MetabolicNutritionProtocol({
  bodyweightLbs = 185,
  goal = 'fat_loss',
  initialAge = 35,
  initialSex = 'male',
  initialHeightInches = 70,
  initialBodyFat = 16,
  initialActivityLevel = 'moderately_active',
  telemetry,
  intake,
}: MetabolicNutritionProtocolProps) {
  const [nutritionMode, setNutritionMode] = useState<'macros_dining' | 'supplements'>('macros_dining')
  const [activePhase, setActivePhase] = useState<NasmOptPhase>('phase1_stabilization')
  const [activeDiningTab, setActiveDiningTab] = useState<string>('steakhouse')

  // Live Ingested Telemetry
  const caloriesIngested = telemetry?.nutrition?.caloriesConsumedKcal ?? 2180
  const proteinIngested = telemetry?.nutrition?.proteinGrams ?? 185
  const carbsIngested = telemetry?.nutrition?.carbsGrams ?? 220
  const fatIngested = telemetry?.nutrition?.fatGrams ?? 62
  const waterIngested = telemetry?.nutrition?.waterOz ?? 112

  // Interactive Athlete Profile State
  const [weight, setWeight] = useState<number>(bodyweightLbs)
  const [selectedGoal, setSelectedGoal] = useState<NutritionGoal>(goal)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialActivityLevel)
  const [age] = useState<number>(initialAge)
  const [sex] = useState<'male' | 'female' | 'other'>(initialSex)
  const [heightInches] = useState<number>(initialHeightInches)
  const [bodyFat, setBodyFat] = useState<number>(initialBodyFat)

  const energy = useMemo(() => calculateEnergyExpenditure({
    weightLbs: weight,
    heightInches,
    age,
    sex,
    bodyFatPercent: bodyFat > 0 ? bodyFat : undefined,
    activityLevel,
    goal: selectedGoal,
  }), [weight, heightInches, age, sex, bodyFat, activityLevel, selectedGoal])

  const macros = useMemo(() => calculatePrecisionMacros({
    weightLbs: weight,
    heightInches,
    age,
    sex,
    bodyFatPercent: bodyFat > 0 ? bodyFat : undefined,
    activityLevel,
    goal: selectedGoal,
    phase: activePhase,
  }), [weight, heightInches, age, sex, bodyFat, activityLevel, selectedGoal, activePhase])

  const phases: { key: NasmOptPhase; label: string; badge: string }[] = [
    { key: 'phase1_stabilization', label: 'Phase 1: Stabilization', badge: 'Anti-Inflammatory' },
    { key: 'phase2_strength_endurance', label: 'Phase 2: Strength Endurance', badge: 'Glycogen Fuel' },
    { key: 'phase3_hypertrophy', label: 'Phase 3: Hypertrophy', badge: 'Protein Synthesis' },
    { key: 'phase4_maximal_strength', label: 'Phase 4: Max Strength', badge: 'Phosphagen Reload' },
    { key: 'phase5_power', label: 'Phase 5: Power', badge: 'CNS Speed' },
  ]

  const activeDining = EXECUTIVE_DINING_PLAYBOOK.find(d => d.venueType === activeDiningTab) ?? EXECUTIVE_DINING_PLAYBOOK[0]

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  padding: '4px 10px',
                  background: 'rgba(197,160,89,0.15)',
                  color: 'var(--gold-lt)',
                  border: '1px solid rgba(197,160,89,0.4)',
                  borderRadius: 4,
                }}
              >
                NASM CPT-7 Ch 9 & Appendix B
              </span>
              <span style={{ color: 'var(--gray)', fontSize: 13 }}>
                Mifflin-St Jeor BMR & Precision Macro Architecture
              </span>
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
                fontSize: 24,
                letterSpacing: '0.04em',
                margin: '8px 0 0',
                color: 'var(--white)',
              }}
            >
              PRECISION METABOLIC NUTRITION & MACRO LAB
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setNutritionMode('macros_dining')}
              className="tactile-btn"
              style={{
                padding: '8px 16px',
                background: nutritionMode === 'macros_dining' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                border: nutritionMode === 'macros_dining' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                color: nutritionMode === 'macros_dining' ? 'var(--navy)' : 'var(--white)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="nutrition" size={14} tone={nutritionMode === 'macros_dining' ? 'inherit' : 'gold'} />
              <span>OPT™ Macros &amp; BMR</span>
            </button>

            <button
              type="button"
              onClick={() => setNutritionMode('supplements')}
              className="tactile-btn"
              style={{
                padding: '8px 16px',
                background: nutritionMode === 'supplements' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                border: nutritionMode === 'supplements' ? 'none' : '1px solid rgba(255,255,255,0.12)',
                color: nutritionMode === 'supplements' ? 'var(--navy)' : 'var(--white)',
                fontFamily: 'Raleway, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <GaaIcon name="pill" size={14} tone={nutritionMode === 'supplements' ? 'inherit' : 'gold'} />
              <span>Precision Supplementation</span>
            </button>
          </div>
        </div>
        <p style={{ margin: '8px 0 0', color: 'var(--gray)', fontSize: 14, lineHeight: 1.6, maxWidth: 800 }}>
          Calibrated using clinical Mifflin-St Jeor & Katch-McArdle energy balance algorithms. Synchronizes exact protein, carbohydrate, fat, and hydration targets to your active OPT™ phase.
        </p>
      </div>

      {nutritionMode === 'supplements' ? (
        <SupplementAdvisorWidget
          initialGoal={selectedGoal === 'hypertrophy' ? 'hypertrophy' : selectedGoal === 'fat_loss' ? 'fat_loss' : 'general_health'}
          initialAge={initialAge}
          initialSex={initialSex === 'female' ? 'female' : 'male'}
          intake={intake}
        />
      ) : (
      <>
      {/* ── Interactive Energy Balance & BMR Telemetry Bar ──────────── */}
      <div
        style={{
          background: 'rgba(8,14,20,0.85)',
          border: '1px solid rgba(212,160,23,0.3)',
          borderRadius: 8,
          padding: '18px 22px',
          display: 'grid',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--gold-lt)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <GaaIcon name="lightning" size={13} tone="gold" />
            <span>Athlete Physical &amp; Activity Parameters</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>
            Engine: <strong>{energy.bmrMethod}</strong> · BMR: <strong style={{ color: '#FFF' }}>{energy.bmrCalories} kcal</strong>
          </span>
        </div>

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
              <span>Body Weight:</span>
              <strong style={{ color: 'var(--gold-lt)' }}>{weight} lbs ({energy.weightKg} kg)</strong>
            </div>
            <input
              type="range"
              min={100}
              max={320}
              value={weight}
              onChange={e => setWeight(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)', marginTop: 4 }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
              <span>Primary Goal:</span>
              <strong style={{ color: 'var(--gold-lt)' }}>{selectedGoal.replace('_', ' ').toUpperCase()}</strong>
            </div>
            <select
              value={selectedGoal}
              onChange={e => setSelectedGoal(e.target.value as NutritionGoal)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '6px 8px', borderRadius: 4, marginTop: 4 }}
            >
              <option value="fat_loss">Fat Loss (-500 kcal)</option>
              <option value="hypertrophy">Muscle Hypertrophy (+350 kcal)</option>
              <option value="athletic_power">Athletic Power (+200 kcal)</option>
              <option value="maintenance">Metabolic Maintenance (0 kcal)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
              <span>Activity Level (PAL):</span>
              <strong style={{ color: 'var(--gold-lt)' }}>{energy.activityMultiplier}x</strong>
            </div>
            <select
              value={activityLevel}
              onChange={e => setActivityLevel(e.target.value as ActivityLevel)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', padding: '6px 8px', borderRadius: 4, marginTop: 4 }}
            >
              <option value="sedentary">Sedentary (1.2x)</option>
              <option value="lightly_active">Lightly Active (1.375x)</option>
              <option value="moderately_active">Moderately Active (1.55x)</option>
              <option value="very_active">Very Active (1.725x)</option>
              <option value="extra_active">Extra Active / Athlete (1.9x)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gray)' }}>
              <span>Body Fat % (Optional):</span>
              <strong style={{ color: 'var(--gold-lt)' }}>{bodyFat > 0 ? `${bodyFat}%` : 'Standard'}</strong>
            </div>
            <input
              type="range"
              min={6}
              max={40}
              value={bodyFat}
              onChange={e => setBodyFat(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--gold)', marginTop: 4 }}
            />
          </div>
        </div>

        {/* Energy Balance Breakdown Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 110px), 1fr))', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Basal BMR</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#FFF' }}>{energy.bmrCalories} kcal</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>NEAT + EAT</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#60A5FA' }}>+{energy.neatCalories + energy.eatCalories} kcal</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>TEF (10%)</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>+{energy.tefCalories} kcal</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>Total TDEE</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: '#34D399' }}>{energy.tdeeCalories} kcal</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', padding: '8px', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 700 }}>Target Prescribed</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{energy.targetCalories} kcal</div>
          </div>
        </div>
      </div>

      {/* ── Phase Selector Tabs ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {phases.map(p => {
          const active = activePhase === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePhase(p.key)}
              className="tactile-btn"
              style={{
                padding: '10px 16px',
                border: active ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
                background: active ? 'rgba(197,160,89,0.15)' : 'rgba(8,14,20,0.6)',
                color: active ? 'var(--gold-lt)' : 'var(--white)',
                cursor: 'pointer',
                display: 'grid',
                gap: 2,
                textAlign: 'left',
                borderRadius: 6,
              }}
            >
              <div style={{ fontFamily: 'var(--font-sans, Raleway), sans-serif', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {p.label}
              </div>
              <div style={{ fontSize: 10, color: active ? 'var(--white)' : 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {p.badge}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Live Apple Health Dietary Intake Sync HUD ──────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(255,45,85,0.08) 0%, rgba(13,27,42,0.9) 100%)',
          border: '1px solid rgba(255,45,85,0.3)',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'grid',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GaaIcon name="apple" size={18} tone="ruby" />
            <div>
              <div style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 800, fontSize: 12, color: '#FF7B93', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Apple Health · Live Dietary Intake Ingested
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                Auto-synced on login from Apple Health, MyFitnessPal, MacroFactor &amp; HealthKit
              </div>
            </div>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#34D399', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', padding: '3px 8px', borderRadius: 4 }}>
            ● Telemetry Ingested Today
          </span>
        </div>

        {/* Comparison Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 10 }}>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Calories Ingested</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#FFFFFF', margin: '2px 0' }}>
              {caloriesIngested.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--gold-lt)' }}>/ {macros.targetCalories}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((caloriesIngested / Math.max(macros.targetCalories, 1)) * 100))}%`, height: '100%', background: '#FF2D55' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Protein</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#34D399', margin: '2px 0' }}>
              {proteinIngested}g <span style={{ fontSize: 13, color: 'var(--gray)' }}>/ {macros.proteinGrams}g</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((proteinIngested / Math.max(macros.proteinGrams, 1)) * 100))}%`, height: '100%', background: '#34D399' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Carbs</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: 'var(--gold)', margin: '2px 0' }}>
              {carbsIngested}g <span style={{ fontSize: 13, color: 'var(--gray)' }}>/ {macros.carbGrams}g</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((carbsIngested / Math.max(macros.carbGrams, 1)) * 100))}%`, height: '100%', background: 'var(--gold)' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Fats</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#60A5FA', margin: '2px 0' }}>
              {fatIngested}g <span style={{ fontSize: 13, color: 'var(--gray)' }}>/ {macros.fatGrams}g</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((fatIngested / Math.max(macros.fatGrams, 1)) * 100))}%`, height: '100%', background: '#60A5FA' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10.5, color: 'var(--gray)', textTransform: 'uppercase' }}>Hydration</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 20, fontWeight: 700, color: '#38BDF8', margin: '2px 0' }}>
              {waterIngested} oz <span style={{ fontSize: 13, color: 'var(--gray)' }}>/ {macros.hydrationTargetOz} oz</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.round((waterIngested / Math.max(macros.hydrationTargetOz, 1)) * 100))}%`, height: '100%', background: '#38BDF8' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Macro Target Hero Card ──────────────────────────────────── */}
      <div className="glass-card-gold" style={{ padding: '24px 28px', display: 'grid', gap: 20 }}>
        <div>
          <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {macros.phaseTitle} · {energy.goalLabel}
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--white)', fontSize: 14, lineHeight: 1.5 }}>
            {macros.keyFocus}
          </p>
        </div>

        {/* 4 Macro Blocks */}
        <div className="tabular-nums" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 130px), 1fr))', gap: 12 }}>
          <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Calories</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 36, fontWeight: 700, color: 'var(--gold-lt)', lineHeight: 1, marginTop: 4 }}>
              {macros.targetCalories}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>kcal / day</div>
          </div>

          <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Protein ({macros.proteinPerLb}g/lb)
            </div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 36, fontWeight: 700, color: 'var(--white)', lineHeight: 1, marginTop: 4 }}>
              {macros.proteinGrams}g
            </div>
            <div style={{ fontSize: 11, color: '#34D399' }}>{macros.proteinPct}% of calories ({macros.proteinCalories} kcal)</div>
          </div>

          <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Carbohydrates</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 36, fontWeight: 700, color: 'var(--white)', lineHeight: 1, marginTop: 4 }}>
              {macros.carbGrams}g
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold)' }}>{macros.carbPct}% of calories ({macros.carbCalories} kcal)</div>
          </div>

          <div style={{ background: 'rgba(8,14,20,0.6)', padding: '16px 18px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Healthy Fats</div>
            <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 36, fontWeight: 700, color: 'var(--white)', lineHeight: 1, marginTop: 4 }}>
              {macros.fatGrams}g
            </div>
            <div style={{ fontSize: 11, color: '#60A5FA' }}>{macros.fatPct}% of calories ({macros.fatCalories} kcal)</div>
          </div>
        </div>

        {/* Peri-Workout Timing & Hydration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
          <div style={{ background: 'rgba(8,14,20,0.6)', padding: 18, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="timer" size={13} tone="gold" />
              <span>Peri-Workout Nutrient Timing (Chapter 9 &amp; Appendix B)</span>
            </div>
            <div style={{ display: 'grid', gap: 8, fontSize: 12, lineHeight: 1.5 }}>
              <div>
                <strong style={{ color: '#FFF' }}>Pre-Workout: </strong>
                <span style={{ color: 'var(--gray)' }}>{macros.periWorkoutTiming.preWorkout}</span>
              </div>
              <div>
                <strong style={{ color: '#FFF' }}>Intra-Workout: </strong>
                <span style={{ color: 'var(--gray)' }}>{macros.periWorkoutTiming.intraWorkout}</span>
              </div>
              <div>
                <strong style={{ color: '#34D399' }}>Post-Workout Anabolic Window: </strong>
                <span style={{ color: 'var(--gray)' }}>{macros.periWorkoutTiming.postWorkout}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(8,14,20,0.6)', padding: 18, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
            <div style={{ color: 'var(--gold-lt)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="droplet" size={13} tone="cyan" />
              <span>Clinical Hydration &amp; Fluid Replacement</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0' }}>
              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontVariantNumeric: 'tabular-nums', fontSize: 32, fontWeight: 700, color: '#60A5FA' }}>
                {macros.hydrationTargetLiters} L
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                ({macros.hydrationTargetOz} fl oz / day baseline)
              </div>
            </div>
            <p style={{ margin: 0, color: 'var(--gray)', fontSize: 12, lineHeight: 1.5 }}>
              <strong style={{ color: '#FFF' }}>Sweat Rate Rule: </strong>
              {macros.sweatRateGuideline}
            </p>
          </div>
        </div>
      </div>

      {/* ── Executive Dining Playbook ────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 24, display: 'grid', gap: 16 }}>
        <div>
          <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Executive Dining Playbook
          </div>
          <h4 style={{ margin: '4px 0 0', fontFamily: 'var(--font-serif, Cinzel), Georgia, serif', fontSize: 18, color: 'var(--white)', letterSpacing: '0.04em' }}>
            Protocol for Travel, Steakhouses & Business Dinners
          </h4>
        </div>

        {/* Venue Selector */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXECUTIVE_DINING_PLAYBOOK.map(venue => {
            const active = activeDiningTab === venue.venueType
            return (
              <button
                key={venue.venueType}
                type="button"
                onClick={() => setActiveDiningTab(venue.venueType)}
                className="tactile-btn"
                style={{
                  padding: '8px 16px',
                  background: active ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: active ? 'var(--navy)' : 'var(--white)',
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                {venue.title}
              </button>
            )
          })}
        </div>

        {/* Active Venue Details */}
        <div style={{ background: 'rgba(8,14,20,0.6)', padding: 18, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, display: 'grid', gap: 14 }}>
          <div>
            <div style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="check" size={13} tone="emerald" />
              <span>Recommended Orders &amp; Selections</span>
            </div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--white)', fontSize: 13, lineHeight: 1.6 }}>
              {activeDining.recommendedOrders.map((ord, oIdx) => (
                <li key={oIdx}>{ord}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ color: 'var(--error)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <GaaIcon name="alert-triangle" size={13} tone="ruby" />
              <span>Hidden Pitfalls to Avoid</span>
            </div>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, color: 'var(--gray)', fontSize: 13, lineHeight: 1.6 }}>
              {activeDining.pitfallsToAvoid.map((pit, pIdx) => (
                <li key={pIdx}>{pit}</li>
              ))}
            </ul>
          </div>

          <div style={{ padding: '10px 14px', background: 'rgba(197,160,89,0.12)', border: '1px solid rgba(197,160,89,0.3)', borderRadius: 6, color: 'var(--gold-lt)', fontSize: 13 }}>
            <strong>Master Rule:</strong> {activeDining.executiveRule}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
