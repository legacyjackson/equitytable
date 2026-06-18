import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateAffiliateCode, buildAffiliateUrl } from '@/lib/utils/affiliate'
import { slugify } from '@/lib/utils/slugify'
import { bootstrapTableContent } from '@/lib/utils/bootstrapTableContent'

// POST /api/tables/create-direct
// Creates a table immediately for users with active $49.99 subscription (no payment needed)
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

    // Verify user has active subscription
    const { data: activeSub } = await svc
      .from('subscriptions')
      .select('id, user_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!activeSub) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 403 })
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

    // Update existing subscription to link this table
    await svc
      .from('subscriptions')
      .update({
        table_id: table.id,
        included_seats: 10,
        extra_seats: 0,
      })
      .eq('id', activeSub.id)

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
