'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

export interface PartnerPassInviteClientProps {
  code: string
  giftedByName: string
  trialDays: number
}

export default function PartnerPassInviteClient({
  code,
  giftedByName,
  trialDays,
}: PartnerPassInviteClientProps) {
  useEffect(() => {
    document.cookie = `forge_referral_code=${encodeURIComponent(code)}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`
    document.cookie = `forge_partner_pass_30d=1; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`
  }, [code])

  const signupHref = `/auth/signup?ref=${encodeURIComponent(code)}&pass=30day`

  return (
    <main className="forge-obsidian-canvas min-h-dvh px-4 py-12 text-zinc-100 sm:py-20">
      <div className="mx-auto max-w-xl">
        {/* Gifted By Pill */}
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
            <ShieldCheck size={14} strokeWidth={1.75} className="text-amber-300" />
            Gifted by {giftedByName}
          </span>
        </div>

        {/* Exclusive Metallic Partner Pass Credential */}
        <section className="forge-metallic-pass rounded-2xl p-6 sm:p-8">
          <div className="font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] tabular-nums text-amber-300">
            FORGE ATHLETIC // FOUNDING PARTNER PASS · {trialDays} DAYS FULL ACCESS · $0.00 / No Credit Card Required
          </div>

          <h1 className="mt-4 font-serif text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {giftedByName} reserved a {trialDays}-Day Founding Partner Pass for you.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Step inside Forge Athletic with full access to the 33-point posture and desk ergonomics lab,
            5-Phase NASM OPT™ strength progressions, 20-minute express workouts, and 5-minute desk resets.
          </p>

          <ul className="mt-5 space-y-2.5 border-y border-white/10 py-4 text-xs text-zinc-200 sm:text-sm">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" />
              <span className="tabular-nums">
                <strong className="text-white">$0.00 for {trialDays} full days</strong> — no credit card required to activate
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" />
              <span>33-Point Posture Mesh, Desk Ergonomics Camera Audit &amp; 5-Min Desk Resets</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" />
              <span>Founding Member Lifetime Rate Lock reserved if you choose to stay</span>
            </li>
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={signupHref}
              className="forge-tactile-press inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-extrabold uppercase tracking-[0.08em] text-zinc-950 no-underline shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090A0D]"
            >
              Activate 30-Day Free Partner Pass <ArrowRight size={16} strokeWidth={1.75} />
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tabular-nums text-zinc-400">
              <span>Pass Token: {code}</span>
              <span>Pre-applied automatically at sign-up</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
