'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createGoalSchema, type CreateGoalInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'

export default function CreateGoalPage() {
  const params = useParams()
  const tableId = params.tableId as string
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      visibility: 'table_only',
      goal_type: 'savings',
    },
  })

  const onSubmit = async (data: CreateGoalInput) => {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const slug = data.title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '').trim()
        .replace(/\s+/g, '-')
        + '-' + Date.now()

      const { data: goal, error: insertError } = await supabase
        .from('shared_goals')
        .insert({
          table_id: tableId,
          created_by: user.id,
          ...data,
          slug,
          status: 'active',
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      router.push(`/app/tables/${tableId}/goals/${goal.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to create goal')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 block"
        >
          ← Back to goals
        </button>
        <h1 className="text-3xl font-display font-bold text-navy-500">Create Shared Goal</h1>
        <p className="text-muted-foreground mt-1">Set a financial goal and invite members to contribute.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="et-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-navy-500">Goal details</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Goal title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Emergency Fund Building"
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                errors.title ? 'border-red-300' : 'border-border'
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Why is this goal important?"
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Goal type</label>
              <select
                {...register('goal_type')}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
              >
                <option value="savings">Savings</option>
                <option value="fundraising">Fundraising</option>
                <option value="milestone">Milestone</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Visibility</label>
              <select
                {...register('visibility')}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
              >
                <option value="table_only">Table members only</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target amount <span className="text-red-500">*</span>
              </label>
              <input
                {...register('target_amount', { valueAsNumber: true })}
                type="number"
                min={0}
                step={0.01}
                placeholder="1000.00"
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                  errors.target_amount ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.target_amount && <p className="mt-1 text-xs text-red-600">{errors.target_amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Target date</label>
              <input
                {...register('target_date')}
                type="date"
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-navy-500 py-3.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-60"
        >
          {submitting ? 'Creating goal…' : 'Create goal'}
        </button>
      </form>
    </div>
  )
}
