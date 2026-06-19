import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatDuration } from '@/lib/utils/format'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { VideoPlayer } from '@/components/video/VideoPlayer'

interface RecordingsPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Recordings' }

export default async function RecordingsPage({ params }: RecordingsPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const [{ data: membership }, { data: table }] = await Promise.all([
    supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('equity_tables').select('name, leaderboard_enabled').eq('id', tableId).maybeSingle(),
  ])

  const { data: recordings } = await supabase
    .from('event_recordings')
    .select(`
      id, title, description, video_url, audio_url, thumbnail_url,
      duration_seconds, visibility, status, created_at, tags,
      storage_provider, mux_asset_id,
      equity_events(id, title, starts_at),
      profiles:uploaded_by(full_name)
    `)
    .eq('table_id', tableId)
    .in('visibility', membership ? ['public', 'table_only'] : ['public'])
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  if (!table) notFound()

  const isAdmin = ['owner', 'admin', 'facilitator'].includes(membership?.role ?? '')

  // Separate featured/recent for layout purposes
  const allRecordings = recordings || []
  const featuredRecording = allRecordings[0] || null
  const restRecordings = allRecordings.slice(1)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recordings"
        description={table.name}
        actions={
          isAdmin ? (
            <Link
              href={`/app/tables/${tableId}/events`}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Go to Events to record →
            </Link>
          ) : undefined
        }
      />

      {allRecordings.length === 0 ? (
        <EmptyState
          icon="📹"
          title="Record your next class or meetup"
          description="Keep the wisdom on your table page. Recordings from Equity Events appear here for all members to revisit."
          action={isAdmin ? { label: 'Go to Events', href: `/app/tables/${tableId}/events` } : undefined}
          size="lg"
        />
      ) : (
        <div className="space-y-8">
          {/* Featured recording — full-width video player */}
          {featuredRecording && (
            <div className="et-card overflow-hidden">
              <VideoPlayer
                videoUrl={(featuredRecording as any).video_url}
                thumbnailUrl={(featuredRecording as any).thumbnail_url}
                title={(featuredRecording as any).title}
                muxAssetId={(featuredRecording as any).mux_asset_id}
                duration={(featuredRecording as any).duration_seconds}
                className="rounded-none"
              />
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold text-navy-500 mb-1">
                  {(featuredRecording as any).title}
                </h2>
                {(featuredRecording as any).description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {(featuredRecording as any).description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {(featuredRecording as any).equity_events?.title && (
                    <span>From: {(featuredRecording as any).equity_events.title}</span>
                  )}
                  {(featuredRecording as any).duration_seconds && (
                    <span>{formatDuration((featuredRecording as any).duration_seconds)}</span>
                  )}
                  <span>{(featuredRecording as any).profiles?.full_name ?? 'Table member'}</span>
                  <span>{formatDate((featuredRecording as any).created_at)}</span>
                  {(featuredRecording as any).mux_asset_id && (
                    <span className="badge-pill bg-blue-50 text-blue-700">HD streaming</span>
                  )}
                </div>
                {(featuredRecording as any).tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {((featuredRecording as any).tags as string[]).map((tag: string) => (
                      <span key={tag} className="badge-pill bg-muted text-muted-foreground text-[10px]">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest of recordings — grid */}
          {restRecordings.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-navy-500 mb-4">More recordings</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {restRecordings.map((r: any) => (
                  <div key={r.id} className="et-card overflow-hidden group hover:shadow-et-card-hover transition-shadow">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-navy-100 flex items-center justify-center relative overflow-hidden">
                      {r.thumbnail_url ? (
                        <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : r.mux_asset_id ? (
                        <img
                          src={`https://image.mux.com/${r.mux_asset_id}/thumbnail.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-navy-300">
                          <span className="text-3xl">📹</span>
                        </div>
                      )}
                      {r.duration_seconds && (
                        <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] text-white font-mono">
                          {formatDuration(r.duration_seconds)}
                        </div>
                      )}
                      {/* Play overlay */}
                      <a
                        href={r.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                          <span className="text-navy-500 text-xl pl-1">▶</span>
                        </div>
                      </a>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-navy-500 text-sm leading-snug mb-1 line-clamp-2">{r.title}</h3>
                      {r.equity_events?.title && (
                        <p className="text-xs text-muted-foreground mb-1">From: {r.equity_events.title}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>{r.profiles?.full_name ?? 'Table member'}</span>
                        <span>{formatDate(r.created_at, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
