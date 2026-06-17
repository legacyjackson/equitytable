import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import { calculateSeatUsage, BASE_PRICE, EXTRA_SEAT_PRICE } from '@/lib/utils/affiliate'
import { BillingPortalButton } from '@/components/tables/BillingPortalButton'

interface BillingPageProps {
  params: Promise<{ tableId: string }>
}

export const metadata = { title: 'Billing' }

export default async function BillingPage({ params }: BillingPageProps) {
  const { tableId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const [{ data: membership }, { data: table }, { data: subscription }, { count: activeSeatCount }] =
    await Promise.all([
      supabase
        .from('table_memberships')
        .select('role')
        .eq('table_id', tableId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      supabase.from('equity_tables').select('name, status').eq('id', tableId).maybeSingle(),
      supabase.from('subscriptions').select('*').eq('table_id', tableId).maybeSingle(),
      supabase
        .from('table_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('table_id', tableId)
        .eq('status', 'active'),
    ])

  if (!table) notFound()

  const isOwner = membership?.role === 'owner'
  if (!isOwner) redirect(`/app/tables/${tableId}`)

  const seatCount = activeSeatCount ?? 0
  const usage = calculateSeatUsage(seatCount, subscription?.included_seats ?? 10)
  const estimatedMonthly = BASE_PRICE + (usage.extra_seats_needed * EXTRA_SEAT_PRICE)

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active:   { label: 'Active', color: 'bg-green-100 text-green-700' },
    trialing: { label: 'Trial', color: 'bg-blue-100 text-blue-700' },
    past_due: { label: 'Past due', color: 'bg-red-100 text-red-700' },
    canceled: { label: 'Canceled', color: 'bg-gray-100 text-gray-500' },
    paused:   { label: 'Paused', color: 'bg-amber-100 text-amber-700' },
  }

  const statusInfo = STATUS_LABELS[subscription?.status ?? 'active'] ?? STATUS_LABELS.active

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">{table.name}</p>
      </div>

      {/* Current plan */}
      <div className="et-card p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-semibold text-navy-500 mb-1">Current plan</h2>
            <span className={`badge-pill ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-navy-500">
              {formatCurrency(estimatedMonthly)}
            </div>
            <div className="text-xs text-muted-foreground">per month</div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base plan (10 seats)</span>
            <span className="font-medium">{formatCurrency(BASE_PRICE)}/mo</span>
          </div>
          {usage.extra_seats_needed > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {usage.extra_seats_needed} extra seat{usage.extra_seats_needed !== 1 ? 's' : ''}
              </span>
              <span className="font-medium">{formatCurrency(usage.extra_seats_needed * EXTRA_SEAT_PRICE)}/mo</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
            <span className="font-semibold text-foreground">Estimated total</span>
            <span className="font-bold text-navy-500">{formatCurrency(estimatedMonthly)}/mo</span>
          </div>
        </div>

        {subscription?.current_period_end && (
          <p className="text-xs text-muted-foreground mt-4">
            Next billing date: {formatDate(subscription.current_period_end)}
            {subscription.cancel_at_period_end && (
              <span className="ml-2 text-amber-600 font-medium">· Cancels at period end</span>
            )}
          </p>
        )}
      </div>

      {/* Seat usage */}
      <div className="et-card p-6">
        <h2 className="font-display font-semibold text-navy-500 mb-4">Seat usage</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Active members</span>
          <span className="font-bold text-navy-500">
            {seatCount} / {subscription?.included_seats ?? 10} included
          </span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${seatCount > (subscription?.included_seats ?? 10) ? 'bg-amber-500' : 'bg-blue-600'}`}
            style={{ width: `${Math.min(100, (seatCount / (subscription?.included_seats ?? 10)) * 100)}%` }}
          />
        </div>
        {usage.extra_seats_needed > 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            You have {usage.extra_seats_needed} extra seat{usage.extra_seats_needed !== 1 ? 's' : ''} at{' '}
            {formatCurrency(EXTRA_SEAT_PRICE)}/month each.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {(subscription?.included_seats ?? 10) - seatCount} seats remaining. Add more members for{' '}
            {formatCurrency(EXTRA_SEAT_PRICE)}/seat/month.
          </p>
        )}
      </div>

      {/* Stripe portal */}
      <div className="et-card p-6">
        <h2 className="font-display font-semibold text-navy-500 mb-2">Manage billing</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update your payment method, view invoices, or cancel your subscription through Stripe's secure billing portal.
        </p>
        <BillingPortalButton tableId={tableId} />
      </div>
    </div>
  )
}
