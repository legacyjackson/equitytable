import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { firstOf } from '@/lib/utils/firstOf'

export const metadata = { title: 'Payouts — Admin' }

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const [{ data: payouts }, { data: approved }] = await Promise.all([
    supabase
      .from('affiliate_payouts')
      .select('*, equity_tables(id, name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('affiliate_conversions')
      .select('id, table_id, payout_amount, equity_tables(name)')
      .eq('payout_status', 'approved'),
  ])

  // Group approved by table for easy bulk payout
  const byTable: Record<string, { tableId: string; tableName: string; total: number; count: number }> = {}
  for (const c of approved || []) {
    const table = firstOf(c.equity_tables) as { name: string } | null
    if (!c.table_id) continue
    if (!byTable[c.table_id]) {
      byTable[c.table_id] = { tableId: c.table_id, tableName: table?.name || 'Unknown', total: 0, count: 0 }
    }
    byTable[c.table_id].total += c.payout_amount
    byTable[c.table_id].count++
  }

  const totalPending = Object.values(byTable).reduce((s, t) => s + t.total, 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Payouts</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage affiliate payout disbursements to Equity Tables.
        </p>
      </div>

      {/* Pending by table */}
      {Object.keys(byTable).length > 0 && (
        <div className="et-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy-500">
              Ready to pay — {formatCurrency(totalPending)} total
            </h2>
          </div>
          <div className="space-y-2">
            {Object.values(byTable).map(t => (
              <div key={t.tableId} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                <div>
                  <p className="text-sm font-semibold text-navy-500">{t.tableName}</p>
                  <p className="text-xs text-muted-foreground">{t.count} approved conversion{t.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-green-700">{formatCurrency(t.total)}</span>
                  <Link
                    href={`/admin/affiliate/payouts/new?table=${t.tableId}`}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors"
                  >
                    Mark paid
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(byTable).length === 0 && (
        <div className="et-card p-8 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm text-muted-foreground">No approved conversions awaiting payout.</p>
          <Link href="/admin/affiliate/conversions" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
            Review pending conversions →
          </Link>
        </div>
      )}

      {/* Payout history */}
      <div>
        <h2 className="font-display font-semibold text-navy-500 mb-4">Payout history</h2>
        <div className="et-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  {['Table', 'Amount', 'Method', 'Status', 'Date', 'Notes'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts?.map(p => {
                  const table = p.equity_tables as { id: string; name: string } | null
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-navy-500">{table?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-navy-500">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{p.payment_method || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge-pill text-[10px] ${statusColors[p.status] || 'bg-gray-100'}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.notes || '—'}</td>
                    </tr>
                  )
                })}
                {(!payouts || payouts.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No payout history yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
