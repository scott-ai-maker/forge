'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Building2, Mail, Send, ShieldCheck, Sparkles, X } from 'lucide-react'
import {
  PUBLIC_CONCIERGE_PROFILE,
  PUBLIC_CONCIERGE_QUICK_PROMPTS,
} from '@/lib/enterprise-chatbots/knowledge'
import type {
  ConciergeActionLink,
  PublicConciergeResponse,
} from '@/lib/enterprise-chatbots/types'

interface PublicChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  actionLinks?: ConciergeActionLink[]
  suggestedFollowUps?: string[]
}

const PUBLIC_MARKETING_PATHS = new Set([
  '/',
  '/packages',
  '/pricing',
  '/apply',
  '/waitlist',
  '/corporate',
  '/corporate/proposal',
  '/credentials',
  '/async-coaching',
  '/audit',
])

function isPublicMarketingRoute(pathname: string | null): boolean {
  if (!pathname) return false
  if (PUBLIC_MARKETING_PATHS.has(pathname)) return true
  return false
}

function renderConciergeMarkdown(markdown: string): React.ReactNode {
  const lines = markdown.split('\n').filter(line => line.trim().length > 0)
  return lines.map((line, idx) => {
    const trimmed = line.trim()
    const isBullet = /^[-*]\s+/.test(trimmed)
    const content = isBullet ? trimmed.replace(/^[-*]\s+/, '') : trimmed
    const parts = content.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, pIdx) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={pIdx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={pIdx}>{part}</React.Fragment>
      )
    )

    if (isBullet) {
      return (
        <div key={idx} className="mt-1 flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
          <span>{rendered}</span>
        </div>
      )
    }

    return (
      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
        {rendered}
      </p>
    )
  })
}

