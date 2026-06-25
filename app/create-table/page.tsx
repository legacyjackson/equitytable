'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand/Logo'
import { createTableSchema, type CreateTableInput } from '@/lib/validations'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<typeof TABLE_TYPES[0] | null>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [additionalSeats, setAdditionalSeats] = useState(0)
  const [userStats, setUserStats] = useState<{
    tablesOwned: number
    memberOfCount: number
    hasActiveSubscription: boolean
    canCreate: boolean
    unlimitedTables: boolean
  } | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CreateTableInput>({
    resolver: zodResolver(createTableSchema),
    defaultValues: { visibility: 'public' },
  })

  const name = watch('name')
  const totalSeats = 10 + additionalSeats
  const extraSeatsCost = additionalSeats * 4.99
  const FREE_TABLES_PER_SUBSCRIPTION = 3
  const isFreeBase = !!userStats?.unlimitedTables || (!!userStats?.hasActiveSubscription && (userStats?.tablesOwned ?? 0) < FREE_TABLES_PER_SUBSCRIPTION)
  const totalMonthly = isFreeBase ? extraSeatsCost : 49.99 + extraSeatsCost

  // Load user's table stats on mount
  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Internal test/admin accounts exempt from the normal billing caps
    const { data: unlimitedRow } = await supabase
      .from('unlimited_table_access')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    const unlimitedTables = !!unlimitedRow

    // Count tables user OWNS
    const { data: ownedTables } = await supabase
      .from('equity_tables')
      .select('id')
      .eq('owner_id', user.id)

    const tablesOwned = ownedTables?.length || 0

    // Does the user have an active subscription on any table they own?
    let hasActiveSubscription = false
    if (tablesOwned > 0) {
      const { data: activeSub } = await supabase
        .from('subscriptions')
        .select('id')
        .in('table_id', ownedTables!.map((t) => t.id))
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      hasActiveSubscription = !!activeSub
    }

    // Count tables user is a MEMBER of (but doesn't own)
    const { data: memberTables } = await supabase
      .from('table_memberships')
      .select('table_id, role')
      .eq('user_id', user.id)
      .neq('role', 'owner')

    const memberOfCount = memberTables?.length || 0

    // Can create if:
    // - Unlimited test access, OR
    // - Member of < 3 tables (can join up to 3), OR
    // - They own at least 1 table (owners can create multiple, eventually paid)
    const canCreate = unlimitedTables || memberOfCount < 3 || tablesOwned > 0

    setUserStats({
      tablesOwned,
      memberOfCount,
      hasActiveSubscription,
      canCreate,
      unlimitedTables,
    })
  }

  const handleTypeSelect = async (type: typeof TABLE_TYPES[0]) => {
    if (!userStats?.canCreate) {
      setError('You are already a member of 3 tables. Please leave a table before creating a new one.')
      return
    }
    setError(null)

    const { data: typeRow, error: typeError } = await supabase
      .from('equity_table_types')
      .select('id')
      .eq('slug', type.id)
      .single()

    if (typeError || !typeRow) {
      setError('Could not load that table type. Please try again.')
      return
    }

    setSelectedType(type)
    setSelectedTypeId(typeRow.id)
    setStep(1)
  }

  const onSubmit = async (data: CreateTableInput) => {
    if (!selectedType || !selectedTypeId || !userStats) return
    setLoading(true)
    setError(null)

    try {
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableSetup: {
            ...data,
            table_type_id: selectedTypeId,
          },
          additionalSeats: additionalSeats,
        }),
      })

      const result = await checkoutRes.json()

      if (result.skipPayment) {
        // Create table directly
        const createRes = await fetch('/api/tables/create-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableSetup: result.tableSetup,
            userId: result.userId,
            additionalSeats: additionalSeats,
          }),
        })

        const tableData = await createRes.json()
        if (tableData.error) throw new Error(tableData.error)
        window.location.href = `/app/tables/${tableData.table_id}`
      } else if (result.url) {
        window.location.href = result.url
      } else {
        throw new Error(result.error || 'Something went wrong')
      }
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

              {!userStats?.canCreate && (
                <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700">
                  You are a member of {userStats?.memberOfCount} tables. Members can only join up to 3 tables. Please leave a table before creating a new one.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TABLE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type)}
                    disabled={!userStats?.canCreate}
                    className={cn(
                      'text-left p-4 rounded-xl border-2 border-border transition-all group',
                      userStats?.canCreate 
                        ? 'hover:border-blue-600 hover:bg-blue-50 cursor-pointer' 
                        : 'opacity-50 cursor-not-allowed'
                    )}
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

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Total seats (optional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">First 10 seats included. Extra seats at $4.99/month each</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={additionalSeats}
                      onChange={(e) => setAdditionalSeats(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <div className="text-right min-w-[80px]">
                      <p className="text-lg font-bold text-navy-500">{totalSeats}</p>
                      <p className="text-xs text-muted-foreground">total seats</p>
                    </div>
                  </div>
                  {additionalSeats > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      + ${extraSeatsCost.toFixed(2)}/month for {additionalSeats} extra seats
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mt-6 rounded-xl bg-[#F8FAFF] border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-500">
                      {isFreeBase ? 'Included with your subscription' : 'Equity Table subscription'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {totalSeats} seats ({additionalSeats > 0 ? `10 included + ${additionalSeats} extra` : '10 included'})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-navy-500">
                      {totalMonthly > 0 ? `$${totalMonthly.toFixed(2)}` : 'Free'}
                    </p>
                    {totalMonthly > 0 && <p className="text-xs text-muted-foreground">per month</p>}
                  </div>
                </div>
              </div>

              <input type="hidden" {...register('table_type_id')} value={selectedTypeId ?? ''} />

              <button
                type="submit"
                className="w-full mt-6 rounded-xl bg-navy-500 py-3.5 text-sm font-semibold text-white hover:bg-navy-600 transition-colors"
              >
                Continue to review →
              </button>
            </form>
          )}

          {/* Step 2: Review + checkout */}
          {step === 2 && selectedType && userStats && (
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
                <div>
                  <p className="text-xs text-muted-foreground">Total seats</p>
                  <p className="font-semibold text-navy-500">{totalSeats}</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-xl bg-[#F8FAFF] border border-border p-5 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Equity Table (10 seats included)</p>
                    <p className="text-sm font-bold text-navy-500">{isFreeBase ? 'Free' : '$49.99'}</p>
                  </div>
                  {additionalSeats > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Extra seats ({additionalSeats})</p>
                      <p className="text-sm font-bold text-navy-500">+${extraSeatsCost.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex items-center justify-between">
                    <p className="text-sm font-bold">Monthly total</p>
                    <p className="text-lg font-bold text-navy-500">
                      {totalMonthly > 0 ? `$${totalMonthly.toFixed(2)}` : 'Free'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {userStats.unlimitedTables
                    ? 'This account has unlimited table access. Extra seats are still billed separately.'
                    : isFreeBase
                      ? `This table is included in your subscription (tables ${userStats.tablesOwned + 1} of ${FREE_TABLES_PER_SUBSCRIPTION} free). Extra seats are still billed separately.`
                      : userStats.hasActiveSubscription
                        ? `You've used your ${FREE_TABLES_PER_SUBSCRIPTION} free tables. This table costs $49.99/month.`
                        : 'Your first table starts your $49.99/month subscription, which includes up to 3 tables.'}
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
                {loading
                  ? 'Setting up checkout…'
                  : totalMonthly > 0
                    ? `Proceed to checkout — $${totalMonthly.toFixed(2)}/month`
                    : 'Create table — Free'}
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
