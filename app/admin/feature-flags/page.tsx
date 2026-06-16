'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils/format'

interface FeatureFlag {
  id: string
  name: string
  slug: string
  description: string | null
  enabled: boolean
  updated_at: string
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('feature_flags').select('*').order('name').then(({ data }) => {
      setFlags(data || [])
      setLoading(false)
    })
  }, [])

  const toggle = async (flag: FeatureFlag) => {
    setToggling(flag.id)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('feature_flags')
      .update({ enabled: !flag.enabled, updated_at: new Date().toISOString() })
      .eq('id', flag.id)

    setToggling(null)
    if (err) { setError(err.message); return }
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-navy-200 border-t-navy-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">Feature flags</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Toggle platform features on/off. Changes take effect immediately across the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="et-card divide-y divide-border overflow-hidden">
        {flags.map(flag => (
          <div key={flag.id} className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-navy-500">{flag.name}</p>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {flag.slug}
                </span>
              </div>
              {flag.description && (
                <p className="text-xs text-muted-foreground">{flag.description}</p>
              )}
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Updated {formatRelativeTime(flag.updated_at)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-semibold ${flag.enabled ? 'text-green-600' : 'text-muted-foreground'}`}>
                {flag.enabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => toggle(flag)}
                disabled={toggling === flag.id}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  flag.enabled ? 'bg-green-500' : 'bg-gray-300'
                } ${toggling === flag.id ? 'opacity-60' : ''}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  flag.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        ))}
        {flags.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No feature flags defined.</div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <strong>Note:</strong> Feature flags are platform-wide toggles. Disabling a feature removes it from all users immediately. Use with care.
      </div>
    </div>
  )
}
