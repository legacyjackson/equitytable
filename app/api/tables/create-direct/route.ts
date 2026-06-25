import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAffiliateCode, buildAffiliateUrl } from '@/lib/utils/affiliate'
import { slugify } from '@/lib/utils/slugify'
import { bootstrapTableContent } from '@/lib/utils/bootstrapTableContent'
import { getOwnerSubscriptionStatus, FREE_TABLES_PER_SUBSCRIPTION } from '@/lib/utils/ownerSubscription'

// POST /api/tables/create-direct
// Creates a table immediately, free of charge, for subscribers who still
// have a free table slot remaining (see FREE_TABLES_PER_SUBSCRIPTION).
// This route never touches Stripe — it only inserts a comped subscription
// row tied to the new table.
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
      return NextResponse.json({ error: 'Missing table setup data' }, { status: 400 })
    }

    const svc = await createServiceClient()

    const { tablesOwnedCount, activeSubscription, unlimitedTables } = await getOwnerSubscriptionStatus(svc, user.id)

    if (!unlimitedTables) {
      if (!activeSubscription) {
        return NextResponse.json({ error: 'No active subscription found' }, { status: 403 })
      }

      if (tablesOwnedCount >= FREE_TABLES_PER_SUBSCRIPTION) {
        return NextResponse.json(
          { error: `You've used all ${FREE_TABLES_PER_SUBSCRIPTION} free tables included with your subscription. Additional tables are $49.99/month.` },
          { status: 403 }
        )
      }
    }

    // Generate unique slug
    let slug = slugify(tableSetup.name)
    let attempt = 0
    while (attempt < 10) {
      const { data: slugExists } = await svc
        .from('equity_tables')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (!slugExists) break
      slug = `${slugify(tableSetup.name)}-${Math.floor(Math.random() * 9000) + 1000}`
      attempt++
    }

    // Generate affiliate code
    const affiliateCode = generateAffiliateCode(tableSetup.name)
    const affiliateUrl = buildAffiliateUrl(affiliateCode)

    // Create the Equity Table
    const { data: table, error: tableError } = await svc
      .from('equity_tables')
      .insert({
        owner_id: user.id,
        table_type_id: tableSetup.table_type_id,
        name: tableSetup.name,
        slug,
        mission: tableSetup.mission || '',
        description: tableSetup.description || '',
        visibility: (tableSetup.visibility as 'public' | 'private' | 'invite_only') || 'public',
        affiliate_code: affiliateCode,
        affiliate_default_url: affiliateUrl,
        status: 'active',
      })
      .select()
      .single()

    if (tableError || !table) {
      console.error('Failed to create equity table:', tableError)
      return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
    }

    // Add owner membership
    await svc.from('table_memberships').insert({
      table_id: table.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    })

    // This table's base fee is comped (included in the subscriber's
    // 3-table allowance) — give it its own subscription row sharing the
    // same Stripe customer, rather than re-pointing an existing table's
    // subscription (subscriptions.table_id is unique, one row per table).
    await svc.from('subscriptions').insert({
      table_id: table.id,
      stripe_customer_id: activeSubscription?.stripe_customer_id ?? null,
      status: 'active',
      included_seats: 10,
      extra_seats: 0,
      comped: true,
      comp_reason: unlimitedTables
        ? 'Internal test account — unlimited table access'
        : `Included in subscriber's ${FREE_TABLES_PER_SUBSCRIPTION}-table allowance`,
    })

    // Create affiliate link
    await svc.from('affiliate_links').insert({
      table_id: table.id,
      code: affiliateCode,
      destination_url: affiliateUrl,
      active: true,
    })

    await bootstrapTableContent(svc, {
      tableId: table.id,
      tableTypeId: tableSetup.table_type_id,
      ownerId: user.id,
      tableName: tableSetup.name,
      mission: tableSetup.mission || '',
    })

    return NextResponse.json({
      success: true,
      table_id: table.id,
      slug: table.slug,
    })
  } catch (error) {
    console.error('Direct table creation error:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
