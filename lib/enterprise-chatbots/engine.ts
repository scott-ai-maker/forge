/**
 * Forge Athletic — Enterprise Growth Chatbot Orchestration Engine
 *
 * Powers:
 * 1. Executive Advisory Board (4 specialist bots for the Founding Principal)
 * 2. Public Membership & B2B Sales Concierge (marketing pages)
 *
 * Uses paid Gemini Zero-Data-Retention REST API when configured, with rich
 * deterministic playbooks/concierge responses as a guaranteed fallback.
 */

import {
  sanitizePiiString,
  stripPiiAndRawFramesFromCoachContext,
  validateCoachBrandSafetyOutput,
} from '@/src/lib/safety/clinicalGuardrails'
import { isPublicRegistrationOpen } from '@/lib/launch-config'
import {
  buildExecutiveBotSystemPrompt,
  buildPublicConciergeSystemPrompt,
  EXECUTIVE_BOT_PROFILES,
} from './knowledge'
import { formatTelemetryForPrompt } from './telemetry'
import type {
  ConciergeActionLink,
  DeliverableMode,
  EnterpriseChatTurn,
  EnterpriseTelemetrySnapshot,
  ExecutiveBotId,
  ExecutiveChatRequest,
  ExecutiveChatResponse,
  PublicConciergeRequest,
  PublicConciergeResponse,
} from './types'

const MAX_HISTORY_TURNS = 8
const MAX_INPUT_CHARS = 2400
const MAX_PUBLIC_INPUT_CHARS = 800

function enforceForgeBrandCopy(rawText: string): string {
  const brandSafe = validateCoachBrandSafetyOutput(rawText).cleanText
  return brandSafe
    .replace(/\bGordon\s+Athletic(\s+Advisory)?\b/gi, 'Forge Athletic')
    .replace(/\bGAA\b/g, 'Forge Athletic')
    .replace(/\bForge Athletic\s+Forge Athletic\b/g, 'Forge Athletic')
    .trim()
}

async function callGeminiText(params: {
  systemInstruction: string
  history: EnterpriseChatTurn[]
  userPrompt: string
  temperature: number
  maxOutputTokens: number
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
  if (!apiKey) return null

  const modelsToTry = Array.from(
    new Set([
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
    ])
  )

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
  for (const turn of params.history.slice(-MAX_HISTORY_TURNS)) {
    if (!turn?.text?.trim()) continue
    contents.push({
      role: turn.role === 'user' ? 'user' : 'model',
      parts: [{ text: sanitizePiiString(turn.text).slice(0, 1800) }],
    })
  }
  contents.push({
    role: 'user',
    parts: [{ text: params.userPrompt }],
  })

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: params.systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: params.temperature,
            maxOutputTokens: params.maxOutputTokens,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (typeof text === 'string' && text.trim().length > 0) {
          return enforceForgeBrandCopy(text)
        }
      }
    } catch (err) {
      console.warn(`[EnterpriseChatbots] Gemini model ${model} request failed:`, err)
    }
  }

  return null
}

function deriveDeliverableTitle(botId: ExecutiveBotId, mode: DeliverableMode): string {
  const modePrefix: Record<DeliverableMode, string> = {
    advisory: 'Executive Briefing',
    playbook: 'Executable Playbook',
    outreach_draft: 'Ready-to-Send Copy Pack',
    financial_model: 'CFO Revenue & Margin Model',
    compliance_checklist: 'Governance & Compliance Checklist',
  }
  const profile = EXECUTIVE_BOT_PROFILES[botId]
  return `${profile.name} · ${profile.shortLabel} ${modePrefix[mode]}`
}

