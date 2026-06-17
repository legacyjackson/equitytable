'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface CourseCard {
  id: string
  title: string
  category: string
  description: string
  estimated_minutes: number
  thumbnail_url?: string
  progress?: number
}

interface QuickStats {
  coursesStarted: number
  coursesCompleted: number
  tablesJoined: number
}

export default function AppHomePage() {
  const supabase = createClient()
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [stats, setStats] = useState<QuickStats>({ coursesStarted: 0, coursesCompleted: 0, tablesJoined: 0 })
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) setUserName(profile.full_name)

      // Get featured courses
      const { data: allCourses } = await supabase
        .from('courses')
        .select('id, title, category_id, description, estimated_minutes, thumbnail_url, course_categories(name)')
        .eq('status', 'published')
        .limit(8)

      setCourses(allCourses?.map(c => {
        const cat = Array.isArray(c.course_categories) ? c.course_categories[0] : c.course_categories
        return {
          id: c.id,
          title: c.title,
          category: cat?.name || 'General',
          description: c.description,
          estimated_minutes: c.estimated_minutes,
          thumbnail_url: c.thumbnail_url,
        }
      }) || [])

      // Get user stats
      const { data: courseProgress } = await supabase
        .from('course_progress')
        .select('status')
        .eq('user_id', user.id)

      const { count: tablesCount } = await supabase
        .from('table_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setStats({
        coursesStarted: courseProgress?.length || 0,
        coursesCompleted: courseProgress?.filter(p => p.status === 'completed').length || 0,
        tablesJoined: tablesCount || 0,
      })
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-navy-500 to-navy-600 text-white px-4 py-8 md:px-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-white/80 text-sm mt-2">Keep building wealth through financial knowledge</p>
      </div>

      {/* Quick Stats */}
      <div className="px-4 md:px-8 py-6">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Link href="/app/courses" className="et-card p-4 md:p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-2xl md:text-3xl font-display font-bold text-navy-500">{stats.coursesStarted}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Courses Started</p>
          </Link>
          <Link href="/app/courses" className="et-card p-4 md:p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-2xl md:text-3xl font-display font-bold text-green-600">{stats.coursesCompleted}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Completed</p>
          </Link>
          <Link href="/app/tables" className="et-card p-4 md:p-6 text-center hover:shadow-lg transition-shadow">
            <p className="text-2xl md:text-3xl font-display font-bold text-blue-600">{stats.tablesJoined}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Tables</p>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 md:px-8 py-6 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row gap-3">
          <Link
            href="/app/courses"
            className="flex-1 rounded-xl bg-blue-600 text-white px-4 py-3 md:py-4 font-semibold hover:bg-blue-700 transition-colors text-center text-sm md:text-base"
          >
            📚 Browse Courses
          </Link>
          <Link
            href="/app/tables"
            className="flex-1 rounded-xl bg-navy-500 text-white px-4 py-3 md:py-4 font-semibold hover:bg-navy-600 transition-colors text-center text-sm md:text-base"
          >
            🏛️ My Tables
          </Link>
        </div>
      </div>

      {/* Featured Courses */}
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-display font-bold text-navy-500">Popular Courses</h2>
          <Link href="/app/courses" className="text-xs md:text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">Loading courses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {courses.map(course => (
              <Link
                key={course.id}
                href={`/app/courses/${course.id}`}
                className="et-card overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {course.thumbnail_url && (
                  <div className="w-full h-32 bg-gray-200 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-blue-600 font-semibold">{course.category}</p>
                  <h3 className="font-semibold text-navy-500 mt-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2">{course.estimated_minutes} min</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="px-4 md:px-8 py-8 md:py-12">
        <div className="rounded-xl bg-gradient-to-br from-gold-400 to-gold-300 p-6 md:p-8 text-center">
          <h3 className="text-xl md:text-2xl font-display font-bold text-navy-500">Create Your Equity Table</h3>
          <p className="text-navy-500/80 text-sm mt-2">Lead your own wealth-building circle</p>
          <Link
            href="/create-table"
            className="inline-block mt-4 px-6 py-2.5 md:py-3 bg-navy-500 text-white rounded-lg font-semibold hover:bg-navy-600 transition-colors text-sm md:text-base"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
