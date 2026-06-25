import type { SupabaseClient } from '@supabase/supabase-js'

export const FREE_TABLES_PER_SUBSCRIPTION = 3

interface ActiveSubscription {
  id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

/**
 * A subscription is tied 1:1 to a table (subscriptions.table_id is unique),
 * not to a user. "Is this user a subscriber" therefore means: do they own
 * at least one table with an active subscription. Tables #2 and #3 owned
 * by a subscriber are comped (no separate base charge) — see
 * FREE_TABLES_PER_SUBSCRIPTION.
 */
export async function getOwnerSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  tablesOwnedCount: number
  memberOfCount: number
  activeSubscription: ActiveSubscription | null
  unlimitedTables: boolean
}> {
  const { data: unlimitedRow } = await supabase
    .from('unlimited_table_access')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  const unlimitedTables = !!unlimitedRow

  const { data: ownedTables } = await supabase
    .from('equity_tables')
    .select('id')
    .eq('owner_id', userId)

  const tablesOwnedCount = ownedTables?.length ?? 0

  let activeSubscription: ActiveSubscription | null = null
  if (tablesOwnedCount > 0) {
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('id, stripe_customer_id, stripe_subscription_id')
      .in('table_id', ownedTables!.map((t) => t.id))
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    activeSubscription = subs?.[0] ?? null
  }

  const { count: memberOfCount } = await supabase
    .from('table_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('role', 'owner')
    .eq('status', 'active')

  return {
    tablesOwnedCount,
    memberOfCount: memberOfCount ?? 0,
    activeSubscription,
    unlimitedTables,
  }
}
