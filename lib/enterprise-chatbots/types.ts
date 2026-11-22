/**
 * Forge Athletic — Enterprise Growth Chatbot Suite Types
 *
 * Covers:
 * 1. Internal Founding Principal Executive Advisory Board (4 specialist bots in /coach)
 * 2. Public Sales & B2B Corporate Concierge (marketing pages)
 */

export type ExecutiveBotId =
  | 'b2b-partnerships'
  | 'growth-marketing'
  | 'cfo-revenue'
  | 'enterprise-ops'

export type PublicBotId = 'sales-concierge'

export type EnterpriseBotId = ExecutiveBotId | PublicBotId

export type DeliverableMode =
  | 'advisory'
  | 'playbook'
  | 'outreach_draft'
  | 'financial_model'
  | 'compliance_checklist'

export interface EnterpriseChatTurn {
  role: 'user' | 'assistant'
  text: string
}

export interface ExecutiveQuickPrompt {
  id: string
  label: string
  prompt: string
  deliverableMode: DeliverableMode
}

export interface ExecutiveBotProfile {
  id: ExecutiveBotId
  name: string
  roleLabel: string
  title: string
  shortLabel: string
  email: string
  departmentAlias: string
  formattedFrom: string
  avatarPath: string
  avatarAlt: string
  background: string
  voiceStyle: string
  accentTone: 'gold' | 'emerald' | 'cyan' | 'purple'
  tagline: string
  mission: string
  keyMetricsFocus: string[]
  quickPrompts: ExecutiveQuickPrompt[]
}

export interface PublicConciergeProfile {
  id: PublicBotId
  name: string
  firstName: string
  title: string
  email: string
  departmentAlias: string
  formattedFrom: string
  avatarPath: string
  avatarAlt: string
  background: string
  welcomeMessage: string
}

export interface ForgeLeadershipMember {
  id: 'scott-gordon' | 'lisa-gordon'
  name: string
  title: string
  credentials: string
  email: string
  departmentAlias?: string
  avatarPath: string
  avatarAlt: string
  bio: string
  focusAreas: string[]
}

export interface PublicQuickPrompt {
  id: string
  label: string
  prompt: string
}

export interface EnterpriseTelemetrySnapshot {
  generatedAt: string
  dataSource: 'live_supabase' | 'baseline_model'
  launchMode: 'prelaunch_waitlist' | 'public_live'
  daysUntilGoLive: number
  goLiveDateFormatted: string
  activeAssignedClients: number
  unassignedClients: number
  onboardingCompletedCount: number
  onboardingCompletionRatePct: number
  sessionsThisWeek: number
  attendanceRate30dPct: number | null
  lowCreditClientsCount: number
  inactive14dClientsCount: number
  unreadClientMessagesCount: number
  waitlistLeadsCount: number
  coachingApplicationsCount: number
  coachSupportCap: number
  coachSupportUtilizationPct: number
  verifiedMonthlyRecurringRevenueUsd: number
  verifiedAnnualRecurringRevenueUsd: number
  legacyRetainerClientsCount: number
  executiveTeamAccountsCount: number
}

export interface ExecutiveChatRequest {
  botId: ExecutiveBotId
  message: string
  deliverableMode?: DeliverableMode
  history?: EnterpriseChatTurn[]
}

export interface ExecutiveChatResponse {
  botId: ExecutiveBotId
  botName: string
  botTitle: string
  deliverableTitle: string
  deliverableMode: DeliverableMode
  replyMarkdown: string
  suggestedFollowUps: string[]
  engineMode: 'gemini_ai' | 'deterministic_playbook'
  telemetry: EnterpriseTelemetrySnapshot
}

export interface ConciergeActionLink {
  label: string
  href: string
  variant: 'primary' | 'secondary'
}

export interface PublicConciergeRequest {
  message: string
  pageContext?: string
  history?: EnterpriseChatTurn[]
}

export interface PublicConciergeResponse {
  botId: PublicBotId
  replyMarkdown: string
  recommendedTier?: 'core' | 'plus' | 'coach_support' | 'private_sessions' | 'corporate'
  suggestedFollowUps: string[]
  actionLinks: ConciergeActionLink[]
  engineMode: 'gemini_ai' | 'deterministic_concierge'
  launchMode: 'prelaunch_waitlist' | 'public_live'
}
