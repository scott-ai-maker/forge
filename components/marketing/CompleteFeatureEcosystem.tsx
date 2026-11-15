import React from 'react'
import { Check, Cpu, ScanLine, UserCheck } from 'lucide-react'
import { ECOSYSTEM_PILLARS } from '@/lib/landingSocialProof'

export default function CompleteFeatureEcosystem() {
  return (
    <section
      id="features"
      aria-labelledby="ecosystem-heading"
      className="mx-auto my-16 max-w-[1160px] scroll-mt-24 text-zinc-100"
    >
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
          Everything Inside Your Membership
        </span>
        <h2
          id="ecosystem-heading"
          style={{ textWrap: 'balance' }}
          className="mt-3.5 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          The Complete Forge Athletic Ecosystem
        </h2>
        <p
          style={{ textWrap: 'pretty' }}
          className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base"
        >
          Every camera diagnostic, real-voice cue, joint-safe progression control, and direct human
          coaching channel—organized into three clear pillars.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ECOSYSTEM_PILLARS.map((pillar, idx) => (
          <article
            key={pillar.roman}
            className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111318] p-5 sm:p-6"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(0, 0, 0, 0.52)',
            }}
          >
            <div className="mb-4 border-b border-white/[0.08] pb-4">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-amber-300">
                  {pillar.eyebrow}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-[#181B22] text-emerald-300">
                  {idx === 0 ? <ScanLine size={16} aria-hidden="true" /> : null}
                  {idx === 1 ? <Cpu size={16} aria-hidden="true" /> : null}
                  {idx === 2 ? <UserCheck size={16} aria-hidden="true" /> : null}
                </span>
              </div>
              <h3 className="text-lg font-extrabold leading-snug text-white sm:text-xl">
                {pillar.title}
              </h3>
            </div>

            <ul className="space-y-4">
              {pillar.items.map(item => (
                <li key={item.title} className="flex items-start gap-2.5 text-left">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-emerald-300"
                  >
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  <div className="text-xs leading-relaxed text-zinc-300 sm:text-sm">
                    <strong className="font-bold text-white">{item.title}:</strong>{' '}
                    <span>{item.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
