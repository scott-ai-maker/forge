'use client'

import { useState, useEffect, useCallback } from 'react'
import GaaIcon from '@/components/ui/GaaIcon'
import { calculate1Rm, isLowerBodyExercise } from '@/lib/progressive-overload-engine'

interface PersonalRecord {
  exerciseName: string
  maxWeightKg: number
  maxWeightReps: number
  maxWeightDate: string
  maxReps: number | null
  maxRepsWeight: number | null
  maxRepsDate: string | null
  totalSets: number
  firstLoggedDate: string
  latestDate: string
}

function formatKg(kg: number, units: 'metric' | 'imperial') {
  if (units === 'imperial') {
    return `${Math.round(kg * 2.20462)} lb`
  }
  return `${kg} kg`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

interface PersonalRecordsBoardProps {
  units?: 'metric' | 'imperial'
}

export default function PersonalRecordsBoard({ units = 'imperial' }: PersonalRecordsBoardProps) {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/fitness/personal-records')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json() as { records: PersonalRecord[] }
      setRecords(json.records ?? [])
    } catch {
      setError('Could not load personal records. Log some weighted sets first.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = search.trim()
    ? records.filter((r) =>
        r.exerciseName.toLowerCase().includes(search.trim().toLowerCase())
      )
    : records

  return (
    <section aria-labelledby="pr-board-heading">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <GaaIcon name="trophy" size={20} tone="gold" />
        <h2
          id="pr-board-heading"
          style={{
            fontFamily: 'var(--font-serif, Cinzel), Georgia, serif',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--white)',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          PERSONAL RECORDS & 1RM LAB
        </h2>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--gold-lt)',
            letterSpacing: '0.05em',
            background: 'rgba(212,160,23,0.12)',
            padding: '3px 8px',
            borderRadius: 4,
            border: '1px solid rgba(212,160,23,0.3)',
          }}
        >
          NASM 1RM Table Powered
        </span>
      </div>

      <input
        type="search"
        placeholder="Search exercises (e.g. Bench, Squat, Deadlift)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search personal records"
        style={{
          width: '100%',
          background: 'var(--navy-mid)',
          border: '1px solid var(--navy-lt)',
          color: 'var(--white)',
          fontFamily: 'Raleway, sans-serif',
          fontSize: 14,
          padding: '10px 14px',
          marginBottom: 14,
          borderRadius: 6,
          outline: 'none',
        }}
      />

      {loading && (
        <p style={{ color: 'var(--gray)', fontSize: 13 }}>Loading 1RM database…</p>
      )}

      {error && (
        <p style={{ color: 'var(--gray)', fontSize: 13 }}>{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div
          style={{
            background: 'var(--navy-mid)',
            border: '1px solid var(--navy-lt)',
            padding: '24px',
            textAlign: 'center',
            borderRadius: 8,
          }}
        >
          <p style={{ color: 'var(--gray)', fontSize: 14, margin: 0 }}>
            {search ? 'No exercises match your search.' : 'No weighted sets logged yet. Log your first workout to start tracking 1RMs and PRs.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {filtered.map((rec, i) => {
            const isExpanded = expanded === rec.exerciseName
            const isTop3 = i < 3 && !search
            const isLower = isLowerBodyExercise(rec.exerciseName)

            // Compute Estimated 1RM using dual algorithm
            const weightLbs = rec.maxWeightKg * 2.20462
            const oneRm = calculate1Rm(weightLbs, rec.maxWeightReps)
            const display1Rm = units === 'imperial'
              ? `${oneRm.average1RmLbs} lb`
              : `${oneRm.average1RmKg} kg`

            return (
              <div
                key={rec.exerciseName}
                style={{
                  background: 'var(--navy-mid)',
                  border: isExpanded
                    ? '1px solid rgba(212,160,23,0.6)'
                    : `1px solid ${isTop3 ? 'rgba(212,160,23,0.3)' : 'var(--navy-lt)'}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  transition: 'all 0.15s',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : rec.exerciseName)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '14px 18px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Rank */}
                  <span
                    style={{
                      fontFamily: 'var(--font-telemetry, monospace)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: isTop3 ? 'var(--gold)' : 'var(--gray)',
                      minWidth: 24,
                    }}
                  >
                    #{i + 1}
                  </span>

                  {/* Exercise name & tag */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-sans, Raleway), sans-serif',
                        fontWeight: 700,
                        fontSize: 15,
                        color: 'var(--white)',
                      }}
                    >
                      {rec.exerciseName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                      {isLower ? 'Lower Body Kinetic Chain' : 'Upper Body Kinetic Chain'} · {rec.totalSets} total sets
                    </div>
                  </div>

                  {/* Estimated 1RM Pillar */}
                  <div style={{ textAlign: 'right', marginRight: 8 }}>
                    <div style={{ fontSize: 10, color: 'var(--gold-lt)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Est. 1RM
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-telemetry, monospace)',
                        fontSize: 20,
                        fontWeight: 700,
                        color: 'var(--gold)',
                        letterSpacing: '0.02em',
                        lineHeight: 1.1,
                      }}
                    >
                      {display1Rm}
                    </div>
                  </div>

                  {/* Best Lift */}
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontSize: 10, color: 'var(--gray)', textTransform: 'uppercase' }}>
                      Best Set
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                      {formatKg(rec.maxWeightKg, units)} × {rec.maxWeightReps}
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <span
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      marginLeft: 8,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <GaaIcon name="chevron-down" size={14} tone="gold" />
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '16px 18px',
                      background: 'rgba(0,0,0,0.3)',
                      borderTop: '1px solid rgba(255,255,255,0.08)',
                      display: 'grid',
                      gap: 14,
                    }}
                  >
                    {/* OPT Working Load Matrix */}
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--gold-lt)',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          marginBottom: 8,
                        }}
                      >
                        NASM OPT™ Prescribed Working Load Percentages
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                          gap: 8,
                        }}
                      >
                        {[
                          { label: '90% (3-4 reps)', lbs: oneRm.workingPercentages.pct90, phase: 'Phase 4 Max' },
                          { label: '85% (5-6 reps)', lbs: oneRm.workingPercentages.pct85, phase: 'Phase 4 / 3' },
                          { label: '80% (8 reps)', lbs: oneRm.workingPercentages.pct80, phase: 'Phase 3 Hypertrophy' },
                          { label: '75% (10 reps)', lbs: oneRm.workingPercentages.pct75, phase: 'Phase 3 Hypertrophy' },
                          { label: '70% (12 reps)', lbs: oneRm.workingPercentages.pct70, phase: 'Phase 2 Strength End.' },
                          { label: '60% (20 reps)', lbs: oneRm.workingPercentages.pct60, phase: 'Phase 1 Stability' },
                        ].map((tier, idx) => {
                          const displayVal = units === 'imperial'
                            ? `${tier.lbs} lb`
                            : `${Math.round((tier.lbs / 2.20462) * 10) / 10} kg`
                          return (
                            <div
                              key={idx}
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 6,
                                padding: '8px 10px',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: 10, color: 'var(--gray)' }}>{tier.label}</div>
                              <div style={{ fontFamily: 'var(--font-telemetry, monospace)', fontSize: 15, fontWeight: 700, color: 'var(--gold-lt)', margin: '2px 0' }}>
                                {displayVal}
                              </div>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{tier.phase}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Historical Details Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 12,
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: 12,
                      }}
                    >
                      <Stat
                        label="Heavy Lift PR"
                        value={formatKg(rec.maxWeightKg, units)}
                        sub={`${rec.maxWeightReps} reps · ${formatDate(rec.maxWeightDate)}`}
                      />
                      {rec.maxReps !== null && (
                        <Stat
                          label="Rep Volume PR"
                          value={`${rec.maxReps} reps`}
                          sub={
                            rec.maxRepsWeight
                              ? `${formatKg(rec.maxRepsWeight, units)} · ${rec.maxRepsDate ? formatDate(rec.maxRepsDate) : ''}`
                              : ''
                          }
                        />
                      )}
                      <Stat label="Total Volume Logged" value={`${rec.totalSets} sets`} sub="Working sets recorded" />
                      <Stat label="First Baseline" value={formatDate(rec.firstLoggedDate)} sub="Initial session" />
                      <Stat label="Latest Training Date" value={formatDate(rec.latestDate)} sub="Most recent set" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: 'var(--gray)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-telemetry, monospace)',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--white)',
          letterSpacing: '0.02em',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--gray)',
            marginTop: 2,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
