import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { CopyButton } from '@/components/affiliate/CopyButton'

interface AffiliatePageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Affiliate Dashboard' }

export default async function AffiliatePage({ params }: AffiliatePageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId).eq('user_id', user.id).eq('status', 'active').maybeSingle()

  if (!membership || !['owner', 'admin'].includes(membership.role)) notFound()

  const [
    { data: table },
    { data: affiliateLink },
    { data: clicks },
    { data: conversions },
    { data: payouts },
    { data: settings },
  ] = await Promise.all([
    supabase.from('equity_tables').select('name, publish_affiliate_earnings').eq('id', tableId).single(),
    supabase.from('affiliate_links').select('*').eq('table_id', tableId).eq('active', true).maybeSingle(),
    supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true }).eq('table_id', tableId),
    supabase.from('affiliate_conversions').select('*').eq('table_id', tableId).order('converted_at', { ascending: false }),
    supabase.from('affiliate_payouts').select('*').eq('table_id', tableId).order('created_at', { ascending: false }),
    supabase.from('affiliate_settings').select('default_payout_amount, default_destination_url').limit(1).maybeSingle(),
  ])

  const clickCount = (clicks as { count?: number } | null)?.count ?? 0
  const totalEarnings = conversions?.reduce((sum, c) => sum + (c.payout_amount ?? 0), 0) ?? 0
  const pendingEarnings = conversions?.filter(c => c.payout_status === 'pending' || c.payout_status === 'approved')
    .reduce((sum, c) => sum + (c.payout_amount ?? 0), 0) ?? 0
  const paidEarnings = payouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) ?? 0

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Affiliate dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Earn ${settings?.default_payout_amount ?? 179.99} for every member who starts Global Pathways through your link.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total clicks', value: clickCount.toString(), icon: '🔗', hint: 'CTA clicks on your link' },
          { label: 'Conversions', value: (conversions?.length ?? 0).toString(), icon: '🚀', hint: 'Members who started Pathway' },
          { label: 'Estimated earnings', value: formatCurrency(totalEarnings), icon: '💰', hint: 'All time' },
          { label: 'Pending payout', value: formatCurrency(pendingEarnings), icon: '⏳', hint: 'Awaiting payment' },
        ].map(stat => (
          <div key={stat.label} className="et-card p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="font-display text-2xl font-bold text-navy-500">{stat.value}</div>
            <div className="text-xs font-semibold text-navy-400 mt-0.5">{stat.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{stat.hint}</div>
          </div>
        ))}
      </div>

      {/* Your affiliate link */}
      <div className="et-card p-6">
        <h2 className="font-display font-semibold text-navy-500 mb-1">Your affiliate link</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Share this link — when a member subscribes to Global Pathways through it, your table earns the first month's fee.
        </p>

        {affiliateLink ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono text-navy-500 overflow-x-auto">
                {affiliateLink.destination_url}
              </code>
              <CopyButton text={affiliateLink.destination_url} />
            </div>
            <p className="text-xs text-muted-foreground">
              Affiliate code: <strong className="text-navy-500">{affiliateLink.code}</strong>
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            No affiliate link found. Contact support if this persists.
          </div>
        )}
      </div>

      {/* Public visibility toggle (client component needed — simplified for now) */}
      <div className="et-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-navy-500 mb-1">Public earnings display</h2>
            <p className="text-sm text-muted-foreground">
              Currently {table?.publish_affiliate_earnings ? 'shown publicly' : 'private (only visible to table admins)'}.
              Update this in table settings.
            </p>
          </div>
        </div>
      </div>

      {/* Conversions */}
      <div className="et-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-navy-500">Conversions ({conversions?.length ?? 0})</h2>
          <span className="text-xs text-muted-foreground">Sorted by most recent</span>
        </div>

        {!conversions || conversions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-2">🚀</div>
            <p className="text-sm text-muted-foreground">No conversions yet.</p>
            <p className="text-xs text-muted-foreground mt-1">When a member starts Global Pathways through your link, it appears here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversions.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-500">{c.purchaser_email}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(c.converted_at)} · via {c.source}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-navy-500">{formatCurrency(c.payout_amount)}</p>
                  <span className={`badge-pill text-[10px] ${
                    c.payout_status === 'paid' ? 'bg-green-100 text-green-700' :
                    c.payout_status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {c.payout_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Affiliate disclosure */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Equity Table may receive compensation when members sign up for Global Pathways through your table's referral link.
        See our <a href="/legal/affiliate-disclosure" className="underline hover:text-foreground">affiliate disclosure</a> for details.
        Payout amounts are managed by Equity Table administrators.
      </p>
    </div>
  )
}
