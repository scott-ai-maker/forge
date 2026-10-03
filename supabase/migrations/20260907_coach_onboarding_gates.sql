-- =============================================================================
-- Migration: 20260907_coach_onboarding_gates.sql
-- Gordon Athletic Advisory — Coach Onboarding Authorization Gates
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- =============================================================================

-- 1. Create coach_onboarding_gates table
create table if not exists coach_onboarding_gates (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  stage_number    int not null check (stage_number between 1 and 7),
  stage_id        text not null,
  status          text not null default 'pending' check (status in ('pending', 'authorized', 'rejected')),
  authorized_by   uuid references clients(id) on delete set null,
  authorized_at   timestamptz,
  notes           text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(client_id, stage_number)
);

-- 2. Create indices
create index if not exists idx_coach_onboarding_gates_client on coach_onboarding_gates(client_id);
create index if not exists idx_coach_onboarding_gates_stage on coach_onboarding_gates(client_id, stage_number);

-- 3. Enable RLS and grant service/authenticated permissions
alter table coach_onboarding_gates enable row level security;

create policy "Coaches and admins can view and manage onboarding gates"
  on coach_onboarding_gates
  for all
  using (true)
  with check (true);

-- 4. Backfill existing authorizations from client_lifecycle_audit_logs
insert into coach_onboarding_gates (
  client_id,
  stage_number,
  stage_id,
  status,
  authorized_by,
  authorized_at,
  notes,
  metadata,
  created_at,
  updated_at
)
select distinct on (client_id, (metadata->>'stageNumber')::int)
  client_id,
  (metadata->>'stageNumber')::int as stage_number,
  coalesce(metadata->>'stageId', 'intake_claim') as stage_id,
  'authorized' as status,
  actor_id as authorized_by,
  coalesce((metadata->>'authorizedAt')::timestamptz, effective_date, created_at) as authorized_at,
  reason_notes as notes,
  metadata,
  created_at,
  effective_date as updated_at
from client_lifecycle_audit_logs
where action = 'onboarding_gate_authorized'
  and (metadata->>'stageNumber') is not null
  and (metadata->>'stageNumber')::int between 1 and 7
order by client_id, (metadata->>'stageNumber')::int, created_at desc
on conflict (client_id, stage_number) do update set
  status = excluded.status,
  authorized_by = excluded.authorized_by,
  authorized_at = excluded.authorized_at,
  notes = excluded.notes,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

