import React from 'react'
import { Clock, Laptop, Plane } from 'lucide-react'
import { EVERYDAY_MOMENTS_SCENARIOS } from '@/lib/landingSocialProof'

export default function EverydayMomentsStrip() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="everyday-moments-heading"
      className="mx-auto my-16 max-w-[1160px] scroll-mt-24 text-zinc-100"
    >
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
          A Real Trainer at Your Side
        </span>
        <h2
          id="everyday-moments-heading"
          style={{ textWrap: 'balance' }}
          className="mt-3.5 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          How Forge Athletic Fits Into an Ordinary Day
        </h2>
        <p
          style={{ textWrap: 'pretty' }}
          className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base"
        >
          No rigid Zoom appointments, no sensor straps, and no guesswork—just calm, clinical coaching
          that adapts to the room and minutes you actually have.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {EVERYDAY_MOMENTS_SCENARIOS.map((moment, idx) => (
          <article
            key={moment.step}
            className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111318] p-5 sm:p-6"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 18px 44px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/35 bg-amber-500/10 font-mono text-xs font-extrabold tabular-nums text-amber-300">
                    {moment.step}
                  </span>
                  {idx === 0 ? (
                    <Clock size={16} className="text-emerald-400" aria-hidden="true" />
                  ) : null}
                  {idx === 1 ? (
                    <Laptop size={16} className="text-emerald-400" aria-hidden="true" />
                  ) : null}
                  {idx === 2 ? (
                    <Plane size={16} className="text-emerald-400" aria-hidden="true" />
                  ) : null}
                </div>

                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-emerald-300">
                  {moment.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                {moment.timeAndPlace}
              </h3>

              <blockquote
                style={{ textWrap: 'pretty' }}
                className="mt-3 border-l-2 border-amber-400/40 pl-3.5 text-sm leading-relaxed text-zinc-300"
              >
                &ldquo;{moment.narrative}&rdquo;
              </blockquote>
            </div>

            {idx === 2 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3.5 font-mono text-[11px] text-zinc-400">
                <span className="rounded border border-white/10 bg-[#181B22] px-2 py-0.5 text-emerald-300">
                  Hotel Travel
                </span>
                <span className="rounded border border-white/10 bg-[#181B22] px-2 py-0.5 text-amber-300">
                  20m Express
                </span>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
