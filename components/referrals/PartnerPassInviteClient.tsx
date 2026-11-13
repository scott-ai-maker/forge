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
    <main className="min-h-dvh bg-[#070B11] px-4 py-12 text-slate-100 sm:py-20">
      <div className="mx-auto max-w-xl">
        {/* Gifted By Pill */}
        <div className="mb-5 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-200">
            <ShieldCheck size={14} className="text-amber-300" />
            Gifted by {giftedByName}
          </span>
        </div>

        {/* Tactile Pass Card */}
        <section
          className="rounded-2xl border border-amber-400/40 p-6 shadow-2xl sm:p-8"
          style={{
            background:
              'radial-gradient(circle at 85% 15%, rgba(212,175,55,0.2), transparent 55%), linear-gradient(155deg, #101826 0%, #090D14 100%)',
          }}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
            FORGE ATHLETIC // FOUNDING PARTNER PASS · {trialDays} DAYS FULL ACCESS · $0.00 / No Credit Card Required
          </div>

          <h1 className="mt-4 font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
            {giftedByName} reserved a {trialDays}-Day Founding Partner Pass for you.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Step inside Forge Athletic with full access to the 33-point posture and desk ergonomics lab,
            5-Phase NASM OPT™ strength progressions, 20-minute express workouts, and 5-minute desk resets.
          </p>

          <ul className="mt-5 space-y-2.5 border-y border-white/10 py-4 text-xs text-slate-200 sm:text-sm">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>
                <strong>$0.00 for {trialDays} full days</strong> — no credit card required to activate
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>33-Point Posture Mesh, Desk Ergonomics Camera Audit &amp; 5-Min Desk Resets</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>Founding Member Lifetime Rate Lock reserved if you choose to stay</span>
            </li>
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={signupHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-slate-950 no-underline transition hover:bg-amber-300"
            >
              Activate 30-Day Free Partner Pass <ArrowRight size={16} />
            </Link>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Pass Token: {code}</span>
              <span>Pre-applied automatically at sign-up</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

