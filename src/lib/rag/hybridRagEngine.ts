/**
 * Forge Athletic — Hybrid Semantic + Lexical RAG Retrieval Engine
 *
 * Combines:
 * 1. Dense Semantic Vector Search (`gemini-embedding-001` @ 768d L2-normalized + Supabase `pgvector` HNSW RPC `match_forge_rag_chunks`)
 * 2. In-Memory Okapi BM25 + TF-IDF Lexical Ranker with Sports-Science Synonym & Biomechanics Expansion
 * 3. Reciprocal Rank Fusion (RRF, k = 60) + NASM OPT™ Phase & Goal Affinity Reranking
 *
 * Strictly zero PII/PHI: queries are sanitized prior to embedding, and when `pgvector` is unseeded or offline,
 * retrieval seamlessly resolves in <1ms via the deterministic BM25 + TF-IDF ranker.
 */

import { NASM_RAG_LIBRARY, type RagDocumentMetadata } from '@/lib/nasm-rag-knowledge-base'
import { NASM_MOVEMENT_PROFILES } from '@/lib/nasm-clinical-movement-cards'
import { CONTRAINDICATION_RULES } from '@/lib/liability-shield'
import { isOutOfTrainingScope } from '@/lib/ask-coach-gordon-types'
import { sanitizePiiString } from '@/src/lib/safety/clinicalGuardrails'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { GRANULAR_COACHING_PROTOCOL_CARDS } from './protocolDeepDiveCards'

export const GEMINI_RAG_EMBEDDING_MODEL = 'gemini-embedding-001'
export const GEMINI_RAG_EMBEDDING_DIMS = 768
const RRF_K = 60

export type RagSourceKind =
  | 'nasm_curriculum'
  | 'movement_biomechanics'
  | 'contraindication_protocol'

export type RagRetrievalMode = 'hybrid_pgvector_rrf' | 'bm25_tfidf_lexical'

export interface ForgeRagChunk {
  id: string
  docId: string
  sourceKind: RagSourceKind
  title: string
  category: string
  goalCategory?: string
  nasmOptPhases: number[]
  contentPassage: string
  keyConcepts: string[]
  metadataRef?: RagDocumentMetadata
}

export interface ScoredRagCitation {
  id: string
  docId: string
  sourceKind: RagSourceKind
  title: string
  category: string
  score: number
  denseSimilarity?: number
  lexicalScore?: number
  matchedConcepts: string[]
  contentPassage: string
}

export interface HybridRagRetrievalRequest {
  question: string
  goal?: string
  nasmOptPhase?: number
  currentExerciseName?: string
  deskErgonomicsFlags?: string[]
  contraindicationTags?: string[]
  topK?: number
}

export interface HybridRagRetrievalResult {
  mode: RagRetrievalMode
  citations: ScoredRagCitation[]
  formattedPromptContext: string
  curriculumTitles: string[]
  legacyDocs: RagDocumentMetadata[]
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
  'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
  'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
  'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'today', 'right',
])

