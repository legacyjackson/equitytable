import { Skeleton } from '@/components/common/LoadingSkeleton'

export default function LessonLoading() {
  return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      {/* Back + progress */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="flex-1 h-1.5 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Audio player */}
      <Skeleton className="h-16 rounded-xl w-full" />

      {/* Content blocks */}
      <div className="et-card p-6 space-y-4">
        <Skeleton className="h-6 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-6 w-1/2 mt-6" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  )
}
