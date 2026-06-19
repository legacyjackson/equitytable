import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { QRCheckin } from '@/components/events/QRCheckin'
import { formatDate } from '@/lib/utils/format'

interface PageProps {
  params: Promise<{ tableId: string; eventId: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata = { title: 'Event Check-in' }

export default async function EventCheckinPage({ params, searchParams }: PageProps) {
  const { tableId, eventId } = await params
  const { token } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/sign-in?redirect=/app/tables/${tableId}/events/${eventId}/checkin${token ? `?token=${token}` : ''}`)

  const [{ data: membership }, { data: event }] = await Promise.all([
    supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('equity_events')
      .select('id, title, starts_at, ends_at, status, table_id')
      .eq('id', eventId)
      .eq('table_id', tableId)
      .maybeSingle(),
  ])

  if (!event) notFound()

  const isHost = ['owner', 'admin', 'facilitator'].includes(membership?.role || '')
  const isMember = !!membership

  // If not a member, they can only self-check-in if they have a token
  if (!isMember && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="font-display text-xl font-bold text-navy-500 mb-2">Sign in required</h1>
          <p className="text-muted-foreground text-sm mb-4">
            You need to sign in to check in to this event.
          </p>
          <Link
            href={`/sign-in?redirect=/app/tables/${tableId}/events/${eventId}/checkin`}
            className="block rounded-xl bg-navy-500 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </div>
    )
  }

  // Check existing RSVP
  const { data: existingRsvp } = await supabase
    .from('event_rsvps')
    .select('status, checked_in, checked_in_at')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <Link
          href={`/app/tables/${tableId}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 mb-3"
        >
          ← Back to event
        </Link>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">
          Event check-in
        </h1>
        <p className="text-muted-foreground mt-1">
          {event.title} · {formatDate(event.starts_at, 'EEEE, MMMM d · h:mm a')}
        </p>
      </div>

      {/* Already checked in */}
      {existingRsvp?.checked_in && (
        <div className="et-card p-6 text-center border-green-200 bg-green-50">
          <div className="text-3xl mb-2">✅</div>
          <h2 className="font-display text-xl font-semibold text-green-800 mb-1">
            You're checked in!
          </h2>
          <p className="text-sm text-green-700">
            Checked in at {formatDate(existingRsvp.checked_in_at!, 'h:mm a')}.
            Welcome to {event.title}.
          </p>
        </div>
      )}

      {/* Self check-in (attendee) — if token present or they clicked the button themselves */}
      {!existingRsvp?.checked_in && !isHost && (
        <QRCheckin
          eventId={eventId}
          tableId={tableId}
          eventTitle={event.title}
          mode="attendee"
        />
      )}

      {/* Host check-in dashboard */}
      {isHost && (
        <div className="space-y-5">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            You're a host. You can display the QR code for attendees to scan or check them in manually below.
          </div>
          <QRCheckin
            eventId={eventId}
            tableId={tableId}
            eventTitle={event.title}
            mode="host"
          />
        </div>
      )}

      {/* Also show self check-in for hosts (they attend too) */}
      {isHost && !existingRsvp?.checked_in && (
        <div className="et-card p-5">
          <h3 className="font-semibold text-navy-500 mb-2 text-sm">Check yourself in</h3>
          <QRCheckin
            eventId={eventId}
            tableId={tableId}
            eventTitle={event.title}
            mode="attendee"
          />
        </div>
      )}
    </div>
  )
}