const SPORTS_SCIENCE_SYNONYM_EXPANSIONS: Array<{ pattern: RegExp; expansionTerms: string[] }> = [
  {
    pattern: /\b(pinch|pinchy|impinge|impingement|subacromial|rotator|overhead)\b/i,
    expansionTerms: ['shoulder', 'impingement', 'scapular', 'rotator', 'cuff', 'neutral', 'landmine', 'corrective'],
  },
  {
    pattern: /\b(tight hip|tight hips|hip flexor|psoas|squat depth|butt wink|ankle)\b/i,
    expansionTerms: ['hip', 'flexor', 'dorsiflexion', 'squat', 'compensation', 'inhibit', 'lengthen', 'lphc', 'goblet'],
  },
  {
    pattern: /\b(wrist|carpal|forearm|elbow|epicondyl|tennis elbow|golfer)\b/i,
    expansionTerms: ['wrist', 'elbow', 'neutral', 'hammer', 'grip', 'substitution', 'joint'],
  },
  {
    pattern: /\b(low back|lower back|lumbar|sciatic|disc|hinge|rdl|deadlift)\b/i,
    expansionTerms: ['lumbar', 'hinge', 'glute', 'core', 'bracing', 'lphc', 'posterior', 'compensation'],
  },
  {
    pattern: /\b(knee|patella|valgus|meniscus|acl|split squat|lunge)\b/i,
    expansionTerms: ['knee', 'valgus', 'glute', 'medius', 'patellofemoral', 'squat', 'spanish', 'box'],
  },
  {
    pattern: /\b(desk|computer|forward head|rounded shoulder|slouch|neck|cervical|ergonomic)\b/i,
    expansionTerms: ['upper', 'crossed', 'cervical', 'chin', 'tuck', 'thoracic', 'pectoralis', 'posture', 'virtual'],
  },
  {
    pattern: /\b(ozempic|wegovy|mounjaro|zepbound|semaglutide|tirzepatide|glp-?1)\b/i,
    expansionTerms: ['glp-1', 'pharmacology', 'lean', 'mass', 'protein', 'pacing', 'resistance', 'sarcopenia'],
  },
  {
    pattern: /\b(short|shorten|15 min|20 min|express|busy|no time|quick|hotel|travel)\b/i,
    expansionTerms: ['superset', 'density', 'circuit', 'travel', 'bodyweight', 'substitution', 'periodization'],
  },
  {
    pattern: /\b(tired|exhausted|poor sleep|bad sleep|sore|doms|fatigue|burnout|overtrain|hrv|readiness)\b/i,
    expansionTerms: ['recovery', 'autoregulation', 'hrv', 'readiness', 'sleep', 'deload', 'cns', 'wearable'],
  },
  {
    pattern: /\b(zone 2|cardio|hiit|vo2|heart rate|bpm|treadmill|conditioning|stamina)\b/i,
    expansionTerms: ['cardiorespiratory', 'tanaka', 'ventilatory', 'threshold', 'epoc', 'interval', 'aerobic'],
  },
  {
    pattern: /\b(protein|macro|calorie|fat loss|cut|bulk|creatine|hydration|pre[- ]?workout|meal)\b/i,
    expansionTerms: ['nutrition', 'protein', 'macronutrient', 'creatine', 'hydration', 'energy', 'leucine'],
  },
]

