-- Migration: Harden RBAC immutability, private voice-note Storage RLS, and assigned-coach telemetry boundaries
-- Addresses Liability Audit Finding #1 (Privilege Escalation & Cross-Tenant Audio/Health Isolation).

-- 1. Kernel-level immutability trigger on privileged public.clients columns for authenticated PostgREST sessions
create or replace function public.enforce_clients_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('role', true) = 'authenticated' then
    if new.role is distinct from old.role then
      raise exception 'Insufficient privilege: cannot modify client role' using errcode = '42501';
    end if;
    if new.designated_coach_id is distinct from old.designated_coach_id then
      raise exception 'Insufficient privilege: cannot modify designated_coach_id' using errcode = '42501';
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'Insufficient privilege: cannot modify stripe_customer_id' using errcode = '42501';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Insufficient privilege: cannot modify account status' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_clients_privileged_columns on public.clients;
create trigger trg_enforce_clients_privileged_columns
  before update on public.clients
  for each row
  execute function public.enforce_clients_privileged_columns();

drop policy if exists "Client updates own record" on public.clients;
create policy "Client updates own record" on public.clients
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Ensure coach assignment helper functions exist before policy & folder evaluation
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

revoke all on function public.is_authenticated_coach() from public;
grant execute on function public.is_authenticated_coach() to authenticated, service_role;

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

revoke all on function public.is_coach_assigned_to_client(uuid) from public;
grant execute on function public.is_coach_assigned_to_client(uuid) to authenticated, service_role;

-- 3. Folder-scoped UUID helper for private client-coach Storage buckets
create or replace function public.can_access_client_storage_folder(folder_segment text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if folder_segment is null or folder_segment !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;
  target_id := folder_segment::uuid;
  return target_id = auth.uid() or public.is_coach_assigned_to_client(target_id);
end;
$$;

revoke all on function public.can_access_client_storage_folder(text) from public;
grant execute on function public.can_access_client_storage_folder(text) to authenticated, service_role;

-- 4. Provision & restrict coach-voice-notes Storage bucket strictly to the owning athlete and their assigned coach
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-voice-notes',
  'coach-voice-notes',
  false,
  5242880,
  array['audio/mp4', 'audio/webm', 'audio/aac', 'audio/ogg', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['audio/mp4', 'audio/webm', 'audio/aac', 'audio/ogg', 'audio/mpeg', 'audio/wav'];

drop policy if exists "Authenticated users upload voice notes" on storage.objects;
drop policy if exists "Assigned participants upload voice notes" on storage.objects;
create policy "Assigned participants upload voice notes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'coach-voice-notes'
    and public.can_access_client_storage_folder((storage.foldername(name))[1])
  );

drop policy if exists "Authenticated users view voice notes" on storage.objects;
drop policy if exists "Assigned participants view voice notes" on storage.objects;
create policy "Assigned participants view voice notes" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'coach-voice-notes'
    and public.can_access_client_storage_folder((storage.foldername(name))[1])
  );

drop policy if exists "Assigned participants delete voice notes" on storage.objects;
create policy "Assigned participants delete voice notes" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'coach-voice-notes'
    and public.can_access_client_storage_folder((storage.foldername(name))[1])
  );

-- 5. Restrict wearable metrics and personal records coach SELECT policies strictly to assigned clients
drop policy if exists "Users read own wearable metrics" on public.athlete_wearable_metrics;
create policy "Users read own wearable metrics" on public.athlete_wearable_metrics
  for select to authenticated
  using (
    auth.uid() = client_id
    or public.is_coach_assigned_to_client(client_id)
  );

drop policy if exists "Users read own personal records" on public.client_personal_records;
create policy "Users read own personal records" on public.client_personal_records
  for select to authenticated
  using (
    auth.uid() = user_id
    or public.is_coach_assigned_to_client(user_id)
  );
