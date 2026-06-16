'use client'

import { cn } from '@/lib/utils/cn'

interface LeaderboardEntry {
  user_id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  total_points: number
  badges_count: number
  lessons_completed: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  enabled: boolean
}

export function Leaderboard({ entries, currentUserId, enabled }: LeaderboardProps) {
  if (!enabled) {
    return (
      <div className="et-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Leaderboard is disabled for this table.</p>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="et-card p-8 text-center">
        <div className="text-3xl mb-2">🏆</div>
        <p className="text-muted-foreground text-sm">Complete lessons and earn badges to appear here.</p>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="et-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-navy-500">Table leaderboard</h3>
        <span className="text-xs text-muted-foreground">XP points</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry, i) => {
          const isCurrentUser = entry.user_id === currentUserId
          const rank = i + 1

          return (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5',
                isCurrentUser && 'bg-blue-50'
              )}
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {rank <= 3
                  ? <span className="text-lg">{medals[rank - 1]}</span>
                  : <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                }
              </div>

              {/* Avatar */}
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0',
                isCurrentUser ? 'bg-blue-600' : 'bg-navy-400'
              )}>
                {entry.avatar_url
                  ? <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  : (entry.full_name || entry.username || '?').charAt(0).toUpperCase()
                }
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-semibold truncate', isCurrentUser ? 'text-blue-700' : 'text-navy-500')}>
                  {entry.full_name || entry.username || 'Member'}
                  {isCurrentUser && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">You</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.badges_count} badge{entry.badges_count !== 1 ? 's' : ''} · {entry.lessons_completed} lesson{entry.lessons_completed !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <div className="text-base font-display font-bold text-navy-500">{entry.total_points.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
