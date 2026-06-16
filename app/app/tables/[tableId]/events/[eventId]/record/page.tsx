import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecordingStudio } from '@/components/recording/RecordingStudio'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ tableId: string; eventId: string }>
}

export const metadata = { title: 'Recording Studio' }

export default async function RecordingStudioPage({ params }: PageProps) {
  const { tableId, eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

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
      .select('id, title, status, table_id')
      .eq('id', eventId)
      .eq('table_id', tableId)
      .maybeSingle(),
  ])

  if (!event) notFound()

  const canRecord = ['owner', 'admin', 'facilitator'].includes(membership?.role ?? '')
  if (!canRecord) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">Permission required</h1>
        <p className="text-muted-foreground">Only table facilitators, admins, and owners can record events.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <Link
          href={`/app/tables/${tableId}/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back to event
        </Link>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Recording Studio</h1>
        <p className="text-muted-foreground mt-1">{event.title}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Recording consent required.</strong> Before you start, confirm that all participants know this session may be recorded.
      </div>

      <RecordingStudio
        tableId={tableId}
        eventId={eventId}
        eventTitle={event.title}
        onUploadComplete={(id) => {
          // Client-side redirect after upload — handled in component
        }}
      />
    </div>
  )
}
