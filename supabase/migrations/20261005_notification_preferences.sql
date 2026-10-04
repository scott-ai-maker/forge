-- Per-user notification channel preferences and a delivery log used for de-duplication and throttling.
create table if not exists notification_preferences (
  user_id        uuid primary key references clients(id) on delete cascade,
  push_enabled   boolean not null default true,
  email_enabled  boolean not null default true,
  -- SMS is opt-in only: it requires explicit consent for the specific number below.
  sms_enabled    boolean not null default false,
  sms_phone      text,
  sms_consent_at timestamptz,
  muted_categories text[] not null default '{}',
  updated_at     timestamptz not null default now()
);

alter table notification_preferences enable row level security;

drop policy if exists "User reads own notification preferences" on notification_preferences;
create policy "User reads own notification preferences" on notification_preferences
  for select using (auth.uid() = user_id);

create table if not exists notification_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references clients(id) on delete cascade,
  type        text not null,
  channels    text[] not null default '{}',
  dedupe_key  text unique,
  created_at  timestamptz not null default now()
);

create index if not exists notification_log_user_type_idx on notification_log (user_id, type, created_at desc);

alter table notification_log enable row level security;
