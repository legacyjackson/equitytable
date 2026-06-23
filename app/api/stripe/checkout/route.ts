import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe/client'
import { getOwnerSubscriptionStatus, FREE_TABLES_PER_SUBSCRIPTION } from '@/lib/utils/ownerSubscription'

// POST /api/stripe/checkout
// Pricing & Access Logic:
//
// A subscription is tied to a table (one $49.99/mo base subscription per
// table), but a subscriber may own up to FREE_TABLES_PER_SUBSCRIPTION (3)
// tables total without paying an additional base fee for tables #2 and #3
// — only extra seats beyond the included 10 are billed separately.
//
// - User owns 0 tables and has no active subscription yet → must pay
//   the base price to create their first table (this is what makes them
//   a subscriber).
// - User owns 1-2 tables and has an active subscription → tables #2/#3
//   are free (comped). Extra seats are still billed if requested.
// - User owns 3+ tables → every additional table is charged full price,
//   same as a brand-new subscription.
// - A user who is only a MEMBER (not owner) of 3+ tables is blocked from
//   creating a new table, unless they already own at least one table.

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tableSetup, additionalSeats = 0 } = body

    if (!tableSetup?.name || !tableSetup?.table_type_id) {
      return NextResponse.json({ error: 'Missing required table setup data' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { tablesOwnedCount, memberOfCount, activeSubscription } =
      await getOwnerSubscriptionStatus(serviceClient, user.id)

    // Members of 3+ tables can't spin up a new one unless they already own a table
    if (tablesOwnedCount === 0 && memberOfCount >= 3) {
      return NextResponse.json(
        { error: 'You are a member of 3 tables. Please leave a table before creating a new one.' },
        { status: 403 }
      )
    }

    const hasFreeTableRemaining =
      !!activeSubscription && tablesOwnedCount < FREE_TABLES_PER_SUBSCRIPTION

    const sharedMetadata = {
      user_id: user.id,
      table_name: tableSetup.name,
      table_type_id: tableSetup.table_type_id,
      table_mission: tableSetup.mission || '',
      table_description: tableSetup.description || '',
      table_visibility: tableSetup.visibility || 'public',
      additional_seats: String(additionalSeats),
    }

    if (hasFreeTableRemaining) {
      if (additionalSeats > 0) {
        // Base table is comped, but extra seats are still billed.
        // Stripe still creates a real (seats-only) subscription so the
        // extra seats can be tracked/cancelled like any other charge.
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: activeSubscription!.stripe_customer_id ?? undefined,
          customer_email: activeSubscription!.stripe_customer_id ? undefined : user.email,
          line_items: [
            {
              price: PLANS.extraSeat.priceId,
              quantity: additionalSeats,
            },
          ],
          subscription_data: {
            metadata: { ...sharedMetadata, comped_base: 'true' },
          },
          metadata: { ...sharedMetadata, comped_base: 'true' },
          success_url: `${appUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/create-table?cancelled=true`,
        })

        return NextResponse.json({ url: session.url })
      }

      // No extra seats — create the table immediately, no payment needed
      return NextResponse.json({
        skipPayment: true,
        tableSetup,
        userId: user.id,
        additionalSeats: 0,
      })
    }

    // Charged path — either their first-ever table (bootstraps a
    // subscription) or table #4+ (a fresh, separately-billed table)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: activeSubscription?.stripe_customer_id ?? undefined,
      customer_email: activeSubscription?.stripe_customer_id ? undefined : user.email,
      line_items: [
        {
          price: PLANS.base.priceId,
          quantity: 1,
        },
        ...(additionalSeats > 0 ? [{
          price: PLANS.extraSeat.priceId,
          quantity: additionalSeats,
        }] : []),
      ],
      subscription_data: {
        metadata: sharedMetadata,
      },
      success_url: `${appUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/create-table?cancelled=true`,
      metadata: sharedMetadata,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
