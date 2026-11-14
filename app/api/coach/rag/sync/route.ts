import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { AuthzError, getRequestAuthz, requireRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase'
import {
  buildForgeRagCorpusChunks,
  embedTextWithGemini,
  GEMINI_RAG_EMBEDDING_DIMS,
  GEMINI_RAG_EMBEDDING_MODEL,
} from '@/src/lib/rag/hybridRagEngine'

function hasValidServiceSyncToken(request: NextRequest): boolean {
  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!header) return false
  const [scheme, rawToken] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !rawToken) return false

  const candidate = Buffer.from(rawToken.trim())
  const secrets = [
    process.env.RAG_SYNC_SECRET?.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  ].filter((s): s is string => Boolean(s && s.length >= 16))

  for (const secret of secrets) {
    const expected = Buffer.from(secret)
    if (expected.length === candidate.length && timingSafeEqual(expected, candidate)) {
      return true
    }
  }
  return false
}

async function authorizeCoachOrSyncSecret(request: NextRequest): Promise<void> {
  if (hasValidServiceSyncToken(request)) {
    return
  }
  const authz = await getRequestAuthz(request)
  requireRole(authz.client.role, ['coach'])
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    await authorizeCoachOrSyncSecret(request)
    const corpusChunks = buildForgeRagCorpusChunks()

    let indexedVectorCount = 0
    let pgvectorTableReady = false
    try {
      const admin = supabaseAdmin()
      const { count, error } = await admin
        .from('forge_rag_chunks')
        .select('id', { count: 'exact', head: true })
        .not('embedding', 'is', null)
      if (!error) {
        pgvectorTableReady = true
        indexedVectorCount = count ?? 0
      }
    } catch {
      pgvectorTableReady = false
    }

    return NextResponse.json({
      ok: true,
      corpusTotalChunks: corpusChunks.length,
      indexedVectorCount,
      pgvectorTableReady,
      embeddingModel: GEMINI_RAG_EMBEDDING_MODEL,
      dimensions: GEMINI_RAG_EMBEDDING_DIMS,
    })
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Failed to inspect Coaching Library index status.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorizeCoachOrSyncSecret(request)

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'Missing GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY). Configure Gemini credentials before syncing pgvector embeddings.',
        },
        { status: 503 }
      )
    }

    const forceReembed = request.nextUrl.searchParams.get('force') === 'true'
    const admin = supabaseAdmin()
    const corpusChunks = buildForgeRagCorpusChunks()

    const { data: existingRows, error: fetchError } = await admin
      .from('forge_rag_chunks')
      .select('id, content_hash')

    if (fetchError) {
      return NextResponse.json(
        {
          error:
            'forge_rag_chunks table not found or inaccessible. Apply supabase/migrations/20261115_forge_hybrid_rag_pgvector.sql first.',
          details: fetchError.message,
        },
        { status: 503 }
      )
    }

    const existingHashes = new Map<string, string>()
    for (const row of existingRows || []) {
      if (row.id && row.content_hash) {
        existingHashes.set(String(row.id), String(row.content_hash))
      }
    }

    const pendingChunks = corpusChunks.filter(chunk => {
      if (forceReembed) return true
      const hash = sha256Hex(`${chunk.title}\n${chunk.contentPassage}`)
      return existingHashes.get(chunk.id) !== hash
    })

    let embeddedAndUpserted = 0
    let failedChunks = 0
    const batchSize = 5

    for (let i = 0; i < pendingChunks.length; i += batchSize) {
      const slice = pendingChunks.slice(i, i + batchSize)
      const upsertPayload = (
        await Promise.all(
          slice.map(async chunk => {
            const embedding = await embedTextWithGemini(
              chunk.contentPassage,
              'RETRIEVAL_DOCUMENT',
              chunk.title
            )
            if (!embedding) {
              failedChunks += 1
              return null
            }
            const contentHash = sha256Hex(`${chunk.title}\n${chunk.contentPassage}`)
            return {
              id: chunk.id,
              doc_id: chunk.docId,
              source_kind: chunk.sourceKind,
              title: chunk.title,
              category: chunk.category,
              goal_category: chunk.goalCategory ?? null,
              nasm_opt_phases: chunk.nasmOptPhases,
              content_passage: chunk.contentPassage,
              key_concepts: chunk.keyConcepts,
              content_hash: contentHash,
              embedding,
              updated_at: new Date().toISOString(),
            }
          })
        )
      ).filter((item): item is NonNullable<typeof item> => item !== null)

      if (upsertPayload.length > 0) {
        const { error: upsertErr } = await admin
          .from('forge_rag_chunks')
          .upsert(upsertPayload, { onConflict: 'id' })
        if (upsertErr) {
          return NextResponse.json(
            {
              error: 'Failed to upsert Coaching Library vector batch.',
              details: upsertErr.message,
              embeddedAndUpserted,
            },
            { status: 500 }
          )
        }
        embeddedAndUpserted += upsertPayload.length
      }
    }

    return NextResponse.json({
      ok: true,
      embeddingModel: GEMINI_RAG_EMBEDDING_MODEL,
      dimensions: GEMINI_RAG_EMBEDDING_DIMS,
      totalChunks: corpusChunks.length,
      embeddedAndUpserted,
      skippedUnchanged: corpusChunks.length - pendingChunks.length,
      failedChunks,
    })
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Unexpected error syncing Coaching Library vectors.' }, { status: 500 })
  }
}
