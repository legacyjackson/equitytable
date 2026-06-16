'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking service in production
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-display font-bold text-navy-500 mb-3">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-2 leading-relaxed">
          An unexpected error occurred. If this keeps happening, please contact support.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/app"
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
