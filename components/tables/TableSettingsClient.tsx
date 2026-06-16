'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { updateTableSchema, type UpdateTableInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'

interface TableSettingsClientProps {
  table: any
  tableId: string
  isOwner: boolean
}

export function TableSettingsClient({ table, tableId, isOwner }: TableSettingsClientProps) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(table.logo_url)
  const [bannerUrl, setBannerUrl] = useState<string | null>(table.banner_url)
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateTableInput>({
    resolver: zodResolver(updateTableSchema),
    defaultValues: {
      name: table.name,
      mission: table.mission ?? '',
      description: table.description ?? '',
      visibility: table.visibility,
      public_message_board: table.public_message_board,
      leaderboard_enabled: table.leaderboard_enabled,
      allow_public_goals: table.allow_public_goals,
      allow_public_events: table.allow_public_events,
      publish_affiliate_earnings: table.publish_affiliate_earnings,
    },
  })

  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    setUploading(type)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${type}s/${tableId}/${Date.now()}.${ext}`
      const bucket = type === 'logo' ? 'banners' : 'banners'

      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      const field = type === 'logo' ? 'logo_url' : 'banner_url'
      await supabase.from('equity_tables').update({ [field]: publicUrl }).eq('id', tableId)

      if (type === 'logo') setLogoUrl(publicUrl)
      else setBannerUrl(publicUrl)
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setUploading(null)
    }
  }

  const onSubmit = async (data: UpdateTableInput) => {
    setSaving(true)
    setSuccess(false)
    try {
      const supabase = createClient()
      await supabase.from('equity_tables').update({ ...data, updated_at: new Date().toISOString() }).eq('id', tableId)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const ToggleRow = ({ label, sub, field }: { label: string; sub: string; field: keyof UpdateTableInput }) => (
    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" {...register(field as any)} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-blue-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
      </label>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Branding */}
      <div className="et-card p-6 space-y-5">
        <h2 className="font-display font-semibold text-navy-500">Branding</h2>

        <div className="flex items-start gap-5">
          {/* Logo */}
          <div className="shrink-0">
            <p className="text-xs font-medium text-muted-foreground mb-2">Logo</p>
            <label className="cursor-pointer block">
              <input
                type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')}
              />
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-navy-400 transition-colors flex items-center justify-center overflow-hidden bg-muted/30 relative">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-muted-foreground">+</span>
                )}
                {uploading === 'logo' && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs">Uploading…</div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">Click to upload</p>
            </label>
          </div>

          {/* Banner */}
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Banner image</p>
            <label className="cursor-pointer block">
              <input
                type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')}
              />
              <div className="h-20 rounded-xl border-2 border-dashed border-border hover:border-navy-400 transition-colors flex items-center justify-center overflow-hidden bg-muted/30 relative">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">+ Upload banner</span>
                )}
                {uploading === 'banner' && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs">Uploading…</div>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Profile */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="et-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-navy-500">Table profile</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Table name</label>
            <input {...register('name')} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mission statement</label>
            <textarea {...register('mission')} rows={2} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Visibility</label>
            <select {...register('visibility')} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600">
              <option value="public">Public — anyone can see your table profile</option>
              <option value="private">Private — only members can see content</option>
              <option value="invite_only">Invite only</option>
            </select>
          </div>
        </div>

        <div className="et-card p-6 space-y-3">
          <h2 className="font-display font-semibold text-navy-500">Community settings</h2>
          <ToggleRow label="Public message board" sub="Non-members can read public posts" field="public_message_board" />
          <ToggleRow label="Leaderboard" sub="Show member XP leaderboard within the table" field="leaderboard_enabled" />
          <ToggleRow label="Public goals" sub="Allow goals to be set as publicly visible" field="allow_public_goals" />
          <ToggleRow label="Public events" sub="Allow events to be set as publicly visible" field="allow_public_events" />
          <ToggleRow label="Show affiliate earnings" sub="Display referral stats on your public table profile" field="publish_affiliate_earnings" />
        </div>

        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✓ Settings saved.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !isDirty}
          className="w-full rounded-xl bg-navy-500 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