function deriveExecutiveFollowUps(botId: ExecutiveBotId): string[] {
  switch (botId) {
    case 'b2b-partnerships':
      return [
        'Turn this into a 1-page PDF-ready proposal summary',
        'Write a 4-sentence CFO objection response on ROI',
        'Build a 10-company Route 128 target profile criteria list',
      ]
    case 'growth-marketing':
      return [
        'Draft the Sunday Intelligence Note email version',
        'Create 3 short-form video scripts for Coach Gordon',
        'Map the /apply quiz to Core vs. Plus email follow-ups',
      ]
    case 'cfo-revenue':
      return [
        'Stress-test this model at 15% lower conversion',
        'Calculate exact Year 2 W-2 associate coach payroll load',
        'Draft the Core ($49/mo) downsell retention offer copy',
      ]
    case 'enterprise-ops':
      return [
        'Create a 30-60-90 day Associate Coach onboarding scorecard',
        'List the exact InfoSec artifacts to keep in our B2B trust folder',
        'Audit our 24h Coach Support SLA escalation workflow',
      ]
  }
}

function buildDeterministicExecutiveReply(
  botId: ExecutiveBotId,
  message: string,
  telemetry: EnterpriseTelemetrySnapshot
): string {
  const cleanQuestion = sanitizePiiString(message).slice(0, 180)
  const launchStatus =
    telemetry.launchMode === 'prelaunch_waitlist'
      ? `Pre-Launch (${telemetry.daysUntilGoLive} days to ${telemetry.goLiveDateFormatted})`
      : 'Public Registration LIVE'

  switch (botId) {
    case 'b2b-partnerships':
      return `## Marcus Vance · B2B Corporate Partnerships Playbook

**Prepared for Scott Gordon (Founding Principal, Forge Athletic) · Brief Focus:** ${cleanQuestion}  
**Live Context:** ${launchStatus} · ${telemetry.waitlistLeadsCount} waitlist leads · ${telemetry.activeAssignedClients} active clients.

### 1. Recommended Institutional Offer Ladder
| Cohort Tier | Seats | Annual Investment | Ideal Buyer |
| :--- | :--- | :--- | :--- |
| **Boutique Syndicate** | 5 Executives | **$20,000 / yr** | Seed/Series A leadership, boutique law/VC partners |
| **Executive Core** | 10 Executives | **$35,000 / yr** | Series B–D Boston/Cambridge biotech & SaaS leadership |
| **Partner Cohort** | 25 Leaders | **$75,000 / yr** | Mid-market engineering, biotech & advisory firms |
| **Enterprise Division** | 50+ Leaders | **$135,000+ / yr** | Multi-site executive & high-travel teams |

### 2. Copy-Ready Executive Outreach Email (Cambridge / Route 128)
**Subject:** Executive orthopedic longevity for [Company] leadership (zero real-estate overhead)

Hi [First Name],

Senior leaders in Boston/Cambridge tech and biotech routinely manage complex capital and R&D decisions while quietly fighting neck tension, low-back stiffness, and erratic travel recovery. Generic gym stipends rarely move the needle because executives do not have 90 minutes to commute to a facility.

At **Forge Athletic**, I combine 18+ years of NASM-certified performance coaching with private, browser-based 33-point movement screening (zero cloud video uploads, zero third-party ad pixels) and encrypted 1:1 coaching tailored to executive travel calendars.

We are opening two **10-seat Executive Core cohorts ($35,000/yr)**—or a **90-day paid pilot ($9,500)** credited 100% toward the annual retainer—for Greater Boston leadership teams. Would a 15-minute briefing next Tuesday or Thursday make sense?

Best,  
**Scott Gordon, NASM-CPT®**  
Founding Principal, Forge Athletic  
scott@forge-athletic.app · partnerships@forge-athletic.app  
*(Corporate Onboarding & QBRs: Lisa Gordon, VP of Customer Success · lisa@forge-athletic.app)*

### 3. Enterprise Defensibility & Next Steps
- **InfoSec Advantage:** Lead with zero third-party tracking pixels, local browser posture analysis, and HIPAA-aligned AES-256 / Supabase RLS isolation.
- **Pilot-to-Annual Trigger:** Measure 90-day seat activation (>=80%), average desk ergonomics score lift, and self-reported joint comfort improvement to lock in the annual renewal.`

    case 'growth-marketing':
      return `## Elena Rostova · 4-Quadrant Growth & Conversion Strategy

**Prepared for Scott Gordon (Founding Principal, Forge Athletic) · Brief Focus:** ${cleanQuestion}  
**Live Pipeline:** ${telemetry.waitlistLeadsCount} Waitlist Leads · ${telemetry.coachingApplicationsCount} Coaching Applications · Status: ${launchStatus}.

### 1. NASM VCS 4-Quadrant Weekly Execution Cadence
- **Authority (Monday):** Publish one deep biomechanical breakdown (e.g., *Why Rounded Shoulders Stall Executive Bench Press & How 33-Point OHSA Fixes It*) linking directly to \`/audit\` and \`/apply\`.
- **Social Proof (Wednesday):** Share anonymized movement-screen progress metrics (forward-head angle improvement, pain-free hinge volume, 20-Minute Express adherence).
- **Connection (Friday / Sunday):** Dispatch the **Sunday Intelligence Note** from Scott Gordon with one practical 5-minute desk reset and transparent coaching philosophy.
- **Attention (Ongoing):** Convert organic readers with the **HOLIDAY25** Founding Member offer (**25% Continuous Tier Rate Lock** + complimentary 60-min Kickoff Movement Screen).

### 2. Waitlist-to-Paid Conversion Sprint (Zero Tracking Pixels)
1. **Segment by First-Party Goal Data:** Use the \`primary_goal\` captured on \`/waitlist\` and \`/apply\` (no Meta Pixel or GA4 health tracking—100% compliant with FTC Health Breach Rule & MA Wiretap Act).
2. **T-14 Days (Authority Proof):** Send Scott's NASM-CPT credential verification + 3-minute Movement Lab walkthrough.
3. **T-7 Days (Founding Scarcity):** Highlight the strict **15-athlete cap** on Coach Support ($299/mo) and **50-spot Founding Cohort** rate lock.
4. **Launch Morning (Jan 4, 06:00 AM EST):** Open priority enrollment link with \`HOLIDAY25\` pre-highlighted and a 7-day risk-free Core Lab trial fallback.

### 3. Immediate Highest-Leverage Action
- Audit the top 3 landing entry points (\`/\`, \`/packages\`, \`/apply\`) so every high-intent visitor can either claim \`HOLIDAY25\`, test the Movement Lab, or ask the **Forge Athletic Sales Concierge** which tier fits their schedule.`

    case 'cfo-revenue': {
      const seatsRemaining = Math.max(0, telemetry.coachSupportCap - telemetry.activeAssignedClients)
      return `## David Chen, CFA · Revenue, Margin & Retention Model

**Prepared for Scott Gordon (Founding Principal, Forge Athletic) · Brief Focus:** ${cleanQuestion}  
**Live Snapshot:** ${telemetry.activeAssignedClients} Active Assigned Clients · ${seatsRemaining}/${telemetry.coachSupportCap} Coach Support cap remaining · ${telemetry.inactive14dClientsCount} inactive (14d) · ${telemetry.lowCreditClientsCount} low credits (<=2).

### 1. Year 1 ($585,000 ARR) Target Mix & Asset-Light Unit Economics
| Revenue Stream | Target Year 1 ARR | Monthly Run-Rate | Gross Margin Profile |
| :--- | :--- | :--- | :--- |
| **Core ($49/mo) & Plus ($99/mo)** | $145,000 | $12,083 / mo | ~92% (near-zero marginal coach time) |
| **Coach Support ($299/mo · Cap 15)** | $53,820 | $4,485 / mo | ~84% (direct principal SLA) |
| **1:1 Live Sessions & Add-Ons** | $65,300 | $5,442 / mo | ~88% (WebRTC studio, $0 lease) |
| **High-Ticket Retainers ($349–$1,495)** | $215,880 | $17,990 / mo | ~82% (high-touch concierge) |
| **B2B Corporate Cohorts ($20k–$135k)** | $105,000 | $8,750 / mo | ~80% (3x Executive Core cohorts) |
| **Total Year 1 Target** | **$585,000** | **$48,750 / mo** | **77.8% Target EBITDA ($455k NOI)** |

### 2. Retention & Cash-Flow Controls
- **Immediate Churn-Rescue Trigger:** Any member hitting **14+ days without a workout log** (currently ${telemetry.inactive14dClientsCount}) or **<=2 session credits** (currently ${telemetry.lowCreditClientsCount}) receives a personalized 20m Express reset check-in before billing renewal.
- **Downsell Retention Architecture:** Never let a financially stretched Plus ($99) or Coach Support ($299) member churn to $0—offer a seamless step-down to **Core Lab ($49/mo)** to preserve their workout history and CLV.
- **Associate Coach #1 Hire Trigger:** Hire the first Massachusetts W-2 Associate Coach (~$60k–$72k fully loaded at 1.24x payroll/PFML/Workers' Comp) once recurring high-touch + B2B MRR sustainably exceeds **$18,500/mo** or Coach Support reaches **>=80% of the 15-athlete cap**.
- **Tax & Merchant Hygiene:** Budget ~2.9% Stripe processing fees and verify Stripe Automatic Tax (\`txcd_10103000\`, 6.25% MA SaaS tax under 830 CMR 64H.1.7) before public go-live.`
    }

    case 'enterprise-ops':
      return `## Claire Gallagher · Enterprise Ops, Hiring & Compliance Playbook

**Prepared for Scott Gordon (Founding Principal, Forge Athletic) · Brief Focus:** ${cleanQuestion}  
**Live Operational Posture:** ${telemetry.activeAssignedClients} assigned clients · ${telemetry.onboardingCompletionRatePct}% onboarding complete · ${telemetry.unreadClientMessagesCount} unread client messages · ${telemetry.sessionsThisWeek} live sessions this week.

### 1. Massachusetts W-2 Associate Coach Scaling Checklist (M.G.L. c. 149 § 148B)
- [ ] **W-2 Classification Only:** Because Associate Coaches deliver Forge Athletic's core coaching service under Forge methodologies, classify strictly as **W-2 employees** (Massachusetts ABC test Prong 2 prohibits 1099 misclassification).
- [ ] **Statutory Coverage:** Activate Massachusetts Workers' Compensation insurance, MA Paid Family & Medical Leave (PFML), and payroll withholding prior to Day 1.
- [ ] **Credential & Safety Verification:** Verify active NCCA-accredited **NASM-CPT or CSCS**, current **Adult CPR/AED**, and signed **Proprietary Information & Inventions Agreement (PIIA)**.
- [ ] **Platform Access Provisioning:** Add verified email to \`AUTHORIZED_W2_COACH_EMAILS\` and enforce client-level RLS isolation via \`requireCoachAssignedClient\`.

### 2. HIPAA (1996) & Clinical Liability Governance
- [ ] **Technical Safeguards:** Maintain TLS 1.3 in transit, AES-256 at rest, private Supabase Storage buckets with time-limited signed URLs, and Paid Gemini / Vertex AI **Zero-Data-Retention** API keys only.
- [ ] **Clinical Intake Gates:** Verify automated **PAR-Q+ Phase 0 medical hold** blocks exercise generation on cardiovascular/dizziness flags until written physician clearance is uploaded.
- [ ] **ERAP Enforcement:** Confirm every live WebRTC session verifies client physical training address and local EMS dispatch coordinates.
- [ ] **Zero-Pixel Privacy:** Maintain complete exclusion of GA4/Meta ad pixels (FTC Health Breach Notification Rule 16 CFR Part 318 & MA Wiretap Act compliance).

### 3. Pre-Launch Billing & SLA Sign-Off
- [ ] Confirm \`STRIPE_AUTOMATIC_TAX_ENABLED=true\` and Stripe tax code \`txcd_10103000\` on Core/Plus SaaS tiers (830 CMR 64H.1.7).
- [ ] Maintain <=24h SLA on Coach Support messaging and <=4h SLA on Hybrid Concierge retainers.

*Governance Note: Operational checklist for internal execution; have licensed Massachusetts employment, healthcare privacy, and tax counsel review final employment agreements and corporate MSAs.*`
  }
}

