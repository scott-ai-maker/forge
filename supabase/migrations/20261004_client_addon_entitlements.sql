-- Feature unlocks granted by one-time add-on purchases (see lib/forge-addons.ts).
create table if not exists client_addon_entitlements (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references clients(id) on delete cascade,
  addon_id          text not null,
  feature           text not null check (feature in ('video-review', 'nutrition', 'travel')),
  uses_total        int check (uses_total is null or uses_total > 0),
  uses_remaining    int check (uses_remaining is null or uses_remaining >= 0),
  stripe_payment_id text not null unique,
  granted_at        timestamptz not null default now(),
  expires_at        timestamptz not null
);

create index if not exists client_addon_entitlements_client_feature_idx
  on client_addon_entitlements (client_id, feature, expires_at);

alter table client_addon_entitlements enable row level security;

drop policy if exists "Client reads own addon entitlements" on client_addon_entitlements;
create policy "Client reads own addon entitlements" on client_addon_entitlements
  for select using (auth.uid() = client_id);

-- Backfill: active Pro Athlete / Transformation Direct members whose latest paid cycle is still current
-- get their included tools now instead of waiting for the next renewal invoice.
insert into client_addon_entitlements (client_id, addon_id, feature, uses_total, uses_remaining, stripe_payment_id, granted_at, expires_at)
select cp.client_id, inc.membership_id, inc.feature, inc.uses, inc.uses,
       'backfill:' || cp.id || ':' || inc.feature, now(), cp.purchased_at + interval '35 days'
from (
  select distinct on (client_id) client_id, id, package_name, purchased_at
  from client_packages
  where package_name in ('Pro Athlete', 'Transformation Direct')
  order by client_id, purchased_at desc
) cp
join clients c on c.id = cp.client_id and c.status = 'active'
join (values
  ('Pro Athlete', 'forge-pro-athlete', 'nutrition', null::int),
  ('Pro Athlete', 'forge-pro-athlete', 'travel', null::int),
  ('Pro Athlete', 'forge-pro-athlete', 'video-review', 2),
  ('Transformation Direct', 'forge-transformation-direct', 'nutrition', null::int),
  ('Transformation Direct', 'forge-transformation-direct', 'travel', null::int),
  ('Transformation Direct', 'forge-transformation-direct', 'video-review', 8)
) as inc(package_name, membership_id, feature, uses) on inc.package_name = cp.package_name
where cp.purchased_at + interval '35 days' > now()
on conflict (stripe_payment_id) do nothing;

-- Founding-client grace period: every existing client keeps unlimited access to the tools that used to be
-- free for 90 days from the day this migration runs. Re-running it never extends or duplicates the grant.
insert into client_addon_entitlements (client_id, addon_id, feature, uses_total, uses_remaining, stripe_payment_id, granted_at, expires_at)
select c.id, 'legacy-grace', f.feature, null, null,
       'grace:' || c.id || ':' || f.feature, now(), now() + interval '90 days'
from clients c
cross join (values ('video-review'), ('nutrition'), ('travel')) as f(feature)
where c.role = 'client' and c.status in ('active', 'paused')
on conflict (stripe_payment_id) do nothing;
