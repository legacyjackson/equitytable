'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createGoalSchema, type CreateGoalInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'

const GOAL_TYPES = [
  { value: 'members', label: '👥 Reach a member target', metric: 'members' },
  { value: 'pathway_participants', label: '🚀 Global Pathway participants', metric: 'participants' },
  { value: 'collective_wealth', label: '💰 Collective wealth target', metric: 'dollars', currency: true },
  { value: 'courses_completed', label: '📚 Complete a number of courses', metric: 'courses' },
  { value: 'events_hosted', label: '📅 Host a number of events', metric: 'events' },
  { value: 'emergency_savings', label: '🏦 Build emergency savings', metric: 'dollars', currency: true },
  { value: 'reduce_debt', label: '📉 Reduce collective debt', metric: 'dollars', currency: true },
  { value: 'homeownership', label: '🏠 Help members buy a home', metric: 'members' },
  { value: 'fundraising', label: '🎯 Raise funds for a goal', metric: 'dollars', currency: true },
  { value: 'business_launch', label: '💼 Launch a business or product', metric: 'milestones' },
  { value: 'custom', label: '✏️ Custom goal', metric: 'units' },
]

export default function CreateGoalPage() {
  const params = useParams()
  const tableId = params.tableId as string
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      visibility: 'table_only',
      accept_contributions: false,
      contribution_type: 'none',
      featured: false,
    },
  })

  const goalType = watch('goal_type')
  const isCurrency = GOAL_TYPES.find(t => t.value === goalType)?.currency ?? false
  const acceptContributions = watch('accept_contributions')

  const onSubmit = async (data: CreateGoalInput) => {
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: goal, error: insertError } = await supabase
        .from('goals')
        .insert({
          table_id: tableId,
          created_by: user.id,
          ...data,
          currency: isCurrency ? 'USD' : null,
          current_value: 0,
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
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground mb-4 block">
          ← Back to goals
        </button>
        <h1 className="text-3xl font-display font-bold text-navy-500">Create a shared goal</h1>
        <p className="text-muted-foreground mt-1">Give your table a destination to work toward together.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="et-card p-6 space-y-5">
          <h2 className="font-display font-semibold text-navy-500">Goal details</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Goal title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Help 20 members build emergency funds"
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                errors.title ? 'border-red-300' : 'border-border'
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Goal type</label>
            <select
              {...register('goal_type')}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="">Select a goal type…</option>
              {GOAL_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.goal_type && <p className="mt-1 text-xs text-red-600">{errors.goal_type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="What does reaching this goal mean for your table?"
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target {isCurrency ? 'amount ($)' : 'number'} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('target_value', { valueAsNumber: true })}
                type="number"
                min={1}
                step={isCurrency ? '0.01' : '1'}
                placeholder={isCurrency ? '5000.00' : '20'}
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                  errors.target_value ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.target_value && <p className="mt-1 text-xs text-red-600">{errors.target_value.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Target date <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                {...register('target_date')}
                type="date"
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="et-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-navy-500">Settings</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Visibility</label>
            <select
              {...register('visibility')}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="table_only">Table members only</option>
              <option value="public">Public</option>
              <option value="admin_only">Admin only</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Accept contributions</p>
              <p className="text-xs text-muted-foreground mt-0.5">Let members pledge or contribute toward this goal</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" {...register('accept_contributions')} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-blue-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {acceptContributions && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contribution type</label>
              <select
                {...register('contribution_type')}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
              >
                <option value="manual">Manual tracking</option>
                <option value="pledge">Pledges (self-reported)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Feature this goal</p>
              <p className="text-xs text-muted-foreground mt-0.5">Highlight on your table's dashboard and profile</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" {...register('featured')} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-gold-400 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
            </label>
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
