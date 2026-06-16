import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'

interface EventCardProps {
  event: {
    id: string
    title: string
    description?: string | null
    event_type: string
    starts_at: string
    ends_at: string
    location_type: string
    meeting_url?: string | null
    address?: string | null
    status: string
    visibility: string
    capacity?: number | null
  }
  tableId: string
  rsvpCount?: number
  userRsvp?: string | null
  compact?: boolean
  className?: string
}

const LOCATION_ICONS: Record<string, string> = {
  online: '💻',
  in_person: '📍',
  hybrid: '🔀',
}

const TYPE_LABELS: Record<string, string> = {
  class: 'Class',
  workshop: 'Workshop',
  meetup: 'Meetup',
  webinar: 'Webinar',
  cohort: 'Cohort',
  other: 'Event',
}

const RSVP_STYLES: Record<string, string> = {
  going:     'bg-green-100 text-green-700',
  maybe:     'bg-amber-100 text-amber-700',
  not_going: 'bg-gray-100 text-gray-500',
}

export function EventCard({ event, tableId, rsvpCount, userRsvp, compact = false, className }: EventCardProps) {
  const startDate = new Date(event.starts_at)
  const isPast = startDate < new Date()
  const isCanceled = event.status === 'canceled'
  const day = startDate.getDate()
  const month = startDate.toLocaleString('default', { month: 'short' }).toUpperCase()
  const time = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <Link
      href={`/app/tables/${tableId}/events/${event.id}`}
      className={cn(
        'et-card flex gap-0 overflow-hidden hover:shadow-et-card-hover transition-all group',
        isCanceled && 'opacity-60',
        className
      )}
    >
      {/* Date column */}
      <div className={cn(
        'flex flex-col items-center justify-center px-4 py-5 shrink-0 border-r border-border',
        'w-20 text-center',
        isPast ? 'bg-muted' : 'bg-navy-50'
      )}>
        <span className={cn(
          'text-[10px] font-bold uppercase tracking-widest',
          isPast ? 'text-muted-foreground' : 'text-blue-600'
        )}>
          {month}
        </span>
        <span className={cn(
          'font-display text-3xl font-bold leading-none mt-0.5',
          isPast ? 'text-muted-foreground' : 'text-navy-500'
        )}>
          {day}
        </span>
        <span className="text-[11px] text-muted-foreground mt-1">{time}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <h3 className={cn(
            'font-semibold leading-snug transition-colors line-clamp-2 flex-1',
            isPast ? 'text-muted-foreground' : 'text-navy-500 group-hover:text-blue-700'
          )}>
            {event.title}
          </h3>
          {userRsvp && (
            <span className={cn('badge-pill text-[10px] shrink-0', RSVP_STYLES[userRsvp] || '')}>
              {userRsvp === 'going' ? '✅ Going' : userRsvp === 'maybe' ? '🤔 Maybe' : "Can't go"}
            </span>
          )}
        </div>

        {!compact && event.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {LOCATION_ICONS[event.location_type]}
            <span className="capitalize">{event.location_type.replace('_', ' ')}</span>
          </span>
          <span className="badge-pill bg-muted text-muted-foreground text-[10px]">
            {TYPE_LABELS[event.event_type] || event.event_type}
          </span>
          {rsvpCount !== undefined && (
            <span>{rsvpCount} RSVP{rsvpCount !== 1 ? 's' : ''}</span>
          )}
          {event.capacity && rsvpCount !== undefined && (
            <span className={cn(
              rsvpCount >= event.capacity ? 'text-red-500 font-semibold' : ''
            )}>
              {rsvpCount >= event.capacity ? '• Full' : `· ${event.capacity - rsvpCount} spots left`}
            </span>
          )}
          {isCanceled && (
            <span className="badge-pill bg-red-100 text-red-700 text-[10px]">Canceled</span>
          )}
          {isPast && !isCanceled && (
            <span className="badge-pill bg-muted text-muted-foreground text-[10px]">Past</span>
          )}
        </div>
      </div>
    </Link>
  )
}
