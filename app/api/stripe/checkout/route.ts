import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe, PLANS } from '@/lib/stripe/client'
import { generateAffiliateCode, buildAffiliateUrl } from '@/lib/utils/affiliate'
import { slugify } from '@/lib/utils/slugify'

// POST /api/stripe/checkout
// Creates a Stripe checkout session for a new Equity Table subscription.
// Table setup data is stored in Stripe metadata; the actual table is created
// in the webhook handler after payment succeeds.
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
    const slug = slugify(tableSetup.name)

    // Check if user already has an ACTIVE base subscription
    const { data: userSubs } = await serviceClient
      .from('subscriptions')
      .select('stripe_subscription_id, stripe_customer_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    // If user has active subscription, create table without charging
    if (userSubs?.stripe_customer_id && userSubs.status === 'active') {
      // User can create tables for free with their $49.99 subscription
      // Just charge for extra seats if they want them
      
      if (additionalSeats > 0) {
        // Create checkout for EXTRA SEATS only (not base subscription)
        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: userSubs.stripe_customer_id,
          line_items: [
            {
              price: PLANS.extraSeats.priceId,
              quantity: additionalSeats,
            },
          ],
          subscription_data: {
            metadata: {
              user_id: user.id,
              table_name: tableSetup.name,
              table_type_id: tableSetup.table_type_id,
              table_slug: slug,
              table_mission: tableSetup.mission || '',
              table_description: tableSetup.description || '',
              table_visibility: tableSetup.visibility || 'public',
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
        })

        return NextResponse.json({ url: session.url })
      } else {
        // No extra seats, create table directly without payment
        return NextResponse.json({ 
          skipPayment: true,
          tableSetup,
          userId: user.id,
        })
      }
    }

    // User doesn't have subscription, create one
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
          price: PLANS.extraSeats.priceId,
          quantity: additionalSeats,
        }] : []),
      ],
      subscription_data: {
        metadata: {
          user_id: user.id,
          table_name: tableSetup.name,
          table_type_id: tableSetup.table_type_id,
          table_slug: slug,
          table_mission: tableSetup.mission || '',
          table_description: tableSetup.description || '',
          table_visibility: tableSetup.visibility || 'public',
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
