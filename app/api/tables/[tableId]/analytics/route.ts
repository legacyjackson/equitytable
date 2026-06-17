// app/api/tables/[tableId]/analytics/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tableId } = await params

    // Verify user owns this table
    const { data: table } = await supabase
      .from('equity_tables')
      .select('owner_id, name')
      .eq('id', tableId)
      .single()

    if (!table || table.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const svc = await createServiceClient()

    // Get all members of this table
    const { data: members } = await svc
      .from('table_memberships')
      .select('user_id, profile:profiles(full_name, username)')
      .eq('table_id', tableId)

    const memberIds = members?.map(m => m.user_id) || []
    const totalMembers = memberIds.length

    // Get active members (logged in last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: activeMembersData } = await svc
      .from('user_activity')
      .select('user_id')
      .eq('table_id', tableId)
      .gte('last_active', sevenDaysAgo)

    const activeMembers = new Set(activeMembersData?.map(a => a.user_id) || []).size

    // Get course statistics
    const { data: courseProgress } = await svc
      .from('course_progress')
      .select('user_id, course_id, status, completed_at')
      .in('user_id', memberIds)

    const totalCoursesStarted = courseProgress?.length || 0
    const totalCoursesCompleted = courseProgress?.filter(p => p.status === 'completed').length || 0
    const completionRate = totalCoursesStarted > 0 ? (totalCoursesCompleted / totalCoursesStarted) * 100 : 0

    // Member growth over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: memberGrowth } = await svc
      .from('table_memberships')
      .select('joined_at')
      .eq('table_id', tableId)
      .gte('joined_at', thirtyDaysAgo)
      .order('joined_at', { ascending: true })

    // Group by date
    const growthByDate: Record<string, number> = {}
    let cumulativeCount = totalMembers - (memberGrowth?.length || 0)

    memberGrowth?.forEach(m => {
      const date = new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      cumulativeCount++
      growthByDate[date] = cumulativeCount
    })

    const memberGrowthChart = Object.entries(growthByDate).map(([date, count]) => ({
      date,
      count,
    }))

    // Course popularity
    const courseStats: Record<string, { started: number; completed: number }> = {}
    courseProgress?.forEach(p => {
      if (!courseStats[p.course_id]) {
        courseStats[p.course_id] = { started: 0, completed: 0 }
      }
      courseStats[p.course_id].started++
      if (p.status === 'completed') {
        courseStats[p.course_id].completed++
      }
    })

    // Get course names and format
    const courseIds = Object.keys(courseStats)
    const { data: courses } = await svc
      .from('courses')
      .select('id, title')
      .in('id', courseIds)

    const courseStatsFormatted = courses?.map(course => {
      const stats = courseStats[course.id]
      return {
        name: course.title,
        started: stats.started,
        completed: stats.completed,
        rate: stats.started > 0 ? (stats.completed / stats.started) * 100 : 0,
      }
    }) || []

    // Member engagement (sample 10 most active)
    const { data: memberActivity } = await svc
      .from('user_activity')
      .select('user_id, last_active, engagement_score')
      .eq('table_id', tableId)
      .order('engagement_score', { ascending: false })
      .limit(10)

    const memberEngagement = memberActivity?.map(activity => {
      const rawProfile = members?.find(m => m.user_id === activity.user_id)?.profile
      const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
      return {
        name: profile?.full_name || profile?.username || 'Unknown',
        engagement: Math.min(activity.engagement_score || 0, 100),
        lastActive: new Date(activity.last_active).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }
    }) || []

    // Revenue from this table's subscriptions
    const { data: subscription } = await svc
      .from('subscriptions')
      .select('base_price_id, extra_seats')
      .eq('table_id', tableId)
      .single()

    const basePrice = 49.99
    const extraSeatsPrice = (subscription?.extra_seats || 0) * 4.99
    const tableRevenue = basePrice + extraSeatsPrice

    return NextResponse.json({
      totalMembers,
      activeMembers,
      totalCoursesStarted,
      totalCoursesCompleted,
      completionRate,
      memberGrowth: memberGrowthChart.slice(-30), // Last 30 days
      courseStats: courseStatsFormatted.sort((a, b) => b.completed - a.completed),
      memberEngagement,
      tableRevenue,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
