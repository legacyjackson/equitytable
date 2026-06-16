import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, constructWebhookEvent } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import { generateAffiliateCode, buildAffiliateUrl } from '@/lib/utils/affiliate'
import { slugify } from '@/lib/utils/slugify'
import type Stripe from 'stripe'

// POST /api/stripe/webhooks
// Handles all Stripe events. Uses service role client to bypass RLS.
// MUST verify webhook signature before processing.
export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = constructWebhookEvent(body, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        // Unhandled event type — log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error handling Stripe event ${event.type}:`, error)
    // Return 200 to Stripe so it doesn't retry — we log the error separately
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// ── Create Equity Table after successful checkout ─────────────
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const metadata = session.metadata || {}
  const userId = metadata.user_id
  const tableName = metadata.table_name
  const tableTypeId = metadata.table_type_id

  if (!userId || !tableName || !tableTypeId) {
    console.error('Missing metadata in checkout session:', metadata)
    return
  }

  // Prevent duplicate table creation
  const subscriptionId = session.subscription as string
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (existing) {
    console.log('Subscription already processed:', subscriptionId)
    return
  }

  // Generate unique slug
  let slug = slugify(tableName)
  let attempt = 0
  while (attempt < 10) {
    const { data: slugExists } = await supabase
      .from('equity_tables')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!slugExists) break
    slug = `${slugify(tableName)}-${Math.floor(Math.random() * 9000) + 1000}`
    attempt++
  }

  // Generate affiliate code
  const affiliateCode = generateAffiliateCode(tableName)
  const affiliateUrl = buildAffiliateUrl(affiliateCode)

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Create the Equity Table
  const { data: table, error: tableError } = await supabase
    .from('equity_tables')
    .insert({
      owner_id: userId,
      table_type_id: tableTypeId,
      name: tableName,
      slug,
      mission: metadata.table_mission || '',
      description: metadata.table_description || '',
      visibility: (metadata.table_visibility as 'public' | 'private' | 'invite_only') || 'public',
      affiliate_code: affiliateCode,
      affiliate_default_url: affiliateUrl,
      status: 'active',
    })
    .select()
    .single()

  if (tableError || !table) {
    console.error('Failed to create equity table:', tableError)
    throw new Error('Failed to create equity table')
  }

  // Add owner membership
  await supabase.from('table_memberships').insert({
    table_id: table.id,
    user_id: userId,
    role: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  // Create subscription record
  await supabase.from('subscriptions').insert({
    table_id: table.id,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscriptionId,
    base_price_id: subscription.items.data[0]?.price.id,
    status: subscription.status as 'active',
    included_seats: 10,
    extra_seats: 0,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
  })

  // Create affiliate link
  await supabase.from('affiliate_links').insert({
    table_id: table.id,
    code: affiliateCode,
    destination_url: affiliateUrl,
    active: true,
  })

  // Award "Seat at the Table" badge
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('slug', 'seat-at-the-table')
    .maybeSingle()

  if (badge) {
    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badge.id,
      table_id: table.id,
    }).onConflict('user_id, badge_id, table_id').ignore()
  }

  // Award points
  await supabase.from('points_ledger').insert({
    user_id: userId,
    table_id: table.id,
    points: 100,
    reason: 'Created Equity Table',
    source_type: 'table_create',
    source_id: table.id,
  })

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_user_id: userId,
    action: 'equity_table.created',
    target_type: 'equity_table',
    target_id: table.id,
    metadata: {
      name: tableName,
      slug,
      table_type_id: tableTypeId,
      stripe_session_id: session.id,
    },
  })

  // Notification to owner
  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Your Equity Table is ready! 🪑',
    body: `${tableName} is set up and ready to go. Invite your first members and explore the course library.`,
    link_url: `/app/tables/${table.id}`,
    icon: '🪑',
  })
}

// ── Update subscription state ─────────────────────────────────
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('Failed to update subscription:', error)
  }

  // Sync table status
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trial',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'past_due',
    unpaid: 'past_due',
    paused: 'suspended',
  }

  const tableStatus = statusMap[subscription.status] || 'active'

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('table_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (sub?.table_id) {
    await supabase
      .from('equity_tables')
      .update({ status: tableStatus as 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended' })
      .eq('id', sub.table_id)
  }
}

// ── Handle subscription cancellation ─────────────────────────
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('table_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (sub?.table_id) {
    await supabase.from('subscriptions').update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    }).eq('stripe_subscription_id', subscription.id)

    await supabase.from('equity_tables').update({
      status: 'canceled',
    }).eq('id', sub.table_id)
  }
}

// ── Handle payment failure ────────────────────────────────────
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  if (!invoice.subscription) return

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('table_id, table:equity_tables(owner_id)')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .maybeSingle()

  if (!sub?.table_id) return

  // Notify the owner
  const ownerId = (sub.table as { owner_id: string } | null)?.owner_id
  if (ownerId) {
    await supabase.from('notifications').insert({
      user_id: ownerId,
      title: 'Payment failed',
      body: 'Your Equity Table subscription payment failed. Update your payment method to keep your table active.',
      link_url: `/app/tables/${sub.table_id}/billing`,
      icon: '⚠️',
    })
  }
}

// ── Handle goal contribution payment ─────────────────────────
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: Awaited<ReturnType<typeof createServiceClient>>
) {
  const meta = paymentIntent.metadata || {}
  if (meta.type !== 'goal_contribution') return

  const { goal_id, table_id, user_id, note } = meta
  if (!goal_id || !user_id) return

  const amountDollars = paymentIntent.amount_received / 100

  // Record confirmed contribution
  const { data: contrib } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id,
      user_id,
      amount: amountDollars,
      contribution_type: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      note: note || null,
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (!contrib) return

  // Update goal current_value
  await supabase.from('goal_updates').insert({
    goal_id,
    user_id,
    update_value: amountDollars,
    update_text: note || `Stripe contribution of $${amountDollars.toFixed(2)}`,
  })

  // Award badge + points
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('slug', 'community-investor')
    .maybeSingle()

  if (badge) {
    await supabase.from('user_badges').insert({
      user_id,
      badge_id: badge.id,
      table_id: table_id || null,
    }).onConflict('user_id, badge_id, table_id').ignore()
  }

  await supabase.from('points_ledger').insert({
    user_id,
    table_id: table_id || null,
    points: 50,
    reason: 'Contributed to a goal via Stripe',
    source_type: 'goal_contribution',
    source_id: contrib.id,
  })
}
