import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'

export const metadata = {
  title: 'Pricing — Equity Table',
  description: '$49.99/month includes 10 seats. Add more for $4.99/seat.',
}

const FEATURES = [
  '100+ financial literacy courses with read-along audio',
  'Host unlimited Equity Events',
  'Record and share events with your table',
  'Shared goal tracking with progress updates',
  'Message board and community features',
  'Your unique Global Pathways affiliate link',
  'Member badges and leaderboards',
  'Public or private table profile page',
  'Admin dashboard and member management',
  '15 Equity Table types to choose from',
  'Religious content filters (Christian, Muslim, Jewish)',
  'Role-based access: Owner, Admin, Facilitator, Member',
]

const FAQS = [
  {
    q: 'What does "10 included seats" mean?',
    a: 'Your base subscription includes up to 10 active members. Once your table has more than 10 active members, each additional seat is $4.99/month. We update your Stripe billing automatically as members join or leave.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your billing settings and your table stays active through the end of the billing period. No cancellation fees.',
  },
  {
    q: 'What is the Global Pathways affiliate reward?',
    a: 'When a member of your Equity Table starts Global Pathways through your table\'s unique referral link, your table receives the first month\'s fee ($179.99) as an affiliate reward. Your table decides whether to keep this private or share it publicly on your table profile.',
  },
  {
    q: 'Can I have multiple Equity Tables?',
    a: 'Yes. Each Equity Table is a separate subscription. A user can be a member of multiple tables under the same account.',
  },
  {
    q: 'Who creates the content?',
    a: 'Equity Table provides a growing library of 100+ financial literacy courses. Your table can also upload recordings from your own events, and table admins can add resources and materials.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We don\'t currently offer a free trial, but you can explore public Equity Table profiles and the marketing site before creating an account.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Nav — white bg, use light-bg logo */}
      <nav className="border-b border-border/50 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="light-bg" size="sm" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link href="/sign-up" className="rounded-lg bg-navy-500 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-600 transition-colors">
              Start an Equity Table
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 mb-5">
            <span className="text-gold-600 text-xs font-bold uppercase tracking-widest">Simple pricing</span>
          </div>
          <h1 className="font-display text-5xl font-bold text-navy-500 mb-4 tracking-tight">
            One plan. Build as you grow.
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything your table needs to learn, meet, track goals, and take action together.
          </p>
        </div>

        {/* Pricing card */}
        <div className="max-w-lg mx-auto mb-16">
          <div className="et-card p-8 md:p-10">
            <div className="flex items-end gap-2 mb-1">
              <span className="font-display text-6xl font-bold text-navy-500">$49.99</span>
              <span className="text-muted-foreground pb-2 text-lg">/month</span>
            </div>
            <p className="text-muted-foreground mb-2">Includes your first 10 seats</p>
            <div className="et-gold-bar mb-6" />

            <ul className="space-y-3 mb-8">
              {FEATURES.map(f => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <span className="text-blue-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="rounded-xl bg-muted/50 px-5 py-4 mb-7">
              <p className="text-sm font-semibold text-navy-500 mb-0.5">Need more members?</p>
              <p className="text-sm text-muted-foreground">
                Add seats for <span className="font-semibold text-navy-500">$4.99/month each</span>.
                Your billing updates automatically as members join.
              </p>
            </div>

            <Link
              href="/sign-up"
              className="block text-center rounded-xl bg-gold-400 py-4 text-base font-bold text-navy-500 hover:bg-gold-300 transition-colors shadow-sm"
            >
              Start an Equity Table
            </Link>
            <p className="text-center text-xs text-muted-foreground mt-3">No contracts. Cancel anytime.</p>
          </div>
        </div>

        {/* Affiliate box */}
        <div className="rounded-2xl bg-navy-500 p-8 md:p-10 text-center mb-16">
          <div className="et-gold-bar mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Plus: a referral reward for every member who starts their Pathway
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-2 leading-relaxed">
            Every Equity Table gets a unique affiliate link. When a member starts Global Pathways
            through that link, your table earns the first month's fee — $179.99 — as a referral reward.
          </p>
          <p className="text-gold-400 font-semibold text-sm">
            $179.99 per referred member · First month's fee · No cap
          </p>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="font-display text-3xl font-bold text-navy-500 mb-8 text-center">Frequently asked</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {FAQS.map(faq => (
              <div key={faq.q} className="et-card p-6">
                <h3 className="font-semibold text-navy-500 mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer — navy bg, use dark-bg logo */}
      <footer className="border-t border-border bg-navy-500 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo variant="dark-bg" size="xs" />
          <div className="flex items-center gap-5 text-xs text-blue-200/60">
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-white">Terms</Link>
            <Link href="/legal/affiliate-disclosure" className="hover:text-white">Affiliate disclosure</Link>
            <Link href="/legal/financial-education-disclaimer" className="hover:text-white">Financial disclaimer</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
