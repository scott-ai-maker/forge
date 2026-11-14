'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <main
      id="main-content"
      className="forge-obsidian-canvas flex min-h-dvh items-center justify-center p-6"
    >
      <div className="forge-surface-card w-full max-w-lg rounded-2xl p-6 text-center sm:p-8">
        <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
          Telemetry Sync Interrupted
        </span>
        <h1
          className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl"
          style={{ fontFamily: 'var(--font-serif, Cinzel), Georgia, serif' }}
        >
          Dashboard Connection Paused
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-zinc-300">
          We couldn&apos;t load your latest training telemetry. Your offline workout queue and saved posture scans remain safe on your device.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            Retry Connection
          </button>
          <Link
            href="/"
            className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-[#181B22] px-5 py-2.5 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
