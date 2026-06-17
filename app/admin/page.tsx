import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { firstOf } from '@/lib/utils/firstOf'

export const metadata = { title: 'Super Admin' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: roleData } = await supabase
    .from('platform_roles')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['super_admin', 'content_admin', 'support_admin'])
    .maybeSingle()

  if (!roleData) redirect('/app')

  // Platform stats
  const [
    { count: userCount },
    { count: tableCount },
    { count: activeSubCount },
    { count: clickCount },
    { count: conversionCount },
    { data: recentTables },
    { data: recentConversions },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('equity_tables').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true }),
    supabase.from('affiliate_conversions').select('id', { count: 'exact', head: true }),
    supabase.from('equity_tables').select('id, name, slug, status, member_count, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('affiliate_conversions').select('purchaser_email, payout_amount, payout_status, converted_at, equity_tables(name)').order('converted_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Total users', value: userCount ?? 0, icon: '👤', href: '/admin/users' },
    { label: 'Equity Tables', value: tableCount ?? 0, icon: '🪑', href: '/admin/equity-tables' },
    { label: 'Active subscriptions', value: activeSubCount ?? 0, icon: '💳', href: '/admin/subscriptions' },
    { label: 'CTA clicks', value: clickCount ?? 0, icon: '🔗', href: '/admin/affiliate' },
    { label: 'Conversions', value: conversionCount ?? 0, icon: '🚀', href: '/admin/affiliate/conversions' },
  ]

  const adminNav = [
    { href: '/admin/users', label: 'Users', icon: '👤' },
    { href: '/admin/equity-tables', label: 'Equity Tables', icon: '🪑' },
    { href: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
    { href: '/admin/courses', label: 'Courses', icon: '📚' },
    { href: '/admin/affiliate', label: 'Affiliate', icon: '🔗' },
    { href: '/admin/affiliate/conversions', label: 'Conversions', icon: '🚀' },
    { href: '/admin/affiliate/payouts', label: 'Payouts', icon: '💰' },
    { href: '/admin/system-settings', label: 'System settings', icon: '⚙️' },
    { href: '/admin/audit-logs', label: 'Audit logs', icon: '📋' },
    { href: '/admin/feature-flags', label: 'Feature flags', icon: '🚩' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 mb-3">
          ⚡ Super Admin
        </div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">
          Platform overview
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href} className="et-card p-5 hover:shadow-et-card-hover transition-shadow">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="font-display text-3xl font-bold text-navy-500">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick nav */}
      <div className="et-card p-5">
        <h2 className="font-display font-semibold text-navy-500 mb-4">Admin tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {adminNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-muted transition-colors"
            >
              <span>{item.icon}</span>
              <span className="font-medium text-navy-500">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent tables */}
        <div className="et-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-navy-500">Recent tables</h2>
            <Link href="/admin/equity-tables" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border">
            {recentTables?.map(table => (
              <div key={table.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center text-navy-500 font-bold text-xs shrink-0">
                  {table.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-500 truncate">{table.name}</p>
                  <p className="text-xs text-muted-foreground">{table.member_count} members · {formatRelativeTime(table.created_at)}</p>
                </div>
                <span className={`badge-pill text-[10px] ${table.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {table.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent conversions */}
        <div className="et-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-navy-500">Recent conversions</h2>
            <Link href="/admin/affiliate/conversions" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {!recentConversions || recentConversions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No conversions yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {recentConversions.map(c => {
                const table = firstOf(c.equity_tables) as { name: string } | null
                return (
                  <div key={(c as any).id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-500 truncate">{c.purchaser_email}</p>
                      <p className="text-xs text-muted-foreground">{table?.name} · {formatRelativeTime(c.converted_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-navy-500">{formatCurrency(c.payout_amount)}</p>
                      <span className={`badge-pill text-[10px] ${c.payout_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.payout_status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Back to app */}
      <div className="pt-2">
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to app
        </Link>
      </div>
    </div>
  )
}
