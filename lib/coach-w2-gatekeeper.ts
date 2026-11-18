/**
 * Massachusetts W-2 Associate Coach Provisioning Gatekeeper (M.G.L. c. 149, § 148B)
 *
 * Prevents accidental creation or promotion of `role: 'coach'` accounts for
 * unclassified 1099 contractors. Only the founder's verified coach accounts or
 * emails explicitly attested in `AUTHORIZED_W2_COACH_EMAILS` (after W-2 payroll,
 * MA Workers' Compensation, E&O endorsement, and signed PIIA onboarding) may be
 * provisioned with `coach` privileges.
 */

const FOUNDER_COACH_EMAILS = new Set([
  'coach@forge-athletic.app',
  'scott@forge-athletic.app',
])

export function getAuthorizedCoachEmails(): Set<string> {
  const allowed = new Set<string>(FOUNDER_COACH_EMAILS)

  const masterEnv = process.env.COACH_EMAIL?.trim().toLowerCase()
  if (masterEnv) allowed.add(masterEnv)

  const testCoachEnv = process.env.TEST_COACH_EMAIL?.trim().toLowerCase()
  if (testCoachEnv && process.env.NODE_ENV !== 'production') {
    allowed.add(testCoachEnv)
  }

  const w2Roster = process.env.AUTHORIZED_W2_COACH_EMAILS || ''
  for (const raw of w2Roster.split(',')) {
    const normalized = raw.trim().toLowerCase()
    if (normalized) {
      allowed.add(normalized)
    }
  }

  return allowed
}

export function isAuthorizedW2OrFounderCoachEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAuthorizedCoachEmails().has(email.trim().toLowerCase())
}

export function assertAuthorizedCoachProvisioning(email: string): void {
  if (!isAuthorizedW2OrFounderCoachEmail(email)) {
    throw new Error(
      `[W2-Coach-Gatekeeper] Refusing to provision coach role for "${email}". ` +
        'Under M.G.L. c. 149, § 148B, Associate Coaches must complete W-2 onboarding, ' +
        'MA Workers’ Compensation endorsement, and PIIA execution before being added to AUTHORIZED_W2_COACH_EMAILS.'
    )
  }
}
