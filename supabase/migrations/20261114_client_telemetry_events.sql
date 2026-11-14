-- ============================================================================
-- Forge Athletic Unified Client Telemetry Pipeline (PWA, Apple iOS, Android)
-- Strict HIPAA (1996) Row-Level Security & Idempotent Event Deduplication
-- ============================================================================

create table if not exists client_telemetry_events (
  event_id              uuid primary key,
  user_id               uuid not null references auth.users(id) on delete cascade,
  session_id            text not null,
  event_type            text not null check (
    event_type in (
      'posture_scan_completed',
      'desk_ergonomics_completed',
      'readiness_check_completed',
      'workout_completed',
      'set_logged',
      'joint_comfort_logged',
      'desk_reset_completed',
      'form_lab_uploaded',
      'live_studio_telemetry',
      'client_runtime_diagnostic'
    )
  ),
  client_timestamp      timestamptz not null,
  client_timestamp_iso  text not null,
  timezone_offset_mins  int not null default 0,
  platform              text not null check (
    platform in ('ios_app', 'android_app', 'pwa_standalone', 'mobile_web', 'desktop_web')
  ),
  app_version           text not null,
  network_type          text,
  cv_capability         jsonb not null default '{}'::jsonb,
  payload               jsonb not null default '{}'::jsonb,
  received_at           timestamptz not null default now()
);

create index if not exists idx_client_telemetry_events_user_time
  on client_telemetry_events(user_id, client_timestamp desc);

create index if not exists idx_client_telemetry_events_user_type
  on client_telemetry_events(user_id, event_type, client_timestamp desc);

create table if not exists client_telemetry_snapshots (
  user_id                   uuid primary key references auth.users(id) on delete cascade,
  latest_readiness_score    int check (latest_readiness_score is null or (latest_readiness_score >= 0 and latest_readiness_score <= 100)),
  latest_readiness_movement text,
  latest_readiness_at       timestamptz,
  joint_comfort_history     jsonb not null default '[]'::jsonb,
  desk_workstation_score    int check (desk_workstation_score is null or (desk_workstation_score >= 0 and desk_workstation_score <= 100)),
  desk_strain_level         text,
  desk_strain_flags         text[] not null default '{}',
  desk_angles               jsonb not null default '{}'::jsonb,
  desk_audited_at           timestamptz,
  posture_delta             jsonb not null default '{}'::jsonb,
  injected_warmup_drills    jsonb not null default '[]'::jsonb,
  opt_phase                 int check (opt_phase is null or (opt_phase >= 1 and opt_phase <= 5)),
  express_mode_active       boolean not null default false,
  environment_profile       text not null default 'home_gym',
  last_workout_completed_at timestamptz,
  last_synced_at            timestamptz not null default now(),
  last_platform             text,
  last_app_version          text,
  updated_at                timestamptz not null default now()
);

alter table client_telemetry_events enable row level security;
alter table client_telemetry_snapshots enable row level security;

drop policy if exists "Client reads own telemetry events" on client_telemetry_events;
create policy "Client reads own telemetry events"
  on client_telemetry_events for select
  using (auth.uid() = user_id);

drop policy if exists "Client inserts own telemetry events" on client_telemetry_events;
create policy "Client inserts own telemetry events"
  on client_telemetry_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Assigned coach reads client telemetry events" on client_telemetry_events;
create policy "Assigned coach reads client telemetry events"
  on client_telemetry_events for select
  using (
    exists (
      select 1
      from clients c
      where c.id = client_telemetry_events.user_id
        and c.designated_coach_id = auth.uid()
    )
  );

drop policy if exists "Client reads own telemetry snapshot" on client_telemetry_snapshots;
create policy "Client reads own telemetry snapshot"
  on client_telemetry_snapshots for select
  using (auth.uid() = user_id);

drop policy if exists "Client writes own telemetry snapshot" on client_telemetry_snapshots;
create policy "Client writes own telemetry snapshot"
  on client_telemetry_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Assigned coach reads client telemetry snapshot" on client_telemetry_snapshots;
create policy "Assigned coach reads client telemetry snapshot"
  on client_telemetry_snapshots for select
  using (
    exists (
      select 1
      from clients c
      where c.id = client_telemetry_snapshots.user_id
        and c.designated_coach_id = auth.uid()
    )
  );
