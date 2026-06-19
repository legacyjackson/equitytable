import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { GoalCard } from '@/components/goals/GoalCard'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'

interface PageProps { params: Promise<{ tableId: string }> }
export const metadata = { title: 'Goals' }

export default async function GoalsPage({ params }: PageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const [{ data: membership }, { data: table }, { data: goals }] = await Promise.all([
    supabase.from('table_memberships').select('role').eq('table_id', tableId).eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    supabase.from('equity_tables').select('name').eq('id', tableId).maybeSingle(),
    supabase.from('goals')
      .select('id, title, description, goal_type, current_value, target_value, currency, target_date, status, featured, visibility, accept_contributions')
      .eq('table_id', tableId)
      .in('visibility', ['public', 'table_only'])
      .neq('status', 'canceled')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (!table) notFound()
  const isAdmin = ['owner', 'admin'].includes(membership?.role ?? '')

  const active   = (goals || []).filter(g => g.status === 'active')
  const complete = (goals || []).filter(g => g.status === 'completed')
  const paused   = (goals || []).filter(g => g.status === 'paused')

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Goals"
        description={`${active.length} active · ${complete.length} completed`}
        breadcrumbs={[{ label: table.name, href: `/app/tables/${tableId}` }, { label: 'Goals' }]}
        actions={isAdmin ? (
          <Link href={`/app/tables/${tableId}/goals/new`}
            className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
            + New goal
          </Link>
        ) : undefined}
      />

      {(goals || []).length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Your table has seats. Now give them a destination."
          description="Create shared goals to track collective progress — savings targets, event milestones, learning streaks, and more."
          action={isAdmin ? { label: 'Create first goal', href: `/app/tables/${tableId}/goals/new` } : undefined}
          size="lg"
        />
      ) : (
        <>
          {/* Active goals */}
          {active.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-navy-500 mb-4">Active goals</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {active.map(g => <GoalCard key={g.id} goal={g} tableId={tableId} />)}
              </div>
            </div>
          )}

          {/* Paused */}
          {paused.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-navy-500 mb-4 text-base">Paused</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {paused.map(g => <GoalCard key={g.id} goal={g} tableId={tableId} compact />)}
              </div>
            </div>
          )}

          {/* Completed */}
          {complete.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-navy-500 mb-4 text-base">Completed 🎉</h2>
              <div className="grid sm:grid-cols-2 gap-4 opacity-70">
                {complete.map(g => <GoalCard key={g.id} goal={g} tableId={tableId} compact />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
