import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'

export const metadata = { title: 'Affiliate — Admin' }

export default async function AdminAffiliatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [
    { count: totalClicks },
    { count: totalConversions },
    { data: settings },
    { data: pendingPayouts },
    { data: topTables },
    { data: recentClicks },
  ] = await Promise.all([
    supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true }),
    supabase.from('affiliate_conversions').select('id', { count: 'exact', head: true }),
    supabase.from('affiliate_settings').select('*').limit(1).maybeSingle(),
    supabase
      .from('affiliate_conversions')
      .select('payout_amount')
      .eq('payout_status', 'approved'),
    supabase
      .from('affiliate_conversions')
      .select('table_id, equity_tables(name)', { count: 'exact' })
      .order('converted_at', { ascending: false })
      .limit(5),
    supabase
      .from('affiliate_clicks')
      .select('clicked_at, cta_placement, equity_tables(name)')
      .order('clicked_at', { ascending: false })
      .limit(10),
  ])

  const pendingTotal = (pendingPayouts || []).reduce((s, r) => s + r.payout_amount, 0)

  const conversionRate = totalClicks && totalConversions
    ? ((totalConversions / totalClicks) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Affiliate overview</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Global Pathways referral tracking and payout management.
        </p>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'CTA clicks', value: totalClicks?.toLocaleString() || '0', icon: '🔗', href: undefined },
          { label: 'Conversions', value: totalConversions?.toLocaleString() || '0', icon: '🚀', href: '/admin/affiliate/conversions' },
          { label: 'Conversion rate', value: `${conversionRate}%`, icon: '📊', href: undefined },
          { label: 'Pending payouts', value: formatCurrency(pendingTotal), icon: '💰', href: '/admin/affiliate/payouts' },
        ].map(stat => (
          <div key={stat.label}>
            {stat.href ? (
              <Link href={stat.href} className="et-card p-5 block hover:shadow-et-card-hover transition-shadow">
                <div className="text-xl mb-2">{stat.icon}</div>
                <div className="font-display text-2xl font-bold text-navy-500">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </Link>
            ) : (
              <div className="et-card p-5">
                <div className="text-xl mb-2">{stat.icon}</div>
                <div className="font-display text-2xl font-bold text-navy-500">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Platform settings */}
      <div className="et-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-navy-500">Platform affiliate settings</h2>
          <Link href="/admin/system-settings" className="text-xs text-blue-600 hover:underline">Edit in settings →</Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Default destination</p>
            <a href={settings?.default_destination_url} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-xs truncate block">
              {settings?.default_destination_url}
            </a>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Default payout</p>
            <p className="font-semibold text-navy-500">{formatCurrency(settings?.default_payout_amount || 179.99)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Table CTA customization</p>
            <p className="font-semibold text-navy-500">{settings?.allow_table_cta_customization ? 'Allowed' : 'Restricted'}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Default CTA text</p>
          <p className="text-sm text-foreground italic">"{settings?.cta_default_text}"</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="et-card p-5">
          <h2 className="font-display font-semibold text-navy-500 mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { href: '/admin/affiliate/conversions', icon: '🚀', label: 'View all conversions', desc: 'Review and approve conversion records' },
              { href: '/admin/affiliate/payouts', icon: '💰', label: 'Manage payouts', desc: 'Mark conversions as paid to tables' },
              { href: '/admin/affiliate/conversions?status=pending', icon: '⏳', label: 'Pending approvals', desc: 'Conversions awaiting approval' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-navy-500">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent clicks */}
        <div className="et-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="font-semibold text-navy-500">Recent CTA clicks</h2>
          </div>
          {!recentClicks || recentClicks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No clicks recorded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {recentClicks.map((click: any) => (
                <div key={click.id || click.clicked_at} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-500 truncate">
                      {(click.equity_tables as { name: string } | null)?.name || 'Unknown table'}
                    </p>
                    <p className="text-xs text-muted-foreground">{click.cta_placement} · {formatRelativeTime(click.clicked_at)}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
