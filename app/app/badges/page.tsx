import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { firstOf } from '@/lib/utils/firstOf'

export const metadata = { title: 'My Badges' }

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const [{ data: earnedRows }, { data: allBadges }, { data: pointsTotal }] = await Promise.all([
    supabase
      .from('user_badges')
      .select('earned_at, table_id, badges(*), equity_tables(name)')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false }),
    supabase.from('badges').select('*').eq('active', true).order('points', { ascending: false }),
    supabase.from('points_ledger').select('points').eq('user_id', user.id),
  ])

  const totalXP = (pointsTotal || []).reduce((sum, r) => sum + r.points, 0)

  const earned = (earnedRows || []).map(r => ({
    ...(firstOf(r.badges) as { id: string; name: string; slug: string; description: string | null; icon: string | null; points: number }),
    earned_at: r.earned_at,
    table_name: (firstOf(r.equity_tables) as { name: string } | null)?.name ?? null,
  }))

  const available = (allBadges || []).map(b => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description,
    icon: b.icon,
    points: b.points,
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-500 tracking-tight">My badges</h1>
          <p className="text-muted-foreground mt-1">{earned.length} earned · {totalXP.toLocaleString()} XP total</p>
        </div>
        <div className="et-card px-5 py-4 text-center">
          <div className="font-display text-3xl font-bold text-gold-400">{totalXP.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Total XP</div>
        </div>
      </div>

      <BadgeGrid earned={earned} available={available} showLocked />
    </div>
  )
}
