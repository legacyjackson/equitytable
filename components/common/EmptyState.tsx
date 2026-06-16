import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizeMap = {
    sm: { wrapper: 'py-10', icon: 'text-3xl mb-2', title: 'text-base', desc: 'text-xs' },
    md: { wrapper: 'py-14', icon: 'text-4xl mb-3', title: 'text-lg', desc: 'text-sm' },
    lg: { wrapper: 'py-20', icon: 'text-5xl mb-4', title: 'text-xl', desc: 'text-sm' },
  }
  const s = sizeMap[size]

  return (
    <div className={cn('et-card text-center', s.wrapper, className)}>
      {icon && <div className={s.icon}>{icon}</div>}
      <h3 className={cn('font-display font-semibold text-navy-500 mb-1.5', s.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-muted-foreground leading-relaxed max-w-sm mx-auto mb-5', s.desc)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
