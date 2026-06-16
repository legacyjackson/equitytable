'use client'

import { useEffect } from 'react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-display text-xl font-bold text-navy-500 mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {error.message || 'An unexpected error occurred loading this page.'}
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-navy-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
