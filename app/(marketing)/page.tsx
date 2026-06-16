import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

// ── Table type preview data ───────────────────────────────────
const tableTypes = [
  { emoji: '🏛️', name: 'CBO', desc: 'Community organizations' },
  { emoji: '✝️', name: 'Christian', desc: 'Finance ministries' },
  { emoji: '☪️', name: 'Muslim', desc: 'Islamic finance circles' },
  { emoji: '✡️', name: 'Jewish', desc: 'Giving and legacy groups' },
  { emoji: '👨‍👩‍👧‍👦', name: 'Family', desc: 'Generational wealth pods' },
  { emoji: '💼', name: 'Business', desc: 'Founders and teams' },
  { emoji: '🎓', name: 'Youth', desc: 'Schools and programs' },
  { emoji: '⚖️', name: 'Reentry', desc: 'Justice-impacted individuals' },
  { emoji: '💪', name: 'Workforce', desc: 'Employee groups and unions' },
  { emoji: '💍', name: "Women's Circle", desc: 'Wealth-building cohorts' },
]

// ── How it works steps ────────────────────────────────────────
const steps = [
  {
    step: '01',
    title: 'Create your table',
    desc: 'Choose your table type, set your mission, and invite who belongs at your table. $49.99/month, 10 seats included.',
  },
  {
    step: '02',
    title: 'Learn together',
    desc: 'Access 100+ financial literacy courses with read-along audio. Host Equity Events. Track what matters.',
  },
  {
    step: '03',
    title: 'Act when ready',
    desc: 'When members are ready to turn learning into action, your table\'s affiliate link connects them to Global Pathways — and your table earns a referral reward.',
  },
]

// ── What\'s inside stats ───────────────────────────────────────
const stats = [
  { value: '100+', label: 'Financial literacy courses' },
  { value: '15', label: 'Equity Table types' },
  { value: '10', label: 'Seats included at $49.99/mo' },
  { value: '$179.99', label: 'Affiliate reward per referral' },
]