export function stemToken(raw: string): string {
  let token = raw.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (token.length <= 3) return token
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`
  if (token.endsWith('ing') && token.length > 5) token = token.slice(0, -3)
  else if (token.endsWith('tion') && token.length > 6) token = token.slice(0, -3)
  else if (token.endsWith('ed') && token.length > 4) token = token.slice(0, -2)
  else if (token.endsWith('es') && token.length > 4) token = token.slice(0, -2)
  else if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) token = token.slice(0, -1)
  return token
}

export function tokenizeForBm25(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOP_WORDS.has(t))
    .map(stemToken)
    .filter(t => t.length >= 2)
}

export function l2NormalizeVector(vec: number[]): number[] {
  let sumSq = 0
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i]
  }
  if (sumSq <= 1e-12) return vec
  const invNorm = 1 / Math.sqrt(sumSq)
  return vec.map(v => Number((v * invNorm).toFixed(7)))
}

function parsePhasesFromText(optPhaseText?: string): number[] {
  if (!optPhaseText) return []
  const matches = optPhaseText.match(/\b[1-5]\b/g)
  if (!matches) return []
  return Array.from(new Set(matches.map(Number).filter(n => n >= 1 && n <= 5)))
}

/**
 * Builds the complete clean-room Forge Athletic RAG corpus across:
 * 1. All 19 curriculum categories in `NASM_RAG_LIBRARY`
 * 2. Biomechanical movement profiles in `NASM_MOVEMENT_PROFILES`
 * 3. Orthopedic contraindication protocols in `CONTRAINDICATION_RULES`
 */
export function buildForgeRagCorpusChunks(): ForgeRagChunk[] {
  const chunks: ForgeRagChunk[] = []

  // 1. Master NASM Curriculum Documents
  for (const doc of NASM_RAG_LIBRARY) {
    const phases = Array.isArray(doc.nasmOptPhase)
      ? doc.nasmOptPhase
      : typeof doc.nasmOptPhase === 'number'
        ? [doc.nasmOptPhase]
        : []

    const contentPassage = `${doc.title} (${doc.category}${doc.goalCategory ? ` · ${doc.goalCategory}` : ''}). ${doc.summary} Key clinical concepts: ${doc.keyConcepts.join(', ')}.`

    chunks.push({
      id: `curriculum:${doc.id}`,
      docId: doc.id,
      sourceKind: 'nasm_curriculum',
      title: doc.title,
      category: doc.category,
      goalCategory: doc.goalCategory,
      nasmOptPhases: phases,
      contentPassage,
      keyConcepts: doc.keyConcepts,
      metadataRef: doc,
    })
  }

  // 2. NASM Clinical Movement Biomechanics Cards
  for (const [slug, profile] of Object.entries(NASM_MOVEMENT_PROFILES)) {
    const displayName = slug
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    const phases = parsePhasesFromText(profile.optPhase)
    const checkpoints = profile.kineticCheckpoints
      ? `Checkpoints — Feet/Ankles: ${profile.kineticCheckpoints.feetAnkles} Knees: ${profile.kineticCheckpoints.knees} LPHC: ${profile.kineticCheckpoints.lphc} Shoulders: ${profile.kineticCheckpoints.shoulders} Head/Neck: ${profile.kineticCheckpoints.headNeck}`
      : ''
    const cues = profile.clinicalCues?.length
      ? `Coaching cues: ${profile.clinicalCues.join('; ')}.`
      : ''

    const contentPassage = `Movement Biomechanics: ${displayName} (${profile.category || 'Strength'}). OPT Phases: ${profile.optPhase || '1–5'}. Tempo: ${profile.tempo || '2-0-2-0'}. Prime mover: ${profile.primeMover || 'Primary agonist'}. Synergists: ${(profile.synergists || []).join(', ')}. Stabilizers: ${(profile.stabilizers || []).join(', ')}. ${checkpoints} ${cues}`.trim()

    chunks.push({
      id: `movement:${slug.replace(/[^a-z0-9]+/g, '_')}`,
      docId: `movement_${slug.replace(/[^a-z0-9]+/g, '_')}`,
      sourceKind: 'movement_biomechanics',
      title: `NASM Movement Profile: ${displayName}`,
      category: 'Corrective Exercise Protocol',
      goalCategory: 'Sports Science Foundation',
      nasmOptPhases: phases,
      contentPassage,
      keyConcepts: [
        displayName,
        profile.primeMover || '',
        ...(profile.synergists || []).slice(0, 3),
      ].filter(Boolean),
    })
  }

  // 3. Orthopedic Contraindication & Joint Protection Protocols
  for (const [tag, rule] of Object.entries(CONTRAINDICATION_RULES)) {
    const subs = Object.entries(rule.prescribedSubstitutions)
      .map(([orig, sub]) => `${orig} → ${sub.replacement} (${sub.rationale})`)
      .join('; ')

    const contentPassage = `Orthopedic Joint Protection Protocol — ${rule.label}: ${rule.generalGuideline} Contraindicated movements: ${rule.blacklistedExercises.join(', ')}. Safe biomechanically matched substitutions: ${subs}.`

    chunks.push({
      id: `contra:${tag}`,
      docId: `contra_${tag}`,
      sourceKind: 'contraindication_protocol',
      title: `Joint Protection Protocol: ${rule.label}`,
      category: 'Corrective Exercise Protocol',
      goalCategory: 'Corrective Exercise & Injury Prevention',
      nasmOptPhases: [1, 2, 3],
      contentPassage,
      keyConcepts: [rule.label, ...Object.values(rule.prescribedSubstitutions).map(s => s.replacement)],
    })
  }

  // 4. Granular Coaching Protocol Cards (high-frequency member adjustments)
  for (const card of GRANULAR_COACHING_PROTOCOL_CARDS) {
    chunks.push({
      id: `protocol:${card.id}`,
      docId: card.id,
      sourceKind: 'nasm_curriculum',
      title: card.title,
      category: card.category,
      goalCategory: card.goalCategory,
      nasmOptPhases: card.nasmOptPhases,
      contentPassage: card.contentPassage,
      keyConcepts: card.keyConcepts,
    })
  }

  return chunks
}

interface CompiledBm25Index {
  chunks: ForgeRagChunk[]
  chunkById: Map<string, ForgeRagChunk>
  docTokens: string[][]
  termFreqs: Array<Map<string, number>>
  docLengths: number[]
  avgDocLength: number
  idf: Map<string, number>
}

let cachedBm25Index: CompiledBm25Index | null = null

function getCompiledBm25Index(): CompiledBm25Index {
  if (cachedBm25Index) return cachedBm25Index

  const chunks = buildForgeRagCorpusChunks()
  const chunkById = new Map<string, ForgeRagChunk>()
  const docTokens: string[][] = []
  const termFreqs: Array<Map<string, number>> = []
  const docLengths: number[] = []
  const docFreq = new Map<string, number>()

  let totalLen = 0
  for (const chunk of chunks) {
    chunkById.set(chunk.id, chunk)
    // Title & keyConcepts weighted 2x in field concatenation for BM25F-style boost
    const weightedText = `${chunk.title} ${chunk.title} ${chunk.keyConcepts.join(' ')} ${chunk.keyConcepts.join(' ')} ${chunk.contentPassage}`
    const tokens = tokenizeForBm25(weightedText)
    docTokens.push(tokens)
    docLengths.push(tokens.length)
    totalLen += tokens.length

    const tf = new Map<string, number>()
    const uniqueInDoc = new Set<string>()
    for (const tok of tokens) {
      tf.set(tok, (tf.get(tok) || 0) + 1)
      uniqueInDoc.add(tok)
    }
    termFreqs.push(tf)
    for (const tok of uniqueInDoc) {
      docFreq.set(tok, (docFreq.get(tok) || 0) + 1)
    }
  }

  const N = Math.max(1, chunks.length)
  const idf = new Map<string, number>()
  for (const [term, df] of docFreq.entries()) {
    // Standard Robertson-Sparck Jones Okapi BM25 IDF
    const score = Math.log(1 + (N - df + 0.5) / (df + 0.5))
    idf.set(term, score)
  }

  cachedBm25Index = {
    chunks,
    chunkById,
    docTokens,
    termFreqs,
    docLengths,
    avgDocLength: totalLen / N,
    idf,
  }
  return cachedBm25Index
}

function buildExpandedQueryTokens(req: HybridRagRetrievalRequest): {
  baseTokens: string[]
  expandedTokens: string[]
} {
  const combinedRaw = [
    req.question,
    req.currentExerciseName || '',
    ...(req.deskErgonomicsFlags || []).map(f => f.replace(/_/g, ' ')),
    ...(req.contraindicationTags || []).map(f => f.replace(/_/g, ' ')),
  ].join(' ')

  const baseTokens = tokenizeForBm25(combinedRaw)
  const extraRaw: string[] = []
  for (const rule of SPORTS_SCIENCE_SYNONYM_EXPANSIONS) {
    if (rule.pattern.test(combinedRaw)) {
      extraRaw.push(...rule.expansionTerms)
    }
  }
  const expandedTokens = tokenizeForBm25(extraRaw.join(' '))
  return { baseTokens, expandedTokens }
}

/**
 * Deterministic Okapi BM25 + TF-IDF + Synonym + OPT™ Phase affinity scorer (<1ms).
 */
export function rankChunksByBm25(
  req: HybridRagRetrievalRequest,
  limit = 12
): Array<{ chunk: ForgeRagChunk; score: number; matchedConcepts: string[] }> {
  const idx = getCompiledBm25Index()

  if (isOutOfTrainingScope(req.question)) {
    return idx.chunks
      .filter(c =>
        c.keyConcepts.some(k => k.toLowerCase().includes('scope of practice')) ||
        c.title.toLowerCase().includes('personal training profession')
      )
      .slice(0, limit)
      .map(chunk => ({
        chunk,
        score: 10,
        matchedConcepts: ['Scope of Practice'],
      }))
  }

  const { baseTokens, expandedTokens } = buildExpandedQueryTokens(req)
  const k1 = 1.5
  const b = 0.75
  const goalLower = (req.goal || '').toLowerCase()

  const scored: Array<{ chunk: ForgeRagChunk; score: number; matchedConcepts: string[] }> = []

  for (let i = 0; i < idx.chunks.length; i++) {
    const chunk = idx.chunks[i]
    const tfMap = idx.termFreqs[i]
    const dl = idx.docLengths[i]
    let bm25Score = 0

    for (const tok of baseTokens) {
      const tf = tfMap.get(tok) || 0
      if (tf === 0) continue
      const termIdf = idx.idf.get(tok) ?? 0.5
      const denom = tf + k1 * (1 - b + b * (dl / idx.avgDocLength))
      bm25Score += termIdf * ((tf * (k1 + 1)) / denom)
    }

    // Expanded biomechanical synonyms receive 0.45x weight so exact query tokens always lead
    for (const tok of expandedTokens) {
      const tf = tfMap.get(tok) || 0
      if (tf === 0) continue
      const termIdf = idx.idf.get(tok) ?? 0.5
      const denom = tf + k1 * (1 - b + b * (dl / idx.avgDocLength))
      bm25Score += 0.45 * termIdf * ((tf * (k1 + 1)) / denom)
    }

    if (bm25Score <= 0) continue

    // Active NASM OPT™ Phase & Athlete Goal affinity multipliers
    if (
      typeof req.nasmOptPhase === 'number' &&
      chunk.nasmOptPhases.length > 0 &&
      chunk.nasmOptPhases.includes(req.nasmOptPhase)
    ) {
      bm25Score *= 1.18
    }
    if (goalLower && chunk.goalCategory) {
      const gc = chunk.goalCategory.toLowerCase()
      if (
        (goalLower.includes('fat') || goalLower.includes('weight') ? gc.includes('fat') || gc.includes('weight') : false) ||
        (goalLower.includes('hypertrophy') || goalLower.includes('muscle') ? gc.includes('hypertrophy') || gc.includes('physique') : false) ||
        (goalLower.includes('strength') || goalLower.includes('performance') ? gc.includes('strength') || gc.includes('performance') : false)
      ) {
        bm25Score *= 1.12
      }
    }

    const qLower = `${req.question} ${req.currentExerciseName || ''}`.toLowerCase()
    const matchedConcepts = chunk.keyConcepts.filter(concept => {
      const cTokens = tokenizeForBm25(concept)
      return (
        qLower.includes(concept.toLowerCase()) ||
        cTokens.some(ct => baseTokens.includes(ct) || expandedTokens.includes(ct))
      )
    })

    scored.push({
      chunk,
      score: Number(bm25Score.toFixed(4)),
      matchedConcepts: matchedConcepts.slice(0, 4),
    })
  }

  scored.sort((a, b) => b.score - a.score)

  if (scored.length === 0) {
    // Phase-aligned foundational fallback when query has zero lexical overlap
    const fallback = idx.chunks
      .filter(c =>
        req.nasmOptPhase ? c.nasmOptPhases.includes(req.nasmOptPhase) : c.docId === 'cpt7_ch13'
      )
      .slice(0, Math.min(3, limit))
    return fallback.map(chunk => ({
      chunk,
      score: 1.0,
      matchedConcepts: chunk.keyConcepts.slice(0, 3),
    }))
  }

  return scored.slice(0, limit)
}

// ── Dense Gemini Embeddings + LRU Query Cache ──
const queryEmbeddingCache = new Map<string, number[]>()
const MAX_QUERY_EMBEDDING_CACHE = 256

export async function embedTextWithGemini(
  rawText: string,
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_QUERY',
  title?: string
): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
  if (!apiKey) return null

  const cleanText = sanitizePiiString(rawText).trim().slice(0, 3500)
  if (!cleanText) return null

  const cacheKey = `${taskType}:${cleanText.toLowerCase()}`
  if (taskType === 'RETRIEVAL_QUERY') {
    const hit = queryEmbeddingCache.get(cacheKey)
    if (hit) return hit
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2800)

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_RAG_EMBEDDING_MODEL)}:embedContent`
    const embedContentConfig: Record<string, unknown> = {
      taskType,
      outputDimensionality: GEMINI_RAG_EMBEDDING_DIMS,
    }
    if (taskType === 'RETRIEVAL_DOCUMENT' && title) {
      embedContentConfig.title = title
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: `models/${GEMINI_RAG_EMBEDDING_MODEL}`,
        content: {
          parts: [{ text: cleanText }],
        },
        embedContentConfig,
        outputDimensionality: GEMINI_RAG_EMBEDDING_DIMS,
      }),
    })

    if (!res.ok) return null

    const data = (await res.json()) as {
      embedding?: { values?: number[] }
      embeddings?: Array<{ values?: number[] }>
    }
    const values = data.embedding?.values ?? data.embeddings?.[0]?.values
    if (!Array.isArray(values) || values.length !== GEMINI_RAG_EMBEDDING_DIMS) {
      return null
    }

    const normalized = l2NormalizeVector(values)
    if (taskType === 'RETRIEVAL_QUERY') {
      if (queryEmbeddingCache.size >= MAX_QUERY_EMBEDDING_CACHE) {
        const oldestKey = queryEmbeddingCache.keys().next().value
        if (oldestKey) queryEmbeddingCache.delete(oldestKey)
      }
      queryEmbeddingCache.set(cacheKey, normalized)
    }
    return normalized
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

