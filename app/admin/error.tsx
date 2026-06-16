'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('Admin error:', error) }, [error])

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-display text-xl font-bold text-navy-500 mb-2">Admin page error</h2>
        <p className="text-muted-foreground text-sm mb-6">{error.message || 'Something went wrong.'}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="rounded-lg bg-navy-500 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
            Try again
          </button>
          <Link href="/admin" className="rounded-lg border border-border px-5 py-2 text-sm hover:bg-muted transition-colors">
            Admin home
          </Link>
        </div>
      </div>
    </div>
  )
}
