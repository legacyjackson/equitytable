import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils/format'

export const metadata = { title: 'Audit Logs — Admin' }

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>
}) {
  const { action, page } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const pageNum = parseInt(page || '1', 10)
  const perPage = 30
  const from = (pageNum - 1) * perPage

  let query = supabase
    .from('audit_logs')
    .select(`
      id, action, target_type, target_id, metadata, created_at,
      profiles:actor_user_id(email, full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + perPage - 1)

  if (action) query = query.ilike('action', `%${action}%`)

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count || 0) / perPage)

  const actionColors: Record<string, string> = {
    create: 'bg-green-100 text-green-700',
    delete: 'bg-red-100 text-red-700',
    update: 'bg-blue-100 text-blue-700',
    approve: 'bg-purple-100 text-purple-700',
    paid: 'bg-amber-100 text-amber-700',
  }

  const getActionColor = (a: string) => {
    const verb = a.split('.').pop() || ''
    return actionColors[verb] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Audit logs</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {count?.toLocaleString()} events — append-only record of all significant platform actions.
        </p>
      </div>

      <form className="flex gap-3">
        <input
          name="action"
          defaultValue={action}
          placeholder="Filter by action (e.g. table.create, payout…)"
          className="flex-1 rounded-lg border border-border px-3.5 py-2 text-sm outline-none focus:border-blue-600 transition-colors"
        />
        <button type="submit" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
          Filter
        </button>
      </form>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {['Timestamp', 'Actor', 'Action', 'Target', 'Details'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs?.map(log => {
                const actor = log.profiles as { email: string; full_name: string | null } | null
                const meta = log.metadata as Record<string, unknown> | null

                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {actor ? (
                        <div>
                          <p className="font-medium text-navy-500">{actor.full_name || '—'}</p>
                          <p className="text-muted-foreground">{actor.email}</p>
                        </div>
                      ) : <span className="text-muted-foreground">System</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] font-mono ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.target_type && (
                        <span className="font-mono">
                          {log.target_type}
                          {log.target_id && <span className="text-[10px] text-muted-foreground/60 ml-1">:{log.target_id.slice(0, 8)}</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {meta && Object.keys(meta).length > 0 ? (
                        <span className="font-mono text-[11px]">{JSON.stringify(meta).slice(0, 80)}…</span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No audit logs yet. Significant admin actions will appear here.
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
              {pageNum > 1 && <a href={`/admin/audit-logs?page=${pageNum - 1}`} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">← Prev</a>}
              {pageNum < totalPages && <a href={`/admin/audit-logs?page=${pageNum + 1}`} className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted">Next →</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
