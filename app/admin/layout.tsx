import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: '⊞', exact: true },
  { href: '/admin/users', label: 'Users', icon: '👤' },
  { href: '/admin/equity-tables', label: 'Equity Tables', icon: '🪑' },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
  { section: 'Content' },
  { href: '/admin/courses', label: 'Courses', icon: '📚' },
  { href: '/admin/audio-jobs', label: 'Audio jobs', icon: '🔊' },
  { href: '/admin/recordings', label: 'Recordings', icon: '📹' },
  { href: '/admin/table-types', label: 'Table types', icon: '🏷️' },
  { section: 'Affiliate' },
  { href: '/admin/affiliate', label: 'Affiliate overview', icon: '🔗' },
  { href: '/admin/affiliate/conversions', label: 'Conversions', icon: '🚀' },
  { href: '/admin/affiliate/payouts', label: 'Payouts', icon: '💰' },
  { section: 'Platform' },
  { href: '/admin/system-settings', label: 'System settings', icon: '⚙️' },
  { href: '/admin/feature-flags', label: 'Feature flags', icon: '🚩' },
  { href: '/admin/audit-logs', label: 'Audit logs', icon: '📋' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: role } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['super_admin', 'content_admin', 'support_admin'])
    .maybeSingle()

  if (!role) redirect('/app')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Admin sidebar — navy, darker than app sidebar */}
      <aside className="hidden lg:flex w-56 flex-col shrink-0 border-r"
        style={{ background: '#070F28', borderColor: 'rgba(255,255,255,0.06)' }}>

        {/* Logo — dark-bg on navy sidebar */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Logo variant="dark-bg" size="xs" />
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-300">
              {role.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-0.5">
          {ADMIN_NAV.map((item, i) => {
            if ('section' in item) {
              return (
                <div key={i} className="pt-4 pb-1 px-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {item.section}
                  </p>
                </div>
              )
            }
            return (
              <AdminNavItem
                key={item.href}
                href={item.href!}
                label={item.label!}
                icon={item.icon!}
                exact={'exact' in item ? item.exact : false}
              />
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t px-3 py-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name || 'Admin'}
              </p>
            </div>
            <Link href="/app" title="Back to app"
              className="text-white/40 hover:text-white transition-colors text-sm shrink-0">
              ↗
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-12 border-b border-border bg-white flex items-center px-6 shrink-0">
          <p className="text-xs text-muted-foreground">
            Super Admin Portal —{' '}
            <Link href="/app" className="text-blue-600 hover:underline">Back to app ↗</Link>
          </p>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Client nav item needs to be a server component with pathname logic
// Using a simple approach: highlight if href matches pathname via CSS
function AdminNavItem({ href, label, icon, exact }: {
  href: string; label: string; icon: string; exact?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors',
        'text-white/60 hover:bg-white/8 hover:text-white'
      )}
    >
      <span className="text-sm w-4 text-center">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
