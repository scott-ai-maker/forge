import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  runExecutiveBotTurn,
  runPublicConciergeTurn,
} from '@/lib/enterprise-chatbots/engine'
import {
  EXECUTIVE_BOT_ORDER,
  EXECUTIVE_BOT_PROFILES,
  FORGE_ENTERPRISE_DOSSIER,
  FORGE_LEADERSHIP_TEAM,
  PUBLIC_CONCIERGE_PROFILE,
} from '@/lib/enterprise-chatbots/knowledge'
import {
  buildBaselineTelemetrySnapshot,
  formatTelemetryForPrompt,
} from '@/lib/enterprise-chatbots/telemetry'
import { normalizeCoachDashboardTab } from '@/lib/validation'

describe('Forge Athletic Enterprise Growth Chatbot Engine', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY
  const originalGenaiKey = process.env.GOOGLE_GENAI_API_KEY
  const originalUnmasked = process.env.NEXT_PUBLIC_SITE_UNMASKED

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_GENAI_API_KEY
    delete process.env.NEXT_PUBLIC_SITE_UNMASKED
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalGeminiKey !== undefined) process.env.GEMINI_API_KEY = originalGeminiKey
    else delete process.env.GEMINI_API_KEY
    if (originalGenaiKey !== undefined) process.env.GOOGLE_GENAI_API_KEY = originalGenaiKey
    else delete process.env.GOOGLE_GENAI_API_KEY
    if (originalUnmasked !== undefined) process.env.NEXT_PUBLIC_SITE_UNMASKED = originalUnmasked
    else delete process.env.NEXT_PUBLIC_SITE_UNMASKED
  })

  it('normalizes the new growth coach dashboard tab', () => {
    expect(normalizeCoachDashboardTab('growth')).toBe('growth')
  })

  it('exposes all 4 specialist executive advisors and public concierge with realistic personas and headshots on disk', () => {
    expect(EXECUTIVE_BOT_ORDER).toEqual([
      'b2b-partnerships',
      'growth-marketing',
      'cfo-revenue',
      'enterprise-ops',
    ])
    const seenEmails = new Set<string>()
    for (const botId of EXECUTIVE_BOT_ORDER) {
      const bot = EXECUTIVE_BOT_PROFILES[botId]
      expect(bot.name.length).toBeGreaterThan(4)
      expect(bot.email).toMatch(/^[a-z]+\.[a-z]+@forge-athletic\.app$/)
      expect(bot.departmentAlias).toMatch(/^[a-z]+@forge-athletic\.app$/)
      expect(bot.formattedFrom).toContain(bot.email)
      expect(seenEmails.has(bot.email)).toBe(false)
      seenEmails.add(bot.email)
      expect(bot.background.length).toBeGreaterThan(20)
      expect(bot.voiceStyle.length).toBeGreaterThan(20)
      expect(bot.quickPrompts.length).toBeGreaterThanOrEqual(4)
      expect(bot.mission.length).toBeGreaterThan(20)
      const absAvatar = path.join(process.cwd(), 'public', bot.avatarPath)
      expect(fs.existsSync(absAvatar)).toBe(true)
    }

    expect(PUBLIC_CONCIERGE_PROFILE.name).toBe('Hannah Brooks')
    expect(PUBLIC_CONCIERGE_PROFILE.title).toContain('AI')
    expect(PUBLIC_CONCIERGE_PROFILE.email).toBe('hannah.brooks@forge-athletic.app')
    expect(PUBLIC_CONCIERGE_PROFILE.departmentAlias).toBe('concierge@forge-athletic.app')
    expect(seenEmails.has(PUBLIC_CONCIERGE_PROFILE.email)).toBe(false)
    expect(FORGE_ENTERPRISE_DOSSIER).toContain('Lisa Gordon')
    expect(FORGE_ENTERPRISE_DOSSIER).toContain('VP of Customer Success & Enterprise Accounts')
    expect(FORGE_ENTERPRISE_DOSSIER).toContain('lisa@forge-athletic.app')
    const scottProfile = FORGE_LEADERSHIP_TEAM.find(m => m.id === 'scott-gordon')
    const lisaProfile = FORGE_LEADERSHIP_TEAM.find(m => m.id === 'lisa-gordon')
    expect(scottProfile).toBeDefined()
    expect(lisaProfile).toBeDefined()
    expect(fs.existsSync(path.join(process.cwd(), 'public', scottProfile!.avatarPath))).toBe(true)
    expect(fs.existsSync(path.join(process.cwd(), 'public', lisaProfile!.avatarPath))).toBe(true)
    const publicAvatar = path.join(process.cwd(), 'public', PUBLIC_CONCIERGE_PROFILE.avatarPath)
    expect(fs.existsSync(publicAvatar)).toBe(true)
  })

  it('runs deterministic executive playbooks grounded in live aggregated telemetry for all 4 bots', async () => {
    const telemetry = {
      ...buildBaselineTelemetrySnapshot(new Date('2026-11-22T12:00:00Z')),
      dataSource: 'live_supabase' as const,
      activeAssignedClients: 9,
      unassignedClients: 2,
      waitlistLeadsCount: 142,
      coachingApplicationsCount: 31,
      inactive14dClientsCount: 3,
      lowCreditClientsCount: 2,
      coachSupportUtilizationPct: 60,
    }

    const promptText = formatTelemetryForPrompt(telemetry)
    expect(promptText).toContain('142 Waitlist')
    expect(promptText).toContain('ZERO PII / ZERO PHI')

    for (const botId of EXECUTIVE_BOT_ORDER) {
      const res = await runExecutiveBotTurn(
        {
          botId,
          message: 'Build our Q1 2027 enterprise growth action plan.',
          deliverableMode: 'playbook',
        },
        telemetry
      )

      expect(res.botId).toBe(botId)
      expect(res.engineMode).toBe('deterministic_playbook')
      expect(res.replyMarkdown).toContain('Forge Athletic')
      expect(res.replyMarkdown).not.toMatch(/\bGAA\b|Gordon Athletic/i)
      expect(res.suggestedFollowUps.length).toBeGreaterThan(0)
    }
  })

  it('strips PII from executive prompts and enforces Forge Athletic nomenclature on Gemini output', async () => {
    process.env.GEMINI_API_KEY = 'test-zdr-key'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'At Gordon Athletic Advisory (GAA), scale our $35,000 Executive Core cohort.',
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const telemetry = buildBaselineTelemetrySnapshot(new Date('2026-11-22T12:00:00Z'))
    const res = await runExecutiveBotTurn(
      {
        botId: 'b2b-partnerships',
        message: 'Email prospect jane@biotech.com or call 617-555-0199 about a 10-seat cohort.',
        deliverableMode: 'outreach_draft',
      },
      telemetry
    )

    expect(res.engineMode).toBe('gemini_ai')
    expect(res.replyMarkdown).toContain('Forge Athletic')
    expect(res.replyMarkdown).not.toMatch(/\bGAA\b|Gordon Athletic/i)

    const sentBody = String(fetchSpy.mock.calls[0]?.[1]?.body ?? '')
    expect(sentBody).not.toContain('jane@biotech.com')
    expect(sentBody).not.toContain('617-555-0199')
    expect(sentBody).toContain('[REDACTED_EMAIL]')
    expect(sentBody).toContain('[REDACTED_PHONE]')
  })

  it('qualifies public prospects across B2C tiers, corporate retainers, and enforces clinical boundaries', async () => {
    const corpRes = await runPublicConciergeTurn({
      message: 'We want to enroll 10 executives from our biotech company in a wellness cohort.',
      pageContext: '/corporate',
    })
    expect(corpRes.recommendedTier).toBe('corporate')
    expect(corpRes.replyMarkdown).toContain('$35,000')
    expect(corpRes.actionLinks.length).toBeGreaterThan(0)

    const plusRes = await runPublicConciergeTurn({
      message: 'I travel for work every month and need nutrition plus video form reviews.',
      pageContext: '/packages',
    })
    expect(plusRes.recommendedTier).toBe('plus')
    expect(plusRes.replyMarkdown).toContain('$99/mo')

    const medicalRes = await runPublicConciergeTurn({
      message: 'Can you diagnose my torn rotator cuff and prescribe rehab?',
      pageContext: '/',
    })
    expect(medicalRes.replyMarkdown).toContain('not medical diagnosis or physical therapy')
    expect(medicalRes.replyMarkdown).toContain('PAR-Q+')
  })

  it('switches public concierge CTAs when site registration is live', async () => {
    process.env.NEXT_PUBLIC_SITE_UNMASKED = 'true'
    const liveCorp = await runPublicConciergeTurn({
      message: 'Tell me about corporate team retainers for 25 leaders.',
    })
    expect(liveCorp.launchMode).toBe('public_live')
    expect(liveCorp.actionLinks.some(l => l.href === '/corporate/proposal')).toBe(true)
  })
})
