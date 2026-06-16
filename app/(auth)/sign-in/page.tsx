'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInSchema, type SignInInput } from '@/lib/validations'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/app'
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

  const onSubmit = async (data: SignInInput) => {
    setLoading(true)
    setServerError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setLoading(false)
      setServerError(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Try again.'
          : error.message
      )
      return
    }

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-400 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="dark-bg" size="lg" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-display font-semibold text-navy-500 mb-1">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Sign in to your Equity Table account.
          </p>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
                  'placeholder:text-muted-foreground',
                  'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10',
                  errors.email ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
                  'placeholder:text-muted-foreground',
                  'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10',
                  errors.password ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full rounded-lg bg-navy-500 py-2.5 text-sm font-semibold text-white',
                'hover:bg-navy-600 active:bg-navy-700 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'mt-2'
              )}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="font-semibold text-blue-600 hover:text-blue-700">
              Start an Equity Table
            </Link>
          </p>
        </div>

        {/* Financial disclaimer */}
        <p className="mt-6 text-center text-xs text-blue-200/70 max-w-xs mx-auto">
          Equity Table provides financial education only and does not offer personalized financial advice.{' '}
          <Link href="/legal/financial-education-disclaimer" className="underline hover:text-white">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  )
}
