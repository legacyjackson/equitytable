import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils/format'

export const metadata = { title: 'Conversions — Admin' }

export default async function AdminConversionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const pageNum = parseInt(page || '1', 10)
  const perPage = 25
  const from = (pageNum - 1) * perPage

  let query = supabase
    .from('affiliate_conversions')
    .select(`
      *,
      equity_tables(id, name)
    `, { count: 'exact' })
    .order('converted_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (status) query = query.eq('payout_status', status)

  const { data: conversions, count } = await query
  const totalPages = Math.ceil((count || 0) / perPage)

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy-500">Conversions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count?.toLocaleString()} total</p>
        </div>
        <Link
          href="/admin/affiliate/conversions/new"
          className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
        >
          + Record manually
        </Link>
      </div>

      {/* Note on manual entry */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Manual & CSV entry:</strong> If Global Pathways doesn't provide a webhook, use "Record manually" or upload a CSV. All conversions start as "pending" until approved.
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'paid', 'rejected'].map(s => (
          <Link
            key={s}
            href={s ? `/admin/affiliate/conversions?status=${s}` : '/admin/affiliate/conversions'}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              (status || '') === s ? 'bg-navy-500 text-white' : 'border border-border hover:bg-muted'
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
                {['Purchaser', 'Table', 'Amount', 'Payout', 'Status', 'Source', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conversions?.map(c => {
                const table = c.equity_tables as { id: string; name: string } | null
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-navy-500">{c.purchaser_email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {table ? (
                        <Link href={`/app/tables/${table.id}`} className="hover:underline text-blue-700">{table.name}</Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-navy-500">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">{formatCurrency(c.payout_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] ${statusColors[c.payout_status] || 'bg-gray-100 text-gray-700'}`}>
                        {c.payout_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{c.source}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.converted_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/affiliate/conversions/${c.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Review →
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(!conversions || conversions.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No conversions yet. Record them manually or set up a webhook from Global Pathways.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Page {pageNum} of {totalPages}</p>
            <div className="flex gap-2">
              {pageNum > 1 && <Link href={`/admin/affiliate/conversions?page=${pageNum - 1}${status ? `&status=${status}` : ''}`} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">← Prev</Link>}
              {pageNum < totalPages && <Link href={`/admin/affiliate/conversions?page=${pageNum + 1}${status ? `&status=${status}` : ''}`} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">Next →</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
