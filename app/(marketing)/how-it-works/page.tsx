import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How Equity Table Works',
  description: 'Learn how Equity Tables bring communities together to build financial literacy, host events, track shared goals, and connect to Global Pathways.',
}

const PHASES = [
  {
    number: '01',
    title: 'Create your Equity Table',
    description: 'Choose your table type, write your mission, and set up your team. You get to invite who you want to have a seat at your table.',
    details: [
      'Choose from 15 table types — CBO, faith-based, family, business, reentry, investor clubs, and more',
      'Write your mission: why does your table exist, and what are you building together?',
      'Set visibility: public tables show up in our directory; private tables stay between members',
      'Your unique affiliate link is generated automatically when your table is created',
    ],
    icon: '🪑',
  },
  {
    number: '02',
    title: 'Invite your people',
    description: 'Invite members by email. $49.99/month includes 10 seats. Add more at $4.99/seat.',
    details: [
      'Invite by email — members get a link to join your table directly',
      'Assign roles: Admin, Facilitator, or Member',
      'Seat usage is tracked in real time — you\'ll always know where you stand',
      'Members can join multiple tables, each with their own role and access',
    ],
    icon: '👥',
  },
  {
    number: '03',
    title: 'Learn together',
    description: '100+ financial literacy courses with read-along audio. Your table type shapes which courses are recommended.',
    details: [
      'Course library covers budgeting, credit, debt, investing, retirement, homeownership, and more',
      'Every lesson has a read-along audio player — press play and follow along with the text',
      'Progress is tracked per member and per table',
      'Religious and culturally-specific content is available for faith-based and specialized table types',
    ],
    icon: '📚',
  },
  {
    number: '04',
    title: 'Host Equity Events',
    description: 'Create classes, workshops, meetups, or webinars. Record them and keep the recordings on your table page.',
    details: [
      'Create events with titles, dates, locations, and RSVP options',
      'Attach a course or lesson to give members context before the event',
      'Record directly in the browser — select your camera and mic, hit record',
      'Recordings go straight to your table\'s recording library',
    ],
    icon: '🎤',
  },
  {
    number: '05',
    title: 'Track shared goals',
    description: 'Create collective goals — save a family emergency fund, raise community capital, complete 100 lessons as a group.',
    details: [
      'Set goals with target values, milestones, and deadlines',
      'Post progress updates with evidence links',
      'Members can contribute pledges or manual updates',
      'Featured goals show on your public table profile',
    ],
    icon: '🎯',
  },
  {
    number: '06',
    title: 'Act when ready',
    description: 'When members are ready to go further, your table\'s affiliate link connects them to Global Pathways — and your table earns a referral reward.',
    details: [
      'Every lesson ends with a warm, non-pushy Global Pathways CTA using your table\'s affiliate link',
      'When a member signs up for Global Pathways through your link, your table earns $179.99 (first month\'s fee)',
      'Track clicks, conversions, and earnings in your affiliate dashboard',
      'Choose whether to display affiliate earnings publicly on your table page',
    ],
    icon: '🚀',
  },
]

export default function HowItWorksPage() {
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
      <div className="bg-navy-500 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="et-gold-bar mx-auto mb-5" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            How Equity Table works
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-xl mx-auto">
            A financial literacy platform built around communities, not individuals.
            Here's how it comes together.
          </p>
        </div>
      </div>

      {/* Phases */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 md:py-24 space-y-16">
        {PHASES.map((phase, i) => (
          <div key={phase.number} className={`grid md:grid-cols-2 gap-10 items-start ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-display text-5xl font-bold text-navy-100 select-none">{phase.number}</span>
                <span className="text-3xl">{phase.icon}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-navy-500 mb-3">{phase.title}</h2>
              <p className="text-muted-foreground leading-relaxed mb-5">{phase.description}</p>
              <ul className="space-y-2">
                {phase.details.map((d, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="text-blue-600 font-bold shrink-0 mt-0.5">✓</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-2xl bg-gradient-to-br p-8 flex items-center justify-center min-h-[200px] ${
              i % 2 === 0
                ? 'from-navy-500 to-blue-700'
                : 'from-blue-700 to-navy-500'
            }`}>
              <div className="text-center text-white">
                <div className="text-6xl mb-3">{phase.icon}</div>
                <div className="font-display text-lg font-semibold opacity-90">{phase.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-navy-500 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="et-gold-bar mx-auto mb-5" />
          <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to start?</h2>
          <p className="text-blue-100 mb-8">$49.99/month includes 10 seats and everything you need to launch.</p>
          <Link href="/sign-up" className="inline-flex items-center rounded-xl bg-gold-400 px-8 py-4 text-base font-bold text-navy-500 hover:bg-gold-300 transition-colors shadow-lg">
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
            <Link href="/table-types" className="hover:text-foreground transition-colors">Table types</Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
