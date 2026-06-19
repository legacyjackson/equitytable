import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Equity Table Types',
  description: 'Equity Table is built for 15 different community types — from CBOs and faith communities to families, businesses, and investor clubs.',
}

const TABLE_TYPES = [
  {
    emoji: '🏛️',
    name: 'CBO',
    fullName: 'Community-Based Organization',
    description: 'For nonprofits and community organizations serving their communities through financial literacy education and support.',
    goals: ['Enroll 100 community members', 'Host 12 financial literacy events', 'Help 20 members start Global Pathways'],
    color: 'from-blue-600 to-navy-500',
  },
  {
    emoji: '✝️',
    name: 'Christian',
    fullName: 'Christian Faith Community',
    description: 'For finance ministries and church groups. Includes Christian stewardship content, Faith & Finance framing, and biblical money principles.',
    goals: ['Launch a stewardship class series', 'Host monthly Faith & Finance events', 'Help families build household budgets'],
    color: 'from-indigo-600 to-blue-700',
    religious: true,
  },
  {
    emoji: '☪️',
    name: 'Muslim',
    fullName: 'Muslim Community',
    description: 'For Muslim groups. Includes Islamic finance content, riba-sensitive financial planning, halal investing principles, and zakat/sadaqah themes.',
    goals: ['Build a halal financial literacy circle', 'Host Islamic finance education sessions', 'Launch a zakat community support goal'],
    color: 'from-emerald-700 to-teal-700',
    religious: true,
  },
  {
    emoji: '✡️',
    name: 'Jewish',
    fullName: 'Jewish Community',
    description: 'For Jewish groups. Includes Jewish values around giving (tzedakah), stewardship, community responsibility, ethical money practices, and legacy.',
    goals: ['Create a legacy and giving circle', 'Teach ethical wealth-building', 'Fund a community education initiative'],
    color: 'from-blue-800 to-indigo-900',
    religious: true,
  },
  {
    emoji: '🌐',
    name: 'Common Interest',
    fullName: 'Common Interest Group',
    description: 'For general interest groups not covered by other categories. The broadest category — good for mixed groups building financial literacy together.',
    goals: ['Complete 100 lessons as a group', 'Build an emergency savings challenge', 'Host monthly money conversations'],
    color: 'from-slate-600 to-navy-500',
  },
  {
    emoji: '👨‍👩‍👧‍👦',
    name: 'Family & Friends',
    fullName: 'Family & Friends Circle',
    description: 'For families, friend circles, generational wealth groups, and private wealth-building pods. Private and intimate by nature.',
    goals: ['Buy a family home', 'Build a family emergency fund', 'Start a family investment club', 'Create a legacy plan'],
    color: 'from-rose-600 to-pink-700',
  },
  {
    emoji: '💼',
    name: 'Business',
    fullName: 'Business Group',
    description: 'For people starting, growing, or working within a business. Covers business finance, entrepreneurship, and employee financial wellness.',
    goals: ['Launch a product', 'Raise startup capital', 'Build a business emergency fund', 'Train employees on financial wellness'],
    color: 'from-amber-700 to-orange-700',
  },
  {
    emoji: '🎓',
    name: 'School / Youth',
    fullName: 'School & Youth Program',
    description: 'For schools, after-school programs, youth leadership programs, college readiness programs, and financial literacy clubs.',
    goals: ['Complete financial literacy basics', 'Launch a youth savings challenge', 'Host a student entrepreneurship fair'],
    color: 'from-violet-600 to-purple-700',
  },
  {
    emoji: '🏗️',
    name: 'Workforce',
    fullName: 'Workforce & Employee Group',
    description: 'For employee resource groups, workforce development programs, unions, municipal employee groups, and professional associations.',
    goals: ['Improve employee financial wellness', 'Increase retirement plan participation', 'Host lunch-and-learn Equity Events'],
    color: 'from-cyan-700 to-blue-700',
  },
  {
    emoji: '⚖️',
    name: 'Reentry',
    fullName: 'Reentry & Justice-Impacted',
    description: 'For organizations serving formerly incarcerated or justice-impacted individuals. Covers credit rebuilding, banking access, housing readiness, and employment.',
    goals: ['Help members open bank accounts', 'Build emergency savings', 'Complete financial readiness courses', 'Build credit and housing readiness'],
    color: 'from-teal-700 to-green-700',
  },
  {
    emoji: '💪',
    name: "Women's Wealth",
    fullName: "Women's Wealth Circle",
    description: 'For women-led wealth-building circles, entrepreneurship groups, and leadership cohorts. Built for collective power and shared progress.',
    goals: ['Build confidence around investing', 'Launch a business or side hustle fund', 'Host women-led wealth-building events'],
    color: 'from-fuchsia-600 to-pink-600',
  },
  {
    emoji: '🌱',
    name: 'First-Gen',
    fullName: 'First-Generation Wealth Builders',
    description: 'For first-generation investors, first-generation homeowners, and people building wealth without inherited financial education.',
    goals: ['Learn foundational financial concepts', 'Build first emergency fund', 'Start investing education', 'Prepare for homeownership'],
    color: 'from-lime-700 to-green-700',
  },
  {
    emoji: '📈',
    name: 'Investor Club',
    fullName: 'Investor Club',
    description: 'For groups learning about investing, portfolio basics, real estate, entrepreneurship, and collective wealth-building strategies.',
    goals: ['Complete investment education courses', 'Host market literacy sessions', 'Build a group investment thesis library'],
    color: 'from-navy-600 to-blue-600',
  },
  {
    emoji: '🎭',
    name: 'Greek / Alumni',
    fullName: 'Fraternity, Sorority & Alumni Group',
    description: 'For alumni networks, Greek organizations, and affinity groups building collective wealth and community investment.',
    goals: ['Create an alumni wealth circle', 'Fund scholarships', 'Host financial literacy events', 'Help members join Global Pathways'],
    color: 'from-red-700 to-rose-700',
  },
  {
    emoji: '🕊️',
    name: 'Faith-Based General',
    fullName: 'Faith-Based (General)',
    description: 'For religious or spiritual communities not specifically Christian, Muslim, or Jewish. Values-based financial education with stewardship framing.',
    goals: ['Host values-based money classes', 'Build community support fund', 'Teach stewardship and legacy planning'],
    color: 'from-sky-700 to-blue-700',
    religious: true,
  },
]

