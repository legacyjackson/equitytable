'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface AnalyticsData {
  totalMembers: number
  activeMembers: number
  totalCoursesStarted: number
  totalCoursesCompleted: number
  completionRate: number
  memberGrowth: Array<{ date: string; count: number }>
  courseStats: Array<{ name: string; started: number; completed: number; rate: number }>
  memberEngagement: Array<{ name: string; engagement: number; lastActive: string }>
  tableRevenue: number
}

const COLORS = ['#1e3a5f', '#4b90e2', '#f5a623', '#7ed321', '#bd10e0']

export default function TableAnalyticsPage() {
  const params = useParams()
  const tableId = params.tableId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/tables/${tableId}/analytics`)
      const analyticsData = await res.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">No analytics available</div>
  }

  return (
    <div className="space-y-6 p-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500">Table Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track member engagement and course completion</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Total Members</p>
          <p className="text-3xl font-display font-bold text-navy-500 mt-2">{data.totalMembers}</p>
          <p className="text-xs text-green-600 mt-1">↑ {data.activeMembers} active</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Courses Started</p>
          <p className="text-3xl font-display font-bold text-navy-500 mt-2">{data.totalCoursesStarted}</p>
          <p className="text-xs text-muted-foreground mt-1">Avg {(data.totalCoursesStarted / Math.max(data.totalMembers, 1)).toFixed(1)} per member</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Completion Rate</p>
          <p className="text-3xl font-display font-bold text-green-600 mt-2">{data.completionRate.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{data.totalCoursesCompleted} completed</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Monthly Revenue</p>
          <p className="text-3xl font-display font-bold text-green-600 mt-2">${data.tableRevenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">From subscriptions</p>
        </div>
      </div>

      {/* Member Growth Chart */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Member Growth</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.memberGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Course Stats */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Top Courses</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.courseStats.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#7ed321" name="Completed" />
            <Bar dataKey="started" fill="#4b90e2" name="Started" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Engagement */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Member Engagement</h2>
        <div className="space-y-3">
          {data.memberEngagement.map((member, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30">
              <div>
                <p className="text-sm font-medium text-navy-500">{member.name}</p>
                <p className="text-xs text-muted-foreground">Last active: {member.lastActive}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${member.engagement}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-navy-500 w-10 text-right">{member.engagement}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Insights</h2>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-green-200 bg-green-50">
            <p className="text-sm text-green-700">
              ✓ Your completion rate is <strong>{data.completionRate.toFixed(0)}%</strong>, which is excellent for online learning
            </p>
          </div>
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-700">
              → Your table has grown to <strong>{data.totalMembers} members</strong>. Keep sharing invites!
            </p>
          </div>
          {data.completionRate < 50 && (
            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
              <p className="text-sm text-orange-700">
                ⚠ Consider sending reminders to inactive members to boost engagement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
