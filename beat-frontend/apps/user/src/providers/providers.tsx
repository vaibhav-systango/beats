'use client'

import { QueryProvider, registerSessionExpiredHandler } from '@beat/api-client'
import type { ReactNode } from 'react'

import { OnboardingRedirect } from '@/components/auth/OnboardingRedirect'
import { ThemeProvider } from '@/providers/theme-provider'
import { useAuthStore } from '@/store/auth.store'

registerSessionExpiredHandler(() => {
  useAuthStore.getState().clearAuth()
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <OnboardingRedirect>{children}</OnboardingRedirect>
      </QueryProvider>
    </ThemeProvider>
  )
}
