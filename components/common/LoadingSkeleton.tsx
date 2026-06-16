import { cn } from '@/lib/utils/cn'

// ── Primitive skeleton block ──────────────────────────────────
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  )
}

// ── Card skeleton ─────────────────────────────────────────────
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('et-card p-5 space-y-3', className)}>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

// ── Page header skeleton ──────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

// ── Table row skeleton ────────────────────────────────────────
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// ── Course card skeleton ──────────────────────────────────────
export function CourseCardSkeleton() {
  return (
    <div className="et-card overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="p-5 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-1.5 w-full mt-3" />
      </div>
    </div>
  )
}

// ── Member row skeleton ───────────────────────────────────────
export function MemberRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <Skeleton className="w-9 h-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

// ── Dashboard stats skeleton ──────────────────────────────────
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="et-card p-5 space-y-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// ── Full page loading state ───────────────────────────────────
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
