'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { COACH_GORDON_TRUST_PROFILE } from '@/lib/landingSocialProof'

export default function CoachAuthoritySection() {
  const [portraitFailed, setPortraitFailed] = useState(false)

  return (
    <section
      id="coach"
      aria-labelledby="coach-authority-heading"
      className="mx-auto my-16 max-w-[1160px] scroll-mt-24 rounded-2xl border border-amber-400/25 bg-[#0E131D] p-5 text-zinc-100 shadow-2xl sm:p-8"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 60px rgba(0, 0, 0, 0.55)',
      }}
    >
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[216px_1fr] lg:gap-8">
        {/* Portrait Frame (aspect-square + 'CG' Monogram Fallback) */}
        <div className="mx-auto w-44 sm:w-52 lg:mx-0 lg:w-full">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-amber-400/45 bg-slate-900 shadow-lg">
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center font-serif text-4xl font-bold tracking-widest text-amber-300/60"
            >
              {COACH_GORDON_TRUST_PROFILE.monogram}
            </span>
            {!portraitFailed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={COACH_GORDON_TRUST_PROFILE.portraitSrc}
                alt="Coach Gordon — NASM-CPT Certified (#1261890687)"
                onError={() => setPortraitFailed(true)}
                className="relative z-10 h-full w-full object-cover object-top"
              />
            ) : null}
            <span className="absolute bottom-2.5 left-2.5 z-20 rounded-md border border-amber-400/40 bg-slate-950/90 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              {COACH_GORDON_TRUST_PROFILE.monogram}
            </span>
          </div>
          <div className="mt-2.5 rounded-xl border border-white/[0.08] bg-[#111318] px-3 py-2 text-center">
            <div className="font-mono text-base font-extrabold tabular-nums text-amber-300">
              NASM-CPT®
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-400">
              Cert #1261890687
            </div>
          </div>
        </div>

        {/* Coach Gordon Philosophy + Science Accordion */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-extrabold tracking-wide text-emerald-200">
              ✓ {COACH_GORDON_TRUST_PROFILE.verificationBadge}
            </span>
            <span className="text-xs text-zinc-400">
              {COACH_GORDON_TRUST_PROFILE.secondaryCredentials}
            </span>
          </div>

          <h2
            id="coach-authority-heading"
            style={{ textWrap: 'balance' }}
            className="mt-3 font-serif text-2xl font-extrabold text-white sm:text-3xl"
          >
            Joint-First Personal Coaching Led Directly by {COACH_GORDON_TRUST_PROFILE.name}
          </h2>

          <div className="mt-3.5 space-y-2.5 text-sm leading-relaxed text-zinc-200 sm:text-[15px]">
            {COACH_GORDON_TRUST_PROFILE.philosophySentences.map((sentence, idx) => (
              <p key={idx} style={{ textWrap: 'pretty' }}>
                {sentence}
              </p>
            ))}
          </div>

          {/* Verified NCCA Badge Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-[#111318] px-4 py-3">
            <div className="flex items-center gap-3">
              <Image
                src="/images/badges/nasm-cpt-badge.png"
                alt="Official NASM Certified Personal Trainer Digital Badge"
                width={46}
                height={46}
                className="shrink-0 object-contain"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Verified NCCA Accredited
                  </span>
                  <span className="font-mono text-xs text-zinc-400">Cert #1261890687</span>
                </div>
                <div className="mt-0.5 text-sm font-bold text-white">
                  NASM-CPT® &amp; ASTI CPR/AED Certified
                </div>
              </div>
            </div>

            <Link
              href="/credentials"
              className="forge-tactile-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-amber-400/45 bg-amber-500/10 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-200 transition hover:bg-amber-500/20"
            >
              <span>View Credentials</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Collapsible "How the NASM OPT™ Science Works" Accordion */}
          <details className="forge-disclosure-item mt-4 rounded-xl border border-white/12 bg-[#111318] text-left">
            <summary className="px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-amber-300 sm:text-[13px]">
              {COACH_GORDON_TRUST_PROFILE.scienceAccordionTitle}
            </summary>
            <div className="space-y-2.5 border-t border-white/10 px-4 py-3.5 text-xs leading-relaxed text-zinc-300 sm:text-sm">
              {COACH_GORDON_TRUST_PROFILE.scienceAccordionParagraphs.map((para, idx) => (
                <p key={idx} style={{ textWrap: 'pretty' }}>
                  {para}
                </p>
              ))}
            </div>
          </details>

          {/* Executive Customer Success Leadership — Lisa Gordon */}
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-white/12 bg-[#111318] p-4 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-amber-400/40 bg-slate-900">
              <Image
                src="/images/leadership/lisa-gordon.jpg"
                alt="Lisa Gordon — VP of Customer Success & Enterprise Accounts at Forge Athletic"
                fill
                sizes="80px"
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-base font-bold text-white">Lisa Gordon</h3>
                <span className="rounded-full border border-amber-400/35 bg-amber-400/12 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  VP of Customer Success &amp; Enterprise Accounts
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-emerald-300">
                Former CSM Manager · Active Customer Success Manager · B.S. IT &amp; Business
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">
                Stewards member onboarding, executive retention, and B2B corporate wellness cohorts—ensuring every
                individual member and leadership team experiences seamless onboarding, Quarterly Business Reviews, and
                responsive account support.
              </p>
              <div className="mt-2 font-mono text-[11px] text-zinc-400">
                <a
                  href="mailto:lisa@forge-athletic.app"
                  className="text-amber-200 underline-offset-2 hover:underline"
                >
                  lisa@forge-athletic.app
                </a>{' '}
                ·{' '}
                <a
                  href="mailto:success@forge-athletic.app"
                  className="text-zinc-300 underline-offset-2 hover:underline"
                >
                  success@forge-athletic.app
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
