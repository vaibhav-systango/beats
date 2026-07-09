'use client'

import { QueryProvider, registerSessionExpiredHandler } from '@beat/api-client'
import type { ReactNode } from 'react'

import { OnboardingRedirect } from '@/components/auth/OnboardingRedirect'
import { useAuthStore } from '@/store/auth.store'

registerSessionExpiredHandler(() => {
  useAuthStore.getState().clearAuth()
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <OnboardingRedirect>{children}</OnboardingRedirect>
    </QueryProvider>
  )
}
