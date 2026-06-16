import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

// POST /api/stripe/goal-contribute
// Creates a one-time Stripe checkout session for a goal contribution.
// After payment, Stripe webhook credits the goal via goal_contributions table.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { goal_id, table_id, amount, note } = body

    if (!goal_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'goal_id and positive amount required' }, { status: 400 })
    }

    // Verify goal exists, accepts Stripe contributions, and is active
    const { data: goal } = await supabase
      .from('goals')
      .select('id, title, table_id, status, accept_contributions, contribution_type')
      .eq('id', goal_id)
      .eq('table_id', table_id)
      .eq('status', 'active')
      .maybeSingle()

    if (!goal) return NextResponse.json({ error: 'Goal not found or inactive' }, { status: 404 })
    if (!goal.accept_contributions || goal.contribution_type !== 'stripe') {
      return NextResponse.json({ error: 'This goal does not accept Stripe payments' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const amountCents = Math.round(amount * 100)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: profile?.email || user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: `Contribution to: ${goal.title}`,
              description: note || `Supporting the "${goal.title}" goal`,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          goal_id,
          table_id,
          user_id: user.id,
          note: note || '',
          type: 'goal_contribution',
        },
      },
      success_url: `${appUrl}/app/tables/${table_id}/goals/${goal_id}?contributed=true`,
      cancel_url: `${appUrl}/app/tables/${table_id}/goals/${goal_id}`,
      metadata: {
        goal_id,
        table_id,
        user_id: user.id,
        type: 'goal_contribution',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Goal contribute checkout error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 })
  }
}
