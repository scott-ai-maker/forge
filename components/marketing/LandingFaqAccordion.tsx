import React from 'react'
import { LANDING_FAQ_ITEMS } from '@/lib/landingSocialProof'

export default function LandingFaqAccordion() {
  return (
    <section
      id="faq"
      aria-labelledby="landing-faq-heading"
      className="mx-auto my-16 max-w-4xl scroll-mt-24 text-zinc-100"
    >
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#111318] px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
          Straightforward Answers
        </span>
        <h2
          id="landing-faq-heading"
          style={{ textWrap: 'balance' }}
          className="mt-3.5 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-4xl"
        >
          Frequently Asked Questions
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
          Clear details on how camera diagnostics, real-voice guidance, joint safety, direct access
          to Coach Gordon, and Founding Member rate protection work.
        </p>
      </div>

      <div className="space-y-3">
        {LANDING_FAQ_ITEMS.map((item, idx) => (
          <details
            key={item.id}
            open={idx === 0}
            className="forge-disclosure-item rounded-2xl border border-white/[0.08] bg-[#111318] text-left transition-colors hover:border-white/15"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            <summary className="px-4 py-4 text-sm font-bold leading-snug text-white sm:px-6 sm:text-base">
              {item.question}
            </summary>
            <div className="border-t border-white/[0.07] px-4 py-4 text-sm leading-relaxed text-zinc-300 sm:px-6">
              <p style={{ textWrap: 'pretty', maxWidth: '72ch' }}>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
