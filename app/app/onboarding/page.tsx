'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

const FINANCIAL_INTERESTS = [
  'Budgeting', 'Credit building', 'Debt reduction', 'Saving',
  'Investing basics', 'Retirement planning', 'Homeownership',
  'Business finance', 'Estate planning', 'Legacy planning',
  'Faith & finance', 'Family finance', 'Youth financial literacy',
]

const TABLE_TYPE_PREVIEWS = [
  { emoji: '👨‍👩‍👧‍👦', name: 'Family & Friends', desc: 'Build generational wealth together' },
  { emoji: '🏛️', name: 'CBO / Nonprofit', desc: 'Serve your community' },
  { emoji: '✝️', name: 'Faith Community', desc: 'Stewardship and purpose' },
  { emoji: '💼', name: 'Business', desc: 'Grow your venture' },
  { emoji: '🎓', name: 'Youth / School', desc: 'Educate the next generation' },
  { emoji: '👥', name: 'Other', desc: 'Any community that learns together' },
]

type Step = 'welcome' | 'profile' | 'interests' | 'intent' | 'done'
const STEPS: Step[] = ['welcome', 'profile', 'interests', 'intent', 'done']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [location, setLocation] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [intent, setIntent] = useState<'create' | 'join' | 'explore' | ''>('')

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const saveAndContinue = async (nextStep: Step) => {
    setError(null)

    if (step === 'profile') {
      if (!fullName.trim()) { setError('Please enter your name.'); return }
      if (!username.trim() || username.length < 3) { setError('Username must be at least 3 characters.'); return }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) { setError('Username can only use letters, numbers, underscores, and dashes.'); return }
    }

    setStep(nextStep)
  }

  const complete = async () => {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    // Check username availability
    if (username.trim()) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .neq('id', user.id)
        .maybeSingle()

      if (existing) {
        setError('That username is taken. Choose another.')
        setStep('profile')
        setLoading(false)
        return
      }
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || undefined,
        username: username.trim() || undefined,
        location: location.trim() || undefined,
        financial_interests: selectedInterests,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    // If they want to create a table, send them there
    if (intent === 'create') {
      router.push('/create-table')
    } else {
      router.push('/app')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 via-navy-400 to-blue-800 flex flex-col items-center justify-center p-4">
      {/* Logo — dark-bg on navy gradient background */}
      <div className="mb-8">
        <Logo variant="dark-bg" size="md" />
      </div>

      {/* Progress bar */}
      {step !== 'welcome' && step !== 'done' && (
        <div className="w-full max-w-md mb-4">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white/50">{stepIndex} of {STEPS.length - 2} steps</span>
            <span className="text-xs text-white/50">{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── WELCOME ──────────────────────────────────────────── */}
        {step === 'welcome' && (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">🪑</div>
            <h1 className="font-display text-2xl font-bold text-navy-500 mb-3">
              Welcome to Equity Table
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-2">
              You're one step away from building wealth with the people you trust.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Let's set up your profile — it takes about 60 seconds.
            </p>
            <button
              onClick={() => setStep('profile')}
              className="w-full rounded-xl bg-navy-500 py-3.5 text-sm font-bold text-white hover:bg-navy-600 transition-colors"
            >
              Get started →
            </button>
          </div>
        )}

        {/* ── PROFILE ──────────────────────────────────────────── */}
        {step === 'profile' && (
          <div className="p-8">
            <h2 className="font-display text-xl font-bold text-navy-500 mb-1">Your profile</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This is how you'll appear to other members in your Equity Tables.
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full name <span className="text-red-500">*</span></label>
                <input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Username <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="yourname"
                    className="w-full rounded-lg border border-border pl-8 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Letters, numbers, underscores, dashes only.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Location <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="City, State"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => saveAndContinue('interests')}
              className="w-full mt-6 rounded-xl bg-navy-500 py-3.5 text-sm font-bold text-white hover:bg-navy-600 transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {/* ── INTERESTS ────────────────────────────────────────── */}
        {step === 'interests' && (
          <div className="p-8">
            <h2 className="font-display text-xl font-bold text-navy-500 mb-1">
              What are you here to learn?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Select any topics you're interested in. We'll use these to personalize your course recommendations.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {FINANCIAL_INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border',
                    selectedInterests.includes(interest)
                      ? 'bg-navy-500 text-white border-navy-500'
                      : 'border-border hover:border-navy-300 hover:bg-navy-50'
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('profile')}
                className="rounded-xl border border-border px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => saveAndContinue('intent')}
                className="flex-1 rounded-xl bg-navy-500 py-3 text-sm font-bold text-white hover:bg-navy-600 transition-colors"
              >
                {selectedInterests.length > 0
                  ? `Continue with ${selectedInterests.length} topic${selectedInterests.length > 1 ? 's' : ''} →`
                  : 'Skip for now →'
                }
              </button>
            </div>
          </div>
        )}

        {/* ── INTENT ───────────────────────────────────────────── */}
        {step === 'intent' && (
          <div className="p-8">
            <h2 className="font-display text-xl font-bold text-navy-500 mb-1">
              What do you want to do?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              We'll take you there right after this.
            </p>

            <div className="space-y-3 mb-6">
              {[
                {
                  value: 'create' as const,
                  icon: '🪑',
                  label: 'Start an Equity Table',
                  desc: 'Set up your own table and invite people',
                },
                {
                  value: 'join' as const,
                  icon: '🔗',
                  label: "I have an invitation",
                  desc: 'Someone invited me to join their table',
                },
                {
                  value: 'explore' as const,
                  icon: '🌐',
                  label: 'Explore first',
                  desc: 'Browse the platform, decide later',
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setIntent(opt.value)}
                  className={cn(
                    'w-full text-left rounded-xl border-2 p-4 transition-all',
                    intent === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-border hover:border-blue-200 hover:bg-blue-50/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className={cn('font-semibold', intent === opt.value ? 'text-blue-700' : 'text-navy-500')}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {intent === opt.value && (
                      <span className="ml-auto text-blue-600 font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('interests')}
                className="rounded-xl border border-border px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={complete}
                disabled={!intent || loading}
                className={cn(
                  'flex-1 rounded-xl py-3 text-sm font-bold text-white transition-colors',
                  intent
                    ? 'bg-navy-500 hover:bg-navy-600'
                    : 'bg-muted text-muted-foreground cursor-not-allowed',
                  loading && 'opacity-60'
                )}
              >
                {loading ? 'Setting up…' : 'Finish setup →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip link */}
      {step !== 'welcome' && step !== 'done' && (
        <button
          onClick={complete}
          className="mt-4 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Skip onboarding
        </button>
      )}
    </div>
  )
}
