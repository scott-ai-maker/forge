-- Migration: Enable strict RLS & least-privilege grants on email_suppressions,
-- client_lifecycle_audit_logs, and coach_onboarding_gates.
-- Addresses Liability Audit Finding #2 (Public Anonymous Database Read/Write Exposure).

-- 1. Enable RLS across all three tables
alter table public.email_suppressions enable row level security;
alter table public.client_lifecycle_audit_logs enable row level security;
alter table public.coach_onboarding_gates enable row level security;

-- 2. email_suppressions: strictly server-managed via service_role (zero anon or authenticated PostgREST access)
revoke all on public.email_suppressions from anon, authenticated;
drop policy if exists "Public can read email suppressions" on public.email_suppressions;
drop policy if exists "Public can manage email suppressions" on public.email_suppressions;

-- 3. client_lifecycle_audit_logs: append-only via server (service_role); read-only for assigned coach
revoke all on public.client_lifecycle_audit_logs from anon;
revoke insert, update, delete on public.client_lifecycle_audit_logs from authenticated;

drop policy if exists "Coach reads assigned lifecycle audit logs" on public.client_lifecycle_audit_logs;
create policy "Coach reads assigned lifecycle audit logs" on public.client_lifecycle_audit_logs
  for select to authenticated
  using (public.is_coach_assigned_to_client(client_lifecycle_audit_logs.client_id));

-- 4. coach_onboarding_gates: remove permissive USING (true) policy; enforce assigned-coach write & owner/coach read
revoke all on public.coach_onboarding_gates from anon;

drop policy if exists "Coaches and admins can view and manage onboarding gates" on public.coach_onboarding_gates;
drop policy if exists "Users and assigned coaches read onboarding gates" on public.coach_onboarding_gates;
create policy "Users and assigned coaches read onboarding gates" on public.coach_onboarding_gates
  for select to authenticated
  using (
    (select auth.uid()) = client_id
    or public.is_coach_assigned_to_client(coach_onboarding_gates.client_id)
  );

drop policy if exists "Assigned coaches insert onboarding gates" on public.coach_onboarding_gates;
create policy "Assigned coaches insert onboarding gates" on public.coach_onboarding_gates
  for insert to authenticated
  with check (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id));

drop policy if exists "Assigned coaches update onboarding gates" on public.coach_onboarding_gates;
create policy "Assigned coaches update onboarding gates" on public.coach_onboarding_gates
  for update to authenticated
  using (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id))
  with check (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id));

drop policy if exists "Assigned coaches delete onboarding gates" on public.coach_onboarding_gates;
create policy "Assigned coaches delete onboarding gates" on public.coach_onboarding_gates
  for delete to authenticated
  using (public.is_coach_assigned_to_client(coach_onboarding_gates.client_id));
