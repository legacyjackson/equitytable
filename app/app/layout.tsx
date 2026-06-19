import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Load profile + memberships for sidebar/nav context
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('table_memberships')
      .select('*, equity_tables(id, name, slug, logo_url, status)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at'),
  ])

  // Load platform roles
  const { data: platformRoles } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)

  const isAdmin = platformRoles?.some(r =>
    ['super_admin', 'content_admin', 'support_admin'].includes(r.role)
  ) ?? false

  return (
    <AppShell
      profile={profile}
      memberships={memberships || []}
      isAdmin={isAdmin}
    >
      {children}
    </AppShell>
  )
}
