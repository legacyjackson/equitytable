import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDuration } from '@/lib/utils/format'

export const metadata = { title: 'Recordings — Admin' }

export default async function AdminRecordingsPage({
  searchParams,
}: {
  searchParams: Promise<{ visibility?: string; status?: string }>
}) {
  const { visibility, status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  let query = supabase
    .from('event_recordings')
    .select(`
      *,
      equity_tables(id, name),
      profiles:uploaded_by(email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (visibility) query = query.eq('visibility', visibility)
  if (status) query = query.eq('status', status)

  const { data: recordings, count } = await query

  const statusColors: Record<string, string> = {
    ready: 'bg-green-100 text-green-700',
    processing: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
    hidden: 'bg-gray-100 text-gray-700',
  }

  const visColors: Record<string, string> = {
    public: 'bg-green-100 text-green-700',
    table_only: 'bg-blue-100 text-blue-700',
    admin_only: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Recordings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">All Equity Event recordings across the platform.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['public', 'Public'], ['table_only', 'Table only'], ['admin_only', 'Admin only']].map(([v, label]) => (
          <Link
            key={v}
            href={v ? `/admin/recordings?visibility=${v}` : '/admin/recordings'}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              (visibility || '') === v ? 'bg-navy-500 text-white' : 'border border-border hover:bg-muted'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="et-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                {['Recording', 'Table', 'Uploaded by', 'Duration', 'Visibility', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recordings?.map(rec => {
                const table = rec.equity_tables as { id: string; name: string } | null
                const uploader = rec.profiles as { email: string; full_name: string | null } | null
                return (
                  <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-navy-500">{rec.title}</p>
                      {rec.description && <p className="text-xs text-muted-foreground line-clamp-1">{rec.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {table ? <Link href={`/app/tables/${table.id}`} className="hover:underline text-blue-700">{table.name}</Link> : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {uploader?.full_name || uploader?.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {rec.duration_seconds ? formatDuration(rec.duration_seconds) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] ${visColors[rec.visibility] || 'bg-gray-100'}`}>
                        {rec.visibility.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-pill text-[10px] ${statusColors[rec.status] || 'bg-gray-100'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(rec.created_at)}</td>
                    <td className="px-4 py-3">
                      {rec.video_url && (
                        <a href={rec.video_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700">Watch →</a>
                      )}
                    </td>
                  </tr>
                )
              })}
              {(!recordings || recordings.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No recordings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
