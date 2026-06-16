'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createEventSchema, type CreateEventInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'

export default function CreateEventPage() {
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
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      event_type: 'class',
      visibility: 'table_only',
      location_type: 'online',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })

  const locationType = watch('location_type')

  const onSubmit = async (data: CreateEventInput) => {
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

      const { data: event, error: insertError } = await supabase
        .from('equity_events')
        .insert({
          table_id: tableId,
          created_by: user.id,
          ...data,
          slug,
          meeting_url: data.meeting_url || null,
          address: data.address || null,
          capacity: data.capacity || null,
          status: 'published',
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      router.push(`/app/tables/${tableId}/events/${event.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to create event')
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
          ← Back to events
        </button>
        <h1 className="text-3xl font-display font-bold text-navy-500">Create Equity Event</h1>
        <p className="text-muted-foreground mt-1">Host a class, workshop, meetup, or discussion.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="et-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-navy-500">Event details</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Event title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Budgeting Basics — Family Session"
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
              placeholder="What will members learn or do at this event?"
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Event type</label>
              <select
                {...register('event_type')}
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
              >
                <option value="class">Class</option>
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="webinar">Webinar</option>
                <option value="cohort">Cohort session</option>
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
                <option value="invite_only">Invite only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="et-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-navy-500">Date & time</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Start <span className="text-red-500">*</span>
              </label>
              <input
                {...register('starts_at')}
                type="datetime-local"
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                  errors.starts_at ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.starts_at && <p className="mt-1 text-xs text-red-600">{errors.starts_at.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                End <span className="text-red-500">*</span>
              </label>
              <input
                {...register('ends_at')}
                type="datetime-local"
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                  errors.ends_at ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.ends_at && <p className="mt-1 text-xs text-red-600">{errors.ends_at.message}</p>}
            </div>
          </div>
          <input type="hidden" {...register('timezone')} />
        </div>

        <div className="et-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-navy-500">Location</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Format</label>
            <div className="flex gap-3">
              {[
                { value: 'online', label: '💻 Online' },
                { value: 'in_person', label: '📍 In person' },
                { value: 'hybrid', label: '🔀 Hybrid' },
              ].map(opt => (
                <label key={opt.value} className="flex-1">
                  <input type="radio" {...register('location_type')} value={opt.value} className="peer sr-only" />
                  <div className="peer-checked:border-blue-600 peer-checked:bg-blue-50 rounded-lg border-2 border-border px-3 py-2 text-sm font-medium cursor-pointer text-center transition-colors hover:border-navy-300">
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(locationType === 'online' || locationType === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Meeting link</label>
              <input
                {...register('meeting_url')}
                type="url"
                placeholder="https://zoom.us/j/..."
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
              {errors.meeting_url && <p className="mt-1 text-xs text-red-600">{errors.meeting_url.message}</p>}
            </div>
          )}

          {(locationType === 'in_person' || locationType === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
              <input
                {...register('address')}
                placeholder="300 Frank H. Ogawa Plaza, Oakland, CA"
                className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Capacity <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              {...register('capacity', { valueAsNumber: true })}
              type="number"
              min={1}
              placeholder="Leave blank for unlimited"
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
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
          {submitting ? 'Creating event…' : 'Create event'}
        </button>
      </form>
    </div>
  )
}
