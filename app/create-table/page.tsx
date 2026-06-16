'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { createTableSchema, type CreateTableInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'

// Table type options — matches seed data
const TABLE_TYPES = [
  { id: 'cbo', emoji: '🏛️', name: 'CBO', desc: 'Community-based organizations and nonprofits' },
  { id: 'christian', emoji: '✝️', name: 'Christian', desc: 'Finance ministries and church groups' },
  { id: 'muslim', emoji: '☪️', name: 'Muslim', desc: 'Islamic finance circles and study groups' },
  { id: 'jewish', emoji: '✡️', name: 'Jewish', desc: 'Giving, legacy, and stewardship groups' },
  { id: 'common-interest', emoji: '🌐', name: 'Common Interest', desc: 'General interest groups' },
  { id: 'family-and-friends', emoji: '👨‍👩‍👧‍👦', name: 'Family & Friends', desc: 'Generational wealth pods and family circles' },
  { id: 'business', emoji: '💼', name: 'Business', desc: 'Founders, teams, and entrepreneurs' },
  { id: 'school-youth', emoji: '🎓', name: 'School / Youth', desc: 'Schools, programs, and student groups' },
  { id: 'workforce', emoji: '🏗️', name: 'Workforce', desc: 'Employee groups, unions, and professional associations' },
  { id: 'reentry', emoji: '⚖️', name: 'Reentry', desc: 'Justice-impacted individuals and organizations' },
  { id: 'womens-wealth', emoji: '💪', name: "Women's Wealth Circle", desc: 'Women-led wealth-building cohorts' },
  { id: 'first-gen', emoji: '🌱', name: 'First-Generation', desc: 'First-generation wealth builders' },
  { id: 'investor-club', emoji: '📈', name: 'Investor Club', desc: 'Investment education and study groups' },
  { id: 'greek-alumni', emoji: '🎭', name: 'Greek / Alumni', desc: 'Fraternities, sororities, and alumni networks' },
  { id: 'faith-based', emoji: '🕊️', name: 'Faith-Based (General)', desc: 'Spiritual and religious communities' },
]

const STEPS = ['Choose type', 'Table details', 'Review']

export default function CreateTablePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<typeof TABLE_TYPES[0] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateTableInput>({
    resolver: zodResolver(createTableSchema),
    defaultValues: { visibility: 'public' },
  })

  const name = watch('name')

  const handleTypeSelect = (type: typeof TABLE_TYPES[0]) => {
    setSelectedType(type)
    setStep(1)
  }

  const onSubmit = async (data: CreateTableInput) => {
    if (!selectedType) return
    setLoading(true)
    setError(null)

    try {
      // We need the actual UUID for the table type — fetch it
      const response = await fetch('/api/table-types/' + selectedType.id)
      const typeData = await response.json()

      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSetup: {
            ...data,
            table_type_id: typeData.id,
          },
        }),
      })

      const { url, error: checkoutError } = await checkoutRes.json()

      if (checkoutError) throw new Error(checkoutError)
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-navy-600 py-10 px-4">
      <div className="max-w-2xl mx-auto w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="dark-bg" size="md" />
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i <= step ? 'bg-gold-400 text-navy-500' : 'bg-white/20 text-white/50'
              )}>
                {i + 1}
              </div>
              <span className={cn(
                'text-xs font-medium transition-colors',
                i === step ? 'text-white' : 'text-white/50'
              )}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('w-8 h-0.5 rounded', i < step ? 'bg-gold-400' : 'bg-white/20')} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Step 0: Choose type */}
          {step === 0 && (
            <div className="p-8">
              <h1 className="font-display text-2xl font-bold text-navy-500 mb-2">
                What kind of Equity Table are you building?
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                This shapes your recommended courses, goals, and content.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TABLE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    className="text-left p-4 rounded-xl border-2 border-border hover:border-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{type.emoji}</span>
                      <span className="font-semibold text-navy-500 group-hover:text-blue-700">
                        {type.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Table details */}
          {step === 1 && selectedType && (
            <form onSubmit={handleSubmit(() => setStep(2))} className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedType.emoji}</span>
                  <span className="font-medium text-navy-500">{selectedType.name}</span>
                </div>
              </div>

              <h1 className="font-display text-2xl font-bold text-navy-500 mb-6">
                Tell us about your table
              </h1>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Table name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="e.g. The Johnson Family Wealth Circle"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none',
                      'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                      errors.name ? 'border-red-300' : 'border-border'
                    )}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Mission statement <span className="text-red-500">*</span>
                    <span className="text-muted-foreground font-normal ml-2">(shown publicly if table is public)</span>
                  </label>
                  <textarea
                    {...register('mission')}
                    rows={3}
                    placeholder="Why does your table exist? What are you building together?"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none resize-none',
                      'focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors',
                      errors.mission ? 'border-red-300' : 'border-border'
                    )}
                  />
                  {errors.mission && <p className="mt-1 text-xs text-red-600">{errors.mission.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Visibility
                  </label>
                  <select
                    {...register('visibility')}
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-colors"
                  >
                    <option value="public">Public — anyone can see your table profile</option>
                    <option value="private">Private — only members can see content</option>
                    <option value="invite_only">Invite only — members join by invitation only</option>
                  </select>
                </div>
              </div>

              {/* Price */}
              <div className="mt-6 rounded-xl bg-[#F8FAFF] border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-500">Equity Table subscription</p>
                    <p className="text-xs text-muted-foreground mt-0.5">10 seats included · Add more at $4.99/seat</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-navy-500">$49.99</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>
              </div>

              <input type="hidden" {...register('table_type_id')} value={selectedType.id} />

              <button
                type="submit"
                className="w-full mt-6 rounded-xl bg-navy-500 py-3.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                Continue to review →
              </button>
            </form>
          )}

          {/* Step 2: Review + checkout */}
          {step === 2 && selectedType && (
            <div className="p-8">
              <button
                onClick={() => setStep(1)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm mb-6 block"
              >
                ← Back
              </button>

              <h1 className="font-display text-2xl font-bold text-navy-500 mb-6">
                Review your table
              </h1>

              <div className="rounded-xl border border-border p-5 space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <span>{selectedType.emoji}</span>
                  <span className="font-semibold text-navy-500">{selectedType.name}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Table name</p>
                  <p className="font-semibold text-navy-500">{name || '—'}</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-xl bg-[#F8FAFF] border border-border p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Equity Table — Monthly</p>
                  <p className="text-sm font-bold text-navy-500">$49.99</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  10 seats included. You'll be taken to Stripe's secure checkout to enter your payment details.
                  Cancel anytime.
                </p>
              </div>

              <button
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className={cn(
                  'w-full rounded-xl bg-gold-400 py-4 text-base font-bold text-navy-500',
                  'hover:bg-gold-300 transition-colors',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {loading ? 'Setting up checkout…' : 'Proceed to checkout — $49.99/month'}
              </button>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Secured by Stripe. Cancel anytime from your billing settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
