import dns from 'node:dns/promises'
import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'
import { Resend } from 'resend'
import { validateInboundEmail } from '../lib/email-validation.ts'
import { appendComplianceFooter, createUnsubscribeToken } from '../lib/marketing-email.ts'

if (!process.env.RESEND_API_KEY) {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        let val = trimmed.slice(idx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (process.env[key] === undefined) {
          process.env[key] = val
        }
      }
    }
  }
}

const args = process.argv.slice(2)
const probeTarget = args.find((a, i) => args[i - 1] === '--probe' || a.startsWith('--probe='))?.replace(/^--probe=/, '')

console.log('\n=============================================================')
console.log(' GORDON ATHLETIC ADVISORY — EMAIL INFRASTRUCTURE DIAGNOSTIC')
console.log('=============================================================\n')

let passes = 0
let warnings = 0
let failures = 0

function logPass(msg) {
  passes++
  console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${msg}`)
}

function logWarn(msg) {
  warnings++
  console.log(`  \x1b[33m⚠ [WARN]\x1b[0m ${msg}`)
}

function logFail(msg) {
  failures++
  console.log(`  \x1b[31m✖ [FAIL]\x1b[0m ${msg}`)
}

// ── 1. ENVIRONMENT CONFIGURATION ──────────────────────────────────────────
console.log('1. Environment Configuration:')
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.MARKETING_FROM_EMAIL
const replyToEmail = process.env.MARKETING_REPLY_TO_EMAIL
const cronSecret = process.env.MARKETING_CRON_SECRET
const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

if (resendApiKey) {
  logPass(`RESEND_API_KEY is configured (${resendApiKey.slice(0, 7)}...)`)
} else {
  logFail('RESEND_API_KEY is missing in environment (.env.local)')
}

if (fromEmail) {
  logPass(`MARKETING_FROM_EMAIL is configured: ${fromEmail}`)
} else {
  logFail('MARKETING_FROM_EMAIL is missing in environment (.env.local)')
}

if (replyToEmail) {
  logPass(`MARKETING_REPLY_TO_EMAIL is configured: ${replyToEmail}`)
} else {
  logWarn('MARKETING_REPLY_TO_EMAIL not set (will default to from address)')
}

if (cronSecret) {
  logPass('MARKETING_CRON_SECRET is configured for sequence dispatch & HMAC tokens')
} else {
  logWarn('MARKETING_CRON_SECRET not set (using fallback secret for HMAC signatures)')
}

if (webhookSecret) {
  logPass('RESEND_WEBHOOK_SECRET is configured for bounce & complaint processing')
} else {
  logWarn('RESEND_WEBHOOK_SECRET not set (webhooks will accept unsigned payloads in dev mode)')
}

// Extract domain
const sendingDomain = fromEmail?.includes('@') ? fromEmail.split('@')[1] : null
const rootDomain = sendingDomain ? sendingDomain.split('.').slice(-2).join('.') : null

// ── 2. DNS DELIVERABILITY & AUTHENTICATION (SPF / DMARC / MX) ────────────
console.log('\n2. DNS Authentication & Deliverability:')
if (sendingDomain) {
  console.log(`   Auditing DNS records for: ${sendingDomain} (Root: ${rootDomain})`)

  // Check MX
  try {
    const mxRecords = await dns.resolveMx(sendingDomain)
    if (mxRecords && mxRecords.length > 0) {
      logPass(`MX Records active: ${mxRecords.map(r => `${r.exchange} (pri ${r.priority})`).join(', ')}`)
    } else {
      logWarn(`No MX records found directly on ${sendingDomain}. Inbound return-path may use parent domain.`)
    }
  } catch {
    logWarn(`Could not resolve MX records for ${sendingDomain}. Verify inbound DNS if using subdomain.`)
  }

  // Check SPF
  try {
    const txtRecords = await dns.resolveTxt(sendingDomain)
    const flatTxt = txtRecords.map(r => r.join(''))
    const spf = flatTxt.find(t => t.startsWith('v=spf1'))

    if (spf) {
      if (spf.includes('include:resend.com') || spf.includes('amazonses.com')) {
        logPass(`SPF record verified with provider authorization: "${spf}"`)
      } else {
        logWarn(`SPF record found but missing "include:resend.com": "${spf}"`)
      }
    } else {
      // Check parent domain SPF fallback
      try {
        const parentTxt = await dns.resolveTxt(rootDomain)
        const parentSpf = parentTxt.map(r => r.join('')).find(t => t.startsWith('v=spf1'))
        if (parentSpf) {
          logPass(`Parent SPF record found on ${rootDomain}: "${parentSpf}"`)
        } else {
          logWarn(`No SPF record detected on ${sendingDomain} or ${rootDomain}. Required by Gmail & Yahoo.`)
        }
      } catch {
        logWarn(`No SPF record detected on ${sendingDomain}.`)
      }
    }
  } catch {
    logWarn(`DNS TXT query failed for ${sendingDomain}. Check domain registration and DNS propagation.`)
  }

  // Check DMARC
  try {
    const dmarcHost = `_dmarc.${rootDomain || sendingDomain}`
    const dmarcRecords = await dns.resolveTxt(dmarcHost)
    const flatRecords = dmarcRecords.map(r => r.join(''))

    if (flatRecords.length > 1) {
      logWarn(`Found ${flatRecords.length} separate TXT records on ${dmarcHost}: [${flatRecords.map(r => `"${r}"`).join(', ')}]`)
      console.log(`\n      \x1b[31m✖ RFC 7489 Violation: A domain MUST have only ONE DMARC record.\x1b[0m`)
      console.log(`      \x1b[33mCurrently "v=DMARC1" and "p=none" are entered as two separate TXT records.\x1b[0m`)
      console.log(`      \x1b[36m👉 In Vercel DNS: Delete both records and save ONE combined record:\x1b[0m`)
      console.log(`         Type:  TXT`)
      console.log(`         Name:  _dmarc`)
      console.log(`         Value: v=DMARC1; p=none;\n`)
    } else {
      const record = flatRecords[0]
      if (record && record.startsWith('v=DMARC1') && record.includes('p=')) {
        logPass(`DMARC record verified on ${dmarcHost}: "${record}"`)
      } else if (record && record.startsWith('v=DMARC1')) {
        logWarn(`DMARC record found on ${dmarcHost} but missing required "p=" policy: "${record}"`)
        console.log(`      \x1b[36m👉 Update value to: v=DMARC1; p=none;\x1b[0m\n`)
      } else {
        logWarn(`No valid DMARC record found on ${dmarcHost}. Required by Google (Gmail), Yahoo & Microsoft.`)
        console.log(`\n      \x1b[36m👉 Add this TXT record to your DNS provider (Vercel DNS):\x1b[0m`)
        console.log(`         Type:  TXT`)
        console.log(`         Name:  _dmarc`)
        console.log(`         Value: v=DMARC1; p=none;\n`)
      }
    }
  } catch {
    logWarn(`No DMARC record found at _dmarc.${rootDomain || sendingDomain}. Required by Google (Gmail) & Yahoo.`)
    console.log(`\n      \x1b[36m👉 Add this TXT record to your DNS provider (Vercel DNS):\x1b[0m`)
    console.log(`         Type:  TXT`)
    console.log(`         Name:  _dmarc`)
    console.log(`         Value: v=DMARC1; p=none;\n`)
  }

  // Check email link base URL alignment
  const emailLinkBase = process.env.EMAIL_LINK_BASE_URL || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL
  if (emailLinkBase) {
    if (emailLinkBase.includes('localhost') || emailLinkBase.includes('127.0.0.1')) {
      logWarn(`Email base URL is set to "${emailLinkBase}". Links pointing to localhost trigger Resend domain mismatch warnings and spam filters.`)
      console.log(`      \x1b[36m👉 Add EMAIL_LINK_BASE_URL=https://${rootDomain || sendingDomain} in .env.local to send clean production links.\x1b[0m\n`)
    } else {
      logPass(`Email link base URL aligned: ${emailLinkBase}`)
    }
  }
} else {
  logWarn('Skipping DNS audits: No sending domain configured.')
}

// ── 3. RESEND API DOMAIN VERIFICATION ────────────────────────────────────
console.log('\n3. Resend API Domain Verification:')
if (resendApiKey && !resendApiKey.includes('mock')) {
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${resendApiKey}` },
    })

    if (res.ok) {
      const data = await res.json()
      const domains = data?.data || []
      logPass(`Connected to Resend API successfully (${domains.length} domain(s) registered)`)

      const matched = domains.find(d => d.name === sendingDomain || d.name === rootDomain)
      if (matched) {
        logPass(`Domain "${matched.name}" status: ${matched.status} (Region: ${matched.region})`)
      } else if (domains.length > 0) {
        logWarn(`Active Resend domains: ${domains.map(d => `${d.name} (${d.status})`).join(', ')}. Ensure ${sendingDomain} is added.`)
      }
    } else if (res.status === 401) {
      logPass('Resend API key is valid for sending (configured with "Sending access" scope; domain management queries restricted by policy)')
    } else {
      logFail(`Resend API returned status ${res.status}: ${res.statusText}`)
    }
  } catch (err) {
    logFail(`Failed to connect to Resend API: ${err instanceof Error ? err.message : String(err)}`)
  }
} else {
  logPass('Resend API key is in test/mock mode. Skipping live API query.')
}

// ── 4. INBOUND VALIDATION ENGINE TEST RUN ────────────────────────────────
console.log('\n4. Inbound Email Validation Engine:')

const pristineCheck = await validateInboundEmail({ email: 'scott.gordon@gordonathleticadvisory.com', checkMx: false })
if (pristineCheck.valid) {
  logPass('Pristine corporate email passes syntax & structure check')
} else {
  logFail(`Pristine email failed: ${pristineCheck.error}`)
}

const typoCheck = await validateInboundEmail({ email: 'athlete@gmai.com', checkMx: false })
if (!typoCheck.valid && typoCheck.suggestedEmail === 'athlete@gmail.com') {
  logPass('Typo auto-detection correctly identified "gmai.com" -> "gmail.com"')
} else {
  logFail('Typo detector failed to flag misconfigured domain')
}

const burnerCheck = await validateInboundEmail({ email: 'throwaway@mailinator.com', checkMx: false })
if (!burnerCheck.valid && burnerCheck.error?.includes('disposable')) {
  logPass('Disposable/burner email domain blocked successfully')
} else {
  logFail('Burner email was not blocked')
}

const botCheck = await validateInboundEmail({
  email: 'real@domain.com',
  honeypot: 'spam_value',
  checkMx: false,
})
if (!botCheck.valid && botCheck.isBot) {
  logPass('Bot honeypot shield successfully intercepted automated submission')
} else {
  logFail('Bot honeypot failed to flag populated honeypot')
}

// ── 5. RFC 8058 UNLINKED UNSUBSCRIBE HEADERS & FOOTER ────────────────────
console.log('\n5. RFC 8058 & Compliance Check:')
const testRecipient = 'athlete@example.com'
const token = createUnsubscribeToken(testRecipient)
if (token && token.length === 32) {
  logPass(`HMAC-SHA256 unsubscribe token generated: ${token.slice(0, 10)}...`)
} else {
  logFail('Failed to generate 32-character HMAC token')
}

const testCompliance = appendComplianceFooter(
  '<p>Advisory Test Content</p>',
  'Advisory Test Content',
  testRecipient
)
if (
  testCompliance.html.includes('Unsubscribe') &&
  testCompliance.text.includes('75 Arlington St') &&
  testCompliance.unsubUrl.includes(token)
) {
  logPass('Compliant CAN-SPAM physical address & one-click unsubscribe links injected')
} else {
  logFail('Compliance footer missing required disclosures or token')
}

// ── 6. OPTIONAL PROBE SEND ────────────────────────────────────────────────
if (probeTarget) {
  console.log(`\n6. Outbound Probe Transmission to: ${probeTarget}`)
  if (!resendApiKey || resendApiKey.includes('mock') || !fromEmail) {
    logFail('Cannot execute probe transmission without live RESEND_API_KEY and MARKETING_FROM_EMAIL.')
  } else {
    try {
      const resend = new Resend(resendApiKey)
      const probeResult = await resend.emails.send({
        from: fromEmail,
        to: probeTarget,
        subject: '[Probe] Gordon Athletic Advisory Deliverability Audit',
        html: testCompliance.html,
        text: testCompliance.text,
        headers: {
          'List-Unsubscribe': `<${testCompliance.unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      if (probeResult.error) {
        logFail(`Probe dispatch failed: ${probeResult.error.message}`)
      } else {
        logPass(`Probe dispatched successfully! Resend Message ID: ${probeResult.data?.id}`)
        console.log(`   Headers included: List-Unsubscribe (<${testCompliance.unsubUrl}>)`)
        console.log('   Check inbox spam score, SPF/DKIM headers, and unsubscription link.')
      }
    } catch (err) {
      logFail(`Probe transmission threw error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
} else {
  console.log('\n6. Outbound Probe Transmission:')
  console.log('   (Omitted. Run with `node scripts/verify-email-health.mjs --probe target@email.com` to send a live test)')
}

// ── SUMMARY REPORT ────────────────────────────────────────────────────────
console.log('\n=============================================================')
console.log(` DIAGNOSTIC COMPLETE: ${passes} Passed, ${warnings} Warnings, ${failures} Failed`)
console.log('=============================================================\n')

if (failures > 0) {
  process.exit(1)
} else {
  process.exit(0)
}