export async function runExecutiveBotTurn(
  req: ExecutiveChatRequest,
  telemetry: EnterpriseTelemetrySnapshot
): Promise<ExecutiveChatResponse> {
  const sanitized = stripPiiAndRawFramesFromCoachContext({
    message: req.message,
  })
  const cleanMessage = String(sanitized.message || '').trim().slice(0, MAX_INPUT_CHARS)
  if (!cleanMessage) {
    throw new Error('Message is required.')
  }

  const deliverableMode: DeliverableMode = req.deliverableMode ?? 'advisory'
  const profile = EXECUTIVE_BOT_PROFILES[req.botId]
  const systemInstruction = buildExecutiveBotSystemPrompt(req.botId, deliverableMode)
  const telemetryPrompt = formatTelemetryForPrompt(telemetry)

  const userPrompt = `${telemetryPrompt}

FOUNDING PRINCIPAL REQUEST (Mode: ${deliverableMode}):
"${cleanMessage}"

Deliver a high-leverage, immediately usable response tailored specifically to Forge Athletic.`

  const geminiReply = await callGeminiText({
    systemInstruction,
    history: Array.isArray(req.history) ? req.history : [],
    userPrompt,
    temperature: deliverableMode === 'financial_model' || deliverableMode === 'compliance_checklist' ? 0.25 : 0.45,
    maxOutputTokens: 2400,
  })

  const replyMarkdown =
    geminiReply || buildDeterministicExecutiveReply(req.botId, cleanMessage, telemetry)

  return {
    botId: req.botId,
    botName: profile.name,
    botTitle: profile.title,
    deliverableTitle: deriveDeliverableTitle(req.botId, deliverableMode),
    deliverableMode,
    replyMarkdown,
    suggestedFollowUps: deriveExecutiveFollowUps(req.botId),
    engineMode: geminiReply ? 'gemini_ai' : 'deterministic_playbook',
    telemetry,
  }
}

