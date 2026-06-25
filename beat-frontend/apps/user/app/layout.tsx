import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'

import { Providers } from '@/providers/providers'
import { createDefaultMetadata } from '@/lib'

import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = createDefaultMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakarta.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
