import { PageHeaderSkeleton, MemberRowSkeleton } from '@/components/common/LoadingSkeleton'

export default function MembersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="et-card divide-y divide-border overflow-hidden animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <MemberRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