function classifyPublicIntent(message: string): {
  recommendedTier: PublicConciergeResponse['recommendedTier']
  isMedicalQuery: boolean
} {
  const lower = message.toLowerCase()
  const isMedicalQuery =
    /\b(diagnos|torn|herniat|fractur|chest pain|dizzy|prescrib|physical therapy|rehab|surgery clearance|medication)\b/i.test(
      lower
    )

  if (/\b(corporate|company|team|employees|executives|hr|seats|organization|workplace|cohort|b2b)\b/i.test(lower)) {
    return { recommendedTier: 'corporate', isMedicalQuery }
  }
  if (/\b(1[- ]?on[- ]?1|live session|private session|webrtc|single session|pack|screen only)\b/i.test(lower)) {
    return { recommendedTier: 'private_sessions', isMedicalQuery }
  }
  if (/\b(direct|text|sms|coach support|accountability|299|custom|15|master)\b/i.test(lower)) {
    return { recommendedTier: 'coach_support', isMedicalQuery }
  }
  if (/\b(travel|hotel|nutrition|macros|video review|form lab|desk|ergonomic|plus|99)\b/i.test(lower)) {
    return { recommendedTier: 'plus', isMedicalQuery }
  }
  return { recommendedTier: 'core', isMedicalQuery }
}

