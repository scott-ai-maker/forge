#!/usr/bin/env node
/**
 * scripts/check-dev-test-env.mjs
 * Preflight verification script for the GAA Development & Test Environment.
 */

import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import os from 'node:os'
import { execSync } from 'node:child_process'

const ROOT_DIR = process.cwd()

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

function checkPort(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const socket = new net.Socket()
    socket.setTimeout(800)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true) // Port is in use
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      resolve(false) // Port is free
    })
    socket.connect(port, host)
  })
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}  GAA Dev & Test Environment Diagnostic Preflight  ${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`)

  let issuesFound = 0

  // 1. Runtime / System
  console.log(`${colors.bold}1. Node & Runtime Environment${colors.reset}`)
  console.log(`   • Node Version: ${process.version}`)
  console.log(`   • OS: ${os.type()} ${os.release()} (${os.arch()})`)
  console.log(`   • Workspace: ${ROOT_DIR}`)

  // 2. Environment Files
  console.log(`\n${colors.bold}2. Environment Configuration Files${colors.reset}`)
  const envLocalPath = path.join(ROOT_DIR, '.env.local')
  const envTestPath = path.join(ROOT_DIR, '.env.test')
  const envExamplePath = path.join(ROOT_DIR, '.env.example')

  const hasEnvLocal = fs.existsSync(envLocalPath)
  const hasEnvTest = fs.existsSync(envTestPath)
  const hasEnvExample = fs.existsSync(envExamplePath)

  console.log(`   • .env.local:   ${hasEnvLocal ? colors.green + '✓ Found' : colors.yellow + '⚠ Missing (required for live dev)'}${colors.reset}`)
  console.log(`   • .env.test:    ${hasEnvTest ? colors.green + '✓ Found (Mock Test Defaults)' : colors.red + '✗ Missing'}${colors.reset}`)
  console.log(`   • .env.example: ${hasEnvExample ? colors.green + '✓ Found' : colors.yellow + '⚠ Missing'}${colors.reset}`)

  const envLocal = hasEnvLocal ? parseEnvFile(envLocalPath) : {}
  const envTest = hasEnvTest ? parseEnvFile(envTestPath) : {}

  // 3. Supabase Configuration
  console.log(`\n${colors.bold}3. Supabase Backend Integration${colors.reset}`)
  const supabaseUrl = envLocal.NEXT_PUBLIC_SUPABASE_URL || envTest.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY || envTest.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseService = envLocal.SUPABASE_SERVICE_ROLE_KEY || envTest.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseAnon && supabaseService) {
    const isMock = supabaseUrl.includes('mock') || supabaseUrl.includes('127.0.0.1')
    console.log(`   • URL: ${supabaseUrl} ${isMock ? colors.yellow + '(Mock / Local)' : colors.green + '(Active / Remote)'}${colors.reset}`)
    console.log(`   • Anon Key: ${colors.green}✓ Configured${colors.reset}`)
    console.log(`   • Service Role Key: ${colors.green}✓ Configured${colors.reset}`)
  } else {
    console.log(`   • ${colors.red}✗ Incomplete Supabase configuration in .env.local / .env.test${colors.reset}`)
    issuesFound++
  }

  // 4. Test & Demo Auth Flags
  console.log(`\n${colors.bold}4. Demo Auth & Preview Flags${colors.reset}`)
  const demoLogin = envLocal.ENABLE_DEMO_LOGIN || envTest.ENABLE_DEMO_LOGIN || 'true'
  const anonPreview = envLocal.NEXT_PUBLIC_ALLOW_ANON_PREVIEW || envTest.NEXT_PUBLIC_ALLOW_ANON_PREVIEW || 'true'

  console.log(`   • ENABLE_DEMO_LOGIN:              ${demoLogin === 'true' ? colors.green + 'Enabled' : colors.yellow + 'Disabled'}${colors.reset}`)
  console.log(`   • NEXT_PUBLIC_ALLOW_ANON_PREVIEW: ${anonPreview === 'true' ? colors.green + 'Enabled' : colors.yellow + 'Disabled'}${colors.reset}`)

  // 5. Test Frameworks
  console.log(`\n${colors.bold}5. Testing Frameworks & Tooling${colors.reset}`)

  // Vitest
  const vitestConfigPath = path.join(ROOT_DIR, 'vitest.config.ts')
  const vitestSetupPath = path.join(ROOT_DIR, 'tests/setup.ts')
  if (fs.existsSync(vitestConfigPath) && fs.existsSync(vitestSetupPath)) {
    console.log(`   • Vitest Configuration: ${colors.green}✓ Configured with tests/setup.ts${colors.reset}`)
  } else {
    console.log(`   • Vitest Configuration: ${colors.yellow}⚠ Incomplete setup${colors.reset}`)
    issuesFound++
  }

  // Playwright
  let playwrightVersion = 'Not installed'
  try {
    const pwOut = execSync('npx playwright --version', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
    playwrightVersion = pwOut
  } catch {
    // ignore
  }

  const pwCacheDir = path.join(os.homedir(), 'Library/Caches/ms-playwright')
  const hasPwCache = fs.existsSync(pwCacheDir)
  let installedBrowsers = []
  if (hasPwCache) {
    try {
      installedBrowsers = fs.readdirSync(pwCacheDir).filter(f => !f.startsWith('.'))
    } catch {
      // ignore
    }
  }

  console.log(`   • Playwright:           ${colors.green}✓ ${playwrightVersion}${colors.reset}`)
  if (installedBrowsers.length > 0) {
    console.log(`   • Playwright Browsers:  ${colors.green}✓ Found (${installedBrowsers.slice(0, 3).join(', ')}...)${colors.reset}`)
  } else {
    console.log(`   • Playwright Browsers:  ${colors.yellow}⚠ Run 'npx playwright install' if needed${colors.reset}`)
  }

  // 6. Dev Server Port Status
  console.log(`\n${colors.bold}6. Local Server Port (3000)${colors.reset}`)
  const portInUse = await checkPort(3000)
  if (portInUse) {
    console.log(`   • Port 3000: ${colors.cyan}● Active (Next.js server is currently running)${colors.reset}`)
  } else {
    console.log(`   • Port 3000: ${colors.green}○ Available for 'npm run dev'${colors.reset}`)
  }

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`)
  if (issuesFound === 0) {
    console.log(`${colors.bold}${colors.green}✓ Dev & Test Environment is HEALTHY and READY!${colors.reset}`)
  } else {
    console.log(`${colors.bold}${colors.yellow}⚠ Completed with ${issuesFound} warning(s). Review above.${colors.reset}`)
  }
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`)

  console.log(`${colors.bold}Recommended Commands:${colors.reset}`)
  console.log(`   • Run Unit/Integration Tests:  ${colors.cyan}npm test${colors.reset}`)
  console.log(`   • Run Vitest in Watch Mode:    ${colors.cyan}npm run test:watch${colors.reset}`)
  console.log(`   • Run Full Validation Suite:   ${colors.cyan}npm run test:all${colors.reset}`)
  console.log(`   • Run UI E2E Tests:            ${colors.cyan}npm run test:ui${colors.reset}`)
  console.log(`   • Start Dev Server:            ${colors.cyan}npm run dev${colors.reset}\n`)
}

main().catch(err => {
  console.error('Diagnostic check failed:', err)
  process.exit(1)
})

