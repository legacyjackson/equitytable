import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { firstOf } from '@/lib/utils/firstOf'

export const metadata = { title: 'Equity Tables — Admin' }

export default async function AdminEquityTablesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const { q, status, page } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const pageNum = parseInt(page || '1', 10)
  const perPage = 20
  const from = (pageNum - 1) * perPage

  let query = supabase
    .from('equity_tables')
    .select(`
      id, name, slug, status, member_count, pathway_participant_count,
      created_at, visibility,
      table_type:equity_table_types(name),
      owner:profiles!owner_id(email, full_name),
      subscriptions(status, included_seats, extra_seats, stripe_subscription_id)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (q) query = query.ilike('name', `%${q}%`)
  if (status) query = query.eq('status', status)

  const { data: tables, count } = await query
  const totalPages = Math.ceil((count || 0) / perPage)

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trial: 'bg-blue-100 text-blue-700',
    past_due: 'bg-amber-100 text-amber-700',
    canceled: 'bg-red-100 text-red-700',
    suspended: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-500">Equity Tables</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count?.toLocaleString()} total</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by table name…"
          className="flex-1 min-w-48 rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
        />
        <select
          name="status"
          defaultValue={status || ''}
          className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
          Filter
        </button>
        {(q || status) && (
          <Link href="/admin/equity-tables" className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            Clear
          </Link>
        )}
      </form>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {['Table', 'Type', 'Owner', 'Members', 'Status', 'Subscription', 'Created', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tables?.map(t => {
                const sub = Array.isArray(t.subscriptions) ? t.subscriptions[0] : t.subscriptions as { status: string; included_seats: number; extra_seats: number; stripe_subscription_id: string | null } | null
                const owner = firstOf(t.owner) as { email: string; full_name: string | null } | null
                const tableType = firstOf(t.table_type) as { name: string } | null

                return (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-navy-500">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground">/{t.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{tableType?.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span title={owner?.email || ''}>{owner?.full_name || owner?.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">{t.member_count}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {sub ? (
                        <div>
                          <span className={`badge-pill text-[10px] ${statusColors[sub.status] || 'bg-gray-100'}`}>{sub.status}</span>
                          <p className="text-[11px] mt-0.5">{sub.included_seats + sub.extra_seats} seats</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/app/tables/${t.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors" title="View table">
                          ↗
                        </Link>
                        <Link href={`/admin/equity-tables/${t.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                          Manage →
                        </Link>
                      </div>
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
              {pageNum > 1 && (
                <Link href={`/admin/equity-tables?page=${pageNum - 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`}
                  className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">← Prev</Link>
              )}
              {pageNum < totalPages && (
                <Link href={`/admin/equity-tables?page=${pageNum + 1}${q ? `&q=${q}` : ''}${status ? `&status=${status}` : ''}`}
                  className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">Next →</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
