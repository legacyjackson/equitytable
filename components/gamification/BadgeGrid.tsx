'use client'

import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'

interface BadgeWithEarned {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  points: number
  earned_at?: string | null
  table_name?: string | null
}

interface BadgeGridProps {
  earned: BadgeWithEarned[]
  available?: BadgeWithEarned[]
  showLocked?: boolean
}

export function BadgeGrid({ earned, available = [], showLocked = true }: BadgeGridProps) {
  const earnedIds = new Set(earned.map(b => b.id))
  const locked = showLocked ? available.filter(b => !earnedIds.has(b.id)) : []

  return (
    <div className="space-y-6">
      {/* Earned */}
      {earned.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-navy-500 mb-3">
            Earned badges <span className="text-muted-foreground font-normal text-base">({earned.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earned.map(badge => (
              <div
                key={badge.id + (badge.earned_at || '')}
                className="et-card p-4 text-center hover:shadow-et-card-hover transition-shadow group"
              >
                <div className="text-3xl mb-2">{badge.icon || '🏅'}</div>
                <p className="text-sm font-semibold text-navy-500 leading-snug mb-0.5">{badge.name}</p>
                {badge.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{badge.description}</p>
                )}
                <div className="mt-2.5 flex items-center justify-center gap-1.5">
                  <span className="badge-pill bg-gold-50 text-gold-600">+{badge.points} XP</span>
                </div>
                {badge.earned_at && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">{formatDate(badge.earned_at, 'MMM d, yyyy')}</p>
                )}
                {badge.table_name && (
                  <p className="text-[10px] text-muted-foreground">{badge.table_name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked / available */}
      {locked.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-navy-500 mb-3">
            Still to earn <span className="text-muted-foreground font-normal text-base">({locked.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {locked.map(badge => (
              <div
                key={badge.id}
                className="et-card p-4 text-center opacity-50"
              >
                <div className="text-3xl mb-2 grayscale">{badge.icon || '🏅'}</div>
                <p className="text-sm font-semibold text-navy-500 leading-snug mb-0.5">{badge.name}</p>
                {badge.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{badge.description}</p>
                )}
                <div className="mt-2.5">
                  <span className="badge-pill bg-muted text-muted-foreground">+{badge.points} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earned.length === 0 && (
        <div className="et-card p-10 text-center">
          <div className="text-4xl mb-3">🏅</div>
          <p className="font-display text-lg font-semibold text-navy-500 mb-1">No badges yet</p>
          <p className="text-sm text-muted-foreground">Complete lessons, attend events, and build goals to earn badges.</p>
        </div>
      )}
    </div>
  )
}
