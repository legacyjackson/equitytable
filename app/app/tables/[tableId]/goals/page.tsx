import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface GoalsPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Goals' }

export default async function GoalsPage({ params }: GoalsPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: membership } = await supabase
    .from('table_memberships')
    .select('role')
    .eq('table_id', tableId).eq('user_id', user.id).eq('status', 'active').maybeSingle()

  if (!membership) notFound()

  const isAdmin = ['owner', 'admin'].includes(membership.role)

  const { data: goals } = await supabase
    .from('goals')
    .select('*, goal_updates(id, update_value, created_at)')
    .eq('table_id', tableId)
    .in('visibility', isAdmin ? ['public', 'table_only', 'admin_only'] : ['public', 'table_only'])
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })

  const active = goals?.filter(g => g.status === 'active') ?? []
  const completed = goals?.filter(g => g.status === 'completed') ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1">Shared destinations for your table.</p>
        </div>
        {isAdmin && (
          <Link
            href={`/app/tables/${tableId}/goals/new`}
            className="rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors shrink-0"
          >
            + Create goal
          </Link>
        )}
      </div>

      {/* Active */}
      {active.length === 0 && completed.length === 0 ? (
        <div className="et-card p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="font-display text-xl font-semibold text-navy-500 mb-2">
            Your table has seats. Now give them a destination.
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Create your first shared goal and start tracking collective progress.
          </p>
          {isAdmin && (
            <Link
              href={`/app/tables/${tableId}/goals/new`}
              className="inline-flex rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
            >
              Create first goal
            </Link>
          )}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Active goals</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {active.map(goal => <GoalCard key={goal.id} goal={goal} tableId={tableId} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Completed</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {completed.map(goal => <GoalCard key={goal.id} goal={goal} tableId={tableId} completed />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function GoalCard({ goal, tableId, completed: isDone = false }: {
  goal: { id: string; title: string; description: string | null; goal_type: string; current_value: number; target_value: number; currency: string | null; target_date: string | null; featured: boolean; accept_contributions: boolean }
  tableId: string
  completed?: boolean
}) {
  const pct = goal.target_value > 0 ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0
  const currency = goal.currency || null

  const formatValue = (v: number) =>
    currency ? formatCurrency(v, currency) : formatNumber(v)

  return (
    <Link
      href={`/app/tables/${tableId}/goals/${goal.id}`}
      className={cn('et-card p-5 hover:shadow-et-card-hover transition-shadow', isDone && 'opacity-80')}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {goal.featured && <span className="text-gold-400 text-sm">⭐</span>}
          {isDone && <span className="badge-pill bg-green-100 text-green-700 text-[10px]">✓ Completed</span>}
        </div>
        {goal.accept_contributions && (
          <span className="badge-pill bg-blue-100 text-blue-700 text-[10px]">Contributions open</span>
        )}
      </div>

      <h3 className="font-semibold text-navy-500 mb-1 leading-snug">{goal.title}</h3>

      {goal.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{goal.description}</p>
      )}

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <span className="font-display text-lg font-bold text-navy-500">
            {formatValue(goal.current_value)}
          </span>
          <span className="text-xs text-muted-foreground">
            of {formatValue(goal.target_value)}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: isDone ? '#16A34A' : '#2563EB' }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{Math.round(pct)}% complete</span>
          {goal.target_date && <span>By {formatDate(goal.target_date, 'MMM d, yyyy')}</span>}
        </div>
      </div>
    </Link>
  )
}
