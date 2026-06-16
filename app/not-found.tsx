import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <Logo variant="light-bg" size="md" />
      </div>

      <div className="max-w-md">
        <div className="text-7xl font-display font-bold text-navy-100 mb-2 select-none">404</div>
        <h1 className="text-2xl font-display font-bold text-navy-500 mb-3">
          This page doesn't exist
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for may have moved, or it never existed.
          Let's get you back to your table.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="rounded-xl bg-navy-500 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-border px-6 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
