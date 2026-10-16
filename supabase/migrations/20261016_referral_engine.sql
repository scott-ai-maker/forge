-- Forge Athletic Referral & Ambassador Engine Migration
-- Adds referral programs, member referral codes, attributions, and reward ledgers

create table if not exists referral_programs (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text unique not null default 'standard',
  name                    text not null default 'Forge Athletic Ambassador Program',
  headline                text not null default 'Give 30 Days Free + $20 Credit, Get $20 Credit',
  referee_discount_cents  int not null default 2000,
  referee_trial_days      int not null default 30,
  referrer_reward_cents   int not null default 2000,
  is_active               boolean not null default true,
  created_at              timestamptz default now()
);

-- Seed default standard program if not exists
insert into referral_programs (slug, name, headline, referee_discount_cents, referee_trial_days, referrer_reward_cents, is_active)
values (
  'standard',
  'Forge Athletic Ambassador Program',
  'Give 30 Days Free + $20 Credit, Get $20 Credit',
  2000,
  30,
  2000,
  true
)
on conflict (slug) do nothing;

create table if not exists referral_codes (
  id                          uuid primary key default gen_random_uuid(),
  client_id                   uuid not null references clients(id) on delete cascade unique,
  code                        text unique not null,
  custom_slug                 text unique,
  clicks                      int not null default 0,
  signups_count               int not null default 0,
  conversions_count           int not null default 0,
  total_rewards_earned_cents  int not null default 0,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

create index if not exists idx_referral_codes_code on referral_codes(code);
create index if not exists idx_referral_codes_client on referral_codes(client_id);

create table if not exists referral_attributions (
  id                      uuid primary key default gen_random_uuid(),
  referrer_id             uuid not null references clients(id) on delete cascade,
  referral_code_id        uuid not null references referral_codes(id) on delete cascade,
  referee_id              uuid references clients(id) on delete set null,
  referee_email           text,
  status                  text not null default 'pending' check (status in ('pending', 'signed_up', 'converted', 'rewarded', 'flagged')),
  source                  text default 'link',
  ip_hash                 text,
  user_agent              text,
  converted_at            timestamptz,
  reward_granted_at       timestamptz,
  stripe_subscription_id  text,
  stripe_payment_id       text,
  created_at              timestamptz default now()
);

create index if not exists idx_referral_attributions_referrer on referral_attributions(referrer_id);
create index if not exists idx_referral_attributions_referee on referral_attributions(referee_id);
create index if not exists idx_referral_attributions_email on referral_attributions(referee_email);
create index if not exists idx_referral_attributions_status on referral_attributions(status);

create table if not exists referral_rewards (
  id                      uuid primary key default gen_random_uuid(),
  client_id               uuid not null references clients(id) on delete cascade,
  attribution_id          uuid references referral_attributions(id) on delete set null,
  reward_type             text not null check (reward_type in ('subscription_credit', 'free_month', 'form_lab_review', 'merch_pack', 'annual_pass')),
  amount_cents            int not null default 0,
  description             text not null,
  status                  text not null default 'available' check (status in ('available', 'redeemed', 'expired')),
  redeemed_at             timestamptz,
  created_at              timestamptz default now()
);

create index if not exists idx_referral_rewards_client on referral_rewards(client_id);
create index if not exists idx_referral_rewards_status on referral_rewards(status);

-- Function to atomically increment referral link clicks
create or replace function increment_referral_code_clicks(p_code text)
returns void
language plpgsql
security definer
as $$
begin
  update referral_codes
  set clicks = clicks + 1,
      updated_at = now()
  where code = upper(trim(p_code)) or custom_slug = lower(trim(p_code));
end;
$$;

-- Row Level Security
alter table referral_programs enable row level security;
alter table referral_codes enable row level security;
alter table referral_attributions enable row level security;
alter table referral_rewards enable row level security;

-- Policies for referral_programs
create policy "Anyone can read active referral programs"
  on referral_programs for select
  using (is_active = true);

-- Policies for referral_codes
create policy "Users can view their own referral code"
  on referral_codes for select
  using (auth.uid() = client_id);

create policy "Users can insert their own referral code"
  on referral_codes for insert
  with check (auth.uid() = client_id);

create policy "Users can update their own referral code"
  on referral_codes for update
  using (auth.uid() = client_id);

-- Policies for referral_attributions
create policy "Users can view their own sent referral attributions"
  on referral_attributions for select
  using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- Policies for referral_rewards
create policy "Users can view their own referral rewards"
  on referral_rewards for select
  using (auth.uid() = client_id);
