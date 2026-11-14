-- Migration: Fix PostgreSQL 42P17 infinite recursion on public.clients RLS policies
-- Ensures client-scoped SELECTs on clients, client_packages, sessions, comp_session_grants,
-- coach_client_messages, nasm_assessments, client_personal_records, and athlete_wearable_metrics
-- never recurse back into public.clients policy evaluation.

create or replace function public.is_authenticated_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = auth.uid()
      and c.role = 'coach'
  );
$$;

create or replace function public.is_coach_assigned_to_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients coach
    join public.clients cl on cl.id = target_client_id
    where coach.id = auth.uid()
      and coach.role = 'coach'
      and cl.designated_coach_id = auth.uid()
  );
$$;

drop policy if exists "Coach reads all clients" on public.clients;
drop policy if exists "Coach reads assigned clients" on public.clients;
create policy "Coach reads assigned clients" on public.clients
  for select using (
    (id = auth.uid() and public.is_authenticated_coach())
    or (designated_coach_id = auth.uid() and public.is_authenticated_coach())
  );

drop policy if exists "Coach reads all packages" on public.client_packages;
drop policy if exists "Coach reads assigned packages" on public.client_packages;
create policy "Coach reads assigned packages" on public.client_packages
  for select using (public.is_coach_assigned_to_client(client_packages.client_id));

drop policy if exists "Coach reads assigned comp grants" on public.comp_session_grants;
create policy "Coach reads assigned comp grants" on public.comp_session_grants
  for select using (public.is_coach_assigned_to_client(comp_session_grants.client_id));

drop policy if exists "Coach reads all sessions" on public.sessions;
drop policy if exists "Coach reads assigned sessions" on public.sessions;
create policy "Coach reads assigned sessions" on public.sessions
  for select using (public.is_coach_assigned_to_client(sessions.client_id));

drop policy if exists "Coach updates sessions" on public.sessions;
drop policy if exists "Coach updates assigned sessions" on public.sessions;
create policy "Coach updates assigned sessions" on public.sessions
  for update using (public.is_coach_assigned_to_client(sessions.client_id));