function buildPublicActionLinks(
  recommendedTier: PublicConciergeResponse['recommendedTier'],
  launchMode: 'prelaunch_waitlist' | 'public_live'
): ConciergeActionLink[] {
  if (launchMode === 'prelaunch_waitlist') {
    if (recommendedTier === 'corporate') {
      return [
        { label: 'Reserve Founding / Corporate Priority', href: '/waitlist', variant: 'primary' },
        { label: 'Verify Coach Credentials', href: '/credentials', variant: 'secondary' },
      ]
    }
    return [
      { label: 'Claim HOLIDAY25 Founding Pass', href: '/waitlist', variant: 'primary' },
      { label: 'Take 2-Min Starting Point Quiz', href: '/apply', variant: 'secondary' },
    ]
  }

  if (recommendedTier === 'corporate') {
    return [
      { label: 'Request Corporate Proposal', href: '/corporate/proposal', variant: 'primary' },
      { label: 'Compare All Plans', href: '/packages', variant: 'secondary' },
    ]
  }

  return [
    { label: 'Find Your Starting Point (/apply)', href: '/apply', variant: 'primary' },
    { label: 'Compare Memberships', href: '/packages', variant: 'secondary' },
  ]
}

function buildDeterministicPublicReply(
  message: string,
  recommendedTier: PublicConciergeResponse['recommendedTier'],
  isMedicalQuery: boolean,
  launchMode: 'prelaunch_waitlist' | 'public_live'
): string {
  const lower = message.toLowerCase()
  const launchNote =
    launchMode === 'prelaunch_waitlist'
      ? '\n\nWe launch publicly on **Monday, January 4, 2027 (6:00 AM EST)**—you can reserve your **HOLIDAY25** Founding Pass now to lock in **25% off continuously** plus a complimentary **60-minute Kickoff Movement Screen** with Coach Gordon.'
      : '\n\nYou can start with our **2-minute diagnostic quiz** or begin a **7-day free trial** on Core Lab right away.'

  if (isMedicalQuery) {
    return `**Clinical Scope & Safety First:** Forge Athletic provides evidence-based NASM personal training and movement coaching—not medical diagnosis or physical therapy. If you are experiencing acute pain, dizziness, or recovering from surgery, please consult a licensed physician or physical therapist first.

Once cleared, every Forge Athletic member completes our automated **PAR-Q+ health readiness screening** so your 5-phase **NASM OPT™** plan respects your orthopedic history from day one. Would you like to see how **Plus ($99/mo)** or **Coach Support ($299/mo)** handles form reviews and safe movement progressions?`
  }

  if (/\b(posture|camera|33[- ]?point|privacy|upload|cloud video|scan|mediapipe)\b/i.test(lower)) {
    return `Our **33-Point Posture & Movement Screening** runs **100% locally in your browser** using computer vision—no raw camera video is uploaded to cloud servers, and Forge Athletic uses **zero third-party ad or health tracking pixels**.

It evaluates alignment checkpoints (forward head tilt, shoulder symmetry, pelvic balance, and Overhead Squat compensations) and automatically injects targeted 4-phase corrective warm-ups into your **NASM OPT™** training plan.${launchNote}`
  }

  if (/\b(holiday25|founding|trial|discount|promo)\b/i.test(lower)) {
    return `The **HOLIDAY25 Founding Member Pass** gives you:
- **25% Continuous Tier Rate Lock** on your chosen monthly tier for as long as you maintain active enrollment (redeemable through Jan 31, 2027).
- **Complimentary 60-Minute 1-on-1 Kickoff Movement Screen** with Coach Gordon (unlocked on your first paid billing cycle).
- **7-Day Free Trial** available on **Core Lab ($49/mo)** so you can test the full training sanctuary risk-free.

Which tier are you leaning toward—**Core Lab ($49/mo)**, **Plus ($99/mo)**, or **1-on-1 Coach Support ($299/mo)**?`
  }

  if (recommendedTier === 'corporate') {
    return `**Forge Athletic Corporate Leadership Retainers** are built for busy executive, biotech, tech, and remote teams who need clinical strength and orthopedic longevity without losing hours commuting to a gym:

- **Boutique Syndicate (5 seats):** **$20,000 / yr**
- **Executive Core (10 seats):** **$35,000 / yr**
- **Partner Cohort (25 seats):** **$75,000 / yr**
- **Enterprise Division (50+ seats):** **$135,000+ / yr**

Every seat includes individualized **5-Phase NASM OPT™** periodization, **local in-browser 33-point posture screening** (zero cloud video uploads, HIPAA-aligned safeguards), travel/hotel adaptations, and quarterly leadership progress reviews. Roughly how many team members are you looking to support?`
  }

  if (recommendedTier === 'private_sessions') {
    return `You can work directly 1-on-1 with Coach Gordon in our encrypted **60fps WebRTC Telehealth Studio** (evening and Saturday windows):
- **Coach-Reviewed Movement Screen & Kinetic Restoration:** **$159** (45–60 min diagnostic + bespoke corrective warmup)
- **Single 60-Min Private Session:** **$180**
- **4-Session Pack:** **$660** ($165/session) · **8-Session Pack:** **$1,240** ($155/session)

Are you looking for a standalone movement diagnostic or ongoing weekly coaching?`
  }

  if (recommendedTier === 'coach_support') {
    return `For leaders who want direct human oversight and fast adaptations, **Coach Support ($299/mo)** is our flagship 1-on-1 membership—strictly capped at **15 active athletes** so Coach Gordon personally stewards every roster spot:
- Direct messaging & SMS access with Coach Gordon (**24h SLA**)
- Coach-Certified safety gate on your **NASM OPT™** training plan
- **8 Form Lab slow-motion video reviews / month** + quarterly live 1:1 WebRTC strategy review
- Full Nutrition Blueprint, Multi-Day Travel Pass, and unlimited Desk Ergonomics Audits${launchNote}`
  }

  if (recommendedTier === 'plus') {
    return `For a demanding desk and travel schedule, **Forge Athletic Plus ($99/mo or $899/yr)** is typically our highest-value fit:
- **Multi-Day Travel Training Pass & 20m Express Mode** so hotel gyms or tight days never break your streak
- **4 Form Lab Video Reviews / month** with certified biomechanical feedback
- **Unlimited Desk Ergonomics Camera Audits** + 5-minute between-meeting mobility resets
- **Phase-Synced Nutrition Blueprint** & weekly Proof-of-Work dossiers${launchNote}`
  }

  return `Here is how our three core memberships line up so you can pick the exact level of coaching support you need:
- **Core Lab ($49/mo · 7-day free trial):** Personalized 5-Phase NASM OPT™ plan, local 33-point posture screening, 20m Express Mode, and Coach Gordon's real voice pacing.
- **Plus ($99/mo):** Adds **4 Form Lab video reviews/mo**, Phase-Synced Nutrition Blueprint, Multi-Day Travel Pass, and unlimited Desk Ergonomics Audits.
- **Coach Support ($299/mo · capped at 15):** Adds direct messaging/SMS with Coach Gordon (24h SLA), **8 Form Lab reviews/mo**, and quarterly 1:1 live strategy reviews.${launchNote}

What is your primary goal right now—building strength, fixing desk posture, or getting a program that survives heavy travel?`
}

