#!/usr/bin/env node
/**
 * Forge Athletic — Clean-Room Hybrid RAG Vector Seeder (`pgvector` + `gemini-embedding-001`)
 *
 * Triggers `/api/coach/rag/sync` using `RAG_SYNC_SECRET` or `SUPABASE_SERVICE_ROLE_KEY`
 * to idempotently embed and upsert all clean-room sports-science curriculum passages,
 * biomechanical movement profiles, and orthopedic contraindication protocols into `forge_rag_chunks`.
 *
 * Usage:
 *   npm run rag:seed
 *   npm run rag:seed -- --force
 */

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
const syncToken = (
  process.env.RAG_SYNC_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim()
const forceFlag = process.argv.includes('--force')

async function main() {
  if (!syncToken) {
    console.error(
      '[rag:seed] Missing RAG_SYNC_SECRET or SUPABASE_SERVICE_ROLE_KEY in .env.local.'
    )
    process.exit(1)
  }

  const endpoint = `${baseUrl}/api/coach/rag/sync${forceFlag ? '?force=true' : ''}`
  console.log(`[rag:seed] Syncing Forge Athletic clean-room RAG corpus -> ${endpoint}`)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${syncToken}`,
        'Content-Type': 'application/json',
      },
    })

    const payload = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error(`[rag:seed] Sync failed (HTTP ${res.status}):`, payload)
      process.exit(1)
    }

    console.log('[rag:seed] Forge Athletic pgvector sync complete:', payload)
  } catch (err) {
    console.error(
      `[rag:seed] Could not reach ${endpoint}. Ensure 'npm run dev' is running locally before seeding.`,
      err instanceof Error ? err.message : err
    )
    process.exit(1)
  }
}

void main()
