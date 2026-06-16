import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils/format'

interface GoalCardProps {
  goal: {
    id: string
    title: string
    description?: string | null
    goal_type: string
    current_value: number
    target_value: number
    currency?: string | null
    target_date?: string | null
    status: string
    featured: boolean
    visibility: string
    accept_contributions: boolean
  }
  tableId: string
  compact?: boolean
  className?: string
}

export function GoalCard({ goal, tableId, compact = false, className }: GoalCardProps) {
  const pct = goal.target_value > 0
    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
    : 0
  const isCurrency = !!goal.currency
  const isCompleted = goal.status === 'completed'
  const isPaused = goal.status === 'paused'

  const formatValue = (v: number) =>
    isCurrency ? formatCurrency(v, goal.currency || 'USD') : formatNumber(v)

  const statusColor = isCompleted
    ? 'text-green-600'
    : isPaused
    ? 'text-amber-600'
    : 'text-blue-600'

  const barColor = isCompleted
    ? 'bg-green-500'
    : pct >= 75
    ? 'bg-blue-600'
    : 'bg-blue-500'

  return (
    <Link
      href={`/app/tables/${tableId}/goals/${goal.id}`}
      className={cn(
        'et-card p-5 block hover:shadow-et-card-hover transition-all group',
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            {goal.featured && (
              <span className="text-[10px] font-bold text-gold-500">⭐</span>
            )}
            {goal.visibility === 'public' && (
              <span className="text-[10px] text-muted-foreground">🌐</span>
            )}
          </div>
          <h3 className="font-semibold text-navy-500 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
            {goal.title}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className={cn('text-sm font-bold font-display', statusColor)}>
            {Math.round(pct)}%
          </div>
          {isCompleted && (
            <div className="text-[10px] text-green-600 font-semibold">Done</div>
          )}
        </div>
      </div>

      {/* Description — only in non-compact */}
      {!compact && goal.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {goal.description}
        </p>
      )}

      {/* Progress */}
      <div className="space-y-1.5 mt-3">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-navy-500">
            {formatValue(goal.current_value)}
          </span>
          <span>of {formatValue(goal.target_value)}</span>
        </div>
      </div>

      {/* Footer */}
      {!compact && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground capitalize">{goal.goal_type.replace(/_/g, ' ')}</span>
          <div className="flex items-center gap-2">
            {goal.accept_contributions && (
              <span className="badge-pill bg-blue-50 text-blue-700 text-[10px]">Contributions open</span>
            )}
            {goal.target_date && (
              <span className="text-[11px] text-muted-foreground">
                by {formatDate(goal.target_date, 'MMM d')}
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  )
}
