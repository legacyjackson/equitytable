'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

export function LeaveTableButton({
  tableId,
  tableName,
  className,
}: {
  tableId: string
  tableName: string
  className?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleLeave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Leave ${tableName}? You'll need a new invite to rejoin.`)) return

    setLoading(true)
    const res = await fetch(`/api/tables/${tableId}/leave`, { method: 'POST' })
    const result = await res.json()

    if (!res.ok) {
      alert(result.error || 'Failed to leave table')
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <button
      onClick={handleLeave}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 shrink-0',
        className
      )}
    >
      {loading ? 'Leaving…' : 'Leave table'}
    </button>
  )
}
