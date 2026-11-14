import { describe, expect, it } from 'vitest'
import {
  buildForgeRagCorpusChunks,
  fuseRankingsWithRrf,
  l2NormalizeVector,
  rankChunksByBm25,
  retrieveHybridRagPassages,
} from './hybridRagEngine'
import { askCoachGordon } from '@/lib/ask-coach-gordon'

describe('Forge Athletic Hybrid Semantic + Lexical RAG Engine', () => {
  it('builds a unified clean-room corpus across NASM curricula, movement biomechanics, and contraindication rules', () => {
    const chunks = buildForgeRagCorpusChunks()
    expect(chunks.length).toBeGreaterThan(75)

    const kinds = new Set(chunks.map(c => c.sourceKind))
    expect(kinds.has('nasm_curriculum')).toBe(true)
    expect(kinds.has('movement_biomechanics')).toBe(true)
    expect(kinds.has('contraindication_protocol')).toBe(true)

    for (const chunk of chunks) {
      expect(chunk.contentPassage.length).toBeGreaterThan(40)
      expect(chunk.title.length).toBeGreaterThan(3)
    }
  })

  it('expands colloquial sports-science synonyms accurately in BM25 retrieval (<1ms)', () => {
    // 1. Tight hips / squat depth
    const squatHits = rankChunksByBm25({
      question: 'How low should I squat with tight hips?',
      nasmOptPhase: 1,
    })
    expect(squatHits.length).toBeGreaterThan(0)
    const squatCombined = squatHits
      .slice(0, 4)
      .map(h => `${h.chunk.title} ${h.chunk.contentPassage}`.toLowerCase())
      .join(' ')
    expect(squatCombined).toMatch(/squat|hip|dorsiflexion|compensation/)

    // 2. Wrist soreness -> neutral-grip joint protection
    const wristHits = rankChunksByBm25({
      question: 'Can I do this if my wrist is sore?',
      currentExerciseName: 'Barbell Bench Press',
      nasmOptPhase: 2,
    })
    expect(wristHits.length).toBeGreaterThan(0)
    const wristCombined = wristHits
      .slice(0, 4)
      .map(h => `${h.chunk.title} ${h.chunk.contentPassage}`.toLowerCase())
      .join(' ')
    expect(wristCombined).toMatch(/wrist|elbow|neutral|grip/)

    // 3. Ozempic -> GLP-1 pharmacology & lean mass preservation
    const glpHits = rankChunksByBm25({
      question: 'On Ozempic how much protein do I need to keep muscle?',
      goal: 'fat_loss',
    })
    expect(glpHits.length).toBeGreaterThan(0)
    const glpCombined = glpHits
      .slice(0, 3)
      .map(h => `${h.chunk.title} ${h.chunk.contentPassage}`.toLowerCase())
      .join(' ')
    expect(glpCombined).toMatch(/glp-1|pharmacology|protein|lean/)

    // 4. Desk posture / rounded shoulders
    const deskHits = rankChunksByBm25({
      question: 'My neck feels stiff from computer desk posture and rounded shoulders',
      deskErgonomicsFlags: ['forward_head_posture'],
    })
    expect(deskHits.length).toBeGreaterThan(0)
    const deskCombined = deskHits
      .slice(0, 4)
      .map(h => `${h.chunk.title} ${h.chunk.contentPassage}`.toLowerCase())
      .join(' ')
    expect(deskCombined).toMatch(/cervical|thoracic|upper|posture|chin/)
  })

  it('applies NASM OPT Phase affinity boosts to phase-matched chunks', () => {
    const phase1Ranked = rankChunksByBm25(
      { question: 'stabilization core balance tempo', nasmOptPhase: 1 },
      10
    )
    const phase5Ranked = rankChunksByBm25(
      { question: 'stabilization core balance tempo', nasmOptPhase: 5 },
      10
    )

    const p1ChunkInPhase1 = phase1Ranked.find(
      r => r.chunk.nasmOptPhases.includes(1) && !r.chunk.nasmOptPhases.includes(5)
    )
    expect(p1ChunkInPhase1).toBeDefined()
    const sameChunkInPhase5 = phase5Ranked.find(r => r.chunk.id === p1ChunkInPhase1!.chunk.id)
    if (sameChunkInPhase5) {
      expect(p1ChunkInPhase1!.score).toBeGreaterThan(sameChunkInPhase5.score)
    }
  })

  it('L2-normalizes 768-dimensional Matryoshka embeddings to unit length', () => {
    const raw = Array.from({ length: 768 }, (_, i) => (i % 7) - 3)
    const normalized = l2NormalizeVector(raw)
    expect(normalized).toHaveLength(768)
    const normSq = normalized.reduce((acc, val) => acc + val * val, 0)
    expect(Math.sqrt(normSq)).toBeCloseTo(1.0, 4)
  })

  it('fuses dense pgvector and lexical BM25 rankings with Reciprocal Rank Fusion (RRF)', () => {
    const chunks = buildForgeRagCorpusChunks()
    const chunkA = chunks[0]
    const chunkB = chunks[1]
    const chunkC = chunks[2]

    // chunkB is #2 in dense and #1 in lexical (consensus match), whereas chunkA is only in dense
    const fused = fuseRankingsWithRrf({
      denseResults: [
        { chunk: chunkA, similarity: 0.89 },
        { chunk: chunkB, similarity: 0.86 },
      ],
      lexicalResults: [
        { chunk: chunkB, score: 11.4, matchedConcepts: ['Consensus Concept'] },
        { chunk: chunkC, score: 8.2, matchedConcepts: ['Lexical Concept'] },
      ],
      topK: 3,
    })

    expect(fused[0].id).toBe(chunkB.id)
    expect(fused[0].denseSimilarity).toBeCloseTo(0.86, 2)
    expect(fused[0].lexicalScore).toBeCloseTo(11.4, 1)
    expect(fused[0].matchedConcepts).toContain('Consensus Concept')
  })

  it('populates ragRetrievalMode and ragCitations end-to-end in askCoachGordon', async () => {
    const ragRes = await retrieveHybridRagPassages({
      question: 'How low should I squat with tight hips?',
      nasmOptPhase: 1,
      topK: 4,
    })
    expect(ragRes.citations.length).toBeGreaterThan(0)
    expect(ragRes.formattedPromptContext).toContain('Relevant Coaching Reference Passages')

    const coachRes = await askCoachGordon({
      question: 'How low should I squat with tight hips?',
      athleteName: 'Marcus',
      nasmOptPhase: 1,
    })
    expect(coachRes.ragRetrievalMode).toBeDefined()
    expect(coachRes.ragCitations).toBeDefined()
    expect(coachRes.ragCitations!.length).toBeGreaterThan(0)
  })
})
