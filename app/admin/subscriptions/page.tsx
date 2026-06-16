import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils/format'

export const metadata = { title: 'Subscriptions — Admin' }

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const pageNum = parseInt(page || '1', 10)
  const perPage = 25
  const from = (pageNum - 1) * perPage

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      equity_tables(id, name, slug, member_count, status)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (status) query = query.eq('status', status)

  const { data: subs, count } = await query
  const totalPages = Math.ceil((count || 0) / perPage)

  // Revenue estimate (active subs only)
  const { data: activeSubs } = await supabase
    .from('subscriptions')
    .select('included_seats, extra_seats, comped')
    .eq('status', 'active')

  const mrr = (activeSubs || []).reduce((sum, s) => {
    if (s.comped) return sum
    return sum + 49.99 + (s.extra_seats * 4.99)
  }, 0)

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    past_due: 'bg-amber-100 text-amber-700',
    canceled: 'bg-red-100 text-red-700',
    paused: 'bg-gray-100 text-gray-700',
    unpaid: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-500">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count?.toLocaleString()} total</p>
        </div>
        <div className="et-card px-5 py-3 text-center">
          <div className="font-display text-2xl font-bold text-green-600">{formatCurrency(mrr)}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Est. MRR</div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'active', 'trialing', 'past_due', 'canceled', 'paused'].map(s => (
          <Link
            key={s}
            href={s ? `/admin/subscriptions?status=${s}` : '/admin/subscriptions'}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              (status || '') === s
                ? 'bg-navy-500 text-white'
                : 'border border-border hover:bg-muted'
            }`}
          >
            {s || 'All'}
          </Link>
        ))}
      </div>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {['Table', 'Status', 'Seats', 'Period end', 'Stripe ID', 'Comped', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subs?.map(sub => {
                const table = sub.equity_tables as { id: string; name: string; slug: string; member_count: number } | null
                return (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      {table ? (
                        <Link href={`/app/tables/${table.id}`} className="text-sm font-semibold text-blue-700 hover:underline">
                          {table.name}
                        </Link>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] ${statusColors[sub.status] || 'bg-gray-100 text-gray-700'}`}>
                        {sub.status}
                      </span>
                      {sub.cancel_at_period_end && (
                        <span className="badge-pill bg-orange-100 text-orange-700 text-[10px] ml-1">cancels</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sub.included_seats} + {sub.extra_seats} extra
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {sub.current_period_end ? formatDate(sub.current_period_end) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {sub.stripe_subscription_id ? (
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline font-mono"
                        >
                          {sub.stripe_subscription_id.slice(0, 16)}…
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {sub.comped && (
                        <span className="badge-pill bg-purple-100 text-purple-700 text-[10px]">
                          Comped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/subscriptions/${sub.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {pageNum} of {totalPages}</p>
            <div className="flex gap-2">
              {pageNum > 1 && <Link href={`/admin/subscriptions?page=${pageNum - 1}${status ? `&status=${status}` : ''}`} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">← Prev</Link>}
              {pageNum < totalPages && <Link href={`/admin/subscriptions?page=${pageNum + 1}${status ? `&status=${status}` : ''}`} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">Next →</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
