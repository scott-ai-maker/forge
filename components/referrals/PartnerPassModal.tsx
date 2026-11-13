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
      className="m-auto w-[min(94vw,520px)] rounded-2xl border border-amber-400/35 bg-[#090D14] p-0 text-slate-100 shadow-2xl"
    >
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
              <ShieldCheck size={12} /> {tileStatusLabel}
            </span>
            <h2 id={headingId} className="mt-2 font-serif text-xl font-bold tracking-tight text-white">
              Founding Partner Pass
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Gift one workout partner a full 30-day complimentary membership.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Partner Pass dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tactile Digital Pass Card */}
        <div
          className="relative overflow-hidden rounded-xl border border-amber-400/45 p-4 shadow-inner"
          style={{
            background:
              'radial-gradient(circle at 88% 12%, rgba(212,175,55,0.22), transparent 52%), linear-gradient(145deg, #101927 0%, #0A0F18 100%)',
          }}
        >
          <div className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-amber-300">
            FORGE ATHLETIC // FOUNDING PARTNER PASS · 30 DAYS FULL ACCESS · $0.00 / No Credit Card Required
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Invite Pass Code</div>
              <div className="font-mono text-lg font-bold tracking-widest text-white">{passState.code}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Issued By</div>
              <div className="text-xs font-semibold text-amber-200">{memberName?.trim() || 'Founding Member'}</div>
            </div>
          </div>

          {/* One-Tap Copy Link */}
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/15 bg-black/45 p-2">
            <code className="min-w-0 flex-1 truncate text-xs text-slate-200">{channels.url}</code>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-amber-300"
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3-Step Horizontal Status Stepper */}
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
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
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        completed
                          ? 'bg-emerald-400 text-slate-950'
                          : 'border border-white/20 bg-slate-900 text-slate-400'
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
                          ? 'font-medium text-slate-200'
                          : 'text-slate-500'
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
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <Share2 size={14} className="text-amber-300" /> Share Pass
            </button>
          ) : null}

          <a
            href={channels.smsHref}
            onClick={() => markSent()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <MessageSquare size={14} className="text-emerald-300" /> Send SMS
          </a>

          <a
            href={channels.mailtoHref}
            onClick={() => markSent()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            <Mail size={14} className="text-sky-300" /> Pre-Filled Email
          </a>

          <button
            type="button"
            onClick={() => setEmailInputOpen(prev => !prev)}
            aria-expanded={emailInputOpen}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 sm:col-span-3"
          >
            <Send size={13} className="text-amber-300" />
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
              style={{ fontSize: 16 }}
              className="min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white placeholder:text-slate-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition hover:bg-emerald-300"
            >
              <Send size={13} /> Send Pass
            </button>
          </form>
        ) : null}

        {directSentBanner ? (
          <div className="mt-2.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {directSentBanner}
          </div>
        ) : null}

        {/* Revoke & Regenerate Link */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-[11px] text-slate-400">
            Shared to the wrong thread? Rotate your invite token anytime.
          </span>
          <button
            type="button"
            disabled={regenerating}
            onClick={handleRevoke}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-amber-300 underline-offset-4 hover:underline disabled:opacity-50"
          >
            <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
            Revoke &amp; Regenerate Link
          </button>
        </div>
      </div>
    </dialog>
  )
}

