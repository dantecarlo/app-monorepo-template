import '@/app/globals.css'

import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'

import { Providers } from '@/app/providers'

const montserrat = Montserrat({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800']
})

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500']
})

export const metadata: Metadata = {
  description:
    'A production-grade Next.js starter with fractal architecture, dark-glass design system, TanStack Query, and Zustand.',
  title: 'App'
}

interface IRootLayoutProps {
  children: React.ReactNode
}

const RootLayout = ({ children }: IRootLayoutProps) => {
  return (
    <html
      className={`dark ${montserrat.variable} ${inter.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body className="aurora min-h-screen bg-bg-base font-body text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export default RootLayout
