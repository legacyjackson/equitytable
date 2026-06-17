'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PlatformAnalytics {
  totalUsers: number
  activeUsers: number
  totalTables: number
  activeTables: number
  totalCoursesStarted: number
  totalCoursesCompleted: number
  overallCompletionRate: number
  monthlyRevenue: number
  userGrowth: Array<{ date: string; count: number }>
  revenueOverTime: Array<{ date: string; revenue: number }>
  topCourses: Array<{ name: string; count: number }>
  tableTypes: Array<{ name: string; count: number }>
  userRetention: Array<{ week: string; retention: number }>
}

const COLORS = ['#1e3a5f', '#4b90e2', '#f5a623', '#7ed321', '#bd10e0', '#ff6b6b']

export default function AdminAnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PlatformAnalytics | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
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
        <h1 className="text-3xl font-display font-bold text-navy-500">Platform Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time platform performance metrics</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Total Users</p>
          <p className="text-2xl font-display font-bold text-navy-500 mt-2">{data.totalUsers}</p>
          <p className="text-xs text-green-600 mt-1">↑ {data.activeUsers} active</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Total Tables</p>
          <p className="text-2xl font-display font-bold text-navy-500 mt-2">{data.totalTables}</p>
          <p className="text-xs text-green-600 mt-1">{data.activeTables} active</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Courses Started</p>
          <p className="text-2xl font-display font-bold text-navy-500 mt-2">{data.totalCoursesStarted}</p>
          <p className="text-xs text-muted-foreground mt-1">{data.totalCoursesCompleted} completed</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Completion Rate</p>
          <p className="text-2xl font-display font-bold text-green-600 mt-2">{data.overallCompletionRate.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground mt-1">Platform avg</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Monthly Revenue</p>
          <p className="text-2xl font-display font-bold text-green-600 mt-2">${data.monthlyRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">MRR</p>
        </div>

        <div className="et-card p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">ARR</p>
          <p className="text-2xl font-display font-bold text-green-600 mt-2">${(data.monthlyRevenue * 12).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Annualized</p>
        </div>
      </div>

      {/* User & Revenue Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">User Growth (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1e3a5f" strokeWidth={2} dot={{ fill: '#1e3a5f' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Revenue Growth (30 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#7ed321" strokeWidth={2} dot={{ fill: '#7ed321' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Courses & Table Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Top 8 Courses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topCourses} layout="vertical" margin={{ left: 200 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" width={200} fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" fill="#4b90e2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Tables by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.tableTypes}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, count }) => `${name}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.tableTypes.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Retention */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Weekly Retention Rate</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.userRetention}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 100]} label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
            <Line type="monotone" dataKey="retention" stroke="#f5a623" strokeWidth={2} dot={{ fill: '#f5a623' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="et-card p-6">
        <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Platform Health</h2>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-green-200 bg-green-50">
            <p className="text-sm text-green-700">
              ✓ Platform has {data.totalUsers} active users with {data.overallCompletionRate.toFixed(0)}% course completion rate
            </p>
          </div>
          {data.monthlyRevenue > 10000 && (
            <div className="p-3 rounded-lg border border-green-200 bg-green-50">
              <p className="text-sm text-green-700">
                ✓ Monthly recurring revenue reached ${data.monthlyRevenue.toLocaleString()}
              </p>
            </div>
          )}
          {data.activeUsers / data.totalUsers < 0.3 && (
            <div className="p-3 rounded-lg border border-orange-200 bg-orange-50">
              <p className="text-sm text-orange-700">
                ⚠ Only {((data.activeUsers / data.totalUsers) * 100).toFixed(0)}% of users are active. Consider engagement campaigns.
              </p>
            </div>
          )}
          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-700">
              → {data.activeTables} active tables generating revenue. Target: 100+ by EOY
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
