#!/usr/bin/env node
/**
 * Gordon Athletic Advisory — Automated Service Worker Version & Cache Sync Engine
 * Links public/sw.js cache version directly to package.json version on every build and Capacitor sync.
 * Guarantees immediate cache invalidation and fresh PWA client updates across all releases.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

export function syncServiceWorkerVersion() {
  const pkgPath = resolve(rootDir, 'package.json')
  const swPath = resolve(rootDir, 'public/sw.js')

  if (!existsSync(pkgPath)) {
    throw new Error(`package.json not found at ${pkgPath}`)
  }
  if (!existsSync(swPath)) {
    throw new Error(`public/sw.js not found at ${swPath}`)
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const appVersion = pkg.version
  if (!appVersion) {
    throw new Error('package.json does not specify a valid version string')
  }

  const targetVersionTag = `gaa-v${appVersion}`
  let swContent = readFileSync(swPath, 'utf8')

  // 1. Replace const VERSION = '...'
  const versionRegex = /(const\s+VERSION\s*=\s*['"])([^'"]+)(['"])/
  const match = swContent.match(versionRegex)

  let changed = false
  if (match) {
    const currentVersion = match[2]
    if (currentVersion !== targetVersionTag) {
      swContent = swContent.replace(versionRegex, `$1${targetVersionTag}$3`)
      changed = true
    }
  } else {
    // If not present, prepend or insert at top
    swContent = `const VERSION = '${targetVersionTag}'\n` + swContent
    changed = true
  }

  // 2. Ensure /manifest.webmanifest is included in PRECACHE
  if (!swContent.includes("'/manifest.webmanifest'")) {
    swContent = swContent.replace(
      /(const\s+PRECACHE\s*=\s*\[\s*OFFLINE_URL,)/,
      `$1\n  '/manifest.webmanifest',`
    )
    changed = true
  }

  if (changed) {
    writeFileSync(swPath, swContent, 'utf8')
    console.log(`[PWA Sync] Successfully synchronized public/sw.js cache version to '${targetVersionTag}'.`)
  } else {
    console.log(`[PWA Sync] public/sw.js is already synchronized to '${targetVersionTag}'.`)
  }

  // Also sync to ios/App/App/public/sw.js if it exists
  const iosSwPath = resolve(rootDir, 'ios/App/App/public/sw.js')
  if (existsSync(iosSwPath)) {
    writeFileSync(iosSwPath, swContent, 'utf8')
    console.log(`[PWA Sync] Synchronized iOS native web asset: ios/App/App/public/sw.js.`)
  }

  return { appVersion, targetVersionTag, changed }
}

// Run immediately if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    syncServiceWorkerVersion()
  } catch (err) {
    console.error('[PWA Sync] Failed to sync service worker version:', err)
    process.exit(1)
  }
}
