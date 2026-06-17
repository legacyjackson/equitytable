<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1e3a5f" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Equity Table" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  
  {/* Your other existing head content here */}
</head>

import type { Metadata, Viewport } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Equity Table — Build wealth with the people you trust.',
    template: '%s | Equity Table',
  },
  description:
    "Equity Table helps families, organizations, ministries, businesses, and communities learn financial literacy together, host events, track goals, and take action when they're ready.",
  keywords: ['financial literacy', 'community finance', 'wealth building', 'equity table', 'global pathways'],
  authors: [{ name: 'Equity Table' }],
  // Favicon = logo-light.png (white background logo mark)
  icons: {
    icon: '/logo-light.png',
    shortcut: '/logo-light.png',
    apple: '/logo-light.png',
  },
  openGraph: {
    title: 'Equity Table — Build wealth with the people you trust.',
    description: "Learn together. Build together. Move when you're ready.",
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equity Table',
    description: 'Build wealth with the people you trust.',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#0F1F4B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
