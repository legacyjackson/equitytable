'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GoalContributeModal } from '@/components/goals/GoalContributeModal'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface PageProps {
  params: Promise<{ tableId: string; goalId: string }>
}

interface Goal {
  id: string
  title: string
  description: string | null
  current_value: number
  target_value: number
  currency: string | null
  contribution_type: 'manual' | 'pledge' | 'stripe'
  suggested_amounts: number[] | null
  target_date: string | null
  status: string
}

export default function ContributePage({ params }: PageProps) {
  const router = useRouter()
  const [tableId, setTableId] = useState('')
  const [goalId, setGoalId] = useState('')
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [contributed, setContributed] = useState(false)

  useEffect(() => {
    params.then(({ tableId: tid, goalId: gid }) => {
      setTableId(tid)
      setGoalId(gid)

      const supabase = createClient()
      supabase
        .from('goals')
        .select('id, title, description, current_value, target_value, currency, contribution_type, suggested_amounts, target_date, status')
        .eq('id', gid)
        .eq('table_id', tid)
        .maybeSingle()
        .then(({ data }) => {
          setGoal(data)
          setLoading(false)
          // Open modal immediately if goal accepts contributions
          if (data?.accept_contributions) setShowModal(true)
        })
    })
  }, [params])

  const handleSuccess = (amount: number) => {
    setContributed(true)
    setShowModal(false)
    if (goal) setGoal(prev => prev ? { ...prev, current_value: prev.current_value + amount } : null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-navy-200 border-t-navy-500 animate-spin" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">🎯</div>
        <h2 className="font-display text-xl font-bold text-navy-500 mb-2">Goal not found</h2>
        <Link href={`/app/tables/${tableId}/goals`} className="text-blue-600 hover:underline text-sm">
          ← Back to goals
        </Link>
      </div>
    )
  }

  const pct = goal.target_value > 0
    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
    : 0

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <Link
        href={`/app/tables/${tableId}/goals/${goalId}`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
      >
        ← Back to goal
      </Link>

      {/* Goal overview */}
      <div className="et-card p-6">
        <h1 className="font-display text-2xl font-bold text-navy-500 mb-1">{goal.title}</h1>
        {goal.description && (
          <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
        )}

        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-navy-500">{Math.round(pct)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct === 100 ? 'bg-green-500' : 'bg-blue-600'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(goal.current_value, goal.currency || 'USD')} raised</span>
            <span>{formatCurrency(goal.target_value, goal.currency || 'USD')} goal</span>
          </div>
        </div>

        {goal.target_date && (
          <p className="text-xs text-muted-foreground">
            Target date: {formatDate(goal.target_date, 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Success state */}
      {contributed && (
        <div className="et-card p-6 text-center border-green-200 bg-green-50">
          <div className="text-3xl mb-2">🎉</div>
          <h2 className="font-display text-lg font-semibold text-green-800 mb-1">
            Contribution recorded!
          </h2>
          <p className="text-sm text-green-700 mb-4">
            Thank you for contributing to this goal.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100 transition-colors"
            >
              Contribute again
            </button>
            <Link
              href={`/app/tables/${tableId}/goals/${goalId}`}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
            >
              View goal →
            </Link>
          </div>
        </div>
      )}

      {/* CTA if not yet contributed */}
      {!contributed && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full rounded-xl bg-navy-500 py-4 text-sm font-bold text-white hover:bg-navy-600 transition-colors"
        >
          Contribute to this goal
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <GoalContributeModal
          goalId={goalId}
          tableId={tableId}
          goalTitle={goal.title}
          contributionType={goal.contribution_type}
          suggestedAmounts={goal.suggested_amounts || [25, 50, 100, 250]}
          currentValue={goal.current_value}
          targetValue={goal.target_value}
          currency={goal.currency || 'USD'}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
