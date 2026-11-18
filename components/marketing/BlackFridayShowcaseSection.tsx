'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LAUNCH_CAMPAIGN_INFO } from '@/lib/launch-config'

const SHOWCASE_CHAPTERS = [
  { id: 'desk', code: '01', label: 'Desk Posture & Ergonomics', timeSec: 0 },
  { id: 'home', code: '02', label: 'Joint-First Home Strength', timeSec: 2.5 },
  { id: 'travel', code: '03', label: '20m Express & Hotel Travel', timeSec: 5.0 },
  { id: 'coach', code: '04', label: 'Async Form Lab & Real Voice', timeSec: 8.2 },
  { id: 'crest', code: '05', label: 'The Precision Sanctuary', timeSec: 10.7 },
] as const

export default function BlackFridayShowcaseSection() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoMuted, setVideoMuted] = useState(true)
  const [activeChapter, setActiveChapter] = useState<string>('desk')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncReducedMotion = (prefersReduced: boolean) => {
      setPrefersReducedMotion(prefersReduced)
      const video = videoRef.current
      if (!video) return
      if (prefersReduced) {
        video.removeAttribute('autoplay')
        video.pause()
      }
    }
    syncReducedMotion(reducedMotionQuery.matches)
    const onChange = (event: MediaQueryListEvent) => syncReducedMotion(event.matches)
    reducedMotionQuery.addEventListener('change', onChange)
    return () => reducedMotionQuery.removeEventListener('change', onChange)
  }, [])

  const jumpToChapter = (id: string, timeSec: number) => {
    setActiveChapter(id)
    if (videoRef.current) {
      videoRef.current.currentTime = timeSec
      videoRef.current.play().catch(() => {})
    }
  }

  return (
    <section
      aria-labelledby="bf-showcase-heading"
      className="mx-auto my-12 max-w-[1160px] px-4 sm:px-6"
    >
      <div
        className="overflow-hidden rounded-2xl border border-amber-400/35 bg-[#0E131D]"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 64px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Top Founding Cohort Strip */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 border-b border-amber-400/25 bg-amber-500/10 px-4 py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200">
          <span>FOUNDING COHORT (50 SPOTS) · {LAUNCH_CAMPAIGN_INFO.dateFormatted}</span>
          <span aria-hidden="true">·</span>
          <span>CONTINUOUS TIER RATE LOCK + KICKOFF MOVEMENT SCREENING</span>
        </div>

        {/* Header Copy */}
        <div className="border-b border-white/[0.08] px-5 pb-5 pt-6 text-center sm:px-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
            <span>Product Walkthrough Film</span>
          </div>
          <h2
            id="bf-showcase-heading"
            style={{ textWrap: 'balance' }}
            className="font-serif text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
          >
            Built for Real Schedules, Comfortable Joints &amp; Long-Term Strength
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
            From 5-second Desk Ergonomics Audits and 20-minute home or hotel workouts to Coach
            Gordon’s real voice pacing every rep, async Form Lab reviews, and direct coaching access.
          </p>
        </div>

        {/* 16:9 Cinema Video Stage */}
        <div
          style={{ aspectRatio: '16 / 9' }}
          className="relative w-full bg-[#05080D]"
        >
          <video
            ref={videoRef}
            {...({ loading: 'lazy' } as Record<string, unknown>)}
            autoPlay={!prefersReducedMotion}
            loop
            muted={videoMuted}
            playsInline
            width={1280}
            height={720}
            preload="metadata"
            poster="/images/forge-black-friday-showcase-poster.jpg"
            aria-label="Forge Athletic ecosystem walkthrough film"
            className="block h-full w-full object-cover"
          >
            <source src="/videos/forge-black-friday-showcase.mp4" type="video/mp4" />
          </video>

          {/* Top-right Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextMuted = !videoMuted
              setVideoMuted(nextMuted)
              if (videoRef.current) {
                videoRef.current.muted = nextMuted
                if (!nextMuted) {
                  videoRef.current.play().catch(() => {})
                }
              }
            }}
            aria-label={videoMuted ? 'Unmute showcase video audio' : 'Mute showcase video audio'}
            className="forge-tactile-press absolute right-4 top-4 inline-flex min-h-[44px] items-center rounded-xl border border-amber-400/50 bg-[#090A0D]/85 px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur"
          >
            {videoMuted ? 'Unmute Audio' : 'Audio On'}
          </button>
        </div>

        {/* Interactive 5-Chapter Bar */}
        <div className="grid grid-cols-1 gap-2 border-y border-white/[0.08] bg-[#111318] p-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {SHOWCASE_CHAPTERS.map(chapter => {
            const isActive = activeChapter === chapter.id
            return (
              <button
                key={chapter.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => jumpToChapter(chapter.id, chapter.timeSec)}
                className={`forge-tactile-press flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                  isActive
                    ? 'border-amber-400/50 bg-amber-500/15 text-white'
                    : 'border-white/[0.08] bg-[#181B22] text-zinc-300 hover:border-white/20'
                }`}
              >
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold ${
                    isActive ? 'bg-amber-400 text-[#090A0D]' : 'bg-amber-500/15 text-amber-300'
                  }`}
                >
                  {chapter.code}
                </span>
                <span className="truncate font-mono text-[11px] font-semibold">
                  {chapter.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Grounded Founding Cohort Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111318] px-5 py-5 sm:px-7">
          <div className="max-w-2xl">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              Founding Member Benefits Included
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300 sm:text-sm">
              Includes your Founding Member Continuous Tier Rate Lock, a complimentary 1-on-1
              kickoff movement screening with Coach Gordon, and 1 free 30-day Founding
              Partner Pass to gift a spouse or friend.
            </p>
          </div>
          <Link
            href="#pricing"
            className="forge-tactile-press inline-flex min-h-[46px] items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-2.5 font-serif text-sm font-extrabold tracking-wide text-[#090A0D] no-underline shadow-[0_4px_18px_rgba(245,158,11,0.28)]"
          >
            View Founding Pricing →
          </Link>
        </div>
      </div>
    </section>
  )
}
