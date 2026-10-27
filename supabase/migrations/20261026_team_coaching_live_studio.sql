-- ── TEAMS & SQUAD COACHING ──────────────────────────────
create table if not exists teams (
  id              uuid primary key default gen_random_uuid(),
  coach_id        uuid references clients(id) on delete set null,
  name            text not null,
  description     text,
  sport_or_focus  text default 'General Performance & Conditioning',
  max_seats       int default 12,
  is_active       boolean not null default true,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists team_members (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams(id) on delete cascade,
  client_id       uuid not null references clients(id) on delete cascade,
  role            text not null default 'athlete' check (role in ('athlete', 'captain', 'assistant')),
  status          text not null default 'active' check (status in ('active', 'invited', 'inactive')),
  joined_at       timestamptz not null default now(),
  unique(team_id, client_id)
);

create table if not exists team_live_sessions (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references teams(id) on delete cascade,
  coach_id        uuid references clients(id) on delete set null,
  scheduled_at    timestamptz not null default now(),
  started_at      timestamptz,
  ended_at        timestamptz,
  status          text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed', 'cancelled')),
  session_room_id text not null,
  opt_phase       int default 2,
  session_notes   text,
  active_circuit_json jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- RLS
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_live_sessions enable row level security;

-- Policies for teams
drop policy if exists "Coaches can manage own teams" on teams;
create policy "Coaches can manage own teams" on teams
  for all using (auth.uid() = coach_id or exists (select 1 from clients where id = auth.uid() and role = 'coach'));

drop policy if exists "Members can view their teams" on teams;
create policy "Members can view their teams" on teams
  for select using (exists (select 1 from team_members where team_members.team_id = teams.id and team_members.client_id = auth.uid()));

-- Policies for team_members
drop policy if exists "Coaches can manage team members" on team_members;
create policy "Coaches can manage team members" on team_members
  for all using (exists (select 1 from teams where teams.id = team_members.team_id and (teams.coach_id = auth.uid() or exists (select 1 from clients where id = auth.uid() and role = 'coach'))));

drop policy if exists "Members can view teammates" on team_members;
create policy "Members can view teammates" on team_members
  for select using (client_id = auth.uid() or exists (select 1 from team_members tm where tm.team_id = team_members.team_id and tm.client_id = auth.uid()));

-- Policies for team_live_sessions
drop policy if exists "Coaches can manage team live sessions" on team_live_sessions;
create policy "Coaches can manage team live sessions" on team_live_sessions
  for all using (coach_id = auth.uid() or exists (select 1 from clients where id = auth.uid() and role = 'coach'));

drop policy if exists "Members can view team live sessions" on team_live_sessions;
create policy "Members can view team live sessions" on team_live_sessions
  for select using (exists (select 1 from team_members where team_members.team_id = team_live_sessions.team_id and team_members.client_id = auth.uid()));
