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
    const { tableSetup } = body

    if (!tableSetup?.name || !tableSetup?.table_type_id) {
      return NextResponse.json({ error: 'Missing required table setup data' }, { status: 400 })
    }

    // Check for existing Stripe customer
    const serviceClient = await createServiceClient()
    const { data: existingSubs } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('table_id', tableSetup.existing_table_id || '00000000-0000-0000-0000-000000000000')
      .limit(1)
      .maybeSingle()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const slug = slugify(tableSetup.name)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: existingSubs?.stripe_customer_id || undefined,
      customer_email: existingSubs?.stripe_customer_id ? undefined : user.email,
      customer_creation: existingSubs?.stripe_customer_id ? undefined : 'always',
      line_items: [
        {
          price: PLANS.base.priceId,
          quantity: 1,
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
        },
      },
      success_url: `${appUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/create-table?cancelled=true`,
      metadata: {
        user_id: user.id,
        table_name: tableSetup.name,
        table_type_id: tableSetup.table_type_id,
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
