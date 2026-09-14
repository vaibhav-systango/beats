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

const themeInitScript = `(function(){try{var t=localStorage.getItem('beats-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${plusJakarta.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
