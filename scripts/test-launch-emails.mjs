import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const args = process.argv.slice(2)
const getArg = name => {
  const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
  if (idx === -1) return null
  const token = args[idx]
  if (token.includes('=')) return token.slice(token.indexOf('=') + 1)
  return args[idx + 1] ?? null
}

const baseUrl = (getArg('url') || process.env.MARKETING_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  ''
)
const toEmail = getArg('to')
const toPhone = getArg('sms')
const templateId = getArg('template')
const firstName = getArg('name') || 'Scott'

console.log('\n=============================================================')
console.log(' FORGE ATHLETIC — LAUNCH SEQUENCE EMAIL & SMS TEST RUNNER')
console.log('=============================================================\n')

const previewUrl = `${baseUrl}/api/test-harness/launch-emails?firstName=${encodeURIComponent(firstName)}`
let previewData
try {
  const res = await fetch(previewUrl)
  if (!res.ok) {
    console.error(`✖ Failed to reach ${previewUrl} (HTTP ${res.status}). Make sure 'npm run dev' is running.`)
    process.exit(1)
  }
  previewData = await res.json()
} catch (err) {
  console.error(
    `✖ Could not connect to ${baseUrl}. Start 'npm run dev' first, then re-run this script.`
  )
  console.error(`  (${err instanceof Error ? err.message : String(err)})`)
  process.exit(1)
}

const outDir = path.resolve(process.cwd(), 'test-results/email-previews')
fs.mkdirSync(outDir, { recursive: true })

console.log(`1. Rendered & Validated ${previewData.items.length} Templates:`)
for (const item of previewData.items) {
  const filename =
    item.channel === 'email'
      ? `${item.code}-${item.id}.html`
      : `${item.code}-${item.id}.sms.txt`
  const fullPath = path.join(outDir, filename)

  if (item.channel === 'email') {
    fs.writeFileSync(fullPath, item.rendered.html, 'utf8')
    console.log(`  ✔ [${item.code}] ${item.name} -> "${item.rendered.subject}"`)
  } else {
    fs.writeFileSync(fullPath, item.rendered.body + '\n', 'utf8')
    console.log(`  ✔ [${item.code}] ${item.name} (${item.rendered.body.length} chars SMS)`)
  }
}

console.log(`\n  Saved local HTML/SMS previews to: ${outDir}`)
console.log(`  Interactive browser studio:       ${baseUrl}/test-harness/launch-emails\n`)

if (toEmail || toPhone) {
  console.log('2. Sending Live Test Dispatch:')
  const postBody = {
    templateId: templateId || undefined,
    sendAllEmails: Boolean(toEmail && !templateId),
    prefixTestTag: true,
    toEmail: toEmail || undefined,
    toPhone: toPhone || undefined,
    firstName,
  }

  const sendRes = await fetch(`${baseUrl}/api/test-harness/launch-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody),
  })
  const sendJson = await sendRes.json().catch(() => ({}))

  if (!sendRes.ok) {
    console.error('  ✖ Live test send failed:', sendJson)
    process.exit(1)
  }

  for (const r of sendJson.results ?? []) {
    if (r.delivered) {
      console.log(`  ✔ [${r.code}] Delivered (${r.providerMessageId ?? 'sent'})`)
    } else {
      console.log(`  ⚠ [${r.code}] Not delivered (${r.error ?? r.reason ?? 'skipped'})`)
    }
  }
} else {
  console.log('Tip: Pass --to=you@yourdomain.com to send all 8 test emails to your real inbox!')
}

