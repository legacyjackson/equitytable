'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function TableError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Table error:', error)
  }, [error])

  return (
    <div className="et-card p-12 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h2 className="font-display text-xl font-bold text-navy-500 mb-2">
        Couldn't load this table
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        {error.message || 'Something went wrong loading this Equity Table.'}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="rounded-xl bg-navy-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/app"
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          My tables
        </Link>
      </div>
    </div>
  )
}