export async function runPublicConciergeTurn(
  req: PublicConciergeRequest
): Promise<PublicConciergeResponse> {
  const cleanMessage = sanitizePiiString(String(req.message || ''))
    .trim()
    .slice(0, MAX_PUBLIC_INPUT_CHARS)

  if (!cleanMessage) {
    throw new Error('Message is required.')
  }

  const launchMode: 'prelaunch_waitlist' | 'public_live' = isPublicRegistrationOpen()
    ? 'public_live'
    : 'prelaunch_waitlist'

  const { recommendedTier, isMedicalQuery } = classifyPublicIntent(cleanMessage)
  const actionLinks = buildPublicActionLinks(recommendedTier, launchMode)

  const systemInstruction = buildPublicConciergeSystemPrompt(launchMode)
  const pageContextNote = req.pageContext
    ? `Visitor Current Page: ${sanitizePiiString(req.pageContext).slice(0, 80)}\n`
    : ''

  let replyMarkdown: string | null = null
  if (!isMedicalQuery) {
    replyMarkdown = await callGeminiText({
      systemInstruction,
      history: Array.isArray(req.history) ? req.history : [],
      userPrompt: `${pageContextNote}Visitor Question:\n"${cleanMessage}"\n\nAnswer helpfully and concisely in Forge Athletic's calm, authoritative voice.`,
      temperature: 0.35,
      maxOutputTokens: 900,
    })
  }

  const finalReply =
    replyMarkdown ||
    buildDeterministicPublicReply(cleanMessage, recommendedTier, isMedicalQuery, launchMode)

  const suggestedFollowUps =
    recommendedTier === 'corporate'
      ? ['What does a 90-day corporate pilot include?', 'How do you protect employee privacy?']
      : ['Compare Core ($49) vs. Plus ($99)', 'How does the 33-point posture scan work?']

  return {
    botId: 'sales-concierge',
    replyMarkdown: finalReply,
    recommendedTier,
    suggestedFollowUps,
    actionLinks,
    engineMode: replyMarkdown ? 'gemini_ai' : 'deterministic_concierge',
    launchMode,
  }
}