interface PgVectorMatchedRow {
  id: string
  doc_id: string
  source_kind: RagSourceKind
  title: string
  category: string
  goal_category: string | null
  nasm_opt_phases: number[]
  content_passage: string
  key_concepts: string[]
  similarity: number
}

async function querySupabasePgVectorChunks(
  queryEmbedding: number[],
  matchCount: number,
  optPhase?: number
): Promise<PgVectorMatchedRow[]> {
  try {
    const client =
      process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL
        ? supabaseAdmin()
        : supabase
    if (!client) return []

    const { data, error } = await client.rpc('match_forge_rag_chunks', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter_opt_phase: optPhase ?? null,
      min_similarity: 0.35,
    })

    if (error || !Array.isArray(data)) return []
    return data as PgVectorMatchedRow[]
  } catch {
    return []
  }
}

/**
 * Reciprocal Rank Fusion (RRF, k = 60) combining dense `pgvector` semantic ranks
 * and Okapi BM25 lexical ranks.
 */
export function fuseRankingsWithRrf(params: {
  denseResults: Array<{ chunk: ForgeRagChunk; similarity: number }>
  lexicalResults: Array<{ chunk: ForgeRagChunk; score: number; matchedConcepts: string[] }>
  topK: number
  denseWeight?: number
  lexicalWeight?: number
}): ScoredRagCitation[] {
  const denseWeight = params.denseWeight ?? 0.6
  const lexicalWeight = params.lexicalWeight ?? 0.4

  const merged = new Map<
    string,
    {
      chunk: ForgeRagChunk
      rrfScore: number
      denseSimilarity?: number
      lexicalScore?: number
      matchedConcepts: string[]
    }
  >()

  params.denseResults.forEach((item, idx) => {
    const rank = idx + 1
    const rrfContribution = denseWeight * (1 / (RRF_K + rank))
    merged.set(item.chunk.id, {
      chunk: item.chunk,
      rrfScore: rrfContribution,
      denseSimilarity: Number(item.similarity.toFixed(4)),
      matchedConcepts: item.chunk.keyConcepts.slice(0, 3),
    })
  })

  params.lexicalResults.forEach((item, idx) => {
    const rank = idx + 1
    const rrfContribution = lexicalWeight * (1 / (RRF_K + rank))
    const existing = merged.get(item.chunk.id)
    if (existing) {
      existing.rrfScore += rrfContribution
      existing.lexicalScore = item.score
      if (item.matchedConcepts.length > 0) {
        existing.matchedConcepts = Array.from(
          new Set([...item.matchedConcepts, ...existing.matchedConcepts])
        ).slice(0, 4)
      }
    } else {
      merged.set(item.chunk.id, {
        chunk: item.chunk,
        rrfScore: rrfContribution,
        lexicalScore: item.score,
        matchedConcepts:
          item.matchedConcepts.length > 0
            ? item.matchedConcepts
            : item.chunk.keyConcepts.slice(0, 3),
      })
    }
  })

  return Array.from(merged.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, params.topK)
    .map(entry => ({
      id: entry.chunk.id,
      docId: entry.chunk.docId,
      sourceKind: entry.chunk.sourceKind,
      title: entry.chunk.title,
      category: entry.chunk.category,
      score: Number(entry.rrfScore.toFixed(5)),
      denseSimilarity: entry.denseSimilarity,
      lexicalScore: entry.lexicalScore,
      matchedConcepts: entry.matchedConcepts,
      contentPassage: entry.chunk.contentPassage,
    }))
}

