import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/brand/Logo'
import { GlobalPathwaysCTA } from '@/components/affiliate/GlobalPathwaysCTA'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface PublicTablePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PublicTablePageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('equity_tables')
    .select('name, mission')
    .eq('slug', slug)
    .maybeSingle()
  return {
    title: data?.name ?? 'Equity Table',
    description: data?.mission ?? 'A financial literacy community.',
  }
}

export default async function PublicTablePage({ params }: PublicTablePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: table } = await supabase
    .from('equity_tables')
    .select(`
      *,
      table_type:equity_table_types(name, slug),
      owner:profiles!owner_id(full_name, avatar_url)
    `)
    .eq('slug', slug)
    .eq('visibility', 'public')
    .eq('status', 'active')
    .maybeSingle()

  if (!table) notFound()

  // Load public content in parallel
  const [{ data: events }, { data: goals }, { data: posts }, { data: recordings }] = await Promise.all([
    supabase
      .from('equity_events')
      .select('id, title, starts_at, ends_at, event_type, location_type, visibility')
      .eq('table_id', table.id)
      .eq('visibility', 'public')
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at')
      .limit(3),
    supabase
      .from('goals')
      .select('id, title, current_value, target_value, goal_type, featured, currency')
      .eq('table_id', table.id)
      .eq('visibility', 'public')
      .eq('status', 'active')
      .order('featured', { ascending: false })
      .limit(4),
    supabase
      .from('posts')
      .select('id, title, body, post_type, created_at, profiles:user_id(full_name)')
      .eq('table_id', table.id)
      .eq('visibility', 'public')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('event_recordings')
      .select('id, title, video_url, thumbnail_url, duration_seconds')
      .eq('table_id', table.id)
      .eq('visibility', 'public')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  // Affiliate earnings (only if table publishes them)
  let affiliateStats = null
  if (table.publish_affiliate_earnings) {
    const { data: conversions } = await supabase
      .from('affiliate_conversions')
      .select('payout_amount, payout_status')
      .eq('table_id', table.id)

    if (conversions) {
      const total = conversions.reduce((s, c) => s + (c.payout_amount ?? 0), 0)
      const paid = conversions.filter(c => c.payout_status === 'paid').reduce((s, c) => s + (c.payout_amount ?? 0), 0)
      affiliateStats = {
        referrals: conversions.length,
        estimated: total,
        paid,
        pending: total - paid,
      }
    }
  }

  // Get affiliate link for CTA
  const { data: affiliateLink } = await supabase
    .from('affiliate_links')
    .select('destination_url')
    .eq('table_id', table.id)
    .eq('active', true)
    .maybeSingle()

  const tableType = (table as any).table_type
  const owner = (table as any).owner

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* White background logo — on white nav bar */}
          <Link href="/">
            <Logo variant="light-bg" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/equity-tables" className="text-sm text-muted-foreground hover:text-foreground">
              ← All tables
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero banner */}
      <div className="relative overflow-hidden bg-navy-500">
        {table.banner_url && (
          <img src={table.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-start gap-5">
            {table.logo_url ? (
              <img
                src={table.logo_url}
                alt={table.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-3xl font-bold text-white shrink-0 border border-white/20">
                {table.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {tableType && (
                  <span className="badge-pill bg-white/15 text-white text-[11px]">
                    {tableType.name}
                  </span>
                )}
                <span className="badge-pill bg-green-500/20 text-green-300 text-[11px]">
                  🌐 Public table
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                {table.name}
              </h1>
              {table.mission && (
                <p className="text-blue-100/90 text-base max-w-2xl leading-relaxed">{table.mission}</p>
              )}
              <div className="flex items-center gap-5 mt-3 text-sm text-blue-200/80">
                <span>{table.member_count} members</span>
                {table.pathway_participant_count > 0 && (
                  <span>{table.pathway_participant_count} on Global Pathway</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            {table.description && (
              <div className="et-card p-7">
                <h2 className="font-display font-semibold text-navy-500 mb-3">About this table</h2>
                <p className="text-foreground leading-relaxed whitespace-pre-line">{table.description}</p>
              </div>
            )}

            {/* Upcoming events */}
            {events && events.length > 0 && (
              <div className="et-card p-7">
                <h2 className="font-display font-semibold text-navy-500 mb-4">Upcoming Equity Events</h2>
                <div className="space-y-4">
                  {events.map(event => (
                    <Link key={event.id} href={`/events/${event.id}`} className="block hover:bg-muted p-3 rounded-lg transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                          {new Date(event.starts_at).getDate()}
                        </div>
                        <div>
                          <p className="font-semibold text-navy-500">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(event.starts_at, 'EEE, MMM d · h:mm a')}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Active goals */}
            {goals && goals.length > 0 && (
              <div className="et-card p-7">
                <h2 className="font-display font-semibold text-navy-500 mb-4">Active goals</h2>
                <div className="space-y-4">
                  {goals.map(goal => {
                    const pct = goal.target_value > 0 ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0
                    return (
                      <div key={goal.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-navy-500">{goal.title}</span>
                          {goal.featured && <span className="badge-pill bg-gold-100 text-gold-700 text-[10px]">⭐ Featured</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message board */}
            {posts && posts.length > 0 && table.public_message_board && (
              <div className="et-card p-7">
                <h2 className="font-display font-semibold text-navy-500 mb-4">Message board</h2>
                <div className="space-y-4">
                  {posts.map(post => {
                    const author = (post as any).profiles
                    return (
                      <div key={post.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-navy-500">{author?.full_name ?? 'Member'}</span>
                          <span className="text-xs text-muted-foreground">· {formatDate(post.created_at, 'MMM d')}</span>
                        </div>
                        {post.title && <p className="text-sm font-medium text-foreground mb-0.5">{post.title}</p>}
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recordings */}
            {recordings && recordings.length > 0 && (
              <div className="et-card p-7">
                <h2 className="font-display font-semibold text-navy-500 mb-4">Recordings</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recordings.map(r => (
                    <div key={r.id} className="rounded-xl overflow-hidden border border-border bg-navy-100">
                      <div className="aspect-video bg-navy-100 flex items-center justify-center text-3xl">
                        {r.thumbnail_url ? (
                          <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : '📹'}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-navy-500 line-clamp-2">{r.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Join CTA */}
            <div className="et-card p-6 text-center">
              <h3 className="font-display font-semibold text-navy-500 mb-2">Join this table</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your account to access courses, events, and connect with this community.
              </p>
              <Link
                href="/sign-up"
                className="block w-full rounded-xl bg-navy-500 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                Create an account
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                Already a member?{' '}
                <Link href="/sign-in" className="text-blue-600 hover:underline">Sign in</Link>
              </p>
            </div>

            {/* Stats */}
            <div className="et-card p-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Table stats</p>
              {[
                { label: 'Members', value: table.member_count },
                { label: 'On Global Pathway', value: table.pathway_participant_count },
                { label: 'Active goals', value: goals?.length ?? 0 },
                { label: 'Upcoming events', value: events?.length ?? 0 },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold text-navy-500">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Affiliate earnings */}
            {affiliateStats && (
              <div className="et-card p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pathway referrals</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total referrals</span>
                  <span className="font-semibold text-navy-500">{affiliateStats.referrals}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Est. earnings</span>
                  <span className="font-semibold text-green-600">{formatCurrency(affiliateStats.estimated)}</span>
                </div>
              </div>
            )}

            {/* Global Pathways CTA */}
            <GlobalPathwaysCTA
              tableId={table.id}
              text="Ready to take the next step? Start your Global Pathway."
              placement="table_profile"
              variant="card"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-navy-500 py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* White background logo shown on white surface, but footer is navy — use dark-bg */}
          <Logo variant="dark-bg" size="xs" />
          <p className="text-xs text-blue-200/60 text-center">
            Equity Table provides financial education only.{' '}
            <Link href="/legal/financial-education-disclaimer" className="underline hover:text-white">Disclaimer</Link>
            {' · '}
            <Link href="/legal/affiliate-disclosure" className="underline hover:text-white">Affiliate disclosure</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