export default function TableTypesPage() {
  return (
    <div className="bg-[#F8FAFF] min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="light-bg" size="sm" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-semibold text-navy-500 hover:text-navy-700 px-3 py-2 rounded-lg hover:bg-navy-50 transition-colors">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">Start an Equity Table</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-navy-500 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="et-gold-bar mx-auto mb-5" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            There's a table for everyone
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            15 Equity Table types, each shaped for the real communities people belong to.
            Courses, goals, and content are tailored to your table's type.
          </p>
        </div>
      </div>

      {/* Religious note */}
      <div className="bg-gold-50 border-b border-gold-200 px-4 py-3">
        <p className="text-sm text-center text-gold-800 max-w-3xl mx-auto">
          <strong>Note on religious content:</strong> Faith-specific courses only appear for tables of matching types. Christian content won't show for Muslim tables, and vice versa. Religious content is always optional and clearly categorized.
        </p>
      </div>

      {/* Table types grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TABLE_TYPES.map(type => (
            <div key={type.name} className="et-card overflow-hidden hover:shadow-et-card-hover transition-shadow">
              {/* Color header */}
              <div className={`h-20 bg-gradient-to-br ${type.color} flex items-center gap-3 px-5`}>
                <span className="text-3xl">{type.emoji}</span>
                <div>
                  <div className="font-display font-bold text-white text-lg leading-tight">{type.name}</div>
                  <div className="text-white/70 text-xs">{type.fullName}</div>
                </div>
                {type.religious && (
                  <span className="ml-auto badge-pill bg-white/20 text-white text-[10px]">Faith content</span>
                )}
              </div>

              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{type.description}</p>

                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Suggested goals</p>
                  <ul className="space-y-1">
                    {type.goals.slice(0, 3).map((g, i) => (
                      <li key={i} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-blue-600 font-bold shrink-0">·</span>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl bg-navy-500 p-10 text-center">
          <div className="et-gold-bar mx-auto mb-5" />
          <h2 className="font-display text-2xl font-bold text-white mb-3">Find your table type and get started</h2>
          <p className="text-blue-100 text-sm mb-7 max-w-md mx-auto">
            $49.99/month, 10 seats included. You choose the type when you create your table.
          </p>
          <Link href="/sign-up" className="inline-flex items-center rounded-xl bg-gold-400 px-7 py-3.5 text-sm font-bold text-navy-500 hover:bg-gold-300 transition-colors">
            Start an Equity Table
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo variant="light-bg" size="xs" />
          <nav className="flex gap-5">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
