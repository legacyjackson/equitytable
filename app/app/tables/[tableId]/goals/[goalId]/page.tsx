import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { GoalUpdateClient } from '@/components/goals/GoalUpdateClient'

interface GoalPageProps {
  params: Promise<{ tableId: string; goalId: string }>
}

export async function generateMetadata({ params }: GoalPageProps) {
  const { goalId } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('goals').select('title').eq('id', goalId).maybeSingle()
  return { title: data?.title ?? 'Goal' }
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { tableId, goalId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: goal }, { data: membership }, { data: updates }] = await Promise.all([
    supabase
      .from('goals')
      .select('*, created_by_profile:profiles!created_by(full_name)')
      .eq('id', goalId)
      .maybeSingle(),
    supabase
      .from('table_memberships')
      .select('role')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('goal_updates')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!goal) notFound()

  const isMember = !!membership
  const isAdmin = ['owner', 'admin'].includes(membership?.role ?? '')
  const isCurrency = !!goal.currency
  const pct = goal.target_value > 0
    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
    : 0

  const formatValue = (v: number) =>
    isCurrency ? formatCurrency(v) : formatNumber(v)

  const isCompleted = goal.status === 'completed'

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="mb-6">
        <Link href={`/app/tables/${tableId}/goals`} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">
          ← Back to goals
        </Link>
      </div>

      {/* Header */}
      <div className="et-card p-7 mb-5">
        <div className="flex items-start gap-3 mb-4 flex-wrap">
          <span className={cn(
            'badge-pill',
            isCompleted ? 'bg-green-100 text-green-700' :
            goal.status === 'paused' ? 'bg-amber-100 text-amber-700' :
            'bg-blue-100 text-blue-700'
          )}>
            {isCompleted ? '✅ Completed' : goal.status === 'paused' ? '⏸ Paused' : '🎯 Active'}
          </span>
          {goal.featured && <span className="badge-pill bg-gold-100 text-gold-700">⭐ Featured</span>}
          {goal.visibility === 'public' && <span className="badge-pill bg-gray-100 text-gray-600">🌐 Public</span>}
        </div>

        <h1 className="font-display text-3xl font-bold text-navy-500 leading-tight mb-2">{goal.title}</h1>
        {goal.description && (
          <p className="text-muted-foreground leading-relaxed mb-5">{goal.description}</p>
        )}

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-display text-4xl font-bold text-navy-500">{formatValue(goal.current_value)}</span>
              <span className="text-muted-foreground text-sm ml-2">of {formatValue(goal.target_value)}</span>
            </div>
            <span className={cn(
              'font-display text-2xl font-bold',
              pct >= 100 ? 'text-green-600' : 'text-blue-600'
            )}>
              {Math.round(pct)}%
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                pct >= 100 ? 'bg-green-500' : 'bg-blue-600'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {goal.start_date ? `Started ${formatDate(goal.start_date)}` : `Started ${formatRelativeTime(goal.created_at)}`}
            </span>
            {goal.target_date && <span>Target: {formatDate(goal.target_date)}</span>}
          </div>
        </div>
      </div>

      {/* Update form (client) */}
      {isMember && goal.status === 'active' && (
        <GoalUpdateClient
          goalId={goalId}
          tableId={tableId}
          currentUserId={user.id}
          isCurrency={isCurrency}
          isAdmin={isAdmin}
        />
      )}

      {/* Progress updates */}
      <div className="et-card p-6 mt-5">
        <h2 className="font-display font-semibold text-navy-500 mb-4">Progress updates</h2>
        {!updates || updates.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm text-muted-foreground">
              No updates yet. Post the first one!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((u: any) => (
              <div key={u.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-sm font-bold text-navy-500 shrink-0">
                  {(u.profiles?.full_name ?? '?').charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold text-navy-500">{u.profiles?.full_name ?? 'Member'}</span>
                    {u.update_value != null && (
                      <span className="badge-pill bg-green-100 text-green-700 text-[10px]">
                        +{formatValue(u.update_value)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(u.created_at)}</span>
                  </div>
                  {u.update_text && (
                    <p className="text-sm text-foreground leading-relaxed">{u.update_text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
