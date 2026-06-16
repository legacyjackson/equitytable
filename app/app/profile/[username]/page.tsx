import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { formatDate } from '@/lib/utils/format'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('username', username)
    .maybeSingle()
  return {
    title: data?.full_name ? `${data.full_name} (@${data.username})` : `@${username}`,
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, bio, location, avatar_url, banner_url, public_profile, created_at, financial_interests')
    .eq('username', username)
    .maybeSingle()

  if (!profile || !profile.public_profile) notFound()

  // Check if current user is viewing their own profile
  const { data: { user } } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  // Load badges
  const [{ data: earnedRows }, { data: pointsTotal }] = await Promise.all([
    supabase
      .from('user_badges')
      .select('earned_at, badges(*)')
      .eq('user_id', profile.id)
      .order('earned_at', { ascending: false }),
    supabase
      .from('points_ledger')
      .select('points')
      .eq('user_id', profile.id),
  ])

  const totalXP = (pointsTotal || []).reduce((s, r) => s + r.points, 0)

  const earned = (earnedRows || []).map(r => ({
    ...(r.badges as { id: string; name: string; slug: string; description: string | null; icon: string | null; points: number }),
    earned_at: r.earned_at,
  }))

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Back navigation */}
      <div className="mb-6">
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Dashboard
        </Link>
      </div>

      {/* Banner */}
      <div className="relative mb-16">
        <div className={`h-40 rounded-2xl overflow-hidden ${profile.banner_url ? '' : 'bg-gradient-to-br from-navy-500 to-blue-700'}`}>
          {profile.banner_url && (
            <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl border-4 border-white bg-navy-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden shadow-lg">
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : (profile.full_name || profile.username || '?').charAt(0).toUpperCase()
            }
          </div>
        </div>

        {/* Edit button — own profile only */}
        {isOwnProfile && (
          <div className="absolute bottom-3 right-3">
            <Link
              href="/app/profile"
              className="rounded-lg border border-white/30 bg-white/20 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
            >
              Edit profile
            </Link>
          </div>
        )}
      </div>

      {/* Profile info */}
      <div className="px-1 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy-500">
              {profile.full_name || `@${profile.username}`}
            </h1>
            {profile.username && (
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
            )}
          </div>

          {/* XP badge */}
          {totalXP > 0 && (
            <div className="et-card px-4 py-2.5 text-center">
              <div className="font-display text-xl font-bold text-gold-400">{totalXP.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</div>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="text-foreground leading-relaxed mb-3">{profile.bio}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {profile.location && (
            <span className="flex items-center gap-1">
              <span>📍</span>
              {profile.location}
            </span>
          )}
          <span>Joined {formatDate(profile.created_at, 'MMMM yyyy')}</span>
        </div>

        {/* Financial interests */}
        {profile.financial_interests && profile.financial_interests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.financial_interests.map((interest: string) => (
              <span key={interest} className="badge-pill bg-blue-50 text-blue-700 text-xs">
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div>
        <h2 className="font-display text-lg font-semibold text-navy-500 mb-4">
          Badges {earned.length > 0 && <span className="text-muted-foreground font-normal">({earned.length})</span>}
        </h2>
        <BadgeGrid earned={earned} showLocked={false} />
      </div>
    </div>
  )
}
