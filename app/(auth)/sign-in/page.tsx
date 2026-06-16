'use client'

import { Suspense } from 'react'
import { SignInContent } from './content'

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading…</div>}>
      <SignInContent />
    </Suspense>
  )
}