export default function LandingPage() {
  return (
    <div className="bg-[#F8FAFF] min-h-screen">
      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-navy-100/20 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo variant="light-bg" size="sm" />
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-navy-400">
              <Link href="/pricing" className="hover:text-navy-500 transition-colors">Pricing</Link>
              <Link href="/how-it-works" className="hover:text-navy-500 transition-colors">How it works</Link>
              <Link href="/table-types" className="hover:text-navy-500 transition-colors">Table types</Link>
              <Link href="/equity-tables" className="hover:text-navy-500 transition-colors">Explore tables</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/sign-in"
                className="hidden sm:inline-flex text-sm font-semibold text-navy-500 hover:text-navy-700 px-3 py-2 rounded-lg hover:bg-navy-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors shadow-sm"
              >
                Start an Equity Table
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background treatment */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-500 to-navy-600" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, #2563EB 0%, transparent 60%),
                              radial-gradient(circle at 70% 80%, #C8A961 0%, transparent 50%)`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5">
              <span className="text-gold-400 text-xs font-bold uppercase tracking-widest">
                Financial Community Platform
              </span>
            </div>

            {/* Headline — the "seat at the table" concept */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Build wealth with the people{' '}
              <em className="not-italic text-gold-400">you trust.</em>
            </h1>

            <p className="text-lg md:text-xl text-blue-100/90 leading-relaxed mb-8 max-w-2xl">
              Equity Table helps families, organizations, ministries, businesses, and communities
              learn financial literacy together, host events, track shared goals,
              and take action when they're ready.
            </p>

            {/* Gold bar — signature element */}
            <div className="mb-8 flex items-center gap-3">
              <div className="h-0.5 w-12 rounded-full bg-gold-400" />
              <span className="text-sm text-blue-200/80 font-medium">
                You get to invite who you want to have a seat at your table.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-gold-400 px-7 py-4 text-base font-bold text-navy-500 hover:bg-gold-300 transition-colors shadow-lg hover:shadow-xl"
              >
                Start an Equity Table
              </Link>
              <Link
                href="/equity-tables"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur px-7 py-4 text-base font-semibold text-white hover:bg-white/15 transition-colors"
              >
                Explore table types
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-sm text-blue-200/70">
              $49.99/month · 10 seats included · No hidden fees
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <section className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-navy-500 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="mb-12 text-center">
          <div className="et-gold-bar mx-auto mb-4" />
          <h2 className="font-display text-4xl font-bold text-navy-500 mb-4">
            How Equity Table works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A simple model built on community, learning, and collective progress.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((s) => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-display font-bold text-navy-100 mb-4 select-none">
                {s.step}
              </div>
              <h3 className="text-xl font-display font-semibold text-navy-500 mb-3">
                {s.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Table types ─────────────────────────────────────── */}
      <section className="bg-navy-500 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="et-gold-bar mx-auto mb-4" />
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              There's a table for everyone
            </h2>
            <p className="text-blue-200 max-w-xl mx-auto">
              15 Equity Table types designed for the real communities people belong to.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {tableTypes.map((type) => (
              <div
                key={type.name}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center hover:bg-white/10 transition-colors group cursor-pointer"
              >
                <div className="text-2xl mb-2">{type.emoji}</div>
                <div className="text-sm font-semibold text-white mb-0.5 group-hover:text-gold-400 transition-colors">
                  {type.name}
                </div>
                <div className="text-xs text-blue-200/70">{type.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/table-types"
              className="inline-flex items-center text-sm font-semibold text-gold-400 hover:text-gold-300 transition-colors"
            >
              See all 15 table types →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Global Pathways CTA ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="bg-gradient-to-br from-navy-500 to-blue-700 rounded-3xl p-10 md:p-16 text-center">
          <div className="et-gold-bar mx-auto mb-6" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Learning is just the beginning.
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-3 text-[15px] leading-relaxed">
            When members are ready to turn education into a real financial plan,
            they can start a Global Pathway — and your table earns a referral reward
            for every member who takes that step.
          </p>
          <p className="text-gold-400 text-sm font-semibold mb-8">
            $179.99 affiliate reward per referred member · First month's fee
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-navy-500 hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start your Equity Table
          </Link>
        </div>
      </section>

      {/* ── Pricing preview ─────────────────────────────────── */}
      <section className="bg-white border-t border-border py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="et-gold-bar mx-auto mb-6" />
          <h2 className="font-display text-4xl font-bold text-navy-500 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mb-10">
            One plan. Grow it as your table grows.
          </p>

          <div className="rounded-2xl border border-border bg-[#F8FAFF] p-8 md:p-10 text-left shadow-et-card">
            <div className="flex items-end gap-2 mb-1">
              <span className="font-display text-5xl font-bold text-navy-500">$49.99</span>
              <span className="text-muted-foreground pb-2">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">Includes your first 10 seats</p>

            <ul className="space-y-3 mb-8">
              {[
                'Full course library (100+ financial literacy courses)',
                'Read-along audio for every lesson',
                'Equity Events — create, host, record',
                'Shared goals with progress tracking',
                'Message board and community features',
                'Your unique affiliate link for Global Pathways',
                'Badges, leaderboards, and gamification',
                'Public or private table profile page',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="text-blue-600 font-bold shrink-0 mt-0.5">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <p className="text-sm text-muted-foreground border-t border-border pt-5 mb-6">
              Need more members? Add seats for{' '}
              <span className="font-semibold text-navy-500">$4.99/month each</span>.
            </p>

            <Link
              href="/auth/sign-up"
              className="block text-center rounded-xl bg-navy-500 py-3.5 text-base font-semibold text-white hover:bg-navy-600 transition-colors shadow-sm"
            >
              Start an Equity Table
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Questions?{' '}
            <Link href="/pricing" className="text-blue-600 hover:underline font-medium">
              See full pricing details
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border bg-navy-500 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Logo variant="dark-bg" size="sm" className="mb-4" />
              <p className="text-sm text-blue-200/70 max-w-xs leading-relaxed">
                A financial literacy community platform.
                Learn together. Build together. Move when you're ready.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300/70 mb-3">Platform</p>
              <nav className="space-y-2">
                {[
                  ['Pricing', '/pricing'],
                  ['How it works', '/how-it-works'],
                  ['Table types', '/table-types'],
                  ['Explore tables', '/equity-tables'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="block text-sm text-blue-100/70 hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300/70 mb-3">Legal</p>
              <nav className="space-y-2">
                {[
                  ['Privacy', '/legal/privacy'],
                  ['Terms', '/legal/terms'],
                  ['Affiliate disclosure', '/legal/affiliate-disclosure'],
                  ['Financial disclaimer', '/legal/financial-education-disclaimer'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="block text-sm text-blue-100/70 hover:text-white transition-colors">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-blue-200/50">
              © {new Date().getFullYear()} Equity Table. All rights reserved.
            </p>
            <p className="text-xs text-blue-200/40 max-w-md text-right leading-relaxed">
              Equity Table provides financial literacy education only and does not offer personalized
              financial, investment, tax, or legal advice. See our{' '}
              <Link href="/legal/financial-education-disclaimer" className="underline hover:text-blue-200/60">
                financial education disclaimer
              </Link>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
