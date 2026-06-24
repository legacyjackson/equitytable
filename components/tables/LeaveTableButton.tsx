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
      title="Leave table"
      className={cn(
        'rounded-full bg-white/90 shadow-md w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-white transition-colors disabled:opacity-50',
        className
      )}
    >
      {loading ? '…' : '✕'}
    </button>
  )
}
