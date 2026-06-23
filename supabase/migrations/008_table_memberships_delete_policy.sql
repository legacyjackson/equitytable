-- ============================================================
-- MIGRATION 008: table_memberships DELETE policy
-- ============================================================
-- table_memberships had RLS enabled with select/insert/update
-- policies but no delete policy at all, so every DELETE from a
-- non-service-role client (e.g. the admin "remove member" button)
-- silently matched zero rows and did nothing.

create policy "memberships: admins can delete memberships"
  on public.table_memberships for delete
  using (public.is_table_admin(table_id) or public.is_super_admin());
