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
            FORGE ATHLETIC // FOUNDING PARTNER PASS · {trialDays}-DAY EXTENDED CORE LAB TRIAL
          </div>

          <h1 className="mt-4 font-serif text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
            {giftedByName} reserved a {trialDays}-Day Founding Partner Pass for you.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            Step inside Forge Athletic with extended Core Lab trial access to the 33-point posture and desk ergonomics lab,
            5-Phase NASM OPT™ strength progressions, 20-minute express workouts, and 5-minute desk resets.
          </p>

          <ul className="mt-5 space-y-2.5 border-y border-white/10 py-4 text-xs text-zinc-200 sm:text-sm">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" />
              <span className="tabular-nums">
                <strong className="text-white">$0.00 due today for {trialDays} days on Core Lab</strong> — cancel online anytime before renewal ($49/mo thereafter unless cancelled)
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" />
              <span>33-Point Posture Mesh, Desk Ergonomics Camera Audit &amp; 5-Min Desk Resets</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} strokeWidth={1.75} className="shrink-0 text-emerald-400" />
              <span>Continuous-enrollment Founding Rate Lock eligible while active on your selected tier</span>
            </li>
          </ul>

          <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
            <strong className="text-zinc-200">Referral Disclosure (#ForgePartner · 16 CFR § 255.5):</strong> This is a member referral link. If you subscribe and complete your first paid billing cycle after your {trialDays}-day Core Lab trial, {giftedByName} may earn a $20 account credit or referral milestone reward at no extra cost to you.
          </p>

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

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
          <Link href="/terms" className="underline hover:text-amber-300">Terms of Service</Link>
          <Link href="/privacy" className="underline hover:text-amber-300">Privacy Policy</Link>
          <Link href="/health-privacy" className="underline hover:text-amber-300">Consumer Health Data Privacy</Link>
        </footer>
      </div>
    </main>
  )
}
