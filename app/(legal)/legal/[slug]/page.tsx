import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/brand/Logo'
import { formatDate } from '@/lib/utils/format'

interface LegalPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('legal_pages').select('title').eq('slug', slug).eq('published', true).maybeSingle()
  return { title: data?.title || 'Legal' }
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (!page) notFound()

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Nav — white background → light-bg logo */}
      <nav className="border-b border-border bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/"><Logo variant="light-bg" size="sm" /></Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">← Home</Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-500 mb-2">{page.title}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated {formatDate(page.updated_at, 'MMMM d, yyyy')}
          </p>
        </div>

        <div className="prose prose-navy max-w-none text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
          {page.content}
        </div>
      </article>

      {/* Footer — navy background → dark-bg logo */}
      <footer className="border-t border-border bg-navy-500 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <Logo variant="dark-bg" size="xs" />
          <nav className="flex items-center gap-4">
            {[
              ['Privacy', 'privacy'],
              ['Terms', 'terms'],
              ['Disclaimer', 'financial-education-disclaimer'],
            ].map(([label, s]) => (
              <Link key={s} href={`/legal/${s}`} className="text-xs text-blue-200/70 hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
