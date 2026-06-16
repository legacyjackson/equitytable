import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDuration } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface RecordingsPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Recordings' }

export default async function RecordingsPage({ params }: RecordingsPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: membership }, { data: table }, { data: recordings }] = await Promise.all([
    supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('equity_tables').select('name').eq('id', tableId).maybeSingle(),
    supabase
      .from('event_recordings')
      .select(`
        id, title, description, video_url, thumbnail_url, duration_seconds,
        visibility, status, created_at, tags,
        equity_events(title, starts_at),
        profiles:uploaded_by(full_name)
      `)
      .eq('table_id', tableId)
      .in('visibility', membership ? ['public', 'table_only'] : ['public'])
      .eq('status', 'ready')
      .order('created_at', { ascending: false }),
  ])

  if (!table) notFound()

  const isAdmin = ['owner', 'admin', 'facilitator'].includes(membership?.role ?? '')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Recordings</h1>
          <p className="text-muted-foreground mt-1">{table.name}</p>
        </div>
      </div>

      {!recordings || recordings.length === 0 ? (
        <div className="et-card p-16 text-center">
          <div className="text-5xl mb-4">📹</div>
          <h2 className="font-display text-xl font-semibold text-navy-500 mb-2">
            Record your next class or meetup
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Keep the wisdom on your table page. Recordings from Equity Events appear here.
          </p>
          {isAdmin && (
            <Link
              href={`/app/tables/${tableId}/events`}
              className="inline-flex items-center rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
            >
              Go to Events
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recordings.map((r: any) => (
            <div key={r.id} className="et-card overflow-hidden group hover:shadow-et-card-hover transition-shadow">
              {/* Thumbnail */}
              <div className="aspect-video bg-navy-100 flex items-center justify-center relative overflow-hidden">
                {r.thumbnail_url ? (
                  <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-navy-300">
                    <span className="text-4xl">📹</span>
                    <span className="text-xs font-medium">Recording</span>
                  </div>
                )}
                {r.duration_seconds && (
                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white font-mono">
                    {formatDuration(r.duration_seconds)}
                  </div>
                )}
                {r.video_url && (
                  <a
                    href={r.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <span className="text-navy-500 text-xl pl-1">▶</span>
                    </div>
                  </a>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-navy-500 leading-tight mb-1 line-clamp-2">{r.title}</h3>
                {r.equity_events?.title && (
                  <p className="text-xs text-muted-foreground mb-1">From: {r.equity_events.title}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>{r.profiles?.full_name ?? 'Table member'}</span>
                  <span>{formatDate(r.created_at, 'MMM d, yyyy')}</span>
                </div>
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.map((tag: string) => (
                      <span key={tag} className="badge-pill bg-muted text-muted-foreground text-[10px]">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
