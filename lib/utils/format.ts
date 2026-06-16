import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

// ── Currency ──────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency = 'USD',
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ── Dates ─────────────────────────────────────────────────────
export function formatDate(dateStr: string | Date, fmt = 'MMM d, yyyy'): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return format(date, fmt)
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | Date): string {
  return formatDate(dateStr, 'MMM d, yyyy · h:mm a')
}

export function formatRelativeTime(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    if (!isValid(date)) return '—'
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return '—'
  }
}

export function formatEventDate(startsAt: string, endsAt: string, timezone?: string): string {
  const start = parseISO(startsAt)
  const end = parseISO(endsAt)

  const isSameDay =
    format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')

  if (isSameDay) {
    return `${format(start, 'EEEE, MMMM d, yyyy')} · ${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

// ── Numbers ───────────────────────────────────────────────────
export function formatNumber(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  }
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatPercent(value: number, decimals = 0): string {
  return `${Number(value).toFixed(decimals)}%`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ── Strings ───────────────────────────────────────────────────
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - suffix.length).trim() + suffix
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => capitalize(word))
}
