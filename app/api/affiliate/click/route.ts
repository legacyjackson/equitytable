import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { headers } from 'next/headers'

// POST /api/affiliate/click
// Records a CTA click and redirects to Global Pathways with the affiliate code.
// Called when a user clicks any "Start your Global Pathway" CTA.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { table_id, lesson_id, course_id, event_id, cta_text, placement } = body

    // Get the affiliate link for this table
    let affiliateLinkId: string | null = null
    let destinationUrl = process.env.DEFAULT_GLOBAL_PATHWAYS_URL || 'https://legacyplan.app/'

    if (table_id) {
      const { data: link } = await supabase
        .from('affiliate_links')
        .select('id, destination_url')
        .eq('table_id', table_id)
        .eq('active', true)
        .maybeSingle()

      if (link) {
        affiliateLinkId = link.id
        destinationUrl = link.destination_url
      }
    }

    // Get affiliate settings for default CTA text
    const serviceClient = await createServiceClient()

    // Hash IP for privacy
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || ''
    const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 16) : null
    const userAgent = headersList.get('user-agent') || null

    // Record the click
    await serviceClient.from('affiliate_clicks').insert({
      table_id: table_id || null,
      user_id: user?.id || null,
      affiliate_link_id: affiliateLinkId,
      lesson_id: lesson_id || null,
      course_id: course_id || null,
      event_id: event_id || null,
      cta_text: cta_text || null,
      cta_placement: placement || 'unknown',
      destination_url: destinationUrl,
      ip_hash: ipHash,
      user_agent: userAgent,
      clicked_at: new Date().toISOString(),
    })

    // Award "Pathway Ready" badge for first click
    if (user?.id) {
      const { data: badge } = await serviceClient
        .from('badges')
        .select('id')
        .eq('slug', 'pathway-ready')
        .maybeSingle()

      if (badge) {
        await serviceClient.from('user_badges').insert({
          user_id: user.id,
          badge_id: badge.id,
          table_id: table_id || null,
        }).onConflict('user_id, badge_id, table_id').ignore()
      }

      // Award points
      await serviceClient.from('points_ledger').insert({
        user_id: user.id,
        table_id: table_id || null,
        points: 100,
        reason: 'Clicked Global Pathways CTA',
        source_type: 'cta_click',
      })
    }

    return NextResponse.json({ destination_url: destinationUrl })
  } catch (error) {
    console.error('Affiliate click tracking error:', error)
    // Still return a URL so the user isn't blocked
    return NextResponse.json({
      destination_url: process.env.DEFAULT_GLOBAL_PATHWAYS_URL || 'https://legacyplan.app/'
    })
  }
}
