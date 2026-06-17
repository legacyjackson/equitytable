// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is super admin
    const { data: isAdmin } = await supabase
      .from('platform_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single()

    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const svc = await createServiceClient()

    // Total users
    const { count: totalUsers } = await svc
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Active users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: activeUsersData } = await svc
      .from('user_activity')
      .select('user_id', { count: 'exact' })
      .gte('last_active', sevenDaysAgo)

    const activeUsers = new Set(activeUsersData?.map(a => a.user_id) || []).size

    // Total tables
    const { count: totalTables } = await svc
      .from('equity_tables')
      .select('*', { count: 'exact', head: true })

    // Active tables (with activity last 7 days)
    const { data: activeTables } = await svc
      .from('equity_tables')
      .select('id')
      .gte('updated_at', sevenDaysAgo)

    // Course statistics
    const { data: courseProgress } = await svc
      .from('course_progress')
      .select('status')

    const totalCoursesStarted = courseProgress?.length || 0
    const totalCoursesCompleted = courseProgress?.filter(p => p.status === 'completed').length || 0
    const overallCompletionRate = totalCoursesStarted > 0 ? (totalCoursesCompleted / totalCoursesStarted) * 100 : 0

    // Monthly revenue from subscriptions
    const { data: subscriptions } = await svc
      .from('subscriptions')
      .select('base_price_id, extra_seats, status')
      .eq('status', 'active')

    const monthlyRevenue = (subscriptions?.length || 0) * 49.99 + 
      (subscriptions?.reduce((acc, sub) => acc + ((sub.extra_seats || 0) * 4.99), 0) || 0)

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: userGrowthData } = await svc
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true })

    const userGrowthByDate: Record<string, number> = {}
    let cumulativeUsers = (totalUsers || 0) - (userGrowthData?.length || 0)

    userGrowthData?.forEach(u => {
      const date = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      cumulativeUsers++
      userGrowthByDate[date] = cumulativeUsers
    })

    const userGrowth = Object.entries(userGrowthByDate).map(([date, count]) => ({ date, count }))

    // Revenue over time (last 30 days) - simulated
    const revenueOverTime = []
    for (let i = 30; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      revenueOverTime.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: monthlyRevenue * 0.95 + Math.random() * (monthlyRevenue * 0.1),
      })
    }

    // Top courses
    const { data: courseCounts } = await svc
      .from('course_progress')
      .select('course_id, courses(title)')
      .order('course_id')

    const courseMap: Record<string, { title: string; count: number }> = {}
    courseCounts?.forEach(c => {
      const courseRel = Array.isArray(c.courses) ? c.courses[0] : c.courses
      const title = courseRel?.title || 'Unknown'
      if (!courseMap[title]) {
        courseMap[title] = { title, count: 0 }
      }
      courseMap[title].count++
    })

    const topCourses = Object.values(courseMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(c => ({ name: c.title, count: c.count }))

    // Tables by type
    const { data: tablesByType } = await svc
      .from('equity_tables')
      .select('table_type_id, equity_table_types(name)')
      .order('table_type_id')

    const typeMap: Record<string, { name: string; count: number }> = {}
    tablesByType?.forEach(t => {
      const typeRel = Array.isArray(t.equity_table_types) ? t.equity_table_types[0] : t.equity_table_types
      const name = typeRel?.name || 'Unknown'
      if (!typeMap[name]) {
        typeMap[name] = { name, count: 0 }
      }
      typeMap[name].count++
    })

    const tableTypes = Object.values(typeMap)
      .sort((a, b) => b.count - a.count)
      .map(t => ({ name: t.name, count: t.count }))

    // User retention (weekly cohorts) - simulated
    const userRetention = [
      { week: 'Week 1', retention: 100 },
      { week: 'Week 2', retention: 85 },
      { week: 'Week 3', retention: 72 },
      { week: 'Week 4', retention: 61 },
      { week: 'Week 5', retention: 52 },
      { week: 'Week 6', retention: 46 },
      { week: 'Week 7', retention: 42 },
      { week: 'Week 8', retention: 38 },
    ]

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers,
      totalTables: totalTables || 0,
      activeTables: activeTables?.length || 0,
      totalCoursesStarted,
      totalCoursesCompleted,
      overallCompletionRate,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      userGrowth: userGrowth.slice(-30),
      revenueOverTime,
      topCourses,
      tableTypes,
      userRetention,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
