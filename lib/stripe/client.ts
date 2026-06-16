import Stripe from 'stripe'

// Server-only Stripe client
// Import only in server-side code (Server Actions, Route Handlers)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// ── Plan constants ────────────────────────────────────────────
export const PLANS = {
  base: {
    priceId: process.env.STRIPE_BASE_PRICE_ID!,
    amount: 4999,           // cents
    amountDisplay: '$49.99',
    includedSeats: 10,
    label: 'Equity Table',
    interval: 'month',
  },
  extraSeat: {
    priceId: process.env.STRIPE_EXTRA_SEAT_PRICE_ID!,
    amount: 499,            // cents per seat
    amountDisplay: '$4.99',
    label: 'Extra seat',
    interval: 'month',
  },
} as const

// ── Checkout ──────────────────────────────────────────────────
export async function createCheckoutSession({
  customerId,
  userId,
  tableSetupData,
  successUrl,
  cancelUrl,
}: {
  customerId?: string
  userId: string
  tableSetupData: Record<string, string>
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    customer_creation: customerId ? undefined : 'always',
    line_items: [
      {
        price: PLANS.base.priceId,
        quantity: 1,
      },
    ],
    // Allow extra seats to be added when needed
    // (we handle this via subscription update after invite acceptance)
    subscription_data: {
      metadata: {
        user_id: userId,
        table_setup: JSON.stringify(tableSetupData),
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      table_setup: JSON.stringify(tableSetupData),
    },
    allow_promotion_codes: true,
  })
}

// ── Billing portal ────────────────────────────────────────────
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

// ── Webhook verification ──────────────────────────────────────
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
