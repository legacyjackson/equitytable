

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'

// Server component wrapper
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: badges } = await supabase
    .from('user_badges')
    .select('*, badges(name, slug, icon, description, points)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  const { data: pointsData } = await supabase
    .from('points_ledger')
    .select('points')
    .eq('user_id', user.id)

  const totalPoints = pointsData?.reduce((sum, row) => sum + (row.points ?? 0), 0) ?? 0

  return <ProfileClient profile={profile} badges={badges ?? []} totalPoints={totalPoints} />
}

// Client component for interactive form
function ProfileClient({
  profile,
  badges,
  totalPoints,
}: {
  profile: any
  badges: any[]
  totalPoints: number
}) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      username: profile?.username ?? '',
      bio: profile?.bio ?? '',
      location: profile?.location ?? '',
      public_profile: profile?.public_profile ?? false,
    },
  })

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `avatars/${profile.id}/${Date.now()}.${ext}`

      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('Avatar upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: UpdateProfileInput) => {
    setSaving(true)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (error) throw error
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Profile save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">Your profile</h1>
        <p className="text-muted-foreground mt-1">Manage how you appear to your table members.</p>
      </div>

      {/* Avatar */}
      <div className="et-card p-6">
        <h2 className="font-display font-semibold text-navy-500 mb-4">Profile photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center text-2xl font-bold text-navy-500 border-2 border-border">
                {(profile?.full_name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-white text-xs">Uploading…</span>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload photo'}
            </button>
            <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG, or WebP · Max 5MB</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="et-card p-6">
        <h2 className="font-display font-semibold text-navy-500 mb-5">Profile details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
              <input
                {...register('full_name')}
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                  errors.full_name ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  {...register('username')}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 pl-7 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                    errors.username ? 'border-red-300' : 'border-border'
                  )}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Share a bit about yourself and your financial journey"
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors resize-none',
                errors.bio ? 'border-red-300' : 'border-border'
              )}
            />
            {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
            <input
              {...register('location')}
              placeholder="City, State"
              className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Public profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Let anyone view your profile page and badges
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" {...register('public_profile')} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-border peer-checked:bg-blue-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              ✓ Profile saved successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !isDirty}
            className="w-full rounded-lg bg-navy-500 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="et-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy-500">Badges earned</h2>
            <span className="badge-pill bg-gold-100 text-gold-700">
              {totalPoints} XP
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((ub: any) => {
              const b = ub.badges
              return (
                <div key={ub.id} className="rounded-xl border border-border bg-muted/30 p-3 text-center">
                  <div className="text-3xl mb-1.5">{b?.icon ?? '🏅'}</div>
                  <p className="text-xs font-semibold text-navy-500 leading-tight">{b?.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">+{b?.points} XP</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
