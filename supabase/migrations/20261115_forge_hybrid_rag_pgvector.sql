-- ============================================================================
-- Forge Athletic — Hybrid Semantic RAG Knowledge Store (pgvector + Full-Text)
-- Uses `gemini-embedding-001` at 768 dimensions (L2-normalized Matryoshka slice)
-- Clean-room Forge Athletic sports-science passages only (zero client PII/PHI)
-- ============================================================================

create extension if not exists vector;

create table if not exists forge_rag_chunks (
  id                text primary key,
  doc_id            text not null,
  source_kind       text not null check (
    source_kind in ('nasm_curriculum', 'movement_biomechanics', 'contraindication_protocol')
  ),
  title             text not null,
  category          text not null,
  goal_category     text,
  nasm_opt_phases   int[] not null default '{}',
  content_passage   text not null,
  key_concepts      text[] not null default '{}',
  embedding         vector(768),
  content_hash      text not null,
  updated_at        timestamptz not null default now()
);

create index if not exists idx_forge_rag_chunks_doc_id
  on forge_rag_chunks(doc_id);

create index if not exists idx_forge_rag_chunks_opt_phases
  on forge_rag_chunks using gin (nasm_opt_phases);

create index if not exists idx_forge_rag_chunks_fts
  on forge_rag_chunks using gin (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_passage, ''))
  );

create index if not exists idx_forge_rag_chunks_embedding_hnsw
  on forge_rag_chunks using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

alter table forge_rag_chunks enable row level security;

drop policy if exists "Authenticated members read Forge RAG chunks" on forge_rag_chunks;
create policy "Authenticated members read Forge RAG chunks"
  on forge_rag_chunks for select
  to authenticated, anon
  using (true);

-- Dense semantic similarity RPC for Reciprocal Rank Fusion (RRF)
create or replace function match_forge_rag_chunks(
  query_embedding vector(768),
  match_count int default 8,
  filter_opt_phase int default null,
  min_similarity float default 0.35
)
returns table (
  id text,
  doc_id text,
  source_kind text,
  title text,
  category text,
  goal_category text,
  nasm_opt_phases int[],
  content_passage text,
  key_concepts text[],
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.doc_id,
    c.source_kind,
    c.title,
    c.category,
    c.goal_category,
    c.nasm_opt_phases,
    c.content_passage,
    c.key_concepts,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from forge_rag_chunks c
  where c.embedding is not null
    and (1 - (c.embedding <=> query_embedding)) >= min_similarity
    and (
      filter_opt_phase is null
      or cardinality(c.nasm_opt_phases) = 0
      or filter_opt_phase = any(c.nasm_opt_phases)
    )
  order by c.embedding <=> query_embedding asc
  limit greatest(1, least(match_count, 25));
$$;
