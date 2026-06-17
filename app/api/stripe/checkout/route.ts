import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe/client'

// POST /api/stripe/checkout
// Pricing & Access Logic:
// 
// OWNERS (tablesOwned > 0):
// - Each new table = $49.99 + extra seats cost
//
// NON-OWNERS (tablesOwned = 0):
// - Member of < 3 tables = Can create 1 table FREE (uses their active $49.99 subscription)
// - Member of >= 3 tables = BLOCKED
//
// EXTRA SEATS:
// - Only charged if > 0 additional seats requested
// - $4.99 per extra seat/month

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tableSetup, additionalSeats = 0, tablesOwned = 0, memberOfCount = 0 } = body

    if (!tableSetup?.name || !tableSetup?.table_type_id) {
      return NextResponse.json({ error: 'Missing required table setup data' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // CASE 1: User owns 0 tables + is member of < 3 tables + has active subscription
    // → Can create first table for FREE
    if (tablesOwned === 0 && memberOfCount < 3) {
      // Check for active subscription
      const { data: activeSub } = await serviceClient
        .from('subscriptions')
        .select('stripe_subscription_id, stripe_customer_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (activeSub?.stripe_customer_id && activeSub.status === 'active') {
        // User has active subscription, can create table for FREE
        
        if (additionalSeats > 0) {
          // But charge for extra seats if requested
          const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: activeSub.stripe_customer_id,
            line_items: [
              {
                price: PLANS.extraSeat.priceId,
                quantity: additionalSeats,
              },
            ],
            subscription_data: {
              metadata: {
                user_id: user.id,
                table_name: tableSetup.name,
                table_type_id: tableSetup.table_type_id,
                additional_seats: String(additionalSeats),
              },
            },
            success_url: `${appUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/create-table?cancelled=true`,
          })

          return NextResponse.json({ url: session.url })
        } else {
          // No extra seats, create table immediately without payment
          return NextResponse.json({
            skipPayment: true,
            tableSetup,
            userId: user.id,
            additionalSeats: 0,
          })
        }
      }
    }

    // CASE 2: User is member of 3+ tables → BLOCKED
    if (memberOfCount >= 3) {
      return NextResponse.json(
        { error: 'You are a member of 3 tables. Please leave a table before creating a new one.' },
        { status: 403 }
      )
    }

    // CASE 3: User owns 1+ tables OR has no active subscription
    // → CHARGE $49.99 for new table + any extra seats
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      customer_creation: 'always',
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
        metadata: {
          user_id: user.id,
          table_name: tableSetup.name,
          table_type_id: tableSetup.table_type_id,
          additional_seats: String(additionalSeats),
        },
      },
      success_url: `${appUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/create-table?cancelled=true`,
      metadata: {
        user_id: user.id,
        table_name: tableSetup.name,
        table_type_id: tableSetup.table_type_id,
        additional_seats: String(additionalSeats),
      },
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
