-- ============================================================
-- MIGRATION 009: Unlimited table access (internal test/admin accounts)
-- ============================================================
-- A small allowlist for accounts that should bypass the normal
-- "3 free tables per subscription" cap and the "member of 3 tables"
-- creation block — e.g. internal accounts testing the create-table
-- flow without going through Stripe.
--
-- This is intentionally a separate table, not a column on profiles:
-- profiles has a blanket "users can update own profile" policy with
-- no column restriction, so a plain boolean column there could be
-- self-granted by any user via the client SDK.

create table public.unlimited_table_access (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  granted_by  uuid references public.profiles(id),
  reason      text,
  created_at  timestamptz not null default now()
);

comment on table public.unlimited_table_access is 'Allowlist of accounts exempt from table-creation billing/member caps.';

alter table public.unlimited_table_access enable row level security;

create policy "unlimited_table_access: super admin can manage"
  on public.unlimited_table_access for all
  using (public.is_super_admin());

create policy "unlimited_table_access: users can check own status"
  on public.unlimited_table_access for select
  using (user_id = auth.uid());

-- Grant Julius's account unlimited table access for testing the
-- create-table flow without payment.
insert into public.unlimited_table_access (user_id, reason)
values ('a8268a49-8003-46cd-9006-bccbbf609bd4', 'Internal testing of create-table flow')
on conflict (user_id) do nothing;
