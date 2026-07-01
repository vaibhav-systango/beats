'use client'

import { QueryProvider } from '@beat/api-client'
import type { ReactNode } from 'react'

import { OnboardingRedirect } from '@/components/auth/OnboardingRedirect'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <OnboardingRedirect>{children}</OnboardingRedirect>
    </QueryProvider>
  )
}
