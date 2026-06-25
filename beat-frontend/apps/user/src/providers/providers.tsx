'use client'

import { QueryProvider } from '@beat/api-client'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>
}
