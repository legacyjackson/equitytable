'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

interface Setting {
  key: string
  value: unknown
  description: string | null
  updated_at: string
}

const SETTING_GROUPS = [
  {
    title: 'Pricing',
    keys: ['et_base_price', 'et_included_seats', 'et_extra_seat_price', 'pathway_price', 'pathway_length_months'],
  },
  {
    title: 'Platform',
    keys: ['registration_open', 'maintenance_mode', 'max_upload_mb', 'max_recording_minutes'],
  },
  {
    title: 'Leaderboards',
    keys: ['leaderboards_default'],
  },
]

export default function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Also load affiliate settings
  const [affiliateSettings, setAffiliateSettings] = useState<{
    default_destination_url: string
    default_payout_amount: number
    cta_default_text: string
    cta_default_text_event: string
    cta_default_text_course: string
    allow_table_cta_customization: boolean
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('system_settings').select('*').order('key'),
      supabase.from('affiliate_settings').select('*').limit(1).maybeSingle(),
    ]).then(([{ data: s }, { data: a }]) => {
      setSettings(s || [])
      setAffiliateSettings(a)
      setLoading(false)
    })
  }, [])

  const saveSetting = async (key: string, value: unknown) => {
    setSaving(key)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('system_settings')
      .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .eq('key', key)

    setSaving(null)
    if (err) { setError(err.message); return }
    setSaved(key)
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    setTimeout(() => setSaved(null), 2000)
  }

  const saveAffiliateSettings = async (updates: Partial<typeof affiliateSettings>) => {
    setSaving('affiliate')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('affiliate_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .not('id', 'is', null)

    setSaving(null)
    if (err) { setError(err.message); return }
    setAffiliateSettings(prev => prev ? { ...prev, ...updates } : null)
    setSaved('affiliate')
    setTimeout(() => setSaved(null), 2000)
  }

  const getSetting = (key: string) => settings.find(s => s.key === key)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-navy-200 border-t-navy-500 animate-spin" />
      </div>
    )
  }

  const inputClass = cn(
    'rounded-lg border border-border px-3 py-2 text-sm outline-none',
    'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors w-full'
  )

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy-500">System settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Platform-wide configuration. Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* System settings */}
      {SETTING_GROUPS.map(group => (
        <div key={group.title} className="et-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-navy-500">{group.title}</h2>
          </div>
          <div className="divide-y divide-border">
            {group.keys.map(key => {
              const setting = getSetting(key)
              if (!setting) return null
              const val = setting.value
              const isBool = val === 'true' || val === 'false' || val === true || val === false
              const strVal = String(val).replace(/"/g, '')

              return (
                <div key={key} className="px-5 py-4 flex items-center justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-500 font-mono">{key}</p>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isBool ? (
                      <select
                        defaultValue={strVal}
                        onChange={e => saveSetting(key, e.target.value)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        key={strVal}
                        defaultValue={strVal}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors w-32"
                        onBlur={e => { if (e.target.value !== strVal) saveSetting(key, e.target.value) }}
                      />
                    )}
                    {saving === key && <span className="text-xs text-muted-foreground">Saving…</span>}
                    {saved === key && <span className="text-xs text-green-600">✓ Saved</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Affiliate settings */}
      {affiliateSettings && (
        <div className="et-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <h2 className="font-semibold text-navy-500">Global Pathways affiliate settings</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Default destination URL</label>
              <input
                defaultValue={affiliateSettings.default_destination_url}
                className={inputClass}
                onBlur={e => {
                  if (e.target.value !== affiliateSettings.default_destination_url)
                    saveAffiliateSettings({ default_destination_url: e.target.value })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default payout amount (USD)</label>
              <input
                type="number"
                step="0.01"
                defaultValue={affiliateSettings.default_payout_amount}
                className={cn(inputClass, 'w-40')}
                onBlur={e => {
                  const val = parseFloat(e.target.value)
                  if (val !== affiliateSettings.default_payout_amount)
                    saveAffiliateSettings({ default_payout_amount: val })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default CTA text (lessons)</label>
              <input
                defaultValue={affiliateSettings.cta_default_text}
                className={inputClass}
                onBlur={e => {
                  if (e.target.value !== affiliateSettings.cta_default_text)
                    saveAffiliateSettings({ cta_default_text: e.target.value })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Default CTA text (events)</label>
              <input
                defaultValue={affiliateSettings.cta_default_text_event}
                className={inputClass}
                onBlur={e => {
                  if (e.target.value !== affiliateSettings.cta_default_text_event)
                    saveAffiliateSettings({ cta_default_text_event: e.target.value })
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Allow tables to customize CTA text</p>
                <p className="text-xs text-muted-foreground">Table admins can change the CTA wording (not the URL)</p>
              </div>
              <select
                defaultValue={affiliateSettings.allow_table_cta_customization ? 'true' : 'false'}
                onChange={e => saveAffiliateSettings({ allow_table_cta_customization: e.target.value === 'true' })}
                className="rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-blue-600 transition-colors"
              >
                <option value="false">Restricted</option>
                <option value="true">Allowed</option>
              </select>
            </div>
            {saved === 'affiliate' && <p className="text-xs text-green-600">✓ Affiliate settings saved</p>}
          </div>
        </div>
      )}
    </div>
  )
}
