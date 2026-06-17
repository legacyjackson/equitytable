import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils/format'
import { Leaderboard } from '@/components/gamification/Leaderboard'
import { firstOf } from '@/lib/utils/firstOf'

interface TableDashboardPageProps {
  params: Promise<{ tableId: string }>
}

export async function generateMetadata({ params }: TableDashboardPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('equity_tables').select('name').eq('id', tableId).maybeSingle()
  return { title: data?.name || 'Table Dashboard' }
}

export default async function TableDashboardPage({ params }: TableDashboardPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/sign-in')

  // Load everything needed for the dashboard in parallel
  const [
    { data: table },
    { data: membership },
    { data: upcomingEvents },
    { data: activeGoals },
    { data: recentPosts },
    { data: seatUsage },
  ] = await Promise.all([
    supabase
      .from('equity_tables')
      .select('*, table_type:equity_table_types(*)')
      .eq('id', tableId)
      .maybeSingle(),

    supabase
      .from('table_memberships')
      .select('role, status')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .maybeSingle(),

    supabase
      .from('equity_events')
      .select('id, title, starts_at, ends_at, location_type, visibility, event_type')
      .eq('table_id', tableId)
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(3),

    supabase
      .from('goals')
      .select('id, title, current_value, target_value, goal_type, status, featured')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .in('visibility', ['public', 'table_only'])
      .order('featured', { ascending: false })
      .limit(3),

    supabase
      .from('posts')
      .select('id, title, body, post_type, created_at, profiles(full_name, avatar_url)')
      .eq('table_id', tableId)
      .in('visibility', ['public', 'table_only'])
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('table_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('table_id', tableId)
      .eq('status', 'active'),
  ])

  // Fetch leaderboard data separately (needs aggregation)
  const { data: leaderboardRaw } = await supabase
    .from('points_ledger')
    .select('user_id, points')
    .eq('table_id', tableId)

  // Aggregate points per user
  const pointsByUser: Record<string, number> = {}
  for (const row of leaderboardRaw || []) {
    pointsByUser[row.user_id] = (pointsByUser[row.user_id] || 0) + row.points
  }
  const topUserIds = Object.entries(pointsByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id)

  const leaderboardEntries = topUserIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', topUserIds)
        .then(({ data }) => (data || []).map(p => ({
          user_id: p.id,
          full_name: p.full_name,
          username: p.username,
          avatar_url: p.avatar_url,
          total_points: pointsByUser[p.id] || 0,
          badges_count: 0,
          lessons_completed: 0,
        })).sort((a, b) => b.total_points - a.total_points))
    : []

  if (!table) notFound()

  // Access control
  const isPublic = table.visibility === 'public'
  const isMember = membership?.status === 'active'

  if (!isPublic && !isMember) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">
          This table is private
        </h1>
        <p className="text-muted-foreground">
          You need an invitation to access this Equity Table.
        </p>
      </div>
    )
  }

  const isAdmin = ['owner', 'admin'].includes(membership?.role || '')
  const isFacilitator = ['owner', 'admin', 'facilitator'].includes(membership?.role || '')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-navy-100 flex items-center justify-center text-2xl font-bold text-navy-500 shrink-0 border border-border">
          {table.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="font-display text-3xl font-bold text-navy-500 tracking-tight">
              {table.name}
            </h1>
            {table.status !== 'active' && (
              <span className="badge-pill bg-amber-100 text-amber-700">
                {table.status}
              </span>
            )}
          </div>
          {table.mission && (
            <p className="text-muted-foreground leading-relaxed max-w-2xl">{table.mission}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{table.member_count} member{table.member_count !== 1 ? 's' : ''}</span>
            {table.pathway_participant_count > 0 && (
              <span className="text-green-600 font-medium">
                {table.pathway_participant_count} on Global Pathway
              </span>
            )}
            <span className="capitalize">{(table as { table_type: { name: string } | null }).table_type?.name}</span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/app/tables/${tableId}/members`}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Invite members
            </Link>
            <Link
              href={`/app/tables/${tableId}/settings`}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Settings
            </Link>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: table.member_count, icon: '👥', href: isAdmin ? `/app/tables/${tableId}/members` : undefined },
          { label: 'Pathway participants', value: table.pathway_participant_count, icon: '🚀', href: isAdmin ? `/app/tables/${tableId}/affiliate` : undefined },
          { label: 'Active goals', value: activeGoals?.length || 0, icon: '🎯', href: `/app/tables/${tableId}/goals` },
          { label: 'Upcoming events', value: upcomingEvents?.length || 0, icon: '📅', href: `/app/tables/${tableId}/events` },
        ].map((stat) => (
          <div key={stat.label}>
            {stat.href ? (
              <Link href={stat.href} className="et-card p-5 block hover:shadow-et-card-hover transition-shadow">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-display text-3xl font-bold text-navy-500">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </Link>
            ) : (
              <div className="et-card p-5">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="font-display text-3xl font-bold text-navy-500">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: Events + Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming events */}
          <div className="et-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-navy-500">Upcoming events</h2>
              <div className="flex items-center gap-3">
                {isFacilitator && (
                  <Link
                    href={`/app/tables/${tableId}/events/new`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Create event
                  </Link>
                )}
                <Link
                  href={`/app/tables/${tableId}/events`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  View all
                </Link>
              </div>
            </div>

            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-sm text-muted-foreground">Bring the table together.</p>
                {isFacilitator && (
                  <Link
                    href={`/app/tables/${tableId}/events/new`}
                    className="inline-flex mt-3 text-sm font-medium text-blue-600 hover:underline"
                  >
                    Host your first Equity Event
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/app/tables/${tableId}/events/${event.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 text-sm font-bold">
                      {new Date(event.starts_at).getDate()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-500 truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.starts_at, 'EEE, MMM d · h:mm a')}</p>
                      <span className="text-xs capitalize text-muted-foreground">{event.location_type}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active goals */}
          <div className="et-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-navy-500">Active goals</h2>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link href={`/app/tables/${tableId}/goals/new`} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    + Create goal
                  </Link>
                )}
                <Link href={`/app/tables/${tableId}/goals`} className="text-xs text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              </div>
            </div>

            {!activeGoals || activeGoals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-sm text-muted-foreground">Your table has seats. Now give them a destination.</p>
                {isAdmin && (
                  <Link href={`/app/tables/${tableId}/goals/new`} className="inline-flex mt-3 text-sm font-medium text-blue-600 hover:underline">
                    Create your first shared goal
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const pct = goal.target_value > 0
                    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                    : 0

                  return (
                    <Link
                      key={goal.id}
                      href={`/app/tables/${tableId}/goals/${goal.id}`}
                      className="block hover:bg-muted p-3 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-navy-500">{goal.title}</p>
                        {goal.featured && (
                          <span className="badge-pill bg-gold-100 text-gold-600 shrink-0">⭐ Featured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Message board + Courses */}
        <div className="space-y-6">
          {/* Quick access */}
          <div className="et-card p-5">
            <h2 className="font-display font-semibold text-navy-500 mb-3">Quick access</h2>
            <nav className="space-y-1">
              {[
                { href: `/app/tables/${tableId}/courses`, icon: '📚', label: 'Course library' },
                { href: `/app/tables/${tableId}/recordings`, icon: '📹', label: 'Recordings' },
                { href: `/app/tables/${tableId}/message-board`, icon: '💬', label: 'Message board' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="font-medium text-navy-500">{item.label}</span>
                  <span className="ml-auto text-muted-foreground">→</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Recent posts */}
          <div className="et-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-navy-500">Board</h2>
              <Link href={`/app/tables/${tableId}/message-board`} className="text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>

            {!recentPosts || recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No posts yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => {
                  const author = firstOf(post.profiles) as { full_name: string | null; avatar_url: string | null } | null
                  return (
                    <Link
                      key={post.id}
                      href={`/app/tables/${tableId}/message-board`}
                      className="block hover:bg-muted p-2.5 rounded-lg transition-colors"
                    >
                      <p className="text-sm text-navy-500 font-medium truncate">
                        {post.title || post.body.substring(0, 60) + '...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {author?.full_name} · {formatRelativeTime(post.created_at)}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          {(table as { leaderboard_enabled?: boolean }).leaderboard_enabled !== false && leaderboardEntries.length > 0 && (
            <Leaderboard
              entries={leaderboardEntries}
              currentUserId={user.id}
              enabled={true}
            />
          )}

          {/* Global Pathways CTA */}
          <div className="rounded-xl border border-gold-400/30 bg-gradient-to-br from-navy-500/5 to-blue-700/5 p-5">
            <div className="text-sm font-semibold text-navy-500 mb-2">
              Ready to take the next step?
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Global Pathways turns what you've learned into a personalized 6-month financial action plan.
            </p>
            <a
              href={process.env.DEFAULT_GLOBAL_PATHWAYS_URL || 'https://legacyplan.app/'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Start your Global Pathway →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
