'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface AffiliateStats {
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  conversionRate: number
  topLinks: Array<{
    code: string
    name: string
    clicks: number
    conversions: number
    earnings: number
  }>
  recentPayouts: Array<{
    id: string
    amount: number
    status: string
    period_start: string
    period_end: string
  }>
}

export default function AffiliateDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadAffiliateStats()
  }, [])

  const loadAffiliateStats = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's tables
    const { data: tables } = await supabase
      .from('equity_tables')
      .select('id, name, affiliate_code')
      .eq('owner_id', user.id)

    if (!tables || tables.length === 0) {
      setLoading(false)
      return
    }

    const tableIds = tables.map(t => t.id)

    // Get affiliate stats
    const { data: clicks } = await supabase
      .from('affiliate_clicks')
      .select('id, affiliate_link_id')
      .in('table_id', tableIds)

    const { data: conversions } = await supabase
      .from('affiliate_conversions')
      .select('id, amount')
      .in('table_id', tableIds)

    const { data: links } = await supabase
      .from('affiliate_links')
      .select('id, code, active')
      .in('table_id', tableIds)

    const { data: payouts } = await supabase
      .from('affiliate_payouts')
      .select('id, amount, status, period_start, period_end')
      .in('table_id', tableIds)
      .order('period_end', { ascending: false })
      .limit(10)

    const totalEarnings = (conversions || []).reduce((sum, c) => sum + (c.amount || 0), 0)

    setStats({
      totalClicks: clicks?.length || 0,
      totalConversions: conversions?.length || 0,
      totalEarnings,
      conversionRate: clicks && clicks.length > 0 ? ((conversions?.length || 0) / clicks.length) * 100 : 0,
      topLinks: tables.map((t, idx) => ({
        code: t.affiliate_code || '',
        name: t.name,
        clicks: clicks?.filter(c => c.affiliate_link_id === t.id).length || 0,
        conversions: conversions?.filter(c => JSON.stringify(c).includes(t.id)).length || 0,
        earnings: conversions?.filter(c => JSON.stringify(c).includes(t.id)).reduce((sum, c) => sum + (c.amount || 0), 0) || 0,
      })),
      recentPayouts: (payouts || []).map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        period_start: p.period_start,
        period_end: p.period_end,
      })),
    })

    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading affiliate data...</div>
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-navy-500 mb-2">Affiliate Dashboard</h1>
        <p className="text-muted-foreground">You don't have any affiliate links yet. Create a table to get started.</p>
        <Link href="/create-table" className="inline-block mt-4 px-4 py-2 bg-navy-500 text-white rounded-lg hover:bg-navy-600">
          Create Table
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Affiliate Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your affiliate earnings and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="et-card p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Total Clicks</p>
          <p className="text-3xl font-display font-bold text-navy-500 mt-2">{stats.totalClicks}</p>
        </div>

        <div className="et-card p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Conversions</p>
          <p className="text-3xl font-display font-bold text-navy-500 mt-2">{stats.totalConversions}</p>
        </div>

        <div className="et-card p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Conversion Rate</p>
          <p className="text-3xl font-display font-bold text-navy-500 mt-2">{stats.conversionRate.toFixed(1)}%</p>
        </div>

        <div className="et-card p-4">
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">Total Earnings</p>
          <p className="text-3xl font-display font-bold text-green-600 mt-2">${stats.totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      {/* Top Links */}
      {stats.topLinks.length > 0 && (
        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Your Affiliate Links</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Table</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Clicks</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Conversions</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.topLinks.map(link => (
                  <tr key={link.code} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-navy-500">{link.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{link.code}</td>
                    <td className="px-4 py-3 text-right">{link.clicks}</td>
                    <td className="px-4 py-3 text-right">{link.conversions}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">${link.earnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Payouts */}
      {stats.recentPayouts.length > 0 && (
        <div className="et-card p-6">
          <h2 className="text-lg font-display font-semibold text-navy-500 mb-4">Recent Payouts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentPayouts.map(payout => (
                  <tr key={payout.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">${payout.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        payout.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