/**
 * Primary async Hybrid Semantic + Lexical RAG retrieval pipeline used by Coach Gordon AI.
 */
export async function retrieveHybridRagPassages(
  req: HybridRagRetrievalRequest
): Promise<HybridRagRetrievalResult> {
  const topK = req.topK ?? 5
  const idx = getCompiledBm25Index()
  const lexicalResults = rankChunksByBm25(req, Math.max(10, topK * 2))

  let mode: RagRetrievalMode = 'bm25_tfidf_lexical'
  let citations: ScoredRagCitation[] = []

  if (!isOutOfTrainingScope(req.question)) {
    const semanticQueryText = [
      req.question,
      req.currentExerciseName ? `Exercise: ${req.currentExerciseName}` : '',
      req.nasmOptPhase ? `NASM OPT Phase ${req.nasmOptPhase}` : '',
      req.goal ? `Goal: ${req.goal}` : '',
      req.deskErgonomicsFlags?.length ? `Posture flags: ${req.deskErgonomicsFlags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ')

    const queryEmbedding = await embedTextWithGemini(semanticQueryText, 'RETRIEVAL_QUERY')
    if (queryEmbedding) {
      const denseRows = await querySupabasePgVectorChunks(
        queryEmbedding,
        Math.max(8, topK * 2),
        req.nasmOptPhase
      )

      if (denseRows.length > 0) {
        mode = 'hybrid_pgvector_rrf'
        const denseMapped = denseRows.map(row => {
          const localChunk = idx.chunkById.get(row.id) ?? {
            id: row.id,
            docId: row.doc_id,
            sourceKind: row.source_kind,
            title: row.title,
            category: row.category,
            goalCategory: row.goal_category ?? undefined,
            nasmOptPhases: row.nasm_opt_phases || [],
            contentPassage: row.content_passage,
            keyConcepts: row.key_concepts || [],
          }
          return {
            chunk: localChunk,
            similarity: row.similarity,
          }
        })

        citations = fuseRankingsWithRrf({
          denseResults: denseMapped,
          lexicalResults,
          topK,
        })
      }
    }
  }

  if (citations.length === 0) {
    citations = lexicalResults.slice(0, topK).map(item => ({
      id: item.chunk.id,
      docId: item.chunk.docId,
      sourceKind: item.chunk.sourceKind,
      title: item.chunk.title,
      category: item.chunk.category,
      score: item.score,
      lexicalScore: item.score,
      matchedConcepts:
        item.matchedConcepts.length > 0
          ? item.matchedConcepts
          : item.chunk.keyConcepts.slice(0, 3),
      contentPassage: item.chunk.contentPassage,
    }))
  }

  const formattedPromptContext =
    citations.length > 0
      ? `\nRelevant Coaching Reference Passages:\n${citations
          .map(
            (c, i) =>
              `${i + 1}. [${c.category}] ${c.title}\n   Passage: ${c.contentPassage}`
          )
          .join('\n')}`
      : ''

  const curriculumTitles = citations.map(c => c.title)
  const legacyDocs: RagDocumentMetadata[] = citations.map(c => {
    const chunk = idx.chunkById.get(c.id)
    if (chunk?.metadataRef) return chunk.metadataRef
    return {
      id: c.docId,
      filename: `forge-rag/${c.docId}.md`,
      title: c.title,
      category: 'Corrective Exercise Protocol',
      summary: c.contentPassage,
      keyConcepts: c.matchedConcepts,
    }
  })

  return {
    mode,
    citations,
    formattedPromptContext,
    curriculumTitles,
    legacyDocs,
  }
}
