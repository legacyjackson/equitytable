
'use client'


export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signUpSchema, type SignUpInput } from '@/lib/validations'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

export default function SignUpPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

  const onSubmit = async (data: SignUpInput) => {
    setLoading(true)
    setServerError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setLoading(false)
      setServerError(
        error.message.includes('already registered')
          ? 'An account with that email already exists. Sign in instead.'
          : error.message
      )
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-400 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo variant="dark-bg" size="lg" />
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-display font-semibold text-navy-500 mb-2">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a confirmation link to your email address. Click it to activate your account and set up your first Equity Table.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Didn't get it? Check your spam folder, or{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-blue-600 hover:underline font-medium"
              >
                try again
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-400 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="dark-bg" size="lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-display font-semibold text-navy-500 mb-1">
            Start your Equity Table
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Build wealth with the people you trust.
          </p>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Full name
              </label>
              <input
                {...register('full_name')}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                className={cn(
                  'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors',
                  'placeholder:text-muted-foreground',
                  'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10',
                  errors.full_name ? 'border-red-300' : 'border-border'
                )}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
              )}
            </div>

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
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
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
                'w-full rounded-lg bg-navy-500 py-2.5 text-sm font-semibold text-white mt-2',
                'hover:bg-navy-600 active:bg-navy-700 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground text-center leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link href="/legal/terms" className="text-blue-600 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
          </p>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-blue-200/70 max-w-xs mx-auto">
          Equity Table provides financial education only.{' '}
          <Link href="/legal/financial-education-disclaimer" className="underline hover:text-white">
            Disclaimer
          </Link>
          {' '}·{' '}
          <Link href="/legal/affiliate-disclosure" className="underline hover:text-white">
            Affiliate disclosure
          </Link>
        </p>
      </div>
    </div>
  )
}