export default function ForgeSalesConcierge() {
  const pathname = usePathname()
  const visibleOnRoute = isPublicMarketingRoute(pathname)

  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [messages, setMessages] = useState<PublicChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: PUBLIC_CONCIERGE_PROFILE.welcomeMessage,
    },
  ])

  const headingId = useId()
  const inputId = useId()

  // Sync React state with native <dialog> showModal() & light-dismiss fallback for browsers without closedby
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const onClose = () => setIsOpen(false)
    dialog.addEventListener('close', onClose)

    // Light-dismiss fallback when HTMLDialogElement.closedBy is unsupported (e.g., Safari)
    let pressedOutside = false
    const isOutside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect()
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
    }
    const supportsClosedBy =
      typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype

    const onPointerDown = (e: PointerEvent) => {
      if (!supportsClosedBy && dialog.open) {
        pressedOutside = isOutside(e)
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (!supportsClosedBy && dialog.open && pressedOutside && isOutside(e)) {
        dialog.close()
      }
      pressedOutside = false
    }

    dialog.addEventListener('pointerdown', onPointerDown)
    dialog.addEventListener('pointerup', onPointerUp)

    return () => {
      dialog.removeEventListener('close', onClose)
      dialog.removeEventListener('pointerdown', onPointerDown)
      dialog.removeEventListener('pointerup', onPointerUp)
    }
  }, [visibleOnRoute])

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [messages.length, loading, isOpen])

  const openConcierge = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) {
      dialog.showModal()
    }
    setIsOpen(true)
  }, [])

  const closeConcierge = useCallback(() => {
    const dialog = dialogRef.current
    if (dialog?.open) {
      dialog.close()
    }
    setIsOpen(false)
  }, [])

  const submitQuestion = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim()
      if (!trimmed || loading) return

      setErrorText(null)
      setInputValue('')
      setLoading(true)

      const userMsg: PublicChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
      }
      const historyPayload = messages
        .filter(m => m.id !== 'welcome')
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text }))

      setMessages(prev => [...prev, userMsg])

      try {
        const res = await fetch('/api/concierge/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            pageContext: pathname || '/',
            honeypot,
            history: historyPayload,
          }),
        })
        const data = (await res.json().catch(() => null)) as
          | (PublicConciergeResponse & { ok?: boolean; error?: string })
          | null

        if (!res.ok || !data?.replyMarkdown) {
          setErrorText(data?.error || 'Could not reach the Forge Concierge right now.')
          return
        }

        setMessages(prev => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: data.replyMarkdown,
            actionLinks: data.actionLinks,
            suggestedFollowUps: data.suggestedFollowUps,
          },
        ])
      } catch {
        setErrorText('Connection interrupted. Please try again in a moment.')
      } finally {
        setLoading(false)
      }
    },
    [honeypot, loading, messages, pathname]
  )

  if (!visibleOnRoute) return null

  return (
    <>
      {/* Floating Public Launcher Button */}
      <button
        type="button"
        onClick={openConcierge}
        data-testid="forge-sales-concierge-launcher"
        aria-label={`Chat with ${PUBLIC_CONCIERGE_PROFILE.name}, ${PUBLIC_CONCIERGE_PROFILE.title} at Forge Athletic`}
        className="fixed right-4 bottom-4 z-[850] inline-flex min-h-[52px] items-center gap-2.5 rounded-full border border-amber-400/50 bg-[#0B1220]/95 py-1.5 pr-4 pl-1.5 text-left text-xs font-bold tracking-wide text-white shadow-[0_12px_32px_rgba(0,0,0,0.65)] backdrop-blur-md transition-transform hover:scale-[1.02] hover:border-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 sm:right-6 sm:bottom-6"
      >
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-amber-400/60">
          <Image
            src={PUBLIC_CONCIERGE_PROFILE.avatarPath}
            alt=""
            fill
            sizes="36px"
            className="object-cover object-top"
          />
          <span
            aria-hidden="true"
            className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-[#0B1220] bg-emerald-400"
          />
        </span>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-xs font-bold text-white">Ask {PUBLIC_CONCIERGE_PROFILE.firstName}</span>
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-amber-300">
            AI Concierge
          </span>
        </span>
        <span className="sm:hidden">AI Concierge</span>
      </button>

      {/* Native <dialog> Sales & B2B Concierge Drawer (no redundant role="dialog" / aria-modal) */}
      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        data-testid="forge-sales-concierge-dialog"
        className="forge-concierge-dialog"
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2.5 border-b border-white/10 bg-[#0D1524] px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-400/50">
              <Image
                src={PUBLIC_CONCIERGE_PROFILE.avatarPath}
                alt={PUBLIC_CONCIERGE_PROFILE.avatarAlt}
                fill
                sizes="44px"
                className="object-cover object-top"
              />
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.13em] text-amber-300">
                <Sparkles size={10} aria-hidden="true" />
                <span>{PUBLIC_CONCIERGE_PROFILE.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <h2 id={headingId} className="truncate font-serif text-base font-bold text-white">
                  {PUBLIC_CONCIERGE_PROFILE.name}
                </h2>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-200">
                  AI
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConcierge}
            aria-label={`Close chat with ${PUBLIC_CONCIERGE_PROFILE.name}`}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#151F33] text-zinc-200 transition-colors hover:border-amber-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Privacy & Direct Email Notice */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] bg-[#090F1A] px-4 py-2 text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} className="shrink-0 text-emerald-400" aria-hidden="true" />
            <span>Zero tracking pixels · Omit personal medical info</span>
          </span>
          <a
            href={`mailto:${PUBLIC_CONCIERGE_PROFILE.departmentAlias}`}
            className="inline-flex items-center gap-1 font-mono text-[10.5px] text-amber-200 underline-offset-2 hover:underline"
          >
            <Mail size={11} aria-hidden="true" />
            <span>{PUBLIC_CONCIERGE_PROFILE.departmentAlias}</span>
          </a>
        </div>

        {/* Scrollable Chat Body */}
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
          {/* Quick Qualification Prompts */}
          <div className="flex flex-wrap gap-1.5">
            {PUBLIC_CONCIERGE_QUICK_PROMPTS.map(qp => (
              <button
                key={qp.id}
                type="button"
                disabled={loading}
                onClick={() => void submitQuestion(qp.prompt)}
                className="min-h-[38px] rounded-xl border border-white/12 bg-[#121B2E] px-2.5 py-1.5 text-left text-[11.5px] font-medium text-zinc-200 transition-colors hover:border-amber-400/45 hover:text-white disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>

          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={loading}
            className="space-y-3"
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-8 border border-amber-400/30 bg-amber-400/12 text-white'
                    : 'mr-2 border border-white/10 bg-[#121B2C] text-zinc-200'
                }`}
              >
                <div>{renderConciergeMarkdown(msg.text)}</div>

                {msg.role === 'assistant' && msg.actionLinks && msg.actionLinks.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-2.5">
                    {msg.actionLinks.map(action => (
                      <Link
                        key={action.href + action.label}
                        href={action.href}
                        onClick={closeConcierge}
                        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11.5px] font-bold no-underline transition-colors ${
                          action.variant === 'primary'
                            ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                            : 'border border-white/15 bg-[#0C1322] text-zinc-200 hover:border-amber-400/45 hover:text-white'
                        }`}
                      >
                        {action.href.includes('corporate') ? (
                          <Building2 size={12} aria-hidden="true" />
                        ) : null}
                        <span>{action.label}</span>
                        <ArrowRight size={12} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : null}

                {msg.role === 'assistant' && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedFollowUps.map(follow => (
                      <button
                        key={follow}
                        type="button"
                        disabled={loading}
                        onClick={() => void submitQuestion(follow)}
                        className="min-h-[34px] rounded-lg border border-white/10 bg-[#0B111E] px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-amber-400/40 hover:text-white disabled:opacity-50"
                      >
                        {follow}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div
                role="progressbar"
                aria-label="Forge Concierge is responding"
                className="rounded-xl border border-white/10 bg-[#121B2C] px-3 py-2.5 text-xs text-zinc-300"
              >
                Reviewing Forge Athletic membership &amp; cohort details…
              </div>
            ) : null}
            <div ref={threadEndRef} />
          </div>
        </div>

        {errorText ? (
          <div
            role="alert"
            className="mx-4 mb-2 rounded-xl border border-rose-500/40 bg-rose-500/12 px-3 py-2 text-xs text-rose-200"
          >
            {errorText}
          </div>
        ) : null}

        {/* Composer */}
        <form
          onSubmit={e => {
            e.preventDefault()
            void submitQuestion(inputValue)
          }}
          className="border-t border-white/10 bg-[#0D1524] p-3"
        >
          {/* Hidden honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            className="hidden"
          />
          <label htmlFor={inputId} className="sr-only">
            Ask Forge Athletic Concierge a question
          </label>
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              type="text"
              autoFocus
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about tiers, posture tech, or corporate cohorts…"
              className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-[#090F1A] px-3 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-amber-400"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              aria-label="Send message to Forge Concierge"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-amber-400 text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
              <Send size={15} aria-hidden="true" />
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
