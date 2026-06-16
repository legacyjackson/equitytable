import { nanoid } from 'nanoid'
import type { SeatUsage } from '@/types/database'

// ── Affiliate code generation ────────────────────────────────
// Generates a short, URL-safe affiliate code from the table name
// Example: "Life House Reentry" → "lifehouse-a3k9"
export function generateAffiliateCode(tableName: string): string {
  const base = tableName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('')
    .slice(0, 10)

  const suffix = nanoid(4).toLowerCase()
  return `${base}-${suffix}`
}

// Builds the full affiliate URL from base URL + code
export function buildAffiliateUrl(code: string, baseUrl?: string): string {
  const destination = baseUrl || process.env.DEFAULT_GLOBAL_PATHWAYS_URL || 'https://legacyplan.app/'
  const url = new URL(destination)
  url.searchParams.set('ref', code)
  return url.toString()
}

// ── Seat calculation ──────────────────────────────────────────
export const INCLUDED_SEATS = 10
export const EXTRA_SEAT_PRICE = 4.99
export const BASE_PRICE = 49.99

export function calculateSeatUsage(
  activeSeats: number,
  includedSeats = INCLUDED_SEATS
): SeatUsage {
  const extraSeatsNeeded = Math.max(0, activeSeats - includedSeats)
  return {
    active_seats: activeSeats,
    included_seats: includedSeats,
    extra_seats_needed: extraSeatsNeeded,
    extra_monthly_cost: extraSeatsNeeded * EXTRA_SEAT_PRICE,
    can_invite: true, // Can always invite; Stripe seat quantity updated on acceptance
    will_add_seat: activeSeats >= includedSeats,
  }
}

export function formatSeatCost(extraSeats: number): string {
  if (extraSeats === 0) return 'Included in your plan'
  const total = BASE_PRICE + extraSeats * EXTRA_SEAT_PRICE
  return `$${total.toFixed(2)}/month (${extraSeats} extra seat${extraSeats === 1 ? '' : 's'})`
}

// ── CTA helpers ───────────────────────────────────────────────
export const DEFAULT_CTA_TEXTS = {
  lesson: "Ready to turn this lesson into a real plan? Start your Global Pathway.",
  lesson_alt: "You've learned the concept. Now build your plan.",
  event: "Ready for the next step? Begin your Global Pathway.",
  event_alt: "Keep learning here. When you're ready to act, start your Pathway.",
  dashboard: "Learn together. Build together. Move when you're ready.",
  completion: "Take the next step when you're ready.",
} as const

export type CTAPlacement = keyof typeof DEFAULT_CTA_TEXTS

export function getDefaultCTAText(placement: CTAPlacement): string {
  return DEFAULT_CTA_TEXTS[placement]
}
