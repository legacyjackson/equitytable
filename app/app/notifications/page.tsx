import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

export const metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unread = notifications?.filter(n => !n.read_at) ?? []
  const read = notifications?.filter(n => n.read_at) ?? []

  // Mark all unread as read
  if (unread.length > 0) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
  }

  const NotificationItem = ({ n }: { n: any }) => (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-xl transition-colors',
        !n.read_at ? 'bg-blue-50 border border-blue-100' : 'hover:bg-muted/50'
      )}
    >
      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-base shrink-0">
        {n.icon ?? '🔔'}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold', !n.read_at ? 'text-navy-500' : 'text-foreground')}>
          {n.title}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
        <p className="text-[11px] text-muted-foreground mt-1.5">{formatRelativeTime(n.created_at)}</p>
      </div>
      {n.link_url && (
        <Link
          href={n.link_url}
          className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          View →
        </Link>
      )}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          {notifications?.length ?? 0} total · {unread.length} unread
        </p>
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="et-card p-16 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <p className="font-display font-semibold text-navy-500 mb-1">All caught up</p>
          <p className="text-sm text-muted-foreground">Notifications about your tables, events, and goals will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {unread.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">New</p>
              <div className="space-y-2">
                {unread.map(n => <NotificationItem key={n.id} n={n} />)}
              </div>
            </div>
          )}
          {read.length > 0 && (
            <div className={unread.length > 0 ? 'mt-6' : ''}>
              {unread.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Earlier</p>
              )}
              <div className="space-y-1">
                {read.map(n => <NotificationItem key={n.id} n={n} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
