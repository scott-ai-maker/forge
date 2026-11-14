'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { Check, Copy, Mail, MessageSquare, RefreshCw, Send, Share2, ShieldCheck, X } from 'lucide-react'
import { buildPartnerPassShareChannels, usePartnerPass } from '@/lib/partner-pass'
import { playForgeTactileTone } from '@/lib/sfx-audio'

export interface PartnerPassModalProps {
  open: boolean
  onClose: () => void
  memberName?: string | null
}

const STEPPER_STEPS = [
  { id: 'generated', label: 'Pass Generated' },
  { id: 'sent', label: 'Invite Sent / Opened' },
  { id: 'active', label: '30-Day Trial Active' },
] as const

export default function PartnerPassModal({ open, onClose, memberName }: PartnerPassModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const headingId = useId()
  const { passState, tileStatusLabel, stepIndex, markSent, revokeAndRegenerate } = usePartnerPass(memberName)

  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [emailInputOpen, setEmailInputOpen] = useState(false)
  const [directEmail, setDirectEmail] = useState('')
  const [directSentBanner, setDirectSentBanner] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const channels = buildPartnerPassShareChannels(passState.code, memberName)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(channels.url)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = channels.url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    playForgeTactileTone('success')
    setCopied(true)
    markSent()
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return
    try {
      await navigator.share({
        title: channels.subject,
        text: channels.message,
        url: channels.url,
      })
      markSent()
    } catch {
      // User cancelled native share sheet
    }
  }

  const handleDirectEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = directEmail.trim()
    if (!trimmed || !trimmed.includes('@')) return
    markSent(trimmed)
    playForgeTactileTone('success')
    setDirectSentBanner(`Partner pass dispatched to ${trimmed}`)
    setDirectEmail('')
    window.location.href = `mailto:${encodeURIComponent(trimmed)}?subject=${encodeURIComponent(channels.subject)}&body=${encodeURIComponent(channels.message)}`
  }

  const handleRevoke = async () => {
    setRegenerating(true)
    setDirectSentBanner(null)
    await revokeAndRegenerate()
    playForgeTactileTone('cue')
    setRegenerating(false)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      className="forge-glass-modal m-auto w-[min(94vw,530px)] rounded-2xl p-0 text-zinc-100 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              <ShieldCheck size={13} strokeWidth={1.75} /> {tileStatusLabel}
            </span>
            <h2 id={headingId} className="mt-2 font-serif text-xl font-bold tracking-tight text-white">
              Founding Partner Pass
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">
              Gift one workout partner a full 30-day complimentary membership.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Partner Pass dialog"
            className="forge-tactile-press inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#181B22] text-zinc-300 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Exclusive Metallic Membership Credential Card */}
        <div className="forge-metallic-pass relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-amber-300">
              FORGE ATHLETIC // FOUNDING PARTNER CREDENTIAL
            </span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-emerald-300">
              30 DAYS · $0.00
            </span>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3.5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Invite Pass Code
              </div>
              <div className="mt-0.5 font-mono text-lg font-extrabold tracking-widest tabular-nums text-white">
                {passState.code}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                Issued By
              </div>
              <div className="mt-0.5 text-xs font-semibold text-amber-200">
                {memberName?.trim() || 'Founding Member'}
              </div>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-zinc-400">
            No credit card required · Full Core Lab + Camera Posture Diagnostics
          </div>

          {/* One-Tap Copy Link */}
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-white/15 bg-[#090A0D]/80 p-2">
            <code className="min-w-0 flex-1 truncate px-1.5 font-mono text-xs text-zinc-200">
              {channels.url}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 transition-colors duration-150 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              {copied ? (
                <>
                  <Check size={14} strokeWidth={1.75} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={1.75} /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3-Step Horizontal Status Stepper */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#181B22]/90 p-3.5">
          <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Partner Pass Status
          </div>
          <ol className="grid grid-cols-3 gap-2">
            {STEPPER_STEPS.map((step, index) => {
              const completed = index <= stepIndex
              const current = index === stepIndex
              return (
                <li key={step.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-extrabold tabular-nums ${
                        completed
                          ? 'bg-emerald-400 text-zinc-950'
                          : 'border border-white/15 bg-[#090A0D] text-zinc-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div
                      className={`h-0.5 flex-1 rounded ${
                        index < stepIndex ? 'bg-emerald-400' : 'bg-white/10'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[11px] leading-tight ${
                      current
                        ? 'font-bold text-emerald-300'
                        : completed
                          ? 'font-medium text-zinc-200'
                          : 'text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Pre-Filled Channel Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {canNativeShare ? (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <Share2 size={14} strokeWidth={1.75} className="text-amber-300" /> Share Pass
            </button>
          ) : null}

          <a
            href={channels.smsHref}
            onClick={() => markSent()}
            className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <MessageSquare size={14} strokeWidth={1.75} className="text-emerald-300" /> Send SMS
          </a>

          <a
            href={channels.mailtoHref}
            onClick={() => markSent()}
            className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-2.5 text-xs font-semibold text-white transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <Mail size={14} strokeWidth={1.75} className="text-emerald-300" /> Pre-Filled Email
          </a>

          <button
            type="button"
            onClick={() => setEmailInputOpen(prev => !prev)}
            aria-expanded={emailInputOpen}
            className="forge-tactile-press col-span-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#181B22] px-3 py-2.5 text-xs font-semibold text-zinc-200 transition-colors duration-150 hover:border-white/15 hover:bg-[#1D212A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 sm:col-span-3"
          >
            <Send size={13} strokeWidth={1.75} className="text-amber-300" />
            {emailInputOpen ? 'Hide Direct Email Dispatch' : 'Send Direct Email Invite'}
          </button>
        </div>

        {/* Collapsible Direct-Email Send Input */}
        {emailInputOpen ? (
          <form onSubmit={handleDirectEmailSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={directEmail}
              onChange={e => setDirectEmail(e.target.value)}
              placeholder="partner@domain.com"
              aria-label="Partner email address"
              className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-white/10 bg-[#181B22] px-3.5 py-2 text-base text-white placeholder:text-zinc-500 transition-colors duration-150 hover:border-white/15 focus:border-emerald-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            />
            <button
              type="submit"
              className="forge-tactile-press inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-zinc-950 transition-colors duration-150 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <Send size={13} strokeWidth={1.75} /> Send Pass
            </button>
          </form>
        ) : null}

        {directSentBanner ? (
          <div className="mt-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200">
            {directSentBanner}
          </div>
        ) : null}

        {/* Revoke & Regenerate Link */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <span className="text-xs text-zinc-400">
            Shared to the wrong thread? Rotate your invite token anytime.
          </span>
          <button
            type="button"
            disabled={regenerating}
            onClick={() => void handleRevoke()}
            className="forge-tactile-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-amber-300 underline-offset-4 hover:underline disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <RefreshCw size={13} strokeWidth={1.75} className={regenerating ? 'animate-spin' : ''} />
            Revoke &amp; Regenerate Link
          </button>
        </div>
      </div>
    </dialog>
  )
}
