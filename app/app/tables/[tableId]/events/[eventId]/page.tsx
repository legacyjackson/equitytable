import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatEventDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { GlobalPathwaysCTA } from '@/components/affiliate/GlobalPathwaysCTA'

interface EventPageProps {
  params: Promise<{ tableId: string; eventId: string }>
}

export async function generateMetadata({ params }: EventPageProps) {
  const { eventId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('equity_events').select('title').eq('id', eventId).maybeSingle()
  return { title: data?.title ?? 'Event' }
}

const LOCATION_ICONS: Record<string, string> = { online: '💻', in_person: '📍', hybrid: '🔀' }
const TYPE_LABELS: Record<string, string> = {
  class: 'Class', workshop: 'Workshop', meetup: 'Meetup',
  webinar: 'Webinar', cohort: 'Cohort session', other: 'Event',
}

export default async function EventPage({ params }: EventPageProps) {
  const { tableId, eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: event }, { data: membership }, { data: rsvp }, { count: rawGoingCount }, { data: recordings }] =
    await Promise.all([
      supabase
        .from('equity_events')
        .select(`
          *,
          created_by_profile:profiles!created_by(full_name, avatar_url),
          attached_course:courses(title, slug),
          attached_lesson:lessons(title)
        `)
        .eq('id', eventId)
        .maybeSingle(),
      supabase
        .from('table_memberships')
        .select('role')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('event_rsvps')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('event_rsvps')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'going'),
      supabase
        .from('event_recordings')
        .select('id, title, video_url, duration_seconds, visibility, status, created_at')
        .eq('event_id', eventId)
        .in('visibility', ['public', 'table_only'])
        .eq('status', 'ready'),
    ])

  if (!event) notFound()

  const isMember = !!membership
  const isAdmin = ['owner', 'admin', 'facilitator'].includes(membership?.role ?? '')
  const isPast = new Date(event.ends_at) < new Date()
  const isUpcoming = new Date(event.starts_at) > new Date()
  const goingCountNum = rawGoingCount ?? 0

  const host = (event as any).created_by_profile
  const attachedCourse = (event as any).attached_course

  const handleRsvp = async (status: string) => {
    'use server'
    const supabase = await createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    await supabase.from('event_rsvps').upsert(
      { event_id: eventId, user_id: u.id, status },
      { onConflict: 'event_id,user_id' }
    )
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-6">
        <Link href={`/app/tables/${tableId}/events`} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">
          ← Back to events
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="et-card p-7">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="badge-pill bg-blue-100 text-blue-700">
                {TYPE_LABELS[event.event_type] ?? 'Event'}
              </span>
              <span className="badge-pill bg-gray-100 text-gray-600">
                {LOCATION_ICONS[event.location_type]} {event.location_type.replace('_', ' ')}
              </span>
              {isPast && <span className="badge-pill bg-gray-100 text-gray-500">Past event</span>}
              {!isPast && isUpcoming && <span className="badge-pill bg-green-100 text-green-700">Upcoming</span>}
            </div>

            <h1 className="font-display text-3xl font-bold text-navy-500 mb-3 leading-tight">
              {event.title}
            </h1>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-500">
                  {(host?.full_name ?? '?').charAt(0)}
                </div>
                <span>Hosted by <strong className="text-foreground">{host?.full_name ?? 'Table admin'}</strong></span>
              </div>
              {goingCountNum > 0 && (
                <span>· <strong className="text-foreground">{goingCountNum}</strong> going</span>
              )}
            </div>

            {event.description && (
              <p className="text-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
            )}
          </div>

          {/* Agenda */}
          {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 && (
            <div className="et-card p-6">
              <h2 className="font-display font-semibold text-navy-500 mb-4">Agenda</h2>
              <div className="space-y-3">
                {(event.agenda as any[]).map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-xs font-mono text-muted-foreground w-16 shrink-0 pt-0.5">{item.time}</div>
                    <div>
                      <p className="text-sm font-semibold text-navy-500">{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recordings */}
          {recordings && recordings.length > 0 && (
            <div className="et-card p-6">
              <h2 className="font-display font-semibold text-navy-500 mb-4">Event recordings</h2>
              <div className="space-y-3">
                {recordings.map(r => (
                  <div key={r.id} className="rounded-xl bg-muted/50 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-500 shrink-0">
                      📹
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-500 truncate">{r.title}</p>
                    </div>
                    {r.video_url && (
                      <a
                        href={r.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                      >
                        Watch →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached course */}
          {attachedCourse && (
            <div className="et-card p-5 flex items-center gap-4">
              <div className="text-2xl">📚</div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                  Recommended course
                </p>
                <p className="font-semibold text-navy-500">{attachedCourse.title}</p>
              </div>
              <Link
                href={`/app/tables/${tableId}/courses`}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 shrink-0"
              >
                View →
              </Link>
            </div>
          )}

          {/* Post-event CTA */}
          {isPast && event.cta_after_event && (
            <GlobalPathwaysCTA
              tableId={tableId}
              eventId={eventId}
              text="Ready for the next step? Begin your Global Pathway."
              placement="event_post"
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Date & Location */}
          <div className="et-card p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">When</p>
              <p className="text-sm font-semibold text-navy-500 leading-relaxed">
                {formatEventDate(event.starts_at, event.ends_at, event.timezone)}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Where</p>
              {event.location_type === 'online' || event.location_type === 'hybrid' ? (
                event.meeting_url ? (
                  <a
                    href={event.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                  >
                    Join online meeting →
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Meeting link TBD</p>
                )
              ) : null}
              {(event.location_type === 'in_person' || event.location_type === 'hybrid') && event.address && (
                <p className="text-sm text-foreground">{event.address}</p>
              )}
            </div>

            {event.capacity && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Capacity</p>
                <p className="text-sm text-foreground">
                  {goingCountNum} / {event.capacity} spots filled
                </p>
              </div>
            )}
          </div>

          {/* RSVP */}
          {isMember && !isPast && (
            <div className="et-card p-5">
              <p className="text-sm font-semibold text-navy-500 mb-3">Will you attend?</p>
              <div className="space-y-2">
                {[
                  { value: 'going', label: '✅ Yes, I\'m going', color: 'bg-green-100 text-green-700 border-green-200' },
                  { value: 'maybe', label: '🤔 Maybe', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                  { value: 'not_going', label: '❌ Can\'t make it', color: 'bg-gray-100 text-gray-600 border-gray-200' },
                ].map(opt => (
                  <form key={opt.value} action={handleRsvp.bind(null, opt.value)}>
                    <button
                      type="submit"
                      className={cn(
                        'w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors',
                        rsvp?.status === opt.value
                          ? opt.color
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      {opt.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          {/* Check-in button — available to all members for live/upcoming events */}
          {isMember && !isPast && (
            <Link
              href={`/app/tables/${tableId}/events/${eventId}/checkin`}
              className="block w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white text-center hover:bg-green-700 transition-colors"
            >
              📍 Check in to this event
            </Link>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div className="et-card p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Admin</p>
              <div className="space-y-2">
                <Link
                  href={`/app/tables/${tableId}/events/${eventId}/checkin`}
                  className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-center hover:bg-muted transition-colors"
                >
                  📋 Manage check-ins
                </Link>
                <Link
                  href={`/app/tables/${tableId}/events/${eventId}/record`}
                  className="block w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-center hover:bg-muted transition-colors"
                >
                  📹 Record this event
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
