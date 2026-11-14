import type { ClientTelemetrySnapshot } from '@/lib/telemetry-storage'
import { ENVIRONMENT_PROFILE_META, type EnvironmentProfileId } from '@/lib/posture-profile-state'

export interface CoachClientTelemetrySyncCardProps {
  snapshot: ClientTelemetrySnapshot | null
  activePlanOptPhase: number | null
  activePlanPhaseName: string | null
  completedWorkoutsCount: number
}

function formatPlatformDisplay(raw: string | null | undefined): string {
  switch (raw) {
    case 'ios_app':
      return 'Apple iOS App'
    case 'android_app':
      return 'Google Android App'
    case 'pwa_standalone':
      return 'PWA Standalone'
    case 'mobile_web':
      return 'Mobile Web'
    case 'desktop_web':
      return 'Desktop Web'
    default:
      return 'Awaiting Device Sync'
  }
}

function formatStrainFlag(flag: string): string {
  return flag
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

function renderJointComfortSparkline(points: Array<{ score: number; date: string }>) {
  if (points.length === 0) {
    return (
      <div className="flex h-11 items-center text-xs text-zinc-500">
        No Joint Comfort check-ins synced yet
      </div>
    )
  }

  const width = 176
  const height = 42
  const padX = 6
  const padY = 6
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const coords = points.map((pt, idx) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (idx / (points.length - 1)) * innerW
    const clamped = Math.max(0, Math.min(100, pt.score))
    const y = padY + innerH - (clamped / 100) * innerH
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), score: clamped }
  })

  const pathD = coords
    .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
    .join(' ')

  const lastPt = coords[coords.length - 1]
  const strokeColor =
    lastPt.score >= 80 ? '#34D399' : lastPt.score >= 60 ? '#FBBF24' : '#FB7185'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Joint Comfort history sparkline"
      className="overflow-visible"
    >
      <line
        x1={padX}
        y1={height / 2}
        x2={width - padX}
        y2={height / 2}
        stroke="rgba(255,255,255,0.08)"
        strokeDasharray="2 3"
      />
      {coords.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {coords.map((c, idx) => (
        <circle
          key={idx}
          cx={c.x}
          cy={c.y}
          r={idx === coords.length - 1 ? 3.4 : 2}
          fill={idx === coords.length - 1 ? strokeColor : '#0B0F18'}
          stroke={strokeColor}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

export default function CoachClientTelemetrySyncCard({
  snapshot,
  activePlanOptPhase,
  activePlanPhaseName,
  completedWorkoutsCount,
}: CoachClientTelemetrySyncCardProps) {
  const effectiveOptPhase = snapshot?.optPhase ?? activePlanOptPhase ?? 1
  const envKey = (snapshot?.environmentProfile || 'home_gym') as EnvironmentProfileId
  const envLabel = ENVIRONMENT_PROFILE_META[envKey]?.label || 'Home Gym'
  const comfortPoints = snapshot?.jointComfortHistory ?? []
  const latestComfort =
    comfortPoints.length > 0 ? comfortPoints[comfortPoints.length - 1] : null

  return (
    <section
      aria-label="Client Live Biomechanical & Workout Telemetry"
      data-testid="coach-client-telemetry-sync-card"
      className="mb-6 rounded-xl border border-amber-400/25 bg-[#0D1320] p-5 text-zinc-100 shadow-[0_12px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Top Bar: Title + Last Synced + Platform Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
            Forge Athletic · Live Client Telemetry Stream
          </div>
          <h3 className="mt-0.5 font-serif text-base font-bold tracking-wide text-white sm:text-lg">
            BIOMECHANICS, READINESS &amp; DEVICE SYNC
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            Last Synced:{' '}
            {snapshot?.lastSyncedAt
              ? new Date(snapshot.lastSyncedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'Pending First Sync'}
          </span>

          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-300">
            {formatPlatformDisplay(snapshot?.lastPlatform)}
            {snapshot?.lastAppVersion ? ` · v${snapshot.lastAppVersion}` : ''}
          </span>
        </div>
      </div>

      {/* 4-Column Live Telemetry Metrics */}
      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. Latest Readiness Score */}
        <div className="rounded-xl border border-white/10 bg-[#12192A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            Latest Readiness Score
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-extrabold tabular-nums ${
                snapshot?.latestReadinessScore == null
                  ? 'text-zinc-400'
                  : snapshot.latestReadinessScore >= 80
                    ? 'text-emerald-300'
                    : snapshot.latestReadinessScore >= 60
                      ? 'text-amber-300'
                      : 'text-rose-300'
              }`}
            >
              {snapshot?.latestReadinessScore != null
                ? `${snapshot.latestReadinessScore}/100`
                : '—'}
            </span>
            {snapshot?.latestReadinessMovement && (
              <span className="truncate text-[11px] text-zinc-400">
                {snapshot.latestReadinessMovement.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            {snapshot?.injectedWarmupDrills?.length
              ? `${snapshot.injectedWarmupDrills.length} warm-up drill(s) auto-injected`
              : 'No acute ROM restrictions flagged'}
          </div>
        </div>

        {/* 2. Joint Comfort Sparkline */}
        <div className="rounded-xl border border-white/10 bg-[#12192A] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
              Joint Comfort Trend
            </span>
            {latestComfort && (
              <span className="font-mono text-xs font-extrabold text-emerald-300">
                {latestComfort.score}/100 ({latestComfort.label})
              </span>
            )}
          </div>
          <div className="mt-1.5">{renderJointComfortSparkline(comfortPoints)}</div>
        </div>

        {/* 3. Desk Audit Strain Flags */}
        <div className="rounded-xl border border-white/10 bg-[#12192A] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
              Desk Audit &amp; Strain Flags
            </span>
            {snapshot?.deskWorkstationScore != null && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                Score {snapshot.deskWorkstationScore}/100
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {snapshot?.deskStrainFlags && snapshot.deskStrainFlags.length > 0 ? (
              snapshot.deskStrainFlags.map(flag => (
                <span
                  key={flag}
                  className="rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
                >
                  {formatStrainFlag(flag)}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-400">
                {snapshot?.deskWorkstationScore != null
                  ? 'Optimal seated workstation alignment'
                  : 'No desk audit strain flags logged'}
              </span>
            )}
          </div>
        </div>

        {/* 4. OPT™ Phase Progress & Environment */}
        <div className="rounded-xl border border-white/10 bg-[#12192A] p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            OPT™ Phase &amp; Environment
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-lg font-extrabold text-white">
              Phase {effectiveOptPhase}
            </span>
            {snapshot?.expressModeActive && (
              <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase text-amber-300">
                ⚡ 20m Express
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-zinc-300">
            {activePlanPhaseName ? `${activePlanPhaseName} · ` : ''}
            {envLabel} · {completedWorkoutsCount} completed
          </div>
        </div>
      </div>
    </section>
  )
}
