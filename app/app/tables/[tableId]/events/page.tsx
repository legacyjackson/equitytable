import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatEventDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'

interface EventsPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Events' }

const LOCATION_ICONS: Record<string, string> = {
  online: '💻', in_person: '📍', hybrid: '🔀',
}

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  canceled: 'bg-red-100 text-red-600',
  completed: 'bg-blue-100 text-blue-700',
}

export default async function EventsPage({ params }: EventsPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId).eq('user_id', user.id).eq('status', 'active').maybeSingle()

  if (!membership) notFound()

  const isFacilitator = ['owner', 'admin', 'facilitator'].includes(membership.role)
  const now = new Date().toISOString()

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('equity_events')
      .select('*')
      .eq('table_id', tableId)
      .in('status', ['published', 'draft'])
      .gte('starts_at', now)
      .order('starts_at'),

    supabase
      .from('equity_events')
      .select('*, event_recordings(id)')
      .eq('table_id', tableId)
      .in('status', ['completed', 'published'])
      .lt('starts_at', now)
      .order('starts_at', { ascending: false })
      .limit(20),
  ])

  // User's RSVPs
  const allEventIds = [...(upcoming ?? []), ...(past ?? [])].map(e => e.id)
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('event_id, status')
    .eq('user_id', user.id)
    .in('event_id', allEventIds)

  const rsvpMap: Record<string, string> = {}
  rsvps?.forEach(r => { rsvpMap[r.event_id] = r.status })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Events"
        description="Equity Events — classes, workshops, meetups, and more."
        actions={isFacilitator ? (
          <Link
            href={`/app/tables/${tableId}/events/new`}
            className="rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            + Create event
          </Link>
        ) : undefined}
      />

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">
          Upcoming {upcoming && upcoming.length > 0 ? `(${upcoming.length})` : ''}
        </h2>

        {!upcoming || upcoming.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming events"
            description={isFacilitator ? 'Host your first Equity Event to bring the table together.' : 'No events scheduled yet.'}
            action={isFacilitator ? { label: 'Create an event', href: `/app/tables/${tableId}/events/new` } : undefined}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map(event => (
              <EventCard
                key={event.id}
                event={event}
                tableId={tableId}
                rsvpStatus={rsvpMap[event.id]}
                showAdmin={isFacilitator}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past events */}
      {past && past.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Past events</h2>
          <div className="space-y-3">
            {past.map(event => (
              <EventCard
                key={event.id}
                event={event}
                tableId={tableId}
                rsvpStatus={rsvpMap[event.id]}
                showAdmin={isFacilitator}
                isPast
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function EventCard({
  event,
  tableId,
  rsvpStatus,
  showAdmin,
  isPast = false,
}: {
  event: { id: string; title: string; starts_at: string; ends_at: string; location_type: string; status: string; description: string | null; event_type: string }
  tableId: string
  rsvpStatus?: string
  showAdmin: boolean
  isPast?: boolean
}) {
  return (
    <Link
      href={`/app/tables/${tableId}/events/${event.id}`}
      className={cn('et-card flex items-start gap-4 p-4 hover:shadow-et-card-hover transition-shadow', isPast && 'opacity-75')}
    >
      {/* Date block */}
      <div className="w-12 h-12 rounded-xl bg-navy-500 flex flex-col items-center justify-center text-white shrink-0">
        <span className="text-[10px] font-bold uppercase">
          {formatDate(event.starts_at, 'MMM')}
        </span>
        <span className="text-lg font-display font-bold leading-none">
          {formatDate(event.starts_at, 'd')}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-navy-500 leading-snug">{event.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {rsvpStatus === 'going' && (
              <span className="badge-pill bg-green-100 text-green-700 text-[10px]">✓ Going</span>
            )}
            {showAdmin && event.status === 'draft' && (
              <span className="badge-pill bg-amber-100 text-amber-700 text-[10px]">Draft</span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(event.starts_at, 'EEE, MMMM d · h:mm a')} · {LOCATION_ICONS[event.location_type]} {event.location_type.replace('_', ' ')}
        </p>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
        )}
      </div>
    </Link>
  )
}
